import { perRank } from '../model.mjs';
import { onWords } from '../card-memory.mjs';

export function drawChoose(ctx, scene, state, api) {
  const { C } = api;
  const resident = Object.values(perRank(3)).reduce((sum, gb) => sum + gb, 0);
  const gather = 1.5;
  const workspace = 0.5;
  const capacity = 6;
  const load = onWords(state, api, 0, 'joint-allocations', 0.65, 0.84);
  const save = onWords(state, api, 1, 'checkpoint-savings', 0.25, 0.53);
  const longer = onWords(state, api, 3, 'long-sequence', 0, 0.25);
  const activation = 3 * load - 1.5 * save + 3 * longer;
  const fixed = resident + gather + workspace;
  const peak = fixed + activation;
  const x = units => 192 + units * 167;
  const limit = x(capacity);
  const y = 512;
  api.text(ctx, 'One rank   /   four-way full sharding   /   example memory units',
    120, 266, 36, C.muted);
  api.text(ctx, '6-unit limit', limit, 405, 41, C.yellow, 'center');
  api.line(ctx, limit, 431, limit, y - 8, C.yellow, 4);
  api.rect(ctx, x(0), y, capacity * 167, 115, C.panel, undefined, 0);
  api.line(ctx, x(0), y + 115, limit, y + 115, C.muted, 2);
  let offset = 0;
  for (const [gb, color] of [[resident, C.blue], [gather, C.cyan], [workspace, C.yellow]]) {
    api.rect(ctx, x(offset), y + 10, gb * 167 - 3, 95, color, undefined, 1);
    offset += gb;
  }
  api.focus.target('activation-lane', () => {
    if (activation > 0)
      api.rect(ctx, x(fixed), y + 10, activation * 167, 95, C.pink, undefined, 1);
    api.text(ctx, 'Saved activations', x(fixed), y - 34, 32, C.pink);
    if ((state.beat === 0 && load === 1) || (state.beat === 1 && save === 1) || longer === 1)
      api.text(ctx, activation + ' units', x(fixed) + 22, y + 72, 31, C.bg);
  });
  api.line(ctx, limit, y - 5, limit, y + 140, C.yellow, 4);
  api.text(ctx, 'State  ' + resident, x(0), 708, 33, C.blue);
  api.text(ctx, 'Gather  ' + gather, x(resident), 708, 33, C.cyan);
  api.text(ctx, 'Workspace  ' + workspace, x(resident + gather), 777, 30, C.yellow);
  api.line(ctx, x(resident + gather + workspace / 2), 637, x(resident + gather + workspace / 2), 737, C.yellow, 2);
  if (state.beat === 2) {
    api.text(ctx, 'Longer sequence: replace 1.5 saved units with 4.5.', 960, 883, 39, C.ink, 'center');
    api.text(ctx, 'Will the request fit?', 960, 956, 42, C.ink, 'center');
  } else if (load === 1 && (state.beat !== 1 || save === 1) && (state.beat !== 3 || longer === 1)) {
    const margin = capacity - peak;
    api.text(ctx, fixed + ' fixed  +  ' + activation + ' saved  =  ' + peak + ' units',
      960, 891, 45, C.ink, 'center');
    const units = Math.abs(margin) === 1 ? ' unit' : ' units';
    api.text(ctx, Math.abs(margin) + units + (margin < 0 ? ' over capacity' : ' free'),
      960, 966, 34, margin < 0 ? C.pink : C.green, 'center');
  }
}

export default {
  id: 'choose', draw: drawChoose,
  cues: ['joint-allocations', 'checkpoint-savings', 'long-sequence'],
};
