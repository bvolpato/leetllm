import { NEXT, OPENING, POLICY_LOGITS } from './fixtures.mjs';
import assert from 'node:assert/strict';
import { createCueTrack } from 'vizmatic';
export const logProbability = (probability) => Math.log(probability);
export const rankPaths = (left, right) =>
  right.logProbability - left.logProbability || left.text.localeCompare(right.text);
export const pathText = (tokens) => tokens.filter((token) => token !== 'EOS').join(' ');
export function beamSearch(width, horizon = 4, conditionals = NEXT) {
  assert.ok(Number.isInteger(width) && width > 0);
  assert.ok(Number.isInteger(horizon) && horizon > 0);
  let active = [
    {
      tokens: [],
      probability: 1,
      logProbability: 0,
    },
  ];
  const completed = [];
  const history = [];
  for (let step = 0; step < horizon; step += 1) {
    const expansions = [];
    for (const prefix of active) {
      const key = prefix.tokens.join(' ');
      const choices = prefix.tokens.length === 0 ? OPENING : (conditionals[key] ?? [['EOS', 1]]);
      assert.ok(
        Math.abs(choices.reduce((sum, [, probability]) => sum + probability, 0) - 1) < 1e-12,
      );
      for (const [token, conditionalProbability] of choices) {
        const candidate = {
          tokens: [...prefix.tokens, token],
          text: pathText([...prefix.tokens, token]),
          parent: key || 'Mia',
          token,
          conditionalProbability,
          probability: prefix.probability * conditionalProbability,
          logProbability: prefix.logProbability + logProbability(conditionalProbability),
          completed: token === 'EOS',
        };
        expansions.push(candidate);
      }
    }
    const unfinished = expansions.filter((candidate) => !candidate.completed).sort(rankPaths);
    const retained = unfinished.slice(0, width);
    const retainedTexts = new Set(retained.map((candidate) => candidate.text));
    const completedThisStep = expansions.filter((candidate) => candidate.completed).sort(rankPaths);
    completed.push(...completedThisStep);
    const rows = expansions.map((candidate) => ({
      ...candidate,
      status: candidate.completed
        ? 'complete'
        : retainedTexts.has(candidate.text)
          ? 'active'
          : 'pruned',
    }));
    history.push({
      step: step + 1,
      expansions: rows,
      active: retained,
      completed: [...completed].sort(rankPaths),
    });
    active = retained;
    if (active.length === 0) break;
  }
  const final = completed
    .map((candidate) => ({
      ...candidate,
      meanLogProbability: candidate.logProbability / candidate.tokens.length,
    }))
    .sort(rankPaths);
  return {
    width,
    horizon,
    history,
    completed: final,
    active,
  };
}
export const WIDTH_TWO = beamSearch(2);
export const WIDTH_THREE = beamSearch(3);
export const rawWinner = (run) => [...run.completed].sort(rankPaths)[0];
export const normalizedWinner = (run) =>
  [...run.completed].sort(
    (a, b) => b.meanLogProbability - a.meanLogProbability || a.text.localeCompare(b.text),
  )[0];
export const candidatesFor = (run) =>
  run.completed.map((candidate) => ({
    text: candidate.text,
    probability: candidate.probability,
    logProbability: candidate.logProbability,
    meanLogProbability: candidate.meanLogProbability,
    meanProbability: Math.exp(candidate.meanLogProbability),
    tokenCount: candidate.tokens.length,
  }));
export const SNAPSHOTS = {
  opening: [
    {
      prompt: 'Mia ...',
      choices: OPENING,
      question: 'Which first word leads to the strongest full sentence?',
    },
    {
      prompt: 'Mia',
      choices: OPENING,
      question: 'Each branch keeps its own identity.',
    },
    {
      prompt: 'Mia',
      choices: OPENING,
      question: 'The future can change the ranking.',
    },
  ],
  probabilities: [
    {
      stage: 'opening',
      choices: OPENING,
      total: OPENING.reduce((sum, [, probability]) => sum + probability, 0),
    },
    {
      stage: 'path-product',
      first: {
        prefix: 'Mia',
        token: 'opened',
        probability: OPENING[0][1],
      },
      second: {
        prefix: 'Mia opened',
        token: 'the',
        probability: NEXT.opened[0][1],
      },
      pathProbability: OPENING[0][1] * NEXT.opened[0][1],
    },
    {
      stage: 'eos',
      prefix: 'Mia opened the door',
      choices: NEXT['opened the door'],
    },
  ],
  'first-beam': [
    {
      width: 2,
      step: 1,
      expansions: OPENING.map(([token, probability]) => ({
        token,
        text: token,
        probability,
        status: 'candidate',
      })),
    },
    {
      width: 2,
      ...WIDTH_TWO.history[0],
    },
    {
      width: 2,
      step: WIDTH_TWO.history[0].step,
      active: WIDTH_TWO.history[0].active,
      expansions: WIDTH_TWO.history[0].expansions,
    },
  ],
  'search-lattice': [1, 2, 3].map((index) => ({
    width: WIDTH_TWO.width,
    step: index + 1,
    history: WIDTH_TWO.history.slice(0, index + 1),
  })),
  stopping: [
    {
      width: WIDTH_THREE.width,
      completed: candidatesFor(WIDTH_THREE),
      active: WIDTH_THREE.active.map((candidate) => candidate.text),
    },
    {
      width: WIDTH_THREE.width,
      completed: candidatesFor(WIDTH_THREE),
      active: WIDTH_THREE.active.map((candidate) => candidate.text),
    },
    {
      width: WIDTH_THREE.width,
      completed: candidatesFor(WIDTH_THREE),
      active: WIDTH_THREE.active.map((candidate) => candidate.text),
    },
  ],
  'length-score': [
    {
      candidates: candidatesFor(WIDTH_THREE),
      winner: rawWinner(WIDTH_THREE).text,
      mode: 'joint',
    },
    {
      candidates: candidatesFor(WIDTH_THREE),
      winner: normalizedWinner(WIDTH_THREE).text,
      mode: 'mean-log',
    },
    {
      candidates: candidatesFor(WIDTH_THREE),
      raw: rawWinner(WIDTH_THREE).text,
      normalized: normalizedWinner(WIDTH_THREE).text,
      mode: 'compare',
    },
  ],
  width: [
    {
      left: WIDTH_TWO.history[0],
      right: WIDTH_THREE.history[0],
      widths: [2, 3],
    },
    {
      counts: [
        WIDTH_TWO.history.reduce((sum, row) => sum + row.expansions.length, 0),
        WIDTH_THREE.history.reduce((sum, row) => sum + row.expansions.length, 0),
      ],
      widths: [2, 3],
    },
    {
      raw: [rawWinner(WIDTH_TWO).text, rawWinner(WIDTH_THREE).text],
      normalized: [normalizedWinner(WIDTH_TWO).text, normalizedWinner(WIDTH_THREE).text],
      widths: [2, 3],
    },
  ],
  synthesis: [
    {
      policy: 'beam width 2',
      score: 'cumulative log probability',
      stop: 'EOS',
      measures: ['task quality', 'latency', 'memory'],
    },
    {
      policy: 'beam width 3',
      score: 'mean log probability',
      stop: 'EOS',
      measures: ['task quality', 'latency', 'memory'],
    },
    {
      policy: 'fixed model and prompt',
      score: 'recorded length rule',
      stop: 'recorded stop rule',
      measures: ['useful answers', 'latency', 'memory'],
    },
  ],
};
export function makeTrack(sceneId, snapshots) {
  return createCueTrack({
    initial: {
      id: `${sceneId}-initial`,
      snapshot: snapshots[0],
    },
    cues: snapshots.map((snapshot, beat) => ({
      id: `${sceneId}-beat-${beat}`,
      beat,
      at: 0,
      snapshot,
    })),
  });
}
export const TRACKS = Object.fromEntries(
  Object.entries(SNAPSHOTS).map(([sceneId, snapshots]) => [sceneId, makeTrack(sceneId, snapshots)]),
);
export const RETAIN_AT = 5.0375 / (13.272 + 0.5);
export const PRUNE_AT = 8.6 / (13.272 + 0.5);
export const retainedOpenings = {
  ...SNAPSHOTS['first-beam'][1],
  expansions: SNAPSHOTS['first-beam'][1].expansions.map((candidate) => ({
    ...candidate,
    status: candidate.status === 'pruned' ? 'candidate' : candidate.status,
  })),
};
// The cached Andrew narration says “retains” at 5.0375 s and “falls” at 8.6 s.
// The cached Andrew narration says “retains” at 5.0375 s and “falls” at 8.6 s.
TRACKS['first-beam'] = createCueTrack({
  initial: {
    id: 'first-beam-candidates',
    snapshot: SNAPSHOTS['first-beam'][0],
  },
  cues: [
    {
      id: 'first-beam-retains',
      beat: 0,
      at: RETAIN_AT,
      snapshot: retainedOpenings,
    },
    {
      id: 'first-beam-prunes',
      beat: 0,
      at: PRUNE_AT,
      snapshot: SNAPSHOTS['first-beam'][1],
    },
    {
      id: 'first-beam-width',
      beat: 1,
      at: 0,
      snapshot: SNAPSHOTS['first-beam'][1],
    },
    {
      id: 'first-beam-frontier',
      beat: 2,
      at: 0,
      snapshot: SNAPSHOTS['first-beam'][2],
    },
  ],
});
export const policyClamp = (x) => Math.max(0, Math.min(1, x));
export const policyEase = (x) => {
  const p = policyClamp(x);
  return p * p * (3 - 2 * p);
};
export function stablePolicy(logits = POLICY_LOGITS, temperature = 1) {
  assert(logits.length && Number.isFinite(temperature) && temperature > 0);
  assert(logits.every((x) => Number.isFinite(x) || x === -Infinity));
  const maximum = Math.max(...logits);
  assert(Number.isFinite(maximum), 'At least one candidate must remain unmasked');
  const shifted = logits.map((x) => (x - maximum) / temperature);
  const weights = shifted.map(Math.exp),
    total = weights.reduce((a, b) => a + b, 0);
  const probabilities = weights.map((x) => x / total);
  return {
    maximum,
    shifted,
    weights,
    total,
    probabilities,
    logProbabilities: shifted.map((x) => x - Math.log(total)),
    entropy: -probabilities.reduce((sum, p) => sum + (p > 0 ? p * Math.log(p) : 0), 0),
  };
}
export function retainedPolicy(probabilities, kind, parameter) {
  assert(probabilities.length && probabilities.every((x) => Number.isFinite(x) && x >= 0));
  const total = probabilities.reduce((a, b) => a + b, 0);
  assert(total > 0);
  const ranked = probabilities
    .map((p, i) => ({
      i,
      p: p / total,
    }))
    .sort((a, b) => b.p - a.p || a.i - b.i);
  let keep;
  if (kind === 'k') {
    assert(Number.isInteger(parameter) && parameter > 0);
    keep = ranked.slice(0, parameter);
  } else if (kind === 'p') {
    assert(parameter > 0 && parameter <= 1);
    let cumulative = 0;
    keep = ranked.filter((row) => {
      const take = row.p > 0 && cumulative < parameter;
      cumulative += row.p;
      return take;
    });
  } else {
    assert(kind === 'min-p' && parameter > 0 && parameter <= 1);
    keep = ranked.filter((row) => row.p > 0 && row.p >= parameter * ranked[0].p);
  }
  const indices = keep.map((row) => row.i),
    mass = indices.reduce((s, i) => s + probabilities[i], 0);
  return {
    indices,
    mass,
    probabilities: probabilities.map((p, i) => (indices.includes(i) ? p / mass : 0)),
  };
}
export function speculativeMass(target, draft) {
  assert(target.length === draft.length && target.length);
  for (const row of [target, draft])
    assert(
      row.every((p) => Number.isFinite(p) && p >= 0) &&
        Math.abs(row.reduce((a, b) => a + b, 0) - 1) < 1e-12,
    );
  const accepted = target.map((p, i) => Math.min(p, draft[i]));
  const residual = target.map((p, i) => Math.max(0, p - draft[i]));
  const rejected = residual.reduce((a, b) => a + b, 0);
  const correction = residual.map((p) => (rejected > 0 ? p / rejected : 0));
  return {
    target,
    draft,
    accepted,
    residual,
    rejected,
    correction,
    restored: accepted.map((p, i) => p + rejected * correction[i]),
    wrongRedraw: accepted.map((p, i) => p + rejected * target[i]),
  };
}
export function widerBeamTrace(width) {
  assert(Number.isInteger(width) && width > 0);
  const choices = (prefix) => {
    if (!prefix.length)
      return [
        ['A', 0.5],
        ['B', 0.3],
        ['C', 0.2],
      ];
    if (prefix.length === 1)
      return prefix[0] === 'A'
        ? [
            ['1', 0.8],
            ['2', 0.18],
            ['3', 0.02],
          ]
        : prefix[0] === 'B'
          ? Array.from(
              {
                length: 10,
              },
              (_, i) => [String(i + 1), 0.1],
            )
          : [
              ['1', 0.5],
              ['2', 0.5],
            ];
    return prefix.join('') === 'A2'
      ? [['win', 1]]
      : Array.from(
          {
            length: 10,
          },
          (_, i) => [String(i + 1), 0.1],
        );
  };
  let active = [
    {
      tokens: [],
      probability: 1,
    },
  ];
  const history = [];
  for (let step = 0; step < 3; step++) {
    const expanded = active.flatMap((parent) =>
      choices(parent.tokens).map(([token, conditional]) => ({
        tokens: [...parent.tokens, token],
        parent: parent.tokens.join(''),
        conditional,
        probability: parent.probability * conditional,
      })),
    );
    expanded.sort(
      (a, b) => b.probability - a.probability || a.tokens.join('').localeCompare(b.tokens.join('')),
    );
    active = expanded.slice(0, width);
    history.push({
      expanded,
      active,
    });
  }
  return {
    width,
    history,
    winner: active[0],
  };
}
export function thoughtTraversal(kind, steps) {
  assert(['breadth', 'depth'].includes(kind));
  const frontier = [0],
    visited = [];
  let current = null;
  for (let n = 0; n < steps && frontier.length; n++) {
    current = frontier.shift();
    visited.push(current);
    const children = current < 3 ? [2 * current + 1, 2 * current + 2] : [];
    if (kind === 'breadth') frontier.push(...children);
    else frontier.unshift(...children);
  }
  return {
    current,
    visited,
    frontier,
  };
}
export function enumByteTrace(token, count = token.length) {
  assert(typeof token === 'string' && /^[\x00-\x7f]*$/.test(token));
  assert(Number.isInteger(count) && count >= 0);
  const prefix = '{"first_step":"',
    allowed = ['create', 'revoke', 'rename'].map((value) => `${prefix}${value}"}`);
  let current = prefix,
    rejected = false,
    rejectionIndex = null;
  const scanned = [];
  for (const byte of token.slice(0, count)) {
    current += byte;
    scanned.push(byte);
    if (!allowed.some((value) => value.startsWith(current))) {
      rejected = true;
      rejectionIndex = scanned.length - 1;
      break;
    }
  }
  const complete = !rejected && allowed.includes(current);
  return {
    scanned,
    rejected,
    rejectionIndex,
    complete,
    eosAllowed: complete,
    tokenInspected: !rejected && scanned.length === token.length,
    current,
  };
}
