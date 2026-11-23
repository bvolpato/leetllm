import { circle, dot, place, to } from 'vizmatic/stage';
import { namedBox } from '../../kit-narrated.mjs';
import { board, body, caption, readings } from '../parts.mjs';

export default function workerLocality(s, c) {
  board(s, c, 'Which worker holds the guide?', 'Routing · independent worker caches');
  const [heads, slots, ...requests] = body.rows([0.8, 0.9, 1, 1, 1, 1, 1], 'tight');
  const cols = (r) => r.columns(5, 'normal');
  const workers = [0, 1, 2, 3].map((w) => {
    const region = cols(slots)[w + 1];
    const slot = (name, color, dash) =>
      place(
        namedBox(name, { width: region.width * 0.72, height: 57, size: 32, color, dash }),
        region,
      );
    return {
      name: caption('Worker ' + w, cols(heads)[w + 1], { size: 34 }),
      empty: slot('Empty', 'dim', true),
      full: slot('Guide G', 'blue', false),
    };
  });
  const mode = (name) => caption(name, cols(heads)[0], { size: 33, color: 'yellow' });
  const round = mode('Round robin'),
    replay = mode('Affinity replay');
  const paths = requests.map((band, i) => {
    const cells = cols(band);
    const start = cells[0].point('right');
    const places = cells.slice(1).map((r) => r.point('center'));
    const sockets = places.map((p) =>
      circle(25, { stroke: 'dim', fill: 'transparent', width: 3 }).moveTo(p),
    );
    const arrival = () => dot(17, 'cyan').moveTo(start);
    return {
      name: caption('R' + (i + 1), cells[0], { size: 35 }),
      round: arrival(),
      replay: arrival(),
      sockets,
      places,
    };
  });
  const firstFour = paths.slice(0, 4);
  const send = (i, run, w, color) =>
    to(paths[i][run], (n) => n.moveTo(paths[i].places[w]).fill(color), { duration: 0.48 });
  s.add(
    round,
    workers.slice(0, 3).flatMap((w) => [w.name, w.empty]),
    firstFour.flatMap((p) => [p.name, p.round, ...p.sockets.slice(0, 3)]),
  );
  [0, 1, 2].forEach((w) => {
    c.on('route-round', () => s.play(send(w, 'round', w, 'blue')), w * 0.82);
    c.swap('route-round', workers[w].empty, workers[w].full, {
      lead: -(w * 0.82 + 0.48),
      fade: 0.12,
    });
  });
  c.on('route-hit', () => s.play(send(3, 'round', 0, 'green')));
  c.swap(
    'route-affinity',
    [round, ...firstFour.map((p) => p.round), ...workers.slice(0, 3).map((w) => w.full)],
    [replay, ...firstFour.map((p) => p.replay), ...workers.slice(0, 3).map((w) => w.empty)],
  );
  firstFour.forEach((_, i) =>
    c.on(
      'route-affinity',
      () => s.play(send(i, 'replay', 0, i ? 'green' : 'blue')),
      0.8 + i * 1.08,
    ),
  );
  c.swap('route-affinity', workers[0].empty, workers[0].full, { lead: -1.28, fade: 0.12 });
  const fifth = paths[4];
  const full = caption('At capacity', cols(slots)[0], {
    size: 34,
    color: 'yellow',
    align: 'right',
  });
  c.show('route-overload', [fifth.name, fifth.replay, ...fifth.sockets.slice(0, 3), full]);
  c.on('route-overload', () => s.play(send(4, 'replay', 0, 'yellow')), 0.4);
  c.on('route-spill', () => s.play(send(4, 'replay', 1, 'blue')));
  c.swap('route-spill', workers[1].empty, workers[1].full, { lead: -0.5, fade: 0.14 });
  c.show('route-new', [workers[3].name, workers[3].empty, ...paths.map((p) => p.sockets[3])]);
  readings(s, c, 'Each column starts with an empty local cache.', [
    ['route-round', 'Blue marks a first write at a worker.', 'blue', 'route-affinity'],
    ['route-affinity', 'Replay the same four requests on worker 0.'],
    ['route-tally', 'Worker 0 · one write, three local reads', 'green'],
    ['route-scope', 'Affinity key = verified scope + stable prefix identity'],
    ['route-inventory', 'The routing index tracks which worker holds G.'],
    ['route-spill', 'R5 finds worker 0 full and writes G at worker 1.', 'blue'],
    ['route-transfer', 'Compare queue time, uncached prefill, and transfer.'],
    ['route-new', 'Worker 3 starts empty.', 'blue'],
  ]);
}
