import { boostCue, freshSplitState } from '../construction.mjs';
import { binX, drawBins } from '../bin-strip.mjs';
import { cellText, chapterText, dot, formatNumber, heading, line } from '../defaults.mjs';

function gainTest(ctx, api, model, { raw, charged, blocked, netKnown }) {
  const { C } = api;
  const axisY = 836;
  const pixelScale = 610;
  const level = axisY - pixelScale * model.gamma;
  line(ctx, api, 260, axisY, 1650, axisY, C.muted, 2);
  line(ctx, api, 260, level, 1650, level, C.yellow, 3);
  chapterText(ctx, api, 'γ = ' + model.gamma, 240, level + 10, 29, C.yellow, 'right');
  chapterText(ctx, api, '0', 240, axisY + 10, 28, C.muted, 'right');
  model.cuts.forEach((c, i) => {
    const x = 510 + i * 445;
    cellText(ctx, api, 'Cut ' + c.cut, x, 896, C.ink, 30);
    if (!raw) return;
    const top = axisY - c.rawGain * pixelScale;
    if (c.rawGain > 0) api.rect(ctx, x - 46, top, 92, axisY - top, C.cyan, undefined, 0);
    else line(ctx, api, x - 46, axisY, x + 46, axisY, C.cyan, 5);
    cellText(ctx, api, formatNumber(c.rawGain, 4), x, Math.min(top, level) - 25, C.cyan, 31);
    if (charged && netKnown)
      cellText(
        ctx,
        api,
        'net ' + (c.gain > 0 ? '+' : '') + formatNumber(c.gain, 4),
        x,
        951,
        C.ink,
        29,
      );
  });
  if (blocked)
    cellText(ctx, api, 'No cut pays the charge  ·  retain parent', 960, 1020, C.yellow, 32);
  if (!raw)
    cellText(ctx, api, 'Does any cut earn enough to pay for one more leaf?', 960, 997, C.ink, 35);
}
function branches(ctx, api, f, weightsVisible) {
  const { C } = api;
  const groups = [f.model.rows.slice(0, f.selected.cut), f.model.rows.slice(f.selected.cut)];
  const weights = [f.selected.leftWeight, f.selected.rightWeight];
  groups.forEach((rows, i) => {
    const mid = rows.reduce((sum, r) => sum + binX(r.bin - 1), 0) / rows.length;
    rows.forEach((r) => line(ctx, api, binX(r.bin - 1), 470, mid, 640, C.cyan, 3));
    dot(ctx, api, mid, 640, C.cyan, 12);
    const name = i === 0 ? 'Left leaf' : 'Shared right leaf';
    cellText(ctx, api, name, mid, 716, C.ink, 39);
    if (weightsVisible)
      cellText(ctx, api, 'Weight ' + formatNumber(weights[i], 4), mid, 791, C.cyan, 34);
    if (f.logitsVisible) {
      const logit = f.logits[rows[0].bin - 1];
      const rounded = formatNumber(logit, 5);
      cellText(
        ctx,
        api,
        'Logit   0 + ¼ × w ' + (Number(rounded) === logit ? '= ' : '≈ ') + rounded,
        mid,
        871,
        C.ink,
        32,
      );
    }
  });
  cellText(ctx, api, 'Cut 1 wins the earliest positive tie', 960, 1000, C.yellow, 30);
}
function probabilityRuler(ctx, api, f, showCutoff) {
  const { C } = api;
  const threshold = 0.52;
  const y = (p) => 860 - (p - 0.47) * 8600;
  chapterText(ctx, api, 'Probability', 116, 292, 28, C.muted);
  for (const tick of [0.48, 0.5, 0.52]) {
    const active = tick === threshold && showCutoff;
    line(ctx, api, 355, y(tick), 1650, y(tick), active ? C.yellow : C.muted, active ? 4 : 1);
    chapterText(
      ctx,
      api,
      active ? 'Alert at 0.52' : tick.toFixed(2),
      330,
      y(tick) + 10,
      29,
      active ? C.yellow : C.muted,
      'right',
    );
  }
  const progress = boostCue(f.state, 'fresh-probabilities', 3);
  f.model.rows.forEach((r, i) => {
    const x = binX(i);
    const color = r.label ? C.pink : C.blue;
    const endY = y(f.probabilities[i]);
    const currentY = y(0.5) + progress * (endY - y(0.5));
    line(ctx, api, x, y(0.5), x, currentY, color, 4);
    dot(ctx, api, x, currentY, color, 14);
    cellText(ctx, api, 'Job ' + r.bin, x, 881, C.ink, 34);
    cellText(ctx, api, r.label ? 'missed' : 'on time', x, 929, color, 28);
    if (f.probabilitiesVisible)
      chapterText(
        ctx,
        api,
        'p = ' + formatNumber(f.probabilities[i], 6),
        x + 23,
        endY - 17,
        28,
        color,
      );
    if (f.actionsVisible) {
      const decision = f.alerts[i] ? 'alert' : r.label ? 'quiet · positive missed' : 'quiet';
      cellText(ctx, api, decision, x, 997, f.alerts[i] ? C.yellow : r.label ? C.pink : C.muted, 27);
    }
  });
  if (showCutoff && !f.actionsVisible)
    cellText(ctx, api, 'Which missed job reaches the operator?', 960, 1005, C.ink, 32);
}
export function drawEarnedSplitTransfer(ctx, scene, state, api) {
  const f = freshSplitState(state);
  const beat = state.beat ?? 0;
  const cue = (id, b) => boostCue(state, id, b);
  api.focus.target('earned-split-transfer-model', () => {
    if (beat >= 3 && f.probabilities) {
      probabilityRuler(
        ctx,
        api,
        { ...f, state },
        cue('fresh-threshold', 3) > 0 || f.actionsVisible,
      );
      return;
    }
    heading(ctx, api, 'Four bins  ·  starting probability 0.50  ·  λ = 1  ·  learning rate ¼');
    drawBins(ctx, api, f.model, { showStats: !f.selected, cut: f.selected?.cut ?? null });
    if (f.selected) {
      branches(ctx, api, f, cue('gbt-fresh-weights', 2) === 1);
      return;
    }
    gainTest(ctx, api, f.model, {
      raw: cue('fresh-unpenalized', 1) === 1,
      charged: cue('fresh-charge', 1) === 1,
      blocked: cue('fresh-block', 1) === 1 && f.gamma === 0.2,
      netKnown: f.gamma === 0.2 || cue('fresh-net', 2) === 1,
    });
  });
}
export default {
  id: 'earned-split-transfer',
  draw: drawEarnedSplitTransfer,
  cues: [
    'earned-split-transfer-step-1',
    'fresh-unpenalized',
    'fresh-charge',
    'fresh-block',
    'fresh-gamma',
    'fresh-net',
    'fresh-cut',
    'gbt-fresh-weights',
    'fresh-logits',
    'fresh-probabilities',
    'fresh-threshold',
    'fresh-actions',
  ],
};
