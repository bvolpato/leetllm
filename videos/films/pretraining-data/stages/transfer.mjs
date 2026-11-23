import { PROXY_RESULTS } from '../fixtures.mjs';
import { preparationBranch } from '../model.mjs';
import { withPretrainingMainFrame } from '../defaults.mjs';
import { tokenStrip } from '../record-visuals.mjs';

function inventoryRow(ctx, api, branch, y, title) {
  const { C } = api;
  api.text(ctx, title, 155, y + 48, 36, C.ink);
  api.text(ctx, branch.tokens + ' unique tokens', 155, y + 97, 30, C.muted);
  let x = 570;
  for (const record of branch.unique) {
    tokenStrip(ctx, api, record, x, y, record.tokens * 1.9);
    x += record.tokens * 1.9;
  }
}

function testRow(ctx, api, results, y, label, seen, showTotal, compare) {
  const { C } = api;
  api.text(ctx, label, 155, y + 43, 34, C.ink);
  let successes = 0;
  results.forEach((pass, i) => {
    const x = 495 + i * 103;
    const shown = i < seen;
    if (shown && pass) successes++;
    const changed = shown && compare && compare[i] !== pass;
    api.rect(ctx, x, y, 89, 63, C.panel, changed ? C.yellow : C.muted, 5);
    if (shown)
      api.text(ctx, pass ? '✓' : '×', x + 44, y + 47, 43, pass ? C.green : C.pink, 'center');
  });
  if (showTotal && seen === results.length)
    api.text(ctx, successes + ' / ' + seen, 1660, y + 46, 41, C.ink, 'center');
}

export function paintPretrainingMainTransfer(ctx, scene, state, api, C, c, b, p, cue, P, D, beg) {
  const baseline = preparationBranch(0.5),
    strict = preparationBranch(0.85);
  if (b === 0) {
    inventoryRow(ctx, api, baseline, 300, 'Cutoff 0.50');
    api.text(ctx, 'Four draws of 100 tokens each', 155, 595, 40, C.ink);
    const ids = ['C', 'A', 'C', 'E'];
    const n = Math.floor(P('draws') * ids.length);
    for (let i = 0; i < ids.length; i++) {
      const x = 305 + i * 335;
      const record = baseline.unique.find((r) => r.id === ids[i]);
      api.text(ctx, 'Draw ' + (i + 1), x + 145, 678, 30, C.muted, 'center');
      if (i < n) tokenStrip(ctx, api, record, x, 707, 290, { detail: 'tokens 1–100' });
      else api.rect(ctx, x + 3, 707, 284, 112, C.panel, C.muted, 7);
    }
    if (D('draws')) {
      const codeMass = ids.filter((id) => id === 'C').length * 100;
      api.text(
        ctx,
        codeMass + ' code presentations from the same 100 positions',
        960,
        939,
        42,
        C.pink,
        'center',
      );
    }
    return;
  }
  inventoryRow(ctx, api, baseline, 240, 'Cutoff 0.50');
  const cutoff = Math.round((0.5 + 0.35 * P('tighten')) * 100) / 100;
  const branch = preparationBranch(cutoff);
  inventoryRow(ctx, api, branch, 392, 'Cutoff ' + cutoff.toFixed(2));
  if (b === 1) {
    if (D('tighten')) {
      api.text(ctx, 'Token-weighted mean classifier score', 960, 650, 36, C.muted, 'center');
      api.text(
        ctx,
        baseline.mean.toFixed(3) + '   →   ' + strict.mean.toFixed(3),
        960,
        757,
        71,
        C.yellow,
        'center',
      );
      api.text(ctx, 'Which records would still supply code tokens?', 960, 941, 41, C.ink, 'center');
    }
    return;
  }
  api.text(ctx, 'Same ten held-out cases', 155, 620, 36, C.ink);
  for (let i = 0; i < 10; i++)
    api.text(ctx, String(i + 1), 539 + i * 103, 684, 28, C.muted, 'center');
  const seen = Math.floor(P('tests') * PROXY_RESULTS.strict.length);
  testRow(ctx, api, PROXY_RESULTS.baseline, 712, 'Cutoff 0.50', seen, D('totals'));
  testRow(ctx, api, PROXY_RESULTS.strict, 800, 'Cutoff 0.85', seen, D('totals'), PROXY_RESULTS.baseline);
  const takeaway = D('test-code')
    ? 'Next trial: restore C alone at the same training budget.'
    : 'Illustrative matched runs   ·   ✓ success     × miss';
  api.text(ctx, takeaway, 960, 966, 38, D('test-code') ? C.yellow : C.muted, 'center');
}
export function drawTransferStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainTransfer);
}
export default {
  id: 'transfer',
  draw: drawTransferStage,
  cues: ['pt-transfer-draws', 'pt-transfer-tighten', 'pt-transfer-tests', 'pt-transfer-totals', 'pt-transfer-test-code'],
};
