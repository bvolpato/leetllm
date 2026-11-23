import { releaseBatch, releaseEvaluation } from '../fixtures.mjs';
import { withPretrainingMainFrame } from '../defaults.mjs';
import { scoreRuler, tokenStrip } from '../record-visuals.mjs';

function scorecard(ctx, api, docsReady, codeReady) {
  const { C } = api;
  const { tasks, baseline, candidate, casesPerTask, codeFloor } = releaseEvaluation;
  const x = 567,
    pitch = 51,
    count = casesPerTask;
  api.text(ctx, 'Held-out cases passed', 150, 300, 40, C.ink);
  api.text(ctx, 'Code release minimum', 1725, 270, 30, C.muted, 'right');
  api.text(ctx, codeFloor + ' / ' + count, 1725, 326, 46, C.yellow, 'right');
  tasks.forEach((task, j) => {
    const showResults = j === 0 ? docsReady : codeReady;
    const y = 411 + j * 245;
    api.text(ctx, task, 150, y + 40, 50, C.ink);
    [baseline, candidate].forEach((scores, k) => {
      const top = y + k * 76;
      api.text(ctx, k ? 'Cutoff 0.90' : 'Cutoff 0.70', x - 28, top + 36, 30, C.muted, 'right');
      for (let i = 0; i < count; i++) {
        const filled = (k === 0 || showResults) && i < scores[j];
        api.rect(
          ctx,
          x + i * pitch,
          top,
          44,
          43,
          filled ? (k ? C.cyan : C.blue) : C.panel,
          C.muted,
          3,
        );
      }
      api.text(
        ctx,
        k && !showResults ? '?' : scores[j] + ' / ' + count,
        1690,
        top + 37,
        33,
        C.ink,
        'center',
      );
    });
    if (task === 'Code') {
      const floorX = x + codeFloor * pitch - 4;
      api.line(ctx, floorX, y - 20, floorX, y + 139, C.yellow, 4);
      api.text(ctx, 'Minimum ' + codeFloor, floorX, y + 176, 30, C.yellow, 'center');
    }
  });
}

export function paintPretrainingMainFreshCorpus(
  ctx,
  scene,
  state,
  api,
  C,
  c,
  b,
  p,
  cue,
  P,
  D,
  beg,
) {
  const baseline = 0.7,
    strict = 0.9;
  const total = releaseBatch.reduce((sum, r) => sum + r.tokens, 0);
  const retained = releaseBatch.filter((r) => r.score >= strict);
  const tokens = retained.reduce((sum, r) => sum + r.tokens, 0);
  if (b < 2) {
    const cutoff = Math.round((baseline + (strict - baseline) * P('move')) * 100) / 100;
    const rows = releaseBatch.map((record) => ({
      record,
      label: record.source,
      detail: record.tokens + ' tokens',
    }));
    scoreRuler(ctx, api, rows, { cutoff, statuses: b === 1 && D('move') });
    let message = '600 tokens at cutoff 0.70';
    if (beg('predict')) message = 'At 0.90, how many tokens survive, and from which source?';
    if (beg('move')) message = 'Keep records that reach the new cutoff.';
    if (D('fraction'))
      message =
        tokens +
        ' / ' +
        total +
        ' tokens = ' +
        Math.round((100 * tokens) / total) +
        '%   ·   Docs only';
    api.text(ctx, message, 960, 959, 42, C.ink, 'center');
    return;
  }
  if (b < 4) {
    scorecard(ctx, api, D('docs'), D('results'));
    const { baseline: scores, candidate, codeFloor, casesPerTask } = releaseEvaluation;
    const sum = (a) => a.reduce((n, v) => n + v, 0);
    let summary = 'Same checkpoint, training budget and held-out cases';
    if (D('combined'))
      summary =
        'Combined: ' +
        sum(scores) +
        ' → ' +
        sum(candidate) +
        ' of ' +
        2 * casesPerTask +
        '     ·     Release the stricter cutoff?';
    if (D('hold')) {
      const missing = codeFloor - candidate[1];
      summary =
        missing > 0
          ? 'Hold   ·   Code needs ' +
            missing +
            ' more ' +
            (missing === 1 ? 'success' : 'successes') +
            ' to meet its minimum.'
          : 'The candidate meets the code minimum.';
    }
    api.text(ctx, summary, 960, 962, 38, D('hold') ? C.yellow : C.ink, 'center');
    return;
  }
  const addCode = D('restore');
  const records = releaseBatch.filter(
    (r) => r.score >= (r.source === 'Code' && addCode ? baseline : strict),
  );
  const newTotal = records.reduce((sum, r) => sum + r.tokens, 0);
  api.text(ctx, 'Next training mix', 150, 300, 47, C.ink);
  api.text(ctx, 'Code cutoff', 150, 405, 34, C.muted);
  api.text(ctx, (addCode ? baseline : strict).toFixed(2), 810, 409, 44, C.pink, 'right');
  api.text(ctx, 'Docs and web cutoff', 150, 479, 34, C.muted);
  api.text(ctx, strict.toFixed(2), 810, 483, 44, C.ink, 'right');
  let x = 150;
  for (const record of records) {
    tokenStrip(ctx, api, record, x, 546, record.tokens * 2.2);
    x += record.tokens * 2.2;
  }
  api.text(ctx, newTotal + ' eligible tokens', 150, 744, 39, C.ink);
  if (beg('resume'))
    api.text(ctx, 'Checkpoint: 2 consumed  ·  4 prefetched', 150, 861, 32, C.muted);

  const { candidate, casesPerTask, codeFloor } = releaseEvaluation;
  const previous = candidate[releaseEvaluation.tasks.indexOf('Code')];
  const left = 975;
  const pitch = 39;
  api.text(ctx, 'Held-out code cases', left, 300, 47, C.ink);
  for (const [i, label] of ['Previous trial', 'Fresh trial'].entries()) {
    const y = 528 + 203 * i;
    api.text(ctx, label, left, y - 38, 35, C.ink);
    api.text(
      ctx,
      (i === 0 ? previous : '?') + ' / ' + casesPerTask,
      left + pitch * casesPerTask,
      y - 38,
      44,
      i ? C.yellow : C.ink,
      'right',
    );
    for (let j = 0; j < casesPerTask; j++) {
      api.rect(
        ctx,
        left + j * pitch,
        y,
        pitch - 5,
        54,
        i === 0 && j < previous ? C.cyan : C.panel,
        C.muted,
        3,
      );
    }
  }
  const floorX = left + codeFloor * pitch - 2;
  api.line(ctx, floorX, 509, floorX, 803, C.yellow, 4);
  api.text(ctx, 'Minimum ' + codeFloor, floorX, 868, 37, C.yellow, 'center');
}
export function drawFreshCorpusStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainFreshCorpus);
}
export default {
  id: 'fresh-corpus',
  draw: drawFreshCorpusStage,
  cues: [
    'pt-fresh-corpus-predict',
    'pt-fresh-corpus-move',
    'pt-fresh-corpus-fraction',
    'pt-fresh-corpus-docs',
    'pt-fresh-corpus-results',
    'pt-fresh-corpus-combined',
    'pt-fresh-corpus-hold',
    'pt-fresh-corpus-restore',
    'pt-fresh-corpus-resume',
  ],
};
