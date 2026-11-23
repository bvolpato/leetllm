import { capacityEvent } from '../construction.mjs';
import { drawCapacityCard, drawCenteredText, drawFooter, drawLine } from '../defaults.mjs';
export function drawRequestShards(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => capacityEvent(scene, state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('request-shards-mechanism', () => {
    if (currentBeat === 0) {
      const p = ev('shards', 0);
      drawCenteredText(
        ctx,
        api,
        'Hypothetical 70B geometry · 1,000,000 retained positions',
        960,
        305,
        33,
        themeColors.yellow,
      );
      if (p === 0) {
        drawCapacityCard(
          ctx,
          api,
          'one request KV\n305.18 GiB',
          570,
          480,
          780,
          200,
          themeColors.pink,
          46,
        );
      } else {
        for (let i = 0; i < 4; i++)
          drawCapacityCard(
            ctx,
            api,
            'sequence shard ' + i + '\n' + (305.17578125 / 4).toFixed(2) + ' GiB',
            140 + i * 440,
            475,
            390,
            230,
            themeColors.cyan,
            33,
          );
      }
      if (done('size', 0))
        drawCenteredText(
          ctx,
          api,
          'Beyond cited checkpoint context; storage sharding does not extend its limit',
          960,
          925,
          29,
          themeColors.pink,
        );
    } else if (currentBeat === 1) {
      drawCenteredText(
        ctx,
        api,
        'Partition different axes of the same model/request',
        960,
        300,
        34,
        themeColors.yellow,
      );
      [
        ['Tensor', 'within each layer', themeColors.blue],
        ['Pipeline', 'different layers', themeColors.green],
        ['Context', 'different positions', themeColors.pink],
      ].forEach(([a, z, color], i) => {
        const x = 150 + i * 570;
        drawCenteredText(ctx, api, a, x + 240, 400, 35, color);
        teaching.grid({
          x,
          y: 470,
          width: 480,
          height: 280,
          rows: 4,
          columns: 4,
          labels: Array.from(
            {
              length: 4,
            },
            (_, r) =>
              Array.from(
                {
                  length: 4,
                },
                (_, col) => (i === 0 ? 'W' + r + col : i === 1 ? 'L' + r : 'p' + (r * 4 + col)),
              ),
          ),
          fontSize: 26,
          fill: themeColors.panel,
          stroke: color,
          highlights: Array.from(
            {
              length: 4,
            },
            (_, j) => ({
              row: i === 0 ? j : 0,
              column: i === 0 ? 0 : j,
              fill: color + '44',
            }),
          ),
        });
        drawCenteredText(ctx, api, z, x + 240, 830, 29, color);
        drawCenteredText(
          ctx,
          api,
          i === 0
            ? 'one layer: distinct weights'
            : i === 1
              ? 'layer identities L0…L3'
              : 'sequence identities p0…p15',
          x + 240,
          895,
          25,
          themeColors.muted,
        );
      });
      if (done('weights', 1))
        drawCenteredText(
          ctx,
          api,
          '70B × 2 B = 140 GB weights: cannot reside on one 80 GB device',
          960,
          950,
          32,
          themeColors.pink,
        );
    } else {
      const p = ev('merge', 2),
        massA = 1,
        massB = 3 * p,
        sumA = 2,
        sumB = 30 * p;
      drawCenteredText(
        ctx,
        api,
        'Authored common-score-scale attention merge',
        960,
        290,
        34,
        themeColors.yellow,
      );
      drawCapacityCard(
        ctx,
        api,
        'A: mass1\nweighted sum2',
        170,
        400,
        600,
        165,
        themeColors.blue,
        34,
      );
      drawCapacityCard(
        ctx,
        api,
        'B: mass3\nweighted sum30',
        1150,
        400,
        600,
        165,
        themeColors.green,
        34,
      );
      drawLine(ctx, api, 815, 495, 1105, 495, themeColors.muted, 4);
      drawCenteredText(
        ctx,
        api,
        'retained mass = ' + (massA + massB).toFixed(2),
        960,
        710,
        36,
        themeColors.cyan,
      );
      drawCenteredText(
        ctx,
        api,
        'weighted sum = ' + (sumA + sumB).toFixed(2),
        960,
        785,
        36,
        themeColors.green,
      );
      if (done('merge', 2) && p === 1)
        drawCenteredText(ctx, api, '32 / 4 = 8', 960, 890, 50, themeColors.yellow);
      else
        drawCenteredText(
          ctx,
          api,
          'Combine both sufficient statistics before normalizing',
          960,
          890,
          30,
          themeColors.muted,
        );
      if (done('wrong', 2))
        drawCenteredText(
          ctx,
          api,
          'Mean of local outputs 2 and 10 is 6: ignores unequal masses',
          960,
          975,
          29,
          themeColors.pink,
        );
    }
    drawFooter(
      ctx,
      api,
      'Real partial states reconcile score maxima; collective traffic depends on phase and implementation',
    );
  });
}
export default {
  id: 'request-shards',
  draw: drawRequestShards,
  cues: [
    'ic-request-shards-size',
    'ic-request-shards-shards',
    'ic-request-shards-weights',
    'ic-request-shards-parts',
    'ic-request-shards-merge',
    'ic-request-shards-wrong',
  ],
};
