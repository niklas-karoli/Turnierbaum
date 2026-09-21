/**
 * Single Elimination (K.-o.-System) Tournament Generator
 */

import { MATCH_STATUS } from '../types';

/**
 * Calculates the next power of 2 >= n
 */
export const getNextPowerOfTwo = (n) => {
  let p = 1;
  while (p < n) {
    p *= 2;
  }
  return p;
};

/**
 * Generates a Single Elimination bracket.
 * @param {Array} teams Array of team objects { id, name, seed, color }
 * @param {boolean} seeded Whether to seed top teams apart
 */
export const generateSingleElimination = (teams, seeded = false) => {
  const numTeams = teams.length;
  if (numTeams < 2) return { matches: [], rounds: [] };

  const bracketSize = getNextPowerOfTwo(numTeams);
  const totalRounds = Math.log2(bracketSize);

  // Prepare ordered team list
  let orderedTeams = [...teams];
  if (seeded) {
    orderedTeams.sort((a, b) => (a.seed || 999) - (b.seed || 999));
  }

  // Create slot array with BYEs if necessary
  const slots = new Array(bracketSize).fill(null);

  if (seeded) {
    // Standard tournament seeding placement pattern
    const seedPositions = getSeedingPattern(bracketSize);
    for (let i = 0; i < numTeams; i++) {
      slots[seedPositions[i]] = orderedTeams[i];
    }
  } else {
    for (let i = 0; i < numTeams; i++) {
      slots[i] = orderedTeams[i];
    }
  }

  const matches = [];
  const rounds = [];

  // Generate round by round match structures
  let matchCounter = 1;

  // We build from Round 1 up to Final
  // First, map match IDs for each round to connect nextMatchId
  const roundMatchIds = [];

  for (let r = 1; r <= totalRounds; r++) {
    const numMatchesInRound = bracketSize / Math.pow(2, r);
    const currentRoundIds = [];
    for (let m = 0; m < numMatchesInRound; m++) {
      const matchId = `match_r${r}_m${m + 1}`;
      currentRoundIds.push(matchId);
    }
    roundMatchIds.push(currentRoundIds);
    rounds.push({
      roundNumber: r,
      name: getRoundName(r, totalRounds),
      matchIds: currentRoundIds,
    });
  }

  // Build the match objects
  for (let r = 1; r <= totalRounds; r++) {
    const roundMatchesCount = roundMatchIds[r - 1].length;

    for (let m = 0; m < roundMatchesCount; m++) {
      const matchId = roundMatchIds[r - 1][m];
      const nextMatchId = r < totalRounds ? roundMatchIds[r][Math.floor(m / 2)] : null;
      const nextMatchPosition = m % 2 === 0 ? 'team1' : 'team2';

      let team1 = null;
      let team2 = null;
      let status = MATCH_STATUS.PENDING;

      if (r === 1) {
        team1 = slots[m * 2];
        team2 = slots[m * 2 + 1];

        if (team1 && team2) {
          status = MATCH_STATUS.READY;
        } else if (team1 && !team2) {
          // BYE for team1 -> Auto-advance team1
          status = MATCH_STATUS.COMPLETED;
        } else if (!team1 && team2) {
          // BYE for team2 -> Auto-advance team2
          status = MATCH_STATUS.COMPLETED;
        }
      }

      matches.push({
        id: matchId,
        round: r,
        matchIndex: m,
        bracketType: 'winner', // Single elimination is winner bracket
        team1,
        team2,
        score1: (r === 1 && team1 && !team2) ? 1 : (r === 1 && !team1 && team2) ? 0 : null,
        score2: (r === 1 && team1 && !team2) ? 0 : (r === 1 && !team1 && team2) ? 1 : null,
        winnerId: (r === 1 && team1 && !team2) ? team1.id : (r === 1 && !team1 && team2) ? team2.id : null,
        status,
        nextMatchId,
        nextMatchPosition,
        fieldId: null,
      });
    }
  }

  // Propagate BYEs to Round 2 automatically!
  for (const match of matches) {
    if (match.round === 1 && match.status === MATCH_STATUS.COMPLETED && match.winnerId) {
      const winningTeam = match.team1?.id === match.winnerId ? match.team1 : match.team2;
      const nextMatch = matches.find((m) => m.id === match.nextMatchId);
      if (nextMatch) {
        nextMatch[match.nextMatchPosition] = winningTeam;
        if (nextMatch.team1 && nextMatch.team2) {
          nextMatch.status = MATCH_STATUS.READY;
        }
      }
    }
  }

  return { matches, rounds };
};

export const getRoundName = (round, totalRounds) => {
  const diff = totalRounds - round;
  if (diff === 0) return 'Finale';
  if (diff === 1) return 'Halbfinale';
  if (diff === 2) return 'Viertelfinale';
  if (diff === 3) return 'Achtelfinale';
  return `Runde ${round}`;
};

/**
 * Generates standard tournament seeding indices for power-of-2
 */
const getSeedingPattern = (numSlots) => {
  let pattern = [0, 1];
  while (pattern.length < numSlots) {
    const nextPattern = [];
    const length = pattern.length * 2;
    for (let i = 0; i < pattern.length; i++) {
      nextPattern.push(pattern[i]);
      nextPattern.push(length - 1 - pattern[i]);
    }
    pattern = nextPattern;
  }
  return pattern;
};
