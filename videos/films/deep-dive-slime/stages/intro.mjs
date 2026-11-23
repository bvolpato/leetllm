import { mask, tokens } from '../fixtures.mjs';
import { lerp, sum } from '../arithmetic.mjs';
import { progress } from '../phrase-clock.mjs';
import { receipt, receiptTarget, responseTape, tokenX } from '../response-tape.mjs';

function appendPair(ctx, api, first, progress, color, label) {
  const left = tokenX(first + 2);
  api.text(ctx, label, left + 100, 417, 33, color, 'center');
  api.line(ctx, left - 80, 441, left + 281, 441, color, 3);
  for (let i = 0; i < 2; i++) {
    const x = lerp(465 + 201 * i, left + 201 * i, progress / 0.64);
    const y = lerp(775, 534, (progress - 0.64) / 0.36);
    api.rect(ctx, x - 79, y - 56, 158, 111, api.C.panel, color, 8);
    api.text(ctx, String(tokens[first + i]), x, y + 23, 60, color, 'center');
  }
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const p = (id) => progress(scene, state, id);
  const graded = p('grade-patch') === 1;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  return api.focus.target(receiptTarget, () => {
    if (state.beat === 0) {
      const editing = p('edit-index') > 0;
      const patched = p('edit-index') === 1;
      const tool = 0.08 + 0.2 * Math.min((state.t ?? 0) / 0.4, 1) + 0.72 * p('tool-output');
      api.rect(ctx, 102, 230, 818, 452, C.panel, editing ? C.blue : C.yellow, 14);
      api.text(
        ctx,
        editing ? 'Agent patch  /  last.py' : 'Test tool',
        152,
        308,
        40,
        editing ? C.blue : C.yellow,
      );
      api.line(ctx, 152, 348, 870, 348, C.muted, 2);
      if (editing) {
        api.text(ctx, 'def last(xs):', 152, 457, 55, C.ink, 'left', 'mono');
        api.text(
          ctx,
          patched ? 'return xs[-1]' : 'return xs[0]',
          202,
          576,
          66,
          patched ? C.blue : C.ink,
          'left',
          'mono',
        );
      } else {
        api.text(ctx, 'last([3, 7])', 152, 456, 60, C.ink, 'left', 'mono');
        api.text(ctx, 'got 3', 152, 581, 92, C.pink, 'left', 'mono');
        api.text(ctx, 'expected 7', 478, 581, 52, C.ink, 'left', 'mono');
      }
      api.text(ctx, 'Rollout 7  /  response tokens', 1058, 308, 41, C.ink);
      appendPair(ctx, api, 2, tool, C.yellow, 'Tool returns');
      if (patched) appendPair(ctx, api, 4, p('agent-patch'), C.blue, 'Model writes patch');
      if (graded) {
        api.text(ctx, 'Clean test: 7 = 7', 1058, 774, 46, C.green);
        if (p('grade-score') === 1) api.text(ctx, 'Reward  1.0', 1058, 867, 59, C.green);
      }
      return;
    }
    receipt(ctx, api, 'Clean grader  /  reward 1.0');
    if (p('inspect-mask') === 0) {
      responseTape(ctx, api, {});
      return;
    }
    const wrongIndex = tokens.indexOf(50);
    const repaired = p('fix-mask') === 1;
    const proposed = mask.map((bit, i) => (i === wrongIndex && !repaired ? 1 : bit));
    responseTape(ctx, api, {
      masks: proposed,
      highlighted: p('locate-id') > 0 ? wrongIndex + 2 : -1,
    });
    api.text(
      ctx,
      `${sum(proposed)} selected targets   /   ${tokens.length} response IDs`,
      960,
      840,
      40,
      C.ink,
      'center',
    );
    const message =
      p('locate-id') < 1
        ? 'Which ID has a 1 it should lose?'
        : repaired
          ? 'The tool output stays in the sequence.'
          : 'ID 50 came from the tool.';
    api.text(ctx, message, 960, 950, 42, state.beat === 1 ? C.yellow : C.cyan, 'center');
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'tool-output',
    'edit-index',
    'grade-patch',
    'grade-score',
    'agent-patch',
    'inspect-mask',
    'locate-id',
    'fix-mask',
  ],
};
