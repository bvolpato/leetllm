import { STATUS_IDS, STATUS_ROW } from '../fixtures.mjs';
import { coreText } from '../defaults.mjs';
import { heard, movement } from '../spoken.mjs';

export function drawPrunedPrefix(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat ?? 0;
  api.focus.target('beam-frontier', () => {
    if (b < 2) {
      const divide = movement(state, 'prune-split', 0, 0.25, 0.56);
      const track = heard(state, 'prune-track', 0, 0.78);
      const result = heard(state, 'prune-result', 1, 0.26);
      const width = 1700;
      coreText(ctx, api, 'Two places on the beam', 150, 275, 46, C.ink, 'left');
      for (let i = 0; i < 3; i++) {
        const y = 431 + i * 175;
        const p = STATUS_ROW[i];
        const color = i === 2 ? C.muted : C.blue;
        coreText(ctx, api, STATUS_IDS[i] + ' · ' + p.toFixed(2), 150, y, 40, color, 'left');
        api.rect(ctx, 490, y - 38, width * p, 50, color, undefined, 2);
        if (i < 2) {
          const boundaries = Math.round(9 * divide);
          for (let j = 1; j <= boundaries; j++) {
            const x = 490 + (width * p * j) / 10;
            api.line(ctx, x, y - 38, x, y + 12, C.bg, 6);
          }
        }
        const detail =
          i < 2
            ? divide === 1
              ? p.toFixed(2) + ' / 10 = ' + (p / 10).toFixed(3)
              : 'retained'
            : track
              ? result
                ? 'on track   ' + p.toFixed(2) + ' × 1 = ' + p.toFixed(3)
                : 'track · 1.00 if expanded'
              : 'pruned at step 1';
        coreText(ctx, api, detail, 1340, y, 33, i === 2 && result ? C.yellow : color, 'left');
      }
      coreText(
        ctx,
        api,
        result
          ? 'Width 2 can reach 0.045. Exhaustive search can reach 0.150.'
          : track
            ? 'Which two-word path would exhaustive search find?'
            : 'The other first words each score below on.',
        960,
        985,
        38,
        C.ink,
      );
    } else {
      const rows = [
        [0.5, 0.3, 0.2],
        [0.7, 0.2, 0.1],
      ];
      const pooled = heard(state, 'prune-siblings', 3, 0.4);
      const ranked = rows
        .flatMap((row, i) =>
          row.map((conditional, j) => ({ i, j, p: STATUS_ROW[i] * conditional })),
        )
        .sort((a, b) => b.p - a.p);
      coreText(
        ctx,
        api,
        'New second-word probabilities for the two retained parents',
        150,
        275,
        42,
        C.ink,
        'left',
      );
      rows.forEach((row, i) => {
        const y = 448 + i * 237;
        coreText(
          ctx,
          api,
          STATUS_IDS[i] + ' · ' + STATUS_ROW[i].toFixed(2),
          150,
          y,
          37,
          C.blue,
          'left',
        );
        row.forEach((v, j) => {
          const x = 600 + j * 405;
          const win = pooled && ranked.slice(0, 2).some((r) => r.i === i && r.j === j);
          const tone = win ? C.green : j === 2 ? C.muted : C.cyan;
          const product = STATUS_ROW[i] * v;
          coreText(
            ctx,
            api,
            STATUS_ROW[i].toFixed(2) + ' × ' + v.toFixed(2),
            x,
            y - 25,
            32,
            C.muted,
            'left',
          );
          api.rect(ctx, x, y, product * 1200, 37, tone, undefined, 2);
          coreText(ctx, api, product.toFixed(3), x, y + 96, 36, tone, 'left');
        });
      });
      coreText(
        ctx,
        api,
        pooled
          ? 'Global top two   ' +
              ranked
                .slice(0, 2)
                .map((r) => r.p.toFixed(3))
                .join('   and   ')
          : 'Can either third child earn a place in the global top two?',
        960,
        955,
        42,
        C.ink,
      );
    }
  });
}
export default {
  id: 'pruned-prefix',
  draw: drawPrunedPrefix,
  cues: ['prune-split', 'prune-track', 'prune-result', 'prune-children', 'prune-siblings'],
};
