import { drawLine, drawRectangle, drawText } from '../defaults.mjs';
import { voice } from '../voice.mjs';

const scans = [
  [3, 27],
  [4, 8, 19, 22, 29, 37],
];
const count = 40;
const fraction = 0.1;
export function drawAnnBackends(ctx, scene, state, api) {
  const c = api.C;
  const cue = voice(scene, state);
  const done = (id) => cue(id).phase === 'after';
  const label = (s, x, y, size, color = c.ink) => drawText(ctx, api, s, x, y, size, color);
  const active = state.beat;

  if (active === 2) {
    const extraHits = [46];
    const examined = count + Math.floor(10 * cue('ann-iterate').progress);
    const passed = [...scans[0], ...extraHits].filter((id) => id <= examined);
    api.focus.target('engine', () => {
      label('pgvector   /   inside the database', 130, 281, 41, c.blue);
      label('Illustrative cap: 50 candidates', 1030, 281, 36, c.yellow);
      label('Scan A', 130, 388, 35);
      label('Requested: 10 passages', 1030, 388, 35);
      for (let i = 0; i < 50; i++) {
        const x = 130 + (i % 10) * 79;
        const y = 430 + Math.floor(i / 10) * 77;
        const seen = i < examined;
        const color = seen && passed.includes(i + 1) ? c.green : seen ? c.blue : c.muted;
        drawRectangle(ctx, api, x, y, 56, 48, color);
        if (seen && passed.includes(i + 1)) label(String(i + 1), x + 10, y + 34, 25, c.green);
        else if (seen) drawLine(ctx, api, x + 15, y + 24, x + 41, y + 24, c.muted);
      }
      for (let i = 0; i < 10; i++) {
        const x = 1030 + (i % 5) * 152;
        const y = 441 + Math.floor(i / 5) * 119;
        const returned = done('ann-filter') && passed[i];
        drawRectangle(ctx, api, x, y, 130, 84, returned ? c.green : c.muted);
        if (returned) label('ID ' + returned, x + 17, y + 54, 29, c.green);
      }
      label(examined + ' candidates examined', 130, 898, 39, c.yellow);
      if (done('ann-filter')) label(passed.length + ' of 10 slots filled', 1030, 743, 39, c.green);
      if (done('ann-cap')) label('Scan limit reached', 1030, 898, 37, c.yellow);
    });
    return;
  }

  if (active === 3) {
    const allowed = scans[0];
    const path = [2, 3, 8];
    const explored = Math.floor(path.length * cue('ann-walk').progress);
    api.focus.target('engine', () => {
      label('Weaviate   /   allow-list before graph search', 130, 282, 41, c.blue);
      label('Allowed IDs in scan A', 130, 407, 36);
      allowed.forEach((id, i) => {
        const x = 715 + 268 * i;
        drawRectangle(ctx, api, x, 347, 215, 92, c.green);
        if (cue('ann-list').progress * allowed.length >= i + 1)
          label('ID ' + id, x + 39, 406, 36, c.green);
      });
      drawLine(ctx, api, 130, 494, 1780, 494);
      label('One possible search path', 130, 602, 36);
      path.forEach((id, i) => {
        const x = 715 + i * 268;
        const seen = i < explored;
        const color = seen ? (allowed.includes(id) ? c.green : c.blue) : c.muted;
        drawRectangle(ctx, api, x, 537, 215, 94, color);
        label('ID ' + id, x + 39, 598, 36, color);
        if (i > 0) api.arrow(ctx, x - 41, 584, x - 11, 584, c.muted, 3);
      });
      label('Returned from this path', 130, 778, 36);
      for (const id of path.slice(0, explored).filter((id) => allowed.includes(id)))
        label('ID ' + id, 754, 778, 39, c.green);
      if (done('ann-flat'))
        label(
          'Small allowed set: flat search can compare its members directly.',
          130,
          953,
          35,
          c.blue,
        );
    });
    return;
  }

  api.focus.target('samples', () => {
    label('40 examined per search', 130, 268, 39);
    label('10% chance of a match per candidate', 915, 268, 39, c.blue);
    drawLine(ctx, api, 130, 315, 1785, 315);
    scans.forEach((matches, lane) => {
      const left = lane === 0 ? 130 : 997;
      const sweep = cue(lane === 0 ? 'ann-left' : 'ann-right');
      label(lane === 0 ? 'Possible scan A' : 'Possible scan B', left, 391, 34, c.muted);
      for (let i = 0; i < count; i++) {
        const x = left + (i % 10) * 79;
        const y = 435 + Math.floor(i / 10) * 64;
        const seen = i + 1 <= Math.floor(count * sweep.progress);
        const hit = matches.includes(i + 1);
        const color = seen && hit ? c.green : c.muted;
        drawRectangle(ctx, api, x, y, 56, 42, color, seen && hit ? c.green : c.panel);
        if (seen && !hit) drawLine(ctx, api, x + 16, y + 21, x + 40, y + 21, c.muted);
      }
      if (sweep.phase === 'after')
        label(matches.length + ' eligible rows found', left, 747, 39, c.green);
    });
    if (done('ann-mean'))
      label(
        'Expected matches per search     ' +
          count +
          ' × ' +
          fraction.toFixed(2) +
          ' = ' +
          count * fraction,
        130,
        845,
        44,
        c.ink,
      );
    else label('How many eligible rows on average?', 130, 845, 43, c.yellow);
  });
}
export default {
  id: 'ann-backends',
  draw: drawAnnBackends,
  cues: [
    'ann-premise',
    'ann-mean',
    'ann-left',
    'ann-right',
    'ann-filter',
    'ann-iterate',
    'ann-cap',
    'ann-list',
    'ann-walk',
    'ann-flat',
  ],
};
