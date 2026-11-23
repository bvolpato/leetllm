import { DOMAIN_DOCUMENTS, PACKED_DOCUMENTS } from '../../../films/continued-pretraining/fixtures.mjs';
import {
  checkpointTokenize,
  groupedSplit,
  manifestAdmission,
  normalizedFingerprint,
  packedCorpus,
} from '../../../films/continued-pretraining/model.mjs';
import {
  C,
  base,
  beat,
  cue,
  ease,
  clamp,
  mix,
  rect,
  line,
  text,
  mono,
  serif,
  sheet,
  chip,
  heading,
  arrow,
  rows,
} from './studio.mjs';

const evaluationSentence = 'The reef shelters young fish.';

export function screening(d, held) {
  if (d.boilerplate) return 'boilerplate';
  if (d.corrupt) return 'corrupt extraction';
  if (!d.licensed) return 'training rights absent';
  if (d.id === 'D2') return 'near-duplicate of D1';
  if (
    held &&
    normalizedFingerprint(d.text) === normalizedFingerprint(evaluationSentence)
  )
    return 'matches held-out E1';
  return 'retain';
}
export function clean(g, k) {
  base(g);
  heading(g, 'FIELD COLLECTION   /   SOURCE REVISION 1', 'Which sentences reach the tokenizer?');
  const b = beat(k),
    drop = cue(k, 1, 'Remove boilerplate'),
    held = cue(k, 2, 'check for overlap');
  DOMAIN_DOCUMENTS.forEach((d, i) => {
    const reason = screening(d, held);
    const y = 273 + i * 94;
    line(g, 104, y + 76, 1800, y + 76, C.rule, 2);
    mono(g, d.id, 113, y + 53, 38, C.sea);
    serif(g, d.text, 289, y + 53, 43);
    if (b === 2 && !held && reason === 'retain') {
      text(g, 'Check against E1', 1360, y + 53, 32, C.muted);
    } else if (drop) {
      text(g, reason, 1360, y + 53, 32, reason === 'retain' ? C.forest : C.clay);
    }
  });
  if (b === 2) {
    rect(g, 104, 833, 1696, 80, C.leaf);
    mono(g, 'E1', 113, 889, 38, C.sea);
    serif(g, evaluationSentence, 289, 889, 43);
    text(g, 'Held out for evaluation', 1360, 889, 32, C.muted);
  } else if (b === 3) {
    const parts = checkpointTokenize(DOMAIN_DOCUMENTS[0].text);
    mono(g, 'D1', 106, 958, 35, C.sea);
    parts.forEach((v, i) => chip(g, v.trim(), 225 + i * 195, 894, 180, 86, C.pale));
  }
}
export const families = [
  ['auth-docs-v3', 2],
  ['webhook-runbooks', 2],
  ['sdk-notes', 1],
  ['payments-api', 1],
];
export function grouping(g, k) {
  base(g);
  heading(g, 'GROUP SPLIT   /   SHA-256(group) mod 4', 'Give revisions a common destination');
  const buckets = cue(k, 1, 'take the remainder'),
    train = cue(k, 3, 'auth and S D K groups'),
    validation = cue(k, 3, 'Payments and webhooks');
  text(g, 'Revision family', 119, 326, 35, C.muted);
  text(g, 'Bucket', 937, 326, 35, C.muted);
  text(g, 'Destination', 1390, 326, 35, C.muted);
  families.forEach(([id, n], i) => {
    const v = groupedSplit(id),
      y = 365 + i * 130;
    if (n > 1) sheet(g, 144, y - 8, 598, 94, '#ded9c4');
    sheet(g, 121, y, 598, 94);
    mono(g, id, 155, y + 58, 37);
    mono(g, '×' + n, 683, y + 56, 33, C.sea, 'right');
    if (buckets) chip(g, v.bucket, 945, y, 120, 91, C.sun);
    if (v.bucket ? train : validation) {
      arrow(g, 1100, y + 43, 1333, y + 43);
      serif(g, v.split, 1380, y + 58, 52, v.bucket ? C.sea : C.clay);
    }
  });
  text(
    g,
    validation
      ? '2 of 4 groups go to validation in this small sample.'
      : 'Bucket zero is reserved for validation.',
    120,
    958,
    42,
    C.muted,
  );
}
export const manifest = [
  ['public API docs', true, true, false, 800000],
  ['on-call notes', true, false, false, 120000],
  ['held-out probes', true, true, true, 25000],
  ['vendor export', false, true, false, 300000],
].map(([id, rights, scrubbed, evalOnly, tokens]) => ({ id, rights, scrubbed, evalOnly, tokens }));
export function admit(g, k) {
  base(g);
  const b = beat(k);
  if (b === 3) {
    heading(g, 'MANIFEST READER', 'Type-check the recorded decision');
    const baseRow = manifest[0],
      cases = [{ ...baseRow, scrubbed: 'true' }, { ...baseRow, tokens: true }, baseRow];
    const ready = cue(k, 3, 'Put quotation marks'),
      count = cue(k, 3, 'The boolean true');
    rows(
      g,
      ['Field', 'Type', 'Admission'],
      cases.map((r, i) => [
        ['scrubbed = "true"', 'tokens = True', 'tokens = 800000'][i],
        ['string', 'boolean', 'integer'][i],
        (i === 0 ? ready : count) ? manifestAdmission(r).reason : '…',
      ]),
      { dy: 147 },
    );
    return;
  }
  heading(g, 'CORPUS MANIFEST', 'Follow one source through all three checks');
  const clear = cue(k, 2, 'Only the public');
  rows(
    g,
    ['Source', 'Rights', 'Scrubbed', 'Eval only', 'Tokens', 'Decision'],
    manifest.map((r) => [
      r.id,
      String(r.rights),
      String(r.scrubbed),
      String(r.evalOnly),
      r.tokens.toLocaleString('en-US'),
      clear ? manifestAdmission(r).reason : '…',
    ]),
    { widths: [0.23, 0.12, 0.13, 0.13, 0.15, 0.24], dy: 112 },
  );
  if (clear)
    serif(
      g,
      'Admitted for training   ' +
        manifest
          .filter((r) => manifestAdmission(r).pass)
          .reduce((s, r) => s + r.tokens, 0)
          .toLocaleString('en-US') +
        ' tokens',
      115,
      909,
      62,
      C.sea,
    );
  if (b === 4)
    text(
      g,
      'Source revision, access, date and language stay with the admitted tokens.',
      115,
      985,
      34,
      C.muted,
    );
}
export const heldout = 'AUTH_TIMEOUT: token exchange exceeded 2s. Retry with jitter.';
export const candidate = '  auth_timeout: TOKEN exchange exceeded 2s. retry with jitter. ';
export function overlap(g, k) {
  base(g);
  const b = beat(k);
  heading(
    g,
    'EVALUATION ISOLATION',
    b === 3
      ? 'Carry the decision back to the field notes'
      : 'Would an exact-text screen find the copy?',
  );
  if (b === 3) {
    [DOMAIN_DOCUMENTS[0], DOMAIN_DOCUMENTS[5]].forEach((d, i) => {
      sheet(g, 130, 330 + i * 266, 1650, 190);
      mono(g, d.id, 177, 412 + i * 266, 49, C.sea);
      serif(g, d.text, 320, 417 + i * 266, 54);
      text(
        g,
        i ? 'Held out with E1' : 'Retain original text for tokenization',
        320,
        482 + i * 266,
        34,
        i ? C.clay : C.forest,
      );
    });
    return;
  }
  if (b === 2) {
    const p1 = 'ID',
      p2 = 'id',
      excerpt = 'Retry with jitter.';
    const same = (a, b) => normalizedFingerprint(a) === normalizedFingerprint(b);
    rows(
      g,
      ['Pair', 'Normalized hash', 'What the screen misses'],
      [
        [p1 + '  /  ' + p2, same(p1, p2) ? 'Equal' : 'Different', 'Case may distinguish services'],
        ['Runbook  /  one sentence', same(heldout, excerpt) ? 'Equal' : 'Different', excerpt],
      ],
      { dy: 155, widths: [0.31, 0.25, 0.44] },
    );
    serif(g, 'Read ambiguous matches in context.', 109, 817, 63, C.sea);
    text(
      g,
      'Use revision families and near-duplicate screening for partial copies.',
      109,
      929,
      40,
      C.muted,
    );
    return;
  }
  [heldout, candidate].forEach((v, i) => {
    const y = 315 + i * 227;
    sheet(g, 110, y, 1699, 201);
    text(
      g,
      i ? 'Candidate training text' : 'Held-out runbook',
      149,
      y + 54,
      32,
      i ? C.clay : C.sea,
    );
    mono(g, v, 150, y + 120, 33, C.ink, 'left', 1620);
    if (cue(k, 1, 'Hash the result'))
      mono(
        g,
        'normalized SHA-256   ' + normalizedFingerprint(v).slice(0, 16) + '…',
        149,
        y + 174,
        30,
        C.muted,
      );
  });
  if (cue(k, 1, 'Drop that candidate'))
    serif(g, 'Same fingerprint. Exclude the candidate.', 115, 860, 60, C.clay);
  if (b === 2)
    text(
      g,
      'Partial copies can escape. Case folding can merge distinct identifiers.',
      118,
      949,
      38,
      C.muted,
    );
}
const owners = [C.pale, C.sun, '#ced4e3', C.rose];
const packingIds = PACKED_DOCUMENTS.map((_, i) => 'P' + (i + 1));
export const packingTokens = packedCorpus().stream.map(({ token, index, source }) => ({
  token, index, source, owner: packingIds[source],
}));
export const canAttend = (query, key, isolated) =>
  key <= query && (!isolated || packingTokens[query].owner === packingTokens[key].owner);
export function packingState(k) {
  const first = cue(k, 2, 'Fill the first six slots', 2.0);
  const second = cue(k, 2, 'Fill the next six slots', 2.0);
  const tail = cue(k, 3, 'Carry the last two tokens', 1.35);
  const markers = cue(k, 1, 'Append a zero', 0.85);
  return packingTokens.map((v, i) => {
    const q = i < 6 ? clamp(6 * first - i) : i < 12 ? clamp(6 * second - (i - 6)) : tail;
    const t = ease(q),
      row = Math.floor(i / 6),
      col = i % 6;
    const x = mix(192 + v.index * 113, 1030 + col * 118, t);
    const y = mix(354 + v.source * 144, 366 + row * 209, t) - 85 * Math.sin(t * Math.PI);
    return { ...v, x, y, q, visible: v.token !== 0 || markers * 4 > v.source };
  });
}
export function pack(g, k) {
  base(g);
  const b = beat(k);
  if (b === 4) {
    const isolated = cue(k, 4, 'restrict attention'),
      tokens = packingTokens.slice(0, 6);
    heading(g, 'PACKING SAMPLE   /   BLOCK 1', 'Which positions can token 21 read?');
    tokens.forEach((v, i) => {
      const y = 372 + i * 73;
      mono(g, v.owner, 94, y + 49, 29, C.muted);
      mono(g, v.token, 205, y + 49, 31, C.ink, 'right');
      mono(g, v.token, 268 + i * 84, 333, 31, C.ink, 'center');
      tokens.forEach((_, j) =>
        rect(
          g,
          232 + j * 84,
          y,
          72,
          61,
          canAttend(i, j, isolated) ? C.sea : '#dcdacb',
          3,
        ),
      );
    });
    mono(g, 'keys →', 438, 278, 29, C.sea);
    serif(g, isolated ? 'Same-document context' : 'Ordinary causal context', 898, 388, 57);
    text(
      g,
      isolated ? 'Token 21 starts P2. It can read only itself.' : 'Token 21 in P2 can read P1 across the zero.',
      900,
      470,
      40,
    );
    const mask = cue(k, 4, 'mask the target pairs');
    text(
      g,
      mask ? 'Skip the cross-document target 0 → 21.' : 'Six positions give five shifted targets.',
      900,
      595,
      40,
      mask ? C.clay : C.ink,
    );
    const carry = packingTokens.slice(12);
    text(g, 'Next packing call   /   ' + carry[0].owner, 900, 754, 35, C.muted);
    carry.forEach((v, i) => chip(g, v.token, 900 + 147 * i, 794, 128, 88, owners[v.source]));
    return;
  }
  heading(g, 'SEPARATE PACKING SAMPLE   /   FOUR ELIGIBLE DOCUMENTS', 'Where does the last document go?');
  const state = packingState(k);
  packingIds.forEach((v, i) => mono(g, v, 103, 408 + 144 * i, 36, C.muted));
  ['First block', 'Second block', 'Next call · carry'].forEach((name, i) => {
    text(g, name, 1029, 334 + i * 209, 36, i === 2 ? C.clay : C.muted);
    for (let j = 0; j < 6; j++) rect(g, 1027 + j * 118, 362 + i * 209, 107, 90, '#dfdece', 8);
  });
  state
    .filter((v) => v.visible)
    .forEach((v) => chip(g, v.token, v.x, v.y, 101, 82, owners[v.source], C.ink, 40));
  const packed = state.slice(0, 12).filter((v) => v.q === 1).length,
    carried = state.slice(12).filter((v) => v.q === 1).length;
  mono(g, 'Positions  ' + state.filter((v) => v.visible).length, 108, 980, 35, C.ink);
  if (b > 1) mono(g, 'Packed  ' + packed + '     Carried  ' + carried, 1029, 980, 35, C.ink);
}
