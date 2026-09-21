import { MATCH_STATUS } from '../types';

/**
 * Calculates current remaining time in seconds for a match, accounting for background passage of time.
 */
export function getMatchRemainingSeconds(match) {
  if (!match) return 600;
  const duration = match.timerDuration ?? 600;

  if (!match.isTimerRunning || !match.timerStartedAt) {
    return match.timerRemaining ?? duration;
  }

  const elapsedSeconds = Math.floor((Date.now() - match.timerStartedAt) / 1000);
  const remaining = (match.timerRemaining ?? duration) - elapsedSeconds;
  return Math.max(0, remaining);
}

/**
 * Formats seconds into MM:SS string.
 */
export function formatTimerDisplay(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Helper to update match timer state in tournament object.
 */
function updateMatchInTournament(tournament, matchId, updateFn) {
  let updatedMatches = tournament.matches?.map((m) => {
    if (m.id === matchId) return updateFn(m);
    return m;
  });

  let updatedPlayoffMatches = tournament.playoffMatches?.map((m) => {
    if (m.id === matchId) return updateFn(m);
    return m;
  });

  return {
    ...tournament,
    matches: updatedMatches,
    ...(updatedPlayoffMatches ? { playoffMatches: updatedPlayoffMatches } : {}),
  };
}

/**
 * Toggles match timer start/pause and updates status.
 */
export function toggleMatchTimerInTournament(tournament, matchId) {
  return updateMatchInTournament(tournament, matchId, (match) => {
    const isRunning = !!match.isTimerRunning;
    const currentRemaining = getMatchRemainingSeconds(match);

    if (isRunning) {
      // Pause
      return {
        ...match,
        isTimerRunning: false,
        timerStartedAt: null,
        timerRemaining: currentRemaining,
      };
    } else {
      // Start
      const newStatus =
        match.status === MATCH_STATUS.COMPLETED
          ? MATCH_STATUS.COMPLETED
          : MATCH_STATUS.ONGOING;

      return {
        ...match,
        isTimerRunning: true,
        timerStartedAt: Date.now(),
        timerRemaining: currentRemaining <= 0 ? (match.timerDuration ?? 600) : currentRemaining,
        status: newStatus,
      };
    }
  });
}

/**
 * Resets match timer to specified duration (in seconds).
 */
export function resetMatchTimerInTournament(tournament, matchId, seconds = 600) {
  return updateMatchInTournament(tournament, matchId, (match) => {
    return {
      ...match,
      isTimerRunning: false,
      timerStartedAt: null,
      timerDuration: seconds,
      timerRemaining: seconds,
    };
  });
}
