/**
 * Double Elimination Tournament Generator
 */

import { MATCH_STATUS } from '../types';
import { getNextPowerOfTwo } from './singleElimination';

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

/**
 * Generates a Double Elimination bracket with proper Byes support.
 */
export const generateDoubleElimination = (teams, seeded = false, _options = {}) => {
  const numTeams = teams.length;
  if (numTeams < 2) return { matches: [], rounds: [] };

  const bracketSize = getNextPowerOfTwo(numTeams);
  const totalWbRounds = Math.log2(bracketSize);

  let orderedTeams = [...teams];
  if (seeded) {
    orderedTeams.sort((a, b) => (a.seed || 999) - (b.seed || 999));
  }

  const numMatchesR1 = bracketSize / 2;
  const numByes = bracketSize - numTeams;

  // Assign teams to WB R1 matches
  const wbR1MatchesTeams = new Array(numMatchesR1).fill(null).map(() => ({ team1: null, team2: null }));

  if (seeded) {
    const seedPositions = getSeedingPattern(bracketSize);
    const slots = new Array(bracketSize).fill(null);
    for (let i = 0; i < numTeams; i++) {
      slots[seedPositions[i]] = orderedTeams[i];
    }
    for (let m = 0; m < numMatchesR1; m++) {
      wbR1MatchesTeams[m].team1 = slots[m * 2];
      wbR1MatchesTeams[m].team2 = slots[m * 2 + 1];
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
        wbR1MatchesTeams[m].team1 = orderedTeams[teamIdx++];
        wbR1MatchesTeams[m].team2 = null;
      } else {
        playInIndices.push(m);
      }
    }

    for (const m of playInIndices) {
      wbR1MatchesTeams[m].team1 = orderedTeams[teamIdx++] || null;
      wbR1MatchesTeams[m].team2 = orderedTeams[teamIdx++] || null;
    }
  }

  const matches = [];
  const rounds = [];

  // 1. Generate Winner Bracket (WB)
  const wbRoundMatchIds = [];
  for (let r = 1; r <= totalWbRounds; r++) {
    const numMatchesInRound = bracketSize / Math.pow(2, r);
    const currentRoundIds = [];
    for (let m = 0; m < numMatchesInRound; m++) {
      currentRoundIds.push(`wb_r${r}_m${m + 1}`);
    }
    wbRoundMatchIds.push(currentRoundIds);
    rounds.push({
      roundNumber: r,
      name: `Gewinner-Runde ${r}` + (r === totalWbRounds ? ' (WB-Finale)' : ''),
      bracketType: 'winner',
      matchIds: currentRoundIds,
    });
  }

  for (let r = 1; r <= totalWbRounds; r++) {
    const count = wbRoundMatchIds[r - 1].length;
    for (let m = 0; m < count; m++) {
      const matchId = wbRoundMatchIds[r - 1][m];
      const nextMatchId = r < totalWbRounds ? wbRoundMatchIds[r][Math.floor(m / 2)] : 'grand_final';
      const nextMatchPosition = r < totalWbRounds ? (m % 2 === 0 ? 'team1' : 'team2') : 'team1';

      let team1 = null;
      let team2 = null;
      let status = MATCH_STATUS.PENDING;
      let isBye = false;

      if (r === 1) {
        team1 = wbR1MatchesTeams[m].team1;
        team2 = wbR1MatchesTeams[m].team2;

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
        loserNextMatchId: isBye ? null : `lb_r${r === 1 ? 1 : (r - 1) * 2}_m${Math.floor(m / 2) + 1}`,
        loserNextMatchPosition: m % 2 === 0 ? 'team1' : 'team2',
        fieldId: null,
      });
    }
  }

  // 2. Generate Loser Bracket (LB)
  const totalLbRounds = (totalWbRounds - 1) * 2;
  const lbRoundMatchIds = [];

  let currentLbMatchesCount = bracketSize / 4;
  for (let r = 1; r <= totalLbRounds; r++) {
    const currentRoundIds = [];
    const numMatches = currentLbMatchesCount;
    for (let m = 0; m < numMatches; m++) {
      currentRoundIds.push(`lb_r${r}_m${m + 1}`);
    }
    lbRoundMatchIds.push(currentRoundIds);
    rounds.push({
      roundNumber: totalWbRounds + r,
      name: `Verlierer-Runde ${r}` + (r === totalLbRounds ? ' (LB-Finale)' : ''),
      bracketType: 'loser',
      matchIds: currentRoundIds,
    });

    if (r % 2 === 0) {
      currentLbMatchesCount = Math.max(1, currentLbMatchesCount / 2);
    }
  }

  for (let r = 1; r <= totalLbRounds; r++) {
    const count = lbRoundMatchIds[r - 1].length;
    for (let m = 0; m < count; m++) {
      const matchId = lbRoundMatchIds[r - 1][m];
      const isLastLbRound = r === totalLbRounds;
      const nextMatchId = isLastLbRound ? 'grand_final' : lbRoundMatchIds[r][r % 2 === 1 ? m : Math.floor(m / 2)];
      const nextMatchPosition = isLastLbRound ? 'team2' : (r % 2 === 1 ? 'team2' : (m % 2 === 0 ? 'team1' : 'team2'));

      matches.push({
        id: matchId,
        round: r,
        matchIndex: m,
        bracketType: 'loser',
        team1: null,
        team2: null,
        score1: null,
        score2: null,
        winnerId: null,
        loserId: null,
        status: MATCH_STATUS.PENDING,
        nextMatchId,
        nextMatchPosition,
        fieldId: null,
      });
    }
  }

  // 3. Grand Final
  rounds.push({
    roundNumber: totalWbRounds + totalLbRounds + 1,
    name: 'Finale (Grand Final)',
    bracketType: 'grand_final',
    matchIds: ['grand_final'],
  });

  matches.push({
    id: 'grand_final',
    round: totalWbRounds + totalLbRounds + 1,
    matchIndex: 0,
    bracketType: 'grand_final',
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

  // Handle Round 1 WB BYEs propagation
  for (const match of matches) {
    if (match.round === 1 && match.bracketType === 'winner' && match.isBye && match.status === MATCH_STATUS.COMPLETED && match.winnerId) {
      const winningTeam = match.team1?.id === match.winnerId ? match.team1 : match.team2;
      const nextWbMatch = matches.find((m) => m.id === match.nextMatchId);
      if (nextWbMatch) {
        nextWbMatch[match.nextMatchPosition] = winningTeam;
        if (nextWbMatch.team1 && nextWbMatch.team2) {
          nextWbMatch.status = MATCH_STATUS.READY;
        }
      }
    }
  }

  return { matches, rounds };
};
