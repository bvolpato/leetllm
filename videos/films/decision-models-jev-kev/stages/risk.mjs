import { confidence, probabilityCutoff } from '../arithmetic.mjs';
import { records } from '../fixtures.mjs';
import { report } from '../model.mjs';
import { phraseProgress, phraseStarted } from '../clock.mjs';
import { drawRuler } from '../ruler.mjs';

const k = 3;
const cutoff = 0.8;
const equivalent = probabilityCutoff(cutoff, k);

function drawConversion(ctx, state, api) {
  const { C } = api;
  const inverse = state.beat === 1;
  const travel = phraseProgress(state, api, 'inverse-map', 1, 0.12, 0.32);
  const p = inverse ? probabilityCutoff(cutoff * travel, k) : cutoff;
  const reading = inverse
    ? phraseStarted(state, 'read-cutoff', 1, 0.36)
    : phraseStarted(state, 'forward-map', 0, 0.72);
  api.text(ctx, 'Three allowed answers', 110, 269, 44, C.ink);
  api.text(ctx, 'Uniform', 445, 370, 32, C.muted, 'center');
  api.text(ctx, 'Certain', 1688, 370, 32, C.muted, 'center');
  drawRuler(ctx, api, {
    count: k,
    probability: p,
    y: 506,
    gap: 153,
    showReading: reading,
    fromConfidence: inverse,
    target: inverse ? 'inverse-mark' : 'forward-mark',
    fractionLabel: travel === 1 ? '13/15' : travel > 0 ? p.toFixed(3) : undefined,
  });
  api.line(ctx, 110, 814, 1806, 814, C.muted, 2);
  const formula = inverse
    ? 'p cutoff = ⅓ + 0.80 × (1 − ⅓)' + (reading ? ' ≈ ' + equivalent.toFixed(4) : '')
    : 'c = (winning p − ⅓) / (1 − ⅓)' +
      (reading ? ' = ' + confidence(cutoff).toFixed(2) + ' at p = 0.80' : '');
  api.text(ctx, formula, 111, 940, 44, C.yellow);
}

function drawRecords(ctx, state, api) {
  const { C } = api;
  const travel = phraseProgress(state, api, 'move-cut', 3, 0.01, 0.19);
  const pCut = cutoff + (equivalent - cutoff) * travel;
  const hasCut = phraseStarted(state, 'probability-gate', 2, 0.25);
  const compareFields = phraseStarted(state, 'next-cut', 2, 0.72);
  const field = travel === 1 ? confidence : (p) => p;
  const results = report(field, travel === 1 ? cutoff : pCut);
  const first = report((p) => p, cutoff);
  const x = (p) => 432 + (p - 0.5) * 1580;
  const top = 350;
  const last = top + 7 * 68;
  const axisY = last + 46;
  api.text(ctx, 'Case', 109, 264, 32, C.muted);
  api.text(ctx, 'Winning p', 238, 264, 32, C.muted);
  api.text(ctx, '●  Correct', 520, 264, 34, C.cyan);
  api.text(ctx, '×  Wrong', 802, 264, 34, C.red);
  records.forEach((record, i) => {
    const y = top + i * 68;
    const pointX = x(record.p);
    const verdict = record.correct ? C.cyan : C.red;
    const id = i === 2 ? 'wrong-record' : i === 3 ? 'borderline' : 'incident-point';
    api.focus.target(id, () => {
      api.text(ctx, String(i + 1).padStart(2, '0'), 115, y + 11, 31, C.muted);
      api.text(ctx, record.p.toFixed(2), 287, y + 12, 34, C.ink, 'center');
      api.line(ctx, x(0.5), y, x(1), y, C.panel, 3);
      if (record.correct) api.circle(ctx, pointX, y, 10, verdict);
      else {
        api.line(ctx, pointX - 10, y - 10, pointX + 10, y + 10, verdict, 6);
        api.line(ctx, pointX - 10, y + 10, pointX + 10, y - 10, verdict, 6);
      }
      if (hasCut && results.accepted.includes(record))
        api.circle(ctx, pointX, y, 20, 'transparent', C.yellow, 3);
    });
  });
  api.line(ctx, x(0.5), axisY, x(1), axisY, C.muted, 2);
  for (const tick of [0.5, 0.6, 0.7, 0.8, 0.9, 1]) {
    api.line(ctx, x(tick), axisY, x(tick), axisY + 8, C.muted, 2);
    api.text(ctx, tick.toFixed(1), x(tick), axisY + 53, 28, C.muted, 'center');
  }
  api.focus.target(state.beat === 2 ? 'probability-cut' : 'cutoff', () => {
    if (hasCut) api.line(ctx, x(pCut), top - 32, x(pCut), axisY - 9, C.yellow, 3);
    api.text(
      ctx,
      hasCut
        ? travel === 1
          ? 'Confidence ≥ 0.80'
          : travel > 0
            ? 'Moving the cutoff'
            : 'Winning p ≥ 0.80'
        : 'Eight reviewed incidents',
      1310,
      264,
      37,
      C.yellow,
    );
    if (hasCut)
      api.text(
        ctx,
        'On the p scale   ' + (travel === 1 ? '13/15' : pCut.toFixed(travel > 0 ? 3 : 2)),
        1310,
        335,
        32,
        C.muted,
      );
  });
  api.focus.target('risk-counts', () => {
    if (!hasCut) {
      api.text(ctx, '●   Correct choice', 1310, 492, 39, C.cyan);
      api.text(ctx, '×   Wrong choice', 1310, 586, 39, C.red);
      return;
    }
    api.text(ctx, 'Routed / all incidents', 1310, 473, 32, C.muted);
    api.text(ctx, results.accepted.length + ' / ' + records.length, 1310, 564, 78, C.ink);
    api.text(ctx, 'Errors / routed incidents', 1310, 680, 32, C.muted);
    api.text(ctx, results.errors + ' / ' + results.accepted.length, 1310, 771, 78, C.red);
  });
  api.focus.target('gate-comparison', () => {
    let footer = hasCut
      ? 'Each ring marks an incident the gate would route.'
      : 'Each point is one incident.';
    if (compareFields)
      footer = 'At p ≥ 13/15 (about 0.8667), which case drops out? Does the error go too?';
    if (travel === 1)
      footer =
        'Before: ' +
        first.errors +
        ' error in ' +
        first.accepted.length +
        ' routed.   Now: ' +
        results.errors +
        ' error in ' +
        results.accepted.length +
        ' routed.';
    api.text(ctx, footer, 110, 1002, 38, C.ink);
  });
}
export function drawRisk(ctx, scene, state, api) {
  if (state.beat < 2) drawConversion(ctx, state, api);
  else drawRecords(ctx, state, api);
}
export default {
  id: 'risk',
  draw: drawRisk,
  cues: [
    'uniform-floor',
    'forward-map',
    'inverse-map',
    'read-cutoff',
    'probability-gate',
    'wrong-record',
    'next-cut',
    'risk-question',
    'move-cut',
    'risk-count',
  ],
};
