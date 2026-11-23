import { spoken } from '../construction.mjs';
import { exception, policy } from '../fixtures.mjs';
import { wordCount } from '../arithmetic.mjs';

const first = wordCount(exception);
const second = wordCount(policy);
const required = first + second;
const initial = 18;

export function drawPacking(ctx, scene, state, api) {
  const { C } = api;
  const cue = (id) => spoken(scene, state, id);
  const growth = cue('packing-expand').progress;
  const budget = initial + Math.round((required - initial) * growth);
  const policyReady = cue('packing-policy').phase !== 'before';
  const loaded = cue('packing-exception').phase === 'after';
  const selected = loaded ? first + (budget >= required && policyReady ? second : 0) : 0;
  const x = (n) => 180 + n * 51;
  api.text(ctx, 'Whole passages in retrieval order', 180, 275, 39, C.ink);
  api.text(ctx, 'Budget unit · regex words', 1740, 270, 30, C.muted, 'right');
  api.focus.target('pack-tape', () => {
    api.rect(ctx, x(0), 438, x(30) - x(0), 134, C.panel, C.muted, 4);
    const blocks = [
      {
        start: 0,
        words: first,
        label: 'exception@1',
        color: C.green,
        cue: cue('packing-exception'),
      },
      { start: first, words: second, label: 'policy@2', color: C.blue, cue: cue('packing-policy') },
    ];
    for (const block of blocks) {
      const { start, words, label, color, cue: enter } = block;
      if (enter.phase === 'before') continue;
      const width = (x(start + words) - x(start) - 8) * enter.progress;
      if (width > 1)
        api.rect(
          ctx,
          x(start) + 4,
          457,
          width,
          94,
          budget >= start + words ? color : C.panel,
          color,
          3,
        );
      if (enter.phase === 'after')
        api.text(
          ctx,
          `${label}  ·  ${words} words`,
          x(start) + 24,
          519,
          35,
          budget >= start + words ? C.bg : color,
        );
    }
    for (const n of [0, first, initial, required, 30]) {
      api.line(ctx, x(n), 580, x(n), 595, C.muted, 2);
      api.text(ctx, String(n), x(n), 642, 32, C.muted, 'center');
    }
  });
  api.focus.target('pack-budget', () => {
    api.text(ctx, `Budget  ${budget}`, x(budget), 378, 41, C.yellow, 'center');
    api.line(ctx, x(budget), 392, x(budget), 432, C.yellow, 5);
    api.line(ctx, x(budget), 554, x(budget), 577, C.yellow, 5);
  });
  api.focus.target('pack-slots', () => {
    api.text(ctx, `${selected} of ${budget} words packed`, 180, 760, 40, C.ink);
    if (loaded && budget < required)
      api.text(ctx, `${budget - selected} spaces left`, 1740, 757, 33, C.yellow, 'right');
    if (cue('packing-ask').phase !== 'before' && cue('packing-answer').phase === 'before')
      api.text(
        ctx,
        'How many more words of budget would fit the whole policy?',
        180,
        903,
        39,
        C.yellow,
      );
    else if (cue('packing-answer').phase !== 'before')
      api.text(
        ctx,
        selected === required
          ? 'Both passages fit, including “only with security approval.”'
          : `${second} needed − ${initial - first} free = ${required - initial} more words`,
        180,
        903,
        38,
        selected === required ? C.green : C.ink,
      );
  });
}

export default {
  id: 'packing',
  draw: drawPacking,
  cues: [
    'packing-budget',
    'packing-exception',
    'packing-policy',
    'packing-ask',
    'packing-answer',
    'packing-expand',
  ],
};
