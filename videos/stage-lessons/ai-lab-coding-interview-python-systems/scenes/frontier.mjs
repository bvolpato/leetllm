import { assertEqual, place, rect } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import { BOARD, FOOT, CRAWL, context } from '../parts.mjs';

export default function scene(s, c) {
  context(s, c);
  const [callback, queueArea, seenArea, fetchedArea] = BOARD.rows([1.2, 1, 1, 1], 'normal');
  const paths = (urls) => urls.map((url) => new URL(url).pathname);
  function strip(area, title, color) {
    const [name, values] = area.columns([1, 3.6], 'normal');
    const frame = place(
      rect(values.width, 112, { fill: null, stroke: 'grid', width: 3, radius: 12 }),
      values,
    );
    s.add(place(label(title, { size: 40, color }), name), frame);
    return (value) => place(mono(value, { size: 44, color }), values);
  }
  const queue = strip(queueArea, 'Queue front →', 'cyan');
  const seen = strip(seenArea, 'Claimed set', 'yellow');
  const fetched = strip(fetchedArea, 'Fetch calls', 'ink');
  const activity = (rec) => [
    queue(paths(rec.queue).join('    ') || 'empty'),
    fetched(paths(rec.order).join('  →  ') || 'none'),
  ];
  const states = CRAWL.snapshots.map(activity);
  const claims = CRAWL.snapshots.slice(0, 3).map((rec) => seen('{ ' + paths(rec.seen).join(', ') + ' }'));
  const inStart = activity({
    ...CRAWL.snapshots[0],
    queue: [],
    order: [CRAWL.snapshots[0].queue[0]],
  });
  assertEqual(paths(CRAWL.order).join(' '), '/start /guide /api /faq', 'FIFO fixture');
  const guideRead = CRAWL.snapshots[1];
  const inGuide = activity({
    ...guideRead,
    queue: guideRead.queue.slice(1),
    order: [...guideRead.order, guideRead.queue[0]],
  });
  const callbackLine = (str) => place(mono(str, { size: 38, color: 'blue' }), callback);
  const start = callbackLine('repo.example/start');
  const links = callbackLine('/guide      /api#auth      https://other.example/private');
  const guide = callbackLine('/guide returns    /api, /faq');
  const api = callbackLine('/api returns    /start');
  const faq = callbackLine('/faq returns    []');
  const prompt = place(label('Where does /faq go in the queue?', { color: 'yellow' }), FOOT);
  const dup = place(label('/api already has a place.', { color: 'yellow' }), FOOT);
  s.add(start, states[0], claims[0]);
  c.swap('frontier-links', [start, states[0]], [links, inStart]);
  c.swap('frontier-start', [inStart, claims[0]], [states[1], claims[1]], { after: true });
  c.swap('frontier-guide', [links, states[1]], [guide, inGuide], { after: true });
  c.show('frontier-dupe', dup, { after: true });
  c.swap('frontier-predict', dup, prompt);
  c.hide('frontier-faq', prompt);
  c.swap('frontier-faq', [inGuide, claims[1]], [states[2], claims[2]], { after: true });
  c.swap('frontier-api', [guide, states[2]], [api, states[3]], { after: true });
  c.swap('frontier-end', [api, states[3]], [faq, states[4]], { after: true });
}
