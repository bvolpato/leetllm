import { mc } from './arithmetic.mjs';
import {
  CAPACITY_ROUTES,
  EXPERT_OUTPUTS,
  ROUTER_LOGITS,
  ROUTING,
  SKEW_COUNTS,
} from './fixtures.mjs';
import { moeCapacity } from './model.mjs';

export function spokenProgress(api, state, cue, beat, start = 0.12, end = 0.78) {
  const current = state.beat ?? 0;
  const fallback =
    current === beat ? api.phase(state.beatP ?? 0, start, end) : Number(current > beat);
  return api.focus.progress(cue, fallback);
}

// Queue position counts assignments in arrival order. A dropped route leaves its partner's gate intact.
export function queueExample(routes, token, gates, factor = 1, dropless = false) {
  const groups = EXPERT_OUTPUTS.map((_, expert) =>
    routes.flatMap((pair, t) => (pair.includes(expert) ? [t] : [])),
  );
  const capacity = moeCapacity(
    routes.length,
    routes[0].length,
    groups.length,
    factor,
    groups.map((g) => g.length),
  );
  const terms = routes[token].map((expert, i) => {
    const slot = groups[expert].indexOf(token) + 1;
    return {
      expert,
      slot,
      gate: gates[i],
      vector: EXPERT_OUTPUTS[expert],
      runs: dropless || slot <= capacity.slots,
    };
  });
  const output = EXPERT_OUTPUTS[0].map((_, j) =>
    terms.reduce((sum, term) => sum + (term.runs ? term.gate * term.vector[j] : 0), 0),
  );
  return { ...capacity, groups, token, terms, output };
}
export function routerScoreSnapshot(beat, progress) {
  const p = Math.max(0, Math.min(1, progress));
  const softmax = beat > 1 || (beat === 1 && p >= 0.1 / 11.542);
  const zeroX = softmax ? 1040 : 1590;
  const values = softmax ? ROUTING.probabilities : ROUTER_LOGITS;
  return {
    softmax,
    zeroX,
    rows: values.map((value, i) => {
      const entry = beat > 0 ? 1 : Math.max(0, Math.min(1, (p - 0.2 - i * 0.065) / 0.35));
      const opacity = entry * entry * (3 - 2 * entry);
      const width = softmax ? value * 790 : (-value / 3) * 450;
      return {
        value,
        width,
        x: softmax ? zeroX : zeroX - width,
        opacity,
      };
    }),
  };
}
export function overflowReroute(progress) {
  const fraction = Math.max(0, Math.min(1, progress)),
    committed = fraction === 1;
  const routes = CAPACITY_ROUTES.map((experts, token) =>
    token === 4 && committed ? [3, experts[1]] : [...experts],
  );
  const grouped = [0, 1, 2, 3].map((expert) =>
    routes.flatMap((experts, token) => (experts.includes(expert) ? [token] : [])),
  );
  const gates = [0.6, 0.4],
    selected = routes[4];
  return {
    fraction,
    committed,
    token: 4,
    from: 0,
    to: 3,
    gates,
    routes,
    grouped,
    output: [0, 1].map((coordinate) =>
      selected.reduce(
        (sum, expert, index) => sum + gates[index] * EXPERT_OUTPUTS[expert][coordinate],
        0,
      ),
    ),
  };
}
export function trainingSkewSnapshot(beat, beatP) {
  const smooth = (x) => {
    const p = Math.max(0, Math.min(1, x));
    return p * p * (3 - 2 * p);
  };
  const assignedFraction = beat > 0 ? 1 : smooth((beatP - 0.06) / 0.75);
  const gradientFraction = beat < 1 ? 0 : beat > 1 ? 1 : smooth((beatP - 0.02) / 0.145);
  const assigned = SKEW_COUNTS.map((n) => Math.min(n, Math.floor(n * assignedFraction + 1e-9)));
  const contributions = SKEW_COUNTS.map((n) =>
    Math.min(n, Math.floor(n * gradientFraction + 1e-9)),
  );
  const update = beat > 1 || (beat === 1 && beatP >= 0.185);
  const possibleFeedback = beat > 1 || (beat === 1 && beatP >= 0.64);
  return {
    assigned,
    contributions,
    update,
    possibleFeedback,
    collected: contributions.reduce((a, b) => a + b, 0),
    stage: possibleFeedback ? 2 : update ? 1 : 0,
    gradientFraction,
  };
}
export function moeCue(state, id, kind = 'done') {
  const q = state.cues?.['mo-' + id];
  if (!q) return 0;
  if (kind === 'progress')
    return q.phase === 'after'
      ? 1
      : q.phase === 'before'
        ? 0
        : mc((state.t - q.start) / (q.end - q.start));
  if (kind === 'settle') return q.phase === 'after' ? mc((state.t - q.end) / 0.5) : 0;
  return q.phase === 'after';
}
