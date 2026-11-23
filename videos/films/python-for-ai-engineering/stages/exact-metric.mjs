import { exactMatch, score } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { examples } from '../fixtures.mjs';
import { metricFrame, perfectRuns } from '../model.mjs';
import { box, mark, text } from '../defaults.mjs';

const baseline = score(examples);
export function drawExactMetric(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const m = metricFrame(state);
  const rerun = cueProgress(state, 'rerun-label', 1, 0.08, 0.2) === 1;
  const aCount = cueProgress(state, 'rerun-result', 1, 0.22, 0.3) === 1;
  const bCount = cueProgress(state, 'short-count', 1, 0.76, 0.94) === 1;
  const countsCovered = beat === 1 && cueProgress(state, 'cover-counts', 1, 0.95, 0.98) === 1;
  const c = api.C;
  const xs = [380, 720, 1060];
  const width = 300;
  const receipt = (r) => r.matches + ' / ' + r.total;
  text(ctx, api, 'Request', 156, 285, 34, c.muted);
  xs.forEach((x, i) =>
    mark(api, 'request-' + (101 + i), () => {
      text(ctx, api, 101 + i, x + width / 2, 278, 40, c.blue, 'center', true);
      text(
        ctx,
        api,
        'expect ' + examples[i].expected,
        x + width / 2,
        340,
        26,
        c.muted,
        'center',
        true,
      );
    }),
  );
  text(ctx, api, 'Accuracy', 1605, 285, 34, c.muted, 'center');

  function fileRow(label, y, rows, result, removing = 0, showAccuracy = true) {
    mark(api, 'run-names', () => text(ctx, api, label, 156, y + 66, 36, c.ink));
    examples.forEach((original, i) =>
      mark(api, 'request-' + (101 + i), () => {
        const x = xs[i];
        const row = rows.find((entry) => original.prompt === entry.prompt);
        box(ctx, api, x, y, width, 98, c.muted);
        if (row) {
          ctx.save();
          if (i === 1) ctx.globalAlpha *= 1 - removing;
          const ok = exactMatch(row.expected, row.prediction);
          text(
            ctx,
            api,
            row.prediction.trim().toLowerCase(),
            x + width / 2,
            y + 64,
            37,
            ok ? c.green : c.pink,
            'center',
            true,
          );
          ctx.restore();
        } else {
          text(ctx, api, 'absent', x + width / 2, y + 64, 31, c.muted, 'center');
        }
      }),
    );
    text(
      ctx,
      api,
      result && showAccuracy ? result.fraction.toFixed(3) : '…',
      1605,
      y + 48,
      48,
      c.ink,
      'center',
      true,
    );
    if (label === 'Yesterday' || !countsCovered)
      text(
        ctx,
        api,
        result ? receipt(result) : 'count pending',
        1605,
        y + 92,
        29,
        c.muted,
        'center',
        true,
      );
  }

  fileRow('Yesterday', 383, examples, baseline);
  if (beat === 0) {
    mark(api, 'count-floor', () => {
      text(ctx, api, '2/3 accuracy floor', 390, 650, 36, c.muted);
      text(
        ctx,
        api,
        '3 × ' + baseline.matches + ' ≥ 2 × ' + baseline.total,
        390,
        755,
        70,
        c.ink,
        'left',
        true,
      );
      if (cueProgress(state, 'integer-floor', 0) === 1)
        text(ctx, api, '6 = 6    PASS', 1080, 750, 55, c.green, 'left', true);
    });
    return;
  }

  mark(api, 'file-a', () =>
    fileRow(
      'A',
      525,
      rerun ? perfectRuns[0].rows : examples,
      aCount ? perfectRuns[0].result : null,
    ),
  );
  mark(api, 'fixture-diff', () =>
    fileRow('B', 667, m.rows, m.removed === 1 ? m.result : null, m.removed, bCount),
  );
  if (beat === 1) {
    text(ctx, api, 'Same scorer   ·   same uv.lock', 170, 923, 33, c.muted);
    return;
  }

  const diff = cueProgress(state, 'inspect-input-diff', 2, 0.8, 0.86);
  if (diff > 0) {
    mark(api, 'input-diff', () => {
      text(ctx, api, '$ git diff -- eval/access_requests.jsonl', 160, 851, 37, c.ink, 'left', true);
      if (diff === 1) {
        const removed = examples.find((row) => !m.rows.includes(row));
        const raw = JSON.stringify(removed);
        const wrapAt = raw.indexOf(',"expected":') + 1;
        text(ctx, api, 'One deleted line', 1715, 851, 31, c.muted, 'right');
        text(ctx, api, '-' + raw.slice(0, wrapAt), 160, 924, 40, c.pink, 'left', true);
        text(ctx, api, raw.slice(wrapAt), 184, 987, 40, c.pink, 'left', true);
      }
    });
    return;
  }
  mark(api, 'fixture-assertion', () => {
    text(ctx, api, 'rows = load_examples(path_to_fixture_B)', 160, 847, 31, c.muted, 'left', true);
    text(ctx, api, 'assert score_examples(rows)[:2] == (2, 3)', 160, 914, 36, c.ink, 'left', true);
    if (m.assertion === 1)
      text(ctx, api, 'FAIL  expected (2, 3) · received (2, 2)', 160, 987, 36, c.pink, 'left', true);
  });
}
export default {
  id: 'exact-metric',
  draw: drawExactMetric,
  cues: [
    'integer-floor',
    'rerun-label',
    'rerun-result',
    'remove-request',
    'short-count',
    'cover-counts',
    'follow-request',
    'fixture-fails',
    'inspect-input-diff',
  ],
};
