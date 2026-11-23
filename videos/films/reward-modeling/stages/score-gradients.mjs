import { sigmoid } from '../arithmetic.mjs';
import { cueProgress, motion } from '../construction.mjs';
import { arrow, badge, connect, formula, label, line, panel } from '../defaults.mjs';
function paintRewardStage(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  if (beat === 2) {
    const update = cueProgress(state, 'shared-update', motion(state, 0.29, 0.58));
    const chosen = -1 - 0.0269 * update,
      rejected = -2 - 0.0538 * update;
    formula(api, ctx, 'r=w^\\top h', 960, 285, 52, api.C.ink, 'center');
    api.focus.target('shared-weight', () =>
      formula(api, ctx, `w\\approx${chosen.toFixed(3)}`, 960, 356, 34, api.C.yellow, 'center'),
    );
    const before = panel(api, ctx, 200, 390, 620, 285, api.C.blue);
    const after = panel(api, ctx, 1100, 390, 620, 285, api.C.green);
    connect(api, ctx, before, after, api.C.yellow);
    badge(api, ctx, 'BEFORE SHARED-WEIGHT UPDATE', before.cx, 438, api.C.blue, 26);
    badge(
      api,
      ctx,
      update === 1 ? 'AFTER UPDATE' : 'CURRENT SHARED-WEIGHT STATE',
      after.cx,
      438,
      api.C.green,
      27,
    );
    label(api, ctx, 'chosen     −1.000', before.cx, 524, 32, api.C.green, 'center', 'mono');
    label(api, ctx, 'rejected   −2.000', before.cx, 601, 32, api.C.red, 'center', 'mono');
    api.teaching.changeCue(
      {
        x: 1175,
        y: 480,
        width: 470,
        height: 65,
        from: -1,
        to: -1.0269,
        progress: update,
        color: api.C.green,
        restColor: api.C.green,
      },
      (cue) =>
        label(
          api,
          ctx,
          `chosen     ${cue.value.toFixed(3).replace('-', '−')}`,
          after.cx,
          524,
          32,
          cue.color,
          'center',
          'mono',
        ),
    );
    api.teaching.changeCue(
      {
        x: 1175,
        y: 557,
        width: 470,
        height: 65,
        from: -2,
        to: -2.0538,
        progress: update,
        color: api.C.red,
        restColor: api.C.red,
      },
      (cue) =>
        label(
          api,
          ctx,
          `rejected   ${cue.value.toFixed(3).replace('-', '−')}`,
          after.cx,
          601,
          32,
          cue.color,
          'center',
          'mono',
        ),
    );
    api.focus.target('updated-margin', () =>
      badge(
        api,
        ctx,
        `MARGIN: +1.000 → +${(chosen - rejected).toFixed(3)}`,
        960,
        795,
        api.C.yellow,
        38,
      ),
    );
    formula(api, ctx, 'h_w=1,\\quad h_l=2', 960, 905, 35, api.C.muted, 'center');
    formula(api, ctx, 'g_w=(\\sigma(1)-1)(1-2)=0.269', 960, 970, 35, api.C.ink, 'center');
    if (update > 0)
      badge(
        api,
        ctx,
        update === 1
          ? 'w = −1 − 0.1 × 0.269 ≈ ' + chosen.toFixed(3)
          : 'Applying the shared-weight update…',
        960,
        1030,
        api.C.yellow,
        30,
      );
    return;
  }
  const baseline = 710,
    scale = 108,
    push =
      beat === 1
        ? (1 - sigmoid(-2)) * cueProgress(state, 'output-descent', motion(state, 0.28, 0.57))
        : 0;
  const chosen = 0.7 + push,
    rejected = 2.7 - push;
  line(api, ctx, 380, baseline, 1540, baseline);
  line(api, ctx, 420, 345, 420, baseline);
  label(api, ctx, 'reward', 420, 305, 28, api.C.muted);
  [
    {
      x: 680,
      score: chosen,
      color: api.C.green,
      name: 'CHOSEN',
    },
    {
      x: 1080,
      score: rejected,
      color: api.C.red,
      name: 'REJECTED',
    },
  ].forEach(({ x, score, color, name }) => {
    const top = baseline - score * scale;
    api.rect(ctx, x, top, 200, score * scale, color, undefined, 12);
    badge(api, ctx, name, x + 100, top - 30, color, 27);
    api.focus.target('score-update', () =>
      badge(api, ctx, score.toFixed(2), x + 100, baseline - 23, api.C.bg, 31),
    );
  });
  const chosenTop = baseline - chosen * scale,
    rejectedTop = baseline - rejected * scale;
  const chosenDirection = beat === 0 ? motion(state, 0.4, 0.57) : 1;
  const rejectedDirection = beat === 0 ? motion(state, 0.67, 0.84) : 1;
  arrow(api, ctx, 920, chosenTop, 920, chosenTop - 76 * chosenDirection, api.C.green, 5);
  arrow(api, ctx, 1040, rejectedTop, 1040, rejectedTop + 76 * rejectedDirection, api.C.red, 5);
  badge(api, ctx, 'Directions for gradient descent', 1090, 312, api.C.yellow, 27);
  if (beat === 0) {
    api.focus.target('chosen-derivative', () =>
      formula(
        api,
        ctx,
        '\\frac{\\partial\\mathcal{L}}{\\partial r_w}=\\sigma(\\Delta)-1',
        560,
        865,
        42,
        api.C.green,
        'center',
      ),
    );
    api.focus.target('rejected-derivative', () =>
      formula(
        api,
        ctx,
        '\\frac{\\partial\\mathcal{L}}{\\partial r_l}=1-\\sigma(\\Delta)',
        1370,
        865,
        42,
        api.C.red,
        'center',
      ),
    );
  } else {
    badge(api, ctx, 'OUTPUT-SPACE GRADIENT DESCENT', 960, 826, api.C.yellow, 29);
    formula(
      api,
      ctx,
      `\\Delta=-2.00\\;\\longrightarrow\\;${(chosen - rejected).toFixed(2)}`,
      960,
      916,
      46,
      api.C.ink,
      'center',
    );
  }
}

export function drawScoreGradients(ctx, scene, state, api) {
  ctx.save();
  paintRewardStage(ctx, scene, state, api);
  ctx.restore();
}
export default {
  id: 'score-gradients',
  draw: drawScoreGradients,
  cues: [
    'score-gradients-b1-1',
    'score-gradients-b1-2',
    'output-descent',
    'shared-gradient',
    'shared-update',
    'shared-result',
  ],
};
