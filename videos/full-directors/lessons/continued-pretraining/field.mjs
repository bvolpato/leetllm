import { plate } from './field-plates.mjs';
import {
  adaptationSnapshot,
  checkpointTokenize,
} from '../../../films/continued-pretraining/model.mjs';
import { DOMAIN_DOCUMENTS } from '../../../films/continued-pretraining/fixtures.mjs';
import {
  C,
  base,
  beat,
  cue,
  rect,
  line,
  circle,
  poly,
  text,
  mono,
  serif,
  percent,
  sheet,
  chip,
  heading,
  arrow,
  rows,
  ease,
} from './studio.mjs';

function fieldPage(g, i, open, model, loss, coverMark = 1) {
  const x = 64 + i * 910,
    y = 72,
    w = 880,
    ink = i ? C.clay : C.sea;
  sheet(g, x, y, w, 568);
  g.drawImage(plate(i ? 'tree' : 'reef'), x + 20, y + 20, 265, 292);
  text(g, i ? 'PARK OBSERVATION' : 'DIVE JOURNAL', x + 320, y + 75, 28, ink, 'Mono');
  serif(g, i ? 'The robin nests' : 'The tide rises', x + 320, y + 165, 62);
  serif(g, i ? 'in the' : 'near the', x + 320, y + 245, 62);
  const slot = x + 320;
  line(g, x + 48, y + 479, x + w - 48, y + 479, C.rule, 2);
  serif(g, i ? 'tree.' : 'reef.', slot, y + 409, 100, ink);
  if (open < 1) {
    g.save();
    g.beginPath();
    g.rect(x, y, w, 568);
    g.clip();
    const lift = ease(open);
    const sx = slot - 15 + 555 * lift,
      sy = y + 314 - 63 * lift;
    rect(g, sx + 3, sy + 6, 316, 117, '#4c503626', 3);
    rect(g, sx, sy, 316, 116, i ? '#d9c9b0' : '#d5d4b8', 3);
    line(g, sx + 33, sy + 79, sx + 33 + 202 * coverMark, sy + 79, '#927f60', 3);
    if (coverMark < 1) {
      const tip = sx + 33 + 202 * coverMark;
      poly(
        g,
        [
          [tip, sy + 79],
          [tip + 11, sy + 49],
          [tip + 31, sy + 63],
        ],
        C.ink,
      );
      poly(
        g,
        [
          [tip + 11, sy + 49],
          [tip + 83, sy - 54],
          [tip + 104, sy - 40],
          [tip + 31, sy + 63],
        ],
        C.gold,
      );
    }
    poly(
      g,
      [
        [sx + 278, sy],
        [sx + 316, sy + 32],
        [sx + 278, sy + 32],
      ],
      '#b4a98d',
    );
    g.restore();
  }
  text(g, i ? 'Held-out note' : 'Training note', x + 47, y + 535, 35, ink);
  if (loss)
    mono(
      g,
      'NLL  ' + (i ? model.broadLoss : model.domainLoss).toFixed(3) + ' nats',
      x + w - 40,
      y + 535,
      34,
      ink,
      'right',
    );
}
function dial(g, model) {
  const x = 960,
    y = 866,
    r = 164,
    theta = Math.PI * (2 - model.probabilities[0]);
  g.beginPath();
  g.arc(x, y, r, Math.PI, 2 * Math.PI);
  g.strokeStyle = C.gold;
  g.lineWidth = 18;
  g.stroke();
  for (let i = 0; i <= 20; i++) {
    const a = Math.PI * (1 + i / 20),
      len = i % 5 === 0 ? 30 : 13;
    line(
      g,
      x + (r - len) * Math.cos(a),
      y + (r - len) * Math.sin(a),
      x + (r - 5) * Math.cos(a),
      y + (r - 5) * Math.sin(a),
      C.ink,
      3,
    );
  }
  arrow(g, x, y, x + (r - 34) * Math.cos(theta), y + (r - 34) * Math.sin(theta), C.sea, 10);
  circle(g, x, y, 19, C.gold);
  mono(g, 'P(reef)', x, y + 53, 34, C.ink, 'center');
  mono(g, '1', x - r, y + 42, 32, C.sea, 'center');
  mono(g, '0', x + r, y + 42, 32, C.clay, 'center');
  const [reef, tree] = model.probabilities;
  serif(g, percent(reef), 385, 854, 98, C.sea, 'center');
  text(g, 'reef  ·  logit ' + model.logit.toFixed(2), 385, 927, 40, C.sea, 'Sans', 'center');
  serif(g, percent(tree), 1535, 854, 98, C.clay, 'center');
  text(g, 'tree  ·  logit 0.00', 1535, 927, 40, C.clay, 'Sans', 'center');
  mono(g, '½', x, y - r - 23, 27, C.muted, 'center');
}
export function notes(g, k, loss = false) {
  const q = loss ? cue(k, 4, 'Turn the reef score', 1.15) : cue(k, 3, 'Turn the dial', 1.15);
  const model = adaptationSnapshot(q);
  base(g, '#d4c6a8');
  const grad = g.createLinearGradient(0, 650, 0, 1080);
  grad.addColorStop(0, '#f8f1df');
  grad.addColorStop(1, '#e7dbc0');
  rect(g, 0, 667, 1920, 413, grad);
  fieldPage(
    g,
    0,
    loss ? 1 : cue(k, 2, 'The diver wrote reef', 0.8),
    model,
    loss,
    loss ? 1 : Math.min(1, k.elapsed / 1.4 + Number(beat(k) > 1)),
  );
  fieldPage(g, 1, loss ? 1 : cue(k, 2, 'A park note uses tree', 0.8), model, loss);
  dial(g, model);
}
export function teacherForcing(g, k) {
  if (beat(k) > 2) return notes(g, k, true);
  base(g);
  g.drawImage(plate('reef'), 0, 0, 550, 554);
  text(g, 'D1   /   checkpoint tokenizer', 610, 105, 36, C.sea, 'Mono');
  serif(g, 'The tide rises', 610, 251, 100);
  serif(g, 'near the reef.', 610, 387, 100);
  const parts = checkpointTokenize(DOMAIN_DOCUMENTS[0].text);
  const read = 5 + cue(k, 2, 'add the observed piece') + cue(k, 2, 'The period');
  const answered = cue(k, 2, 'First it predicts');
  text(g, 'Context', 96, 666, 37, C.sea);
  text(
    g,
    answered ? 'Next target' : 'Possible next pieces',
    1710,
    666,
    37,
    C.clay,
    'Sans',
    'right',
  );
  if (!answered) {
    parts.slice(0, 5).forEach((v, i) => chip(g, v.trim(), 100 + i * 215, 713, 200, 105, C.pale));
    ['ef', 're'].forEach((v, i) => chip(g, v, 1300 + i * 224, 713, 200, 105, C.leaf));
    serif(g, 'Which piece follows “the”?', 96, 987, 58);
    return;
  }
  parts.forEach((v, i) =>
    chip(
      g,
      v.trim(),
      100 + i * 215,
      713,
      200,
      105,
      i < read ? C.pale : i === read && answered ? C.sun : C.leaf,
      C.ink,
      41,
    ),
  );
  arrow(g, 115 + read * 215, 868, 285 + read * 215, 868, C.clay, 6);
  serif(
    g,
    answered ? 'Score P(' + parts[read].trim() + ' | context)' : 'Which piece follows “the”?',
    96,
    987,
    58,
  );
}

function pager(g, answer, supplied) {
  rect(g, 992, 240, 823, 514, C.night, 56);
  rect(g, 1032, 285, 743, 338, '#d6dfa7', 14);
  mono(g, '03:00   GATEWAY / AUTH_TIMEOUT', 1070, 354, 31, C.night);
  line(g, 1070, 384, 1739, 384, '#839270', 2);
  serif(g, answer ? 'Retry with jitter.' : '“Check the Wi-Fi.”', 1070, 495, 63, C.night);
  if (answer) text(g, 'Reuse the idempotency token.', 1070, 563, 41, C.night);
  rect(g, 1070, 668, 93, 33, '#b38c52', 17);
  rect(g, 1192, 668, 93, 33, '#b38c52', 17);
  text(g, supplied ? 'Excerpt supplied' : 'Base reply', 1727, 695, 31, C.light, 'Mono', 'right');
}
export function recipe(g, left = 'Base', right = 'Base + CPT') {
  const names = [left, right];
  names.forEach((v, i) => {
    const y = 382 + i * 197;
    chip(g, v, 105, y, 440, 112, i ? C.pale : C.leaf);
    arrow(g, 565, y + 55, 698, y + 55);
    chip(g, 'Same SFT', 725, y, 398, 112, C.sun);
    arrow(g, 1143, y + 55, 1260, y + 55);
    chip(g, 'Held-out incidents', 1285, y, 530, 112, C.leaf);
  });
  text(g, 'Match the runbook, prompt, decoding, cases and scoring.', 105, 888, 47, C.sea);
}
export function pairs(g, long) {
  const n = long ? 9 : 3;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      rect(g, 155 + j * 57, 316 + i * 57, 48, 48, i < 3 && j < 3 ? C.sea : C.gold, 4);
  serif(g, n + ' × ' + n + ' = ' + n * n, 810, 533, 100);
  text(g, 'dense attention score entries', 815, 620, 47, C.sea);
  text(
    g,
    'Fixed width  ·  measure end-to-end latency separately',
    815,
    795,
    34,
    C.muted,
    'Sans',
    'left',
    985,
  );
}
export function incident(g, k) {
  const b = beat(k);
  base(g);
  if (b === 5) {
    heading(g, 'RETRIEVED CONTEXT', 'Triple the prompt length');
    return pairs(g, cue(k, 5, 'Triple the prompt length'));
  }
  if (b === 4) {
    heading(g, 'MATCHED EXPERIMENT', 'Which stage changed the assistant?');
    return recipe(g);
  }
  if (b === 3 && cue(k, 3, 'compare direct supervised tuning')) {
    heading(g, 'CONTROLLED COMPARISON', 'What would you hold fixed?');
    ['Base checkpoint', 'Base checkpoint + domain pretraining'].forEach((s, i) => {
      const y = 386 + i * 207;
      chip(g, s, 110, y, 887, 110, i ? C.pale : C.leaf);
      arrow(g, 1017, y + 55, 1121, y + 55);
      chip(g, 'Supervised tuning', 1145, y, 640, 110, C.sun);
    });
    return;
  }
  heading(g, 'PAYMENTS   /   03:00', 'The worker pool is out of connections');
  const supplied = cue(k, 3, 'Put the excerpt', 1);
  const y = 303 - 32 * supplied,
    x = 100 + 84 * supplied;
  sheet(g, x, y, 675, 444);
  text(g, 'RETRY RUNBOOK', x + 44, y + 85, 34, C.sea, 'Mono');
  serif(g, 'Retry with jitter.', x + 44, y + 197, 55);
  serif(g, 'Reuse the token.', x + 44, y + 278, 55);
  text(g, 'Token reissue procedure', x + 44, y + 383, 32, C.muted);
  if (supplied) arrow(g, 865, 520, 865 + 100 * supplied, 520);
  pager(g, cue(k, 3, 'the answer now follows'), supplied === 1);
  text(
    g,
    b === 2
      ? 'What could we supply at answer time?'
      : supplied
        ? 'Retrieval baseline  ·  weights fixed'
        : 'Gateway retries exhaust the connection pool.',
    100,
    925,
    45,
    C.sea,
  );
}
const diagnoses = [
  {
    observation: ['Assistant reply', '“Eight retries.”'],
    reference: ['Current release note', '“Limit: four retries.”'],
    context: 'Retry limit for this release',
    method: 'Retrieve the current note',
    signal: 'Supply the fact in the prompt. Keep the weights fixed.',
    answer: 'Retrieve the current note',
  },
  {
    observation: ['Held-out log excerpt', 'AUTH_TIMEOUT: token …'],
    reference: ['Scores on 20 held-out lines', '18 of 20 actual next tokens', 'received less than 1% probability.'],
    context: 'Example next token: “ exchange”',
    method: 'Continue next-token training',
    signal: 'Train on separate runbooks. Score the held-out lines again.',
    answer: 'Try continued pretraining',
  },
  {
    observation: ['Assistant reply', 'Code: AUTH_TIMEOUT'],
    reference: ['Required incident fields', 'Code: AUTH_TIMEOUT', 'Action: retry with jitter'],
    context: 'The action field is missing.',
    method: 'Use supervised tuning',
    signal: 'Train on complete replies. Check the required fields on fresh incidents.',
    answer: 'Test supervised fine-tuning',
  },
  {
    observation: ['Reply A', 'Reuse the same token.', 'Retry with jitter.'],
    reference: ['Reply B', 'Retry with jitter.', 'Reuse the same token.'],
    context: 'Both replies meet the runbook requirements.',
    method: 'Use preference training',
    signal: 'Use the ranked pair as the training signal.',
    answer: 'Test preference training',
  },
];

export function diagnosisState(k) {
  const index = cue(k, 1, 'Now look at the held-out logs')
    + cue(k, 2, 'Here the incident reply')
    + cue(k, 2, 'Now compare two valid replies');
  const item = diagnoses[index];
  return {
    item,
    ranked: index === 3 && cue(k, 2, 'Reviewers prefer'),
    answered: cue(k, index < 2 ? 1 : 2, item.answer),
  };
}
export function diagnose(g, k) {
  base(g);
  heading(g, 'FICTIONAL PAYMENTS SERVICE', 'Which experiment would you try first?');
  const { item, ranked, answered } = diagnosisState(k);
  [item.observation, item.reference].forEach(([label, ...lines], i) => {
    const x = 107 + 872 * i;
    sheet(g, x, 304, 824, 348);
    text(g, label, x + 40, 386, 37, i ? C.sea : C.clay, 'Mono');
    lines.forEach((s, j) => serif(g, s, x + 40, 500 + 70 * j, 48, C.ink, 'left', 744));
  });
  text(g, ranked ? 'Reviewers rank B above A for putting the retry instruction first.' : item.context,
    111, 731, 41, C.muted);
  if (answered) {
    serif(g, item.method, 112, 875, 70, C.sea);
    text(g, item.signal, 114, 962, 39, C.muted);
  }
}
