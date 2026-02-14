import arcjet, { shield, detectBot, slidingWindow } from '@arcjet/node';

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === 'DRY_RUN' ? 'DRY_RUN': 'LIVE';


if (!arcjetKey) throw new Error('ARCJET_KEY env var is missing');

export const httpArcjet = arcjetKey ?
        arcjet({
            key: arcjetKey,
            rules:[
                shield({mode:arcjetMode}),
                detectBot({ mode: arcjetMode, allow: ['CATEGORY: SEARCH_ENGINE', "CATEGORY:PREVIEW"]}),
                slidingWindow({mode:arcjetMode, interval:'10s', max:50})
            ],
        }): null;

export const wsArcjet = arcjetKey ?
        arcjet({
            key: arcjetKey,
            rules:[
                shield({mode:arcjetMode}),
                detectBot({ mode: arcjetMode, allow: ['CATEGORY: SEARCH_ENGINE', "CATEGORY:PREVIEW"]}),
                slidingWindow({mode:arcjetMode, interval:'2s', max:5})
            ],
        }): null;

/**
 * Create an Express-compatible middleware that enforces ArcJet protection on incoming HTTP requests.
 *
 * When ArcJet is not configured the middleware simply calls `next()`. When configured, it evaluates
 * the request via ArcJet and:
 * - responds with HTTP 403 and JSON `{ error: 'Forbidden' }` if the decision is denied for rate-limiting,
 * - responds with HTTP 502 and JSON `{ error: 'Service Unavailable' }` if ArcJet throws an error,
 * - otherwise calls `next()` to continue request processing.
 *
 * @returns {function} An Express middleware function `(req, res, next)` implementing the described behavior.
 */
export function securityMiddleware(){
    return async (req,res,next) => {
        if(!httpArcjet) return next();

        try{
            const decision = await httpArcjet.protect(req);

            if(decision.isDenied()){
                if(decision.reason.isRateLimit()){
                    return res.status(403).json({error:'Forbidden'});
                }
            }

        }catch (e){
            console.error('Arcjet middleware error', e);
            return res.status(502).json({error:'Service Unavailable'});
        }
        next();
    }
}