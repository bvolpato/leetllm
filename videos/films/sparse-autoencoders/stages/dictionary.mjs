import { code, dictionary } from '../fixtures.mjs';
import { cueBegun } from '../construction.mjs';
import { encoderFixture } from '../model.mjs';
import {
  cue,
  equation,
  foot,
  head,
  retainedDrawArrow,
  retainedDrawEquation,
  retainedDrawPlot,
  retainedDrawText,
  textLabel,
} from '../defaults.mjs';
function retainedDraw(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.1, 0.9),
    F = components.fade;
  if (currentBeat === 2) {
    const e = encoderFixture();
    retainedDrawText(
      ctx,
      api,
      'Constructed encoder / decoder pair',
      960,
      265,
      30,
      themeColors.muted,
      'center',
    );
    const input = api.focus.target('dictionary-observed-input', () =>
      components.card({
        label: 'Observed [2.3, 0.6]',
        x: 120,
        y: 400,
        width: 360,
        height: 100,
        fontSize: 30,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        textColor: themeColors.blue,
      }),
    );
    const encoder = api.focus.target('dictionary-encoder', () => {
      const box = components.panel({
        x: 650,
        y: 315,
        width: 600,
        height: 300,
        fill: themeColors.panel,
        stroke: themeColors.cyan,
        padding: 20,
      });
      retainedDrawText(
        ctx,
        api,
        'Encoder → nonnegative estimates',
        950,
        365,
        29,
        themeColors.cyan,
        'center',
      );
      retainedDrawEquation(
        ctx,
        api,
        String.raw`2.3-\tfrac43(0.6)=1.5`,
        950,
        445,
        36,
        themeColors.cyan,
        'center',
      );
      retainedDrawEquation(
        ctx,
        api,
        String.raw`\tfrac53(0.6)=1`,
        950,
        515,
        36,
        themeColors.cyan,
        'center',
      );
      retainedDrawText(
        ctx,
        api,
        'Other pre-activations: −2.3, −0.6, −2.9',
        950,
        575,
        25,
        themeColors.muted,
        'center',
      );
      return box;
    });
    const estimated = api.focus.target('dictionary-estimated-code', () => {
      const box = components.panel({
        x: 1400,
        y: 315,
        width: 400,
        height: 300,
        fill: themeColors.panel,
        stroke: themeColors.green,
        padding: 15,
      });
      retainedDrawText(
        ctx,
        api,
        'Estimated sparse code',
        1600,
        365,
        28,
        themeColors.green,
        'center',
      );
      teaching.bars({
        x: 1430,
        y: 425,
        width: 340,
        height: 130,
        values: e.estimated,
        labels: ['1', '2', '3', '4', '5'],
        max: 1.5,
        showValues: true,
        format: (value) => value.toFixed(1),
        colors: [
          themeColors.blue,
          themeColors.pink,
          themeColors.muted,
          themeColors.muted,
          themeColors.muted,
        ],
        fontSize: 22,
        gap: 20,
      });
      return box;
    });
    api.connect(ctx, input, encoder, {
      color: themeColors.cyan,
      gap: 15,
      width: 3,
    });
    api.connect(ctx, encoder, estimated, {
      color: themeColors.green,
      gap: 15,
      width: 3,
    });
    if (cueBegun(state.cues, 'dictionary-b3-1', true)) {
      const decoder = api.focus.target('dictionary-decoder-columns', () => {
        const box = components.panel({
          x: 650,
          y: 700,
          width: 600,
          height: 150,
          fill: themeColors.panel,
          stroke: themeColors.pink,
          padding: 20,
        });
        retainedDrawEquation(
          ctx,
          api,
          String.raw`d_1=[1,0],\quad d_2=[0.8,0.6]`,
          950,
          750,
          31,
          themeColors.pink,
          'center',
        );
        retainedDrawEquation(
          ctx,
          api,
          String.raw`\hat x=1.5d_1+1d_2`,
          950,
          820,
          37,
          themeColors.green,
          'center',
        );
        return box;
      });
      const reconstruction = api.focus.target('dictionary-reconstruction', () =>
        components.card({
          label: 'Reconstruct [2.3, 0.6]',
          x: 120,
          y: 720,
          width: 360,
          height: 100,
          fontSize: 28,
          fill: themeColors.panel,
          stroke: themeColors.green,
          textColor: themeColors.green,
        }),
      );
      api.connect(ctx, estimated, decoder, {
        color: themeColors.pink,
        gap: 15,
        width: 3,
      });
      api.connect(ctx, decoder, reconstruction, {
        color: themeColors.green,
        gap: 15,
        width: 3,
      });
    }
    if (cueBegun(state.cues, 'dictionary-hook-context', true))
      api.focus.target('dictionary-hook-context', () =>
        ['Checkpoint R1', 'Layer 4', 'Token position 12', 'Post-LN convention'].forEach(
          (label, i) =>
            components.card({
              label,
              x: 130 + i * 440,
              y: 935,
              width: 380,
              height: 85,
              fontSize: 27,
              fill: themeColors.panel,
              stroke: themeColors.yellow,
              textColor: themeColors.yellow,
            }),
        ),
      );
    return;
  } else {
    const q = retainedDrawPlot(ctx, api),
      a = phaseForBeat(1),
      x = [1.5 + 0.8 * a, 0.6 * a];
    api.focus.target('first-direction', () =>
      retainedDrawArrow(ctx, api, q, [0, 0], [1.5, 0], themeColors.blue),
    );
    if (a > 0)
      api.focus.target('added-direction', () =>
        retainedDrawArrow(ctx, api, q, [1.5, 0], x, themeColors.pink),
      );
    const end = q.point(...x);
    api.focus.target('activation-point', () =>
      api.circle(ctx, end.x, end.y, 12, themeColors.yellow),
    );
    retainedDrawText(
      ctx,
      api,
      'first feature contribution: 1.5',
      1450,
      390,
      36,
      themeColors.blue,
      'center',
    );
    retainedDrawText(
      ctx,
      api,
      'second direction overlaps the first axis',
      1450,
      535,
      34,
      themeColors.pink,
      'center',
    );
    api.focus.target('raw-coordinate', () =>
      retainedDrawText(
        ctx,
        api,
        `raw coordinate 1 = ${x[0].toFixed(2)}`,
        1450,
        700,
        38,
        themeColors.yellow,
        'center',
      ),
    );
    {
      F(phaseForBeat(1), () =>
        api.focus.target('sparse-code', () =>
          teaching.bars({
            x: 1240,
            y: 795,
            width: 440,
            height: 70,
            values: code,
            labels: ['1', '2', '3', '4', '5'],
            max: 1.5,
            color: themeColors.green,
            fontSize: 34,
          }),
        ),
      );
    }
  }
}
export function drawDictionary(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    { C: themeColors, teaching: teaching } = api;
  const custom = currentBeat === 2;
  if (!custom) {
    retainedDraw(ctx, scene, state, api);
    return;
  }
  const seen = (id) => cue(ctx, api, id) > 0;
  api.focus.target('dictionary-construction', () => {
    if (!seen('dictionary-dimensions')) {
      retainedDraw(ctx, scene, state, api);
      return;
    }
    head(ctx, api, 'Activation width D=2 · latent slots M=5');
    teaching.grid({
      x: 160,
      y: 400,
      width: 400,
      height: 400,
      rows: 5,
      columns: 2,
      labels: encoderFixture().weights.map((r) => r.map((v) => v.toFixed(2))),
      fontSize: 25,
      fill: themeColors.panel,
      stroke: themeColors.cyan,
      textColor: themeColors.cyan,
    });
    textLabel(ctx, api, 'Encoder: M × D', 360, 350, 31, themeColors.cyan, 'center');
    teaching.grid({
      x: 1100,
      y: 400,
      width: 650,
      height: 240,
      rows: 2,
      columns: 5,
      labels: [0, 1].map((j) => dictionary.map((d) => d[j].toFixed(1))),
      fontSize: 27,
      fill: themeColors.panel,
      stroke: themeColors.pink,
      textColor: themeColors.pink,
    });
    textLabel(ctx, api, 'Decoder: D × M', 1425, 350, 31, themeColors.pink, 'center');
    equation(ctx, api, String.raw`z=\operatorname{ReLU}(W_e(x-b_d)+b_e)`, 1100, 760, 39);
    equation(ctx, api, String.raw`\hat x=W_dz+b_d`, 1100, 860, 42, themeColors.green);
    if (seen('dictionary-tying'))
      textLabel(
        ctx,
        api,
        'Tied throughout training ≠ aligned only at initialization',
        960,
        960,
        31,
        themeColors.yellow,
        'center',
      );
    foot(
      ctx,
      api,
      'The learned decoder bias is a reference; it need not equal the exact data mean',
    );
  });
}
export default {
  id: 'dictionary',
  draw: drawDictionary,
  cues: [
    'dictionary-b1-1',
    'dictionary-b1-2',
    'dictionary-b2-1',
    'dictionary-b2-2',
    'dictionary-b3-1',
    'dictionary-encode',
    'dictionary-hook-context',
    'dictionary-dimensions',
    'dictionary-tying',
  ],
};
