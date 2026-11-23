import assert from 'node:assert/strict';
import { freshContract, typedGate } from '../../../films/instruction-masking/arithmetic.mjs';
import { budget } from './targets.mjs';
import {
  C,
  rect,
  txt,
  line,
  circle,
  arrow,
  top,
  micro,
  note,
  tape,
  table,
  bracket,
  tag,
  cue,
  gauge,
  dataRow,
  fmtLabel,
  activeColor,
} from './studio.mjs';

const manifest = ['access-policy-sft-v3', 'tokens-7', 'chatml-policy-v2', false];
const different = [manifest[0], manifest[1], 'mistral-wrapper-v1', true];
const diffs = (a, b) => a.flatMap((value, i) => (value === b[i] ? [] : [i]));
function parity(g, k) {
  const b = k.beat.beatIndex;
  top(
    g,
    k,
    'SERVING  /  INPUT PARITY',
    b === 0
      ? 'Can this deployment enter evaluation?'
      : b === 1
        ? 'Where would you look first?'
        : 'Compare the hosted request',
  );
  if (!b) {
    const drift = cue(k, 0, 'drifted candidate') > 0,
      actual = drift ? different : manifest,
      changed = diffs(manifest, actual);
    table(
      g,
      ['Setting', 'Training', 'Candidate'],
      ['Checkpoint', 'Tokenizer', 'Template', 'Add specials again'].map((name, i) => [
        name,
        String(manifest[i]),
        String(actual[i]),
      ]),
      {
        y: 186,
        rowH: 71,
        fractions: [0.29, 0.35, 0.36],
        colors: (r, c) => (c === 2 && changed.includes(r) ? C.red : C.ink),
      },
    );
    note(
      g,
      changed.length
        ? changed.length + ' settings differ. Hold for input repair.'
        : 'The manifests match. Evaluate the answers next.',
      575,
      changed.length ? C.red : C.teal,
    );
    return;
  }
  if (b === 1) {
    const cases = [
      ['Unexpected user turn', 'inspect the assistant-start cue'],
      ['Doubled BOS or EOS', 'count IDs on the actual path'],
      ['Long-thread failure', 'locate the retained policy evidence'],
      ['Rambling after an answer', 'compare the ending with the stop set'],
    ];
    const shown =
      1 +
      Number(cue(k, 1, 'doubled beginning') > 0) +
      Number(cue(k, 1, 'long-thread failure') > 0) +
      Number(cue(k, 1, 'correct answer') > 0);
    table(g, ['Symptom', 'First inspection'], cases.slice(0, shown), {
      y: 210,
      rowH: 78,
      fractions: [0.43, 0.57],
    });
    return;
  }
  table(
    g,
    ['Request record', 'What to compare'],
    [
      ['Body', 'messages, tools, controls'],
      ['Usage', 'reported input token counts'],
      ['Held-out answer', 'same evidence and decoding settings'],
    ],
    { y: 215, rowH: 89, fractions: [0.34, 0.66] },
  );
  note(g, 'Assess answer quality after accounting for input differences.', 580);
}
const candidates = [
  { parity: true, rate: 0.99, critical: 0, latency: 620 },
  { parity: true, rate: 0.94, critical: 1, latency: 410 },
];
const invalid = [
  { ...candidates[0], rate: NaN },
  { ...candidates[0], rate: true },
  { ...candidates[0], parity: 'yes' },
];
function release(g, k) {
  const b = k.beat.beatIndex;
  top(
    g,
    k,
    'EVALUATION  /  ILLUSTRATIVE GATE',
    b === 4
      ? 'What remains to review?'
      : b >= 2
        ? 'Do the raw values meet the metric contract?'
        : 'Which candidate clears the sample gate?',
  );
  if (b === 4) {
    const n = 100;
    micro(g, 'CANDIDATE A   /   100 HELD-OUT CASES', 60, 202);
    for (let i = 0; i < n; i++) {
      const x = 69 + (i % 20) * 31,
        y = 251 + Math.floor(i / 20) * 43;
      circle(g, x, y, 10, i < Math.round(n * candidates[0].rate) ? C.teal : C.red);
    }
    txt(g, '1 answer', 764, 304, 50, C.red, 'left', 'Serif');
    txt(g, 'lacked support', 764, 361, 28);
    note(g, 'Trace that answer back to its request and policy evidence.', 556);
    return;
  }
  if (b >= 2) {
    table(
      g,
      ['Parity', 'Rate', 'Critical', 'p95 ms', 'Validation'],
      invalid.map((obj) => [
        typeof obj.parity === 'string' ? '"' + obj.parity + '"' : String(obj.parity),
        String(obj.rate),
        obj.critical,
        obj.latency,
        typedGate(obj).reason,
      ]),
      {
        y: 216,
        rowH: 85,
        fractions: [0.17, 0.16, 0.17, 0.17, 0.33],
        colors: (r, c) => (c === 4 ? C.red : C.ink),
      },
    );
    note(g, 'Validate types and finite ranges before testing the thresholds.', 565);
    return;
  }
  micro(
    g,
    '100 CASES EACH    /    PARITY TRUE    /    RATE ≥ 0.98    /    CRITICAL = 0    /    P95 ≤ 700 MS',
    57,
    209,
  );
  const decided = b === 0 ? cue(k, 0, 'It can proceed', 0) : cue(k, 1, 'Its grounded rate', 0);
  const verdicts = candidates
    .slice(0, b + 1)
    .map((candidate, i) =>
      i === b && !decided ? '?' : typedGate(candidate).pass ? 'proceed' : 'hold',
    );
  table(
    g,
    ['Candidate', 'Grounded', 'Critical', 'p95', 'Decision'],
    candidates
      .slice(0, b + 1)
      .map((r, i) => [
        ['A', 'B'][i],
        Math.round(100 * r.rate) + '%',
        r.critical,
        r.latency + ' ms',
        verdicts[i],
      ]),
    {
      y: 260,
      rowH: 91,
      fractions: [0.22, 0.22, 0.18, 0.18, 0.2],
      colors: (r, c) => {
        if (c !== 4 || verdicts[r] === '?') return C.ink;
        return verdicts[r] === 'proceed' ? C.teal : C.red;
      },
    },
  );
  note(
    g,
    b && decided
      ? '94% is below the 98% floor, and one critical error exceeds the limit of zero.'
      : 'Each threshold applies to the same set of evaluated cases.',
    575,
  );
}
function decoderState(added, travel) {
  const emitted = freshContract(true, true).ids.at(-2);
  const stopIds = added ? [42, 23] : [42],
    match = stopIds.includes(emitted);
  const gate = 683,
    start = 190,
    exit = 1050;
  const x = match ? start + (gate - start) * travel : start + (exit - start) * travel;
  return { emitted, stopIds, match, x, gate, decided: travel === 1 };
}
function decoder(g, k) {
  const added = cue(k, 8, 'Add twenty-three') > 0,
    travel = added
      ? cue(k, 8, 'Replay the same emission', 1.05)
      : cue(k, 8, 'decoder asks for another token', 1.05);
  const d = decoderState(added, travel);
  top(g, k, 'SERVING  /  REPLAY', 'Does this emission stop generation?');
  const row = freshContract(true, true);
  micro(g, 'GENERATED REPLY', 58, 190);
  tape(g, row.words.slice(3, -1), 219, {
    x: 58,
    w: 405,
    ids: row.ids.slice(3, -1),
    h: 80,
    number: false,
    fill: () => C.sea,
  });
  micro(g, 'SERVER STOP SET', 589, 190);
  d.stopIds.forEach((id, i) => {
    rect(g, 593 + i * 98, 228, 85, 62, id === d.emitted ? C.sea : C.white, C.ink, 2);
    txt(g, id, 635 + i * 98, 260, 35, C.ink, 'center', 'Mono');
  });
  const bankX = added ? 684 : 635;
  line(g, bankX, 291, bankX, 315, C.ink, 3);
  line(g, bankX, 315, d.gate, 315, C.ink, 3);
  line(g, d.gate, 315, d.gate, 363, C.ink, 3);
  line(g, 155, 392, 1088, 392, C.rule, 9);
  if (added) {
    circle(g, 1050, 392, 29, C.paper, C.rule, 2);
    txt(g, d.emitted, 1050, 392, 23, C.dim, 'center', 'Mono');
    txt(g, 'First pass at {42}', 1050, 459, 18, C.dim, 'center');
    txt(g, 'continued', 1050, 489, 21, C.dim, 'center', 'Serif');
  }
  line(g, d.gate, 355, d.gate, 429, d.match && d.decided ? C.teal : C.ink, 6);
  txt(g, 'Membership check', d.gate, 455, 23, C.dim, 'center');
  circle(g, d.x, 392, 33, C.gold, C.ink, 3);
  txt(g, d.emitted, d.x, 393, 26, C.ink, 'center', 'Mono', 600);
  if (d.decided) {
    tag(
      g,
      d.match ? 'MATCH' : 'MISS',
      d.match ? d.gate - 52 : 995,
      489,
      105,
      d.match ? C.teal : C.red,
    );
    note(
      g,
      d.match ? 'Return “Yes indeed”.' : 'Request the next token.',
      585,
      d.match ? C.teal : C.ink,
    );
  } else
    note(
      g,
      added
        ? 'Replay the same emitted ID against the revised set.'
        : 'There is room for another token. Compare 23 with the stop set.',
      585,
    );
}
function practice(g, k) {
  const b = k.beat.beatIndex;
  if (b >= 7) {
    decoder(g, k);
    return;
  }
  if (b === 3 || b === 4) {
    top(g, k, 'FINAL PRACTICE  /  CONTEXT BUDGET', 'Can the served conversation fit?');
    const removed = cue(k, 4, 'Remove that whole exchange') > 0;
    budget(g, { prompt: 970 - (removed ? 45 : 0), reserve: 96, limit: 1024 });
    if (b === 4)
      micro(
        g,
        removed
          ? '45-TOKEN EXCHANGE REMOVED   /   REQUIRED EVIDENCE KEPT'
          : 'REMOVABLE OLD EXCHANGE   /   45 TOKENS',
        65,
        615,
      );
    return;
  }
  const repaired = cue(k, 2, 'Put nineteen') > 0,
    longer = cue(k, 5, 'one word') > 0,
    solved = cue(k, 6, 'Position four') > 0;
  const row = freshContract(repaired, longer);
  top(
    g,
    k,
    'FINAL PRACTICE  /  ONE SHIFT',
    b < 3
      ? 'Find the faulty predictor label'
      : longer
        ? 'Which word predicts the moved ending?'
        : 'Extend the reply by one word',
  );
  const r = tape(g, row.words, 223, {
    x: 246,
    w: 890,
    ids: row.ids,
    fill: (i) => (row.membership[i] ? C.sea : C.white),
  });
  dataRow(g, 'Valid', row.valid, r, 369);
  dataRow(g, 'In reply', row.membership, r, 416);
  const labels = row.words.map((_, i) => {
    if (i === row.words.length - 1) return '—';
    if (longer && !solved && i >= 3) return '?';
    return fmtLabel(row.labels[i]);
  });
  dataRow(g, 'Next label', labels, r, 493, {
    size: 31,
    color: (i) => (labels[i] === '?' ? C.dim : activeColor(row.labels[i])),
  });
  if ((b === 2 && repaired) || solved) {
    const pos = solved ? row.words.indexOf('EOS') - 1 : 2;
    line(g, r.at(pos) - 33, 520, r.at(pos) + 33, 520, C.teal, 4);
  }
  note(
    g,
    b < 2
      ? 'Each label on the bottom track belongs to the predictor above it.'
      : b === 2
        ? repaired
          ? 'The header predicts Yes. Yes predicts EOS.'
          : 'Which predictor needs a new label?'
        : solved
          ? 'Indeed predicts EOS. The prediction leading into PAD stays ignored.'
          : longer
            ? 'Find the new predictor of the genuine EOS.'
            : 'Yes predicts the original EOS.',
    584,
  );
}
export const serving = [parity, release, practice];
export function checkServing() {
  assert.deepEqual(diffs(manifest, different), [2, 3]);
  assert.deepEqual(
    candidates.map((r) => typedGate(r).pass),
    [true, false],
  );
  assert.deepEqual(
    invalid.map((r) => typedGate(r).pass),
    [false, false, false],
  );
  assert.deepEqual(freshContract(false).labels, [-100, -100, -100, 23, -100]);
  assert.deepEqual(freshContract(true).labels, [-100, -100, 19, 23, -100]);
  assert.deepEqual(freshContract(true, true).labels, [-100, -100, 19, 31, 23, -100]);
  assert.equal(970 + 96 - 1024, 42);
  assert.equal(1024 - (970 - 45 + 96), 3);
  const miss = decoderState(false, 1),
    hit = decoderState(true, 1);
  assert.equal(miss.emitted, hit.emitted);
  assert.deepEqual([miss.emitted, miss.match, hit.match], [23, false, true]);
  assert.ok(miss.x > miss.gate);
  assert.equal(hit.x, hit.gate);
}
