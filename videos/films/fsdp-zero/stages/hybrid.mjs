import { gbX, memoryAxis, memoryRow, onWords } from '../card-memory.mjs';
import { recipeLedger } from '../model.mjs';

export function drawHybrid(ctx, scene, state, api) {
  const { C } = api;
  const local = onWords(state, api, 1, 'local-groups', 0.2, 0.48);
  const request = onWords(state, api, 2, 'local-memory', 0.03, 0.25);
  const across = recipeLedger(70, 32).total;
  const within = recipeLedger(70, 8).total;
  api.text(ctx, '1,120 GB of model state   /   four nodes   /   each tile is one rank’s shard ID', 120, 257, 35, C.ink);
  for (let node = 0; node < 4; node++) {
    const x = 139 + node * 417;
    api.text(ctx, 'Node ' + node, x, 342, 33, C.muted);
    api.focus.target('node-shards', () => {
      for (let i = 0; i < 8; i++) {
        const id = local === 1 ? i : node * 8 + i;
        const color = id === 0 ? C.yellow : C.blue;
        const start = x + i * 46;
        api.rect(ctx, start, 373, 43, 68, color, undefined, 3);
        api.text(ctx, id, start + 21.5, 416, 26, C.bg, 'center');
      }
      api.line(ctx, x, 469, x + 365, 469, local === 1 ? C.cyan : C.muted, 3);
      if (node < 3 && local < 1)
        api.line(ctx, x + 365, 469, x + 365 + 52 * (1 - local), 469, C.muted, 3);
    });
  }
  memoryAxis(ctx, api, 591, 887);
  memoryRow(ctx, api, 633, 'Global shard', [[across, C.blue]]);
  api.text(ctx, '1,120 ÷ 32 = ' + across + ' GB', gbX(0), 756, 33, C.blue);
  if (state.beat > 0) api.focus.target('local-request', () => {
    memoryRow(ctx, api, 800, 'Node-local', [[within * request, C.cyan]]);
    api.text(ctx, request === 1 ? '1,120 ÷ 8 = ' + within + ' GB of state per rank' : '1,120 GB ÷ which group size?',
      gbX(0), 954, 39, request === 1 ? C.cyan : C.ink);
  });
}

export default { id: 'hybrid', draw: drawHybrid, cues: ['local-groups', 'local-memory'] };
