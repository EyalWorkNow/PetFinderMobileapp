import type { ContactMethod, PetSize, PetType, PostStatus, PostType } from "@petfind/shared";

export interface UserRecord {
  id: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
}

export interface PostRecord {
  id: string;
  userId: string;
  type: PostType;
  petType: PetType;
  status: PostStatus;
  title: string;
  shortDesc: string | null;
  size: PetSize;
  colors: string[];
  collar: boolean;
  collarColor: string | null;
  breed: string | null;
  marksText: string | null;
  lastSeenLat: number;
  lastSeenLng: number;
  lastSeenLabel: string | null;
  lastSeenTime: Date;
  radiusKm: number;
  contactMethod: ContactMethod;
  contactPhone: string | null;
  hidePhone: boolean;
  revealPhoneOnContact: boolean;
  showApproximateLocation: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhotoRecord {
  id: string;
  postId: string;
  storagePath: string;
  takenAt: Date | null;
  createdAt: Date;
}

export interface SightingRecord {
  id: string;
  postId: string;
  lat: number;
  lng: number;
  label: string | null;
  seenAt: Date;
  note: string | null;
  createdAt: Date;
}

export interface EmbeddingRecord {
  postId: string;
  embedding: number[];
  embeddingProvider: string;
  caption: string | null;
  createdAt: Date;
}

export interface MatchRecord {
  id: string;
  postA: string;
  postB: string;
  score: number;
  createdAt: Date;
  notified: boolean;
}

export interface ContactMessageRecord {
  id: string;
  postId: string;
  fromUserId: string;
  message: string;
  createdAt: Date;
}

export interface ReportRecord {
  id: string;
  postId: string;
  reporterUserId: string;
  reason: string;
  createdAt: Date;
}

export interface PushTokenRecord {
  userId: string;
  expoToken: string;
  updatedAt: Date;
}

export interface PushDeliveryRecord {
  id: string;
  userId: string;
  matchId: string;
  createdAt: Date;
}

export interface PostBundle {
  post: PostRecord;
  photos: PhotoRecord[];
  sightings: SightingRecord[];
  embedding: EmbeddingRecord | null;
}

export interface MatchBundle {
  match: MatchRecord;
  postA: PostBundle;
  postB: PostBundle;
}
