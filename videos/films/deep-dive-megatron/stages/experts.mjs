import { expertSkewTrace } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import { card, equation, spokenProgress, text } from '../defaults.mjs';
export function drawExperts(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('experts', state),
    currentBeat = modelState.b;
  const cue = (id, beat, start, end) => spokenProgress(state, api, id, beat, start, end);
  const route = (a, z, color, progress) =>
    teaching.transfer({
      source: {
        shape: a,
        opacity: 1,
      },
      target: {
        shape: z,
        opacity: 1,
      },
      progress,
      color,
      particle: {
        radius: 7,
        fill: color,
      },
      margin: 3,
    });
  {
    const skew = cue('experts-skew-assignments', 1, 0.66, 0.94);
    const skewVisible = currentBeat === 1 && cue('experts-batch', 1, 0.52, 0.64) > 0;
    if (skewVisible) {
      const trace = expertSkewTrace(skew);
      text(
        ctx,
        api,
        'Same eight token IDs · two distinct assignments each',
        960,
        275,
        36,
        themeColors.yellow,
        'center',
      );
      api.focus.target('experts-skew-population', () =>
        teaching.grid({
          x: 180,
          y: 375,
          width: 1560,
          height: 180,
          rows: 2,
          columns: 8,
          labels: [
            Array.from(
              {
                length: 8,
              },
              (_, i) => 'T' + i,
            ),
            trace.assignments.map((pair) => pair.map((e) => 'E' + e).join(' / ')),
          ],
          fontSize: 26,
          fill: themeColors.panel,
          stroke: themeColors.blue,
          textColor: themeColors.ink,
          highlights: [
            {
              row: 0,
              column: 3,
              fill: themeColors.panel,
              stroke: themeColors.yellow,
            },
            {
              row: 1,
              column: 3,
              fill: themeColors.panel,
              stroke: themeColors.yellow,
            },
          ],
        }),
      );
      api.focus.target('experts-derived-load', () =>
        trace.experts.forEach((expert, i) => {
          const x = 230 + i * 420,
            count = trace.counts[i],
            height = count * 28;
          api.rect(
            ctx,
            x,
            850 - height,
            260,
            height,
            i ? themeColors.cyan : themeColors.pink,
            undefined,
            0,
          );
          text(
            ctx,
            api,
            'E' + expert + ' · ' + count + ' assignments',
            x + 130,
            920,
            27,
            i ? themeColors.cyan : themeColors.pink,
            'center',
          );
        }),
      );
      text(
        ctx,
        api,
        '8 tokens → ' +
          trace.totalAssignments +
          ' assignments · T3 keeps E2 / E7 and result [1.5, 1]',
        960,
        1020,
        28,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 2) {
      text(
        ctx,
        api,
        'Two ownership factorizations · one 256-rank world',
        960,
        275,
        36,
        themeColors.yellow,
        'center',
      );
      api.focus.target('experts-attention-world', () => {
        teaching.grid({
          x: 250,
          y: 390,
          width: 1420,
          height: 115,
          rows: 1,
          columns: 4,
          labels: [['TP 4', 'CP 2', 'DP 8', 'PP 4']],
          fontSize: 34,
          fill: themeColors.panel,
          stroke: themeColors.blue,
          textColor: themeColors.blue,
        });
        equation(ctx, api, '4\\times2\\times8\\times4=256', 960, 610, 42, themeColors.blue);
      });
      api.focus.target('experts-folded-world', () => {
        teaching.grid({
          x: 250,
          y: 735,
          width: 1420,
          height: 115,
          rows: 1,
          columns: 4,
          labels: [['Expert TP 1', 'EP 64', 'Expert DP 1', 'PP 4']],
          fontSize: 32,
          fill: themeColors.panel,
          stroke: themeColors.pink,
          textColor: themeColors.pink,
        });
        equation(ctx, api, '1\\times64\\times1\\times4=256', 960, 955, 42, themeColors.pink);
      });
    } else {
      const dispatch = cue('experts-beat-1-focus-2', 0, 0.12, 0.42);
      const blueReturn = cue('experts-weighted-combination', 1, 0, 0.25);
      const pinkReturn = cue('experts-second-contribution', 1, 0.26, 0.53);
      const [blue, pink] = modelState.outputs;
      const [blueWeight, pinkWeight] = modelState.weights;
      const pair = (vector) => '[' + vector.join(', ') + ']';
      const source = api.focus.target('experts-source-token-t3', () =>
          card(ctx, api, 'Source token T3', 150, 420, 410, themeColors.yellow, 115),
        ),
        a = api.focus.target('experts-expert-2-2-0', () =>
          card(ctx, api, 'Expert 2    ' + pair(blue), 810, 350, 470, themeColors.blue),
        ),
        z = api.focus.target('experts-expert-7', () =>
          card(ctx, api, 'Expert 7    ' + pair(pink), 810, 680, 470, themeColors.pink),
        );
      const first = blueReturn >= 1,
        second = pinkReturn >= 1,
        partial = blue.map((value) => value * blueWeight),
        out = api.focus.target('experts-weighted-result', () =>
          card(
            ctx,
            api,
            second
              ? 'T3 result ' + pair(modelState.combined)
              : first
                ? 'T3 partial ' + pair(partial)
                : 'T3   [ ?, ? ]',
            1490,
            510,
            350,
            themeColors.green,
            125,
          ),
        );
      route(source, a, themeColors.blue, dispatch);
      route(source, z, themeColors.pink, dispatch);
      if (blueReturn > 0) route(a, out, themeColors.blue, blueReturn);
      if (pinkReturn > 0) route(z, out, themeColors.pink, pinkReturn);
      api.focus.target('experts-blue-weight', () =>
        text(ctx, api, 'Router weight  ' + blueWeight, 1045, 320, 36, themeColors.blue, 'center'),
      );
      api.focus.target('experts-pink-weight', () =>
        text(ctx, api, 'Router weight  ' + pinkWeight, 1045, 650, 36, themeColors.pink, 'center'),
      );
      if (currentBeat > 0)
        api.focus.target('experts-weighted-result', () =>
          equation(
            ctx,
            api,
            first && second
              ? blueWeight +
                  pair(blue) +
                  '+' +
                  pinkWeight +
                  pair(pink) +
                  '=' +
                  pair(modelState.combined)
              : first
                ? blueWeight + pair(blue) + '=' + pair(partial)
                : blueWeight + pair(blue) + '=?',
            960,
            960,
            37,
            themeColors.green,
          ),
        );
    }
  }
}
export default {
  id: 'experts',
  draw: drawExperts,
  cues: [
    'experts-beat-1-focus-1',
    'experts-beat-1-focus-2',
    'experts-weighted-combination',
    'experts-second-contribution',
    'experts-batch',
    'experts-skew-assignments',
    'experts-same-rank-world',
    'experts-folded-ownership',
  ],
};
