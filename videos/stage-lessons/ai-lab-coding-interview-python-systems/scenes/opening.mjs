import { boxOf, codeBlock, linear, place, to } from 'vizmatic/stage';
import { chip, heading, label, mono } from '../../kit-narrated.mjs';
import { BOARD, FOOT } from '../parts.mjs';

export default function scene(s, c) {
  const [debuggerArea, watches] = BOARD.rows([3, 1], 'wide');
  const [workerArea, codeArea] = debuggerArea.columns([4, 6], 'normal');
  const listing = place(
    codeBlock('url = "/guide"\nif url not in seen:\n    fetch(url)\n    seen.add(url)', {
      language: 'python',
      size: 62,
      leading: 1.75,
      panel: true,
    }),
    codeArea,
  );
  const lineY = (i) => boxOf(listing.line(i)).cy;
  const workers = workerArea.columns(2, 'tight');
  const marker = (name, color, lane) =>
    chip(name, { size: 48, round: true, color: 'bg', fill: color, stroke: color }).moveTo([
      lane.cx,
      lineY(0),
    ]);
  const a = marker('Worker A', 'blue', workers[0]);
  const b = marker('Worker B', 'cyan', workers[1]);
  const step = (who, lane, i, duration = 0.55) =>
    to(who, (node) => node.moveTo([lane.cx, lineY(i)]), { duration, ease: linear });

  const [setArea, logArea] = watches.columns([4, 6], 'normal');
  const watch = (area, name, color, values) => {
    const [header, value] = area.rows([1, 1.4], 'tight');
    return {
      name: place(label(name, { size: 38 }), header),
      values: values.map((str) => place(mono(str, { color, size: 52 }), value)),
    };
  };
  const seen = watch(setArea, 'seen', 'yellow', ['set()', '{"/guide"}']);
  const calls = watch(logArea, 'Fetch log', 'cyan', ['[]', '["/guide"]', '["/guide", "/guide"]']);
  const picture = [
    heading(c.title),
    listing,
    a,
    b,
    seen.name,
    seen.values[0],
    calls.name,
    calls.values[0],
  ];
  s.add(picture);
  for (const node of picture) node.opacity(1);
  s.play(step(a, workers[0], 1, 0.9));
  c.on('opening-check', () => s.play(listing.focus(1, { duration: 0.35 })));
  c.on('opening-pause', () => s.play(step(a, workers[0], 2), listing.focus(2, { duration: 0.4 })));
  c.on('opening-b', () => s.play(step(b, workers[1], 1), listing.focus(1, { duration: 0.4 })));
  c.after('opening-b', () => s.play(step(b, workers[1], 2)));
  c.on('opening-a', () => s.play(listing.focus(2, { duration: 0.35 })));
  const paused = place(label('Both paused before fetch', { color: 'yellow' }), FOOT);
  c.show('opening-question', paused);
  c.hide('opening-fetch-a', paused);
  c.on('opening-fetch-a', () => s.play(listing.focus(2, { duration: 0.35 })));
  c.swap('opening-fetch-a', calls.values[0], calls.values[1], { after: true });
  c.swap('opening-fetch-b', calls.values[1], calls.values[2], { after: true });
  c.on('opening-record', () =>
    s.play(step(a, workers[0], 3), listing.focus(3, { duration: 0.35 })),
  );
  c.swap('opening-record', seen.values[0], seen.values[1], { after: true });
  c.on('opening-add-b', () => s.play(step(b, workers[1], 3)));
}
