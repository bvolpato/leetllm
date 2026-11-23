import { continuation, mapping, prompt, vocabulary } from './fixtures.mjs';
import {
  cueBegun,
  cueDone,
  cueProgress,
  phase,
  progressOf,
  resultDone,
  sum,
} from './arithmetic.mjs';
import { originalIds, tracks } from './construction.mjs';
import {
  completed,
  cpuBytesPerSlot,
  cpuIds,
  editedCpuIds,
  editedWords,
  firstDifference,
  movement,
  returnedWords,
  savedPrefix,
} from './replay.mjs';
import assert from 'node:assert/strict';
export function serialize(mode) {
  const words = [
    'BEGIN',
    'user',
    'Why',
    'do',
    'birds',
    'sing?',
    'END',
    ...(mode === 1 ? [] : ['BEGIN', 'assistant']),
  ];
  if (mode === 2) words.unshift('BEGIN');
  return {
    words,
    ids: words.map((v) => vocabulary.indexOf(v)),
  };
}
export function kvBytes(length) {
  return 2 * 16 * 1 * length * 4 * 64 * 2;
}
export function generationTrace(steps) {
  const sequence = [...prompt],
    cached = [],
    rows = [];
  for (let i = 0; i < steps; i++) {
    const processed = i === 0 ? [...prompt] : [sequence.at(-1)];
    cached.push(...processed);
    const scores = continuation.map((_, j) => (j === i ? 3 : 0)),
      selected = scores.indexOf(Math.max(...scores));
    sequence.push(continuation[selected]);
    rows.push({
      pass: i,
      processed,
      cached: cached.length,
      selected: continuation[selected],
      sequence: sequence.length,
    });
  }
  return {
    sequence,
    cached,
    rows,
  };
}
export function lossTrace(beat, progress, cues) {
  const q = phase(progress),
    ignored =
      beat > 1 || (beat === 1 && cueBegun(cues, 'loss-ignore-third-label', progress >= 0.12)),
    dropped = ignored;
  const visible =
      beat > 0
        ? 3
        : Math.ceil(3 * cueProgress(cues, 'loss-beat-1-focus-2', Math.max(0, (q - 0.6) / 0.4))),
    links =
      beat > 0 ? 3 : Math.ceil(3 * cueProgress(cues, 'loss-beat-1-focus-1', Math.min(1, q / 0.4)));
  const probabilities = [0.7, 0.5, 0.6],
    terms = probabilities.map((p, i) => ({
      position: i,
      target: i + 1,
      probability: p,
      active: !(dropped && i === 1),
      visible: i < visible,
      value: -Math.log(p),
    }));
  const active = terms.filter((t) => t.visible && t.active),
    total = sum(active.map((t) => t.value));
  return {
    q,
    ignored,
    dropped,
    links,
    terms,
    total,
    count: active.length,
    mean: active.length ? total / active.length : null,
    checking: beat > 0 || visible === 3,
  };
}
export function generationState(b, q, cues) {
  let selections = b === 0 ? 0 : b === 1 ? 1 : 3,
    cacheCount =
      b === 0 ? Math.ceil(5 * cueProgress(cues, 'generation-beat-1-focus-2', q)) : b === 1 ? 5 : 7,
    forwarding = null,
    forwardProgress = 0;
  if (b === 0 && cueDone(cues, 'generation-first-selection', true)) {
    selections = 1;
    cacheCount = 5;
  }
  if (b === 1) {
    const first = cueProgress(cues, 'generation-forward-near', 1),
      second = cueProgress(cues, 'generation-forward-home', q >= 0.3 ? 1 : 0);
    if (first > 0 && first < 1) {
      forwarding = 'near';
      forwardProgress = first;
    }
    if (first === 1) cacheCount = 6;
    if (cueDone(cues, 'generation-select-home', true)) {
      selections = 2;
      cacheCount = 6;
    }
    if (second > 0 && second < 1) {
      forwarding = 'home';
      forwardProgress = second;
    }
    if (second === 1) cacheCount = 7;
    if (cueDone(cues, 'generation-third-selection', q >= 0.3)) {
      selections = 3;
      cacheCount = 7;
    }
  }
  const resumeProgress =
      b === 2 ? cueProgress(cues, 'generation-resume-final', q >= 0.3 ? 1 : 0) : 0,
    resumed = b === 2 && resumeProgress === 1;
  if (b === 2 && resumeProgress > 0 && resumeProgress < 1) {
    forwarding = '.';
    forwardProgress = resumeProgress;
  }
  if (resumed) cacheCount = 8;
  const trace = generationTrace(selections),
    sequence = trace.sequence,
    cached = sequence.slice(0, cacheCount),
    pending = sequence.slice(cacheCount);
  return {
    ...trace,
    cached,
    pending,
    forwarding,
    forwardProgress,
    resumed,
    selections,
    forwardCount: b === 0 ? (cacheCount === 5 ? 1 : 0) : cacheCount - 4,
  };
}
export function sampleOriginalModel(id, state) {
  const { b } = tracks[id].sample(state).snapshot,
    q = phase(b > state.beat ? 0 : state.beatP),
    base = {
      b,
      q,
    };
  if (id === 'identity') {
    const moved = b > 1 || (b === 1 && cueBegun(state.cues, 'identity-beat-2-focus-2', true)),
      tokenizerChanged =
        b > 1 || (b === 1 && cueBegun(state.cues, 'identity-tokenizer-change', true));
    return {
      ...base,
      moved,
      tokenizerChanged,
      revision: moved ? 'R2' : 'R1',
      weights: 'W7',
      tokenizer: tokenizerChanged ? 'T4' : 'T3',
      physicalWeightCopies: 1,
    };
  }
  if (id === 'auto') {
    const type = ['llama', 'gpt2', 'unknown'][b],
      selected = mapping[type] ?? null;
    return {
      ...base,
      type,
      selected,
      compatible: type === 'llama',
      shardFamily: 'llama',
    };
  }
  if (id === 'chat') {
    const insertion = movement(state, 1, 'chat-insert');
    const removal = movement(state, 2, 'chat-remove');
    const offset = insertion * (1 - removal);
    const mode = completed(state, 1, 'chat-insert') && !completed(state, 2, 'chat-remove') ? 2 : 0;
    return {
      ...base,
      mode,
      offset,
      removal,
      ...serialize(mode),
    };
  }
  if (id === 'padding') {
    const short = ['Birds', 'sing'],
      long = ['The', 'sun', 'shines', 'today'],
      left = b > 1 || (b === 1 && cueBegun(state.cues, 'padding-left-pad', true)),
      row = left ? ['PAD', 'PAD', ...short] : [...short, 'PAD', 'PAD'];
    return {
      ...base,
      left,
      rows: [row, long],
      masks: [row.map((v) => (v === 'PAD' ? 0 : 1)), [1, 1, 1, 1]],
      read: row.at(-1),
      trainingTokens: ['PAD=2', 'Birds', 'sing', 'EOS=2'],
      trainingAttention: [0, 1, 1, 1],
      trainingLabels: [-100, 'Birds', 'sing', 2],
    };
  }
  if (id === 'loss') {
    const trace = lossTrace(b, state.beatP ?? 0, state.cues),
      tokens = [0, 1, 2, 3],
      labels = trace.ignored ? [0, 1, -100, 3] : [...tokens];
    return {
      ...base,
      ...trace,
      tokens,
      labels,
      active: trace.count,
      loss: trace.mean,
    };
  }
  if (id === 'cache') {
    const length =
        b === 0
          ? 512 + Math.floor(512 * cueProgress(state.cues, 'cache-scale-length', q))
          : b === 1
            ? 512
            : 4096,
      capacity = b === 1 && cueBegun(state.cues, 'cache-static-allocation', true) ? 4096 : length,
      live = kvBytes(length),
      allocated = kvBytes(capacity);
    return {
      ...base,
      length,
      capacity,
      live,
      allocated,
      unused: allocated - live,
      perToken: kvBytes(1),
    };
  }
  if (id === 'generation')
    return {
      ...base,
      ...generationState(b, q, state.cues),
    };
  return base;
}
export function validateOriginalModel() {
  assert.equal(lossTrace(0, 0).count, 0);
  assert.equal(lossTrace(0, 1).count, 3);
  assert.equal(lossTrace(1, 0.1).count, 3);
  assert.equal(lossTrace(1, 0.8).count, 2);
  assert.equal(mapping.llama, 'LlamaForCausalLM');
  assert.equal(
    sampleModel('auto', {
      beat: 1,
      beatP: 0,
    }).compatible,
    false,
  );
  assert.equal(
    sampleModel('auto', {
      beat: 2,
      beatP: 0,
    }).selected,
    null,
  );
  assert.notDeepEqual(serialize(0).ids, serialize(1).ids);
  assert.equal(serialize(2).ids.length, serialize(0).ids.length + 1);
  assert.equal(
    sampleModel('padding', {
      beat: 0,
      beatP: 0,
    }).read,
    'PAD',
  );
  assert.equal(
    sampleModel('padding', {
      beat: 1,
      beatP: 0,
    }).read,
    'sing',
  );
  const loss = sampleModel('loss', {
    beat: 1,
    beatP: 0.8,
  });
  assert.equal(loss.active, 2);
  assert.equal(loss.terms[1].active, false);
  assert.equal(loss.tokens[2], 2);
  assert(Math.abs(loss.loss - (-Math.log(0.7) - Math.log(0.6)) / 2) < 1e-12);
  assert.equal(kvBytes(512), 8 * 2 ** 20);
  assert.equal(kvBytes(4096), 64 * 2 ** 20);
  assert.equal(kvBytes(1), 16384);
  assert.equal(
    sampleModel('generation', {
      beat: 2,
      beatP: 0.1,
    }).cached.length,
    7,
  );
  assert.equal(
    sampleModel('generation', {
      beat: 2,
      beatP: 0.8,
    }).cached.length,
    8,
  );
  assert.equal(
    sampleModel('generation', {
      beat: 2,
      beatP: 0.8,
    }).sequence.length,
    8,
  );
  const final = generationTrace(3);
  assert.equal(final.sequence.length, 8);
  assert.equal(final.cached.length, 7);
  assert.deepEqual(final.cached, final.sequence.slice(0, -1));
  assert.deepEqual(final.sequence.slice(5), continuation);
  const cue = (phase, progress = phase === 'before' ? 0 : 1) => ({
    phase,
    progress,
  });
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const trace = lossTrace(0, 0, {
      'loss-beat-1-focus-1': cue('during', p),
      'loss-beat-1-focus-2': cue('during', p),
    });
    assert.equal(trace.links, Math.ceil(3 * p));
    assert.equal(trace.count, Math.ceil(3 * p));
    assert.equal(trace.total, sum(trace.terms.filter((t) => t.visible).map((t) => t.value)));
  }
  const before = lossTrace(1, 0, {
      'loss-ignore-third-label': cue('before'),
      'loss-beat-2-focus-2': cue('before'),
    }),
    ignored = lossTrace(1, 0, {
      'loss-ignore-third-label': cue('after'),
      'loss-beat-2-focus-2': cue('before'),
    }),
    after = lossTrace(1, 0, {
      'loss-ignore-third-label': cue('after'),
      'loss-beat-2-focus-2': cue('after'),
    });
  assert.equal(before.count, 3);
  assert.equal(ignored.ignored, true);
  assert.equal(ignored.count, 2);
  assert.equal(after.count, 2);
  assert.equal(after.terms[1].active, false);
  assert(Math.abs(after.mean - (-Math.log(0.7) - Math.log(0.6)) / 2) < 1e-12);
  const eventIds = [
      'generation-first-selection',
      'generation-forward-near',
      'generation-select-home',
      'generation-forward-home',
      'generation-third-selection',
      'generation-resume-final',
    ],
    events = Object.fromEntries(eventIds.map((id) => [id, cue('before')]));
  for (const p of [0, 0.2, 0.5, 0.8, 1]) {
    const state = generationState(0, 0, {
      ...events,
      'generation-beat-1-focus-2': cue('during', p),
    });
    assert.equal(state.sequence.length, 5);
    assert.equal(state.cached.length, Math.ceil(5 * p));
    assert.deepEqual(state.cached, state.sequence.slice(0, state.cached.length));
  }
  events['generation-first-selection'] = cue('after');
  assert.equal(generationState(0, 0, events).sequence.at(-1), 'near');
  assert.equal(generationState(0, 0, events).cached.length, 5);
  events['generation-forward-near'] = cue('during', 0.5);
  assert.equal(generationState(1, 0, events).forwarding, 'near');
  assert.equal(generationState(1, 0, events).cached.length, 5);
  events['generation-forward-near'] = cue('after');
  events['generation-select-home'] = cue('after');
  assert.equal(generationState(1, 0, events).sequence.at(-1), 'home');
  assert.equal(generationState(1, 0, events).cached.length, 6);
  events['generation-forward-home'] = cue('after');
  events['generation-third-selection'] = cue('after');
  const stopped = generationState(1, 0, events);
  assert.equal(stopped.sequence.length, 8);
  assert.equal(stopped.cached.length, 7);
  assert.deepEqual(stopped.pending, ['.']);
  events['generation-resume-final'] = cue('during', 0.5);
  const resuming = generationState(2, 0, events);
  assert.equal(resuming.forwarding, '.');
  assert.equal(resuming.cached.length, 7);
  events['generation-resume-final'] = cue('after');
  const resumed = generationState(2, 0, events);
  assert.equal(resumed.cached.length, 8);
  assert.deepEqual(resumed.cached, resumed.sequence);
  assert.equal(resumed.forwardCount, 4);
  const namespace = sampleModel('identity', {
    beat: 1,
    beatP: 0,
    cues: {
      'identity-beat-2-focus-2': cue('after'),
      'identity-tokenizer-change': cue('before'),
    },
  });
  assert.equal(namespace.revision, 'R2');
  assert.equal(namespace.tokenizerChanged, false);
  assert.equal(namespace.physicalWeightCopies, 1);
  const training = sampleModel('padding', {
    beat: 2,
    beatP: 0,
  });
  assert.equal(training.trainingTokens[0], 'PAD=2');
  assert.equal(training.trainingTokens[3], 'EOS=2');
  assert.equal(training.trainingAttention[3], 1);
  assert.equal(training.trainingLabels[0], -100);
  assert.equal(training.trainingLabels[3], 2);
  return true;
}
export function hybridCacheBytes(lengths, heads = 2, width = 8, bytes = 2, batch = 1) {
  return 2 * batch * heads * width * bytes * sum(lengths);
}
export function freshResumeSnapshot(state) {
  const b = state.beat ?? 0,
    sequenceShown = b > 1 || (b === 1 && resultDone(state, 'fresh-sequence')),
    cacheShown = b > 1 || (b === 1 && resultDone(state, 'fresh-cache')),
    resumed = b === 2 && resultDone(state, 'fresh-forward');
  const fullCache = resumed || (b === 4 && completed(state, 4, 'fresh-rebuild'));
  return {
    b,
    sequenceShown,
    cacheShown,
    resumed,
    sequence: sequenceShown ? returnedWords.length : null,
    cache: cacheShown ? (fullCache ? returnedWords.length : savedPrefix.length) : null,
    pending: cacheShown && !fullCache ? 'N4' : null,
    forwardP: b === 2 ? progressOf(state, 'hf-fresh-forward') : 0,
  };
}
export function sampleModel(id, state) {
  const b = state.beat ?? 0,
    p = progressOf(state, 'hf-' + id + '-' + b),
    base = {
      b,
      p,
    };
  if (originalIds.has(id)) {
    const v = sampleOriginalModel(id, state);
    if (id === 'cache' && b === 2) {
      const r = progressOf(state, 'cache-beat-3-focus-1'),
        length = 512 + Math.floor((4096 - 512) * r);
      return {
        ...v,
        p,
        length,
        capacity: 4096,
        live: kvBytes(length),
        allocated: kvBytes(4096),
        unused: kvBytes(4096 - length),
      };
    }
    return {
      ...v,
      p,
    };
  }
  if (id === 'hybrid-budget')
    return {
      ...base,
      lengths: [100, 100, 20, 20],
      sum: 240,
      bytes: hybridCacheBytes([100, 100, 20, 20]),
      showLengths: resultDone(state, 'hybrid-length'),
      showBytes: resultDone(state, 'hybrid-bytes'),
    };
  if (id === 'fresh-resume')
    return {
      ...base,
      ...freshResumeSnapshot(state),
    };
  if (id === 'decoding-policy')
    return {
      ...base,
      logits: [2, 1, 0],
      masses: [1, Math.exp(-1), 0],
      shares: [1 / (1 + Math.exp(-1)), Math.exp(-1) / (1 + Math.exp(-1)), 0],
      showShares: resultDone(state, 'sampling-probs'),
    };
  if (id === 'offload-execution')
    return {
      ...base,
      values: [6, 2, 3, 1],
      total: 12,
      showTotal: resultDone(state, 'offload-total'),
    };
  return base;
}
export function validateModel() {
  validateOriginalModel();
  assert.equal(firstDifference(serialize(0).ids, serialize(1).ids), 7);
  assert.equal(firstDifference(serialize(0).ids, serialize(2).ids), 1);
  assert.deepEqual(serialize(2).ids.slice(1), serialize(0).ids);
  assert.equal(firstDifference(cpuIds.slice(0, 4), editedCpuIds.slice(0, 4)), 1);
  assert.equal(cpuIds.at(-1), editedCpuIds.at(-1));
  assert.equal(cpuBytesPerSlot * cpuIds.length, 1280);
  assert.equal(cpuBytesPerSlot * 16, 4096);
  assert.equal(firstDifference(savedPrefix, returnedWords.slice(0, -1)), -1);
  assert.equal(firstDifference(savedPrefix, editedWords.slice(0, -1)), 2);
  assert.equal(editedWords.length, returnedWords.length);
  assert.equal(returnedWords.at(-1), 'mate');
  assert.equal(hybridCacheBytes([100, 100, 20, 20]), 15360);
  assert.equal(hybridCacheBytes([100, 100, 20, 20], 2, 8, 2, 3), 46080);
  const pending = {
    phase: 'during',
    progress: 0.999,
  };
  for (const [name, field] of [
    ['fresh-sequence', 'sequence'],
    ['fresh-cache', 'cache'],
  ])
    assert.equal(
      freshResumeSnapshot({
        beat: 1,
        beatP: 1,
        cues: {
          ['hf-' + name]: pending,
        },
      })[field],
      null,
    );
  assert.deepEqual(
    freshResumeSnapshot({
      beat: 2,
      beatP: 1,
      cues: {
        'hf-fresh-forward': {
          phase: 'after',
          progress: 1,
        },
      },
    }).cache,
    11,
  );
  assert.equal(
    sampleModel('decoding-policy', {
      beat: 1,
      beatP: 1,
    }).shares.reduce((a, v) => a + v, 0),
    1,
  );
  return true;
}
