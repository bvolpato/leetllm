import {
  ink,
  night,
  dark,
  white,
  paper,
  edge,
  muted,
  soft,
  gold,
  signal,
  red,
  lights,
  pigments,
  text,
  mono,
  serif,
  rect,
  line,
  path,
  dot,
  stock,
  key,
  names,
  cue,
  afterCue,
  mix,
  fmt,
} from './atlas.mjs';
import { policy, trials, route, replayLog, assertion as testResult } from './decisions.mjs';

// A roll travels out of the printer as the collector receives each line.
function printout(g, x, w, label, height, rows) {
  const top = 91,
    bottom = top + height;
  rect(g, x - 9, 28, w + 18, 71, '#314c49', 11);
  rect(g, x - 3, 79, w + 6, 17, '#061719', 5);
  mono(g, label, x + 17, 61, 16, white);
  dot(g, x + w - 24, 55, 5, signal);
  rect(g, x + 5, top + 8, w, height, '#0b2022', 1);
  const teeth = [];
  for (let i = 0; i <= 36; i++) teeth.push([x + w - (i * w) / 36, bottom - (i % 2) * 5]);
  path(g, [[x, top], [x + w, top], ...teeth], paper);
  for (let y = top + 13; y < bottom - 12; y += 19) {
    dot(g, x + 11, y, 2.7, '#8d9b8f');
    dot(g, x + w - 11, y, 2.7, '#8d9b8f');
  }
  line(g, x + 26, top, x + 26, bottom - 5, edge, 1, [3, 3]);
  g.save();
  g.beginPath();
  g.rect(x + 29, top, w - 60, height - 12);
  g.clip();
  rows.forEach(({ at, s, size = 18, col = ink, font = 'Mono', weight = 500, rule = false }) => {
    if (rule) line(g, x + 39, top + at, x + w - 36, top + at, '#a4b2a5', 1, [4, 3]);
    else text(g, s, x + 39, top + at, size, col, font, weight);
  });
  g.restore();
}
function choices(g, x, y, w, selected, count = 3, dy = 67) {
  for (let i = 0; i < count; i++) {
    const yy = y + i * dy,
      chosen = i === selected;
    rect(g, x, yy - 30, w, 49, chosen ? lights[i] : '#243f40', 6);
    if (chosen) rect(g, x + 3, yy - 26, 4, 41, pigments[i], 2);
    key(g, i, x + 14, yy + 2, !chosen);
    text(g, names[i], x + 58, yy + 4, 22, chosen ? dark : white, 'Sans', chosen ? 700 : 500);
  }
}
export function opening(g, k) {
  stock(g, true);
  const summary = k.beat.beatIndex === 0 ? Math.min(1, k.elapsed / 0.55) : 1;
  const initialAnswer = afterCue(k, 1, 'Insufficient evidence');
  const detail = cue(k, 1, 'Now the registry replies', 0.65);
  const unauthorized = cue(k, 1, 'four oh one');
  const stopped = cue(k, 1, 'The tests never started');
  const reviewed = afterCue(k, 2, 'Registry authentication');
  const readout = cue(k, 3, 'A decision head');
  const stage = detail > 0 ? 'Awaiting decision' : initialAnswer ? 'Summary only' : '';
  const rows = [
    { at: 39, s: 'RUN-842     /     CI TRIAGE', col: muted, size: 15 },
    { at: 56, rule: true },
    { at: 109, s: 'Build failed'.slice(0, 5 + Math.round(7 * summary)), font: 'Serif', size: 38 },
  ];
  if (detail > 0) rows.push({ at: 158, s: 'IMAGE PULL', size: 15, col: muted });
  if (unauthorized)
    rows.push(
      { at: 225, s: '401', size: 66, font: 'Mono', weight: 700, col: red },
      { at: 258, s: 'Unauthorized from registry', size: 18 },
    );
  if (stopped) rows.push({ at: 292, rule: true }, { at: 334, s: 'Tests never started', size: 21 });
  printout(g, 36, 432, 'INCIDENT COLLECTOR', mix(125, 140, summary) + 231 * detail, rows);
  mono(g, 'APPLICATION   /   CHOICE', 508, 65, 15, soft);
  serif(g, 'Investigate first?', 506, 130, 40, white);
  const selected = reviewed ? 1 : initialAnswer && !detail ? 2 : -1;
  choices(g, 507, 210, 414, selected);
  if (reviewed) {
    mono(g, 'REVIEWED LABEL', 508, 421, 14, soft);
    text(g, 'B   Registry authentication', 508, 454, 24, lights[1]);
  } else if (stage) mono(g, stage, 508, 425, 18, soft);
  if (k.beat.beatIndex === 3) {
    rect(g, 506, 390, 425, 88, night);
    mono(g, readout ? 'DECISION HEAD' : 'GRAMMAR-CONSTRAINED LM', 508, 416, 15, soft);
    text(g, readout ? 'Scores for A, B and C' : 'Next token from a legal set', 508, 452, 24, white);
  }
}
function finalLog(g, k) {
  const pull = cue(k, 0, 'The image pull succeeded', 0.5),
    tests = cue(k, 0, 'the tests ran', 0.45);
  const assertion = cue(k, 0, 'an assertion failed', 0.5);
  const rows = [
    { at: 34, s: 'BUILD LOG   /   RUN-843', size: 15, col: muted },
    { at: 51, rule: true },
  ];
  [pull, tests, assertion].forEach((a, i) => {
    if (a > 0)
      rows.push({
        at: 91 + i * 48,
        s: replayLog[i],
        col: i === 2 ? red : ink,
        size: 20,
        weight: i === 2 ? 700 : 500,
      });
  });
  if (assertion >= 1)
    rows.push({
      at: 217,
      s: 'expected ' + testResult.expected + '   got ' + testResult.actual,
      size: 16,
      col: red,
    });
  printout(g, 35, 361, 'INCIDENT COLLECTOR', 68 + 44 * pull + 46 * tests + 83 * assertion, rows);
}
function routing(g, k) {
  const second = cue(k, 4, 'Replay this same log');
  const trial = second ? 1 : 0,
    r = route(trials[trial]);
  const hasP = second
    ? afterCue(k, 4, 'Change only the winning probability to point seven six')
    : afterCue(k, 1, 'winning probability point seven');
  const validation = afterCue(k, 1, 'checks that A is a legal ID');
  const hasPolicy = afterCue(k, 1, 'confidence is at least point six five');
  const hasBaseline = afterCue(k, 2, 'the uniform baseline is one quarter');
  const scoreBeat = second ? 5 : 3;
  const scorePhrase = second ? 'point six eight confidence' : 'point six';
  const hasScore = afterCue(k, scoreBeat, scorePhrase);
  const project = afterCue(k, scoreBeat, scorePhrase, 0.45);
  const routed = second
    ? afterCue(k, 5, 'enters the test investigation queue', 0.5)
    : afterCue(k, 3, 'Send this ticket to human review', 0.5);
  const showArithmetic = second ? hasScore : afterCue(k, 3, 'divide by three quarters');
  const base = 1 / r.k,
    left = 508,
    right = 880;
  const onScale = (c) => mix(left, right, c);
  mono(g, 'HOST ROUTING POLICY', 435, 60, 15, soft);
  serif(g, 'Where should the ticket go?', 433, 114, 36, white);
  mono(g, 'TRIAL ' + (trial + 1), 437, 164, 18, gold);
  if (hasP) text(g, 'p = ' + fmt(r.p, 2), 579, 166, 29, white, 'Mono', 600);
  if (validation) mono(g, 'Caller authenticated  ·  A is valid', 437, 200, 16, soft);
  if (hasPolicy)
    text(g, 'Investigate when confidence ≥ ' + fmt(policy.cutoff, 2), 436, 252, 22, white);
  if (hasBaseline) {
    mono(g, 'p', 436, 295, 18, soft);
    line(g, left, 290, right, 290, soft, 2);
    mono(g, fmt(base, 2), left - 8, 296, 15, soft, 'right');
    mono(g, '1', right + 11, 296, 15, soft);
    const x = onScale(r.score);
    if (hasP) {
      dot(g, x, 290, 5, white);
      mono(g, fmt(r.p, 2), x, 278, 16, white, 'center');
    }
    if (hasScore) {
      const cutX = onScale(policy.cutoff);
      mono(g, 'c', 436, 350, 18, soft);
      line(g, left, 345, right, 345, soft, 2);
      mono(g, '0', left - 8, 351, 15, soft, 'right');
      mono(g, '1', right + 11, 351, 15, soft);
      line(g, cutX, 332, cutX, 358, gold, 2);
      mono(g, fmt(policy.cutoff, 2), cutX, 375, 15, gold, 'center');
      line(g, x, 297, x, mix(297, 340, project), white, 1, [3, 3]);
      if (project === 1) {
        dot(g, x, 345, 5, white);
        mono(g, fmt(r.score, 2), x + (r.pass ? 7 : -7), 334, 15, white, r.pass ? 'left' : 'right');
      }
    }
  }
  if (showArithmetic)
    mono(
      g,
      '(' +
        fmt(r.p, 2) +
        ' − ' +
        fmt(base, 2) +
        ') / ' +
        fmt(1 - base, 2) +
        (hasScore ? ' = ' + fmt(r.score, 2) : ' = ?'),
      436,
      403,
      19,
      white,
    );
  if (routed > 0) {
    rect(g, 435, 415, 454, 53, r.pass ? lights[1] : gold, 4);
    const y = 441;
    line(g, 451, y, 450 + 40 * routed, y, ink, 2);
    dot(g, 450 + 40 * routed, y, 4, ink);
    text(g, r.route, 506, y + 8, 25, ink, 'Sans', 700);
  }
}
export function release(g, k) {
  stock(g, true);
  finalLog(g, k);
  if (k.beat.beatIndex === 0) {
    mono(g, 'CALLER’S OPTIONS', 442, 59, 16, soft);
    serif(g, 'Investigate first?', 439, 117, 37, white);
    const n = cue(k, 0, 'a fourth option') ? 4 : 3;
    choices(g, 440, 193, 469, -1, n, 63);
    return;
  }
  if (afterCue(k, 1, 'Suppose the model also returns A')) {
    mono(g, 'RETURNED CHOICE   /   4 OPTIONS', 37, 368, 14, soft);
    key(g, 0, 37, 405, true);
    text(g, names[0], 83, 405, 22, white);
  }
  if (cue(k, 4, 'Replay this same log')) {
    const first = route(trials[0]);
    mono(g, 'TRIAL 1  ·  p = ' + fmt(first.p, 2), 37, 427, 15, gold);
    text(g, fmt(first.score, 2) + '  →  ' + first.route, 37, 454, 19, white);
  }
  routing(g, k);
  if (cue(k, 5, 'Rotating a credential')) {
    mono(g, 'Queue grant only', 765, 402, 16, soft);
  }
}
