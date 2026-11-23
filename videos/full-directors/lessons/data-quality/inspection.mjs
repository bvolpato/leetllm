import {
  ink,
  muted,
  paper,
  teal,
  rust,
  blue,
  green,
  mint,
  apricot,
  pale,
  gold,
} from './printshop.mjs';

const supportMail = 'alex@example.com';
const privacyMessages = [
  'Incident INC-10234 mentions a private timeline',
  'Send updates to ' + supportMail + ' please',
];
const address = /\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/;
const dolmaAction = (n) => (n >= 6 ? 'drop page' : 'mask spans');
export function privacy(d) {
  const { ground, beat, cue, title, strip, mono, label, chip } = d;
  ground('SUPPORT ARCHIVE   /   RESTRICTED SOURCE');
  strip(44, 87, 872, 251, paper, teal);
  mono('INCIDENT CORRESPONDENCE', 71, 127, 16, muted);
  const entity = cue(2, 'entity model'),
    mail = cue(2, 'email-like');
  title('Alex asked for the INC-10234 timeline.', 71, 203, 35);
  if (entity) d.line(73, 214, 141, 214, blue, 5);
  mono('Contact   ' + supportMail, 74, 283, 28);
  if (mail) d.line(240, 294, 509, 294, rust, 5);
  if (beat === 1) {
    label('Sender, contact address and incident context travel together.', 47, 419, 25);
  }
  if (beat === 2) {
    chip('Email pattern', 48, 388, 225, 58, rust);
    if (entity) chip('Name recognizer', 295, 388, 257, 58, blue);
  }
  if (beat === 3) {
    mono('SOURCE REF     INC-10234', 49, 392, 20, teal);
    label('Release decision   /   pending context and access review', 49, 451, 27);
  }
}
export function spans(d) {
  const { ground, beat, cue, title, strip, mono, label, chip, rect, center, arrow } = d;
  ground('PRIVACY REVIEW   /   SPAN AND DISPOSITION', beat === 5);
  if (beat <= 4) {
    const flagged = cue(1, 'scanner flags'),
      masked = cue(3, 'email marker');
    privacyMessages.forEach((s, i) => {
      const y = 92 + 145 * i;
      strip(44, y, 870, 117, paper, i && flagged ? rust : teal);
      mono('TICKET  ' + (501 + i), 67, y + 30, 16, muted);
      const value = masked ? s.replace(address, '<EMAIL>') : s;
      title(value, 67, y + 79, 30);
      if (i === 1 && flagged && !masked) {
        d.ctx.font = '500 30px "Lesson Serif"';
        const prefix = d.ctx.measureText('Send updates to ').width;
        const w = d.ctx.measureText(supportMail).width;
        d.line(67 + prefix, y + 87, 67 + prefix + w, y + 87, rust, 4);
      }
    });
    label(
      beat === 1
        ? flagged
          ? '#502   /   queued with original text intact'
          : 'Where is the address?'
        : beat === 2
          ? '#501   /   no email match. The private timeline remains.'
          : beat === 3
            ? '#502   /   mask only the approved span'
            : 'Check misses and false alarms on reviewed language samples.',
      45,
      438,
      25,
      ink,
      { max: 866 },
    );
  } else if (beat === 5) {
    const n = cue(5, 'sixth span') ? 6 : 5;
    mono('DOLMA WEB PAGE   /   DETECTED SPANS', 44, 108, 18, mint);
    d.strip(42, 145, 585, 258, paper, teal);
    for (let i = 0; i < 6; i++) {
      d.rect(75, 176 + i * 35, 173, 5, '#bdc7b7');
      d.rect(259, 168 + i * 35, 131, 20, i < n ? rust : '#e6e2ce');
      d.rect(402, 176 + i * 35, 170, 5, '#bdc7b7');
    }
    center(String(n), 758, 263, 81, paper);
    center('detected spans', 758, 303, 20, mint);
    chip(dolmaAction(n), 657, 343, 204, 53, n === 6 ? rust : teal);
  } else {
    title('Who can read the raw ticket?', 43, 116);
    d.ticket(
      44,
      151,
      405,
      157,
      'RESTRICTED   #502',
      supportMail,
      'Original source · access policy',
      apricot,
      rust,
    );
    d.ticket(
      520,
      151,
      394,
      157,
      'TRAINING COPY   #502',
      '<EMAIL>',
      'Mask operation · output reference',
      mint,
      teal,
    );
    arrow(452, 230, 513, 230);
    mono('Provenance', 44, 380, 20, teal);
    label('Origin and permissions', 44, 423, 25);
    mono('Lineage', 520, 380, 20, teal);
    label('Input → mask → output', 520, 423, 25);
  }
}

const corpus = Array.from({ length: 20 }, (_, i) => ({
  kind: i < 10 ? 'log' : 'prose',
  keep: i < 10 ? i < 2 : i < 19,
}));
export function selection(d) {
  const { ground, beat, cue, title, mono, label, chip, rect, line, center } = d;
  ground('CORPUS SELECTION   /   PROSE FILTER');
  if (beat <= 2) {
    title('What did the filter remove?', 40, 112);
    d.ticket(
      42,
      146,
      876,
      120,
      'INCIDENT LOG',
      'ERROR [503] retry=3 path=/v2/api',
      'A repeated status can be part of the incident.',
      mint,
      teal,
    );
    d.ticket(
      42,
      292,
      876,
      120,
      'EXTRACTED NAVIGATION',
      'home home menu home menu home',
      'Repeated links from a scraped page.',
      paper,
      blue,
    );
    if (beat === 2) line(66, 221, 185, 221, rust, 3);
  } else {
    const logsChecked = cue(3, 'eight of ten logs'),
      proseChecked = cue(3, 'one of ten prose');
    const remains = (r) => r.keep || !(r.kind === 'log' ? logsChecked : proseChecked);
    const after = corpus.filter(remains);
    const arm = beat >= 5;
    title(arm ? 'Train two models on matched budgets' : 'Which sources remain?', 42, 110);
    if (!arm) {
      ['log', 'prose'].forEach((kind, i) => {
        mono(kind.toUpperCase(), 43, 193 + i * 90, 19);
        corpus
          .filter((r) => r.kind === kind)
          .forEach((r, j) => {
            const x = 173 + j * 73,
              y = 153 + i * 90,
              kept = remains(r);
            rect(x, y, 59, 61, kept ? (i ? pale : mint) : '#cfcec2');
            for (let k = 0; k < 3; k++)
              line(
                x + 8,
                y + 17 + k * 10,
                x + 49 - (k % 2) * 8,
                y + 17 + k * 10,
                kept ? teal : '#aaa99e',
                2,
              );
            if (!kept) line(x + 4, y + 54, x + 53, y + 6, rust, 3);
          });
      });
      const logs = after.filter((r) => r.kind === 'log').length;
      label(logs + ' / ' + after.length + ' retained documents are logs', 42, 383, 29);
      mono(Math.round((logs * 100) / after.length) + '% of the mix', 46, 437, 22, teal);
    } else {
      [corpus, corpus.filter((r) => r.keep)].forEach((set, i) => {
        const x = 44 + i * 449;
        mono(i ? 'FILTERED' : 'BASELINE', x, 177, 18, teal);
        const share = set.filter((r) => r.kind === 'log').length / set.length;
        rect(x, 213, 401, 70, pale);
        rect(x, 213, 401 * share, 70, mint);
        label(
          set.filter((r) => r.kind === 'log').length +
            ' logs  /  ' +
            set.filter((r) => r.kind === 'prose').length +
            ' prose',
          x,
          329,
          26,
        );
      });
      chip('Same model settings, token budget and held-out tasks', 43, 403, 866, 62, teal);
    }
  }
}

const probs = [0.5, 0.25],
  loss = probs.map((p) => -Math.log(p)),
  perplexity = Math.exp(loss.reduce((a, b) => a + b, 0) / probs.length);
const incident = 'quorum lost · shard=7 · rollback pending';
export function ppl(d) {
  const { ground, beat, cue, title, mono, label, rect, center, chip, ticket, arrow } = d;
  ground('REFERENCE SCORER   /   PERPLEXITY', beat <= 2);
  if (beat <= 2) {
    mono('TWO SCORED TOKENS', 43, 111, 18, mint);
    probs.forEach((p, i) => {
      const x = 65 + i * 190,
        h = loss[i] * 110;
      rect(x, 347 - h, 140, h, i ? gold : mint);
      center('p = ' + p, x + 70, 385, 24, paper);
      center('−ln p', x + 70, 423, 17, mint);
      center(loss[i].toFixed(3), x + 70, 456, 23, paper);
    });
    mono('PER-TOKEN MEAN LOSS', 505, 194, 18, mint);
    title('(' + loss[0].toFixed(3) + ' + ' + loss[1].toFixed(3) + ') / 2', 502, 250, 33, paper);
    if (beat === 2) {
      label('Inverse geometric mean', 505, 318, 22, mint);
      title(
        cue(2, 'square root') ? '√8 ≈ ' + perplexity.toFixed(2) : '1 / √(½ × ¼)',
        502,
        398,
        47,
        paper,
      );
    }
  } else {
    title('Which line can diagnose an incident?', 42, 107);
    ticket(42, 145, 871, 115, 'TECHNICAL LOG', incident, 'Same scorer and tokenizer', mint, teal);
    const rewrite = cue(5, 'Now read the rewrite');
    ticket(
      42,
      292,
      871,
      115,
      rewrite ? 'REWRITE' : 'BOILERPLATE',
      rewrite ? 'The system had a problem.' : 'Welcome. Welcome. Welcome. Welcome.',
      rewrite
        ? 'Shard and rollback status are missing.'
        : 'A familiar phrase can be easy to predict.',
      paper,
      rewrite ? rust : blue,
    );
    if (beat === 5) mono('Review removals by language and format.', 43, 468, 20, teal);
  }
}

const cases = [[], [-3, 2], [0]],
  count = (xs) => xs.filter((x) => x >= 0).length;
export function synthetic(d) {
  const { ground, beat, cue, title, mono, label, rect, chip, table } = d;
  ground('SYNTHETIC ITEM   /   EXECUTABLE CHECK');
  const repaired = cue(4, 'Change the return line');
  title('Count nonnegative values', 41, 107);
  d.strip(40, 133, 877, 108, ink, teal);
  mono('def count_nonnegative(xs):', 58, 171, 22, paper);
  mono(
    repaired ? '    return sum(x >= 0 for x in xs)' : '    return len(xs)',
    58,
    215,
    25,
    repaired ? mint : gold,
  );
  const rows = cases
    .slice(0, 1 + (beat >= 2 ? 1 : 0) + (cue(4, 'zero by itself') ? 1 : 0))
    .map((xs, i) => {
      const known = repaired
        ? i === 0
          ? cue(4, 'empty list gives')
          : i === 1
            ? cue(4, 'mixed list gives')
            : cue(4, 'It counts once')
        : i === 0
          ? cue(1, 'length is zero')
          : cue(3, 'It returns two');
      const actual = repaired ? count(xs) : xs.length;
      return [
        JSON.stringify(xs),
        count(xs),
        known ? actual : '?',
        known
          ? [actual === count(xs) ? 'pass' : 'repair', actual === count(xs) ? green : rust]
          : '?',
      ];
    });
  table(
    [
      [49, 273, 'Input'],
      [322, 210, 'Required'],
      [532, 175, 'Returned'],
      [707, 210, 'Result'],
    ],
    rows,
    290,
    46,
  );
  if (beat === 5)
    mono('Saved evidence   /   inputs, outputs and checker version', 44, 482, 18, teal);
}
export function checkInspection(assert) {
  assert.deepEqual(
    privacyMessages.map((s) => address.test(s)),
    [false, true],
  );
  assert.equal(privacyMessages[1].replace(address, '<EMAIL>'), 'Send updates to <EMAIL> please');
  assert.deepEqual([5, 6].map(dolmaAction), ['mask spans', 'drop page']);
  assert.deepEqual(
    ['log', 'prose'].map((k) => corpus.filter((x) => x.keep && x.kind === k).length),
    [2, 9],
  );
  assert.ok(Math.abs(perplexity - Math.sqrt(8)) < 1e-12);
  assert.deepEqual(cases.map(count), [0, 1, 1]);
}
