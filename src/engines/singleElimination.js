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
 * @param {Object} options Configuration options ({ enableThirdPlaceMatch, enableConsolationRound })
 */
export const generateSingleElimination = (teams, seeded = false, options = {}) => {
  const numTeams = teams.length;
  if (numTeams < 2) return { matches: [], rounds: [] };

  const { enableThirdPlaceMatch = true, enableConsolationRound = false } = options;

  const bracketSize = getNextPowerOfTwo(numTeams);
  const totalRounds = Math.log2(bracketSize);

  let orderedTeams = [...teams];
  if (seeded) {
    orderedTeams.sort((a, b) => (a.seed || 999) - (b.seed || 999));
  }

  const numMatchesR1 = bracketSize / 2;
  const numByes = bracketSize - numTeams;
  const numPlayIns = numTeams - numMatchesR1;

  const r1MatchesTeams = new Array(numMatchesR1).fill(null).map(() => ({ team1: null, team2: null }));

  if (seeded) {
    const seedPositions = getSeedingPattern(bracketSize);
    const slots = new Array(bracketSize).fill(null);
    for (let i = 0; i < numTeams; i++) {
      slots[seedPositions[i]] = orderedTeams[i];
    }
    for (let m = 0; m < numMatchesR1; m++) {
      r1MatchesTeams[m].team1 = slots[m * 2];
      r1MatchesTeams[m].team2 = slots[m * 2 + 1];
    }
  } else {
    let byeCount = 0;
    let teamIdx = 0;

    const byeMatchesIndices = [];
    for (let i = 0; i < numMatchesR1; i++) {
      const idx = i % 2 === 0 ? Math.floor(i / 2) : numMatchesR1 - 1 - Math.floor(i / 2);
      if (byeCount < numByes) {
        byeMatchesIndices.push(idx);
        byeCount++;
      }
    }

    const playInIndices = [];
    for (let m = 0; m < numMatchesR1; m++) {
      if (byeMatchesIndices.includes(m)) {
        r1MatchesTeams[m].team1 = orderedTeams[teamIdx++];
        r1MatchesTeams[m].team2 = null;
      } else {
        playInIndices.push(m);
      }
    }

    for (const m of playInIndices) {
      r1MatchesTeams[m].team1 = orderedTeams[teamIdx++] || null;
      r1MatchesTeams[m].team2 = orderedTeams[teamIdx++] || null;
    }
  }

  const matches = [];
  const rounds = [];

  const roundMatchIds = [];
  for (let r = 1; r <= totalRounds; r++) {
    const numMatchesInRound = bracketSize / Math.pow(2, r);
    const currentRoundIds = [];
    for (let m = 0; m < numMatchesInRound; m++) {
      currentRoundIds.push(`match_r${r}_m${m + 1}`);
    }
    roundMatchIds.push(currentRoundIds);
    rounds.push({
      roundNumber: r,
      name: getRoundName(r, totalRounds),
      matchIds: currentRoundIds,
    });
  }

  // Include 3rd place match in final round matchIds if enabled
  if (enableThirdPlaceMatch && totalRounds >= 2) {
    rounds[rounds.length - 1].matchIds.push('match_3rd_place');
  }

  for (let r = 1; r <= totalRounds; r++) {
    const roundMatchesCount = roundMatchIds[r - 1].length;

    for (let m = 0; m < roundMatchesCount; m++) {
      const matchId = roundMatchIds[r - 1][m];
      const nextMatchId = r < totalRounds ? roundMatchIds[r][Math.floor(m / 2)] : null;
      const nextMatchPosition = m % 2 === 0 ? 'team1' : 'team2';

      let team1 = null;
      let team2 = null;
      let status = MATCH_STATUS.PENDING;
      let isBye = false;

      if (r === 1) {
        team1 = r1MatchesTeams[m].team1;
        team2 = r1MatchesTeams[m].team2;

        if (team1 && team2) {
          status = MATCH_STATUS.READY;
        } else if (team1 && !team2) {
          status = MATCH_STATUS.COMPLETED;
          isBye = true;
        } else if (!team1 && team2) {
          status = MATCH_STATUS.COMPLETED;
          isBye = true;
        }
      }

      const loserNextMatchId = (enableThirdPlaceMatch && r === totalRounds - 1 && totalRounds >= 2)
        ? 'match_3rd_place'
        : null;
      const loserNextMatchPosition = m % 2 === 0 ? 'team1' : 'team2';

      matches.push({
        id: matchId,
        round: r,
        matchIndex: m,
        bracketType: 'winner',
        team1,
        team2,
        score1: (r === 1 && isBye && team1) ? 1 : (r === 1 && isBye && team2) ? 0 : null,
        score2: (r === 1 && isBye && team1) ? 0 : (r === 1 && isBye && team2) ? 1 : null,
        winnerId: (r === 1 && isBye && team1) ? team1.id : (r === 1 && isBye && team2) ? team2.id : null,
        loserId: null,
        status,
        isBye,
        nextMatchId,
        nextMatchPosition,
        loserNextMatchId,
        loserNextMatchPosition,
        fieldId: null,
      });
    }
  }

  // Create 3rd place match
  if (enableThirdPlaceMatch && totalRounds >= 2) {
    matches.push({
      id: 'match_3rd_place',
      round: totalRounds,
      matchIndex: 1,
      bracketType: 'third_place',
      name: 'Spiel um Platz 3',
      team1: null,
      team2: null,
      score1: null,
      score2: null,
      winnerId: null,
      loserId: null,
      status: MATCH_STATUS.PENDING,
      nextMatchId: null,
      fieldId: null,
    });
  }

  // Consolation round for R1 losers
  if (enableConsolationRound && numPlayIns >= 2) {
    const consolationMatchCount = Math.floor(numPlayIns / 2);
    const consolationMatchIds = [];
    for (let c = 0; c < consolationMatchCount; c++) {
      const matchId = `match_consolation_m${c + 1}`;
      consolationMatchIds.push(matchId);
      matches.push({
        id: matchId,
        round: 1,
        matchIndex: c + 100,
        bracketType: 'consolation',
        name: `Platzierungsspiel ${c + 1}`,
        team1: null,
        team2: null,
        score1: null,
        score2: null,
        winnerId: null,
        loserId: null,
        status: MATCH_STATUS.PENDING,
        nextMatchId: null,
        fieldId: null,
      });
    }

    let cIdx = 0;
    for (const match of matches) {
      if (match.round === 1 && !match.isBye && match.team1 && match.team2) {
        if (cIdx < consolationMatchCount * 2) {
          match.loserNextMatchId = consolationMatchIds[Math.floor(cIdx / 2)];
          match.loserNextMatchPosition = cIdx % 2 === 0 ? 'team1' : 'team2';
          cIdx++;
        }
      }
    }

    rounds.push({
      roundNumber: 99,
      name: 'Trostrunde',
      bracketType: 'consolation',
      matchIds: consolationMatchIds,
    });
  }

  // Propagate BYEs to Round 2
  for (const match of matches) {
    if (match.round === 1 && match.isBye && match.status === MATCH_STATUS.COMPLETED && match.winnerId) {
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
