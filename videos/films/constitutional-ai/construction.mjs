import { clamp, ramp, softmax } from './arithmetic.mjs';
import { PROBES } from './fixtures.mjs';
export function revisionDistribution(selected, step) {
  const words = ['Please', 'request', 'access', 'through', 'the', 'support', 'portal.'];
  const initial = [0, 1, 0],
    before = softmax(initial);
  const logits = initial.map((value, i) => value - 1.2 * step * (before[i] - (i === 0 ? 1 : 0)));
  const probabilities = softmax(logits);
  return {
    selected,
    words,
    prefix: words.slice(0, selected),
    choices: [words[selected], 'details', 'help'],
    before,
    logits,
    probabilities,
    step,
    loss: -Math.log(probabilities[0]),
    beforeLoss: -Math.log(before[0]),
  };
}
export function supervisedToken(beat, progress, timing) {
  const seconds = progress * [18.622, 11.47, 18.654][beat];
  const step =
    timing?.step ??
    (beat === 0 ? ramp(seconds, 14.7, 16.4) : beat === 1 ? ramp(seconds, 6.8, 9.25) : 1);
  return {
    ...revisionDistribution(beat === 0 ? 0 : 2, step),
    seconds,
    distributionReady: timing?.distributionReady ?? (beat > 0 || seconds >= 5.6),
    lossReady: timing?.lossReady ?? (beat > 0 || seconds >= 11.5),
  };
}
export function probeFrame(beat, progress, timing = {}) {
  const seconds = progress * [18.07, 11.518, 11.502][beat];
  const visible =
      timing.visible ?? (beat > 0 ? PROBES.length : PROBES.filter((x) => seconds >= x.at).length),
    rows = PROBES.slice(0, visible);
  return {
    seconds,
    visible,
    rows,
    permitted: rows.filter((x) => x.permitted).length,
    forbidden: rows.filter((x) => !x.permitted).length,
    falseRefusals: rows.filter((x) => x.permitted && x.refused).length,
    disclosures: rows.filter((x) => !x.permitted && x.disclosed).length,
    focus: timing.focus ?? (beat === 1 ? (seconds < 3 ? 'refusal' : 'disclosure') : null),
    runtimeDenied: timing.runtimeDenied ?? (beat === 2 && seconds >= 1.65),
  };
}
export function voice(state, id, beat = 0) {
  const b = state.beat ?? 0,
    c = state.cues?.[id];
  return c
    ? c.phase === 'before'
      ? 0
      : c.phase === 'after'
        ? 1
        : clamp(c.progress)
    : b < beat
      ? 0
      : b > beat
        ? 1
        : clamp(((state.beatP ?? 0) - 0.12) / 0.75);
}
export function completed(state, id, beat = 0) {
  const cue = state.cues?.[id];
  return cue ? cue.phase === 'after' : voice(state, id, beat) === 1;
}
export function logicalState(scene, state) {
  if (state.constitutionalLogical) return state;
  const raw = state.beat ?? 0,
    beat =
      scene === 'order-normalization'
        ? raw < 2
          ? 0
          : 1
        : scene === 'policy-rl'
          ? Math.min(raw, 1)
          : raw;
  return {
    ...state,
    beat,
    constitutionalLogical: true,
  };
}
export function chapterFrame(scene, state) {
  state = logicalState(scene, state);
  const at = (id, beat = 0) => voice(state, id, beat),
    seen = (id, beat = 0) => at(id, beat) > 0,
    done = (id, beat = 0) => completed(state, id, beat);
  if (scene === 'order-normalization')
    return {
      first: at('order-first'),
      swapped: at('order-swapped'),
      remapped: done('order-remap'),
      mean: done('order-normalization-1'),
      clamp: at('clamp-target', 1),
    };
  if (scene === 'policy-rl')
    return {
      candidate: at('policy-candidate'),
      reward: done('policy-rl-1'),
      kl: done('policy-kl'),
      penalty: done('policy-penalty', 1),
      baseObjective: done('policy-base-objective', 1),
      changed: done('policy-rl-2', 1),
      changedAnswer: done('policy-changed-answer', 1),
    };
  if (scene === 'multi-turn')
    return {
      pairs: ['turn-one', 'turn-two', 'turn-three'].filter((id) => seen(id)).length,
      disclosed: seen('turn-answer'),
      roleChanged: seen('role-change', 1),
      stopped: done('multi-turn-1'),
    };
  if (scene === 'evaluate')
    return {
      answer: done('release-answer', 4),
      benign: seen('release-benign', 5),
      benignRates: done('release-benign-rates', 5),
      attacks: seen('release-attacks', 6),
      attackRates: done('release-counts', 7),
    };
  throw new Error('Unknown timed chapter ' + scene);
}
