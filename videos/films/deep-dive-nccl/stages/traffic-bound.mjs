import { done, sentence } from '../construction.mjs';
import { ringTraffic } from '../arithmetic.mjs';
import { inputs } from '../fixtures.mjs';

const ranks = inputs.length;
const bytesPerRank = inputs[2].length * Float32Array.BYTES_PER_ELEMENT;
const traffic = ringTraffic(ranks, bytesPerRank);
const steps = ranks - 1;

export function drawTrafficBound(ctx, scene, state, api) {
  const { C } = api;
  const complete = (beat, index) => done(state, scene.id, beat, index);
  api.focus.target('nc-traffic-bound-mechanism', () => {
    api.text(
      ctx,
      'Rank 2 input   ·   ' + inputs[2].length + ' float32 values   ·   ' + bytesPerRank + ' B',
      960,
      282,
      43,
      C.ink,
      'center',
    );
    ['Reduce-scatter', 'All-gather'].forEach((phase, row) => {
      const y = 432 + row * 169;
      const color = row ? C.cyan : C.blue;
      const sent = steps * sentence(state, scene.id, 0, row + 1);
      api.text(ctx, phase, 200, y + 14, 42, color);
      for (let i = 0; i < steps; i++) {
        const x = 780 + 350 * i;
        const travel = Math.max(0, Math.min(1, sent - i));
        api.line(ctx, x - 110, y + 63, x + 110, y + 63, C.muted, 3);
        if (travel > 0) {
          const tile = x - 125 * (1 - travel);
          api.rect(ctx, tile - 108, y - 54, 216, 108, C.panel, color, 12);
          api.text(ctx, traffic.chunk + ' B', tile, y + 18, 54, color, 'center', 'mono');
        }
      }
    });

    if (complete(0, 3))
      api.text(ctx, 'Rank 2 → 3     ' + traffic.sent + ' B sent', 560, 802, 46, C.yellow, 'center');
    if (complete(0, 4))
      api.text(
        ctx,
        'Rank 1 → 2     ' + traffic.received + ' B received',
        1350,
        802,
        46,
        C.cyan,
        'center',
      );
    if (state.beat === 1) {
      if (complete(1, 2)) {
        api.math(ctx, 'V_{sent}=2(k-1)\\times M/k', 960, 940, 50, C.ink, 'center');
      } else if (complete(1, 0)) {
        api.text(
          ctx,
          complete(1, 1)
            ? 'k − 1 sends per phase   ·   M / k bytes per send'
            : 'M / k bytes per send',
          960,
          940,
          43,
          C.ink,
          'center',
        );
      }
      if (complete(1, 3))
        api.text(
          ctx,
          traffic.sent + ' B / ' + bytesPerRank + ' B = ' + traffic.sent / bytesPerRank,
          960,
          1030,
          38,
          C.yellow,
          'center',
        );
    }
    if (state.beat === 2) {
      const note = complete(2, 2)
        ? 'Floating-point sums can round differently in a different order'
        : complete(2, 1)
          ? traffic.rounds + ' round starts, plus local additions'
          : 'Point-to-point ring   ·   each GPU sends to its neighbor';
      api.text(ctx, note, 960, 950, 37, C.ink, 'center');
    }
  });
}
export default {
  id: 'traffic-bound',
  draw: drawTrafficBound,
  cues: [
    'nc-traffic-bound-b0-s0',
    'nc-traffic-bound-b0-s1',
    'nc-traffic-bound-b0-s2',
    'nc-traffic-bound-b0-s3',
    'nc-traffic-bound-b0-s4',
    'nc-traffic-bound-b1-s0',
    'nc-traffic-bound-b1-s1',
    'nc-traffic-bound-b1-s2',
    'nc-traffic-bound-b1-s3',
    'nc-traffic-bound-b2-s0',
    'nc-traffic-bound-b2-s1',
    'nc-traffic-bound-b2-s2',
  ],
};
