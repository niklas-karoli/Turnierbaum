/**
 * Double Elimination Tournament Generator
 */

import { MATCH_STATUS } from '../types';
import { getNextPowerOfTwo, getRoundName } from './singleElimination';

export const generateDoubleElimination = (teams, seeded = false) => {
  const numTeams = teams.length;
  if (numTeams < 2) return { matches: [], rounds: [] };

  const bracketSize = getNextPowerOfTwo(numTeams);
  const totalWbRounds = Math.log2(bracketSize);

  let orderedTeams = [...teams];
  if (seeded) {
    orderedTeams.sort((a, b) => (a.seed || 999) - (b.seed || 999));
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

      if (r === 1) {
        team1 = orderedTeams[m * 2] || null;
        team2 = orderedTeams[m * 2 + 1] || null;

        if (team1 && team2) {
          status = MATCH_STATUS.READY;
        } else if (team1 && !team2) {
          status = MATCH_STATUS.COMPLETED;
        } else if (!team1 && team2) {
          status = MATCH_STATUS.COMPLETED;
        }
      }

      matches.push({
        id: matchId,
        round: r,
        matchIndex: m,
        bracketType: 'winner',
        team1,
        team2,
        score1: (r === 1 && team1 && !team2) ? 1 : 0,
        score2: (r === 1 && !team1 && team2) ? 1 : 0,
        winnerId: (r === 1 && team1 && !team2) ? team1.id : (r === 1 && !team1 && team2) ? team2.id : null,
        loserId: null,
        status,
        nextMatchId,
        nextMatchPosition,
        loserNextMatchId: `lb_r${r === 1 ? 1 : (r - 1) * 2}_m${Math.floor(m / 2) + 1}`,
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
    team1: null, // Winner of WB
    team2: null, // Winner of LB
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
    if (match.round === 1 && match.bracketType === 'winner' && match.status === MATCH_STATUS.COMPLETED && match.winnerId) {
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
