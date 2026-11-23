import { split } from '../arithmetic.mjs';
import { rows, stump } from '../fixtures.mjs';
import { drawConstructionText as label } from '../defaults.mjs';
import { ambiguityX, drawAmbiguityStrip, drawLegend } from '../ambiguity-strip.mjs';

// Slots show ambiguity order. The full strip below shows the distances between values.
const badgeSlots = [
  { index: 2, x: 383 },
  { index: 7, x: 905 },
  { index: 3, x: 1503 },
];

function drawBadges(ctx, api, time) {
  const { C } = api;
  const railY = 773;
  const cutX = (badgeSlots[1].x + badgeSlots[2].x) / 2;
  const landing = api.phase(time + 0.24, 0, 1.52);
  api.line(ctx, 130, railY, cutX - 8, railY, C.muted, 7);
  api.line(ctx, cutX + 8, railY, 1790, railY, C.cyan, 7);
  label(ctx, api, 'Automatic checks', 660, 897, 51);
  label(ctx, api, 'Checks + human review', 1500, 897, 46, C.cyan);
  api.focus.target('divider', () => {
    api.line(ctx, cutX, 370, cutX, railY + 42, C.yellow, 7);
    label(ctx, api, 'Cut ' + stump.cut.toFixed(2), cutX, 323, 40, C.yellow);
  });
  for (const { index, x } of badgeSlots) {
    const [ambiguity, , review] = rows[index];
    const color = review ? C.pink : C.blue;
    const top = api.lerp(250, 445, landing);
    const drawBadge = () => {
      api.circle(ctx, x, railY, 12, color);
      api.rect(ctx, x - 193, top, 386, 300, color, undefined, 25);
      // The punch and key make this readable as an access badge at a glance.
      api.rect(ctx, x - 40, top + 18, 80, 11, C.bg, undefined, 5);
      api.circle(ctx, x - 119, top + 94, 25, color, C.bg, 10);
      api.line(ctx, x - 95, top + 94, x - 40, top + 94, C.bg, 10);
      api.line(ctx, x - 53, top + 94, x - 53, top + 109, C.bg, 10);
      label(ctx, api, 'R' + (index + 1), x + 48, top + 120, 73, C.bg);
      label(ctx, api, 'Ambiguity ' + ambiguity.toFixed(1), x, top + 182, 38, C.bg);
      api.line(ctx, x - 160, top + 209, x + 160, top + 209, C.bg, 2);
      label(ctx, api, review ? 'Needed review' : 'Routine', x, top + 268, 45, C.bg);
    };
    if (index === 2) api.focus.target('training-rthree', drawBadge);
    else drawBadge();
  }
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const progress = state.beatP ?? 0;
  const time = state.t ?? 0;
  if (time < 0.35) ctx.globalAlpha = 1;
  const widen =
    beat > 1 ||
    (beat === 1 && api.focus.progress('all-requests', api.phase(progress, 0.22, 0.43)) === 1);
  if (!widen) {
    drawBadges(ctx, api, time);
    return;
  }
  const slide = api.focus.progress(
    'catch-rthree',
    beat < 1 ? 0 : beat > 1 ? 1 : api.phase(progress, 0.49, 0.81),
  );
  const cut = api.lerp(stump.cut, (rows[1][0] + rows[2][0]) / 2, slide);
  const group = split(rows, 0, cut);
  drawLegend(ctx, api);
  const named = beat === 2 && api.focus.progress('joined-queue', api.phase(progress, 0, 0.1)) === 1;
  drawAmbiguityStrip(ctx, api, {
    cut,
    labelCut: slide === 0 || slide === 1,
    marked: named ? [6, 7] : [2],
  });
  // The brackets follow the cut. The two color counts are recomputed from the rows.
  const x = ambiguityX(cut);
  for (const [a, b, title, color] of [
    [130, x - 12, 'Automatic checks', C.muted],
    [x + 12, 1770, 'Send to review', C.cyan],
  ]) {
    api.path(
      ctx,
      [
        { x: a, y: 660 },
        { x: a, y: 690 },
        { x: b, y: 690 },
        { x: b, y: 660 },
      ],
      { color, width: 4 },
    );
    label(ctx, api, title, (a + b) / 2, 748, 37, color);
  }
  const misses = group.left.filter((row) => row[2] === 1).length;
  const extras = group.right.filter((row) => row[2] === 0).length;
  api.focus.target('queue-result', () =>
    label(
      ctx,
      api,
      named
        ? misses + ' missed reviews     ·     ' + extras + ' unnecessary reviews'
        : 'Which routine requests move to the review side?',
      960,
      925,
      46,
      C.ink,
    ),
  );
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['first-divider', 'name-exception', 'all-requests', 'catch-rthree', 'joined-queue'],
};
