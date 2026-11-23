import { finished, label, progress } from '../workbench.mjs';

export function drawHierarchy(ctx, scene, state, api) {
  const { C } = api;
  const spread = Math.ceil(16 * progress(state, 0, 'fan-sixteen'));
  const warp = finished(state, 1, 'one-warp');
  api.focus.target('block-panel', () => {
    for (const [x, name, color] of [[208, 'Shared A', C.blue], [792, 'Shared B', C.pink], [1370, 'C · output tile', C.cyan]]) {
      label(ctx, api, name, x + 167, 355, 37, color);
      for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
        const hit = name === 'Shared A' ? i === 4 && j === 3 :
          name === 'Shared B' ? i === 3 && j < spread : i === 4 && j < spread;
        const lane = warp && name.startsWith('C') && (i === 4 || i === 5);
        api.rect(ctx, x + j * 21, 405 + i * 21, 18, 18,
          hit ? color : lane ? '#32636b' : C.panel, hit || lane ? color : C.muted, 0);
      }
    }
    label(ctx, api, '×', 669, 585, 52, C.ink);
    label(ctx, api, '→', 1248, 585, 52, C.ink);
    label(ctx, api, warp ? 'One warp · 32 threads · two adjacent output rows' :
      `A[4,3] feeds ${spread} output columns`, 960, 842, 40, C.ink);
    if (state.beat >= 2) label(ctx, api, '8,192 FLOPs / 2,048 input bytes = 4 FLOP/B per full panel', 960, 951, 36, C.yellow);
  });
}
export default { id: 'hierarchy', draw: drawHierarchy, cues: ['fan-sixteen', 'one-warp', 'block-bytes'] };
