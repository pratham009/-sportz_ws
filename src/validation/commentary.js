import { z } from 'zod';

export const listCommentaryQuerySchema = z.object({
  limit: z
    .string()
    .pipe(z.coerce.number().positive().max(100))
    .optional()
});

export const createCommentarySchema = z.object({
  minute: z.number().int().nonnegative(),
  sequence: z.number().int().nonnegative().optional(),
  period: z.string(),
  eventType: z.string(),
  actor: z.string().optional(),
  team: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional()
});
