import * as A from './press.mjs';
import * as M from './evidence.mjs';
const {
  ink,
  teal,
  green,
  red,
  navy,
  muted,
  white,
  paper,
  pale,
  pink,
  yellow,
  blue,
  light,
  base,
  rect,
  line,
  dot,
  txt,
  para,
  mono,
  heading,
  label,
  leaf,
  folio,
  book,
  hashMark,
  stamp,
  fold,
  bracket,
  link,
  band,
} = A;

export function authority(c, { cue }) {
  base(c, 'green');
  const slide = A.ease(cue(1, 'Slide the two instructions', 1.5));
  const posted = A.ease(cue(2, 'File the access policy', 0.7));
  folio(c, 42, 43, 540, 277, white, navy);
  label(c, 'PUBLISHED POLICY   /   ' + M.records[0].document_id, 78, 80);
  txt(c, 'Verify identity', 78, 147, 60, ink, 'Serif');
  para(c, M.policy, 78, 194, 475, 30, 34);
  hashMark(c, M.original[0].hash, 78, 298, 310);

  c.save();
  c.translate(-580 * (1 - slide), 0);
  fold(c, 62, 357, 500, 161, yellow);
  A.path(
    c,
    [
      [264, 347],
      [362, 349],
      [361, 371],
      [262, 369],
    ],
    '#b4ab82',
    1,
    true,
  );
  label(c, 'LOOSE WORKSPACE NOTE', 88, 397);
  txt(c, 'Immediate access', 88, 457, 56, ink, 'Serif', 400, 448);
  mono(c, M.records[2].document_id, 88, 497, 18, muted);
  c.restore();

  folio(c, 635, 46, 504, 405, paper, navy);
  heading(c, 'CONTROLLED COPY', 'Publisher’s register', 670, 88, 425);
  line(c, 670, 160, 1104, 160);
  const registered = cue(1, 'Follow the access policy');
  if (registered) {
    label(c, 'DOCUMENT ID', 679, 202);
    mono(c, M.records[0].document_id, 679, 238, 28, navy);
    label(c, 'ACTIVE US GRANT   /   EXPECTED TEXT', 679, 281);
    hashMark(c, M.original[0].grant.text_sha256, 679, 327, 320, teal);
    link(c, 292, 292, 668, 315, teal, cue(1, 'Follow the access policy', 1.25));
    if (cue(1, 'The two text fingerprints match')) stamp(c, 'Matching text', 885, 296, 207);
  }
  line(c, 670, 356, 1100, 356, '#b2a794');
  if (cue(1, 'Where is the note')) {
    label(c, 'NOTE ENTRY', 679, 393);
    mono(c, '—', 859, 397, 26, muted);
  }
  rect(c, 635, 516, 503, 102, '#1c4342');
  rect(c, 650, 530, 474, 26, '#102e30');
  if (posted) {
    const yy = 403 + posted * 91;
    leaf(c, 724, yy, 325, 65, white, teal);
    mono(c, M.records[0].document_id, 746, yy + 36, 21);
  }
  rect(c, 635, 550, 503, 68, navy);
  rect(c, 747, 562, 273, 42, '#b89962');
  rect(c, 752, 567, 263, 32, paper);
  txt(c, 'Policy index', 806, 592, 26, ink, 'Serif');
  if (cue(2, 'The note has no entry')) stamp(c, 'Unfiled', 418, 469, 113, red, 18);
}
export function admission(c, { b, cue }) {
  base(c, 'linen');
  folio(c, 52, 36, 1096, 585, white, navy);
  const changed = Boolean(cue(3, 'change “may be restored”'));
  const inspected = changed ? M.edited : M.original;
  heading(c, 'PUBLISHER’S PROOF   /   ADMISSION', 'Compare the impressions', 94, 77, 930);
  const cols = [95, 472, 704, 928];
  ['Parsed record', 'Text SHA-256', 'Register expects', 'Index'].forEach((v, i) =>
    label(c, v, cols[i], 177),
  );
  line(c, 94, 192, 1107, 192);
  inspected.forEach((r, i) => {
    const y = 238 + 86 * i;
    txt(c, ['Access policy', 'Incident policy', 'Private note'][i], cols[0], y, 31, ink, 'Serif');
    mono(c, r.record.document_id, cols[0], y + 27, 17, muted);
    hashMark(c, r.hash, cols[1], y + 2, 215, changed && i === 0 ? red : ink);
    if (r.grant) hashMark(c, r.grant.text_sha256, cols[2], y + 2, 211, teal);
    else mono(c, '—', cols[2], y + 2, 26, muted);
    if (b >= 2 && (!changed || i !== 0 || cue(3, 'Reject the edited copy')))
      stamp(c, r.admitted ? 'Admit' : 'Exclude', cols[3], y - 23, 159, r.admitted ? green : red);
    line(c, 94, y + 43, 1107, y + 43, '#c8bd9f', 1.2);
  });
  const msg = changed
    ? 'Production API key access may not be restored after identity verification.'
    : M.policy;
  label(
    c,
    changed ? 'EDITED ACCESS FILE   /   SAME DOCUMENT ID' : 'ACCESS FILE   /   FIRST SENTENCE',
    95,
    495,
    changed ? red : teal,
  );
  para(c, msg, 95, 538, 978, 28, 34);
  if (b === 4)
    label(c, 'Only authorized publishers may replace the expected digest.', 95, 599, red);
}
export function corpus(c, { b, cue }) {
  base(c, 'blue');
  if (b < 3) {
    folio(c, 55, 43, 1090, 552, white, navy);
    heading(c, 'PARSER INTAKE', 'One decision per input', 91, 88, 970);
    M.duplicates.forEach((r, i) => {
      const x = 92 + 350 * i;
      leaf(c, x, 188, 316, 192, i === 2 ? pale : paper);
      label(c, 'SOURCE RECORD', x + 21, 223);
      mono(c, r.record.document_id, x + 20, 265, 23, ink, 275);
      hashMark(c, r.hash, x + 20, 318, 276);
      if (cue(1, 'Reject both copies') && (i < 2 || cue(1, 'The incident policy still qualifies')))
        stamp(c, r.reason, x + 16, 343, 278, r.admitted ? green : red);
    });
    const typed = cue(1, 'The loader also checks');
    line(c, 92, 424, 1101, 424, muted);
    if (typed) {
      label(c, 'REGISTRY FLAG TYPES', 92, 465);
      mono(c, '"false"     1', 92, 522, 36, red);
      txt(c, 'Boolean required', 463, 522, 36, ink, 'Serif');
    }
    if (b === 2)
      band(
        c,
        'published = true     •     effective = true     •     region from grant     •     exact digest',
        92,
        544,
        1006,
      );
  } else if (b <= 4) {
    book(c, 65, 80, 1067, 459);
    heading(c, 'PUBLISHER’S REGISTER', 'Grant correction', 100, 124, 466);
    label(c, 'DOCUMENT', 101, 242);
    mono(c, M.records[2].document_id, 101, 285, 25);
    const bad = cue(3, 'mistakenly grants') && !cue(3, 'Repair the grant');
    const r = (bad ? M.mistaken : M.original)[2];
    if (r.grant) {
      label(c, 'PUBLISHED POLICY    /    ACTIVE US GRANT', 100, 346, teal);
      hashMark(c, r.grant.text_sha256, 100, 397);
    } else band(c, 'No active entry', 101, 326, 430, muted, paper);
    fold(c, 655, 139, 412, 261, yellow);
    label(c, 'WORKSPACE NOTE', 688, 188);
    txt(c, 'Immediate access', 688, 250, 38, ink, 'Serif');
    hashMark(c, r.hash, 688, 329, 310);
    if (!bad || cue(3, 'Admission accepts'))
      stamp(
        c,
        bad ? 'Admitted by mistake' : 'Excluded from index',
        685,
        430,
        352,
        bad ? red : teal,
      );
    if (b === 4)
      band(c, 'Any access change requires separate authorization.', 183, 567, 834, navy, blue);
  } else {
    heading(c, 'SNAPSHOT AT STARTUP', 'The running copy', 75, 70, 980, white);
    const changed = cue(5, 'Edit a file on disk');
    [
      [73, 'File on disk', changed ? M.edited[0] : M.original[0]],
      [623, 'Loaded in the app', M.original[0]],
    ].forEach(([x, title, r]) => {
      folio(c, x, 197, 493, 290, white, teal);
      txt(c, title, x + 27, 258, 34, ink, 'Serif');
      para(c, r.record.text.split('. ')[0] + '.', x + 27, 320, 433, 27, 34);
      hashMark(c, r.hash, x + 27, 450, 300);
    });
    txt(
      c,
      b === 6
        ? 'Effective date needs a resolver.'
        : 'Snapshot inputs: registry, admitted records, parser identity',
      76,
      560,
      24,
      white,
    );
  }
}
function passageCard(c, passage, x, y, fill = paper, color = navy) {
  leaf(c, x, y, 169, 47, fill);
  mono(c, passage.id, x + 13, y + 32, 25, color);
  mono(c, passage.score, x + 134, y + 32, 25, color);
}

function searchOrder(c, { cue, after }) {
  const region = 'EU';
  const [globalTop] = M.ranks;
  const readable = M.ranks.filter((passage) => passage.region === region);
  const postfiltered = M.ranked(false);
  const prefiltered = M.ranked(true);
  const tookGlobalTop = after(3, 'takes the global top one');
  const toCheck = A.ease(cue(4, 'That order leaves zero results', 1));
  const checked = toCheck === 1 && after(4, 'That order leaves zero results');
  const replay = after(4, 'Filter by the server’s region grant first');
  const toReturn = A.ease(after(4, 'Now EU A takes the slot', 0.8));

  folio(c, 54, 42, 1092, 550, white, navy);
  heading(c, region + ' CALLER   /   ONE SLOT', 'When does search check access?', 88, 82, 1000);
  line(c, 88, 159, 1109, 159, '#b5ae95');
  line(c, 378, 187, 378, 558, '#b5ae95');
  txt(c, 'Passage', 91, 223, 24, muted);
  txt(c, 'Score', 267, 223, 24, muted);
  M.ranks.forEach((passage, i) => {
    const y = 249 + i * 91;
    rect(c, 89, y, 251, 62, paper);
    mono(c, passage.id, 105, y + 41, 31, navy);
    mono(c, passage.score, 285, y + 41, 31, navy);
  });

  txt(c, 'Take one, then filter', 410, 215, 33, ink, 'Serif');
  txt(c, 'Global top one', 411, 254, 23, muted);
  txt(c, region + ' access check', 717, 254, 23, muted);
  txt(c, 'Returned', 943, 254, 23, muted);
  rect(c, 410, 271, 169, 47, '#eee2c680');
  rect(c, 942, 271, 169, 47, checked ? pink : '#eee2c680');
  line(c, 584, 295, 869, 295, '#a8aa93', 2);
  line(c, 876, 268, 876, 322, checked ? red : muted, 4);
  if (tookGlobalTop) {
    const x = 410 + toCheck * 290;
    passageCard(c, globalTop, x, 271, checked ? pink : paper, checked ? red : navy);
  }
  if (checked) {
    txt(c, globalTop.region + ' access only', 700, 352, 23, red);
    txt(c, postfiltered.length + ' results', 958, 303, 24, red, 'Sans', 700);
  }

  if (!replay) return;
  line(c, 410, 374, 1109, 374, '#b5ae95');
  txt(c, 'Filter, then take one', 410, 413, 33, ink, 'Serif');
  txt(c, region + ' passages', 411, 448, 23, muted);
  txt(c, 'Returned', 943, 448, 23, muted);
  rect(c, 942, 460, 169, 47, '#eee2c680');
  line(c, 584, 484, 935, 484, '#a8aa93', 2);
  readable.forEach((passage, i) => {
    const selected = passage === prefiltered[0];
    const x = 410 + (selected ? toReturn * 532 : 0);
    const returned = selected && toReturn === 1;
    passageCard(c, passage, x, 460 + i * 57, returned ? pale : paper, returned ? teal : navy);
  });
  if (toReturn === 1)
    txt(c, prefiltered.length + ' result', 943, 544, 24, teal, 'Sans', 700);
}

export function access(c, { b, cue, after }) {
  base(c, 'green');
  if (b < 3) {
    const region = cue(1, 'An EU caller') ? 'EU' : 'US',
      rows = M.readable(M.original, region);
    fold(c, 59, 98, 349, 340, blue);
    label(c, 'AUTHENTICATED PRINCIPAL', 85, 139, navy);
    txt(c, region, 83, 265, 99, navy, 'Serif');
    txt(c, 'read grant', 86, 321, 36, ink, 'Serif');
    mono(c, 'server-resolved', 85, 393, 21, teal);
    folio(c, 476, 69, 650, 442, white, navy);
    heading(c, 'FILTER BEFORE SCORING', 'Readable shelf', 510, 115, 565);
    rows.forEach((r, i) => {
      band(c, r.record.document_id, 510, 221 + i * 78, 528);
    });
    txt(c, rows.length + ' readable policies', 510, 444, 36, rows.length ? teal : red, 'Serif');
    if (b === 2)
      band(c, 'Search   •   source fetch   •   cache   •   citation', 180, 550, 830, navy, blue);
  } else {
    searchOrder(c, { cue, after });
  }
}
export function retrieval(c, { b, cue }) {
  base(c, 'linen');
  folio(c, 54, 40, 1090, 240, white, navy);
  label(c, 'ACCESS POLICY   /   FIRST SENTENCE', 89, 87, teal);
  para(c, M.policy, 89, 151, 1009, 41, 49);
  const alt = Boolean(cue(3, 'change the wording')),
    q = alt ? M.PARAPHRASE : M.SUPPORT_QUESTION;
  const hits = M.sharedTerms(q, M.policy);
  const p = alt
    ? cue(3, 'Compare the two word lists', 1.6)
    : cue(1, 'Run across the eight terms', 2);
  const n = Math.floor(p * M.termTiles.length);
  const seen = M.termTiles.slice(0, n).filter((t) => hits.includes(t));
  rect(c, 54, 300, 1090, 90, navy);
  M.termTiles.forEach((word, i) => {
    const x = 67 + i * 133;
    rect(c, x, 318, 121, 54, i < n ? (hits.includes(word) ? pale : pink) : paper);
    txt(c, word, x + 6, 352, 21, ink, 'Mono', 400, 109);
  });
  leaf(c, 54, 411, 760, 202, white);
  label(c, alt ? 'REVIEWED PARAPHRASE' : 'SUPPORT QUESTION', 84, 451, teal);
  para(c, q, 84, 496, 700, 29, 37);
  leaf(c, 839, 411, 304, 202, white);
  label(c, 'CANDIDATE MINIMUM   2', 862, 451);
  txt(c, seen.length + ' matched', 860, 517, 40, ink, 'Serif');
  label(c, n + ' of ' + M.termTiles.length + ' scanned', 864, 553);
  if (alt ? cue(3, 'Zero matches') : b >= 2)
    stamp(
      c,
      hits.length >= 2 ? 'Keep passage' : 'No candidate',
      859,
      565,
      260,
      hits.length ? green : red,
    );
}
export function support(c, { b, cue, after }) {
  base(c, 'blue');
  if (b <= 4) {
    folio(c, 65, 49, 1069, 525, white, navy);
    label(c, 'PUBLISHED POLICY', 101, 94, teal);
    para(c, M.policy, 101, 148, 996, 34, 42);
    const insertion = A.ease(cue(2, 'slip the word', 0.85));
    const inserted = insertion > 0,
      draft = inserted ? M.negated : M.policy,
      j = M.overlap(draft);
    line(c, 101, 220, 1092, 220, '#b8b69e');
    label(c, 'PROPOSED CLAIM', 101, 259, inserted ? red : navy);
    const [firstLine, lastWord] = [M.policy.slice(0, -'verification.'.length), 'verification.'];
    const split = firstLine.indexOf(' be restored');
    const prefix = firstLine.slice(0, split), suffix = firstLine.slice(split);
    A.font(c, 34, 'Serif');
    const prefixWidth = c.measureText(prefix).width;
    const wordWidth = c.measureText(' not').width;
    const insertionX = 101 + prefixWidth;
    txt(c, prefix, 101, 311, 34, ink, 'Serif');
    txt(c, suffix, insertionX + wordWidth * insertion, 311, 34, ink, 'Serif');
    txt(c, lastWord, 101, 353, 34, ink, 'Serif');
    if (inserted) {
      c.save();
      c.globalAlpha = insertion;
      const tokenY = 311 - 45 * (1 - insertion);
      txt(c, ' not', insertionX, tokenY, 34, red, 'Serif');
      const spaceWidth = c.measureText(' ').width;
      line(c, insertionX + spaceWidth, tokenY + 10, insertionX + wordWidth, tokenY + 10, red, 4);
      c.restore();
    }
    if (cue(1, 'Divide the number')) {
      const counted = inserted
        ? after(2, 'nine distinct terms between the two sentences')
        : after(2, 'eight over eight is one');
      label(c, 'SHARED DISTINCT TERMS   /   ALL DISTINCT TERMS', 103, 407);
      const shared = counted || inserted ? j.matched.length : '?';
      txt(c, shared + ' / ' + (counted ? j.union.length : '?'), 101, 484, 60, navy, 'Serif');
      if (after(3, 'J is above point eight')) mono(c, 'accept if J > 0.8', 376, 478, 26);
      if (inserted && counted) mono(c, '+1 distinct term', 103, 529, 22, muted);
    }
    if (after(4, 'The shortcut accepts it'))
      stamp(c, j.passes ? 'Shortcut accepts' : 'Shortcut rejects', 765, 439, 310, red);
    if (after(4, 'point eight eight nine')) mono(c, 'J ≈ ' + j.score.toFixed(3), 770, 521, 24, red);
    if (after(4, 'reverses that permission'))
      mono(c, 'Permission reversed', 376, 529, 22, red);
  } else {
    folio(c, 56, 48, 1086, 542, white, teal);
    heading(c, 'EXACT QUESTION + PASSAGE', 'Review lookup', 89, 88, 968);
    const entries = [
      ['entailed', 'A matching review'],
      ['contradicted', 'A contradicted review'],
      ['unknown', 'An unknown judgment'],
      ['missing', 'A missing receipt'],
      ['stale', 'A stale receipt'],
    ];
    entries.forEach(([key, phrase], i) => {
      const y = 202 + i * 66,
        r = M.answer(M.SUPPORT_QUESTION, M.SUPPORT_PASSAGE, M.supportVariants[key]);
      if (!cue(5, phrase)) return;
      rect(c, 89, y - 28, 1000, 53, r.bound && r.status === 'ANSWER' ? pale : paper);
      txt(c, key, 109, y + 8, 25, ink, 'Serif');
      mono(
        c,
        key === 'missing'
          ? 'no receipt'
          : key === 'stale'
            ? 'wrong corpus version'
            : 'matches question + passage',
        347,
        y + 6,
        20,
        muted,
        400,
      );
      txt(
        c,
        r.status.toLowerCase(),
        854,
        y + 7,
        24,
        r.status === 'ANSWER' ? teal : red,
        'Sans',
        700,
      );
    });
    if (b === 6) label(c, 'Supplied judgments need an evaluated review process.', 92, 555, teal);
  }
}
