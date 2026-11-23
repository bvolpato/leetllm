import { LONG_SECTION, PARENT_REVEAL_END, PARENT_REVEAL_START } from './fixtures.mjs';
import { phase as cuePhase } from '../../lib/scene.mjs';
export const clamp01 = (value) => Math.max(0, Math.min(1, value));
export function balancedChildren(text = LONG_SECTION, size = 7, minimum = 4) {
  const words = [...text.matchAll(/\S+/g)],
    count = Math.ceil(words.length / size),
    base = Math.floor(words.length / count),
    extra = words.length % count;
  let cursor = 0;
  return Array.from(
    {
      length: count,
    },
    (_, i) => {
      const length = base + Number(i < extra),
        start = words[cursor].index,
        end = words[cursor + length - 1].index + words[cursor + length - 1][0].length;
      cursor += length;
      return {
        length,
        start,
        end,
        text: text.slice(start, end),
        review: length < minimum,
      };
    },
  );
}
export function topicVector(text) {
  const words = new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  return [
    ['rollback', 'deploy', 'minutes', 'id'],
    ['commander', 'handoff', 'channel'],
  ].map((axis) => axis.filter((word) => words.has(word)).length);
}
export function cosine(left, right) {
  const norms = Math.hypot(...left) * Math.hypot(...right);
  return norms ? left.reduce((sum, value, i) => sum + value * right[i], 0) / norms : null;
}
export const cueProgress = (state, id, fallback = 0) => {
  const cue = state.cues?.[id];
  return cue
    ? cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : cue.progress
    : state.cues
      ? 0
      : fallback;
};
export const cueBegun = (state, id, fallback = false) => {
  const cue = state.cues?.[id];
  return cue ? cue.phase !== 'before' : state.cues ? false : fallback;
};
export function parentRevealProgress(beat, progress) {
  if (beat < 1) return 0;
  if (beat > 1) return 1;
  return cuePhase(progress, PARENT_REVEAL_START, PARENT_REVEAL_END);
}
export function fixedWindows(text, size, overlap) {
  if (
    !Number.isInteger(size) ||
    !Number.isInteger(overlap) ||
    size <= 0 ||
    overlap < 0 ||
    overlap >= size
  )
    throw new Error('require size > overlap >= 0');
  const words = text.split(/\s+/);
  const chunks = [];
  for (let start = 0; start < words.length; start += size - overlap) {
    const end = Math.min(start + size, words.length);
    chunks.push({
      start,
      end,
      words: words.slice(start, end),
      text: words.slice(start, end).join(' '),
    });
    if (end === words.length) break;
  }
  return chunks;
}
export function requiredPhrasesPresent(text) {
  const normalized = text.toLowerCase();
  return ['rollback failure', '15 minutes', 'deploy id'].every((phrase) =>
    normalized.includes(phrase),
  );
}
