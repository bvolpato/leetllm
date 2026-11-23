import { admissionBudget } from '../arithmetic.mjs';
import { cueClock, footer } from '../routing.mjs';

const now = (22 * 60 + 45) * 60;
const start = now - 3600;
const first = { at: now - 1800, from: 0, to: 9 };
const next = { at: now, from: 9, to: 18 };
const limit = 10;

function budgetBar(ctx, api, prior, proposed, showTotal) {
  const { C } = api;
  const x = 260,
    y = 731,
    step = 72;
  api.text(ctx, 'Increases counted in this hour', x, 674, 34, C.ink);
  api.line(ctx, x, y + 60, x + step * 20, y + 60, C.muted, 2);
  if (prior) api.rect(ctx, x, y, prior * step, 57, C.blue, undefined, 2);
  if (proposed) api.rect(ctx, x + prior * step, y, proposed * step, 57, C.yellow, undefined, 2);
  api.line(ctx, x + limit * step, y - 24, x + limit * step, y + 84, C.ink, 4);
  api.text(ctx, '10-point limit', x + limit * step, y + 134, 31, C.ink, 'center');
  if (showTotal) api.text(ctx, prior + proposed + ' points', 1700, 674, 42, C.ink, 'right');
}

export function drawWeekendBudget(ctx, scene, state, api) {
  const { C } = api;
  const cue = cueClock(scene, state);
  const done = (id) => cue(id).phase === 'after';
  if (state.beat === 0) {
    api.focus.target('policy', () => {
      api.text(ctx, 'Saturday · 03:00 local', 115, 342, 51, C.ink, 'left', 'serif');
      api.text(ctx, 'Promotions', 115, 496, 40, C.ink);
      api.text(ctx, 'Ordinary approval', 980, 496, 40, C.yellow);
      api.text(ctx, 'More than 10 points added in one hour', 115, 632, 38, C.ink);
      api.text(ctx, 'Senior review', 980, 632, 40, C.yellow);
      api.text(ctx, 'Two failed rollouts in the last hour', 115, 768, 38, C.ink);
      if (done('weekend-floor')) api.text(ctx, 'Block write-tier work', 980, 768, 40, C.pink);
      footer(ctx, api, 'Vega’s weekend policy · one service', C.muted);
    });
    return;
  }
  if (state.beat === 4) {
    const reserved = done('weekend-reserve');
    const shared = admissionBudget([], now, [first]);
    api.focus.target('window', () => {
      api.text(ctx, 'Two concurrent requests', 115, 316, 48, C.ink, 'left', 'serif');
      api.text(ctx, 'Worker A requests +9', 260, 473, 43, C.blue);
      api.text(ctx, 'Worker B requests +9', 1080, 473, 43, C.yellow);
      api.text(
        ctx,
        reserved ? 'A has reserved 9 points' : 'Each worker sees 0 points used',
        260,
        564,
        34,
        C.muted,
      );
    });
    api.focus.target('budget', () => {
      budgetBar(ctx, api, reserved ? shared : 0, next.to - next.from, true);
      footer(
        ctx,
        api,
        reserved
          ? 'B needs senior review with A’s reservation included.'
          : 'B’s private view of this request',
        reserved ? C.yellow : C.muted,
      );
    });
    return;
  }
  const moved = cue('weekend-boundary');
  const earlierAt = Math.round(first.at + (start - first.at) * moved.progress);
  const earlier = { ...first, at: earlierAt };
  const firstOnly = state.beat === 1 && cue('weekend-next').phase === 'before';
  const showSum =
    state.beat < 2 ? done(firstOnly ? 'weekend-first' : 'weekend-second') : done('weekend-answer');
  const prior = admissionBudget([earlier], now);
  const proposed = next.to - next.from;
  api.focus.target('window', () => {
    const left = 260,
      right = 1700,
      y = 445;
    api.text(
      ctx,
      firstOnly ? 'First request   22:15' : 'Second request   22:45',
      115,
      284,
      45,
      C.ink,
      'left',
      'serif',
    );
    if (firstOnly) {
      api.text(ctx, 'Earlier increases: 0 points', left, 453, 37, C.muted);
      api.text(ctx, 'Requested live share    0% → 9%', left, 556, 40, C.yellow);
    } else {
      const x = left + ((right - left) * (earlierAt - start)) / 3600;
      api.line(ctx, left, y, right, y, C.muted, 3);
      api.circle(ctx, left, y, 15, C.bg, C.muted, 3);
      api.circle(ctx, right, y, 15, C.yellow);
      api.circle(ctx, x, y, 12, C.blue);
      api.text(ctx, 'Earlier +9', x, y - 58, 34, C.blue, 'center');
      api.text(ctx, 'New +9', right, y - 58, 34, C.yellow, 'center');
      api.text(ctx, '21:45 · excluded', left, y + 80, 32, C.muted, 'center');
      api.text(ctx, '22:15', (left + right) / 2, y + 80, 32, C.muted, 'center');
      api.text(ctx, '22:45 · included', right, y + 80, 32, C.muted, 'center');
    }
  });
  api.focus.target('budget', () => {
    if (state.beat >= 2 && !done('weekend-answer')) {
      budgetBar(ctx, api, 0, 0, false);
      api.text(ctx, 'Requested share  9% → 18%', 1700, 674, 36, C.ink, 'right');
      footer(ctx, api, 'Does this request still need senior review?', C.yellow);
    } else {
      budgetBar(
        ctx,
        api,
        firstOnly ? 0 : prior,
        done(firstOnly ? 'weekend-first' : 'weekend-add') ? proposed : 0,
        showSum,
      );
      if (showSum) {
        const sum = firstOnly ? proposed : prior + proposed;
        footer(
          ctx,
          api,
          sum > limit
            ? done('weekend-escalate')
              ? '18 points exceeds 10. Senior review.'
              : '9 earlier + 9 proposed'
            : '9 points is within 10. Ordinary approval.',
          C.yellow,
        );
      }
    }
  });
}
export default {
  id: 'weekend-budget',
  draw: drawWeekendBudget,
  cues: [
    'weekend-floor',
    'weekend-first',
    'weekend-next',
    'weekend-add',
    'weekend-second',
    'weekend-escalate',
    'weekend-boundary',
    'weekend-ask',
    'weekend-answer',
    'weekend-race',
    'weekend-reserve',
  ],
};
