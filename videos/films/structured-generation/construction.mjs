import { recursivePrefix } from './model.mjs';
export function recursiveConstructionState(fresh, aProgress, bProgress) {
  const depth = fresh ? 4 : 3,
    prefix = '{"child":'.repeat(depth - 1) + '{';
  const a = '}'.repeat(depth),
    bad = fresh ? '}}}!' : '}}]';
  const aTrial = recursivePrefix(
    prefix + a.slice(0, Math.floor(Math.max(0, Math.min(1, aProgress)) * a.length)),
  );
  const bTrial = recursivePrefix(
    prefix + bad.slice(0, Math.floor(Math.max(0, Math.min(1, bProgress)) * bad.length)),
  );
  const accepted = aProgress >= 1,
    rejected = bProgress >= 1;
  const committed = recursivePrefix(accepted ? prefix + a : prefix);
  return {
    depth,
    prefix,
    a,
    bad,
    accepted,
    rejected,
    aTrial,
    bTrial,
    committed,
    committedPrefix: accepted ? prefix + a : prefix,
    alternativeStartsFrom: prefix,
  };
}
export function maskScheduleClock(state) {
  const p = (id) => Math.max(0, Math.min(1, state.cues?.[id]?.progress ?? 0)),
    b = state.beat ?? 0;
  if (b === 0) return 12 * p('sg-schedule-serial');
  if (b === 1) {
    const result = p('sg-schedule-result'),
      gpu = p('sg-schedule-gpu');
    return result > 0 ? 8 + result : gpu > 0 ? 3 + 5 * gpu : 3 * p('sg-schedule-mask');
  }
  const result = p('sg-schedule-slow-result'),
    wait = p('sg-schedule-wait');
  return result > 0 ? 10 + result : wait > 0 ? 8 + 2 * wait : 0;
}
