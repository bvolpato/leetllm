import { codeText, focusTarget, rectangle, text } from './defaults.mjs';
import { matchesReferenceReport, score } from './model.mjs';

// The source, read line, and run below it keep the same position across both scenes.
export function drawReadPaths(
  ctx,
  api,
  { imageName, bakedRows, hostRows, ran, compared, editing = false },
) {
  const { C } = api;
  focusTarget(ctx, api, 'tested-image', () => {
    codeText(ctx, api, 'Local image used for both runs', 140, 277, 36);
    codeText(ctx, api, imageName, 737, 277, 34, C.blue, 'left', 'mono');
  });
  for (const [i, rows] of [bakedRows, hostRows].entries()) {
    const x = i ? 1025 : 140;
    const mid = x + 375;
    const color = i ? C.cyan : C.blue;
    const row = rows.find((row) => row.id === 102);
    const result = score(rows);
    const exact = matchesReferenceReport(result);
    rectangle(ctx, api, x, 328, 750, 260, C.panel, color);
    codeText(ctx, api, i ? './eval on the host' : '/app/eval in the image', x + 28, 389, 38, color);
    codeText(ctx, api, 'Request', x + 28, 467, 28, C.muted);
    codeText(ctx, api, 'Expected', x + 192, 467, 28, C.muted);
    codeText(ctx, api, 'Prediction', x + 448, 467, 28, C.muted);
    codeText(ctx, api, String(row.id), x + 28, 536, 38, C.ink, 'left', 'mono');
    codeText(ctx, api, row.expected, x + 192, 536, 38);
    const prediction = () =>
      codeText(ctx, api, row.prediction, x + 448, 536, 38, i && editing ? C.yellow : C.ink);
    if (i) focusTarget(ctx, api, 'changed-fixture', prediction);
    else prediction();

    focusTarget(ctx, api, i ? 'mounted-report' : 'baked-report', () => {
      api.arrow(ctx, mid, 668, mid, 603, color, 4);
      codeText(
        ctx,
        api,
        i ? 'Run with the read-only bind' : 'Run without a bind',
        x + 24,
        733,
        35,
        color,
      );
      codeText(
        ctx,
        api,
        'open /app/eval/access_requests.jsonl',
        x + 24,
        787,
        27,
        C.ink,
        'left',
        'mono',
      );
      if (ran[i]) {
        const receipt =
          result.matches +
          '/' +
          result.total +
          ' · threshold ' +
          (result.threshold ? 'PASS' : 'FAIL');
        codeText(ctx, api, receipt, x + 24, 862, 35, C.ink);
      }
      if (ran[i] && compared[i]) {
        codeText(
          ctx,
          api,
          'Exact reference: ' + (exact ? 'PASS' : 'FAIL'),
          x + 24,
          923,
          31,
          exact ? C.green : C.pink,
        );
      }
    });
  }
}

export function reportNote(ctx, api, value, id, color = api.C.muted) {
  focusTarget(ctx, api, id, () => text(ctx, api, value, 960, 1010, 30, color));
}
