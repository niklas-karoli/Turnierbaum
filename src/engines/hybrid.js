/**
 * Hybrid Mode (Group Stage + Single Elimination Playoffs)
 */

import { MATCH_STATUS } from '../types';
import { generateRoundRobin, calculateStandings } from './roundRobin';
import { generateSingleElimination } from './singleElimination';

export const generateHybrid = (teams, groupCount = 2, advancingPerGroup = 2) => {
  const numTeams = teams.length;
  if (numTeams < groupCount * 2) {
    throw new Error(`Für ${groupCount} Gruppen werden mindestens ${groupCount * 2} Teams benötigt.`);
  }

  // Shuffle teams randomly into groups
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const groups = [];

  for (let g = 0; g < groupCount; g++) {
    groups.push({
      id: `group_${String.fromCharCode(65 + g)}`, // Group A, Group B, ...
      name: `Gruppe ${String.fromCharCode(65 + g)}`,
      teams: [],
      matches: [],
      rounds: [],
    });
  }

  // Distribute teams evenly across groups
  shuffled.forEach((team, index) => {
    const groupIdx = index % groupCount;
    groups[groupIdx].teams.push(team);
  });

  // Generate round robin matches for each group
  let allMatches = [];
  groups.forEach((group) => {
    const { matches, rounds } = generateRoundRobin(group.teams);
    const taggedMatches = matches.map((m) => ({
      ...m,
      groupId: group.id,
      id: `${group.id}_${m.id}`,
    }));
    group.matches = taggedMatches;
    group.rounds = rounds;
    allMatches = allMatches.concat(taggedMatches);
  });

  return {
    groups,
    matches: allMatches,
    playoffBracket: null, // Generated dynamically when group stage completes
    advancingPerGroup,
    stage: 'group_stage', // 'group_stage' | 'playoff_stage'
  };
};

/**
 * Checks if all group matches are completed and generates playoff bracket if ready
 */
export const checkAndGeneratePlayoffs = (hybridState) => {
  if (hybridState.stage === 'playoff_stage') return hybridState;

  const allGroupMatchesCompleted = hybridState.matches.every(
    (m) => m.status === MATCH_STATUS.COMPLETED
  );

  if (!allGroupMatchesCompleted) return hybridState;

  // Calculate qualified teams from each group
  const qualifiedTeams = [];

  hybridState.groups.forEach((group) => {
    const standings = calculateStandings(group.teams, group.matches);
    const winners = standings.slice(0, hybridState.advancingPerGroup).map((s) => s.team);
    qualifiedTeams.push(...winners);
  });

  // Generate Single Elimination Playoff bracket with qualified teams
  const playoffData = generateSingleElimination(qualifiedTeams, true);

  // Tag playoff matches
  const taggedPlayoffMatches = playoffData.matches.map((m) => ({
    ...m,
    id: `playoff_${m.id}`,
    isPlayoff: true,
  }));

  return {
    ...hybridState,
    stage: 'playoff_stage',
    playoffMatches: taggedPlayoffMatches,
    playoffRounds: playoffData.rounds,
  };
};
