import { cueStep } from '../construction.mjs';

const tools = [1, 1, 6, 6];
const seconds = [2, 2, 20, 20];
const aligned = [0, 1, 2, 3];
const reversed = [3, 2, 1, 0];
const swapped = [3, 1, 2, 0];
const y = (i) => 403 + i * 134;

export function drawJointRelationship(ctx, scene, state, api) {
  const { C } = api;
  const first = cueStep(state, 'sp-joint-relationship-0', 0, 0.33, 0.65);
  const firstCount = cueStep(state, 'joint-first-total', 1, 0.02, 0.12);
  const turn = cueStep(state, 'sp-joint-relationship-1', 1, 0.1, 0.55);
  const zero = cueStep(state, 'sp-joint-zero', 2, 0.04, 0.23);
  const swap = cueStep(state, 'sp-joint-relationship-2', 3, 0.1, 0.45);
  const label = cueStep(state, 'joint-last', 4, 0.04, 0.25);
  const pairing = swap >= 0.5 ? swapped : turn >= 0.5 ? reversed : aligned;
  api.focus.target('sp-joint-relationship-visual', () => {
    api.text(ctx, 'Tool calls', 538, 277, 45, C.ink, 'center');
    api.text(ctx, 'Seconds', 1382, 277, 45, C.ink, 'center');
    api.text(ctx, 'expensive above 5', 538, 333, 30, C.muted, 'center');
    api.text(ctx, 'slow above 15', 1382, 333, 30, C.muted, 'center');
    pairing.forEach((end, i) => {
      const travel =
        swap > 0 && (i === 1 || i === 2)
          ? Math.abs(2 * swap - 1)
          : turn > 0
            ? Math.abs(2 * turn - 1)
            : first;
      const both = tools[i] > 5 && seconds[end] > 15;
      const wire = both && travel === 1 ? C.pink : C.muted;
      if (travel > 0) {
        const points = [
          { x: 584, y: y(i) },
          { x: 618 + i * 44, y: y(i) },
          { x: 1056 + i * 65, y: y(end) },
          { x: 1336, y: y(end) },
        ];
        api.trace(ctx, points, travel, wire, both ? 8 : 4);
      }
      api.text(ctx, 'R' + (i + 1), 283, y(i) + 13, 36, C.muted);
      api.circle(ctx, 538, y(i), 46, tools[i] > 5 ? C.pink : C.panel);
      api.text(ctx, String(tools[i]), 538, y(i) + 15, 43, tools[i] > 5 ? C.bg : C.ink, 'center');
      api.circle(ctx, 1382, y(i), 46, seconds[i] > 15 ? C.pink : C.panel);
      api.text(
        ctx,
        String(seconds[i]),
        1382,
        y(i) + 15,
        43,
        seconds[i] > 15 ? C.bg : C.ink,
        'center',
      );
    });
    const show = (firstCount === 1 && turn === 0) || (zero === 1 && swap === 0) || label === 1;
    if (show) {
      const count = pairing.filter((end, i) => tools[i] > 5 && seconds[end] > 15).length;
      api.text(ctx, count + ' of 4 both expensive and slow', 960, 969, 43, C.ink, 'center');
    }
  });
}

export default {
  id: 'joint-relationship',
  draw: drawJointRelationship,
  cues: [
    'sp-joint-relationship-0',
    'joint-first-total',
    'sp-joint-relationship-1',
    'sp-joint-zero',
    'sp-joint-relationship-2',
    'joint-last',
  ],
};
