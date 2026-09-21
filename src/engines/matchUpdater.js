/**
 * Unified Match Score & Progression Engine
 */

import { MATCH_STATUS, TOURNAMENT_SYSTEMS } from '../types';
import { checkAndGeneratePlayoffs } from './hybrid';

/**
 * Updates a match result and auto-advances winners/losers
 */
export const updateMatchResult = (tournament, matchId, score1, score2) => {
  const isDraw = score1 === score2;
  const targetMatch = findMatchById(tournament, matchId);

  if (!targetMatch) {
    console.error(`Match with ID ${matchId} not found`);
    return tournament;
  }

  // Determine winner and loser
  let winnerId = null;
  let loserId = null;

  if (score1 > score2) {
    winnerId = targetMatch.team1?.id;
    loserId = targetMatch.team2?.id;
  } else if (score2 > score1) {
    winnerId = targetMatch.team2?.id;
    loserId = targetMatch.team1?.id;
  }

  const updatedMatch = {
    ...targetMatch,
    score1,
    score2,
    winnerId,
    loserId,
    status: MATCH_STATUS.COMPLETED,
    isTimerRunning: false,
    timerStartedAt: null,
    timerRemaining: 0,
  };

  let updatedTournament = replaceMatchInTournament(tournament, updatedMatch);

  // Handle bracket advancement for Single Elimination, Double Elimination, and Hybrid Playoffs
  if (
    tournament.system === TOURNAMENT_SYSTEMS.SINGLE_ELIMINATION ||
    tournament.system === TOURNAMENT_SYSTEMS.DOUBLE_ELIMINATION ||
    (tournament.system === TOURNAMENT_SYSTEMS.HYBRID && updatedMatch.isPlayoff)
  ) {
    updatedTournament = propagateBracketAdvancement(updatedTournament, updatedMatch);
  }

  // Handle Hybrid stage check (Group stage -> Playoff transition)
  if (tournament.system === TOURNAMENT_SYSTEMS.HYBRID && !updatedMatch.isPlayoff) {
    updatedTournament = checkAndGeneratePlayoffs(updatedTournament);
  }

  return updatedTournament;
};

const findMatchById = (tournament, matchId) => {
  if (tournament.system === TOURNAMENT_SYSTEMS.HYBRID) {
    if (tournament.playoffMatches) {
      const pm = tournament.playoffMatches.find((m) => m.id === matchId);
      if (pm) return pm;
    }
    return tournament.matches.find((m) => m.id === matchId);
  }
  return tournament.matches.find((m) => m.id === matchId);
};

const replaceMatchInTournament = (tournament, updatedMatch) => {
  if (tournament.system === TOURNAMENT_SYSTEMS.HYBRID) {
    if (updatedMatch.isPlayoff) {
      return {
        ...tournament,
        playoffMatches: tournament.playoffMatches.map((m) =>
          m.id === updatedMatch.id ? updatedMatch : m
        ),
      };
    } else {
      return {
        ...tournament,
        matches: tournament.matches.map((m) =>
          m.id === updatedMatch.id ? updatedMatch : m
        ),
      };
    }
  }

  return {
    ...tournament,
    matches: tournament.matches.map((m) =>
      m.id === updatedMatch.id ? updatedMatch : m
    ),
  };
};

/**
 * Advances winner to next match (and loser if double elimination)
 */
const propagateBracketAdvancement = (tournament, match) => {
  let matches = tournament.system === TOURNAMENT_SYSTEMS.HYBRID ? [...tournament.playoffMatches] : [...tournament.matches];

  const winningTeam = match.team1?.id === match.winnerId ? match.team1 : match.team2;
  const losingTeam = match.team1?.id === match.loserId ? match.team1 : match.team2;

  // 1. Advance Winner
  if (match.nextMatchId && winningTeam) {
    const nextMatchIdx = matches.findIndex((m) => m.id === match.nextMatchId);
    if (nextMatchIdx !== -1) {
      const nextMatch = { ...matches[nextMatchIdx] };
      const pos = match.nextMatchPosition || 'team1';
      nextMatch[pos] = winningTeam;

      if (nextMatch.team1 && nextMatch.team2) {
        nextMatch.status = MATCH_STATUS.READY;
      }
      matches[nextMatchIdx] = nextMatch;
    }
  }

  // 2. Advance Loser (Double Elimination)
  if (match.loserNextMatchId && losingTeam) {
    const loserNextIdx = matches.findIndex((m) => m.id === match.loserNextMatchId);
    if (loserNextIdx !== -1) {
      const loserNextMatch = { ...matches[loserNextIdx] };
      const pos = match.loserNextMatchPosition || 'team1';
      loserNextMatch[pos] = losingTeam;

      if (loserNextMatch.team1 && loserNextMatch.team2) {
        loserNextMatch.status = MATCH_STATUS.READY;
      }
      matches[loserNextIdx] = loserNextMatch;
    }
  }

  if (tournament.system === TOURNAMENT_SYSTEMS.HYBRID) {
    return { ...tournament, playoffMatches: matches };
  }
  return { ...tournament, matches };
};
