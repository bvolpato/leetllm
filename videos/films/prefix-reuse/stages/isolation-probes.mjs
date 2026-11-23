import { hash } from '../arithmetic.mjs';
import { arrow, drawText, footer, frame, line, mark, pill } from '../defaults.mjs';
export function drawIsolationProbes(ctx, scene, state, api) {
  return api.focus.target('isolation-probes-geometry', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueVisible = (id) => (state.cues ? api.focus.visible(id) : (state.beatP ?? 0) > 0.32);
    {
      const scopes = ['tenant A', 'tenant B'],
        keys = scopes.map((scope) => hash([scope, 'model7', 'guide7']));
      drawText(
        ctx,
        api,
        'Private sharing policy · the gateway chooses the namespace',
        150,
        270,
        32,
      );
      scopes.forEach((scope, i) => {
        const y = 400 + i * 220;
        pill(ctx, api, 'Verified ' + scope, 180, y, 420, i ? themeColors.pink : themeColors.blue);
        arrow(ctx, api, 630, y + 33, 850, y + 33, i ? themeColors.pink : themeColors.blue, 1);
        pill(
          ctx,
          api,
          keys[i].slice(0, 14),
          890,
          y,
          430,
          i ? themeColors.pink : themeColors.blue,
          29,
        );
        drawText(
          ctx,
          api,
          i ? 'separate key' : 'stored A entry',
          1480,
          y + 43,
          28,
          i ? themeColors.pink : themeColors.blue,
          'center',
        );
      });
      if (currentBeat === 1) {
        mark(ctx, api, 'probe-repeat', () => {
          if (cueVisible('probe-repeat')) {
            for (let i = 0; i < 8; i++) {
              const x = 190 + i * 195;
              frame(ctx, api, x, 815, 165, 80, themeColors.yellow);
              drawText(ctx, api, 'trial ' + (i + 1), x + 82, 845, 22, themeColors.yellow, 'center');
              drawText(ctx, api, 'time: pending', x + 82, 876, 20, themeColors.muted, 'center');
            }
            drawText(
              ctx,
              api,
              'Test plan · matched load · preserve every measured time',
              960,
              960,
              30,
              themeColors.yellow,
              'center',
            );
          }
        });
        mark(ctx, api, 'probe-forbidden', () => {
          if (cueVisible('probe-forbidden')) {
            arrow(ctx, api, 1340, 640, 1430, 505, themeColors.pink, 1);
            line(ctx, api, 1390, 480, 1470, 530, themeColors.pink, 5);
            drawText(
              ctx,
              api,
              'B cannot select A’s entry',
              1650,
              565,
              25,
              themeColors.pink,
              'center',
            );
          }
        });
      } else if (currentBeat === 2) {
        mark(ctx, api, 'probe-cold', () =>
          drawText(
            ctx,
            api,
            'B miss → correct cold execution',
            960,
            875,
            32,
            themeColors.cyan,
            'center',
          ),
        );
        mark(ctx, api, 'probe-warm', () => {
          if (cueVisible('probe-warm'))
            drawText(
              ctx,
              api,
              'A warm request → authorized reuse remains available',
              960,
              960,
              30,
              themeColors.green,
              'center',
            );
        });
      } else
        footer(
          ctx,
          api,
          'Structured cryptographic identities compare the scope; authentication grants it.',
        );
    }
  });
}
export default {
  id: 'isolation-probes',
  draw: drawIsolationProbes,
  cues: [
    'probe-policy',
    'probe-trust',
    'probe-repeat',
    'probe-forbidden',
    'probe-cold',
    'probe-warm',
  ],
};
