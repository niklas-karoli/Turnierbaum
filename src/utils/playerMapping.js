/**
 * Player Mapping & Parallel Tournament Conflict (Lock) Engine
 */

import { MATCH_STATUS } from '../types';

/**
 * Extracts player names for a team.
 * If team.members is defined and non-empty, returns member names.
 * Otherwise falls back to [team.name].
 */
export const getTeamPlayerNames = (team) => {
  if (!team) return [];
  if (Array.isArray(team.members) && team.members.length > 0) {
    return team.members.map((m) => (typeof m === 'object' ? m.name : m)).filter(Boolean);
  }
  return team.name ? [team.name] : [];
};

/**
 * Returns all equivalent player links for a given tournamentId and playerIdentifier.
 * playerMappings structure:
 * [
 *   {
 *     id: 'map_1',
 *     links: [
 *       { tournamentId: 'tourney_1', playerIdentifier: 'Max' },
 *       { tournamentId: 'tourney_2', playerIdentifier: 'Max' }
 *     ]
 *   }
 * ]
 */
export const getEquivalentPlayers = (tournamentId, playerIdentifier, playerMappings = []) => {
  if (!playerIdentifier || !playerMappings || playerMappings.length === 0) {
    return [{ tournamentId, playerIdentifier }];
  }

  const results = new Map();
  results.set(`${tournamentId}:${playerIdentifier}`, { tournamentId, playerIdentifier });

  playerMappings.forEach((mapping) => {
    if (!mapping.links || !Array.isArray(mapping.links)) return;

    const matchesInput = mapping.links.some(
      (link) => link.tournamentId === tournamentId && link.playerIdentifier === playerIdentifier
    );

    if (matchesInput) {
      mapping.links.forEach((link) => {
        const key = `${link.tournamentId}:${link.playerIdentifier}`;
        results.set(key, link);
      });
    }
  });

  return Array.from(results.values());
};

/**
 * Finds all active ongoing matches across all tournaments and collects player field locks.
 * Returns an array of active player descriptors:
 * [
 *   {
 *     tournamentId,
 *     tournamentName,
 *     matchId,
 *     fieldId,
 *     fieldName,
 *     playerIdentifier,
 *     teamName
 *   }
 * ]
 */
export const getAllActivePlayerLocks = (allTournaments = []) => {
  const activeLocks = [];

  allTournaments.forEach((tourney) => {
    if (!tourney || !tourney.matches) return;

    const matches = tourney.system === 'hybrid' && tourney.playoffMatches
      ? [...tourney.matches, ...tourney.playoffMatches]
      : tourney.matches;

    const fields = tourney.fields || [];

    matches.forEach((m) => {
      // Only lock if status is ONGOING AND m is assigned to an active field
      if (m.status === MATCH_STATUS.ONGOING && m.fieldId) {
        const activeField = fields.find(
          (f) => f.id === m.fieldId && f.currentMatchId === m.id
        );

        if (activeField) {
          const fieldName = activeField.name || m.fieldId || 'Spielfeld';

          [m.team1, m.team2].forEach((team) => {
            if (!team) return;
            const playerNames = getTeamPlayerNames(team);
            playerNames.forEach((playerName) => {
              activeLocks.push({
                tournamentId: tourney.id,
                tournamentName: tourney.name || 'Turnier',
                matchId: m.id,
                fieldId: m.fieldId,
                fieldName,
                playerIdentifier: playerName,
                teamName: team.name,
              });
            });
          });
        }
      }
    });
  });

  return activeLocks;
};

/**
 * Checks if a specific match is locked due to a player playing in an ongoing match in ANY tournament.
 * Returns { isLocked: boolean, reason: string | null, lockedPlayer: string | null }
 */
export const getMatchLockStatus = (
  match,
  matchTournamentId,
  allTournaments = [],
  playerMappings = []
) => {
  if (!match || !match.team1 || !match.team2) {
    return { isLocked: false, reason: null, lockedPlayer: null };
  }

  const activeLocks = getAllActivePlayerLocks(allTournaments);
  if (activeLocks.length === 0) {
    return { isLocked: false, reason: null, lockedPlayer: null };
  }

  // Collect all player identifiers for this match
  const team1Players = getTeamPlayerNames(match.team1);
  const team2Players = getTeamPlayerNames(match.team2);
  const matchPlayers = [...team1Players, ...team2Players];

  for (const player of matchPlayers) {
    // Get all linked representations of this player across tournaments
    const equivalents = getEquivalentPlayers(matchTournamentId, player, playerMappings);

    for (const eq of equivalents) {
      // Look for an active lock matching this equivalent player
      const lock = activeLocks.find(
        (l) => l.tournamentId === eq.tournamentId && l.playerIdentifier === eq.playerIdentifier
      );

      if (lock) {
        // If locked in another tournament OR another match in same tournament
        if (lock.tournamentId !== matchTournamentId || lock.matchId !== match.id) {
          const isOtherTourney = lock.tournamentId !== matchTournamentId;
          const locationDesc = isOtherTourney
            ? `in "${lock.tournamentName}" auf ${lock.fieldName}`
            : `auf ${lock.fieldName}`;

          return {
            isLocked: true,
            reason: `Gesperrt (${player} spielt gerade ${locationDesc})`,
            lockedPlayer: player,
            activeTournamentName: lock.tournamentName,
            activeFieldName: lock.fieldName,
          };
        }
      }
    }
  }

  return { isLocked: false, reason: null, lockedPlayer: null };
};
