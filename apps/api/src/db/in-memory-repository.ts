import { randomUUID } from "node:crypto";
import type { PostType } from "@petfind/shared";
import type { CreatePostInput, QueryPostsFilters } from "../services/post-service";
import type {
  ContactMessageRecord,
  DonationRecord,
  DonationStatus,
  EmbeddingRecord,
  MatchBundle,
  MatchRecord,
  PostBundle,
  PostRecord,
  PushDeliveryRecord,
  PushTokenRecord,
  ReportRecord,
  SightingRecord,
  UserRecord,
  UserRole,
  PhotoRecord
} from "./models";
import type { Repository } from "./repository";

interface InMemoryState {
  users: UserRecord[];
  posts: PostRecord[];
  photos: PhotoRecord[];
  sightings: SightingRecord[];
  embeddings: EmbeddingRecord[];
  matches: MatchRecord[];
  contactMessages: ContactMessageRecord[];
  reports: ReportRecord[];
  pushTokens: PushTokenRecord[];
  pushDeliveries: PushDeliveryRecord[];
}

function buildBundle(state: InMemoryState, post: PostRecord): PostBundle {
  return {
    post,
    photos: state.photos.filter((photo) => photo.postId === post.id),
    sightings: state.sightings.filter((sighting) => sighting.postId === post.id),
    embedding: state.embeddings.find((embedding) => embedding.postId === post.id) ?? null
  };
}

function normalizePair(a: string, b: string): { postA: string; postB: string } {
  return a < b ? { postA: a, postB: b } : { postA: b, postB: a };
}

export class InMemoryRepository implements Repository {
  private readonly state: InMemoryState;

  constructor(seed?: Partial<InMemoryState>) {
    this.state = {
      users: seed?.users ?? [],
      posts: seed?.posts ?? [],
      photos: seed?.photos ?? [],
      sightings: seed?.sightings ?? [],
      embeddings: seed?.embeddings ?? [],
      matches: seed?.matches ?? [],
      contactMessages: seed?.contactMessages ?? [],
      reports: seed?.reports ?? [],
      pushTokens: seed?.pushTokens ?? [],
      pushDeliveries: seed?.pushDeliveries ?? []
    };
  }

  async upsertUser(input: {
    id: string;
    email?: string | null;
    phone?: string | null;
    role?: UserRole;
    passwordHash?: string | null;
    totalDonated?: number;
  }): Promise<UserRecord> {
    const existing = this.state.users.find((user) => user.id === input.id);
    if (existing) {
      existing.email = input.email !== undefined ? input.email : existing.email;
      existing.phone = input.phone !== undefined ? input.phone : existing.phone;
      existing.role = input.role !== undefined ? input.role : existing.role;
      existing.passwordHash = input.passwordHash !== undefined ? input.passwordHash : existing.passwordHash;
      existing.totalDonated = input.totalDonated !== undefined ? input.totalDonated : existing.totalDonated;
      return existing;
    }

    const created: UserRecord = {
      id: input.id,
      email: input.email ?? null,
      phone: input.phone ?? null,
      role: input.role ?? "USER",
      passwordHash: input.passwordHash ?? null,
      totalDonated: input.totalDonated ?? 0,
      createdAt: new Date()
    };
    this.state.users.push(created);
    return created;
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    return this.state.users.find((u) => u.email === email) ?? null;
  }

  async getUserById(id: string): Promise<UserRecord | null> {
    return this.state.users.find((u) => u.id === id) ?? null;
  }

  async listAllUsers(): Promise<UserRecord[]> {
    return [...this.state.users];
  }

  async createDonation(input: {
    userId: string;
    amount: number;
    currency: string;
    status: DonationStatus;
  }): Promise<DonationRecord> {
    const donation: DonationRecord = {
      id: randomUUID(),
      userId: input.userId,
      amount: input.amount,
      currency: input.currency,
      status: input.status,
      createdAt: new Date()
    };
    if (input.status === "COMPLETED") {
      const user = this.state.users.find(u => u.id === input.userId);
      if (user) {
        user.totalDonated += input.amount;
      }
    }
    return donation;
  }

  async createPost(input: CreatePostInput): Promise<PostBundle> {
    const now = new Date();
    const post: PostRecord = {
      id: randomUUID(),
      userId: input.userId,
      type: input.type,
      petType: input.petType,
      status: input.status,
      title: input.title,
      shortDesc: input.shortDesc ?? null,
      size: input.size,
      colors: input.colors,
      collar: input.collar,
      collarColor: input.collarColor ?? null,
      breed: input.breed ?? null,
      marksText: input.marksText ?? null,
      lastSeenLat: input.lastSeen.lat,
      lastSeenLng: input.lastSeen.lng,
      lastSeenLabel: input.lastSeen.label ?? null,
      lastSeenTime: input.lastSeenTime,
      radiusKm: input.radiusKm,
      contactMethod: input.contactMethod,
      contactPhone: input.contactPhone ?? null,
      hidePhone: input.hidePhone,
      revealPhoneOnContact: input.revealPhoneOnContact,
      showApproximateLocation: input.showApproximateLocation,
      createdAt: now,
      updatedAt: now
    };

    this.state.posts.push(post);

    input.photos.forEach((photo) => {
      this.state.photos.push({
        id: randomUUID(),
        postId: post.id,
        storagePath: photo.storagePath,
        takenAt: photo.takenAt ?? null,
        createdAt: now
      });
    });

    (input.sightings ?? []).forEach((sighting) => {
      this.state.sightings.push({
        id: randomUUID(),
        postId: post.id,
        lat: sighting.lat,
        lng: sighting.lng,
        label: sighting.label ?? null,
        seenAt: sighting.seenAt,
        note: sighting.note ?? null,
        createdAt: now
      });
    });

    return buildBundle(this.state, post);
  }

  async getPostById(postId: string): Promise<PostBundle | null> {
    const post = this.state.posts.find((entry) => entry.id === postId);
    if (!post) {
      return null;
    }
    return buildBundle(this.state, post);
  }

  async listPosts(filters: QueryPostsFilters): Promise<PostBundle[]> {
    let posts = [...this.state.posts];

    if (filters.type) {
      posts = posts.filter((post) => post.type === filters.type);
    }

    if (filters.petType) {
      posts = posts.filter((post) => post.petType === filters.petType);
    }

    if (filters.sinceDays) {
      const threshold = Date.now() - filters.sinceDays * 24 * 60 * 60 * 1000;
      posts = posts.filter((post) => post.createdAt.getTime() >= threshold);
    }

    return posts
      .filter((post) => post.status === "ACTIVE")
      .map((post) => buildBundle(this.state, post));
  }

  async listCandidatePosts(post: PostRecord): Promise<PostBundle[]> {
    const oppositeType: PostType = post.type === "LOST" ? "FOUND" : "LOST";
    return this.state.posts
      .filter(
        (candidate) =>
          candidate.id !== post.id &&
          candidate.type === oppositeType &&
          candidate.petType === post.petType &&
          candidate.status === "ACTIVE"
      )
      .map((candidate) => buildBundle(this.state, candidate));
  }

  async listUserPosts(userId: string): Promise<PostBundle[]> {
    return this.state.posts
      .filter((post) => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((post) => buildBundle(this.state, post));
  }

  async upsertEmbedding(input: {
    postId: string;
    embedding: number[];
    embeddingProvider: string;
    caption?: string | null;
  }): Promise<EmbeddingRecord> {
    const existing = this.state.embeddings.find((entry) => entry.postId === input.postId);
    const record: EmbeddingRecord = {
      postId: input.postId,
      embedding: input.embedding,
      embeddingProvider: input.embeddingProvider,
      caption: input.caption ?? null,
      createdAt: new Date()
    };

    if (existing) {
      existing.embedding = record.embedding;
      existing.embeddingProvider = record.embeddingProvider;
      existing.caption = record.caption;
      existing.createdAt = record.createdAt;
      return existing;
    }

    this.state.embeddings.push(record);
    return record;
  }

  async addSighting(input: {
    postId: string;
    lat: number;
    lng: number;
    label?: string | null;
    seenAt: Date;
    note?: string | null;
  }): Promise<SightingRecord> {
    const created: SightingRecord = {
      id: randomUUID(),
      postId: input.postId,
      lat: input.lat,
      lng: input.lng,
      label: input.label ?? null,
      seenAt: input.seenAt,
      note: input.note ?? null,
      createdAt: new Date()
    };
    this.state.sightings.push(created);
    return created;
  }

  async createOrUpdateMatch(input: { postA: string; postB: string; score: number }): Promise<MatchRecord> {
    const pair = normalizePair(input.postA, input.postB);
    const existing = this.state.matches.find(
      (match) => match.postA === pair.postA && match.postB === pair.postB
    );

    if (existing) {
      if (input.score > existing.score) {
        existing.score = input.score;
        existing.createdAt = new Date();
      }
      return existing;
    }

    const created: MatchRecord = {
      id: randomUUID(),
      postA: pair.postA,
      postB: pair.postB,
      score: input.score,
      createdAt: new Date(),
      notified: false
    };

    this.state.matches.push(created);
    return created;
  }

  async listMatchesForUser(userId: string): Promise<MatchBundle[]> {
    const userPostIds = new Set(this.state.posts.filter((post) => post.userId === userId).map((post) => post.id));

    return this.state.matches
      .filter((match) => userPostIds.has(match.postA) || userPostIds.has(match.postB))
      .sort((a, b) => b.score - a.score)
      .flatMap((match) => {
        const postA = this.state.posts.find((post) => post.id === match.postA);
        const postB = this.state.posts.find((post) => post.id === match.postB);
        if (!postA || !postB) {
          return [];
        }
        return [
          {
            match,
            postA: buildBundle(this.state, postA),
            postB: buildBundle(this.state, postB)
          }
        ];
      });
  }

  async markMatchNotified(matchId: string): Promise<void> {
    const match = this.state.matches.find((entry) => entry.id === matchId);
    if (match) {
      match.notified = true;
    }
  }

  async createContactMessage(input: {
    postId: string;
    fromUserId: string;
    message: string;
  }): Promise<ContactMessageRecord> {
    const created: ContactMessageRecord = {
      id: randomUUID(),
      postId: input.postId,
      fromUserId: input.fromUserId,
      message: input.message,
      createdAt: new Date()
    };
    this.state.contactMessages.push(created);
    return created;
  }

  async createReport(input: {
    postId: string;
    reporterUserId: string;
    reason: string;
  }): Promise<ReportRecord> {
    const created: ReportRecord = {
      id: randomUUID(),
      postId: input.postId,
      reporterUserId: input.reporterUserId,
      reason: input.reason,
      createdAt: new Date()
    };
    this.state.reports.push(created);
    return created;
  }

  async resolvePost(postId: string, userId: string): Promise<PostRecord | null> {
    const post = this.state.posts.find((entry) => entry.id === postId && entry.userId === userId);
    if (!post) {
      return null;
    }
    post.status = "RESOLVED";
    post.updatedAt = new Date();
    return post;
  }

  async deletePost(postId: string, userId: string): Promise<boolean> {
    const initialLength = this.state.posts.length;
    this.state.posts = this.state.posts.filter((entry) => !(entry.id === postId && entry.userId === userId));
    return this.state.posts.length < initialLength;
  }

  async registerPushToken(input: PushTokenRecord): Promise<void> {
    const existing = this.state.pushTokens.find(
      (entry) => entry.userId === input.userId && entry.expoToken === input.expoToken
    );

    if (existing) {
      existing.updatedAt = input.updatedAt;
      return;
    }

    this.state.pushTokens.push(input);
  }

  async listPushTokens(userId: string): Promise<PushTokenRecord[]> {
    return this.state.pushTokens.filter((entry) => entry.userId === userId);
  }

  async recordPushDelivery(input: { userId: string; matchId: string }): Promise<void> {
    this.state.pushDeliveries.push({
      id: randomUUID(),
      userId: input.userId,
      matchId: input.matchId,
      createdAt: new Date()
    });
  }

  async countPushDeliveriesInLast24h(userId: string): Promise<number> {
    const threshold = Date.now() - 24 * 60 * 60 * 1000;
    return this.state.pushDeliveries.filter(
      (entry) => entry.userId === userId && entry.createdAt.getTime() >= threshold
    ).length;
  }

  async checkHealth(): Promise<boolean> {
    return true;
  }

  async close(): Promise<void> { }
}
