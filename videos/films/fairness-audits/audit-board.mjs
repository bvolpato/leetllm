import { lexicalTokens } from '../../lib/captions.mjs';
import { validateVisualCues } from '../../lib/narration-cues.mjs';
import { THRESHOLD } from './fixtures.mjs';
import { route } from './arithmetic.mjs';

const storyboardCues = new WeakMap();

function storyboardProgress(scene, state, id) {
  if (!storyboardCues.has(scene)) {
    const declarations = validateVisualCues(scene);
    storyboardCues.set(
      scene,
      new Map(
        declarations.map((cue) => [
          cue.id,
          { ...cue, words: lexicalTokens(scene.beats[cue.beat].say).length },
        ]),
      ),
    );
  }
  const cue = storyboardCues.get(scene).get(id);
  if (state.beat !== cue.beat) return state.beat > cue.beat ? 1 : 0;
  const word = Math.min(1, state.beatP / 0.88) * cue.words;
  return Math.max(0, Math.min(1, (word - cue.first) / (cue.last - cue.first + 1)));
}

export function auditBoard(ctx, scene, state, api) {
  const { C } = api;
  const progress = (id) =>
    state.cues ? state.cues[id].progress : storyboardProgress(scene, state, id);
  const after = (id) => (state.cues ? state.cues[id].phase === 'after' : progress(id) >= 1);
  const text = (s, x, y, size = 37, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const line = (x, y, u, v, color = C.muted, width = 3) => api.line(ctx, x, y, u, v, color, width);
  const rect = (x, y, w, h, fill, stroke, radius = 8) =>
    api.rect(ctx, x, y, w, h, fill, stroke, radius);
  const dot = (x, y, radius, color) => api.circle(ctx, x, y, radius, color);
  const focus = (id, draw) => api.focus.target(id, draw);
  function ticket(label, x, y, color, width = 96) {
    rect(x - width / 2, y - 32, width, 64, C.panel, color);
    text(label, x, y + 13, 35, color, 'center');
  }
  return {
    C,
    text,
    line,
    rect,
    dot,
    focus,
    ticket,
    progress,
    after,
    started: (id) => progress(id) > 0,
  };
}

export const wordings = ['formal', 'conversational'];
export const wordingLabel = (key) => (key === 'formal' ? 'Formal' : 'Conversational');
export const wordingColor = (C, key) => (key === 'formal' ? C.blue : C.pink);
export const isAuto = (score, cutoff = THRESHOLD) => route(score, cutoff) === 'auto_serve';

// Each claim owns a column through both wordings, including while it changes route.
export function routeLedger(board, cases, position, tally, tallyTarget) {
  const { C, text, line, ticket, focus } = board;
  const left = 565,
    step = 158;
  cases.forEach((row, i) => text(row.id, left + i * step, 344, 33, C.muted, 'center'));
  wordings.forEach((key, j) => {
    const y = 425 + j * 274,
      color = wordingColor(C, key);
    text(wordingLabel(key), 112, y + 71, 40, color);
    for (const [offset, label] of [
      [0, 'Auto'],
      [130, 'Review'],
    ]) {
      text(label, 452, y + offset + 11, 31, C.muted, 'right');
      for (let i = 1; i < cases.length; i++) {
        const x = left + i * step;
        line(x - step + 50, y + offset, x - 50, y + offset, '#444954', 2);
      }
    }
    cases.forEach((row, i) => {
      const slot = position(row, key);
      ticket(row.id, left + i * step, y + 130 * slot, color, 94);
    });
    const drawCount = () => {
      const count = tally(key);
      text(
        count === null ? '? / ' + cases.length : count + ' / ' + cases.length,
        1625,
        y + 65,
        67,
        color,
        'center',
      );
      text('auto-served', 1625, y + 119, 30, C.muted, 'center');
    };
    if (tallyTarget) focus(tallyTarget, drawCount);
    else drawCount();
  });
}
