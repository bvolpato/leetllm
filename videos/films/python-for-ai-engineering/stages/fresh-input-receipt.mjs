import { exactMatch } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { freshState } from '../model.mjs';
import { box, mark, text } from '../defaults.mjs';

export function drawFreshInputReceipt(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  const m = freshState(state);
  const scan = cueProgress(state, 'py-fresh-scan', 0, 0.18, 0.55);
  const saved = cueProgress(state, 'py-fresh-open', 2, 0.05, 0.2);
  const reload = cueProgress(state, 'py-fresh-reload', 2, 0.4, 0.55);
  const replay = cueProgress(state, 'py-fresh-score', 2, 0.58, 0.72);
  const trace = cueProgress(state, 'trace-misses', 4, 0.03, 0.22);
  const axis = cueProgress(state, 'request-axis', 4, 0.66, 0.83);
  const products = cueProgress(state, 'gate-products', 3, 0.43, 0.52);
  const runningAgain = m.repaired && reload > 0;
  const loaded = runningAgain ? Math.floor(reload * m.rows.length) : Math.floor(scan * 4);
  const scored = runningAgain && loaded === m.rows.length ? Math.floor(replay * loaded) : 0;
  const failed = m.rejected || (beat === 2 && !runningAgain);
  const color = api.C;

  text(ctx, api, 'requests.jsonl', 165, 245, 40, color.ink, 'left', true);
  text(ctx, api, 'line', 165, 335, 28, color.muted);
  text(ctx, api, 'request', 320, 335, 28, color.muted);
  text(ctx, api, 'expected', 530, 335, 28, color.muted);
  text(ctx, api, 'prediction', 800, 335, 28, color.muted);
  text(ctx, api, '01', 165, 410, 32, color.muted, 'left', true);
  text(ctx, api, '(blank)', 320, 410, 29, color.muted, 'left', true);

  m.rows.forEach((row, i) => {
    const y = 496 + 86 * i;
    const current = i === Math.min(loaded, m.rows.length - 1) && loaded < m.rows.length;
    if (current && (!m.repaired || runningAgain))
      box(ctx, api, 143, y - 54, 930, 72, failed ? color.pink : color.yellow);
    text(ctx, api, '0' + (i + 2), 165, y, 33, color.muted, 'left', true);
    const isMiss = trace > 0 && !exactMatch(row.expected, row.prediction);
    mark(api, 'request-' + row.id, () => {
      text(ctx, api, row.id, 320, y, 35, isMiss ? color.pink : color.ink, 'left', true);
      if (isMiss) api.line(ctx, 320, y + 13, 320 + 67 * trace, y + 13, color.pink, 4);
    });
    text(ctx, api, JSON.stringify(row.expected), 530, y, 35, color.blue, 'left', true);
    mark(api, 'prediction-' + row.id, () =>
      text(
        ctx,
        api,
        JSON.stringify(row.prediction),
        800,
        y,
        35,
        i === 4 && (current || (beat === 2 && !runningAgain)) ? color.yellow : color.cyan,
        'left',
        true,
      ),
    );
  });

  mark(api, 'load-list', () => {
    const previousRun = beat === 2 && !runningAgain;
    text(
      ctx,
      api,
      beat === 4 ? 'One decision per request' : previousRun ? 'Previous load' : 'load_examples(path)',
      1175,
      245,
      36,
      color.cyan,
      'left',
      !previousRun && beat !== 4,
    );
    m.rows.forEach((row, i) => {
      const x = 1175 + i * 125;
      box(ctx, api, x, 296, 106, 86, i < loaded ? color.cyan : color.muted);
      if (i < loaded) text(ctx, api, row.id, x + 53, 351, 31, color.cyan, 'center', true);
    });
    if ((beat === 1 && m.decoded) || previousRun)
      text(ctx, api, 'line 6    true → True (bool)', 1175, 475, 32, color.ink, 'left', true);
    if (failed) {
      text(ctx, api, 'isinstance(True, str) → False', 1175, 555, 32, color.pink, 'left', true);
    } else if (runningAgain && loaded === m.rows.length) {
      if (beat < 4) text(ctx, api, 'score_examples(rows)', 1175, 480, 36, color.cyan, 'left', true);
      m.rows.slice(0, scored).forEach((row, i) => {
        const matches = exactMatch(row.expected, row.prediction);
        const x = 1228 + i * 125;
        if (!matches && trace > 0) {
          const tip = 510 - 120 * trace;
          api.line(ctx, x, 510, x, tip, color.pink, 3);
          api.circle(ctx, x, tip, 5, color.pink);
        }
        text(
          ctx,
          api,
          matches ? 'True' : 'False',
          x,
          560,
          30,
          matches ? color.green : color.pink,
          'center',
          true,
        );
      });
      if (m.floor && axis > 0) {
        const right = 1175 + 606 * axis;
        api.line(ctx, 1175, 581, 1175, 595, color.blue, 3);
        api.line(ctx, 1175, 595, right, 595, color.blue, 3);
        if (axis === 1) {
          api.line(ctx, right, 581, right, 595, color.blue, 3);
          text(
            ctx,
            api,
            'request axis  ·  length ' + m.result.total,
            1478,
            644,
            31,
            color.blue,
            'center',
          );
        }
      }
    }
  });

  mark(api, 'producer-record', () => {
    if (beat >= 2) {
      const annotateRepair = beat === 2 && m.repaired && !runningAgain;
      text(ctx, api, 'Producer log   /   request 505', 165, annotateRepair ? 906 : 921, 29, color.muted);
      text(
        ctx,
        api,
        saved === 1 ? 'saved prediction = "open"' : 'saved prediction = …',
        165,
        annotateRepair ? 953 : 994,
        36,
        color.cyan,
        'left',
        true,
      );
      if (annotateRepair)
        text(ctx, api, 'Repair the representation while preserving the producer’s actual wrong label.',
          606, 1013, 27, color.ink, 'center');
    }
  });

  mark(api, 'gate-comparison', () => {
    if (scored === m.rows.length && axis === 0) {
      const r = m.result;
      const rule =
        r && products === 1
          ? '3 × ' +
            r.matches +
            ' = ' +
            3 * r.matches +
            (r.gate ? ' ≥ ' : ' < ') +
            '2 × ' +
            r.total +
            ' = ' +
            2 * r.total
          : 'Accuracy floor   2/3';
      text(ctx, api, rule, 1175, 632, 34, color.ink, 'left', true);
    }
  });
  mark(api, 'printed-receipt', () => {
    box(ctx, api, 1140, 670, 665, 157, color.muted);
    text(ctx, api, 'stdout', 1175, 723, 29, color.muted, 'left', true);
    if (m.result) {
      const r = m.result;
      text(ctx, api, 'Eval rows: ' + r.total, 1765, 723, 29, color.ink, 'right', true);
      text(
        ctx,
        api,
        r.fraction.toFixed(3) + '  (' + r.matches + '/' + r.total + ')',
        1175,
        795,
        48,
        color.ink,
        'left',
        true,
      );
    } else if (m.noMetric || (failed && beat === 2)) {
      text(ctx, api, '(no output)', 1175, 793, 39, color.muted, 'left', true);
    }
  });
  if (beat === 1 && m.noMetric)
    mark(api, 'printed-receipt', () =>
      text(ctx, api, 'The unchanged loader prints no partial score.', 165, 963, 36, color.ink),
    );
  mark(api, 'command-status', () => {
    box(ctx, api, 1140, 854, 665, 148, color.muted);
    text(ctx, api, 'stderr', 1175, 908, 29, color.muted, 'left', true);
    if (failed) {
      text(ctx, api, 'TypeError on line 6', 1765, 908, 28, color.pink, 'right', true);
      text(ctx, api, 'prediction must be a string', 1175, 966, 35, color.pink);
    } else if (m.floor && !m.result.gate) {
      text(ctx, api, 'Gate failed', 1175, 969, 41, color.pink, 'left', true);
      text(ctx, api, 'exit 1', 1765, 969, 32, color.ink, 'right', true);
    }
  });
}

export default {
  id: 'fresh-input-receipt',
  draw: drawFreshInputReceipt,
  cues: [
    'py-fresh-scan',
    'py-fresh-decode',
    'py-fresh-error',
    'py-fresh-no-metric',
    'py-fresh-open',
    'py-fresh-repair',
    'py-fresh-reload',
    'py-fresh-score',
    'py-fresh-count',
    'gate-products',
    'py-fresh-floor',
    'trace-misses',
    'request-axis',
  ],
};
