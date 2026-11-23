import { ttClamp, ttMix } from '../arithmetic.mjs';
import { testTimeCoreFrame, ttCue } from '../construction.mjs';
import { arrow, card, fillStrip, focusTarget, text } from '../defaults.mjs';
export function drawTrainTimeAxis(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = testTimeCoreFrame('train-time-axis', state);
  const prog = (name, beat = 0) => ttCue(state, name, beat);
  const result = (name, label, x = 960, y = 900, k = themeColors.green, z = 38, beat = 0) =>
    focusTarget(ctx, api, name, () =>
      text(
        ctx,
        api,
        prog(name, beat).done ? label : 'Calculation pending',
        x,
        y,
        z,
        prog(name, beat).done ? k : themeColors.muted,
        'center',
      ),
    );
  function content() {
    if (currentBeat === 0) {
      card(ctx, api, '3 billion parameters', 160, 310, 440, 110, themeColors.blue);
      card(ctx, api, '20 billion tokens / epoch', 730, 310, 480, 110, themeColors.cyan);
      card(ctx, api, '2 epochs', 1380, 310, 330, 110, themeColors.yellow);
      focusTarget(ctx, api, 'tt-training-epochs', () => {
        for (let e = 0; e < 2; e++) {
          const q = ttClamp(prog('tt-training-epochs').p * 2 - e);
          fillStrip(
            ctx,
            api,
            q,
            310,
            540 + e * 125,
            1280,
            e ? themeColors.yellow : themeColors.cyan,
            `epoch ${e + 1} · processed tokens`,
          );
        }
      });
      result(
        'tt-training-product',
        'D = 40 billion · 6ND ≈ 7.2 × 10²⁰ FLOPs',
        960,
        950,
        themeColors.green,
        37,
      );
    } else if (currentBeat === 1) {
      text(ctx, api, 'Stored parameters', 490, 290, 34, themeColors.blue, 'center');
      text(ctx, api, 'Active forward work', 1420, 290, 34, themeColors.cyan, 'center');
      for (let i = 0; i < 8; i++) {
        const x = 210 + (i % 4) * 150,
          y = 380 + Math.floor(i / 4) * 155;
        card(
          ctx,
          api,
          'E' + (i + 1),
          x,
          y,
          120,
          100,
          [1, 5].includes(i) ? themeColors.cyan : themeColors.blue,
        );
      }
      focusTarget(ctx, api, 'tt-active-experts', () => {
        const q = prog('tt-active-experts', 1).p;
        [
          [495, 505, 390, 'E2'],
          [650, 690, 620, 'E6'],
        ].forEach(([sy, channel, ty, label]) => {
          card(
            ctx,
            api,
            q === 1 ? label + ' active' : 'read pending',
            1200,
            ty,
            470,
            100,
            q === 1 ? themeColors.cyan : themeColors.muted,
            30,
          );
          const points = [
            {
              x: 420,
              y: sy,
            },
            {
              x: 850,
              y: channel,
            },
            {
              x: 1100,
              y: channel,
            },
            {
              x: 1180,
              y: ty + 50,
            },
          ];
          for (let i = 0; i < 3; i++)
            api.line(
              ctx,
              points[i].x,
              points[i].y,
              points[i + 1].x,
              points[i + 1].y,
              themeColors.cyan,
              3,
            );
          if (q > 0 && q < 1) {
            const leg = Math.min(2, Math.floor(q * 3)),
              f = q * 3 - leg;
            api.circle(
              ctx,
              ttMix(points[leg].x, points[leg + 1].x, f),
              ttMix(points[leg].y, points[leg + 1].y, f),
              10,
              themeColors.cyan,
            );
          }
        });
      });
      text(
        ctx,
        api,
        'Illustrative routing · same stored expert bank',
        960,
        835,
        32,
        themeColors.muted,
        'center',
      );
      text(
        ctx,
        api,
        'Count executed parameters under the architecture',
        960,
        945,
        37,
        themeColors.yellow,
        'center',
      );
    } else {
      card(ctx, api, 'One frozen weight artifact', 165, 330, 520, 150, themeColors.blue, 35);
      focusTarget(ctx, api, 'tt-frozen-weights', () =>
        m.weights.forEach((w, i) =>
          card(ctx, api, w.toFixed(2), 200 + i * 150, 550, 120, 80, themeColors.blue),
        ),
      );
      ['longer attempt', 'parallel attempts', 'critique / check'].forEach((s, i) => {
        card(ctx, api, s, 1080, 320 + i * 170, 610, 100, themeColors.cyan);
        arrow(ctx, api, 720, 400 + i * 50, 1030, 370 + i * 170);
      });
      text(
        ctx,
        api,
        'Inference work changes · weight values stay fixed',
        960,
        940,
        38,
        themeColors.green,
        'center',
      );
    }
  }
  // Existing manuscript operation targets remain attached to the actual construction.
  const bases = scene.beats.flatMap((beat) =>
    (beat.visual_cues ?? [])
      .filter((cue) => /^tt-[a-z].*-\d+$/.test(cue.id))
      .flatMap((cue) => cue.targets ?? []),
  );
  const wrap = (i) =>
    i < bases.length ? focusTarget(ctx, api, bases[i], () => wrap(i + 1)) : content();
  wrap(0);
}
export default {
  id: 'train-time-axis',
  draw: drawTrainTimeAxis,
  cues: [
    'tt-train-time-axis-0',
    'tt-training-epochs',
    'tt-training-product',
    'tt-train-time-axis-1',
    'tt-active-experts',
    'tt-train-time-axis-2',
  ],
};
