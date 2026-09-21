import React from 'react';
import { getTeamPlayerNames } from '../utils/playerMapping';

/**
 * Reusable component to render team names along with member player names.
 * Displays inline member summary (e.g., "FC Rakete (Max, Moritz)") and tooltip on hover/click.
 */
export const TeamNameDisplay = ({
  team,
  fallback = 'TBD',
  className = '',
  nameClassName = 'font-semibold text-xs text-slate-200',
  memberClassName = 'text-[10px] text-slate-400 font-normal ml-1',
  showMembersSubtext = true,
}) => {
  if (!team) {
    return <span className={nameClassName}>{fallback}</span>;
  }

  const memberNames = getTeamPlayerNames(team);
  const isSoloOrSame =
    memberNames.length === 0 ||
    (memberNames.length === 1 && memberNames[0] === team.name);

  const membersText = isSoloOrSame ? '' : `(${memberNames.join(', ')})`;
  const tooltipText = isSoloOrSame
    ? `Spieler: ${team.name}`
    : `Team: ${team.name}\nSpieler: ${memberNames.join(', ')}`;

  return (
    <span
      className={`inline-flex items-center flex-wrap gap-1 cursor-help transition hover:text-white ${className}`}
      title={tooltipText}
    >
      <span className={nameClassName}>{team.name}</span>
      {showMembersSubtext && !isSoloOrSame && (
        <span className={memberClassName}>{membersText}</span>
      )}
    </span>
  );
};
