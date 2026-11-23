import {
  appear,
  arrow,
  assertEqual,
  boxOf,
  codeBlock,
  column,
  dot,
  draw,
  dynamic,
  fade,
  fadeOut,
  graph,
  grid,
  indicate,
  lanes,
  line,
  morphCode,
  place,
  recolor,
  rect,
  row,
  seq,
  table,
  to,
} from 'vizmatic/stage';
import { chip, display, heading, label, mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import {
  BOARD,
  COLOR,
  context,
  racePicture,
  storePicture,
  schedulePicture,
  bucketPicture,
  ledgerPicture,
  workloadPicture,
  CRAWL,
  LEDGER,
  BUCKET,
  SCHEDULE_RETRY,
  SCHEDULE_BLOCKED,
  expiryState,
  parserTrace,
  mixedWorkSchedule,
} from '../parts.mjs';

export default function scene(s, c) {
  context(s, c);
  const [left, right] = BOARD.columns([8, 5], 'wide');
  const [candidatesArea, transferArea, claimsArea] = left.rows([4, 1, 3], 'normal');
  const [startArea, aliasesArea, changedArea] = candidatesArea.rows([1, 2, 1], 'normal');
  const start = place(note('Start: https://repo.example/start'), startArea);
  const aliases = ['https://REPO.example:443/api?q=1#auth', 'https://repo.example/api?q=1#usage'];
  const urls = aliases.map((url) => mono(url, { size: 34, color: 'cyan' }));
  place(column(urls, { gap: 'wide' }), aliasesArea);
  const planned = place(note('Changed query: another identity?'), changedArea);
  const changed = place(
    mono('https://repo.example/api?q=2', { size: 34, color: 'cyan' }),
    changedArea,
  );
  const claims = place(
    table(
      [{ key: 'identity', label: 'claim identity', sample: 'https://repo.example/api?q=1' }],
      [
        { id: 'shared', identity: null },
        { id: 'query', identity: null },
      ],
      {
        width: claimsArea.width,
        size: 34,
        maxRows: 2,
        leading: 2.4,
      },
    ),
    claimsArea,
  );
  const aliasDots = [-1, 1].map((side) =>
    dot(10, 'cyan').moveTo([transferArea.cx + (side * transferArea.width) / 4, transferArea.top]),
  );
  const queryDot = dot(10, 'cyan').moveTo(transferArea.point('top'));
  const join = [claimsArea.cx, boxOf(claims).top - 22];
  const [originArea, policyArea] = right.rows([1, 1], 'wide');
  const origin = place(
    table(
      [
        { key: 'start', label: 'start origin', sample: 'repo.example' },
        { key: 'candidate', sample: 'REPO.example' },
      ],
      [
        { id: 'scheme', start: 'https', candidate: 'https' },
        { id: 'host', start: 'repo.example', candidate: 'REPO.example' },
        { id: 'port', start: '443', candidate: '443' },
      ],
      { width: originArea.width, size: 34, maxRows: 3, leading: 2.2 },
    ),
    originArea,
  );
  const policy = place(
    table(
      [
        { key: 'input', sample: 'DNS / redirect' },
        { key: 'result', sample: 'outside scope', marks: true },
      ],
      [
        { id: 'origin', input: 'origin', result: null },
        { id: 'invalid', input: 'bad port', result: null },
        { id: 'foreign', input: 'other origin', result: null },
        { id: 'network', input: 'DNS / redirect', result: null },
      ],
      { width: policyArea.width, size: 34, maxRows: 4, leading: 2.0 },
    ),
    policyArea,
  );
  s.add(start, urls, planned, claims, origin, policy);
  c.on('ci-url-policy-0-build', () => s.play(indicate(origin, { scale: 1, duration: 0.35 })));
  c.on('url-origin', () =>
    s.play(origin.setCell('host', 'candidate', 'repo.example', { duration: 0.4 })),
  );
  c.after('url-origin', () =>
    s.play(
      policy.setCell('origin', 'result', { value: 'match', state: 'pass' }, { duration: 0.35 }),
    ),
  );
  c.on('url-strip', () => s.play(...urls.map((node) => recolor(node, 'dim', { duration: 0.3 }))));
  c.show('url-strip', aliasDots);
  c.on(
    'url-strip',
    () => s.play(...aliasDots.map((node) => to(node, (n) => n.moveTo(join), { duration: 0.9 }))),
    0.35,
  );
  c.on('url-strip', () => s.play(fadeOut(aliasDots, { duration: 0.15 })), 1.3);
  c.after('url-strip', () =>
    s.play(
      claims.setCell('shared', 'identity', 'https://repo.example/api?q=1', { duration: 0.35 }),
    ),
  );
  c.on('url-query', () => s.play(claims.light('shared', undefined, { duration: 0.4 })));
  c.swap('url-changed-query', planned, changed);
  c.show('url-changed-query', queryDot);
  c.on(
    'url-changed-query',
    () => s.play(to(queryDot, (n) => n.moveTo(join), { duration: 0.7 })),
    0.35,
  );
  c.on('url-changed-query', () => s.play(fadeOut(queryDot, { duration: 0.15 })), 1.1);
  c.after('url-changed-query', () =>
    s.play(claims.setCell('query', 'identity', 'https://repo.example/api?q=2', { duration: 0.35 })),
  );
  c.on('ci-url-policy-1-build', () => s.play(indicate(policy, { scale: 1, duration: 0.35 })));
  c.on('url-invalid', () =>
    s.play(
      policy.setCell('invalid', 'result', { value: 'reject', state: 'fail' }, { duration: 0.4 }),
    ),
  );
  c.after('url-foreign', () =>
    s.play(
      policy.setCell('foreign', 'result', 'skip', { duration: 0.4 }),
    ),
  );
  c.on('ci-url-policy-2-build', () => s.play(indicate(policy, { scale: 1, duration: 0.35 })));
  c.on('url-network', () =>
    s.play(policy.setCell('network', 'result', 'check address', { duration: 0.4 })),
  );
}
