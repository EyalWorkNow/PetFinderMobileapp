export type PostType = "LOST" | "FOUND";
export type PetType = "DOG" | "CAT" | "PARROT" | "OTHER";
export type PostStatus = "ACTIVE" | "RESOLVED" | "EXPIRED";

export interface Post {
  id: string;
  userId: string;
  type: PostType;
  petType: PetType;
  status: PostStatus;
  title: string;
  shortDesc: string | null;
  size: "S" | "M" | "L" | "UNKNOWN";
  colors: string[];
  collar: boolean;
  collarColor: string | null;
  breed: string | null;
  marksText: string | null;
  lastSeen: {
    lat: number;
    lng: number;
    label: string | null;
    isApproximate: boolean;
  };
  lastSeenTime: string;
  radiusKm: number;
  contactMethod: "PHONE" | "WHATSAPP" | "IN_APP";
  contactPhoneVisible: boolean;
  contactPhone: string | null;
  revealPhoneOnContact: boolean;
  photos: Array<{
    id: string;
    storagePath: string;
    takenAt: string | null;
  }>;
  sightings: Array<{
    id: string;
    lat: number;
    lng: number;
    label: string | null;
    seenAt: string;
    note: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface MatchItem {
  id: string;
  score: number;
  band: "HIGH" | "POSSIBLE";
  notified: boolean;
  createdAt: string;
  postA: Post;
  postB: Post;
}

export interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
}
