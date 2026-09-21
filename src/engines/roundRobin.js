/**
 * Round Robin (Jeder-gegen-Jeden / Liga) Tournament Generator & Standings Engine
 */

import { MATCH_STATUS, DEFAULT_RULES } from '../types';

/**
 * Generates all round robin fixtures using the polygon/circle method
 */
export const generateRoundRobin = (teams) => {
  const numTeams = teams.length;
  if (numTeams < 2) return { matches: [], rounds: [] };

  const isOdd = numTeams % 2 !== 0;
  const teamList = [...teams];
  if (isOdd) {
    teamList.push({ id: '__BYE__', name: 'Freilos', isBye: true });
  }

  const n = teamList.length;
  const totalRounds = n - 1;
  const matchesPerRound = n / 2;

  const matches = [];
  const rounds = [];

  for (let r = 0; r < totalRounds; r++) {
    const roundNumber = r + 1;
    const currentRoundIds = [];

    for (let i = 0; i < matchesPerRound; i++) {
      const home = (r + i) % (n - 1);
      let away = (n - 1 - i + r) % (n - 1);

      if (i === 0) {
        away = n - 1;
      }

      const team1 = teamList[home];
      const team2 = teamList[away];

      // Skip BYE matches
      if (team1.isBye || team2.isBye) {
        continue;
      }

      const matchId = `rr_r${roundNumber}_m${i + 1}`;
      currentRoundIds.push(matchId);

      matches.push({
        id: matchId,
        round: roundNumber,
        matchIndex: i,
        bracketType: 'round_robin',
        team1,
        team2,
        score1: null,
        score2: null,
        winnerId: null,
        status: MATCH_STATUS.READY,
        fieldId: null,
      });
    }

    rounds.push({
      roundNumber,
      name: `Spieltag ${roundNumber}`,
      matchIds: currentRoundIds,
    });
  }

  return { matches, rounds };
};

/**
 * Calculates Round Robin Standings based on match results and configured rules
 */
export const calculateStandings = (teams, matches, rules = DEFAULT_RULES) => {
  const standingsMap = {};

  // Initialize statistics for each team
  teams.forEach((team) => {
    standingsMap[team.id] = {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    };
  });

  // Calculate results from completed matches
  matches.forEach((match) => {
    if (match.status !== MATCH_STATUS.COMPLETED) return;
    if (match.score1 === null || match.score2 === null) return;

    const t1Stats = standingsMap[match.team1?.id];
    const t2Stats = standingsMap[match.team2?.id];

    if (!t1Stats || !t2Stats) return;

    t1Stats.played += 1;
    t2Stats.played += 1;

    t1Stats.goalsFor += match.score1;
    t1Stats.goalsAgainst += match.score2;

    t2Stats.goalsFor += match.score2;
    t2Stats.goalsAgainst += match.score1;

    if (match.score1 > match.score2) {
      t1Stats.won += 1;
      t1Stats.points += rules.pointsWin ?? 3;
      t2Stats.lost += 1;
      t2Stats.points += rules.pointsLoss ?? 0;
    } else if (match.score2 > match.score1) {
      t2Stats.won += 1;
      t2Stats.points += rules.pointsWin ?? 3;
      t1Stats.lost += 1;
      t1Stats.points += rules.pointsLoss ?? 0;
    } else {
      t1Stats.drawn += 1;
      t1Stats.points += rules.pointsDraw ?? 1;
      t2Stats.drawn += 1;
      t2Stats.points += rules.pointsDraw ?? 1;
    }
  });

  // Calculate goal differences
  Object.values(standingsMap).forEach((stat) => {
    stat.goalDiff = stat.goalsFor - stat.goalsAgainst;
  });

  // Convert to array and sort by tie-breaker rules
  const standings = Object.values(standingsMap);

  standings.sort((a, b) => {
    // Primary: Points
    if (b.points !== a.points) return b.points - a.points;

    // Secondary: Goal Difference
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;

    // Tertiary: Goals Scored
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

    // Quaternary: Direct Comparison (Head-to-head)
    const h2hMatch = matches.find(
      (m) =>
        m.status === MATCH_STATUS.COMPLETED &&
        ((m.team1?.id === a.team.id && m.team2?.id === b.team.id) ||
         (m.team1?.id === b.team.id && m.team2?.id === a.team.id))
    );

    if (h2hMatch) {
      if (h2hMatch.team1.id === a.team.id) {
        if (h2hMatch.score1 !== h2hMatch.score2) {
          return h2hMatch.score2 - h2hMatch.score1;
        }
      } else {
        if (h2hMatch.score1 !== h2hMatch.score2) {
          return h2hMatch.score1 - h2hMatch.score2;
        }
      }
    }

    // Default alphabetical
    return a.team.name.localeCompare(b.team.name);
  });

  // Assign ranks
  standings.forEach((item, index) => {
    item.rank = index + 1;
  });

  return standings;
};
