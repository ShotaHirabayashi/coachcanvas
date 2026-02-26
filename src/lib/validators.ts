import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().max(255).toLowerCase(),
  title: z.string().max(200).optional(),
  specialty: z.enum(["life", "business", "career", "other"]).optional(),
  timezone: z.string().max(50).optional(),
  email_signature: z.string().max(5000).optional(),
});

export const userUpdateSchema = userSchema.partial();

export const clientSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().max(255).optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  company: z.string().max(200).optional(),
  goals: z.string().max(5000).optional(),
  notes: z.string().max(10000).optional(),
  contract_start_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  contract_total_sessions: z.number().int().min(1).max(999).optional(),
  contract_fee: z.number().int().min(0).optional(),
});

export const clientUpdateSchema = clientSchema.partial();

export const sessionSchema = z.object({
  client_id: z.string().min(1),
  scheduled_at: z.string().min(1),
  duration_minutes: z.number().int().min(1).max(480).optional(),
  template_id: z.string().optional(),
});

export const sessionUpdateSchema = z.object({
  scheduled_at: z.string().optional(),
  duration_minutes: z.number().int().min(1).max(480).optional().nullable(),
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
});

export const noteSchema = z.object({
  content: z.string().max(50000),
  template_id: z.string().optional(),
});

export const autosaveSchema = z.object({
  content: z.string().max(50000),
});

export const templateSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
  content: z.string().min(1).max(20000),
  category: z.string().max(50).optional(),
});

export const templateUpdateSchema = templateSchema.partial();

export const goalScoreSchema = z.object({
  goal_label: z.string().min(1).max(100).trim(),
  score: z.number().int().min(1).max(10),
  session_id: z.string().optional(),
  note: z.string().max(1000).optional(),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(["clients", "sessions", "all"]).optional().default("all"),
  limit: z.number().int().min(1).max(50).optional().default(20),
});

export const followUpEmailUpdateSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  recipient_email: z.string().email().max(255),
});

export const onboardingSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  specialty: z.enum(["life", "business", "career", "other"]),
  client_name: z.string().min(1).max(100).trim().optional(),
  client_email: z.string().email().max(255).optional().or(z.literal("")),
});
