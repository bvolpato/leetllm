import { cueProgress, exactCue } from '../construction.mjs';
import { examples } from '../fixtures.mjs';
import { parseJsonLine } from '../arithmetic.mjs';
import { box, pyMark, rail, text } from '../defaults.mjs';

const broken = { prompt: examples[1].prompt, expected: examples[1].expected };
const original = ['', JSON.stringify(examples[0]), '', JSON.stringify(broken)];
const withArray = [...original.slice(0, 3), '[]', original[3]];

function loadUntilError(lines) {
  const accepted = [];
  for (const [index, line] of lines.entries()) {
    if (!line.trim()) continue;
    const { parsed } = parseJsonLine(line, index + 1);
    if (!parsed.accepted) return { accepted, failure: parsed };
    accepted.push(parsed.row);
  }
  return { accepted };
}

const originalLoad = loadUntilError(original);
const arrayLoad = loadUntilError(withArray);

export function drawIteratorLifetime(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const q = (id) => exactCue(state, 'py-iterator-' + id);
  const insert = cueProgress(state, 'insert-array', 1, 0.48, 0.67);
  const decoded = cueProgress(state, 'decode-array', 2, 0.04, 0.22);
  const rejected = cueProgress(state, 'reject-array', 2, 0.24, 0.37) === 1;
  const output = cueProgress(state, 'prefix-output', 2, 0.82, 0.9) === 1;
  const c = api.C;
  const firstY = 348;
  const step = 108;
  const fileLine = (i, content, color = c.blue) => {
    const y = firstY + step * i;
    text(ctx, api, String(Math.floor(i + 1)).padStart(2, '0'), 172, y + 54, 32, c.muted, 'left', true);
    rail(ctx, api, 265, y, 735, content, color, 83, 31);
  };
  const cursor = (i, color) => text(ctx, api, '◀', 1014, firstY + step * i + 57, 41, color);

  pyMark(api, 'iterator-lifetime', () => {
    text(ctx, api, 'File on disk', 172, 282, 39, c.ink);
    if (beat === 3) {
      examples.forEach((row, i) => fileLine(i, row.prompt));
      const n = Math.floor(q('retain') * examples.length);
      text(ctx, api, 'Returned list', 1140, 282, 39, c.cyan);
      examples.slice(0, n).forEach((row, i) =>
        rail(ctx, api, 1140, firstY + i * step, 565, row.prompt, c.cyan, 83, 30),
      );
      const again = q('again');
      if (again > 0) {
        const index = Math.min(examples.length - 1, Math.floor(again * examples.length));
        text(ctx, api, '◀', 1720, firstY + step * index + 57, 40, c.yellow);
      }
      text(ctx, api, 'Each accepted dictionary stays in memory.', 1140, 780, 31, c.muted);
      return;
    }

    fileLine(0, '(blank)', c.muted);
    fileLine(1, 'request 101 · valid object');
    fileLine(2, '(blank)', c.muted);
    if (insert === 1) fileLine(3, '[]', decoded > 0 ? c.yellow : c.blue);
    fileLine(3 + insert, 'request 102 · missing prediction');

    if (beat === 0) {
      const failure = originalLoad.failure;
      const physical = q('physical');
      cursor(Math.min(failure.lineNumber - 1, Math.floor(physical * original.length)), c.yellow);
      text(ctx, api, 'enumerate(handle, start=1)', 1140, 360, 33, c.cyan, 'left', true);
      if (physical === 1) {
        text(ctx, api, 'Physical line ' + failure.lineNumber, 1140, 510, 49, c.pink);
        text(ctx, api, 'Second nonblank record', 1140, 605, 37, c.ink);
        text(ctx, api, originalLoad.accepted.length + ' row accepted before the error', 1140, 684, 32, c.muted);
      }
      return;
    }

    if (beat === 1 && insert === 0) {
      const eof = q('eof');
      cursor(Math.floor(eof * original.length), c.blue);
      text(ctx, api, 'First handle · raw text', 1140, 360, 39, c.cyan);
      const read = Math.floor(eof * original.length);
      text(ctx, api, 'Lines read    ' + read, 1140, 505, 41, c.ink, 'left', true);
      if (eof === 1) text(ctx, api, 'Second loop   0 left', 1140, 603, 41, c.ink, 'left', true);
      return;
    }

    const opened = q('open');
    const failure = arrayLoad.failure;
    const lineIndex = Math.floor(decoded * (failure.lineNumber - 1));
    if (opened === 1) cursor(lineIndex, rejected ? c.pink : c.yellow);
    text(ctx, api, q('close') === 1 ? 'New handle · closed' : 'New traversal', 1140, 282, 39, c.cyan);
    if (opened > 0) {
      text(ctx, api, 'Accepted', 1140, 391, 32, c.muted);
      if (lineIndex >= 2) text(ctx, api, arrayLoad.accepted[0].prompt, 1140, 460, 36, c.ink);
    }
    if (decoded === 1) text(ctx, api, 'json.loads("[]")  →  list', 1140, 560, 34, c.ink, 'left', true);
    if (rejected) {
      text(ctx, api, 'TypeError: line ' + failure.lineNumber + ':', 1140, 648, 41, c.pink, 'left', true);
      text(ctx, api, failure.error, 1140, 712, 35, c.pink);
    }
    box(ctx, api, 1105, 786, 650, 145, c.muted);
    text(ctx, api, 'stdout', 1140, 841, 29, c.muted, 'left', true);
    if (output) text(ctx, api, '(no output)', 1140, 902, 36, c.ink, 'left', true);
  });
}

export default {
  id: 'iterator-lifetime',
  draw: drawIteratorLifetime,
  cues: [
    'py-iterator-lifetime-0', 'py-iterator-physical', 'py-iterator-lifetime-1', 'py-iterator-eof',
    'insert-array', 'py-iterator-open', 'decode-array', 'reject-array', 'py-iterator-close',
    'prefix-output', 'py-iterator-lifetime-2', 'py-iterator-retain', 'py-iterator-again',
  ],
};
