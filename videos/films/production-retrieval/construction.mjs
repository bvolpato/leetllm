import { isCurrent, prClamp } from './arithmetic.mjs';
import { CORPUS, EVAL_DATE } from './fixtures.mjs';
import { allowedRecords, requestPath } from './model.mjs';
export function versionFilterFrame(beat, progress) {
  const seconds = progress * [13.486, 13.518, 12.574][beat],
    ramp = (a, z) => {
      const value = (seconds - a) / (z - a);
      return value >= 1 - 1e-12 ? 1 : value <= 1e-12 ? 0 : value;
    };
  return {
    dateReady: beat >= 2,
    currentProgress: beat < 2 ? 0 : ramp(1.35, 3.35),
    historicalProgress: beat < 2 ? 0 : ramp(3.9, 5.25),
    rows: CORPUS.filter((row) => ['eu-key-v2', 'eu-key-v1'].includes(row.id)).map((row) => ({
      ...row,
      current: isCurrent(row, EVAL_DATE),
    })),
  };
}
export function eligibilityFrame(beat, progress) {
  const seconds = progress * [12.526, 10.83, 13.318][beat],
    ramp = (a, z) => {
      const value = (seconds - a) / (z - a);
      return value >= 1 - 1e-12 ? 1 : value <= 1e-12 ? 0 : value;
    };
  const ageProgress = beat < 1 ? 0 : beat > 1 ? 1 : ramp(6.8, 7.7),
    staleDays = 10 + 5 * ageProgress;
  return {
    seconds,
    ageProgress,
    staleDays,
    signalHours: 48,
    requestVisible: beat > 0 || seconds >= 6.2,
    signalVisible: beat > 0 || seconds >= 7.8,
    ageChecked: beat > 1 || (beat === 1 && seconds >= 0.7),
    signalChecked: beat > 1 || (beat === 1 && seconds >= 2.4),
    outcomeVisible: beat === 1 ? seconds >= 3.8 : beat > 1 && seconds >= 4.2,
    agePass: staleDays <= 14,
    signalPass: 48 <= 48,
    unsupported: beat >= 2,
  };
}
export function scopeSnapshot(beat, progress) {
  const caller = requestPath().caller;
  const count =
    beat > 0
      ? CORPUS.length
      : Math.min(
          CORPUS.length,
          Math.floor(Math.max(0, (progress - 0.12) / 0.68) * (CORPUS.length + 1)),
        );
  const inspected = CORPUS.slice(0, count);
  const admitted = allowedRecords(caller, inspected);
  return {
    caller,
    inspected,
    admitted,
    decisions: inspected.map((record) => ({
      id: record.id,
      status: !isCurrent(record)
        ? 'Expired'
        : record.region !== caller.region
          ? 'Wrong region'
          : !caller.acls.includes(record.acl)
            ? 'ACL denied'
            : 'Admitted',
    })),
  };
}
export function prEvent(state, name, beat) {
  const cue = state.cues?.['pr-' + name];
  if (cue)
    return cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : prClamp(cue.progress ?? 0);
  return (state.beat ?? 0) < beat
    ? 0
    : (state.beat ?? 0) > beat
      ? 1
      : prClamp(((state.beatP ?? 0) - 0.08) / 0.8);
}
