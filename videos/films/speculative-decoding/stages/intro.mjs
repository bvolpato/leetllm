import { heard, movement } from '../construction.mjs';
import { CHAIN } from '../fixtures.mjs';

const words = CHAIN.map((row) => row.words[row.candidate]);
const centers = [809, 1166, 1523];
const draftCues = ['draft-sang', 'draft-softly', 'draft-today'];

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const text = (s, x, y, size, color, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const kept = heard(state, 2, 'keep-sang', 0.32);
  const dropped = movement(state, 2, 'old-history', 0.48, 0.63);
  const space = heard(state, 2, 'open-space', 0.9);
  const answer = heard(state, 2, 'trace-history', 0.15);
  const checking = movement(state, 1, 'verify-line', 0.05, 0.32) > 0;
  const y = 499;
  const cursor = kept ? 967 : 639;

  api.focus.target('reader-line', () => {
    text('Reader sees', 213, 342, 39, C.green);
    text('The bird', 210, y, 107, C.ink);
    api.line(ctx, cursor, y - 90, cursor, y + 12, C.green, 6);
    if (kept) text(words[0], centers[0], y, 107, C.ink, 'center');
    if (space) {
      api.line(ctx, 1026, y + 14, 1306, y + 14, C.green, 4);
      text('Next word', 1026, 342, 39, C.green);
    }
  });

  api.focus.target('draft-line', () => {
    if (!kept) text('Draft guesses', 685, 342, 39, C.cyan);
    else if (dropped === 0) text('Draft guesses', 1026, 342, 39, C.cyan);
    for (const [i, word] of words.entries()) {
      if (kept && i === 0) continue;
      const x = centers[i];
      const baseline = y + (i > 0 ? 148 * dropped : 0);
      const color = dropped > 0 && i > 0 ? C.pink : C.cyan;
      text(word, x, baseline, 107, color, 'center');
      const progress = movement(state, 0, draftCues[i], 0.35 + 0.2 * i, 0.48 + 0.2 * i);
      if (progress > 0) api.line(ctx, x - 123, baseline + 30,
        x - 123 + 246 * progress, baseline + 30, color, 5);
    }
  });

  api.focus.target('score-line', () => {
    if (!checking) return;
    text('Target', 210, 840, 43, C.blue);
    text('One pass', 210, 902, 36, C.muted);
    const preceding = ['bird', words[0], words[1]];
    const sources = [548, centers[0], centers[1]];
    for (const [i, x] of centers.entries()) {
      const highlighted = i === 2;
      const showSource = !highlighted || answer;
      const skipped = highlighted && dropped >= 1;
      const color = skipped ? C.muted : highlighted ? C.yellow : C.blue;
      if (showSource) {
        const sourceY = y + 66 + (highlighted ? 148 * dropped : 0);
        api.arrow(ctx, sources[i], sourceY, x - 25, 765, color, 4);
      }
      text((skipped ? 'Skip ' : 'Score ') + words[i], x, 839, 44, skipped ? C.pink : C.blue, 'center');
      text(showSource ? 'after ' + preceding[i] : 'after which word?', x, 905, 37,
        highlighted ? color : C.muted, 'center');
    }
  });
}

export default {
  id: 'intro', draw: drawIntro,
  cues: [...draftCues, 'verify-line', 'ask-history', 'trace-history', 'keep-sang',
    'open-space', 'old-history', 'sampler-question'],
};
