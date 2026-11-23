import { denseMLP, localPlacement } from '../arithmetic.mjs';
import { mpFresh } from '../model.mjs';
import { poolGB } from '../memory-rails.mjs';
import { sceneClock } from '../scene-clock.mjs';
import { vector } from '../defaults.mjs';

const initial = localPlacement([31, 15], poolGB);
const balanced = localPlacement([23, 23], poolGB);
const movedGB = initial.values[0] - balanced.values[0];
const reference = denseMLP(mpFresh.input);

export function drawFreshLayout(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const prefix = 'mp-fresh-layout-';
  const done = (id) => clock.done(prefix + id);
  const progress = (id) => clock.progress(prefix + id);
  const repair = progress('repair'),
    moving = repair > 0 && repair < 1;
  const placement = progress('placement') > 0 || done('deficit') || repair > 0;
  api.focus.target('fresh-case', () => {
    if (!placement) {
      api.text(ctx, 'New input   x = [−1, 3]', 180, 280, 53, api.C.ink);
      api.text(ctx, 'Same expansion, GeLU, projection and bias', 180, 355, 36, api.C.muted);
      const xs = [480, 1400];
      mpFresh.partials.forEach((part, rank) => {
        const color = rank ? api.C.cyan : api.C.blue;
        api.text(ctx, `GPU ${rank} partial`, xs[rank], 490, 37, color, 'center');
        api.text(
          ctx,
          done('input') ? vector(part) : '[  ·  ,  ·  ]',
          xs[rank],
          600,
          55,
          color,
          'center',
          'mono',
        );
      });
      api.text(ctx, 'Output bias    [0.5, −0.5]', 960, 717, 40, api.C.yellow, 'center');
      const line = done('result')
        ? 'Dense and sharded outputs  ≈  ' + vector(reference)
        : done('sum')
          ? 'Sum the two partials, then add one bias'
          : 'Sum or mean before adding the bias?';
      api.text(ctx, line, 960, 915, 51, done('result') ? api.C.green : api.C.ink, 'center');
      return;
    }
    api.text(ctx, 'Request memory', 155, 324, 47, api.C.ink);
    api.text(ctx, `${initial.groupTotal} GB`, 150, 464, 104, api.C.ink);
    api.text(
      ctx,
      `available across both GPUs   ${initial.groupCapacity} GB`,
      155,
      540,
      36,
      api.C.muted,
    );
    api.text(ctx, 'Verified layer output', 155, 703, 34, api.C.muted);
    api.text(
      ctx,
      done('result') ? '≈ ' + vector(reference) : '…',
      155,
      781,
      45,
      api.C.green,
      'left',
      'mono',
    );

    const y = 835,
      scale = 11,
      xs = [960, 1440],
      width = 250;
    const limitY = y - poolGB * scale;
    const values =
      repair === 1
        ? balanced.values
        : moving
          ? [balanced.values[0], initial.values[1]]
          : initial.values;
    for (const [rank, x] of xs.entries()) {
      const value = values[rank],
        color = rank ? api.C.cyan : api.C.blue;
      const assigned =
        done('deficit') || repair > 0 ? 1 : progress(rank ? 'rank-one' : 'rank-zero');
      const height = value * scale * assigned;
      if (height > 0) api.rect(ctx, x, y - height, width, height, color, undefined, 0);
      if (assigned === 1 && !moving)
        api.text(ctx, `${value} GB`, x + width / 2, y - height / 2 + 14, 38, api.C.bg, 'center');
      api.line(ctx, x - 20, y + 2, x + width + 20, y + 2, api.C.muted, 3);
      api.line(ctx, x - 16, limitY, x, limitY, api.C.yellow, 6);
      api.line(ctx, x + width, limitY, x + width + 16, limitY, api.C.yellow, 6);
      api.text(ctx, `GPU ${rank}`, x + width / 2, 905, 41, color, 'center');
      if (done('six'))
        api.text(
          ctx,
          `${balanced.free[rank]} GB free`,
          x + width / 2,
          975,
          35,
          api.C.green,
          'center',
        );
      else if (done('deficit') && repair === 0) {
        const free = initial.free[rank];
        api.text(
          ctx,
          free < 0 ? `${-free} GB deficit` : `${free} GB spare`,
          x + width / 2,
          975,
          35,
          free < 0 ? api.C.pink : api.C.green,
          'center',
        );
      }
    }
    api.text(ctx, `${poolGB} GB limit`, 1325, limitY + 11, 30, api.C.yellow, 'center');
    if (moving) {
      const top = 320;
      const startY = y - initial.values[0] * scale,
        endY = y - balanced.values[1] * scale;
      const lift = Math.min(1, repair * 4),
        slide = Math.max(0, Math.min(1, (repair - 0.25) * 2));
      const land = Math.max(0, (repair - 0.75) * 4);
      const x = xs[0] + (xs[1] - xs[0]) * slide;
      const blockY = startY + (top - startY) * lift + (endY - top) * land;
      api.rect(ctx, x, blockY, width, movedGB * scale, api.C.yellow, undefined, 0);
      api.text(
        ctx,
        `${movedGB} GB in transfer`,
        x + width / 2,
        blockY + 54,
        29,
        api.C.bg,
        'center',
      );
    }
    const prompt = done('six')
      ? 'This request fits on both GPUs'
      : repair === 1
        ? 'How much room remains on each GPU?'
        : done('deficit')
          ? 'Proposed placement'
          : 'Which GPU is short, and by how much?';
    api.text(ctx, prompt, 1330, 253, 37, done('six') ? api.C.green : api.C.ink, 'center');
  });
}
export default {
  id: 'fresh-layout',
  draw: drawFreshLayout,
  cues: [
    'mp-fresh-layout-input',
    'mp-fresh-layout-sum',
    'mp-fresh-layout-result',
    'mp-fresh-layout-placement',
    'mp-fresh-layout-rank-zero',
    'mp-fresh-layout-rank-one',
    'mp-fresh-layout-deficit',
    'mp-fresh-layout-repair',
    'mp-fresh-layout-six',
  ],
};
