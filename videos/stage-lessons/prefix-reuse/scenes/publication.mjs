import { arrow, assertEqual, circle, dot, draw, line, to } from 'vizmatic/stage';
import { mono, note } from '../../kit-narrated.mjs';
import { board, body, caption, fmt, foot, guide, ledger, pointAt } from '../parts.mjs';

export default function publication(s, c) {
  const prefix = Array(guide).fill(7);
  const [r1, r2] = ledger.rows.map((r, i) => [...prefix, ...Array(r.tail).fill(11 + i)]);
  const candidates = [r2.length, guide];
  const entries = new Set();
  const key = (tokens) => tokens.join(',');
  const lookup = () => candidates.find((end) => entries.has(key(r2.slice(0, end)))) ?? 0;
  const pending = lookup();
  entries.add(key(r1));
  const fullOnly = lookup();
  entries.add(key(prefix));
  const marked = lookup();
  assertEqual(pending, 0, 'An in-flight write has no entry in this cache.');
  assertEqual(fullOnly, 0, 'Neither candidate has the completed first request as its prefix.');
  assertEqual(marked, guide, 'A record at the guide boundary serves the second request.');

  board(s, c, 'Which endpoint did the worker store?', 'Exact-endpoint cache · enlarged question tails');
  const [first, receipts, second] = body.rows(3, 'wide');
  const [names, axis] = body.columns([1, 4.8], 'wide');
  const left = axis.left + 15;
  const join = axis.left + axis.width * 0.48;
  const end = axis.right - 82;
  const x = (n) => n <= guide
    ? left + (join - left) * n / guide
    : join + (end - join) * (n - guide) / (r1.length - guide);
  const name = (label, band) => note(label, { size: 38, color: 'ink' }).moveTo([names.cx, band.cy]);
  const range = (from, until, y, color, width) =>
    line([x(from), y], [x(until), y], { stroke: color, width });
  const tag = (text, n, y, color) => mono(text, { size: 34, color }).moveTo([x(n), y]);
  const request = (band, tokens) => {
    const y = band.cy;
    const joinTick = line([join, y - 16], [join, y + 16], { stroke: 'ink', width: 4 });
    const label = note('Shared guide', { size: 34, color: 'blue' }).moveTo([(left + join) / 2, y - 39]);
    const question = note((tokens.length - guide) + '-token question', { size: 32, color: 'pink' })
      .moveTo([(join + x(tokens.length)) / 2, y - 39]);
    return {
      front: [range(0, guide, y, 'blue', 11), joinTick, label],
      tail: [range(guide, tokens.length, y, 'pink', 11), dot(8, 'pink').moveTo([x(tokens.length), y]), question],
    };
  };
  const a = request(first, r1);
  const b = request(second, r2);
  const y = receipts.cy;
  const shelf = range(0, r1.length, y, 'dim', 3);
  const empty = (n) => circle(15, { stroke: 'dim', fill: 'bg', width: 3 }).moveTo([x(n), y]);
  const emptyGuide = empty(guide), emptyRequest = empty(r2.length);
  const filled = (n) => dot(15, 'blue').moveTo([x(n), y]);
  const fullReceipt = filled(r1.length), guideReceipt = filled(guide);
  const pen = circle(17, { stroke: 'yellow', fill: 'bg', width: 5 }).moveTo([left, y]);
  const stamp = (n) => tag(fmt(n), n, y - 48, 'ink');
  const pointer = (n, color) => arrow([x(n), second.cy - 16], [x(n), y + 29], {
    stroke: color, width: 4, pad: 0,
  });
  const probes = candidates.map((n) => pointer(n, 'yellow'));
  const hit = pointer(marked, 'green');
  const read = range(0, marked, second.cy, 'green', 12);
  const fresh = range(marked, r2.length, second.cy, 'cyan', 12);
  const state = (words, color) => caption(words, foot, { color, size: 42 });
  const initial = state('The worker starts with an empty cache.', 'dim');
  const inFlight = state('Write in progress', 'yellow');
  const cold = state('Early arrival   ·   ' + fmt(pending) + ' reused tokens', 'cyan');
  const query = state('Which lookup endpoint has an entry?', 'yellow');
  const miss = state('Completed write   ·   ' + fmt(fullOnly) + ' reused tokens', 'cyan');
  const repeat = state('Same request   ·   same two lookup endpoints', 'ink');
  const result = state(fmt(marked) + ' guide tokens reused   ·   ' + (r2.length - marked) + ' question tokens fresh', 'green');

  s.add(name('Request 1', first), a.front, name('Entries', receipts), shelf, initial);
  c.show('tail-zoom', a.tail);
  c.show('pending-write', pen);
  c.swap('pending-write', initial, inFlight);
  c.on('pending-write', () => s.play(to(pen, (n) => n.moveTo([join, y])), { duration: 1.1 }));
  c.show('early-arrival', [name('Request 2', second), b.front, b.tail]);
  c.swap('early-miss', inFlight, cold, { after: true });
  c.on('publish-full', () => s.play(to(pen, (n) => n.moveTo([end, y])), {
    duration: c.cue('publish-full').end - c.cue('publish-full').start,
  }));
  c.swap('publish-full', [pen, cold], [fullReceipt, stamp(r1.length)], { after: true, lead: 0 });
  c.show('find-candidates', [emptyGuide, emptyRequest]);
  c.show('try-request', [probes[0], stamp(r2.length)]);
  c.show('try-guide', [probes[1], stamp(guide)]);
  c.show('predict-entry', query);
  c.swap('no-entry', query, miss, { after: true, lead: 0 });
  c.on('full-receipt', () => s.play(pointAt(fullReceipt)));
  c.on('absent-guide', () => s.play(pointAt(emptyGuide)));
  c.swap('reset-lookup', [probes, miss], repeat);
  c.swap('write-guide', emptyGuide, guideReceipt, { after: true, lead: 0 });
  c.show('repeat-lookup', probes[0]);
  c.show('repeat-lookup', probes[1], { lead: -0.5 });
  c.swap('available-guide', probes, hit, { after: true, lead: 0 });
  c.after('available-guide', () => s.play(draw(read), { duration: 0.5 }));
  c.after('tail-only', () => s.play(draw(fresh), { duration: 0.3 }));
  c.swap('tail-only', repeat, result, { after: true, lead: 0 });
}
