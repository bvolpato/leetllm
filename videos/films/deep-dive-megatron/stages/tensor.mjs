import { down, up } from '../fixtures.mjs';
import { sampleModel } from '../model.mjs';
import { equation, text } from '../defaults.mjs';
export function drawTensor(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    modelState = sampleModel('tensor', state),
    currentBeat = modelState.b;
  const complete = (id) => !state.cues || api.focus.progress(id, 0) >= 1;
  {
    text(
      ctx,
      api,
      'Input [1, 2] · four intermediate channels · TP = 2',
      960,
      280,
      37,
      themeColors.yellow,
      'center',
    );
    [0, 1].forEach((rank) => {
      const x = 160 + rank * 890,
        color = rank ? themeColors.pink : themeColors.blue;
      api.focus.target('tensor-panel-tensor', () =>
        components.panel({
          x,
          y: 330,
          width: 700,
          height: 550,
          fill: themeColors.panel,
          stroke: color,
        }),
      );
      text(
        ctx,
        api,
        `Rank ${rank} · channels ${rank * 2}, ${rank * 2 + 1}`,
        x + 350,
        380,
        31,
        color,
        'center',
      );
      text(ctx, api, 'Up shard', x + 195, 430, 26, color, 'center');
      text(ctx, api, 'Down shard', x + 505, 430, 26, color, 'center');
      api.focus.target('tensor-up-map-row-row-slice-rank-2-rank-2-2', () =>
        teaching.grid({
          x: x + 65,
          y: 450,
          width: 260,
          height: 160,
          rows: 2,
          columns: 2,
          labels: up.map((row) => row.slice(rank * 2, rank * 2 + 2)),
          fontSize: 32,
          fill: themeColors.panel,
          stroke: color,
          textColor: themeColors.ink,
        }),
      );
      api.focus.target('tensor-down-shards', () =>
        teaching.grid({
          x: x + 375,
          y: 450,
          width: 260,
          height: 160,
          rows: 2,
          columns: 2,
          labels: down.slice(rank * 2, rank * 2 + 2),
          fontSize: 32,
          fill: themeColors.panel,
          stroke: color,
          textColor: themeColors.ink,
        }),
      );
      const projected =
        state.cues && currentBeat === 0
          ? Math.floor(api.focus.progress('tensor-project-coordinates', 0) * 4)
          : 4;
      api.focus.target('tensor-projected-coordinates', () =>
        text(
          ctx,
          api,
          'Projection [' +
            modelState.pre
              .slice(rank * 2, rank * 2 + 2)
              .map((v, j) => (rank * 2 + j < projected ? v : '…'))
              .join(', ') +
            ']',
          x + 350,
          680,
          31,
          themeColors.ink,
          'center',
        ),
      );
      if (currentBeat > 0) {
        const activated =
          currentBeat > 1 || !state.cues
            ? 4
            : Math.floor(api.focus.progress('tensor-local-gelu', 0) * 4);
        api.focus.target('tensor-local-activations', () =>
          text(
            ctx,
            api,
            'GeLU [' +
              modelState.activated
                .slice(rank * 2, rank * 2 + 2)
                .map((v, j) => (rank * 2 + j < activated ? v.toFixed(3) : '…'))
                .join(', ') +
              ']',
            x + 350,
            755,
            31,
            themeColors.cyan,
            'center',
          ),
        );
      }
      const partialVisible =
        currentBeat > 1 ||
        (!state.cues ? modelState.partialReady : api.focus.visible('tensor-build-partials'));
      if (partialVisible) {
        const count =
          currentBeat > 1 || !state.cues
            ? 2
            : Math.floor(api.focus.progress('tensor-build-partials', 0) * 2);
        api.focus.target('tensor-partial-vectors', () =>
          text(
            ctx,
            api,
            'Partial [' +
              modelState.partials[rank].map((v, j) => (j < count ? v.toFixed(3) : '…')).join(', ') +
              ']',
            x + 350,
            835,
            31,
            color,
            'center',
          ),
        );
      }
    });
    if (modelState.sumReady) {
      const progress = api.focus.progress('tensor-sum-output', 1),
        out = modelState.partials[0].map((v, i) => v + modelState.partials[1][i] * progress);
      api.focus.target('tensor-summed-output', () =>
        text(
          ctx,
          api,
          'Sum [' +
            modelState.partials[0].map((v) => v.toFixed(3)).join(', ') +
            '] + ' +
            progress.toFixed(2) +
            ' × [' +
            modelState.partials[1].map((v) => v.toFixed(3)).join(', ') +
            '] ≈ [' +
            out.map((v) => v.toFixed(3)).join(', ') +
            ']',
          960,
          955,
          29,
          themeColors.green,
          'center',
        ),
      );
      if (complete('tensor-serial-match')) {
        const error = Math.max(...out.map((value, i) => Math.abs(value - modelState.serial[i])));
        api.focus.target('tensor-serial-reference', () => {
          const [mantissa, exponent] = error.toExponential(1).split('e');
          text(
            ctx,
            api,
            'Serial [' + modelState.serial.map((v) => v.toFixed(3)).join(', ') + ']',
            650,
            1035,
            28,
            themeColors.green,
            'center',
          );
          equation(
            ctx,
            api,
            String.raw`\max_i |y_i-y_i^{\rm serial}|\approx ` +
              mantissa +
              String.raw`\times10^{` +
              Number(exponent) +
              '}',
            1300,
            1035,
            29,
            error < 1e-12 ? themeColors.green : themeColors.yellow,
          );
        });
      } else
        api.focus.target('tensor-serial-reference', () =>
          text(ctx, api, 'Serial comparison: pending', 960, 1035, 28, themeColors.muted, 'center'),
        );
    } else
      text(
        ctx,
        api,
        'Matching rows of the down projection consume the local channels',
        960,
        960,
        31,
        themeColors.muted,
        'center',
      );
  }
}
export default {
  id: 'tensor',
  draw: drawTensor,
  cues: [
    'tensor-beat-1-focus-1',
    'tensor-project-coordinates',
    'tensor-local-gelu',
    'tensor-matching-down-rows',
    'tensor-build-partials',
    'tensor-sum-output',
    'tensor-serial-match',
  ],
};
