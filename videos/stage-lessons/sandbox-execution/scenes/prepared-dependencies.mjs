// A pinned package moves from the index to the builder. The lockfile check identifies the bytes that enter the cache and the worker mounts the package read-only.
import {
  arrow,
  assertEqual,
  beside,
  boxOf,
  column,
  dot,
  fadeIn,
  fadeOut,
  indicate,
  moveTo,
  place,
  seq,
} from 'vizmatic/stage';
import { createHash } from 'node:crypto';
import { area, chip, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { COLOR, WORKER, wall } from '../parts.mjs';

const expected = '4dcd7efeab63e7e04b4519b5d817fb0dbf70e714e40843340ca890db60faae03';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const short = (hash) => `sha256 ${hash.slice(0, 8)}…`;
const wrongBytes = 'schema v3\n';
const pinnedBytes = 'schema v2\n';

export default function preparedDependencies(s, c) {
  assertEqual(
    [wrongBytes, pinnedBytes].map((value) => sha256(value) === expected),
    [false, true],
    'the lockfile pins the bytes of schema v2 including its newline',
  );
  // The frame: the line of four places, and the detail under it.
  const [lineBand, detail] = area.rows([4, 5], 'normal');
  const [indexBox, toBuilder, builderBox, toCache, cacheBox, toWorker, workerBox] = lineBand
    .inset('none', 'tight')
    .columns([3, 2.4, 5, 1, 3, 2.4, 5], 'none');
  const inner = (box) => box.inset('normal', 36);
  const paint = (name, color, options = {}) => chip(name, { color, stroke: color, ...options });
  const mid = lineBand.cy;

  const index = place(
    namedBox('package index', { width: indexBox.width, height: 130, color: COLOR.quiet }),
    indexBox,
  );
  const cache = place(
    namedBox('approved cache', { width: cacheBox.width, height: 130, color: COLOR.host }),
    cacheBox,
  );
  const builder = wall(builderBox, 'builder');
  const worker = wall(workerBox, WORKER);
  const scripts = place(paint('install scripts', COLOR.candidate), inner(builderBox), 'top left');
  const candidate = place(paint('parse.py', COLOR.candidate), inner(workerBox), 'top left');
  const way = (box) =>
    arrow([box.left, mid], [box.right, mid], { stroke: COLOR.evidence, width: 5, pad: 12 });
  const ways = [way(toBuilder), way(toCache), way(toWorker)];
  const egress = beside(note('limited egress', { color: COLOR.host }), ways[0], 'above', 'tight');
  const readOnly = beside(note('read-only', { color: COLOR.host }), ways[2], 'above', 'tight');
  const offline = place(note('network: closed', { color: COLOR.host }), inner(workerBox), 'right');

  // The package at each place of the line. A carrier takes it from one place to the next.
  const contents = (bytes) => bytes.replace('\n', ' ↵');
  const arrived = paint(contents(pinnedBytes), COLOR.evidence, { font: 'mono' });
  place(arrived, inner(builderBox), 'bottom left');
  const wrong = place(
    paint(contents(wrongBytes), COLOR.evidence, { font: 'mono' }),
    boxOf(arrived),
  );
  const cached = beside(
    paint('schema v2', COLOR.evidence, { font: 'mono' }),
    cache,
    'under',
    'normal',
  );
  const mounted = place(
    paint('schema v2', COLOR.evidence, { font: 'mono' }),
    inner(workerBox),
    'bottom left',
  );
  const carrier = dot(11, COLOR.evidence).moveTo([indexBox.right + 16, mid]);
  const hop = (x, duration = 0.9) => moveTo(carrier, [x, mid], { duration });

  const [lockBox, meaningBox, keptBox] = detail.columns([7, 5, 5], 'wide');
  const lockTitle = note('Trusted lockfile', { color: COLOR.host });
  const pin = mono(short(expected), { size: 42, color: COLOR.host });
  const received = note('Downloaded file', { color: COLOR.evidence });
  const wrongHash = mono(short(sha256(wrongBytes)), { size: 42, color: COLOR.evidence });
  place(
    column([lockTitle, pin, received, wrongHash], { gap: 'normal', align: 'left' }),
    lockBox,
    'left',
  );
  const arrivedHash = place(
    mono(short(sha256(pinnedBytes)), { size: 42, color: COLOR.evidence }),
    boxOf(wrongHash),
    'left',
  );
  const keptTitle = note('kept out of the builder');
  const kept = ['production secrets', 'internal network'].map((name) => paint(name, COLOR.fail));
  place(column([keptTitle, ...kept], { gap: 'normal' }), keptBox, 'left');
  const question = place(
    label('Admit this copy?', { size: 40, color: COLOR.mark }),
    meaningBox,
    'left',
  );
  const hold = place(
    label('Reject schema v3', { size: 40, color: COLOR.fail }),
    meaningBox,
    'left',
  );
  const match = place(
    label('Schema v2 matches', { size: 40, color: COLOR.pass }),
    meaningBox,
    'left',
  );

  s.add(
    heading(c.title),
    index,
    cache,
    builder,
    worker,
    scripts,
    candidate,
    ...ways,
    lockTitle,
    pin,
  );

  c.show('pd-fetch', carrier);
  c.on('pd-fetch', () => s.play(hop(builderBox.left + 40, 1.4)));
  c.show('pd-egress', egress);
  c.show('pd-hash', [wrong, received, wrongHash]);
  c.hide('pd-hash', carrier);
  c.on('pd-hash', () =>
    s.play(
      indicate(wrongHash, { color: COLOR.mark, duration: 1.6 }),
      indicate(pin, { color: COLOR.mark, duration: 1.6 }),
    ),
  );
  c.show('pd-decide', question);
  c.swap('pd-hold', question, hold, { after: true });
  c.swap('pd-retry', [hold, wrong, wrongHash], [arrived, arrivedHash]);
  c.show('pd-match', match, { after: true });
  c.on('pd-untrusted', () => s.play(indicate(scripts, { color: COLOR.fail, duration: 1.4 })));
  c.show('pd-secrets', [keptTitle, kept[0]]);
  c.show('pd-internal', kept[1]);
  const fromBuilder = dot(11, COLOR.evidence).moveTo([builderBox.right - 30, mid]);
  c.on('pd-offline', () =>
    s.play(
      seq(
        fadeIn(fromBuilder, { duration: 0.2 }),
        moveTo(fromBuilder, [cacheBox.left, mid], { duration: 0.6 }),
        fadeOut(fromBuilder, { duration: 0.2 }),
        fadeIn(cached, { duration: 0.3 }),
      ),
    ),
  );
  c.show('pd-offline', offline, { after: true });
  c.show('pd-mount', [readOnly, mounted]);
}
