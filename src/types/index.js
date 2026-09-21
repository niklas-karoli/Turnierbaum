/**
 * Tournament Types & Constants
 */

export const TOURNAMENT_SYSTEMS = {
  SINGLE_ELIMINATION: 'single_elimination',
  DOUBLE_ELIMINATION: 'double_elimination',
  ROUND_ROBIN: 'round_robin',
  HYBRID: 'hybrid', // Group Stage + Playoffs
  SWISS: 'swiss',
};

export const TOURNAMENT_SYSTEM_NAMES = {
  [TOURNAMENT_SYSTEMS.SINGLE_ELIMINATION]: 'K.-o.-System (Single Elimination)',
  [TOURNAMENT_SYSTEMS.DOUBLE_ELIMINATION]: 'Double Elimination',
  [TOURNAMENT_SYSTEMS.ROUND_ROBIN]: 'Jeder-gegen-Jeden (Liga)',
  [TOURNAMENT_SYSTEMS.HYBRID]: 'Hybrid (Gruppenphase + K.-o.)',
  [TOURNAMENT_SYSTEMS.SWISS]: 'Schweizer System (Swiss)',
};

export const MATCH_STATUS = {
  PENDING: 'pending',     // Waiting for teams or prerequisite matches
  READY: 'ready',       // Both teams known, ready to be played
  ONGOING: 'ongoing',     // Currently playing on a field
  COMPLETED: 'completed', // Result recorded
};

export const DEFAULT_RULES = {
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  tieBreakers: ['points', 'goalDiff', 'goalsScored', 'directComparison'], // Priority
  matchDurationMinutes: 10,
};

export const TEAM_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow/Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];
