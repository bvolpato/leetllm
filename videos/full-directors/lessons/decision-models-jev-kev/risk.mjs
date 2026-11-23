import {
  ink,
  white,
  muted,
  soft,
  gold,
  amber,
  red,
  pigments,
  lights,
  text,
  mono,
  rect,
  line,
  dot,
  stock,
  heading,
  cue,
  afterCue,
  fmt,
  mix,
} from './atlas.mjs';
import { records, gate, confidence, probabilityCutoff, fiveChoices } from './decisions.mjs';

function pairedRuler(g, k) {
  stock(g, true);
  heading(g, 'KEV CHOICE   /   THREE LEGAL OPTIONS', 'What does 0.80 measure?', true);
  const fromP = afterCue(k, 1, 'A winning probability of point eight');
  const fromC = afterCue(k, 2, 'Now put point eight on the lower ruler');
  const p = fromC ? probabilityCutoff(0.8, 3) : 0.8;
  const c = confidence(p, 3),
    x = 140 + c * 685;
  const top = 207,
    bottom = 331;
  for (const [y, name] of [
    [top, 'Winning probability'],
    [bottom, 'Choice confidence'],
  ]) {
    text(g, name, 54, y - 47, 23, white);
    rect(g, 128, y - 4, 709, 16, '#3f5750', 3);
    for (let i = 0; i <= 20; i++) {
      const xx = 140 + (i * 685) / 20;
      line(g, xx, y, xx, y + (i % 5 === 0 ? 22 : 11), soft, i % 5 === 0 ? 2 : 1);
    }
  }
  mono(g, '1/3', 141, top + 49, 22, white, 'center');
  mono(g, '1', 825, top + 49, 22, white, 'center');
  mono(g, '0', 140, bottom + 49, 22, white, 'center');
  mono(g, '1', 825, bottom + 49, 22, white, 'center');
  if (fromP || fromC) {
    const along = fromC ? cue(k, 2, 'Read straight up', 0.5) : cue(k, 1, 'comes out to', 0.5);
    const result = fromC
      ? afterCue(k, 2, 'The matching probability is thirteen fifteenths, about point eight six seven')
      : afterCue(k, 1, 'comes out to a confidence of point seven');
    const y0 = fromC ? bottom : top,
      y1 = fromC ? top : bottom;
    line(g, x, y0, x, mix(y0, y1, along), gold, 2.5, [6, 3]);
    dot(g, x, y0, 6, gold);
    if (along === 1) dot(g, x, y1, 6, gold);
    if (!fromC || result)
      mono(g, fromC ? '13/15 ≈ ' + fmt(p) : fmt(p, 2), x, top - 16, 22, gold, 'center');
    if (fromC || result) mono(g, fmt(c, 2), x, bottom + 49, 22, gold, 'center');
  }
  mono(g, 'K > 1     c = (p − 1/K) / (1 − 1/K)', 54, 448, 22, white);
  if (cue(k, 3, 'single legal choice')) mono(g, 'K = 1     adapter returns 1', 54, 482, 17, soft);
}
function incidentGate(g, k) {
  stock(g);
  const initial = gate('probability');
  const converted = gate('confidence');
  const leaving = records.find((_, i) => initial.accepts[i] && !converted.accepts[i]);
  const active = afterCue(k, 4, 'It accepts point eight or higher');
  const alternate = afterCue(k, 6, 'Switch the gate to confidence');
  const conversion = 'Its point eight cutoff sits at thirteen fifteenths on the probability scale';
  const known = afterCue(k, 6, conversion);
  const travel = afterCue(k, 6, conversion, 2);
  const settle = afterCue(k, 6, 'The correct incident at point eight six drops out', 0.5);
  const empty = afterCue(k, 7, 'If nobody passes');
  // Stop on the inclusive boundary until the voice names the case that drops out.
  const cutoff = empty
    ? 1
    : settle > 0
      ? mix(leaving.p, converted.pCutoff, settle)
      : mix(initial.pCutoff, leaving.p, travel);
  const state = gate('probability', cutoff);
  const left = 81,
    right = 902,
    axisY = 266;
  const min = 0.5;
  const onScale = (p) => mix(left, right, (p - min) / (1 - min));
  const gateX = onScale(cutoff);
  heading(
    g,
    'EIGHT REVIEWED INCIDENTS   /   THREE CHOICES',
    'Which cases make it through the gate?',
  );
  const fieldLabel = empty
    ? 'Winning probability ≥ 1.00'
    : alternate
      ? settle === 1
        ? 'Choice confidence ≥ 0.80'
        : 'Switch to Choice confidence ≥ 0.80'
      : active
        ? 'Winning probability ≥ 0.80'
        : 'Winning probabilities';
  mono(g, fieldLabel, 42, 155, 21, ink);
  if (known && !empty)
    mono(g, 'New cutoff  p = 13/15 ≈ ' + fmt(converted.pCutoff), 918, 155, 19, amber, 'right');
  else if (alternate && !empty)
    mono(g, 'Convert 0.80 to probability', 918, 155, 19, muted, 'right');

  if (active && state.count > 0) {
    rect(g, gateX, 237, right - gateX, 58, '#ffe5a4', 2);
    mono(g, 'ROUTED AT OR ABOVE CUTOFF', right - 8, 183, 15, amber, 'right');
  }
  line(g, left, axisY, right, axisY, muted, 2);
  for (const p of [min, 0.6, 0.7, initial.pCutoff, 0.9, 1]) {
    const x = onScale(p);
    line(g, x, axisY - 5, x, axisY + 5, muted, 1.5);
  }
  mono(g, fmt(min, 2), left, 294, 15, muted, 'center');
  mono(g, fmt(1, 2), right, 315, 15, muted, 'center');
  mono(g, 'WINNING PROBABILITY', left, 377, 15, muted);
  if (alternate && !empty) {
    const oldX = onScale(initial.pCutoff);
    line(g, oldX, 226, oldX, 306, muted, 1.5, [4, 4]);
  }
  if (active && !empty)
    mono(
      g,
      fmt(initial.pCutoff, 2),
      onScale(initial.pCutoff),
      333,
      16,
      alternate ? muted : amber,
      'center',
    );
  if (active) {
    line(g, gateX, 240, gateX, 302, amber, 3);
    dot(g, gateX, 240, 5, amber);
  }

  records.forEach((r, i) => {
    const x = onScale(r.p);
    // The two closest probabilities use opposite sides of the ruler.
    const below = i % 2 === 0;
    const labelY = below ? 350 : 210;
    const markY = below ? 315 : 226;
    const color = r.correct ? pigments[1] : red;
    line(g, x, axisY, x, below ? markY - 12 : markY + 12, color, 1.5);
    dot(g, x, axisY, 6, color);
    mono(g, fmt(r.p, 2), x, labelY, 21, ink, 'center');
    if (r.correct) {
      line(g, x - 8, markY, x - 2, markY + 7, color, 4);
      line(g, x - 2, markY + 7, x + 10, markY - 9, color, 4);
    } else {
      line(g, x - 8, markY - 8, x + 8, markY + 8, color, 4);
      line(g, x + 8, markY - 8, x - 8, markY + 8, color, 4);
    }
  });

  if (!active) return;
  line(g, 42, 387, 918, 387, muted);
  const coverageReady = afterCue(k, 4, 'Four of the eight go through');
  const riskReady = afterCue(k, 5, "That's one error among the four we routed");
  const retainedError = afterCue(k, 6, 'The wrong one at point nine stays');
  const newRiskReady = afterCue(k, 6, 'one out of three');
  text(g, 'Coverage', 44, 417, 19, muted);
  if (coverageReady)
    mono(g, state.count + ' / ' + records.length + ' = ' + fmt(state.coverage, 3), 44, 449, 24, ink);
  if (!riskReady) return;
  text(g, 'Selective risk among routed cases', 440, 417, 19, muted);
  if (state.risk === null) {
    mono(g, 'Unmeasured', 440, 449, 24, ink);
  } else if (state.count === initial.count || newRiskReady) {
    const relation = state.count === initial.count ? ' = ' : ' ≈ ';
    mono(g, state.errors + ' / ' + state.count + relation + fmt(state.risk, 3), 440, 449, 24, ink);
  } else if (retainedError) {
    mono(g, state.errors + ' routed error', 440, 449, 24, ink);
  }
  if (newRiskReady && !empty) {
    mono(g, 'Before  ' + initial.count + ' / ' + records.length, 44, 475, 17, muted);
    mono(g, 'Before  ' + initial.errors + ' / ' + initial.count, 440, 475, 17, muted);
  }
}
function equality(g, k) {
  stock(g, true);
  const { p, count: K, cutoff } = fiveChoices,
    c = confidence(p, K);
  heading(g, 'TRANSFER   /   FIVE LEGAL OPTIONS', 'Does equality pass an inclusive cutoff?', true);
  const left = 122,
    width = 712,
    base = 1 / K;
  const xx = left + p * width,
    bx = left + base * width;
  line(g, left, 245, left + width, 245, '#44605d', 8);
  [0, base, 1].forEach((v) => {
    const x = left + v * width;
    line(g, x, 229, x, 266, soft, 2);
    mono(g, fmt(v, 2), x, 296, 20, white, 'center');
  });
  mono(g, 'p', 77, 252, 20, soft);
  if (afterCue(k, 8, 'A winner at point seven two')) {
    line(g, bx, 245, xx, 245, lights[1], 8);
    dot(g, xx, 245, 7, lights[1]);
    mono(g, fmt(p, 2), xx, 220, 26, lights[1], 'center');
    mono(
      g,
      '(' + fmt(p, 2) + ' − ' + fmt(base, 2) + ') / ' + fmt(1 - base, 2),
      121,
      374,
      27,
      white,
    );
  }
  if (afterCue(k, 8, 'That gives point six five confidence')) {
    mono(g, '= ' + fmt(c, 2), 584, 374, 27, lights[1]);
  }
  if (afterCue(k, 8, 'exactly on an inclusive point six five cutoff')) {
    rect(g, 121, 409, 644, 53, '#284547', 5);
    text(g, fmt(c, 2) + ' ≥ ' + fmt(cutoff, 2) + '     Accepted at equality', 141, 444, 23, white);
  }
}
export function risk(g, k) {
  if (k.beat.beatIndex < 4) return pairedRuler(g, k);
  if (k.beat.beatIndex === 8 && afterCue(k, 8, 'With five choices the baseline is point two'))
    return equality(g, k);
  return incidentGate(g, k);
}
