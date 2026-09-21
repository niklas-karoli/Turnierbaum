/**
 * Swiss System Tournament Generator & Pairing Engine
 */

import { MATCH_STATUS } from '../types';

/**
 * Calculates number of recommended Swiss rounds for N teams
 */
export const getRecommendedSwissRounds = (numTeams) => {
  if (numTeams <= 2) return 1;
  return Math.ceil(Math.log2(numTeams));
};

/**
 * Generates Round 1 for Swiss System
 */
export const generateSwissInitial = (teams, totalRounds) => {
  const numTeams = teams.length;
  if (numTeams < 2) return { matches: [], rounds: [], currentRound: 1, totalRounds };

  const matches = [];
  const rounds = [];

  // Create rounds structure
  for (let r = 1; r <= totalRounds; r++) {
    rounds.push({
      roundNumber: r,
      name: `Runde ${r}`,
      matchIds: [],
    });
  }

  // Round 1 pairings
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const round1Ids = [];

  for (let i = 0; i < Math.floor(numTeams / 2); i++) {
    const matchId = `swiss_r1_m${i + 1}`;
    round1Ids.push(matchId);

    matches.push({
      id: matchId,
      round: 1,
      matchIndex: i,
      bracketType: 'swiss',
      team1: shuffled[i * 2],
      team2: shuffled[i * 2 + 1],
      score1: null,
      score2: null,
      winnerId: null,
      status: MATCH_STATUS.READY,
      fieldId: null,
    });
  }

  // Handle odd team BYE in Round 1
  if (numTeams % 2 !== 0) {
    const byeTeam = shuffled[numTeams - 1];
    const byeMatchId = `swiss_r1_m_bye`;
    round1Ids.push(byeMatchId);

    matches.push({
      id: byeMatchId,
      round: 1,
      matchIndex: round1Ids.length - 1,
      bracketType: 'swiss',
      team1: byeTeam,
      team2: null,
      score1: 1,
      score2: 0,
      winnerId: byeTeam.id,
      status: MATCH_STATUS.COMPLETED,
      isBye: true,
      fieldId: null,
    });
  }

  rounds[0].matchIds = round1Ids;

  return { matches, rounds, currentRound: 1, totalRounds };
};

/**
 * Generates next round pairings for Swiss System based on current standings & played history
 */
export const generateNextSwissRound = (tournamentState) => {
  const { teams, matches, rounds, currentRound, totalRounds, rules } = tournamentState;
  const nextRoundNumber = currentRound + 1;

  if (nextRoundNumber > totalRounds) return null; // Tournament completed

  // Calculate current standings
  const teamRecords = teams.map((team) => {
    let points = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let scoreDiff = 0;
    const playedOpponents = new Set();

    matches.forEach((m) => {
      if (m.status !== MATCH_STATUS.COMPLETED) return;
      if (m.team1?.id === team.id) {
        if (m.team2) playedOpponents.add(m.team2.id);
        if (m.score1 > m.score2) { wins++; points += (rules?.pointsWin ?? 3); }
        else if (m.score1 < m.score2) { losses++; points += (rules?.pointsLoss ?? 0); }
        else { draws++; points += (rules?.pointsDraw ?? 1); }
        scoreDiff += ((m.score1 || 0) - (m.score2 || 0));
      } else if (m.team2?.id === team.id) {
        if (m.team1) playedOpponents.add(m.team1.id);
        if (m.score2 > m.score1) { wins++; points += (rules?.pointsWin ?? 3); }
        else if (m.score2 < m.score1) { losses++; points += (rules?.pointsLoss ?? 0); }
        else { draws++; points += (rules?.pointsDraw ?? 1); }
        scoreDiff += ((m.score2 || 0) - (m.score1 || 0));
      }
    });

    return {
      team,
      points,
      wins,
      draws,
      losses,
      scoreDiff,
      playedOpponents,
    };
  });

  // Sort by points desc, then scoreDiff desc
  teamRecords.sort((a, b) => b.points - a.points || b.scoreDiff - a.scoreDiff);

  const available = [...teamRecords];
  const newMatches = [];
  const nextRoundMatchIds = [];
  let matchIndex = 0;

  // Pairing algorithm avoiding repeat matchups
  while (available.length >= 2) {
    const teamA = available.shift();
    let pairedIdx = -1;

    // Find first opponent in available list that teamA hasn't played yet
    for (let i = 0; i < available.length; i++) {
      if (!teamA.playedOpponents.has(available[i].team.id)) {
        pairedIdx = i;
        break;
      }
    }

    // Fallback if everyone left has been played: pick closest in points
    if (pairedIdx === -1) {
      pairedIdx = 0;
    }

    const teamB = available.splice(pairedIdx, 1)[0];
    const matchId = `swiss_r${nextRoundNumber}_m${matchIndex + 1}`;
    nextRoundMatchIds.push(matchId);

    newMatches.push({
      id: matchId,
      round: nextRoundNumber,
      matchIndex,
      bracketType: 'swiss',
      team1: teamA.team,
      team2: teamB.team,
      score1: null,
      score2: null,
      winnerId: null,
      status: MATCH_STATUS.READY,
      fieldId: null,
    });

    matchIndex++;
  }

  // Handle leftover odd team (gets BYE)
  if (available.length === 1) {
    const byeTeam = available[0].team;
    const byeMatchId = `swiss_r${nextRoundNumber}_m_bye`;
    nextRoundMatchIds.push(byeMatchId);

    newMatches.push({
      id: byeMatchId,
      round: nextRoundNumber,
      matchIndex,
      bracketType: 'swiss',
      team1: byeTeam,
      team2: null,
      score1: 1,
      score2: 0,
      winnerId: byeTeam.id,
      status: MATCH_STATUS.COMPLETED,
      isBye: true,
      fieldId: null,
    });
  }

  const updatedMatches = [...matches, ...newMatches];
  const updatedRounds = rounds.map((r) =>
    r.roundNumber === nextRoundNumber ? { ...r, matchIds: nextRoundMatchIds } : r
  );

  return {
    ...tournamentState,
    matches: updatedMatches,
    rounds: updatedRounds,
    currentRound: nextRoundNumber,
  };
};
