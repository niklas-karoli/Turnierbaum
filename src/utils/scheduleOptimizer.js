/**
 * Schedule Collision Analyzer & Reshuffling Engine
 */

import { TOURNAMENT_SYSTEMS } from '../types';
import { generateSingleElimination } from '../engines/singleElimination';
import { generateDoubleElimination } from '../engines/doubleElimination';
import { generateRoundRobin } from '../engines/roundRobin';
import { generateHybrid } from '../engines/hybrid';
import { generateSwissInitial } from '../engines/swiss';
import { autoAssignFieldsAllTournaments } from '../engines/fieldScheduler';
import { getTeamPlayerNames } from './playerMapping';

/**
 * Calculates collision score across all tournaments for given player mappings.
 * Collision score = number of round/time-slot overlaps where linked players play at the same time.
 */
export const calculateCollisionScore = (tournaments = [], playerMappings = []) => {
  if (!tournaments || tournaments.length < 2 || !playerMappings || playerMappings.length === 0) {
    return 0;
  }

  let collisions = 0;

  // Build map of (tournamentId + roundNumber + playerIdentifier) -> matchId
  const roundMap = new Map();

  tournaments.forEach((tourney) => {
    const matches = tourney.system === 'hybrid' && tourney.playoffMatches
      ? [...tourney.matches, ...tourney.playoffMatches]
      : tourney.matches || [];

    matches.forEach((m) => {
      const round = m.round || 1;

      [m.team1, m.team2].forEach((team) => {
        if (!team) return;
        const playerNames = getTeamPlayerNames(team);
        playerNames.forEach((playerName) => {
          const key = `${tourney.id}:${round}:${playerName}`;
          roundMap.set(key, m.id);
        });
      });
    });
  });

  // Evaluate collisions for each mapped player group
  playerMappings.forEach((mapping) => {
    if (!mapping.links || mapping.links.length < 2) return;

    for (let i = 0; i < mapping.links.length; i++) {
      for (let j = i + 1; j < mapping.links.length; j++) {
        const linkA = mapping.links[i];
        const linkB = mapping.links[j];

        if (linkA.tournamentId === linkB.tournamentId) continue;

        // Check across rounds 1..20
        for (let r = 1; r <= 20; r++) {
          const hasA = roundMap.has(`${linkA.tournamentId}:${r}:${linkA.playerIdentifier}`);
          const hasB = roundMap.has(`${linkB.tournamentId}:${r}:${linkB.playerIdentifier}`);

          if (hasA && hasB) {
            collisions++;
          }
        }
      }
    }
  });

  return collisions;
};

/**
 * Regenerates matches for a tournament with a new team order
 */

const regenerateTournamentMatches = (tourney, shuffledTeams) => {
  const options = tourney.options || {};
  let generated = null;

  if (tourney.system === TOURNAMENT_SYSTEMS.SINGLE_ELIMINATION) {
    generated = generateSingleElimination(shuffledTeams, false, options);
  } else if (tourney.system === TOURNAMENT_SYSTEMS.DOUBLE_ELIMINATION) {
    generated = generateDoubleElimination(shuffledTeams, false, options);
  } else if (tourney.system === TOURNAMENT_SYSTEMS.ROUND_ROBIN) {
    generated = generateRoundRobin(shuffledTeams);
  } else if (tourney.system === TOURNAMENT_SYSTEMS.HYBRID) {
    generated = generateHybrid(
      shuffledTeams,
      tourney.groupCount || 2,
      tourney.advancingPerGroup || 2
    );
  } else if (tourney.system === TOURNAMENT_SYSTEMS.SWISS) {
    generated = generateSwissInitial(shuffledTeams, tourney.totalRounds || 4);
  }

  if (!generated) return tourney;

  const defaultTimer = tourney.defaultTimerDuration || 600;
  const applyTimer = (mList) =>
    (mList || []).map((m) => ({
      ...m,
      timerDuration: m.timerDuration ?? defaultTimer,
      timerRemaining: m.timerRemaining ?? defaultTimer,
    }));

  return {
    ...tourney,
    teams: shuffledTeams,
    matches: applyTimer(generated.matches),
    rounds: generated.rounds || tourney.rounds,
    groups: generated.groups || tourney.groups,
    playoffMatches: generated.playoffMatches ? applyTimer(generated.playoffMatches) : undefined,
  };
};

/**
 * Re-shuffles schedules for unstarted tournaments to minimize collisions
 */
export const optimizeAndReshuffleSchedules = (tournaments = [], playerMappings = []) => {
  if (!tournaments || tournaments.length < 2) {
    return {
      tournaments,
      score: 0,
      reshuffledCount: 0,
      message: 'Mindestens zwei Turniere erforderlich.',
    };
  }

  // Identify tournaments that can be re-shuffled (no completed matches)
  const isUnstarted = (t) => {
    const allM = t.system === 'hybrid' && t.playoffMatches
      ? [...t.matches, ...t.playoffMatches]
      : t.matches || [];
    return !allM.some((m) => m.status === 'completed');
  };

  const candidateTourneys = tournaments.filter(isUnstarted);
  if (candidateTourneys.length === 0) {
    return {
      tournaments,
      score: calculateCollisionScore(tournaments, playerMappings),
      reshuffledCount: 0,
      message: 'Keine ungestarteten Turniere zum Neumischen verfügbar.',
    };
  }

  let bestTournaments = [...tournaments];
  let bestScore = calculateCollisionScore(bestTournaments, playerMappings);

  if (bestScore === 0) {
    return {
      tournaments: bestTournaments,
      score: 0,
      reshuffledCount: 0,
      message: 'Keine zeitlichen Überschneidungen gefunden! Der Spielplan ist optimal.',
    };
  }

  // Permute and test up to 40 candidate schedule arrangements
  for (let attempt = 0; attempt < 40; attempt++) {
    const testTournaments = tournaments.map((t) => {
      if (!isUnstarted(t)) return t;

      // Shuffle teams randomly
      const shuffledTeams = [...t.teams]
        .sort(() => Math.random() - 0.5)
        .map((team, idx) => ({ ...team, seed: idx + 1 }));

      return regenerateTournamentMatches(t, shuffledTeams);
    });

    const score = calculateCollisionScore(testTournaments, playerMappings);
    if (score < bestScore) {
      bestScore = score;
      bestTournaments = testTournaments;
      if (bestScore === 0) break;
    }
  }

  // Re-run auto assignment on optimized tournaments
  const finalScheduled = autoAssignFieldsAllTournaments(bestTournaments, playerMappings);

  return {
    tournaments: finalScheduled,
    score: bestScore,
    reshuffledCount: candidateTourneys.length,
    message:
      bestScore === 0
        ? 'Spielplan erfolgreich neu gemischt: Alle Kollisionen wurden behoben!'
        : `Spielplan neu gemischt: Überschneidungen auf ${bestScore} minimiert.`,
  };
};
