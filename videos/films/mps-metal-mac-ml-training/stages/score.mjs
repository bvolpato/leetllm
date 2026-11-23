import { fixed } from '../arithmetic.mjs';
import { full, trained } from '../model.mjs';
import { math, target, text, withMpsRootFrame } from '../defaults.mjs';
export function paintScore(ctx, scene, state, api, C, c, t, s) {
  text(ctx, api, C, 'Refund ticket  /  Billing', 960, 275, 40, C.cyan, 'center');
  if (s.step === 0) {
    const i = Math.min(15, Math.floor(s.p * 16));
    const active = [{ row: 0, column: i, fill: C.panel, stroke: C.yellow }];
    target(ctx, api, 'feature-vector', () => {
      text(ctx, api, C, 'Pooled features', 960, 380, 34, C.cyan, 'center');
      t.grid({
        x: 190,
        y: 420,
        width: 1540,
        height: 130,
        rows: 1,
        columns: 16,
        labels: [full.pooled[0].map(fixed)],
        highlights: active,
        fontSize: 26,
        fill: C.panel,
        stroke: C.cyan,
      });
    });
    target(ctx, api, 'class-weights', () => {
      text(ctx, api, C, 'Billing weights', 960, 630, 34, C.green, 'center');
      t.grid({
        x: 190,
        y: 670,
        width: 1540,
        height: 130,
        rows: 1,
        columns: 16,
        labels: [trained.weights.map((row) => row[0].toFixed(2))],
        highlights: active,
        fontSize: 28,
        fill: C.panel,
        stroke: C.green,
      });
    });
    const pairX = 190 + ((i + 0.5) * 1540) / 16;
    api.line(ctx, pairX, 555, pairX, 581, C.yellow, 5);
    math(
      ctx,
      api,
      C,
      'z_{Billing}=b+\\sum_{j=1}^{16}\\bar{x}_jw_{j,Billing}',
      960,
      940,
      47,
      C.yellow,
    );
  } else {
    const index = Math.max(0, Math.min(15, s.terms - 1)),
      contribution = trained.firstClassContributions[index];
    target(ctx, api, 'active-product', () => {
      text(
        ctx,
        api,
        C,
        s.complete
          ? 'All 16 products have arrived'
          : `Feature ${index + 1} · one product at a time`,
        960,
        355,
        35,
        C.ink,
        'center',
      );
      math(
        ctx,
        api,
        C,
        s.terms
          ? `(${fixed(full.pooled[0][index])})\\cdot(${fixed(trained.weights[index][0])})=${contribution.toFixed(5)}`
          : `b=${fixed(trained.firstClassBias)}`,
        960,
        475,
        65,
        C.cyan,
      );
    });
    const w = 1300 / 16;
    api.line(ctx, 290, 650, 1630, 650, C.muted, 2);
    for (let i = 0; i < 16; i++) {
      const v = trained.firstClassContributions[i],
        height = i < s.terms ? Math.abs(v) * 4500 : 0;
      if (v === 0 && i < s.terms) {
        const x = 310 + i * w;
        api.line(ctx, x, 650, x + w - 12, 650, C.yellow, 6);
        text(ctx, api, C, '0', x + (w - 12) / 2, 710, 27, C.yellow, 'center');
        continue;
      }
      api.rect(
        ctx,
        310 + i * w,
        650 - height * (v >= 0 ? 1 : 0),
        w - 12,
        Math.max(2, height),
        i < s.terms ? (v >= 0 ? C.cyan : C.pink) : C.panel,
        C.muted,
        1,
        3,
      );
    }
    target(ctx, api, 'score-accumulator', () =>
      math(
        ctx,
        api,
        C,
        `b+\\sum_{j=1}^{${s.terms}}\\bar{x}_jw_{j,Billing}=${s.score.toFixed(5)}`,
        960,
        865,
        60,
        s.complete ? C.green : C.yellow,
      ),
    );
    text(ctx, api, C, `${s.terms} / 16 products`, 960, 970, 30, C.muted, 'center');
  }
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  paintScore(ctx, scene, state, api, C, c, t, s);
}
export function drawScoreStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'score',
  draw: drawScoreStage,
  cues: ['feature-weight-pairs', 'sum-products'],
};
