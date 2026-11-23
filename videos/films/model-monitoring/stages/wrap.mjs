import { dot, line, text } from '../defaults.mjs';
import { predictionRows, requests } from '../fixtures.mjs';
import { monitoringScene } from '../storyboard.mjs';

const live = requests.find((row) => row.id === 's-105');
const archive = predictionRows.find((row) => row.id === 'p-005');

export default monitoringScene('wrap', ['archive', 'ask', 'identity', 'late'], (ctx, api, cue) => {
  const { C } = api;
  line(ctx, api, 177, 570, 1740, 570, C.muted, 2);
  const rows = [
    [live.id, 'Live request', live.score, 'Score at noon', C.blue],
    [archive.id, 'Archived prediction', archive.score, 'Window closed at 11:00', C.pink],
  ];
  rows.forEach(([id, name, score, time, color], i) => {
    if (i === 1 && !cue.started('archive')) return;
    const y = 365 + i * 300;
    text(ctx, api, name, 170, y, 32, C.muted, 'left');
    text(ctx, api, id, 170, y + 87, 52, color, 'left');
    text(ctx, api, `Score   ${score.toFixed(2)}`, 640, y + 50, 43, C.ink);
    text(ctx, api, time, 1220, y, 33, color);
    if (cue.done('identity') && i === 0)
      text(ctx, api, 'Await its own deadline', 1220, y + 87, 38, C.yellow);
    if (i === 1) {
      const x = 1030 + 430 * cue.progress('late');
      text(ctx, api, 'Label arrival', 991, y + 85, 28, C.muted, 'right');
      line(ctx, api, 1030, y + 75, 1460, y + 75, C.muted, 3);
      dot(ctx, api, x, y + 75, color, 12);
      text(ctx, api, '11:00', 1030, y + 132, 28, C.muted);
      text(ctx, api, '12:00', 1245, y + 132, 28, C.yellow);
      text(ctx, api, '13:00', 1460, y + 132, 28, C.muted);
    }
  });
  if (cue.started('ask') && !cue.started('identity'))
    text(ctx, api, 'Can the archive tell us whether the live job missed?', 960, 934, 40, C.yellow);
  if (cue.done('late'))
    text(
      ctx,
      api,
      'p-005   /   missed deadline   /   label available at 13:00 in the late archive',
      960,
      936,
      33,
      C.pink,
    );
});
