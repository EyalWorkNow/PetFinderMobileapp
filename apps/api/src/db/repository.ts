import type { CreatePostInput, QueryPostsFilters } from "../services/post-service";
import type {
  ContactMessageRecord,
  EmbeddingRecord,
  MatchBundle,
  MatchRecord,
  PostBundle,
  PostRecord,
  PushTokenRecord,
  ReportRecord,
  SightingRecord,
  UserRecord
} from "./models";

export interface Repository {
  upsertUser(input: { id: string; email?: string | null; phone?: string | null }): Promise<UserRecord>;
  createPost(input: CreatePostInput): Promise<PostBundle>;
  getPostById(postId: string): Promise<PostBundle | null>;
  listPosts(filters: QueryPostsFilters): Promise<PostBundle[]>;
  listCandidatePosts(post: PostRecord): Promise<PostBundle[]>;
  listUserPosts(userId: string): Promise<PostBundle[]>;
  upsertEmbedding(input: {
    postId: string;
    embedding: number[];
    embeddingProvider: string;
    caption?: string | null;
  }): Promise<EmbeddingRecord>;
  addSighting(input: {
    postId: string;
    lat: number;
    lng: number;
    label?: string | null;
    seenAt: Date;
    note?: string | null;
  }): Promise<SightingRecord>;
  createOrUpdateMatch(input: { postA: string; postB: string; score: number }): Promise<MatchRecord>;
  listMatchesForUser(userId: string): Promise<MatchBundle[]>;
  markMatchNotified(matchId: string): Promise<void>;
  createContactMessage(input: {
    postId: string;
    fromUserId: string;
    message: string;
  }): Promise<ContactMessageRecord>;
  createReport(input: {
    postId: string;
    reporterUserId: string;
    reason: string;
  }): Promise<ReportRecord>;
  resolvePost(postId: string, userId: string): Promise<PostRecord | null>;
  deletePost(postId: string, userId: string): Promise<boolean>;
  registerPushToken(input: PushTokenRecord): Promise<void>;
  listPushTokens(userId: string): Promise<PushTokenRecord[]>;
  recordPushDelivery(input: { userId: string; matchId: string }): Promise<void>;
  countPushDeliveriesInLast24h(userId: string): Promise<number>;
  checkHealth(): Promise<boolean>;
  close(): Promise<void>;
}
