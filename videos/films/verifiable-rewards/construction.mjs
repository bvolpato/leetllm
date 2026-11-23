import { groupStatistics } from './arithmetic.mjs';
import { REWARDS } from './fixtures.mjs';
export function checkedGroupState(beat, progress) {
  const elapsed = Math.max(0, Math.min(1, progress)) * [16.63, 9.07, 18.99][Math.min(beat, 2)];
  const checkTimes = [4.9, 5.6, 6.3, 7.0];
  const checked = beat > 0 ? 4 : checkTimes.filter((time) => elapsed >= time).length;
  const meanVisible = beat > 1 || (beat === 1 && elapsed >= 2.6);
  return {
    elapsed,
    checked,
    checkTimes,
    meanVisible,
    rewards: REWARDS.slice(0, checked),
    mean: checked ? REWARDS.slice(0, checked).reduce((sum, r) => sum + r, 0) / checked : null,
  };
}
export function grpoConstructionState(beat, progress) {
  const elapsed = Math.max(0, Math.min(1, progress)) * [19.582, 8.83, 14.286][Math.min(beat, 2)];
  const fixture =
    beat >= 2 && elapsed >= 2.35
      ? 'all fail'
      : beat >= 2 && elapsed >= 0.8
        ? 'all pass'
        : 'mixed outcomes';
  const rewards =
    fixture === 'all pass' ? [1, 1, 1, 1] : fixture === 'all fail' ? [0, 0, 0, 0] : [...REWARDS];
  const stats = groupStatistics(rewards);
  const meanVisible = beat > 0 || elapsed >= 9.05;
  const centered = rewards.map((value) => value - stats.mean);
  const centeredCount =
    beat > 1 ? 4 : beat === 1 ? [1.5, 1.75, 2, 2.25].filter((time) => elapsed >= time).length : 0;
  const normalizedCount =
    beat > 1 ? 4 : beat === 1 ? [4.25, 4.5, 4.75, 5].filter((time) => elapsed >= time).length : 0;
  const spreadVisible = beat > 1 || (beat === 1 && elapsed >= 3.2);
  return {
    elapsed,
    fixture,
    rewards,
    ...stats,
    centered,
    centeredCount,
    normalizedCount,
    meanVisible,
    spreadVisible,
  };
}
export function arithmeticCheck(beat, progress) {
  const elapsed = progress * 12.55;
  const parts = [10, 4].map((groups) => ({
    groups,
    value: groups * 12,
  }));
  const gather = beat > 0 ? 1 : Math.max(0, Math.min(1, (elapsed - 8.2625) / (9.0375 - 8.2625)));
  return {
    parts,
    total: parts.reduce((sum, part) => sum + part.value, 0),
    gathering: beat > 0 || elapsed >= 8.2625,
    gather,
    resultVisible: beat > 0 || elapsed >= 9.5375,
  };
}
