import { sigmoid, softplus } from '../arithmetic.mjs';
import { cueProgress, motion } from '../construction.mjs';
import { badge, formula, graphAxes, line, panel } from '../defaults.mjs';
function paintRewardStage(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = cueProgress(
      state,
      beat === 1 ? 'loss-wrong' : 'loss-correct',
      beat === 1 ? motion(state, 0.38, 0.58) : motion(state, 0, 0.21),
    );
  const x = 260,
    y = 360,
    w = 870,
    h = 400;
  graphAxes(api, ctx, x, y, w, h, 'chosen minus rejected score', 'negative log-likelihood');
  const mx = (d) => x + ((d + 3) / 6) * w,
    my = (loss) => y + h - (loss / 3.2) * h;
  for (const d of [-2, 0, 2]) {
    line(api, ctx, mx(d), y + h, mx(d), y + h + 12);
    badge(api, ctx, (d > 0 ? '+' : '') + d, mx(d), y + h + 46, api.C.muted, 26);
  }
  api.trace(
    ctx,
    Array.from(
      {
        length: 81,
      },
      (_, i) => {
        const d = -3 + (i / 80) * 6;
        return {
          x: mx(d),
          y: my(softplus(-d)),
        };
      },
    ),
    1,
    api.C.pink,
    5,
  );
  const margin =
      beat === 0 ? 1.1 : beat === 1 ? api.lerp(1.1, -2, progress) : api.lerp(-2, 2, progress),
    loss = softplus(-margin);
  api.circle(ctx, mx(margin), my(loss), 18, api.C.yellow, api.C.ink);
  line(api, ctx, mx(margin), my(loss) + 18, mx(margin), y + h, api.C.yellow, 2);
  badge(api, ctx, loss.toFixed(2), mx(margin) + 55, my(loss) - 22, api.C.yellow, 31);
  api.focus.target('pair-loss', () =>
    formula(
      api,
      ctx,
      '\\mathcal{L}(\\Delta)=-\\log\\sigma(\\Delta)',
      960,
      270,
      48,
      api.C.ink,
      'center',
    ),
  );
  const note = panel(api, ctx, 1250, 390, 510, 280, beat === 1 ? api.C.red : api.C.green);
  api.focus.target('winner-label', () =>
    badge(api, ctx, 'OBSERVED LABEL: A WINS', note.cx, 441, api.C.green, 27),
  );
  api.focus.target('winner-probability', () =>
    badge(
      api,
      ctx,
      `${(sigmoid(margin) * 100).toFixed(0)}% for the winner`,
      note.cx,
      511,
      api.C.ink,
      31,
    ),
  );
  api.rect(ctx, 1320, 549, 370, 24, api.C.bg, api.C.muted, 6);
  api.rect(ctx, 1323, 552, 364 * sigmoid(margin), 18, api.C.green, undefined, 4);
  api.focus.target('loss-result', () =>
    badge(api, ctx, `loss ${loss.toFixed(2)}`, note.cx, 636, api.C.yellow, 43),
  );
  formula(
    api,
    ctx,
    `\\Delta=${margin.toFixed(2)}`,
    1510,
    766,
    40,
    margin < 0 ? api.C.red : api.C.green,
    'center',
  );
  badge(
    api,
    ctx,
    `−ln(${sigmoid(margin).toFixed(4)}) = ${loss.toFixed(4)}`,
    1510,
    880,
    api.C.yellow,
    34,
  );
}

export function drawPairwiseLikelihood(ctx, scene, state, api) {
  ctx.save();
  paintRewardStage(ctx, scene, state, api);
  ctx.restore();
}
export default {
  id: 'pairwise-likelihood',
  draw: drawPairwiseLikelihood,
  cues: ['pairwise-likelihood-b1-1', 'pairwise-likelihood-b1-2', 'loss-wrong', 'loss-correct'],
};
