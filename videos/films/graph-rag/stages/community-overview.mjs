import { connector, line, text } from '../defaults.mjs';

const id = 'community-overview';
const shelf = [
  ['B1', 'Make compost from leaves.', 'Gardening'],
  ['B2', 'Grow herbs on a balcony.', 'Gardening'],
  ['B3', 'Walk the riverside trail.', 'Travel'],
  ['B4', 'Simmer the stock slowly.', 'Cooking'],
];
export function drawCommunityOverview(ctx, scene, state, api) {
  const { C } = api;
  const colors = [C.green, C.green, C.blue, C.pink];
  const write = (s, x, y, z, col, align = 'left') => text(ctx, api, id, s, x, y, z, col, align);
  const cue = (name) => state.cues?.[id + '-' + name];
  const p = (name) => cue(name)?.progress ?? 0;
  const reports = p('reports') > 0;
  const batches = p('batches') > 0;
  const mapped = cue('partials')?.phase === 'after';
  const combined = cue('reduce')?.phase === 'after';
  api.focus.target(id + '-shelf', () => {
    write('Four books in the collection', 125, 287, 41, C.ink);
    shelf.forEach(([book, span], i) => {
      const y = 400 + i * 128;
      write(book, 130, y, 38, colors[i]);
      write(span, 230, y, 36, C.ink);
    });
  });
  api.focus.target(id + '-search', () => {
    if (!reports) {
      write('Two similar passages', 1060, 287, 41, C.ink);
      const shown = p('hits') > 0;
      for (let i = 0; i < 2; i++) {
        const y = 344 + i * 128;
        api.rect(ctx, 1038, y, 689, 86, C.panel, shown ? C.green : C.muted, 8);
        write(
          shown ? shelf[i][0] + '    ' + shelf[i][2] : 'Open slot',
          1080,
          y + 55,
          36,
          shown ? C.green : C.muted,
        );
      }
      if (shown) write('Which subjects did the search leave out?', 960, 952, 40, C.ink, 'center');
    } else {
      write('Community reports', 874, 287, 41, C.ink);
      const reportRows = [
        ['Gardening', 'B1, B2', 465, C.green],
        ['Travel', 'B3', 656, C.blue],
        ['Cooking', 'B4', 784, C.pink],
      ];
      for (const [topic, ids, y, color] of reportRows) {
        write(topic, 910, y, 38, color);
        write(ids, 1200, y, 30, C.muted);
      }
      for (const [i, r] of [0, 0, 1, 2].entries()) {
        connector(
          ctx,
          api,
          720,
          390 + i * 128,
          860,
          reportRows[r][2] - 10,
          p('reports'),
          colors[i],
        );
      }
      if (batches) {
        for (const [top, bottom, batch] of [
          [413, 684, 1],
          [727, 815, 2],
        ]) {
          line(ctx, api, 1335, top, 1360, top, C.yellow, 3);
          line(ctx, api, 1360, top, 1360, bottom, C.yellow, 3);
          line(ctx, api, 1335, bottom, 1360, bottom, C.yellow, 3);
          write('Batch ' + batch, 1410, (top + bottom) / 2 + 12, 36, C.yellow);
        }
      }
      if (mapped) {
        write(combined ? 'Combined answer' : 'Map results', 125, 950, 35, C.muted);
        write(
          combined
            ? 'Gardening, travel and cooking   [B1–B4]'
            : '① Gardening and travel     ② Cooking',
          600,
          950,
          40,
          C.ink,
        );
      }
    }
  });
}
export default {
  id,
  draw: drawCommunityOverview,
  cues: ['hits', 'reports', 'batches', 'partials', 'reduce'].map((name) => id + '-' + name),
};
