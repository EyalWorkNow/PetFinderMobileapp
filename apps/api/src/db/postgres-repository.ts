import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import type { PostType } from "@petfind/shared";
import type { CreatePostInput, QueryPostsFilters } from "../services/post-service";
import type {
  ContactMessageRecord,
  EmbeddingRecord,
  MatchBundle,
  MatchRecord,
  PhotoRecord,
  PostBundle,
  PostRecord,
  PushTokenRecord,
  ReportRecord,
  SightingRecord,
  UserRecord
} from "./models";
import type { Repository } from "./repository";

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function parseVector(value: string | number[]): number[] {
  if (Array.isArray(value)) {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return [];
  }
  return trimmed
    .slice(1, -1)
    .split(",")
    .filter(Boolean)
    .map((item) => Number(item));
}

function toPostRecord(row: any): PostRecord {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    petType: row.pet_type,
    status: row.status,
    title: row.title,
    shortDesc: row.short_desc,
    size: row.size,
    colors: row.colors ?? [],
    collar: row.collar,
    collarColor: row.collar_color,
    breed: row.breed,
    marksText: row.marks_text,
    lastSeenLat: Number(row.last_seen_lat),
    lastSeenLng: Number(row.last_seen_lng),
    lastSeenLabel: row.last_seen_label,
    lastSeenTime: toDate(row.last_seen_time),
    radiusKm: Number(row.radius_km),
    contactMethod: row.contact_method,
    contactPhone: row.contact_phone,
    hidePhone: row.hide_phone,
    revealPhoneOnContact: row.reveal_phone_on_contact,
    showApproximateLocation: row.show_approximate_location,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at)
  };
}

function toPhotoRecord(row: any): PhotoRecord {
  return {
    id: row.id,
    postId: row.post_id,
    storagePath: row.storage_path,
    takenAt: row.taken_at ? toDate(row.taken_at) : null,
    createdAt: toDate(row.created_at)
  };
}

function toSightingRecord(row: any): SightingRecord {
  return {
    id: row.id,
    postId: row.post_id,
    lat: Number(row.lat),
    lng: Number(row.lng),
    label: row.label,
    seenAt: toDate(row.seen_at),
    note: row.note,
    createdAt: toDate(row.created_at)
  };
}

function toEmbeddingRecord(row: any): EmbeddingRecord {
  return {
    postId: row.post_id,
    embedding: parseVector(row.embedding),
    embeddingProvider: row.embedding_provider,
    caption: row.caption,
    createdAt: toDate(row.created_at)
  };
}

export class PostgresRepository implements Repository {
  constructor(private readonly pool: Pool) { }

  static fromConnectionString(connectionString: string): PostgresRepository {
    return new PostgresRepository(new Pool({ connectionString }));
  }

  async upsertUser(input: { id: string; email?: string | null; phone?: string | null }): Promise<UserRecord> {
    const result = await this.pool.query(
      `insert into users (id, email, phone)
       values ($1, $2, $3)
       on conflict (id) do update
       set email = coalesce(excluded.email, users.email),
           phone = coalesce(excluded.phone, users.phone)
       returning id, email, phone, created_at`,
      [input.id, input.email ?? null, input.phone ?? null]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      phone: row.phone,
      createdAt: toDate(row.created_at)
    };
  }

  async createPost(input: CreatePostInput): Promise<PostBundle> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const now = new Date();
      const postId = randomUUID();

      await client.query(
        `insert into posts (
          id, user_id, type, pet_type, status, title, short_desc,
          size, colors, collar, collar_color, breed, marks_text,
          last_seen_lat, last_seen_lng, last_seen_label, last_seen_time,
          radius_km, contact_method, contact_phone, hide_phone,
          reveal_phone_on_contact, show_approximate_location, created_at, updated_at
        ) values (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17,
          $18, $19, $20, $21,
          $22, $23, $24, $25
        )`,
        [
          postId,
          input.userId,
          input.type,
          input.petType,
          input.status,
          input.title,
          input.shortDesc ?? null,
          input.size,
          input.colors,
          input.collar,
          input.collarColor ?? null,
          input.breed ?? null,
          input.marksText ?? null,
          input.lastSeen.lat,
          input.lastSeen.lng,
          input.lastSeen.label ?? null,
          input.lastSeenTime,
          input.radiusKm,
          input.contactMethod,
          input.contactPhone ?? null,
          input.hidePhone,
          input.revealPhoneOnContact,
          input.showApproximateLocation,
          now,
          now
        ]
      );

      for (const photo of input.photos) {
        await client.query(
          `insert into post_photos (id, post_id, storage_path, taken_at, created_at)
           values ($1, $2, $3, $4, $5)`,
          [randomUUID(), postId, photo.storagePath, photo.takenAt ?? null, now]
        );
      }

      for (const sighting of input.sightings ?? []) {
        await client.query(
          `insert into sightings (id, post_id, lat, lng, label, seen_at, note, created_at)
           values ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            randomUUID(),
            postId,
            sighting.lat,
            sighting.lng,
            sighting.label ?? null,
            sighting.seenAt,
            sighting.note ?? null,
            now
          ]
        );
      }

      await client.query("commit");
      return this.getPostByIdOrThrow(postId);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  private async getPostByIdOrThrow(postId: string): Promise<PostBundle> {
    const bundle = await this.getPostById(postId);
    if (!bundle) {
      throw new Error(`Post ${postId} was not found after creation.`);
    }
    return bundle;
  }

  async getPostById(postId: string): Promise<PostBundle | null> {
    const postResult = await this.pool.query(`select * from posts where id = $1`, [postId]);
    if (postResult.rowCount === 0) {
      return null;
    }

    const post = toPostRecord(postResult.rows[0]);
    const [photos, sightings, embedding] = await Promise.all([
      this.getPhotosByPostIds([postId]),
      this.getSightingsByPostIds([postId]),
      this.getEmbeddingsByPostIds([postId])
    ]);

    return {
      post,
      photos: photos.get(postId) ?? [],
      sightings: sightings.get(postId) ?? [],
      embedding: embedding.get(postId) ?? null
    };
  }

  private async listByPostIds(postIds: string[]): Promise<PostBundle[]> {
    if (postIds.length === 0) {
      return [];
    }

    const postsResult = await this.pool.query(`select * from posts where id = any($1)`, [postIds]);
    const posts = postsResult.rows.map(toPostRecord);
    const [photos, sightings, embeddings] = await Promise.all([
      this.getPhotosByPostIds(postIds),
      this.getSightingsByPostIds(postIds),
      this.getEmbeddingsByPostIds(postIds)
    ]);

    return posts.map((post) => ({
      post,
      photos: photos.get(post.id) ?? [],
      sightings: sightings.get(post.id) ?? [],
      embedding: embeddings.get(post.id) ?? null
    }));
  }

  private async getPhotosByPostIds(postIds: string[]): Promise<Map<string, PhotoRecord[]>> {
    const map = new Map<string, PhotoRecord[]>();
    if (postIds.length === 0) {
      return map;
    }

    const result = await this.pool.query(`select * from post_photos where post_id = any($1) order by created_at asc`, [postIds]);
    for (const row of result.rows) {
      const photo = toPhotoRecord(row);
      const list = map.get(photo.postId);
      if (list) {
        list.push(photo);
      } else {
        map.set(photo.postId, [photo]);
      }
    }

    return map;
  }

  private async getSightingsByPostIds(postIds: string[]): Promise<Map<string, SightingRecord[]>> {
    const map = new Map<string, SightingRecord[]>();
    if (postIds.length === 0) {
      return map;
    }

    const result = await this.pool.query(`select * from sightings where post_id = any($1) order by seen_at desc`, [postIds]);
    for (const row of result.rows) {
      const sighting = toSightingRecord(row);
      const list = map.get(sighting.postId);
      if (list) {
        list.push(sighting);
      } else {
        map.set(sighting.postId, [sighting]);
      }
    }

    return map;
  }

  private async getEmbeddingsByPostIds(postIds: string[]): Promise<Map<string, EmbeddingRecord>> {
    const map = new Map<string, EmbeddingRecord>();
    if (postIds.length === 0) {
      return map;
    }

    const result = await this.pool.query(`select * from post_embeddings where post_id = any($1)`, [postIds]);
    for (const row of result.rows) {
      const embedding = toEmbeddingRecord(row);
      map.set(embedding.postId, embedding);
    }

    return map;
  }

  async listPosts(filters: QueryPostsFilters): Promise<PostBundle[]> {
    const values: unknown[] = [];
    const conditions = ["status = 'ACTIVE'"];

    if (filters.type) {
      values.push(filters.type);
      conditions.push(`type = $${values.length}`);
    }

    if (filters.petType) {
      values.push(filters.petType);
      conditions.push(`pet_type = $${values.length}`);
    }

    if (filters.sinceDays) {
      values.push(filters.sinceDays);
      conditions.push(`created_at >= now() - ($${values.length} * interval '1 day')`);
    }

    if (filters.lat !== undefined && filters.lng !== undefined && filters.radiusKm !== undefined) {
      values.push(filters.lat, filters.lng, filters.radiusKm);
      const latParam = `$${values.length - 2}`;
      const lngParam = `$${values.length - 1}`;
      const radiusParam = `$${values.length}`;
      conditions.push(
        `(6371 * acos(
          cos(radians(${latParam})) * cos(radians(last_seen_lat)) *
          cos(radians(last_seen_lng) - radians(${lngParam})) +
          sin(radians(${latParam})) * sin(radians(last_seen_lat))
        )) <= ${radiusParam}`
      );
    }

    const query = `select id from posts where ${conditions.join(" and ")} order by created_at desc limit 200`;
    const result = await this.pool.query(query, values);
    const postIds = result.rows.map((row: { id: string }) => row.id);

    return this.listByPostIds(postIds);
  }

  async listCandidatePosts(post: PostRecord): Promise<PostBundle[]> {
    const oppositeType: PostType = post.type === "LOST" ? "FOUND" : "LOST";
    const result = await this.pool.query(
      `select id from posts
       where id <> $1
         and type = $2
         and pet_type = $3
         and status = 'ACTIVE'`,
      [post.id, oppositeType, post.petType]
    );

    const postIds = result.rows.map((row: { id: string }) => row.id);
    return this.listByPostIds(postIds);
  }

  async listUserPosts(userId: string): Promise<PostBundle[]> {
    const result = await this.pool.query(`select id from posts where user_id = $1 order by created_at desc`, [userId]);
    return this.listByPostIds(result.rows.map((row: { id: string }) => row.id));
  }

  async upsertEmbedding(input: {
    postId: string;
    embedding: number[];
    embeddingProvider: string;
    caption?: string | null;
  }): Promise<EmbeddingRecord> {
    const vectorLiteral = `[${input.embedding.join(",")}]`;
    const result = await this.pool.query(
      `insert into post_embeddings (post_id, embedding, embedding_provider, caption, created_at)
       values ($1, $2::vector, $3, $4, now())
       on conflict (post_id) do update
       set embedding = excluded.embedding,
           embedding_provider = excluded.embedding_provider,
           caption = excluded.caption,
           created_at = now()
       returning post_id, embedding, embedding_provider, caption, created_at`,
      [input.postId, vectorLiteral, input.embeddingProvider, input.caption ?? null]
    );

    return toEmbeddingRecord(result.rows[0]);
  }

  async addSighting(input: {
    postId: string;
    lat: number;
    lng: number;
    label?: string | null;
    seenAt: Date;
    note?: string | null;
  }): Promise<SightingRecord> {
    const result = await this.pool.query(
      `insert into sightings (id, post_id, lat, lng, label, seen_at, note, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, now())
       returning *`,
      [randomUUID(), input.postId, input.lat, input.lng, input.label ?? null, input.seenAt, input.note ?? null]
    );

    return toSightingRecord(result.rows[0]);
  }

  async createOrUpdateMatch(input: { postA: string; postB: string; score: number }): Promise<MatchRecord> {
    const normalized = input.postA < input.postB
      ? { postA: input.postA, postB: input.postB }
      : { postA: input.postB, postB: input.postA };

    const result = await this.pool.query(
      `insert into matches (id, post_a, post_b, score, created_at, notified)
       values ($1, $2, $3, $4, now(), false)
       on conflict (post_a, post_b) do update
       set score = greatest(matches.score, excluded.score),
           created_at = now()
       returning *`,
      [randomUUID(), normalized.postA, normalized.postB, input.score]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      postA: row.post_a,
      postB: row.post_b,
      score: Number(row.score),
      createdAt: toDate(row.created_at),
      notified: row.notified
    };
  }

  async listMatchesForUser(userId: string): Promise<MatchBundle[]> {
    const matchesResult = await this.pool.query(
      `select m.*
       from matches m
       join posts a on a.id = m.post_a
       join posts b on b.id = m.post_b
       where a.user_id = $1 or b.user_id = $1
       order by m.score desc, m.created_at desc`,
      [userId]
    );

    const matchRows = matchesResult.rows as Array<{
      id: string;
      post_a: string;
      post_b: string;
      score: number;
      created_at: string | Date;
      notified: boolean;
    }>;
    if (matchRows.length === 0) {
      return [];
    }

    const postIds: string[] = Array.from(
      new Set(
        matchRows.flatMap((row) => [row.post_a, row.post_b])
      )
    );

    const bundles = await this.listByPostIds(postIds);
    const byId = new Map(bundles.map((bundle) => [bundle.post.id, bundle]));

    const result: MatchBundle[] = [];
    for (const row of matchRows) {
      const postA = byId.get(row.post_a);
      const postB = byId.get(row.post_b);
      if (!postA || !postB) {
        continue;
      }
      result.push({
        match: {
          id: row.id,
          postA: row.post_a,
          postB: row.post_b,
          score: Number(row.score),
          createdAt: toDate(row.created_at),
          notified: row.notified
        },
        postA,
        postB
      });
    }

    return result;
  }

  async markMatchNotified(matchId: string): Promise<void> {
    await this.pool.query(`update matches set notified = true where id = $1`, [matchId]);
  }

  async createContactMessage(input: {
    postId: string;
    fromUserId: string;
    message: string;
  }): Promise<ContactMessageRecord> {
    const result = await this.pool.query(
      `insert into contact_messages (id, post_id, from_user_id, message, created_at)
       values ($1, $2, $3, $4, now())
       returning *`,
      [randomUUID(), input.postId, input.fromUserId, input.message]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      postId: row.post_id,
      fromUserId: row.from_user_id,
      message: row.message,
      createdAt: toDate(row.created_at)
    };
  }

  async createReport(input: {
    postId: string;
    reporterUserId: string;
    reason: string;
  }): Promise<ReportRecord> {
    const result = await this.pool.query(
      `insert into reports (id, post_id, reporter_user_id, reason, created_at)
       values ($1, $2, $3, $4, now())
       returning *`,
      [randomUUID(), input.postId, input.reporterUserId, input.reason]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      postId: row.post_id,
      reporterUserId: row.reporter_user_id,
      reason: row.reason,
      createdAt: toDate(row.created_at)
    };
  }

  async resolvePost(postId: string, userId: string): Promise<PostRecord | null> {
    const result = await this.pool.query(
      `update posts
       set status = 'RESOLVED', updated_at = now()
       where id = $1 and user_id = $2
       returning *`,
      [postId, userId]
    );

    if (result.rowCount === 0) {
      return null;
    }
    return toPostRecord(result.rows[0]);
  }

  async deletePost(postId: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(
      `delete from posts
       where id = $1 and user_id = $2`,
      [postId, userId]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async registerPushToken(input: PushTokenRecord): Promise<void> {
    await this.pool.query(
      `insert into push_tokens (user_id, expo_token, updated_at)
       values ($1, $2, $3)
       on conflict (user_id, expo_token) do update
       set updated_at = excluded.updated_at`,
      [input.userId, input.expoToken, input.updatedAt]
    );
  }

  async listPushTokens(userId: string): Promise<PushTokenRecord[]> {
    const result = await this.pool.query(`select user_id, expo_token, updated_at from push_tokens where user_id = $1`, [
      userId
    ]);

    return result.rows.map((row: { user_id: string; expo_token: string; updated_at: string | Date }) => ({
      userId: row.user_id,
      expoToken: row.expo_token,
      updatedAt: toDate(row.updated_at)
    }));
  }

  async recordPushDelivery(input: { userId: string; matchId: string }): Promise<void> {
    await this.pool.query(
      `insert into push_deliveries (id, user_id, match_id, created_at)
       values ($1, $2, $3, now())`,
      [randomUUID(), input.userId, input.matchId]
    );
  }

  async countPushDeliveriesInLast24h(userId: string): Promise<number> {
    const result = await this.pool.query(
      `select count(*)::int as count
       from push_deliveries
       where user_id = $1
         and created_at >= now() - interval '24 hours'`,
      [userId]
    );

    return Number(result.rows[0]?.count ?? 0);
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.pool.query("select 1");
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await fn(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
}
