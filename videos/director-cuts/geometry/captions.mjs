import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const phrases = {
  ruler: ['Now lay a ruler along the blue search arrow.', 'Where does each tip land?'],
  drop: ['Drop a straight line from each tip.', 'Rotation lands at one.', 'Audit reaches four.'],
  raw: [
    'That reach is the dot product with our unit query.',
    'Audit wins.',
    'Its extra length counts.',
  ],
  question: [
    'What if this search should reward direction alone?',
    'Keep both guides pointed where they are.',
  ],
  normalize: ['Slide each tip along its ray', 'until both arrows are one unit long.'],
  macro: [
    'Look closely at the marks.',
    'Rotation now reaches farther along the query.',
    "That's the cosine score.",
  ],
  predict: [
    'Keep those lengths.',
    'Which guide will point closer',
    'when the search turns straight up?',
  ],
  turn: ['Turn the ruler with the query.', 'Watch where the marks trade places.'],
  settle: ['Audit is closer to straight up.', 'Its mark now reaches farther along the ruler.'],
};
const normalize = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

function stamp(ms) {
  return new Date(ms).toISOString().slice(11, 23).replace('.', ',');
}
function parseStamp(value) {
  const [h, m, s] = value.split(':');
  return Math.round((Number(h) * 3600 + Number(m) * 60 + Number(s.replace(',', '.'))) * 1000);
}
export function buildCaptions(master, openingFrames, timing) {
  const raw = execFileSync(
    'ffmpeg',
    ['-v', 'error', '-i', master, '-map', '0:s:0', '-f', 'srt', 'pipe:1'],
    { encoding: 'utf8' },
  );
  const boundary = Math.round((openingFrames * 1000) / 30);
  const cues = [];
  for (const block of raw.trim().split(/\n\s*\n/)) {
    const [, times, ...words] = block.split('\n');
    const [start, end] = times.split(' --> ').map(parseStamp);
    if (start < boundary) cues.push({ start, end: Math.min(end, boundary), text: words.join(' ') });
  }
  for (const { id, start, words } of timing.schedule) {
    let count = 0;
    for (const text of phrases[id]) {
      const first = count;
      let tokens = '';
      while (count < words.length && tokens.length < normalize(text).length)
        tokens += normalize(words[count++].text);
      assert.equal(tokens, normalize(text), `Caption does not match ${id}`);
      cues.push({
        start: boundary + Math.round((start + words[first].start) * 1000),
        end: boundary + Math.round((start + words[count - 1].end) * 1000),
        text,
      });
    }
    assert.equal(count, words.length);
  }
  cues.forEach((c, i) => assert(c.end > c.start && (i === 0 || c.start >= cues[i - 1].end)));
  return cues
    .map((c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`)
    .join('\n');
}
