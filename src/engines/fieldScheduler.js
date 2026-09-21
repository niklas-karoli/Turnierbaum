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

/**
 * Auto-assigns pending/ready matches to available fields
 */
export const autoAssignFields = (tournament) => {
  if (!tournament || !tournament.fields || tournament.fields.length === 0) {
    return tournament;
  }

  const matches = tournament.system === 'hybrid' && tournament.playoffMatches
    ? [...tournament.matches, ...tournament.playoffMatches]
    : [...tournament.matches];

  const updatedFields = [...tournament.fields];
  let matchesChanged = false;
  const updatedMatches = matches.map((m) => ({ ...m }));

  // Collect teams currently active on a field
  const busyTeamIds = new Set();
  updatedMatches.forEach((m) => {
    if (m.status === MATCH_STATUS.ONGOING) {
      if (m.team1) busyTeamIds.add(m.team1.id);
      if (m.team2) busyTeamIds.add(m.team2.id);
    }
  });

  // Assign free fields to eligible ready matches
  updatedFields.forEach((field, fIdx) => {
    // Check if currently assigned match on field is completed
    if (field.currentMatchId) {
      const activeMatch = updatedMatches.find((m) => m.id === field.currentMatchId);
      if (!activeMatch || activeMatch.status === MATCH_STATUS.COMPLETED) {
        updatedFields[fIdx] = { ...field, currentMatchId: null, status: 'free' };
      }
    }

    // If field is free, assign next ready match
    if (!updatedFields[fIdx].currentMatchId) {
      const nextMatchIdx = updatedMatches.findIndex((m) => {
        if (m.status !== MATCH_STATUS.READY) return false;
        if (m.fieldId && m.fieldId !== field.id) return false; // Already queued elsewhere
        if (!m.team1 || !m.team2) return false;

        // Check if either team is currently playing in another match
        if (busyTeamIds.has(m.team1.id) || busyTeamIds.has(m.team2.id)) {
          return false;
        }

        return true;
      });

      if (nextMatchIdx !== -1) {
        const nextMatch = updatedMatches[nextMatchIdx];
        nextMatch.status = MATCH_STATUS.ONGOING;
        nextMatch.fieldId = field.id;
        updatedFields[fIdx] = { ...field, currentMatchId: nextMatch.id, status: 'busy' };

        // Add teams to busy set
        busyTeamIds.add(nextMatch.team1.id);
        busyTeamIds.add(nextMatch.team2.id);
        matchesChanged = true;
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
 * Manually assign a match to a specific field
 */
export const assignMatchToField = (tournament, matchId, fieldId) => {
  let updated = { ...tournament };
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
