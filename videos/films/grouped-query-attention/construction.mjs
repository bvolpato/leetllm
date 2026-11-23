import { clamp, dot, softmax } from './arithmetic.mjs';
import { HEADS, KV_KEYS, KV_VALUES, QUERY_VECTORS } from './fixtures.mjs';
import { cacheBytes, kvGroupForQuery, meanVisible, physicalHeads } from './model.mjs';
import { createCueTrack } from 'vizmatic';
export const ATTENTION = Object.freeze(
  QUERY_VECTORS.map((query, head) => {
    const group = kvGroupForQuery(head);
    const scores = KV_KEYS[group].map((key) => dot(query, key) / Math.sqrt(query.length));
    const weights = softmax(scores);
    const output = KV_VALUES[group][0].map((_, coordinate) =>
      weights.reduce((sum, weight, index) => sum + weight * KV_VALUES[group][index][coordinate], 0),
    );
    return {
      head,
      group,
      scores,
      weights,
      output,
    };
  }),
);
export const SNAPSHOTS = {
  opening: [
    {
      tokens: 1,
      title: 'One new token adds another history row',
    },
    {
      tokens: 2,
      title: 'Every live request retains its growing history',
    },
    {
      tokens: 3,
      title: 'Fewer stored heads reduce the same history',
    },
  ],
  attention: [
    {
      heads: [0],
      output: false,
    },
    {
      heads: [0, 1],
      output: false,
    },
    {
      heads: [0, 1],
      output: true,
    },
  ],
  map: [
    {
      visible: 2,
      activeGroup: 0,
      assignments: [0, 0, 0, 0, 1, 1, 1, 1],
    },
    {
      visible: 6,
      activeGroup: 1,
      assignments: [0, 0, 0, 0, 1, 1, 1, 1],
    },
    {
      visible: 8,
      activeGroup: -1,
      assignments: [0, 0, 0, 0, 1, 1, 1, 1],
    },
  ],
  architectures: [
    {
      active: 'MHA',
      kvHeads: 8,
    },
    {
      active: 'GQA',
      kvHeads: 2,
    },
    {
      active: 'MQA',
      kvHeads: 1,
    },
  ],
  tensors: [
    {
      active: 'MHA',
      kvHeads: 8,
    },
    {
      active: 'GQA',
      kvHeads: 2,
    },
    {
      active: 'formula',
      kvHeads: 2,
    },
  ],
  budget: ['MHA', 'GQA', 'MQA'].map((active) => ({
    tokens: HEADS.tokens,
    active,
    mha: cacheBytes({
      tokens: HEADS.tokens,
      kvHeads: 8,
    }),
    gqa: cacheBytes({
      tokens: HEADS.tokens,
      kvHeads: 2,
    }),
    mqa: cacheBytes({
      tokens: HEADS.tokens,
      kvHeads: 1,
    }),
  })),
  tradeoff: [
    {
      stage: 0,
      pooled: false,
      gates: [],
    },
    {
      stage: 1,
      pooled: true,
      gates: ['parity', 'quality'],
    },
    {
      stage: 2,
      pooled: true,
      gates: ['parity', 'quality', 'serving'],
    },
  ],
  synthesis: [
    {
      stage: 0,
      active: ['heads', 'mapping'],
    },
    {
      stage: 1,
      active: ['shapes', 'bytes', 'layout'],
    },
    {
      stage: 2,
      active: ['quality', 'latency', 'throughput'],
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
  Object.entries(SNAPSHOTS).map(([id, snapshots]) => [id, makeTrack(id, snapshots)]),
);
export function chapterModel(id, state = {}) {
  const beat = state.beat ?? 0,
    cue = state.cues?.[`${id}-${beat}`],
    p = cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : clamp(cue.progress)
      : clamp(((state.beatP ?? 0) - 0.1) / 0.75);
  return {
    beat,
    p,
    flops: 4 * 64 * 3 * 4,
    readBytes: 2 * 8 * 3 * 4 * 2,
    intensity: 8,
    ridge: 989.5 / 3.35,
    large: [64, 8, 1].map((kv) =>
      cacheBytes({
        layers: 80,
        batch: 32,
        tokens: 4096,
        kvHeads: kv,
        width: 128,
        bytes: 2,
      }),
    ),
    oldOutput: 10 / (1 + Math.exp(-2)),
    pooledOutput: 5,
    rotation: [
      5 * Math.cos((p * Math.PI) / 2) - 2 * Math.sin((p * Math.PI) / 2),
      5 * Math.sin((p * Math.PI) / 2) + 2 * Math.cos((p * Math.PI) / 2),
    ],
    rankPlan: physicalHeads(64, 8, beat === 0 ? 4 : 16),
    latentNumbers: 512 + 64,
    contentExpanded: [5, 2],
    absorbed: [1, 2],
    valueLatent: [2.5, 0.5],
    valueExpanded: [3.5, 0.5],
    latest: meanVisible([1, 2, 9]),
    ending: physicalHeads(48, 6, 12),
    endingHeadBytes: cacheBytes({
      layers: 32,
      batch: 1,
      tokens: 1024,
      kvHeads: 1,
      width: 64,
      bytes: 2,
    }),
  };
}
