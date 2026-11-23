import { bound, mergeIntervals, phase } from './arithmetic.mjs';
import {
  ARTIFACT_FIXTURE,
  EVALUATED_MODEL_BYTES,
  ids,
  required,
  sentenceWeights,
} from './fixtures.mjs';
import {
  assess,
  cacheClockTrace,
  compareArtifacts,
  exporter,
  exporterReceipts,
  queueTimeline,
  releaseAllowed,
} from './model.mjs';
import { createCueTrack } from 'vizmatic';
export const tracks = Object.fromEntries(
  ids.map((id) => [
    id,
    createCueTrack({
      initial: {
        id: `${id}-initial`,
        snapshot: {
          b: 0,
        },
      },
      cues: [0, 1, 2].map((b) => ({
        id: `${id}-${b}`,
        beat: b,
        at: 0,
        snapshot: {
          b,
        },
      })),
    }),
  ]),
);
export function sampleModel(id, state, artifacts = ARTIFACT_FIXTURE) {
  if (!tracks[id]) return sampleMlflowChapter(id, state);
  const { b } = tracks[id].sample(state).snapshot,
    q = phase(b > state.beat ? 0 : state.beatP),
    base = {
      b,
      q,
    };
  if (id === 'intro')
    return {
      ...base,
      receipts: [
        {
          id: 'T103',
          commit: '8b2f9e1',
          prompt: 16,
          index: 'I7',
          citation: 'DOC-12',
        },
        {
          id: 'T104',
          commit: '8b2f9e1',
          prompt: 17,
          index: 'I8',
          citation: 'missing',
        },
      ],
    };
  if (id === 'stores')
    return {
      ...base,
      direct: b === 2,
      metadataKB: 4,
      artifactGB: 2,
    };
  if (id === 'lineage')
    return {
      ...base,
      visible: b + 1,
      attached: b > 0 ? 3 : Math.min(3, Math.floor(q * 4)),
      ids: [
        'code C8',
        'data D4',
        'prompt P17',
        'run R8',
        'model M3',
        'registry v3',
        'trace T104',
        'case RET-104',
      ],
    };
  if (id === 'trace')
    return {
      ...base,
      time: b > 0 ? 1420 : q * 1420,
      root: 1420,
      children: [145, 110, 1130],
      nested: [980, 105],
      own: 1420 - 145 - 110 - 1130,
    };
  if (id === 'evaluation')
    return {
      ...base,
      ...assess(
        b === 0
          ? [
              {
                id: 'A',
                pass: false,
              },
              {
                id: 'B',
                pass: false,
              },
              {
                id: 'C',
                pass: true,
              },
            ]
          : b === 1
            ? [
                {
                  id: 'A',
                  pass: true,
                },
                {
                  id: 'C',
                  pass: true,
                },
              ]
            : required.map((id) => ({
                id,
                pass: true,
              })),
      ),
    };
  if (id === 'alias')
    return {
      ...base,
      tick: [0, 0.5, 1][b],
      target: b === 0 ? 17 : 18,
      loaded: b === 2 ? 18 : 17,
      expiry: 1,
      refresh: b === 2,
    };
  const caseCount = b === 0 ? Math.max(1, Math.min(3, Math.floor(q * 4))) : 3;
  const evidence = assess(
    required.slice(0, caseCount).map((id) => ({
      id,
      pass: true,
    })),
  );
  const digestChecked = b > 0 || q > 0.82;
  const identity = compareArtifacts(artifacts, digestChecked);
  const traceStates = exporter([2, 3, 2, 0]),
    accept = state.cues?.['synthesis-exporter-accepts'],
    drop = state.cues?.['synthesis-exporter-drops'];
  const i =
    b === 0
      ? 0
      : b === 1
        ? accept
          ? drop?.phase !== 'before'
            ? 1 + Math.floor(2 * (drop?.progress ?? 0))
            : Math.floor(accept.progress)
          : Math.min(3, Math.floor(q * 4))
        : 3;
  return {
    ...base,
    evidence,
    ...identity,
    promotionReady: releaseAllowed(evidence, identity),
    ...traceStates[i],
    receipts: exporterReceipts([2, 3, 2, 0])[i],
    arrivals: [2, 3, 2, 0].slice(0, i + 1).reduce((a, v) => a + v, 0),
  };
}
export function mlflowSentenceProgress(scene, state, beat, sentence) {
  const weights = sentenceWeights[scene]?.[beat];
  if (!weights || weights[sentence] === undefined)
    throw new RangeError(`Unknown MLflow sentence ${scene}/${beat}/${sentence}`);
  if (state.beat > beat) return 1;
  if (state.beat < beat) return 0;
  const cue = state.cues?.[`mf-sentence-${scene}-${beat}-${sentence}`];
  if (cue) return cue.phase === 'after' ? 1 : cue.phase === 'before' ? 0 : bound(cue.progress ?? 0);
  if (state.cues) return 0;
  const before = weights.slice(0, sentence).reduce((a, b) => a + b, 0);
  return bound(
    ((state.beatP ?? 0) * weights.reduce((a, b) => a + b, 0) - before) / weights[sentence],
  );
}
export function sampleMlflowVisual(id, state) {
  const s = sampleModel(id, state),
    b = s.b,
    g = (beat, sentence) => mlflowSentenceProgress(id, state, beat, sentence);
  if (id === 'lineage')
    return {
      ...s,
      q: g(b, Math.min(1, sentenceWeights[id][b].length - 1)),
      attached: b ? 3 : Math.min(3, Math.floor(g(0, 1) * 3 + 1e-9)),
    };
  if (id === 'trace')
    return {
      ...s,
      time: b ? 1420 : 1420 * g(0, 3),
    };
  if (id === 'evaluation')
    return {
      ...s,
      outcomesReady: b === 0 ? g(0, 1) >= 1 : g(b, b === 1 ? 2 : 1) >= 1,
    };
  if (id === 'alias')
    return {
      ...s,
      target: b > 1 || (b === 1 && g(1, 0) >= 1) ? 18 : 17,
      loaded: b === 2 && g(2, 1) >= 1 ? 18 : 17,
      refreshProgress: b === 2 ? g(2, 1) : 0,
    };
  if (id === 'synthesis') {
    const count = b ? 3 : Math.min(3, Math.floor(g(0, 2) * 3 + 1e-9));
    const evidence = assess(
      required.slice(0, count).map((id) => ({
        id,
        pass: true,
      })),
    );
    const identity = compareArtifacts(ARTIFACT_FIXTURE, b > 0 || g(0, 1) >= 1);
    return {
      ...s,
      evidence,
      ...identity,
      promotionReady: releaseAllowed(evidence, identity),
    };
  }
  return s;
}
export function sampleMlflowChapter(id, state) {
  const b = state.beat,
    g = (beat, sentence) => mlflowSentenceProgress(id, state, beat, sentence),
    ready = (beat, sentence) => g(beat, sentence) >= 1;
  const base = {
    id,
    b,
    q: phase(state.beatP ?? 0),
  };
  if (id === 'evidence-controls')
    return {
      ...base,
      compare: g(0, 0),
      candidate: g(2, 0),
      prompt: b === 2 ? 18 : 17,
      fixed: ['8b2f9e1', 'M3', b === 2 ? 'I8' : 'I7'],
    };
  if (id === 'metadata-mutability')
    return {
      ...base,
      write: g(0, 1),
      parameter: 40,
      attempted: 50,
      rejected: ready(0, 2),
      tag: ready(1, 1) ? 'approved' : 'pending',
      temperature: ready(1, 2) ? 0.8 : 0.2,
      retained: b === 2,
    };
  if (id === 'model-package') {
    const changed = b > 1 || ready(1, 2);
    return {
      ...base,
      changed,
      evaluated: EVALUATED_MODEL_BYTES,
      candidate: `M3:weights=${changed ? 'B' : 'A'};flavor=pyfunc;env=locked`,
      signature: g(1, 0),
      alias: g(2, 0),
    };
  }
  if (id === 'trace-overlap')
    return {
      ...base,
      root: 800,
      children: [
        [0, 300],
        [200, 650],
      ],
      union: mergeIntervals([
        [0, 300],
        [200, 650],
      ]),
      input: g(0, 1),
      overlapReady: ready(1, 1),
      merge: g(1, 0),
      totalReady: ready(1, 2),
      wrongReady: ready(1, 3),
      dependency: g(2, 1),
    };
  if (id === 'context-chain')
    return {
      ...base,
      selected: ['DOC4', 'DOC12', 'DOC18', 'DOC21', 'DOC24', 'DOC31', 'DOC36', 'DOC40'],
      packed: ready(1, 2) ? ['DOC4', 'DOC18', 'DOC21', 'DOC12'] : ['DOC4', 'DOC18', 'DOC21'],
      repaired: ready(1, 2),
      repair: g(1, 2),
    };
  if (id === 'citation-computation')
    return {
      ...base,
      lists: b === 1 ? ['DOC-12', ['DOC-12', 'DOC-99']] : [[], ['DOC-99'], ['DOC-12']],
      processed:
        b === 0
          ? Math.min(3, Math.floor(g(0, 1) + g(0, 2) + g(0, 3) + 1e-9))
          : b === 1
            ? Math.min(2, Math.floor(g(1, 0) + g(1, 1) + 1e-9))
            : 3,
      semantic: b === 2,
    };
  if (id === 'evaluation-result') {
    const rows =
      b === 0
        ? [
            {
              id: 'A',
              pass: true,
            },
            {
              id: 'B',
              pass: true,
            },
          ]
        : [
            {
              id: 'A',
              pass: true,
            },
            {
              id: 'B',
              pass: false,
            },
            ...(ready(2, 0)
              ? [
                  {
                    id: 'C',
                    pass: true,
                  },
                ]
              : []),
          ];
    return {
      ...base,
      rows,
      assessment: assess(rows),
      nativePassed: b === 0,
      nativeReady: ready(0, 2),
      joined: g(1, 0),
      fill: g(2, 0),
    };
  }
  if (id === 'dataset-mutation') {
    const before = [
        {
          inputs: {
            question: 'return window',
          },
          expectations: {
            allowed_docs: ['DOC-12'],
          },
        },
      ],
      after = [
        {
          inputs: {
            question: 'return window',
          },
          expectations: {
            allowed_docs: ['DOC-13'],
          },
        },
      ];
    return {
      ...base,
      before,
      after,
      merged: b > 1 || ready(1, 0),
      move: g(1, 0),
      resultReady: ready(2, 1),
    };
  }
  if (id === 'automatic-evidence')
    return {
      ...base,
      eligible: 8,
      selected: b ? 4 : Math.min(4, Math.floor(g(0, 1) * 4 + 1e-9)),
      assessed: b ? Math.min(3, Math.floor(g(1, 1) * 3 + 1e-9)) : 0,
      resultReady: ready(1, 2),
      container: g(2, 0),
    };
  if (id === 'config-mutation')
    return {
      ...base,
      registry: ready(0, 1) ? 0.8 : 0.2,
      held: 0.2,
      fresh: ready(0, 2) ? 0.8 : null,
      change: g(0, 1),
      load: g(0, 2),
      receipt: g(1, 1),
    };
  if (id === 'cache-clock') {
    const { states, held, registry } = cacheClockTrace();
    const count =
      b === 0
        ? Math.min(3, Math.floor(g(0, 2) * 2 + g(0, 4) + 1e-9))
        : b === 1
          ? 3 + Math.min(2, Math.floor(g(1, 0) + g(1, 1) + 1e-9))
          : 5;
    return {
      ...base,
      ...states[count],
      held,
      registry,
      count,
      zeroTtl: b === 1 && ready(1, 1),
    };
  }
  if (id === 'gateway-contract')
    return {
      ...base,
      attempt: b ? 2 : Math.min(2, Math.floor(g(0, 2) * 2 + 1e-9)),
      checks: b === 1 ? Math.min(3, Math.floor(g(1, 0) * 3 + 1e-9)) : b > 1 ? 3 : 0,
      mutations: b === 2 ? Math.min(3, Math.floor(g(2, 0) * 3 + 1e-9)) : 0,
    };
  if (id === 'export-queue') {
    const timeline = queueTimeline(
      4,
      ['A', 'B', 'C'],
      [
        {
          service: 2,
          arrivals: ['D', 'E', 'F', 'G'],
        },
        {
          service: 2,
          arrivals: ['H'],
        },
      ],
    );
    const last = timeline.at(-1);
    timeline.push({
      ...last,
      queue: last.queue.filter((id) => id !== 'E'),
      droppedIds: [...last.droppedIds, 'E'],
      event: {
        kind: 'discarded',
        id: 'E',
      },
    });
    const position = b === 0 ? 0 : b === 1 ? Math.min(9, g(1, 1) * 6 + g(1, 2) * 3) : 9 + g(2, 0);
    const index = Math.floor(position + 1e-9),
      current = timeline[index];
    return {
      ...base,
      capacity: 4,
      ...current,
      countReady: ready(1, 3),
      timelineIndex: index,
      position,
      next: timeline[index + 1] ?? null,
      travel: position - Math.floor(position),
      timedOut: b === 2 && ready(2, 0),
    };
  }
  if (id === 'privacy-gate')
    return {
      ...base,
      removed: b > 1 || ready(1, 0),
      redact: g(1, 0),
    };
  if (id === 'storage-lifecycle')
    return {
      ...base,
      backup: g(0, 1),
      softDeleted: b > 1 || ready(1, 0),
      purged: b > 1 || ready(1, 2),
      purge: g(1, 2),
      backupRetained: true,
      restored: b === 2 && ready(2, 0),
    };
  if (id === 'auth-boundary')
    return {
      ...base,
      readCheck: g(0, 0),
      pathCheck: g(0, 3),
      aliasCheck: g(1, 0),
      move: g(2, 0),
      loaded: ready(2, 2) ? 18 : 17,
    };
  if (id === 'fresh-config')
    return {
      ...base,
      registry: b === 2 ? (g(2, 0) >= 0.4 ? 0.2 : 0.8) : ready(0, 3) ? 0.8 : 0.2,
      held: 0.2,
      fresh: b === 2 && ready(2, 0) ? 0.2 : ready(1, 1) ? 0.8 : null,
      load: g(1, 1),
      repair: g(2, 0),
      heldVerdict: ready(1, 0),
      mismatch: b === 1 && ready(1, 2),
      repaired: b === 2 && ready(2, 1),
    };
  if (id === 'fresh-telemetry') {
    const timeline = queueTimeline(
      2,
      ['A'],
      [
        {
          service: 1,
          arrivals: ['B', 'C', 'D'],
        },
        {
          service: 2,
          arrivals: ['D′'],
        },
        {
          service: 1,
          arrivals: [],
        },
      ],
    );
    const position = g(1, 0) + 2 * g(1, 1) + g(1, 2) + 3 * g(2, 0) + g(2, 1);
    const index = Math.floor(position);
    // A separate tracking-store observation supplies positive evidence of persistence.
    const stored = [{ trace: 'D′', question: 'What is the return window?' }];
    return {
      ...base,
      capacity: 2,
      ...timeline[index],
      countReady: ready(1, 3),
      repaired: ready(2, 2),
      replayRecord: g(2, 2) > 0 ? stored.find((record) => record.trace === 'D′') : null,
      timelineIndex: index,
      position,
      next: timeline[index + 1] ?? null,
      travel: position - Math.floor(position),
    };
  }
  if (['store-route', 'trace-links', 'sdk-evidence', 'project-source', 'source-route'].includes(id))
    return {
      ...base,
      stages: sentenceWeights[id][b].map((_, i) => g(b, i)),
    };
  throw new RangeError(`No MLflow construction for ${id}`);
}
