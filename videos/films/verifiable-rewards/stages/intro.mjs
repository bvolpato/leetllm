import { capacityScore, openingFields } from '../capacity.mjs';
import { spokenProgress } from '../drawing.mjs';

const expected = 14 * 12;
const submissions = openingFields.map((fields) => ({
  numbers: fields.map((field) => field.match(/\d+/)[0]),
  reward: capacityScore(fields.join(' then '), expected, false),
}));

function boxedNumber(ctx, api, value, x, baseline, outline = 1) {
  const { C } = api;
  const left = x - 143;
  const right = x + 143;
  const top = baseline - 108;
  const bottom = baseline + 43;
  api.rect(ctx, left, top, right - left, bottom - top, C.ink, undefined, 0);
  api.text(ctx, value, x, baseline + 3, 90, C.panel, 'center', 'mono');
  const tip = api.trace(
    ctx,
    [
      { x: left, y: top },
      { x: right, y: top },
      { x: right, y: bottom },
      { x: left, y: bottom },
      { x: left, y: top },
    ],
    outline,
    C.panel,
    4,
  );
  if (outline < 1) {
    api.line(ctx, tip.x + 3, tip.y - 4, tip.x + 31, tip.y - 24, C.panel, 12);
    api.line(ctx, tip.x + 10, tip.y - 8, tip.x + 32, tip.y - 25, C.yellow, 8);
  }
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const t = state.t ?? 0;
  if (t < 0.35) ctx.globalAlpha = 1;
  const p = spokenProgress(api, state);
  const rule = p('intro-rule', 1, 0, 0.35);
  const scan = p('intro-read', 2, 0.06, 0.24);
  const award = p('intro-award', 2, 0.3, 0.45) >= 1;
  const firstX = 568;
  const lastX = 1114;
  const scoreX = 1638;
  const revision = submissions[1].numbers[1];
  const outline = Math.min(1, 0.15 + t / 1.1);

  api.text(ctx, 'Answer key', 158, 277, 40, C.muted);
  api.text(ctx, '14 × 12 = ' + expected, 459, 285, 66, C.ink);
  const row = (i, y) => {
    const { numbers, reward } = submissions[i];
    const edge = i ? 1367 : 793;
    api.rect(ctx, 149, y - 186, edge - 149, 245, C.ink, undefined, 9);
    api.text(ctx, i ? 'Submission B' : 'Submission A', 183, y - 126, 39, C.panel);
    api.focus.target('first-boxes', () => {
      boxedNumber(ctx, api, numbers[0], firstX, y);
      if (scan > 0) {
        const x = api.lerp(firstX - 132, firstX, scan);
        api.line(ctx, x - 80, y + 21, x + 80, y + 21, C.blue, 8);
      }
    });
    if (i) {
      api.text(ctx, 'then', 849, y - 16, 48, C.panel, 'center');
      api.focus.target('second-box', () => {
        boxedNumber(ctx, api, revision, lastX, y, outline);
      });
    }
    api.focus.target('scores', () => {
      api.text(ctx, 'Reward', scoreX, y - 95, 40, C.muted, 'center');
      api.text(
        ctx,
        award ? String(reward) : '?',
        scoreX,
        y + 10,
        102,
        award ? C.green : C.ink,
        'center',
      );
    });
  };
  row(1, 557);
  if (state.beat >= 2) row(0, 835);
  if (rule > 0)
    api.focus.target('read-rule', () =>
      api.text(ctx, 'First box matches the key → 1 point', 158, 994, 42, C.yellow),
    );
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-extra', 'intro-rule', 'intro-read', 'intro-award'],
};
