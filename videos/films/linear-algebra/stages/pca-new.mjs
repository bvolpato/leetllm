import { dotProduct } from 'vizmatic';
import { mix } from '../arithmetic.mjs';
import { event } from '../construction.mjs';
import { A, contrast, mean } from '../fixtures.mjs';
import { pcaFrame } from '../model.mjs';
import { equation, line, plane, ring, target, text } from '../defaults.mjs';

export function drawPcaNew(ctx, scene, state, api) {
  const { C } = api;
  const training = pcaFrame({ beat: 3 });
  const incoming = event(state, 0, 'new-mentions', 0.30, 0.43);
  const centered = event(state, 0, 'center-new-row', 0.44, 0.57);
  const drop = event(state, 1, 'read-new-score', 0.01, 0.17);
  const plot = plane(ctx, api, [-1.15, 2.35, -1.15, 1.55], 120, 350, 760, 485);
  const tickets = [
    { name: 'Slow only', row: A[0], color: C.blue },
    { name: 'New ticket', row: training.query, color: C.yellow },
  ];

  text(ctx, api, 'Fitted contrast ruler', 499, 290, 36, C.pink, 'center');
  line(ctx, api, plot, [-1.05, 1.05], [1.02, -1.02], C.pink, 4);
  text(ctx, api, 'Ticket', 885, 366, 32, C.muted);
  text(ctx, api, 'Slow / rollback', 1225, 366, 32, C.muted, 'center');
  text(ctx, api, 'Centered row', 1605, 366, 32, C.muted, 'center');

  tickets.forEach(({ name, row, color }, i) => {
    if (i === 1 && incoming === 0) return;
    const y = 493 + 139 * i;
    const offset = row.map((v, j) => v - mean[j]);
    // The training ticket carries the centered position established in the previous scene.
    const progress = i === 0 ? 1 : centered;
    const point = mix(row, offset, progress);
    const score = dotProduct(offset, contrast);
    const foot = contrast.map((v) => v * score);
    target(ctx, api, i === 1 ? 'incoming-counts' : 'training-counts', () => {
      text(ctx, api, name, 885, y + 12, 34, color);
      text(ctx, api, '[' + row.join(', ') + ']', 1225, y + 12, 38, color, 'center');
    });
    target(ctx, api, 'center-new-row', () => {
      if (i === 1) {
        ring(ctx, api, plot.point(...row), color, 7);
        line(ctx, api, plot, row, point, color, 2);
        if (progress === 1) {
          const raw = plot.point(...row);
          text(ctx, api, 'raw count row', raw.x - 12, raw.y - 30, 29, color, 'right');
        }
      }
      const p = plot.point(...point);
      api.circle(ctx, p.x, p.y, 9, color);
      if (progress === 1) {
        const thirds = offset.map((v) => Math.round(v * 3) + '/3');
        text(ctx, api, '[' + thirds.join(', ') + ']', 1605, y + 12, 36, color, 'center');
      } else {
        text(ctx, api, '− mean', 1605, y + 12, 32, C.muted, 'center');
      }
    });
    target(ctx, api, 'new-score', () => {
      if (drop > 0) {
        const mark = mix(offset, foot, drop);
        line(ctx, api, plot, offset, mark, color, 3);
        ring(ctx, api, plot.point(...mark), color, i === 0 ? 21 : 13);
      }
    });
  });

  text(ctx, api, 'Saved training mean    [2/3, 2/3]', 1330, 766, 32, C.muted, 'center');
  target(ctx, api, 'new-score', () => {
    if (drop === 1) {
      equation(ctx, api, 's_{\\rm slow}=s_{\\rm new}=-1/\\sqrt{2}', 1330, 864, 46, C.pink);
    } else {
      text(ctx, api, 'New contrast score    ?', 1330, 864, 41, C.pink, 'center');
    }
  });
  text(ctx, api, 'Contrast measures (rollback mentions − slow mentions) / √2 after centering.', 960, 974, 31, C.ink, 'center');
}

export default {
  id: 'pca-new',
  draw: drawPcaNew,
  cues: ['new-mentions', 'center-new-row', 'read-new-score'],
};
