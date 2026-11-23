import assert from 'node:assert/strict';
import { mapping, prompt, continuation } from '../../../films/deep-dive-transformers/fixtures.mjs';
import {
  serialize,
  kvBytes,
  generationTrace,
  hybridCacheBytes,
} from '../../../films/deep-dive-transformers/model.mjs';
import {
  firstDifference,
  cpuIds,
  shortPrompt,
  returnedWords,
  editedWords,
  savedPrefix,
} from '../../../films/deep-dive-transformers/replay.mjs';

export {
  mapping,
  prompt,
  continuation,
  serialize,
  firstDifference,
  cpuIds,
  shortPrompt,
  returnedWords,
  editedWords,
  savedPrefix,
};
export const approved = serialize(0);
export const truncated = serialize(1);
export const duplicate = serialize(2);
export const snapshots = [
  { revision: 'R1', weights: 'W7', tokenizer: 'T3' },
  { revision: 'R2', weights: 'W7', tokenizer: 'T4' },
];
export const copies = new Set(snapshots.map((s) => s.weights)).size;
export const memory = { resident: 6, cache: 3, layer: 2, workspace: 1, limit: 10 };
export const peak = memory.resident + memory.cache + memory.layer + memory.workspace;
export const pixel = (mean) => 1 - mean;

const embedding = {
  PAD: [2, 0, 0],
  Birds: [0, 1, 0],
  sing: [0, 2, 0],
  The: [0, 0, 1],
  sun: [0, 0, 1],
  shines: [0, 0, 1],
  today: [0, 0, 2],
};
const choices = ['again', 'softly', 'too'];
// The short uses uniform attention to the visible prefix plus the last embedding.
function lastScores(words, mask) {
  const count = mask.reduce((a, b) => a + b, 0);
  return choices.map(
    (_, axis) =>
      embedding[words.at(-1)][axis] +
      words.reduce((v, word, pos) => v + embedding[word][axis] * mask[pos], 0) / count,
  );
}
export function padding(left) {
  const short = ['Birds', 'sing'];
  const pads = ['PAD', 'PAD'];
  return [left ? [...pads, ...short] : [...short, ...pads], ['The', 'sun', 'shines', 'today']].map(
    (words) => {
      const mask = words.map((word) => Number(word !== 'PAD'));
      const scores = lastScores(words, mask);
      return { words, mask, scores, pick: choices[scores.indexOf(Math.max(...scores))] };
    },
  );
}
export const training = [
  { word: 'Birds', id: 5, mask: 1 },
  { word: 'sing', id: 6, mask: 1 },
  { word: 'EOS', id: 2, mask: 1 },
  { word: 'PAD', id: 2, mask: 0 },
];
export const targetId = (t) => (t.mask ? t.id : -100);
export const sentence = ['Birds', 'sing', 'at', 'dawn'];
export function loss(masked) {
  const labels = sentence.map((w, i) => (masked && i === 2 ? -100 : w));
  const terms = [0.7, 0.5, 0.6].map((p, source) => ({
    p,
    source,
    label: labels[source + 1],
    nll: -Math.log(p),
  }));
  const active = terms.filter((term) => term.label !== -100);
  return { labels, terms, active, mean: active.reduce((a, t) => a + t.nll, 0) / active.length };
}
export function outputTuple(withLoss) {
  const fields = { loss: withLoss ? 'S' : null, logits: 'L', hidden_states: 'H' };
  return { fields, tuple: Object.values(fields).filter((v) => v !== null) };
}
export const MiB = 2 ** 20;
export function cache(liveSlots, capacity) {
  const live = kvBytes(liveSlots) / MiB,
    allocated = kvBytes(capacity) / MiB;
  return { live, allocated, unused: allocated - live };
}
export const layerLengths = [100, 100, 20, 20];
export const layerBytes = hybridCacheBytes([1]);
export const hybrid = (batch) => hybridCacheBytes(layerLengths, 2, 8, 2, batch);
export function forked(second = false, first = true) {
  const prefix = ['A', 'B', 'C'];
  const saved = [...prefix];
  const shared = [...prefix];
  if (first) shared.push('X');
  if (second) saved.push('Y');
  return { shared, saved };
}
export function decode(count, forwarded) {
  const trace = generationTrace(count);
  const sequence = trace.sequence;
  assert(forwarded >= 0 && forwarded <= sequence.length);
  return {
    sequence,
    cached: sequence.slice(0, forwarded),
    pending: sequence.slice(forwarded),
    count,
  };
}
export function resumeInput(state) {
  assert.equal(state.pending.length, 1);
  return {
    token: state.pending[0],
    position: state.cached.length,
    mask: state.sequence.map(() => 1),
  };
}
export function forwardPending(state, input) {
  assert.deepEqual(input, resumeInput(state));
  assert.deepEqual(state.cached, state.sequence.slice(0, input.position));
  return { ...state, cached: [...state.cached, input.token], pending: [] };
}
export const savedPolicy = { num_beams: 3, do_sample: true };
export const resolved = { ...savedPolicy, do_sample: false };
export const policyMode = resolved.num_beams > 1 && !resolved.do_sample ? 'Beam search' : 'Other';
export const beamPrompt = ['Birds', 'sing', 'softly'];
export const maxNewTokens = 4;
export const release = {
  logitDelta: 0.00004,
  tolerance: 0.0001,
  accepted: 81,
  required: 85,
  total: 100,
  latency: null,
};
export const decisions = [
  release.logitDelta <= release.tolerance ? 'Pass' : 'Fail',
  release.accepted >= release.required ? 'Pass' : 'Fail',
  release.latency === null ? 'Pending' : 'Measured',
];
export function checkExamples() {
  assert.equal(firstDifference(approved.ids, truncated.ids), 7);
  assert.deepEqual(approved.words.slice(7), ['BEGIN', 'assistant']);
  assert.deepEqual(approved.ids.slice(7), [0, 7]);
  assert.equal(firstDifference(approved.ids, duplicate.ids), 1);
  assert.deepEqual(duplicate.ids.slice(1), approved.ids);
  assert.equal(copies, 1);
  assert.notEqual(snapshots[0].tokenizer, snapshots[1].tokenizer);
  assert.equal(peak, 12);
  assert.equal(peak - memory.limit, 2);
  assert.equal(mapping.gpt2, 'GPT2LMHeadModel');
  assert.equal(mapping.unknown, undefined);
  assert.deepEqual([pixel(0.5), pixel(0)], [0.5, 1]);
  const [right, left] = [padding(false), padding(true)];
  assert.deepEqual(right[0].mask, [1, 1, 0, 0]);
  assert.deepEqual(left[0].mask, [0, 0, 1, 1]);
  assert.deepEqual(right[0].scores, [2, 1.5, 0]);
  assert.deepEqual(left[0].scores, [0, 3.5, 0]);
  assert.equal(left[0].pick, 'softly');
  assert.equal(right[0].pick, 'again');
  assert.deepEqual(left[1], right[1]);
  assert.equal(left[1].pick, 'too');
  assert.deepEqual(training.map((t) => t.mask), [1, 1, 1, 0]);
  assert.deepEqual(training.map(targetId), [5, 6, 2, -100]);
  const shifted = training.slice(1).map((next, i) => [training[i].word, next.word, targetId(next)]);
  assert.deepEqual(shifted, [
    ['Birds', 'sing', 6],
    ['sing', 'EOS', 2],
    ['EOS', 'PAD', -100],
  ]);
  assert.equal(loss(false).mean.toFixed(4), '0.5202');
  assert.equal(loss(true).mean.toFixed(4), '0.4338');
  assert.deepEqual(
    loss(true).active.map((v) => v.source),
    [0, 2],
  );
  assert.deepEqual(outputTuple(false).tuple, ['L', 'H']);
  assert.deepEqual(outputTuple(true).tuple, ['S', 'L', 'H']);
  assert.equal(cpuIds.length, 5);
  assert.deepEqual(cache(512, 4096), { live: 8, allocated: 64, unused: 56 });
  assert.equal(cache(4096, 4096).unused, 0);
  assert.equal(hybrid(1), 15360);
  assert.equal(hybrid(3), 46080);
  assert.deepEqual(forked(true), { shared: ['A', 'B', 'C', 'X'], saved: ['A', 'B', 'C', 'Y'] });
  for (let n = 1; n <= 3; n++) {
    const state = decode(n, prompt.length + n - 1);
    assert.deepEqual(state.pending, [continuation[n - 1]]);
  }
  assert.deepEqual(decode(3, 8).pending, []);
  assert.deepEqual(decode(3, 8).sequence, decode(3, 7).sequence);
  const stopped = decode(3, 7),
    args = resumeInput(stopped);
  assert.deepEqual(args, { token: '.', position: 7, mask: [1, 1, 1, 1, 1, 1, 1, 1] });
  assert.deepEqual(forwardPending(stopped, args), decode(3, 8));
  assert.throws(() => forwardPending(stopped, { ...args, position: 8 }));
  assert.throws(() => forwardPending(stopped, { ...args, mask: args.mask.slice(1) }));
  assert.equal(firstDifference(savedPrefix, editedWords.slice(0, -1)), 2);
  assert.equal(returnedWords.length, 11);
  assert.equal(policyMode, 'Beam search');
  assert.equal(beamPrompt.length + maxNewTokens, 7);
  assert.deepEqual(decisions, ['Pass', 'Fail', 'Pending']);
}
