import { Router } from 'express';
import { desc } from 'drizzle-orm';
import { createMatchSchema, listMatchesQuerySchema } from '../validation/matches.js';
import { db } from '../db/db.js';
import { matches } from '../db/schema.js';

const MAX_LIMIT = 100;

export const matchRouter = Router();

matchRouter.get('/', async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid query.',
      details: JSON.stringify(parsed.error),
    });
  }
  const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);
  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list matches' });
  }
});

matchRouter.post('/', async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid payload',
      details: JSON.stringify(parsed.error),
    });
  }

  try {
    const { homeScore, awayScore, startTime, endTime } = parsed.data;

    const [event] = await db
      .insert(matches)
      .values({
        sport: parsed.data.sport,
        homeTeam: parsed.data.homeTeam,
        awayTeam: parsed.data.awayTeam,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: 'scheduled',
      })
      .returning();

    res.status(201).json({ data: event });
  } catch (e) {
    res.status(500).json({
      error: 'Failed to create match.',
      details: JSON.stringify(e),
    });
  }
});