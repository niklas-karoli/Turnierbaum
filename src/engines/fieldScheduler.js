/**
 * Dynamic Field / Station Scheduling & Conflict Prevention Engine
 */

import { MATCH_STATUS } from '../types';

/**
 * Initializes fields array
 * @param {number} count Number of available fields (1 to 32)
 */
export const initializeFields = (count = 2) => {
  const fields = [];
  for (let i = 1; i <= count; i++) {
    fields.push({
      id: `field_${i}`,
      name: `Feld ${i}`,
      currentMatchId: null,
      status: 'free', // 'free' | 'busy'
    });
  }
  return fields;
};

import { getMatchLockStatus } from '../utils/playerMapping';

/**
 * Helper to sort ready matches by original schedule priority:
 * Round number ascending, then Match ID ascending.
 */
export const sortMatchesBySchedulePriority = (matches = []) => {
  return [...matches].sort((a, b) => {
    const roundA = a.round ?? 1;
    const roundB = b.round ?? 1;
    if (roundA !== roundB) return roundA - roundB;

    const idA = String(a.id || '');
    const idB = String(b.id || '');
    return idA.localeCompare(idB, undefined, { numeric: true });
  });
};

/**
 * Auto-assigns pending/ready matches to available fields with
 * cross-tournament player lock awareness and round/match-id priority.
 */
export const autoAssignFields = (
  tournament,
  allTournaments = [tournament],
  playerMappings = []
) => {
  if (!tournament || !tournament.fields || tournament.fields.length === 0) {
    return tournament;
  }

  const matches = tournament.system === 'hybrid' && tournament.playoffMatches
    ? [...tournament.matches, ...tournament.playoffMatches]
    : [...tournament.matches];

  const updatedFields = [...tournament.fields];
  const updatedMatches = matches.map((m) => ({ ...m }));

  // Collect teams currently active on a field in this tournament
  const busyTeamIds = new Set();
  updatedMatches.forEach((m) => {
    if (m.status === MATCH_STATUS.ONGOING) {
      if (m.team1) busyTeamIds.add(m.team1.id);
      if (m.team2) busyTeamIds.add(m.team2.id);
    }
  });

  // Assign free fields to eligible ready matches based on schedule priority
  updatedFields.forEach((field, fIdx) => {
    // Check if currently assigned match on field is completed
    if (field.currentMatchId) {
      const activeMatch = updatedMatches.find((m) => m.id === field.currentMatchId);
      if (!activeMatch || activeMatch.status === MATCH_STATUS.COMPLETED) {
        updatedFields[fIdx] = { ...field, currentMatchId: null, status: 'free' };
      }
    }

    // If field is free, assign next ready match by schedule order
    if (!updatedFields[fIdx].currentMatchId) {
      // Get all READY candidate matches
      const candidateMatches = updatedMatches.filter((m) => {
        if (m.status !== MATCH_STATUS.READY) return false;
        if (m.fieldId && m.fieldId !== field.id) return false;
        if (!m.team1 || !m.team2) return false;

        // Check if either team is busy in this tournament
        if (busyTeamIds.has(m.team1.id) || busyTeamIds.has(m.team2.id)) {
          return false;
        }

        // Check if any player in this match is locked across all tournaments
        const lockStatus = getMatchLockStatus(
          m,
          tournament.id,
          allTournaments,
          playerMappings
        );

        if (lockStatus.isLocked) {
          return false;
        }

        return true;
      });

      // Sort candidate matches by round ascending, then ID ascending
      const sortedCandidates = sortMatchesBySchedulePriority(candidateMatches);

      if (sortedCandidates.length > 0) {
        const nextMatch = sortedCandidates[0];
        const matchIndex = updatedMatches.findIndex((m) => m.id === nextMatch.id);

        if (matchIndex !== -1) {
          updatedMatches[matchIndex].status = MATCH_STATUS.ONGOING;
          updatedMatches[matchIndex].fieldId = field.id;
          updatedFields[fIdx] = { ...field, currentMatchId: nextMatch.id, status: 'busy' };

          busyTeamIds.add(nextMatch.team1.id);
          busyTeamIds.add(nextMatch.team2.id);
        }
      }
    }
  });

  if (tournament.system === 'hybrid' && tournament.playoffMatches) {
    const groupMatches = updatedMatches.filter((m) => !m.isPlayoff);
    const playoffMatches = updatedMatches.filter((m) => m.isPlayoff);
    return {
      ...tournament,
      fields: updatedFields,
      matches: groupMatches,
      playoffMatches,
    };
  }

  return {
    ...tournament,
    fields: updatedFields,
    matches: updatedMatches,
  };
};

/**
 * Runs autoAssignFields across all tournaments until state stabilizes
 */
export const autoAssignFieldsAllTournaments = (
  tournaments = [],
  playerMappings = []
) => {
  if (!tournaments || tournaments.length === 0) return tournaments;

  let currentTournaments = [...tournaments];

  // Multi-pass auto assignment to cascade field releases across linked tournaments
  for (let pass = 0; pass < 3; pass++) {
    currentTournaments = currentTournaments.map((t) =>
      autoAssignFields(t, currentTournaments, playerMappings)
    );
  }

  return currentTournaments;
};

/**
 * Manually assign a match to a specific field
 */
export const assignMatchToField = (tournament, matchId, fieldId) => {
  const matches = tournament.system === 'hybrid' && tournament.playoffMatches
    ? [...tournament.matches, ...tournament.playoffMatches]
    : [...tournament.matches];

  const match = matches.find((m) => m.id === matchId);
  if (!match) return tournament;

  const fields = tournament.fields.map((f) => {
    if (f.id === fieldId) {
      return { ...f, currentMatchId: matchId, status: 'busy' };
    }
    if (f.currentMatchId === matchId) {
      return { ...f, currentMatchId: null, status: 'free' };
    }
    return f;
  });

  const updatedMatches = matches.map((m) => {
    if (m.id === matchId) {
      return { ...m, fieldId, status: MATCH_STATUS.ONGOING };
    }
    return m;
  });

  if (tournament.system === 'hybrid' && tournament.playoffMatches) {
    return {
      ...tournament,
      fields,
      matches: updatedMatches.filter((m) => !m.isPlayoff),
      playoffMatches: updatedMatches.filter((m) => m.isPlayoff),
    };
  }

  return { ...tournament, fields, matches: updatedMatches };
};
