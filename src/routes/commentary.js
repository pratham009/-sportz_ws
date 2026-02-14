import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { listCommentaryQuerySchema } from '../validation/commentary.js';
import { matchIdParamSchema } from '../validation/matches.js';
import { db } from '../db/db.js';
import { commentary } from '../db/schema.js';

const MAX_LIMIT = 100;

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get('/', async (req, res) => {
  // Validate match ID from params
  const paramsValidation = matchIdParamSchema.safeParse(req.params);
  if (!paramsValidation.success) {
    return res.status(400).json({
      error: 'Invalid match ID.',
      details: JSON.stringify(paramsValidation.error),
    });
  }

  // Validate query parameters
  const queryValidation = listCommentaryQuerySchema.safeParse(req.query);
  if (!queryValidation.success) {
    return res.status(400).json({
      error: 'Invalid query parameters.',
      details: JSON.stringify(queryValidation.error),
    });
  }

  const matchId = paramsValidation.data.id;
  const limit = Math.min(queryValidation.data.limit ?? 100, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    res.json(data);
  } catch (e) {
    console.error('Failed to fetch commentary:', e);
    res.status(500).json({ error: 'Failed to fetch commentary' });
  }
});
