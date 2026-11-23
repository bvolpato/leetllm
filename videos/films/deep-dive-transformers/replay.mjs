import { operationProgress, resultAfter } from '../../lib/lesson-definition.mjs';

// Persist a completed edit across beats, including the question's silent hold.
export function movement(state, beat, id) {
  if (state.beat !== beat) return state.beat > beat ? 1 : 0;
  return state.cues?.[id] ? operationProgress(state, id) : (state.beatP ?? 0);
}

export function completed(state, beat, id) {
  if (state.beat !== beat) return state.beat > beat;
  return state.cues?.[id] ? resultAfter(state, id) : state.beatP >= 1;
}

export function firstDifference(left, right) {
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    if (left[i] !== right[i]) return i;
  }
  return -1;
}

export const cpuIds = [1, 7, 9, 4, 2];
export const editedCpuIds = [1, 6, 9, 4, 2];
export const cpuBytesPerSlot = 2 * 2 * 2 * 8 * 4; // K and V, layers, KV heads, head width, float32.

// Last-position logit for vocabulary ID 5. Measured on the article's seed-7
// eager float32 CPU model in Transformers 5.16.1 and PyTorch 2.12.0.
export const tailScore = {
  vocabularyId: 5,
  original: -0.15127985179424286,
  edited: -0.21829339861869812,
};

export const shortPrompt = ['BEGIN', 'user', 'Why', 'sing?', 'END', 'BEGIN', 'assistant'];
export const shortReply = ['To', 'find', 'a', 'mate'];
export const returnedWords = [...shortPrompt, ...shortReply];
export const editedWords = returnedWords.map((word, i) => (i === 2 ? 'birds' : word));
export const savedPrefix = returnedWords.slice(0, -1);
