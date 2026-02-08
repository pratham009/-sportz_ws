import { MATCH_STATUS } from '../validation/matches.js';

/**
 * Determine a match's current status based on its start and end times.
 * @param {Date|string|number} startTime - Start time or value parseable by `Date`.
 * @param {Date|string|number} endTime - End time or value parseable by `Date`.
 * @param {Date} [now=new Date()] - Reference time used for the comparison.
 * @returns {('SCHEDULED'|'LIVE'|'FINISHED'|null)} `MATCH_STATUS.SCHEDULED` if `now` is before the start, `MATCH_STATUS.FINISHED` if `now` is at or after the end, `MATCH_STATUS.LIVE` if `now` is between start and end, or `null` if `startTime` or `endTime` is invalid.
 */
export function getMatchStatus(startTime, endTime, now = new Date()) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
    }

    if (now < start) {
        return MATCH_STATUS.SCHEDULED;
    }

    if (now >= end) {
        return MATCH_STATUS.FINISHED;
    }

    return MATCH_STATUS.LIVE;
}

/**
 * Ensure a match object's status matches the status computed from its start and end times, updating it if necessary.
 *
 * @param {Object} match - Match object containing at least `startTime`, `endTime`, and `status` properties; `status` may be updated by this function.
 * @param {Function} updateStatus - Callback invoked with the new status when an update is required.
 * @returns {string|null} The match's status after synchronization, or `null` if the computed status was invalid.
 */
export async function syncMatchStatus(match, updateStatus) {
    const nextStatus = getMatchStatus(match.startTime, match.endTime);
    if (!nextStatus) {
        return match.status;
    }
    if (match.status !== nextStatus) {
        await updateStatus(nextStatus);
        match.status = nextStatus;
    }
    return match.status;
}