import { z } from 'zod';

// Match status constants
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

// Schema to validate list matches query parameters
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().positive().max(100).optional(),
});

// Schema to validate match ID from URL params
export const matchIdParamSchema = z.object({
  id: z.coerce.number().positive().int(),
});

// Schema to validate creating a new match
export const createMatchSchema = z.object({
  sport: z.string().min(1, 'Sport is required'),
  homeTeam: z.string().min(1, 'Home team is required'),
  awayTeam: z.string().min(1, 'Away team is required'),
  startTime: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    'startTime must be a valid ISO date string'
  ),
  endTime: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    'endTime must be a valid ISO date string'
  ),
  homeScore: z.coerce.number().nonnegative().int().optional(),
  awayScore: z.coerce.number().nonnegative().int().optional(),
}).superRefine((data, ctx) => {
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);

  if (endTime <= startTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endTime'],
      message: 'endTime must be chronologically after startTime',
    });
  }
});

// Schema to validate updating match scores
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().nonnegative().int(),
  awayScore: z.coerce.number().nonnegative().int(),
});
