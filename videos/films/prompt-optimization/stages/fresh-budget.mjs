import { plannedPromptRequests } from '../arithmetic.mjs';
import { complete, started } from '../policy-sheet.mjs';
import { text } from '../defaults.mjs';

const cases = 24;
const limit = 650;
const teacher = 12;
const proposals = 9;
const initial = plannedPromptRequests({ trials: 8, cases, teacher, proposals });
const reduced = plannedPromptRequests({ trials: 7, cases, teacher, proposals });

function requestRuler(ctx, api, { mark, caption, previous }) {
  const { C } = api;
  const x = (requests) => 215 + (requests - 560) * 12;
  const y = 846;
  api.line(ctx, x(560), y, x(685), y, C.muted, 3);
  for (const tick of [560, 590, 620, 650, 680]) {
    api.line(ctx, x(tick), y - 10, x(tick), y + 13, C.muted, 2);
    text(ctx, api, String(tick), x(tick), y + 56, 31, C.muted, 'center');
  }
  api.line(ctx, x(limit), y - 24, x(limit), y, C.yellow, 4);
  text(ctx, api, 'Cap 650', x(limit), y - 115, 38, C.yellow, 'center');
  if (previous) {
    api.circle(ctx, x(initial.requests), y, 11, C.muted);
    text(
      ctx,
      api,
      '8 trials · ' + initial.requests,
      x(initial.requests),
      y + 123,
      29,
      C.muted,
      'center',
    );
  }
  if (mark !== null) {
    const color = mark > limit ? C.pink : C.cyan;
    api.circle(ctx, x(mark), y, 14, color);
    api.line(ctx, x(mark), y - 47, x(mark), y - 15, color, 3);
    text(ctx, api, String(mark), x(mark), y - 59, 46, color, 'center');
  }
  text(ctx, api, caption, 120, 1009, 32, C.ink);
}

export function drawFreshBudget(ctx, scene, state, api) {
  const { C } = api;
  const smaller = started(state, 'cut-trial');
  const plan = smaller ? reduced : initial;
  const totalKnown = complete(state, smaller ? 'admit-plan' : 'fresh-cap');
  const rolesKnown = !smaller && complete(state, 'fresh-role-product');
  api.focus.target('worksheet', () => {
    text(ctx, api, 'Full passes', 120, 276, 34, C.muted);
    text(ctx, api, (smaller ? '7' : '8') + ' trials + 1 baseline', 120, 358, 49, C.blue);
    text(ctx, api, cases + ' cases per pass', 120, 445, 43, C.ink);
    text(ctx, api, 'Requests per case', 805, 276, 34, C.muted);
    text(
      ctx,
      api,
      started(state, 'fresh-roles') ? '2 predictors + 1 judge' : '…',
      805,
      358,
      47,
      C.ink,
    );
    if (complete(state, 'fresh-executions') && (!smaller || complete(state, 'saved-requests'))) {
      text(
        ctx,
        api,
        plan.executions + ' executions × ' + plan.roles + ' requests',
        120,
        568,
        42,
        C.cyan,
      );
    }
    if (smaller && complete(state, 'saved-requests')) {
      text(ctx, api, initial.requests - reduced.requests + ' requests saved', 120, 657, 40, C.cyan);
    }
  });
  api.focus.target('overhead', () => {
    text(ctx, api, 'Once per search', 805, 445, 34, C.muted);
    text(
      ctx,
      api,
      started(state, 'fresh-overhead')
        ? teacher + ' teacher + ' + proposals + ' proposal requests'
        : '…',
      805,
      522,
      43,
      C.yellow,
    );
  });
  api.focus.target('cap', () => {
    const mark = totalKnown ? plan.requests : rolesKnown ? initial.roleRequests : null;
    let caption = 'Planned requests · detail near the host cap';
    if (complete(state, 'fresh-reject') && !smaller)
      caption = 'REFUSE: ' + plan.requests + ' requests  ·  ' + (plan.requests - limit) + ' over cap';
    if (smaller && totalKnown)
      caption = 'Admit the smaller plan  ·  ' + (limit - plan.requests) + ' requests under cap';
    requestRuler(ctx, api, { mark, caption, previous: smaller });
  });
}
export default {
  id: 'fresh-budget',
  draw: drawFreshBudget,
  cues: [
    'fresh-roles',
    'fresh-overhead',
    'fresh-predict',
    'fresh-executions',
    'fresh-role-product',
    'fresh-cap',
    'fresh-reject',
    'cut-trial',
    'saved-requests',
    'admit-plan',
  ],
};
