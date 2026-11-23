import { retrievalRun } from '../model.mjs';
import { spoken } from '../construction.mjs';

export function drawMergeRankedLists(ctx, scene, state, api) {
  const { C, focus } = api;
  const run = retrievalRun();
  const ranks = run.rankings;
  const ids = run.permittedIds;
  const xs = [608, 900, 1192];
  const colors = [C.blue, C.cyan, C.yellow];
  const firstVotes = spoken(state, 1, 'fusion-first');
  const lastVote = spoken(state, 2, 'fusion-second');
  const done = spoken(state, 2, 'fusion-result') === 1;
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);

  label('Position in each search', 900, 239, 31, C.muted, 'center');
  run.queries.slice(1).forEach((query, i) => {
    const words = query.split(' ');
    const heading = words.slice(0, 2).join(' ') + '\n' + words.slice(2).join(' ');
    focus.target('source-ranks', () => label(heading, xs[i], 330, 32, colors[i], 'center'));
  });
  label('Source ID', 128, 385, 30, C.muted);
  label('Fused score', 1440, 385, 30, C.muted);
  api.line(ctx, 125, 415, 1800, 415, C.muted, 2);

  ids.forEach((id, row) => {
    const y = 505 + row * 140;
    const winner = done && id === run.fused[0].id;
    label(id, 128, y, 41, winner ? C.green : C.ink);
    let barX = 1440;
    ranks.forEach((list, i) => {
      const rank = list.indexOf(id) + 1;
      focus.target('source-ranks', () =>
        label(rank || '·', xs[i], y, 44, rank ? colors[i] : C.muted, 'center'),
      );
      const progress = rank === 1 ? firstVotes : lastVote;
      if (rank && progress) {
        const width = (9200 / (60 + rank)) * progress;
        api.rect(ctx, barX, y - 34, width, 33, colors[i]);
        barX += width;
      }
    });
    focus.target('fusion-scores', () => {
      const score = run.fused.find((item) => item.id === id).score;
      label(done ? score.toFixed(4) : ' ', 1440, y + 46, 32, winner ? C.green : C.ink);
    });
    api.line(ctx, 128, y + 72, 1798, y + 72, C.panel, 3);
  });
  const queueRow = ranks.map((list) => list.indexOf('queue-guide') + 1).filter(Boolean);
  const parts = queueRow.map((rank) => '1/' + (60 + rank)).join('  +  ');
  focus.target('fusion-equation', () =>
    label(
      lastVote > 0
        ? 'Queue guide     ' +
            parts +
            (done ? '  =  ' + run.fused.find((d) => d.id === 'queue-guide').score.toFixed(4) : '')
        : firstVotes > 0
          ? 'Each first place     1 / (60 + 1) = 1 / 61'
          : 'One contribution per list that finds the page',
      960,
      940,
      41,
      C.ink,
      'center',
    ),
  );
  if (firstVotes === 1 && lastVote === 0)
    label('Which page takes the lead?', 960, 1010, 35, C.yellow, 'center');
}

export default {
  id: 'merge-ranked-lists',
  draw: drawMergeRankedLists,
  cues: ['fusion-ranks', 'fusion-first', 'fusion-second', 'fusion-result'],
};
