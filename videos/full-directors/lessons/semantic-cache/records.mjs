import { C, mix } from './art.mjs';
import { readPolicy, revision, answerDigest, admit, writeCases } from './cases.mjs';

export function freshness(f) {
  const { b, cue, on, base, title, tag, text, mono, calendar, line, mark } = f;
  const r8 = b === 1 && on(1, 'release eight');
  const now = b === 2 ? Math.round(100 + 100 * cue(2, 'clock reaches two hundred', 0.95)) : 100;
  const state = readPolicy({ reader: r8 ? 8 : 7, now });
  base('Logical invalidation · fictional policy');
  title('A record can stay on disk after a miss');
  calendar(112, 342, 0.97);
  mono('Stored   R7  /  C7', 114, 923, 36);
  const x = 784;
  tag('Active reader', x, 340);
  text(r8 ? 'Release 8   /   corpus 8' : 'Release 7   /   corpus 7', x, 426, 62, C.ink, {
    face: 'Serif',
  });
  tag('Reader clock', x, 548);
  const xx = mix(x + 30, 1710, (now - 100) / 100);
  line(x + 30, 650, 1710, 650, C.grid, 7);
  line(1710, 615, 1710, 688, C.rust, 5);
  f.dot(xx, 650, 18, C.navy);
  mono(now + ' s', Math.min(xx, 1510), 602, 42);
  mono('expiry 200 s', 1450, 741, 33, C.rust);
  if (r8 || b === 2 || on(0, 'answer goes through'))
    mark(x, 877, state === 'Hit', state === 'Hit' ? 'Hit · read the answer' : state, 542);
}
function reader(f, x, label, release) {
  f.rect(x, 387, 400, 183, C.ink, 16);
  f.rect(x + 16, 403, 368, 151, C.light, 8);
  f.tag(label, x + 41, 458);
  f.mono('C' + release + '  /  R' + release, x + 37, 525, 49);
  f.rect(x + 163, 570, 74, 27, C.muted);
  f.rect(x + 103, 595, 194, 14, C.ink, 4);
}
export function cutover(f) {
  const { b, on, cue, base, tag, text, mono, line, dot, mark, calendar, book } = f;
  base('Distributed readers · independent activation');
  f.title('Two lookups reach the same stored bytes');
  const newer = on(0, 'release eight'),
    newRelease = newer ? 8 : 7,
    revoked = on(3, 'withdraw this record'),
    oldState = readPolicy({ approved: !revoked }),
    newState = readPolicy({ reader: newRelease, approved: !revoked });
  calendar(753, 319, 0.81);
  mono('Stored   C7 / R7', 760, 794, 35);
  reader(f, 110, 'Reader A', 7);
  reader(f, 1410, 'Reader B', newRelease);
  line(510, 484, 748, 484, C.grid, 6);
  line(1158, 484, 1407, 484, C.grid, 6);
  const first = cue(0, 'Send a lookup from the first reader', 1.3),
    back = cue(0, 'it gets the thirty-day reply', 1.15);
  const second = cue(0, 'Send its lookup', 1.25),
    again = cue(1, 'Send another lookup', 1.1),
    againBack = cue(1, 'It still hits', 1.1);
  if (first === 1) mono('C7/R7 = C7/R7', 151, 654, 35, C.navy);
  if (second === 1) {
    const relation = newRelease === 7 ? '=' : '≠';
    mono(`C${newRelease}/R${newRelease} ${relation} C7/R7`, 1450, 654, 35, C.rust);
  }
  if (revoked) {
    const third = cue(3, 'Send the older reader', 1.1);
    dot(mix(510, 744, third), 484, 13, C.rust);
    if (on(3, 'It must read fresh too')) {
      mark(112, 707, false, oldState, 397);
      f.arrow(310, 748, 310, 799, C.rust);
      book(200, 829, 0.68, 'Current policy');
    }
  } else if (first > 0) {
    const x =
      again > 0 ? mix(mix(510, 744, again), 510, againBack) : mix(mix(510, 744, first), 510, back);
    dot(x, 484, 13, C.navy);
    if ((back === 1 && again === 0) || againBack === 1)
      mark(112, 707, oldState === 'Hit', 'Hit · 30 days', 397);
  }
  if (second > 0) dot(mix(1409, 1158, second), 484, 13, C.gold);
  if (on(1, 'reads the current policy')) {
    mark(1410, 703, newState === 'Hit', newState, 397);
    f.arrow(1606, 748, 1606, 799, C.rust);
    book(1481, 829, 0.68, 'Current policy');
  } else if (second === 1) text('Which reply?', 1412, 711, 43, C.ink, { face: 'Serif' });
  if (b === 2)
    text('Activate approved corpus, dependencies and scope together.', 114, 929, 35, C.muted, {
      max: 1260,
    });
  if (revoked) f.middle('Approval withdrawn', 960, 849, 41, C.rust);
}
export function fingerprint(f) {
  const { b, on, done, base, title, tag, text, mono, rect, line, mark } = f;
  const edited = on(2, 'Edit thirty days to ninety') && !on(3, 'restore thirty days');
  const extended = on(3, 'extend only the expiry') && !on(4, 'Restore the original expiry');
  const revoked = on(4, 'withdraw the approval itself');
  const a = revision(),
    r = revision(edited ? 90 : 30, extended ? 8200 : 4600);
  const knowDigest =
    b === 1
      ? on(1, 'screen shows')
      : b === 2
        ? !edited
        : b === 3
          ? !extended && on(3, 'so bypass it')
          : b === 4
            ? true
            : false;
  base('Admission registry · SHA-256');
  title('Which bytes did the reviewer approve?');
  for (const [i, rec] of [a, r].entries()) {
    const x = 110 + i * 858;
    f.paper(x, 300, 807, 554);
    tag(i ? 'Record on this read' : 'Trusted review', x + 38, 365);
    const [, wording, duration] = rec.response.match(/^(.*) (\d+ days\.)$/u);
    text(wording, x + 38, 445, 36, C.ink, { max: 729 });
    const changed = rec.response !== a.response;
    text(duration, x + 31, 567, 98, changed ? C.rust : C.navy, {
      face: 'Serif',
    });
    line(x + 38, 614, x + 762, 614);
    mono(
      'Expiry  ' + rec.expires_at.toLocaleString('en-US') + ' s',
      x + 38,
      690,
      39,
      rec.expires_at !== a.expires_at ? C.rust : C.ink,
    );
    mono(
      !i || knowDigest ? answerDigest(rec).slice(0, 16) : 'Hash this record…',
      x + 38,
      795,
      41,
      i && knowDigest && !admit(rec) && !revoked ? C.rust : C.navy,
    );
  }
  if (revoked) mark(110, 951, false, 'Approval withdrawn · both read paths stop', 918);
  else if (knowDigest)
    mark(110, 951, admit(r), admit(r) ? 'Digests match' : 'Digest mismatch', 540);
  else text('Same review ID   ·   compare the bound fields', 110, 958, 39, C.muted);
}

export function admission(f) {
  const { b, on, base, title, tag, text, mono, line, rect, mark } = f;
  base('Admission to the servable index');
  title(b === 2 ? 'Withdraw the approval at read time' : 'Which new answers may enter the index?');
  if (b === 0) {
    const titles = ['Fresh retention', 'Reviewed rate limit', 'Live incident', 'Edited retention'];
    const reasons = [
      'No evidence ID',
      'Reviewed answer bytes',
      'Live response class',
      'Copied evidence ID',
    ];
    writeCases.forEach((r, i) => {
      const y = 359 + i * 143;
      text(titles[i], 120, y, 46);
      text(reasons[i], 678, y, 38, C.muted);
      const settled = on(
        0,
        ['stays quarantined', 'is admitted', 'remain quarantined', 'remain quarantined'][i],
      );
      if (settled) mark(1335, y - 1, admit(r), admit(r) ? 'Admit' : 'Quarantine', 405);
      line(120, y + 50, 1770, y + 50);
    });
    text('Write gate   ·   class, scope, trusted digest, expiry', 120, 951, 38, C.navy);
  } else if (b === 1) {
    const r = writeCases[1];
    f.paper(116, 281, 1672, 479);
    tag('Approved rate-limit record', 158, 357);
    text(r.source_query, 158, 454, 59, C.ink, { face: 'Serif' });
    text(r.response, 158, 536, 36, C.navy, { max: 1580 });
    line(158, 588, 1736, 588);
    mono(answerDigest(r).slice(0, 22), 158, 690, 51);
    text('Review binds answer ID, source, response, class, scope and expiry.', 120, 900, 40);
  } else {
    const revoked = on(2, 'Removing one approval');
    tag('Previously admitted answer', 118, 373);
    mono('600 requests / min', 120, 472, 61);
    text('Default rate, subject to account policy', 120, 554, 39, C.muted);
    for (const [i, path] of ['Exact read', 'Semantic read'].entries()) {
      const y = 380 + i * 213;
      tag(path, 1070, y);
      mark(
        1070,
        y + 103,
        admit(writeCases[1], revoked),
        revoked ? 'Approval missing' : 'Approval current',
        600,
      );
    }
    text('Physical record retained    ·    TTL still valid', 120, 875, 41, C.muted);
  }
}
