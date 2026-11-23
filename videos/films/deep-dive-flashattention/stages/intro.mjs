import { afterCue, cueMotion, sampleModel } from '../construction.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C, teaching, focus } = api;
  const s = sampleModel(scene.id, state);
  const label = (str, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, String(str), x, y, size, color, align);
  if (state.t < 0.35) ctx.globalAlpha = 1;

  const coarse = s.n > 8;
  const current = Math.max(0, Math.ceil(s.scored / 16) - 1);
  const firstQ = 4 * Math.floor(current / s.tilesAcross) + 1;
  const firstK = 4 * (current % s.tilesAcross) + 1;
  const used = s.pairsVisited - current * 16;
  const fraction = s.scored - s.pairsVisited;
  const waiting = s.b === 0 || (s.b === 1 && cueMotion(state, 1, 'intro-next') === 0);
  if (!waiting) {
    const highlights = [];
    for (let row = 0; row < 8; row++) {
      for (let column = 0; column < 8; column++) {
        const tile = coarse ? row * 8 + column : Math.floor(row / 4) * 2 + Math.floor(column / 4);
        const offset = coarse ? 0 : (row % 4) * 4 + (column % 4);
        if (tile * 16 + offset >= s.pairsVisited) continue;
        const color = tile === current ? C.cyan : C.blue;
        highlights.push({ row, column, fill: color + '88', stroke: color });
      }
    }
    focus.target('intro-pair-map', () => {
      label(`${s.n} queries × ${s.n} keys`, 1155, 275, 48);
      teaching.grid({
        x: 1155,
        y: 340,
        width: 480,
        height: 480,
        rows: 8,
        columns: 8,
        fill: C.panel,
        stroke: C.muted,
        highlights,
      });
      label(
        coarse ? 'One square = one 4 × 4 visit' : 'One square = one comparison',
        1155,
        879,
        33,
        C.muted,
      );
    });
    const output = Array.from({ length: 8 }, (_, row) => row).filter(
      (row) => row * (s.n / 8) < s.outputRows,
    );
    teaching.grid({
      x: 1690,
      y: 340,
      width: 70,
      height: 480,
      rows: 8,
      columns: 1,
      fill: C.panel,
      stroke: C.muted,
      highlights: output.map((row) => ({ row, column: 0, fill: C.green + '88', stroke: C.green })),
    });
    label('Output', 1725, 319, 31, C.green, 'center');
  }
  focus.target('intro-live-tile', () => {
    label('On-chip score tile', 300, 245, 58, C.cyan);
    const x = 300,
      y = 360,
      w = 166,
      h = 101;
    label('Key value', x - 20, y - 32, 32, C.muted, 'right');
    const labels = [];
    const filled = [];
    for (let row = 0; row < 4; row++) {
      const activeKey = s.b === 0 && used < 16 && row === used % 4;
      label(firstK + row, x + (row + 0.5) * w, y - 32, 40, activeKey ? C.yellow : C.blue, 'center');
      label(
        `Q = ${firstQ + row}`,
        x - 22,
        y + (row + 0.5) * h + 14,
        40,
        s.b === 0 && row !== 3 ? C.muted : C.yellow,
        'right',
      );
      labels[row] = [];
      for (let column = 0; column < 4; column++) {
        const occupied = row * 4 + column < used;
        labels[row][column] = occupied ? String((firstQ + row) * (firstK + column)) : '';
        if (occupied) filled.push({ row, column, fill: C.cyan + '44', stroke: C.cyan });
        if (s.b === 0 && row * 4 + column === used)
          filled.push({ row, column, fill: C.yellow + '24', stroke: C.yellow });
      }
    }
    teaching.grid({
      x,
      y,
      width: 4 * w,
      height: 4 * h,
      rows: 4,
      columns: 4,
      labels,
      fill: C.panel,
      stroke: C.cyan,
      textColor: C.ink,
      fontSize: 52,
      highlights: filled,
    });
    // The first three rows are already scored. Follow the fourth query into each open slot.
    if (s.b === 0 && used < 16) {
      const column = used % 4;
      const cx = x + (column + 0.5) * w;
      const cy = y + 4 * h + 32 + 102 * (1 - fraction);
      api.components.card({
        x: cx - 68,
        y: cy - 29,
        width: 136,
        height: 58,
        label: '',
        fill: C.yellow,
        stroke: C.yellow,
      });
      label(`${firstQ + 3} × ${firstK + column}`, cx, cy + 15, 40, C.bg, 'center');
    }
    label(`16 slots × 2 bytes = ${s.tileBytes} bytes`, 300, 978, 38, C.cyan);
  });
  focus.target('intro-account', () => {
    if (waiting) {
      label('Next four key values', 1155, 440, 48, C.blue);
      for (let i = 0; i < 4; i++) {
        const x = 1155 + 144 * i;
        api.components.card({
          x,
          y: 497,
          width: 128,
          height: 110,
          label: '',
          fill: C.panel,
          stroke: C.blue,
        });
        label(firstK + 4 + i, x + 64, 571, 62, C.blue, 'center');
      }
      return;
    }
    const detail = afterCue(state, 3, 'intro-bytes')
      ? `Full tensor: ${s.scoreBytes.toLocaleString('en-US')} bytes`
      : s.b === 2
        ? 'Which count grows?'
        : `Comparisons completed: ${s.pairsVisited.toLocaleString('en-US')}`;
    label(detail, 1155, 978, 40, C.yellow);
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-first',
    'intro-question',
    'intro-next',
    'intro-rest',
    'intro-long',
    'intro-many',
    'intro-bytes',
  ],
};
