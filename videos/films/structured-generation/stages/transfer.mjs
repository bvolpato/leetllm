import { retryBudget } from '../arithmetic.mjs';
import { constructionCode as code, constructionText as text } from '../defaults.mjs';
import { after } from '../page.mjs';

const limits = {
  status: 'length',
  output: 500,
  modelLimit: 600,
  call: 3,
  validation: 1,
  spent: 4,
  cost: 3,
  deadline: 12,
  limit: 8,
};
export function drawTransfer(ctx, scene, state, api) {
  const { C, focus } = api;
  focus.target('retry-clock', () => {
    const x = 349,
      scale = 93;
    const cases = [7, 8.5];
    text(ctx, api, 'Two length stops   /   one same-schema retry available', 140, 245, 36, C.ink);
    text(
      ctx,
      api,
      '500 of 600 tokens allowed   ·   total cost 4 + 3 = 7 of 8 units',
      140,
      317,
      35,
      C.muted,
    );
    const deadlineX = x + limits.deadline * scale;
    text(ctx, api, '12 s deadline', deadlineX, 430, 37, C.yellow, 'center');
    api.line(ctx, deadlineX, 462, deadlineX, 802, C.yellow, 4);
    const run = focus.progress('retry-call', 0),
      validate = focus.progress('retry-validate', 0);
    cases.forEach((elapsed, i) => {
      const y = 528 + i * 192;
      const outcome = retryBudget({ ...limits, elapsed });
      text(ctx, api, i ? 'Request B' : 'Request A', 146, y + 51, 34);
      api.rect(ctx, x, y, elapsed * scale, 66, C.panel, C.muted, 4);
      text(ctx, api, elapsed + ' s spent', x + 24, y + 47, 33);
      const proposedX = x + elapsed * scale;
      if (run > 0) api.rect(ctx, proposedX, y, run * limits.call * scale, 66, C.blue, null, 0);
      if (validate > 0)
        api.rect(ctx, proposedX + limits.call * scale, y, validate * scale, 66, C.cyan, null, 0);
      if (after(state, 'retry-outcome')) {
        code(
          ctx,
          api,
          outcome.totalTime + ' s',
          x + outcome.totalTime * scale,
          y + 119,
          37,
          outcome.allowed ? C.green : C.pink,
          'center',
        );
        text(
          ctx,
          api,
          outcome.allowed ? 'Retry' : 'Stop',
          1730,
          y + 50,
          46,
          outcome.allowed ? C.green : C.pink,
          'right',
        );
      }
    });
    text(ctx, api, 'Retry call   3 s', 355, 930, 38, C.blue);
    text(ctx, api, 'Validation   1 s', 903, 930, 38, C.cyan);
    if (state.beat === 0) text(ctx, api, 'Which fits?', 1730, 930, 38, C.yellow, 'right');
  });
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: ['retry-facts', 'retry-call', 'retry-validate', 'retry-outcome'],
};
