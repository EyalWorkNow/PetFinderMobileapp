import { z } from "zod";
import {
  contactMethodValues,
  petTypeValues,
  postStatusValues,
  postTypeValues,
  sizeValues
} from "./types";

export const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  label: z.string().min(1).max(120).optional().nullable()
});

export const photoInputSchema = z.object({
  storagePath: z.string().min(1),
  takenAt: z.coerce.date().optional()
});

export const sightingInputSchema = coordinateSchema.extend({
  seenAt: z.coerce.date(),
  note: z.string().max(500).optional().nullable()
});

export const createPostSchema = z.object({
  type: z.enum(postTypeValues),
  petType: z.enum(petTypeValues),
  status: z.enum(postStatusValues).default("ACTIVE"),
  title: z.string().min(2).max(120),
  shortDesc: z.string().max(500).optional().nullable(),
  size: z.enum(sizeValues).default("UNKNOWN"),
  colors: z.array(z.string().min(1).max(40)).min(1),
  collar: z.boolean(),
  collarColor: z.string().max(40).optional().nullable(),
  breed: z.string().max(80).optional().nullable(),
  marksText: z.string().max(240).optional().nullable(),
  lastSeen: coordinateSchema,
  lastSeenTime: z.coerce.date(),
  radiusKm: z.number().positive().max(200),
  photos: z.array(photoInputSchema).min(1),
  sightings: z.array(sightingInputSchema).optional(),
  contactMethod: z.enum(contactMethodValues),
  contactPhone: z.string().max(30).optional().nullable(),
  hidePhone: z.boolean().default(true),
  revealPhoneOnContact: z.boolean().default(false),
  showApproximateLocation: z.boolean().default(true)
});

export const queryPostsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(300).optional(),
  type: z.enum(postTypeValues).optional(),
  petType: z.enum(petTypeValues).optional(),
  sinceDays: z.coerce.number().int().positive().max(365).optional()
});

export const contactSchema = z.object({
  message: z.string().min(3).max(1000)
});

export const reportSchema = z.object({
  reason: z.string().min(3).max(500)
});

export const pushTokenSchema = z.object({
  expoToken: z.string().min(10).max(255)
});
