import { spokenProgress } from '../drawing.mjs';

const submissions = [
  'The answer is \\boxed{148}.',
  'The answer is 168.',
  'The answer is \\boxed{168}.',
];
const expected = 14 * 12;
function grade(text) {
  const field = text.match(/\\boxed\{([0-9]{1,20})\}/);
  const boxed = text.split('\\boxed').length === 2 && field !== null;
  return {
    style: boxed ? 0.7 : text.includes(String(expected)) ? 0.3 : 0,
    exact: Number(boxed && Number(field[1]) === expected),
  };
}
export function drawRewardPriority(ctx, scene, state, api) {
  const { C } = api;
  const p = spokenProgress(api, state);
  const scored = p('priority-style', 0, 0.15, 0.4);
  const exact = p('priority-rescore', 2, 0.01, 0.2);
  const newRule = state.beat >= 1;
  api.focus.target('priority-rule', () => {
    api.text(
      ctx,
      newRule ? 'Require one box containing 168' : 'Reference   168',
      175,
      278,
      42,
      C.yellow,
    );
    api.text(ctx, 'Submitted text', 175, 386, 32, C.muted);
  });
  const anchor = 955;
  submissions.forEach((text, i) => {
    const { style, exact: reward } = grade(text);
    const y = 485 + 154 * i;
    api.text(ctx, text, 175, y + 10, 39, C.ink, 'left', 'mono');
    api.focus.target('priority-scores', () => {
      if (i === 0)
        api.text(
          ctx,
          newRule ? 'Old score  →  exact boxed score' : 'Format-weighted score',
          anchor,
          386,
          32,
          C.muted,
        );
      if (!newRule) {
        const q = style * scored;
        if (q > 0) api.rect(ctx, anchor, y - 25, 620 * q, 36, C.blue, undefined, 5);
        if (scored >= 1) api.text(ctx, style.toFixed(1), 1650, y + 10, 44, C.blue);
      } else {
        api.text(ctx, style.toFixed(1), anchor, y + 10, 39, C.muted);
        const x = anchor + 170;
        if (exact > 0 && reward > 0)
          api.rect(ctx, x, y - 25, 470 * reward * exact, 36, C.green, undefined, 5);
        api.text(
          ctx,
          exact > 0 ? String(reward) : '?',
          1650,
          y + 10,
          44,
          exact > 0 ? (reward ? C.green : C.pink) : C.ink,
        );
      }
    });
  });
  if (state.beat === 1)
    api.text(ctx, 'What does the plain answer earn?', 960, 965, 43, C.ink, 'center');
}

export default {
  id: 'reward-priority',
  draw: drawRewardPriority,
  cues: ['priority-style', 'priority-rank', 'priority-rule', 'priority-rescore'],
};
