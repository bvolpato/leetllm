import { layoutCellGrid, stableSoftmax } from 'vizmatic';
import { drawMemoryPacket } from './memory-packet.mjs';
import { SCORES } from '../fixtures.mjs';
import { rowClock } from '../row-workspace.mjs';

const passes = [
  {
    cue: 'store-scores',
    payload: 'S',
    operation: 'Compute scaled scores',
    destination: 'write to HBM',
  },
  {
    cue: 'fetch-scores',
    payload: 'S',
    operation: 'Normalize each row',
    destination: 'read from HBM',
  },
  {
    cue: 'store-probabilities',
    payload: 'P',
    operation: 'Normalize each row',
    destination: 'write to HBM',
  },
  {
    cue: 'fetch-probabilities',
    payload: 'P',
    operation: 'Blend the values',
    destination: 'read from HBM',
  },
];

export function drawMemory(ctx, scene, state, api) {
  const { C } = api,
    clock = rowClock(scene, state);
  const i = Math.max(
      0,
      passes.findLastIndex((p) => clock.started(p.cue)),
    ),
    pass = passes[i];
  const count = passes.filter((p) => clock.done(p.cue)).length,
    t = clock.progress(pass.cue);
  const local = clock.started('small-workspace');
  const write = i % 2 === 0;
  if (typeof api.teaching?.tileTransfer !== 'function') {
    return drawMemoryPacket(ctx, api, clock, pass, count, t, local, write);
  }
  let arithmeticGrid, hbmGrid;
  const dock = (x) => {
    const grid = layoutCellGrid({ x, y: 440, width: 360, height: 222, rows: 3, columns: 3 });
    for (const row of grid.cells) {
      for (const cell of row) {
        api.line(
          ctx,
          cell.x + 5,
          cell.y + cell.height - 3,
          cell.x + cell.width - 5,
          cell.y + cell.height - 3,
          C.muted,
          2,
        );
      }
    }
    return grid;
  };
  api.focus.target('local-data', () => {
    api.text(ctx, local ? 'Fused attention' : 'Arithmetic units', 170, 297, 44, C.ink);
    api.line(ctx, 170, 330, 620, 330, C.muted, 2);
    api.text(ctx, local ? 'On-chip score tile' : pass.operation, 170, 401, 36, C.ink);
    if (local) {
      for (let j = 0; j < 2; j++) api.rect(ctx, 175 + j * 108, 494, 98, 98, C.blue, undefined, 5);
      api.text(ctx, 'Reuse these slots', 170, 698, 31, C.blue);
    } else arithmeticGrid = dock(170);
  });
  api.focus.target('hbm-data', () => {
    api.text(ctx, 'HBM', 1340, 297, 48, C.ink);
    api.line(ctx, 1340, 330, 1760, 330, C.muted, 2);
    api.text(
      ctx,
      local ? 'Inputs and output' : pass.payload === 'S' ? 'Scores  S' : 'Probabilities  P',
      1340,
      401,
      36,
      C.ink,
    );
    if (local) api.text(ctx, 'Q   K   V   O', 1340, 560, 47, C.cyan);
    else hbmGrid = dock(1340);
  });
  api.focus.target('memory-channel', () => {
    if (local) {
      api.text(ctx, 'Score tile stays on chip', 930, 600, 34, C.cyan, 'center');
      return;
    }
    const probabilities = stableSoftmax(SCORES);
    const cells = SCORES.map((_, row) =>
      SCORES.map((score, column) => {
        if (column > row) return { label: '×', fill: C.panel, stroke: C.muted, textColor: C.muted };
        const label =
          row === 2
            ? pass.payload === 'S'
              ? score
              : (100 * probabilities[column]).toFixed(1) + '%'
            : pass.payload + ['₁', '₂'][row] + ['₁', '₂'][column];
        return {
          label,
          fill: C.panel,
          stroke: pass.payload === 'S' ? C.blue : C.cyan,
          textColor: C.ink,
        };
      }),
    );
    api.teaching.tileTransfer({
      source: { grid: write ? arithmeticGrid : hbmGrid },
      target: { grid: write ? hbmGrid : arithmeticGrid },
      cells,
      progress: t,
      rowStagger: 0.42,
      gap: 8,
      fontSize: 28,
    });
    api.arrow(ctx, write ? 665 : 1205, 732, write ? 1205 : 665, 732, C.muted, 3);
    api.text(ctx, pass.destination, 935, 806, 35, C.ink, 'center');
  });
  api.focus.target('traffic-count', () =>
    api.text(
      ctx,
      local
        ? 'Full-matrix intermediate transfers avoided'
        : 'Completed full-matrix transfers   ' + count,
      960,
      948,
      44,
      local ? C.cyan : C.yellow,
      'center',
    ),
  );
}

export default {
  id: 'memory',
  draw: drawMemory,
  cues: [
    'store-scores',
    'fetch-scores',
    'store-probabilities',
    'fetch-probabilities',
    'count-transfers',
    'small-workspace',
  ],
};
