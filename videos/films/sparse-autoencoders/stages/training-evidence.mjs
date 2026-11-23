import { L, box, cue, equation, foot, head, textLabel } from '../defaults.mjs';
export function drawTrainingEvidence(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    { C: themeColors, teaching: teaching } = api;
  const seen = (id) => cue(ctx, api, id) > 0,
    done = (id) => cue(ctx, api, id) === 1;
  api.focus.target('training-evidence-construction', () => {
    if (currentBeat === 0) {
      head(ctx, api, 'Actual CPU lab · synthetic mixtures with known directions');
      [
        ['data', '24 true directions / D=8 / 2–4 active'],
        ['model', '64 ReLU latent slots / decoder bias'],
        ['update', 'full-batch GD / unit decoder columns'],
        ['omitted', 'streaming / AuxK / learned thresholds'],
      ].forEach(([k, v], i) => {
        textLabel(ctx, api, k, 150, 410 + i * 145, 31, themeColors.blue);
        textLabel(ctx, api, v, 720, 410 + i * 145, 30, themeColors.ink);
        L(ctx, api, 130, 460 + i * 145, 1780, 460 + i * 145, themeColors.muted, 1);
      });
      foot(ctx, api, 'L1 subgradients enter before the ReLU backward step');
    } else if (currentBeat === 1) {
      head(ctx, api, 'Completed CPU lab · reconstruction and dictionary alignment');
      const endpoint = done('training-endpoints');
      teaching.bars({
        x: 200,
        y: 420,
        width: 700,
        height: 380,
        values: [1.426, endpoint ? 0.128 : 0],
        labels: ['initial MSE', endpoint ? 'final MSE' : 'final MSE pending'],
        max: 1.5,
        colors: [themeColors.blue, themeColors.green],
        showValues: endpoint,
        format: (v) => v.toFixed(3),
        fontSize: 29,
      });
      if (done('training-active-support'))
        textLabel(
          ctx,
          api,
          'active train 18.9 / held out 19.5 of64',
          1370,
          450,
          30,
          themeColors.yellow,
          'center',
        );
      if (done('training-fvu-result'))
        textLabel(ctx, api, 'held-out FVU = 0.169', 1370, 625, 34, themeColors.cyan, 'center');
      if (done('training-alignment'))
        textLabel(
          ctx,
          api,
          'median best |cos|: 0.798 → 0.799',
          1370,
          805,
          30,
          themeColors.pink,
          'center',
        );
      foot(
        ctx,
        api,
        endpoint && done('training-alignment')
          ? 'MSE improved substantially while dictionary recovery barely moved'
          : endpoint
            ? 'MSE reported · dictionary recovery result pending'
            : 'Completed run · final MSE pending its spoken result',
      );
    } else if (currentBeat === 2) {
      head(ctx, api, 'A maximum absolute alignment can hide sign and duplicated matches');
      box(ctx, api, 'true direction +d', 180, 420, 650, themeColors.blue);
      box(ctx, api, 'learned direction −d', 1090, 420, 650, themeColors.pink);
      textLabel(
        ctx,
        api,
        '|cos|=1 does not give a writable positive-code direction',
        960,
        670,
        34,
        themeColors.yellow,
        'center',
      );
      textLabel(
        ctx,
        api,
        'One learned column may maximize several true-direction matches',
        960,
        830,
        31,
        themeColors.pink,
        'center',
      );
      foot(
        ctx,
        api,
        'Keep signed alignment, random controls, multiple seeds and held-out rare contexts',
      );
    } else {
      const second = seen('loss-recovery-second'),
        show = seen('loss-recovery-first'),
        base = second ? 10 : 6;
      head(ctx, api, 'Clean2 · substitution2.4 · same absolute damage0.4');
      teaching.bars({
        x: 180,
        y: 440,
        width: 820,
        height: 360,
        values: [2, 2.4, base],
        labels: ['clean', 'substitution', 'ablation'],
        max: 10,
        colors: [themeColors.blue, themeColors.cyan, themeColors.pink],
        showValues: true,
        fontSize: 29,
      });
      equation(ctx, api, String.raw`1-\frac{2.4-2}{${base}-2}`, 1430, 490, 48);
      if (show)
        textLabel(
          ctx,
          api,
          'Loss Recovered = ' + (100 * (1 - 0.4 / (base - 2))).toFixed(0) + '%',
          1430,
          700,
          35,
          themeColors.yellow,
          'center',
        );
      if (seen('activation-storage'))
        textLabel(
          ctx,
          api,
          '200,000 ×4,096 ×4 B ≈3.05 GiB',
          960,
          940,
          32,
          themeColors.cyan,
          'center',
        );
      foot(
        ctx,
        api,
        'Zero denominator is undefined; raw losses and other evidence remain necessary',
      );
    }
  });
}
export default {
  id: 'training-evidence',
  draw: drawTrainingEvidence,
  cues: [
    'training-evidence-b0',
    'training-evidence-b1',
    'training-endpoints',
    'training-alignment',
    'training-active-support',
    'training-fvu-result',
    'training-evidence-b2',
    'training-evidence-b3',
    'loss-recovery-first',
    'loss-recovery-second',
    'activation-storage',
  ],
};
