import assert from 'node:assert/strict';
import {
  reconcileChunks,
  snapshotAdmission,
  taskScopeCheck,
  secureEligibility,
  sourceRecord,
  reportAdmission,
} from '../../../films/secure-rag/arithmetic.mjs';
import { PRINCIPAL } from '../../../films/secure-rag/fixtures.mjs';
import { corpus } from './copies.mjs';
import {
  C,
  at,
  cue,
  text,
  sub,
  heading,
  rect,
  dot,
  line,
  curve,
  thread,
  sheet,
  source,
  section,
  seal,
  result,
  pair,
  rows,
  passColor,
} from './atelier.mjs';

const grantedPolicy = sourceRecord({ tenant: 'A', policy: 41, grant: 'operations' });
const withdrawnPolicy = { ...grantedPolicy, policy: 42, grant: null };

function chunkRead(chunk, sourcePolicy, checkRevision) {
  return (
    (!checkRevision || chunk.policy === sourcePolicy.policy) && secureEligibility(chunk, PRINCIPAL)
  );
}

export function lag(c, k) {
  const revoke = at(k, 0, 'removes the operations grant');
  const resolved = at(k, 1, 'Its grant matches');
  const guarding = at(k, 1, 'Hold stale chunks');
  const syncing = cue(k, 1, 'Apply revision forty-two', 3.6);
  const updated = Math.floor(syncing * 3);
  const owner = revoke ? withdrawnPolicy : grantedPolicy;
  heading(c, 'Which copy heard about the revocation?');
  sub(c, 'Tenant A   /   operations reader   /   three chunks of one document');
  sheet(c, 100, 307, 562, 312);
  text(c, 'Source policy', 136, 381, 49, C.ink, { face: 'Serif' });
  pair(
    c,
    'Authoritative revision',
    'v' + owner.policy + '   /   ' + (owner.grant ?? 'no grant'),
    136,
    464,
    483,
    revoke ? C.red : C.green,
  );
  for (let i = 0; i < 3; i++) {
    const y = 271 + i * 162,
      done = i < updated;
    const chunk = done ? withdrawnPolicy : grantedPolicy;
    const stale = chunk.policy !== owner.policy;
    curve(c, 663, 464, 1030, y + 62, done ? C.green : C.rule, 5);
    sheet(c, 1031, y, 747, 125);
    text(c, 'Chunk ' + (i + 1), 1060, y + 54, 41, C.ink, { weight: 600 });
    text(
      c,
      'v' + chunk.policy + '   /   ' + (chunk.grant ?? 'no grant'),
      1331,
      y + 55,
      38,
      done ? C.blue : revoke ? C.red : C.green,
    );
    let status = stale ? 'Behind the source' : 'Current';
    if (resolved) {
      const allowed = chunkRead(chunk, owner, guarding);
      if (guarding) {
        status = stale ? 'Read held · revision mismatch' : (allowed ? 'Read allowed' : 'Read denied') + ' · current policy';
      } else {
        status = allowed ? 'Chunk alone would allow the read' : 'Chunk alone would deny the read';
      }
    }
    text(c, status, 1060, y + 99, 27, C.muted);
  }
  let footer = 'The three chunks match their source.';
  if (revoke) footer = 'If the store checks only a chunk, can this operations reader still read it?';
  if (resolved) footer = 'Revision 41 still grants the read. The owner withdrew that grant at revision 42.';
  if (guarding) footer = 'Compare each chunk with the source. Hold any read that uses a stale revision.';
  if (updated === 3) footer = 'All three copies now enforce the owner’s withdrawal.';
  if (k.beat.beatIndex === 2) footer = 'Measure source change to blocked read, including caches and derived copies.';
  result(c, footer);
}
const initial = ['A', 'B'].flatMap((t) =>
  [0, 1].map((i) => ({
    tenant: t,
    id: 'key/' + i,
    revision: 1,
    groups: [t === 'A' ? 'security' : 'operations'],
    deleted: false,
  })),
);
function replaySteps() {
  let state = initial;
  return [
    [1, ['security'], false],
    [2, [], false],
    [1, ['security'], false],
    [2, [], false],
    [3, [], true],
    [4, ['security'], false],
  ].map(([rev, groups, del], i) => {
    const next = i ? reconcileChunks(state, 'A', rev, groups, del) : { rows: state, updated: 0 };
    state = next.rows;
    return next;
  });
}
const replays = replaySteps();
export function sync(c, k) {
  const phase = at(k, 3, 'newer revision-four grant')
    ? 5
    : at(k, 2, 'Deletion revision three')
      ? 4
      : at(k, 2, 'Repeating revision two')
        ? 3
        : at(k, 2, 'Replaying the old')
          ? 2
          : at(k, 1, 'Reconciliation reads')
            ? 1
            : 0;
  const current = replays[phase];
  const sourceRev =
    phase === 5 ? 4 : phase === 4 ? 3 : phase || at(k, 0, 'at revision two') ? 2 : 1;
  heading(c, 'Can an older grant restore these chunks?');
  sub(c, 'Signing-key runbook   /   same document name in two tenants');
  section(c, 'Tenant A     Source policy v' + sourceRev, 100, 278, 809);
  section(c, 'Tenant B     Source policy v1', 1005, 278, 809);
  current.rows.forEach((r, i) => {
    const x = i < 2 ? 101 : 1007,
      y = 329 + (i % 2) * 170;
    sheet(c, x, y, 806, 136, r.deleted ? '#e0c6be' : r.groups.length ? '#e4ebe0' : '#ecdbd1');
    rect(
      c,
      x + 592,
      y + 2,
      212,
      132,
      r.deleted ? C.red : r.groups.length ? C.green : C.gold,
      null,
      3,
    );
    text(c, 'Policy', x + 697, y + 44, 28, '#fff9ec', { align: 'center' });
    text(c, 'v' + r.revision, x + 697, y + 106, 54, '#fff9ec', { align: 'center', weight: 600 });
    text(c, r.tenant + ' / ' + r.id, x + 29, y + 50, 42, C.ink, { weight: 600 });
    text(
      c,
      'v' + r.revision + '    ' + (r.deleted ? 'deleted' : r.groups.join(', ') || 'no groups'),
      x + 29,
      y + 109,
      37,
      r.deleted || !r.groups.length ? C.red : C.green,
    );
  });
  const event = [
    'Waiting for the missing update',
    'Reconcile source revision 2',
    'Replay old revision 1',
    'Repeat revision 2',
    'Apply deletion revision 3',
    'Apply supplied restoration revision 4',
  ][phase];
  text(c, event, 103, 767, 45, C.blue, { face: 'Serif' });
  result(
    c,
    phase
      ? current.updated +
          ' chunks changed. ' +
          (phase === 5
            ? 'The local helper accepts restoration. Production needs a restoration policy.'
            : 'Tenant B keeps both original grants.')
      : 'The event can be lost. Compare each stored revision with its source.',
  );
}
export function freshness(c, k) {
  const b = k.beat.beatIndex;
  const version = b
    ? 42
    : at(k, 0, 'newer version forty-three')
      ? 43
      : at(k, 0, 'version forty-one')
        ? 41
        : 42;
  const age = b
    ? at(k, 1, 'A future fetch time')
      ? -1
      : at(k, 1, 'Six minutes fails')
        ? 360
        : at(k, 1, 'Exactly five minutes')
          ? 300
          : 0
    : 0;
  const decision = snapshotAdmission({ version, fetched: 1200 - age }, 42, 1200, 300);
  heading(c, 'Is this policy snapshot usable?');
  sub(c, 'Trusted policy requires v42     •     maximum age 300 seconds, inclusive');
  pair(c, 'Fetched policy', 'v' + version, 102, 319, 536, version === 42 ? C.green : C.red);
  pair(
    c,
    'Authoritative fetch age',
    age + (Math.abs(age) === 1 ? ' second' : ' seconds'),
    702,
    319,
    550,
    passColor(age >= 0 && age <= 300),
  );
  seal(
    c,
    decision.allowed ? 'Snapshot passes' : 'Hold this snapshot',
    1364,
    332,
    passColor(decision.allowed),
  );
  const x = (v) => 217 + (v + 35) * 3.5,
    y = 595;
  line(c, x(-35), y, x(390), y, C.rule, 8);
  line(c, x(0), y, x(300), y, C.green, 18);
  [-1, 0, 150, 300, 360].forEach((v) => {
    line(c, x(v), y - 23, x(v), y + 23, C.ink, 3);
    if (v >= 0) text(c, v + ' s', x(v), y + 76, 35, C.ink, { align: 'center' });
  });
  dot(c, x(age), y, 18, decision.allowed ? C.blue : C.red);
  text(c, 'Age ' + age + ' s', x(age), y - 55, 40, C.ink, { align: 'center', weight: 600 });
  result(
    c,
    b === 2
      ? 'A token can outlive a group membership. Measure detection, queue, replica and cache delay.'
      : 'Require exact version equality and 0 ≤ age ≤ 300 seconds.',
  );
}
export function children(c, k) {
  heading(c, 'Which tenant owns this copy?');
  if (k.beat.beatIndex === 0) sub(c, 'The same title appears in two customers’ collections.');
  if (k.beat.beatIndex > 0)
    sub(c, 'Reader in tenant A   /   verified operations group   /   policy 42');
  ['Document', 'Child chunk', 'Derived report'].forEach((s, i) =>
    section(c, s, 102 + i * 611, 288, 493),
  );
  ['A', 'B'].forEach((t, i) => {
    const y = 365 + i * 217;
    source(c, 'checklist', t + ' / checklist', 101, y, 478);
    const showChild = at(k, 0, 'preserve the same scope');
    if (showChild) {
      thread(c, 579, y + 59, 710, y + 59, C.blue, cue(k, 0, 'preserve the same scope', 0.7));
      sheet(c, 713, y, 491, 110);
      text(c, t + ' / checklist / 0', 735, y + 68, 42, C.ink, { face: 'Mono', max: 442 });
    }
    if (at(k, 2, 'Graphs and summaries')) {
      thread(c, 1204, y + 59, 1323, y + 59, i ? C.red : C.green, 1);
      source(c, 'Report', t + ' / incident summary', 1324, y, 477);
      const local = [{ ...corpus[0], tenant: t }];
      const ok = reportAdmission(local, local, PRINCIPAL);
      seal(c, ok ? 'Eligible report' : 'Other tenant', 1335, y + 124, passColor(ok));
    }
  });
  result(
    c,
    k.beat.beatIndex === 2
      ? 'A report needs a separate check on its tenant, sources and revisions.'
      : 'Carry the trusted tenant, revision and live read decision down the chain.',
  );
}
const tenantPages = [
  ['A', 'Escalation', 'operations'],
  ['A', 'Rotation', 'security'],
  ['B', 'Escalation', 'operations'],
];
function routed(t) {
  return t === PRINCIPAL.tenant
    ? tenantPages.filter(([tenant, , group]) => tenant === t && PRINCIPAL.groups.includes(group))
    : [];
}
export function layouts(c, k) {
  const foreign = at(k, 1, 'Now suppose the request names tenant B'),
    empty = at(k, 1, 'missing or empty tenant');
  const requested = empty ? '' : foreign ? 'B' : 'A',
    show = at(k, 1, 'Only A');
  heading(
    c,
    k.beat.beatIndex === 2 ? 'What does each tenant own?' : 'Which page can this reader open?',
  );
  sub(
    c,
    k.beat.beatIndex === 2
      ? 'Same two tenants and source permissions. Compare the storage boundary.'
      : 'Verified scope     A / operations     •     Requested tenant     ' +
          (requested || '(empty)'),
  );
  if (k.beat.beatIndex === 2) {
    section(c, 'Separate collections in one cluster', 100, 286, 814);
    section(c, 'Dedicated infrastructure', 1007, 286, 802);
    rect(c, 100, 331, 810, 317, '#c7d0c9', '#84928b', 20);
    ['A', 'B'].forEach((tenant, i) => {
      const x = 129 + i * 385;
      sheet(c, x, 385, 348, 160);
      text(c, 'Collection ' + tenant, x + 24, 477, 43, C.ink, { face: 'Serif' });
      rect(c, 1010 + i * 416, 331, 380, 317, '#ced3d7', '#879197', 18);
      sheet(c, 1035 + i * 416, 385, 331, 160);
      text(c, 'Tenant ' + tenant, 1060 + i * 416, 477, 45, C.ink, { face: 'Serif' });
    });
    result(
      c,
      'Both layouts still require document grants. Dedicated clusters also separate infrastructure.',
    );
    return;
  }
  ['A', 'B'].forEach((t, i) => {
    const x = 102 + i * 879;
    rect(c, x, 281, 831, 464, i ? '#dcd9d1' : '#e2e6de', '#b0ac9c', 12);
    text(c, 'Tenant ' + t, x + 34, 355, 50, C.ink, { face: 'Serif' });
    tenantPages
      .filter(([tenant]) => tenant === t)
      .forEach((r, j) => {
        const y = 390 + j * 143;
        source(c, r[1], r[2] + ' group', x + 35, y, 475);
        if (show) {
          const ok = routed(requested).includes(r);
          seal(
            c,
            !requested || foreign ? 'No search' : ok ? 'Open' : 'Held',
            x + 538,
            y + 35,
            ok ? C.green : C.muted,
          );
        }
      });
  });
  result(
    c,
    k.beat.beatIndex === 2
      ? 'Namespaces, shared filters and dedicated clusters still need document grants.'
      : foreign
        ? 'Tenant mismatch or missing scope stops the query before lookup.'
        : 'A tenant route narrows the store. Each page still needs a grant.',
  );
}
const mira = { ...PRINCIPAL, id: 'Mira', roles: ['analyst'] };
const jo = { ...PRINCIPAL, id: 'Jo', roles: ['analyst'], groups: ['security'] };
const rewriteSources = [
  sourceRecord({ id: 'note', title: 'Shift note', owner: mira.id, tenant: 'A', revision: 1, policy: 42 }),
  corpus.find(r => r.id === 'FAQ'),
  sourceRecord({ id: 'memo', title: 'Review memo', users: [jo.id], tenant: 'A', revision: 2, policy: 42 }),
  corpus.find(r => r.id === 'key'),
];
const cachedKey = rewriteSources[3];
const savedRewrite = {
  reader: jo.id, tenant: jo.tenant, query: 'Rotate the key?', technique: 'rewrite', model: 'M1',
  policy: cachedKey.policy, sources: [{ tenant: cachedKey.tenant, id: cachedKey.id, revision: cachedKey.revision }],
};
const afterKeyWithdrawal = rewriteSources.map(row =>
  row.id === cachedKey.id ? { ...row, policy: 43, grant: null } : row,
);

function cacheDecision(reader, sources) {
  const sameReader = reader.tenant === savedRewrite.tenant && reader.id === savedRewrite.reader;
  const live = sources.find(row => row.id === cachedKey.id && row.tenant === savedRewrite.tenant);
  const sourcesPass = reportAdmission(savedRewrite.sources, sources, reader);
  return { sameReader, sourcesPass, reuse: sameReader && live?.policy === savedRewrite.policy && sourcesPass };
}

function grantLabel(row) {
  if (row.owner) return 'Owner: ' + row.owner;
  if (row.users) return 'Named user: ' + row.users.join(', ');
  return row.grant ? 'Group: ' + row.grant : 'Group grant withdrawn';
}

function compareReaders(c, k) {
  const nextRequest = k.beat.beatIndex === 3;
  const revoked = at(k, 3, 'withdraws the security');
  const sources = revoked ? afterKeyWithdrawal : rewriteSources;
  const showCopy = at(k, 1, 'Jo’s saved rewrite');
  const showKeys = at(k, 2, 'key the cache');
  const reader = nextRequest ? jo : mira;
  const decision = cacheDecision(reader, sources);
  const showVerdict = nextRequest ? at(k, 3, 'Hold the passage') : at(k, 2, 'Hold Jo’s copy');
  const grantCues = ['Mira owns the shift note', 'operations group can read the FAQ', 'review memo names Jo', 'security group can read the key runbook'];
  heading(c, nextRequest ? 'Can Jo reuse her saved runbook passage?' : 'Can Mira use Jo’s saved result?');
  sub(c, 'Tenant A   /   same question: “Rotate the key?”   /   same rewrite and model settings');
  section(c, 'Document', 102, 283, 390);
  section(c, 'Current read grant', 531, 283, 440);
  [mira, jo].forEach((person, i) => {
    const x = 1014 + i * 420;
    section(c, person.id + '   /   ' + person.roles[0], x, 283, 390);
    text(c, person.groups[0] + ' group', x, 344, 33, C.muted);
  });
  sources.forEach((row, i) => {
    const y = 413 + i * 83;
    text(c, row.id === 'key' ? 'Key runbook' : row.title, 105, y, 41, C.ink);
    text(c, grantLabel(row), 533, y, 37, row.grant === null ? C.red : C.ink);
    const seen = at(k, 1, grantCues[i]);
    [mira, jo].forEach((person, n) => {
      const ok = secureEligibility(row, person);
      text(c, seen ? (ok ? 'May read' : 'Held') : '?', 1016 + n * 420, y, 40, seen ? passColor(ok) : C.muted, { weight: 600 });
    });
    line(c, 103, y + 19, 1815, y + 19, C.rule, 1);
  });
  if (showCopy) {
    sheet(c, 100, 702, 1712, 136);
    text(c, 'Jo’s saved copy', 128, 757, 37, C.ink, { face: 'Serif' });
    text(c, 'Key runbook v' + cachedKey.revision, 128, 807, 33, C.muted);
    if (showKeys) {
      text(c, 'Cache key for this question', 522, 754, 29, C.muted);
      text(c, [savedRewrite.tenant, savedRewrite.reader, savedRewrite.technique, savedRewrite.model, 'policy ' + savedRewrite.policy, 'key v' + cachedKey.revision].join(' / '), 522, 804, 35, C.blue, { max: 776 });
    }
    if (showVerdict) seal(c, decision.reuse ? 'Reuse for ' + reader.id : 'Hold for ' + reader.id, 1434, 750, passColor(decision.reuse));
    else text(c, 'Check for ' + reader.id, 1434, 787, 36, C.muted);
  }
  let footer = 'Compare each document’s grant with the two readers.';
  if (showCopy) footer = 'Does Mira have a current read grant for the saved passage?';
  if (showVerdict && !nextRequest) footer = 'Mira can use her shift note and the FAQ for a fresh search.';
  if (nextRequest) footer = revoked
    ? 'Key content v7   /   current policy ' + sources[3].policy + '   /   no live runbook grant for Jo'
    : 'Jo returns with the same question, tenant and reader identity.';
  result(c, footer);
}

export function rewrite(c, k) {
  if (k.beat.beatIndex > 0) return compareReaders(c, k);
  heading(c, 'What survives a query rewrite?');
  sub(c, 'One principal applies to search, generated queries and parent expansion.');
  section(c, 'Search expression', 98, 284, 800);
  section(c, 'Identity from the server', 1005, 284, 800);
  sheet(c, 98, 333, 799, 142);
  text(c, savedRewrite.query, 135, 421, 55, C.ink, {
    face: 'Serif',
  });
  sheet(c, 1004, 333, 799, 142);
  const identity = [mira.tenant, mira.id, ...mira.groups].join('   /   ');
  text(c, identity, 1040, 419, 43, C.blue, { weight: 600 });
  const q = cue(k, 0, 'as signing-key rotation', 0.85);
  if (q) {
    thread(c, 490, 477, 490, 552, C.gold, q);
    sheet(c, 98, 553, 799, 147);
    text(c, 'Signing-key rotation', 136, 646, 55, C.ink, { face: 'Serif' });
    thread(c, 1398, 477, 1398, 552, C.blue, q);
    sheet(c, 1004, 553, 799, 147);
    text(c, identity, 1040, 640, 43, C.blue, { weight: 600 });
  }
  result(c, q ? 'The query changes. Both branches carry the same verified scope.' : 'Use the identity supplied by the server.');
}
export function external(c, k) {
  heading(c, 'May the fallback fetch this page?');
  sub(c, 'Network policy checks each destination before the service fetches it.');
  const resolved = at(k, 0, 'actual resolved addresses'),
    redirect = at(k, 0, 'redirect behavior');
  const nodes = [
    ['Proposed guide', 'Public help site'],
    ['Resolved address', 'Allowed network'],
    ['Redirect target', 'Private network'],
  ];
  nodes.forEach(([s, v], i) => {
    const x = 100 + 594 * i,
      y = 369;
    if (i < 2) line(c, x + 480, y + 111, x + 595, y + 111, C.rule, 7);
    sheet(c, x, y, 481, 226);
    text(c, s, x + 30, y + 73, 39, C.ink, { face: 'Serif' });
    text(
      c,
      (i === 1 && !resolved) || (i === 2 && !redirect) ? 'Awaiting check' : v,
      x + 30,
      y + 150,
      36,
      i === 2 ? C.red : C.blue,
      { weight: 600 },
    );
  });
  if (redirect) seal(c, 'Stop before fetch', 1324, 652, C.red);
  result(
    c,
    k.beat.beatIndex
      ? 'Treat returned HTML as evidence. Log the destination decision without copying protected bodies.'
      : 'Validate the domain, resolved address and redirect under the same egress policy.',
  );
}
export function credential(c, k) {
  heading(c, 'Who is this token intended for?');
  sub(c, 'The retrieval service is API B. Its gateway removes caller-supplied identity headers.');
  const check = at(k, 1, 'Validate issuer'),
    read = at(k, 2, 'current application policy');
  ['A', 'B'].forEach((aud, i) => {
    const x = 100 + i * 870;
    sheet(c, x, 274, 812, 454);
    text(c, 'Access token ' + (i + 1), x + 34, 350, 51, C.ink, { face: 'Serif' });
    rows(
      c,
      [
        ['Issuer', 'trusted'],
        ['Audience', 'API ' + aud],
        ['Time, integrity', 'valid'],
      ],
      x + 38,
      424,
      731,
      76,
    );
    if (check)
      seal(c, i ? 'Authentication passes' : 'Wrong audience', x + 35, 640, passColor(i === 1));
  });
  result(
    c,
    read
      ? 'A verified token now faces the document policy. This analyst still lacks the key grant.'
      : k.beat.beatIndex
        ? 'Validate issuer, audience, time, type and scope using trusted keys or issuer validation.'
        : 'An ID token supports client sign-in. The API validates the access token intended for it.',
  );
}
export function directory(c, k) {
  heading(c, 'Where did the group list go?');
  sub(c, 'Entra example   /   one directory identity across two client applications');
  pair(c, 'App A subject', 'app-A-17', 103, 347, 515);
  pair(c, 'App B subject', 'app-B-91', 103, 576, 515);
  curve(c, 502, 390, 868, 491, C.blue, 5);
  curve(c, 502, 614, 868, 491, C.blue, 5);
  sheet(c, 870, 365, 896, 258);
  text(c, 'Accepted tenant + object ID', 907, 456, 52, C.ink, { face: 'Serif' });
  text(c, 'Directory key    A / 47', 910, 553, 45, C.blue, { weight: 600 });
  if (at(k, 1, 'overage indicator'))
    seal(c, 'Group overage   /   trusted lookup required', 905, 671, C.gold);
  result(
    c,
    k.beat.beatIndex === 2
      ? 'Check current memberships. An unexpired token can still contain yesterday’s grant.'
      : k.beat.beatIndex
        ? 'An omitted group list leaves membership-dependent reads pending or denied.'
        : 'Map each application-specific subject through the issuer’s identity contract.',
  );
}
const scope = {
  tenant: 'A',
  user: 'analyst',
  query: 'digest(Q)',
  audience: 'retrieval',
  expiry: 120,
  nonce: 'n1',
};
function nonceLedger() {
  const used = new Set();
  return [
    ['Other query', 'digest(other)', 99],
    ['First match', scope.query, 99],
    ['Replay', scope.query, 100],
    ['Exact expiry', scope.query, 120],
  ].map(([label, query, now], i) => {
    // The expiry case uses a fresh nonce store to isolate its time failure.
    const store = i === 3 ? new Set() : used;
    const ok = taskScopeCheck(scope, { ...scope, query }, now, store);
    return { label, now, ok, consumed: store.has(scope.nonce) };
  });
}
const nonceReceipts = nonceLedger();
export function capability(c, k) {
  heading(c, 'Which request consumes the nonce?');
  sub(c, 'HMAC authenticates all six fields in the signed payload.');
  sheet(c, 101, 270, 694, 555);
  rows(
    c,
    [
      ['Tenant', scope.tenant],
      ['User', scope.user],
      ['Query', scope.query],
      ['Audience', scope.audience],
      ['Expiry', scope.expiry],
      ['Nonce', scope.nonce],
    ],
    132,
    361,
    625,
    80,
  );
  section(c, 'Request   /   time      •      verifier result', 878, 290, 916);
  const cues = [
    'A wrong query fails',
    'The first matching request',
    'Replay fails',
    'At the exact expiry',
  ];
  nonceReceipts.forEach((r, i) => {
    const y = 334 + i * 115,
      visible = at(k, 2, cues[i]);
    text(c, r.label + '  ·  ' + r.now, 884, y + 44, 36, C.ink, { max: 344 });
    if (visible) {
      seal(c, r.ok ? 'Accept' : 'Deny', 1237, y + 5, passColor(r.ok));
      text(c, 'n1 ' + (r.consumed ? 'used' : 'unused'), 1451, y + 42, 33, C.muted);
    }
    line(c, 880, y + 80, 1796, y + 80, C.rule, 2);
  });
  if (at(k, 2, 'At the exact expiry'))
    text(c, 'Expiry case starts with an empty nonce store.', 881, 824, 29, C.muted);
  result(
    c,
    k.beat.beatIndex === 3
      ? 'Consume the nonce atomically across servers. The accepted task still needs a document grant.'
      : k.beat.beatIndex === 2
        ? 'Expiry case uses an unused token. A wrong binding leaves the matching request available.'
        : 'Issuers and verifiers share the secret. A verifier can also issue tokens.',
  );
}
export function temporary(c, k) {
  heading(c, 'When does exceptional access actually end?');
  sub(c, 'A token expiry and a source grant have separate lifetimes.');
  section(c, 'Repeated renewal of a broad grant', 100, 293, 1705);
  const renewed = cue(k, 0, 'repeatedly renew broad privileges', 1.2);
  for (let i = 0; i < 4; i++) {
    const x = 109 + i * 420;
    if (i === 0 || renewed * 3 >= i) {
      rect(c, x, 353, 401, 81, C.plum, null, 4);
      text(c, 'Token ' + (i + 1), x + 34, 405, 34, 'white', { weight: 600 });
    }
  }
  section(c, 'Task-specific source grant', 99, 539, 1707);
  line(c, 114, 667, 1773, 667, C.rule, 5);
  if (at(k, 1, 'Approval must establish')) {
    rect(c, 695, 634, 494, 66, C.green, null, 4);
    text(c, 'Approved task window', 942, 678, 35, 'white', { align: 'center' });
  }
  result(
    c,
    k.beat.beatIndex
      ? 'Apply exceptional approval where the source policy requires it. Ordinary authorized reads proceed.'
      : 'Renewable broad authority can outlive every individual token.',
  );
}
export function checkPolicy() {
  const permitted = (sources, reader) => sources.filter(row => secureEligibility(row, reader)).map(row => row.id);
  assert.deepEqual(mira.roles, jo.roles);
  assert.equal(mira.tenant, jo.tenant);
  assert.deepEqual(permitted(rewriteSources, mira), ['note', 'FAQ']);
  assert.deepEqual(permitted(rewriteSources, jo), ['memo', 'key']);
  assert.deepEqual(permitted(afterKeyWithdrawal, jo), ['memo']);
  assert.deepEqual(cacheDecision(mira, rewriteSources), { sameReader: false, sourcesPass: false, reuse: false });
  assert.deepEqual(cacheDecision(jo, rewriteSources), { sameReader: true, sourcesPass: true, reuse: true });
  assert.deepEqual(cacheDecision(jo, afterKeyWithdrawal), { sameReader: true, sourcesPass: false, reuse: false });
  assert.equal(afterKeyWithdrawal[3].revision, savedRewrite.sources[0].revision);
  assert(chunkRead(grantedPolicy, grantedPolicy, true));
  assert(chunkRead(grantedPolicy, withdrawnPolicy, false));
  assert(!chunkRead(grantedPolicy, withdrawnPolicy, true));
  assert(!chunkRead(withdrawnPolicy, withdrawnPolicy, true));
  assert.deepEqual(
    replays.map((s) => s.updated),
    [0, 2, 0, 0, 2, 2],
  );
  for (const phase of replays)
    assert(
      phase.rows
        .filter((r) => r.tenant === 'B')
        .every((r) => r.revision === 1 && r.groups[0] === 'operations' && !r.deleted),
    );
  assert(replays[4].rows[0].deleted);
  assert(!replays[5].rows[0].deleted);
  assert.deepEqual(
    [
      [41, 0],
      [43, 0],
      [42, 0],
      [42, 300],
      [42, 360],
      [42, -1],
    ].map(
      ([version, age]) =>
        snapshotAdmission({ version, fetched: 1200 - age }, 42, 1200, 300).allowed,
    ),
    [false, false, true, true, false, false],
  );
  assert.deepEqual(routed('A'), [tenantPages[0]]);
  for (const t of ['B', '', null]) assert.deepEqual(routed(t), []);
  assert.deepEqual(
    nonceReceipts.map((r) => [r.ok, r.consumed]),
    [
      [false, false],
      [true, true],
      [false, true],
      [false, false],
    ],
  );
}
