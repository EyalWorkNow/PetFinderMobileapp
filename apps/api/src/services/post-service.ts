import {
  contactSchema,
  createPostSchema,
  queryPostsSchema,
  reportSchema,
  scoreMatch,
  sightingInputSchema,
  pushTokenSchema,
  type PetType,
  type PostType,
  type PostStatus
} from "@petfind/shared";
import { z } from "zod";
import type { EmbeddingProvider } from "../embeddings/types";
import type { PushNotificationService } from "../notifications/push-service";
import type { SlidingWindowRateLimiter } from "../rate-limiter";
import type { PostBundle, PostRecord } from "../db/models";
import type { Repository } from "../db/repository";

export type CreatePostInput = z.infer<typeof createPostSchema> & { userId: string };
export type QueryPostsFilters = z.infer<typeof queryPostsSchema>;

function toAttributes(post: PostRecord) {
  return {
    size: post.size,
    colors: post.colors,
    collar: post.collar,
    collarColor: post.collarColor,
    breed: post.breed,
    marksText: post.marksText
  };
}

function roundLocation(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function toPostResponse(bundle: PostBundle, viewerUserId?: string) {
  const hideExact = bundle.post.showApproximateLocation && viewerUserId !== bundle.post.userId;
  const lat = hideExact ? roundLocation(bundle.post.lastSeenLat) : bundle.post.lastSeenLat;
  const lng = hideExact ? roundLocation(bundle.post.lastSeenLng) : bundle.post.lastSeenLng;

  return {
    id: bundle.post.id,
    userId: bundle.post.userId,
    type: bundle.post.type,
    petType: bundle.post.petType,
    status: bundle.post.status,
    title: bundle.post.title,
    shortDesc: bundle.post.shortDesc,
    size: bundle.post.size,
    colors: bundle.post.colors,
    collar: bundle.post.collar,
    collarColor: bundle.post.collarColor,
    breed: bundle.post.breed,
    marksText: bundle.post.marksText,
    lastSeen: {
      lat,
      lng,
      label: bundle.post.lastSeenLabel,
      isApproximate: hideExact
    },
    lastSeenTime: bundle.post.lastSeenTime.toISOString(),
    radiusKm: bundle.post.radiusKm,
    contactMethod: bundle.post.contactMethod,
    contactPhoneVisible: !bundle.post.hidePhone || viewerUserId === bundle.post.userId,
    contactPhone: !bundle.post.hidePhone || viewerUserId === bundle.post.userId ? bundle.post.contactPhone : null,
    revealPhoneOnContact: bundle.post.revealPhoneOnContact,
    photos: bundle.photos.map((photo) => ({
      id: photo.id,
      storagePath: photo.storagePath,
      takenAt: photo.takenAt?.toISOString() ?? null
    })),
    sightings: bundle.sightings.map((sighting) => ({
      id: sighting.id,
      lat: sighting.lat,
      lng: sighting.lng,
      label: sighting.label,
      seenAt: sighting.seenAt.toISOString(),
      note: sighting.note
    })),
    createdAt: bundle.post.createdAt.toISOString(),
    updatedAt: bundle.post.updatedAt.toISOString()
  };
}

export class PostService {
  constructor(
    private readonly repository: Repository,
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly pushService: PushNotificationService,
    private readonly postRateLimiter: SlidingWindowRateLimiter,
    private readonly contactRateLimiter: SlidingWindowRateLimiter
  ) {}

  validateCreatePost(input: unknown): z.infer<typeof createPostSchema> {
    return createPostSchema.parse(input);
  }

  validateQueryPosts(input: unknown): QueryPostsFilters {
    return queryPostsSchema.parse(input);
  }

  validateSighting(input: unknown): z.infer<typeof sightingInputSchema> {
    return sightingInputSchema.parse(input);
  }

  validateContact(input: unknown): z.infer<typeof contactSchema> {
    return contactSchema.parse(input);
  }

  validateReport(input: unknown): z.infer<typeof reportSchema> {
    return reportSchema.parse(input);
  }

  validatePushToken(input: unknown): z.infer<typeof pushTokenSchema> {
    return pushTokenSchema.parse(input);
  }

  async createPost(userId: string, payload: unknown) {
    const parsed = this.validateCreatePost(payload);
    const rateLimitKey = `create-post:${userId}`;
    if (!this.postRateLimiter.allow(rateLimitKey)) {
      throw new Error("POST_RATE_LIMITED");
    }

    const created = await this.repository.createPost({ ...parsed, userId });
    const embedding = await this.embeddingProvider.embed({
      type: created.post.type,
      petType: created.post.petType,
      title: created.post.title,
      shortDesc: created.post.shortDesc,
      colors: created.post.colors,
      breed: created.post.breed,
      marksText: created.post.marksText,
      collar: created.post.collar,
      collarColor: created.post.collarColor,
      photoPaths: created.photos.map((photo) => photo.storagePath)
    });

    await this.repository.upsertEmbedding({
      postId: created.post.id,
      embedding: embedding.embedding,
      embeddingProvider: embedding.provider,
      caption: embedding.caption
    });

    const refreshed = await this.repository.getPostById(created.post.id);
    if (!refreshed) {
      throw new Error("POST_NOT_FOUND_AFTER_CREATE");
    }

    await this.generateMatches(refreshed);
    return toPostResponse(refreshed, userId);
  }

  private async generateMatches(postBundle: PostBundle) {
    const postEmbedding = postBundle.embedding;
    if (!postEmbedding) {
      return;
    }

    const candidates = await this.repository.listCandidatePosts(postBundle.post);
    for (const candidate of candidates) {
      if (!candidate.embedding) {
        continue;
      }

      const scored = scoreMatch({
        vectorA: postEmbedding.embedding,
        vectorB: candidate.embedding.embedding,
        attributesA: toAttributes(postBundle.post),
        attributesB: toAttributes(candidate.post),
        locationA: { lat: postBundle.post.lastSeenLat, lng: postBundle.post.lastSeenLng },
        locationB: { lat: candidate.post.lastSeenLat, lng: candidate.post.lastSeenLng },
        seenAtA: postBundle.post.lastSeenTime,
        seenAtB: candidate.post.lastSeenTime,
        radiusKmA: postBundle.post.radiusKm,
        radiusKmB: candidate.post.radiusKm
      });

      if (scored.total < 0.75) {
        continue;
      }

      const match = await this.repository.createOrUpdateMatch({
        postA: postBundle.post.id,
        postB: candidate.post.id,
        score: scored.total
      });

      if (scored.total < 0.85) {
        continue;
      }

      const targetUsers = new Set([postBundle.post.userId, candidate.post.userId]);
      let delivered = false;
      for (const userId of targetUsers) {
        const counterpartPostId = userId === postBundle.post.userId ? candidate.post.id : postBundle.post.id;
        const sent = await this.pushService.notifyHighMatch({
          userId,
          matchId: match.id,
          score: scored.total,
          counterpartPostId
        });
        delivered = delivered || sent;
      }

      if (delivered) {
        await this.repository.markMatchNotified(match.id);
      }
    }
  }

  async listPosts(filters: unknown, viewerUserId?: string) {
    const parsed = this.validateQueryPosts(filters);
    const posts = await this.repository.listPosts(parsed);
    return posts.map((bundle) => toPostResponse(bundle, viewerUserId));
  }

  async getPost(postId: string, viewerUserId?: string) {
    const post = await this.repository.getPostById(postId);
    if (!post) {
      return null;
    }
    return toPostResponse(post, viewerUserId);
  }

  async addSighting(userId: string, postId: string, payload: unknown) {
    const parsed = this.validateSighting(payload);
    await this.repository.upsertUser({ id: userId });

    const post = await this.repository.getPostById(postId);
    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    const sighting = await this.repository.addSighting({
      postId,
      lat: parsed.lat,
      lng: parsed.lng,
      label: parsed.label,
      seenAt: parsed.seenAt,
      note: parsed.note
    });

    return {
      id: sighting.id,
      postId: sighting.postId,
      lat: sighting.lat,
      lng: sighting.lng,
      label: sighting.label,
      seenAt: sighting.seenAt.toISOString(),
      note: sighting.note
    };
  }

  async contactPost(userId: string, postId: string, payload: unknown) {
    const parsed = this.validateContact(payload);

    const rateLimitKey = `contact:${userId}:${postId}`;
    if (!this.contactRateLimiter.allow(rateLimitKey)) {
      throw new Error("CONTACT_RATE_LIMITED");
    }

    const post = await this.repository.getPostById(postId);
    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    await this.repository.createContactMessage({
      postId,
      fromUserId: userId,
      message: parsed.message
    });

    const revealedPhone = post.post.revealPhoneOnContact ? post.post.contactPhone : null;

    return {
      ok: true,
      revealedPhone
    };
  }

  async reportPost(userId: string, postId: string, payload: unknown) {
    const parsed = this.validateReport(payload);

    await this.repository.createReport({
      postId,
      reporterUserId: userId,
      reason: parsed.reason
    });

    return { ok: true };
  }

  async resolvePost(userId: string, postId: string) {
    const post = await this.repository.resolvePost(postId, userId);
    if (!post) {
      throw new Error("POST_NOT_FOUND_OR_FORBIDDEN");
    }
    return {
      id: post.id,
      status: post.status as PostStatus
    };
  }

  async listMatches(userId: string) {
    const matches = await this.repository.listMatchesForUser(userId);
    return matches.map((entry) => ({
      id: entry.match.id,
      score: entry.match.score,
      band: entry.match.score >= 0.85 ? "HIGH" : "POSSIBLE",
      notified: entry.match.notified,
      createdAt: entry.match.createdAt.toISOString(),
      postA: toPostResponse(entry.postA, userId),
      postB: toPostResponse(entry.postB, userId)
    }));
  }

  async registerPushToken(userId: string, payload: unknown) {
    const parsed = this.validatePushToken(payload);
    await this.repository.registerPushToken({
      userId,
      expoToken: parsed.expoToken,
      updatedAt: new Date()
    });
    return { ok: true };
  }

  async listMyPosts(userId: string) {
    const posts = await this.repository.listUserPosts(userId);
    return posts.map((bundle) => toPostResponse(bundle, userId));
  }
}

export type FilterType = PostType;
export type FilterPetType = PetType;
