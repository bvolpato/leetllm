import { extractionFixture } from '../fixtures.mjs';
import { extractionSnapshot } from '../model.mjs';
import { legacyText, withPretrainingOriginalFrame } from '../defaults.mjs';
export function paintPretrainingOriginalExtract(ctx, scene, state, api, C, c, t, b, p, s) {
  const current = extractionSnapshot(b, p, state.cues),
    ys = [450, 510, 630, 675];
  api.rect(ctx, 140, 270, 740, 625, C.panel, undefined, 14);
  api.rect(ctx, 1080, 270, 700, 625, C.panel, undefined, 14);
  api.focus.target('source-page', () =>
    legacyText(ctx, api, C, 'Downloaded page · source P1', 175, 325, 33, C.blue),
  );
  legacyText(ctx, api, C, 'Extracted document', 1115, 325, 33, C.cyan);
  api.line(ctx, 175, 345, 840, 345, C.blue, 3);
  api.line(ctx, 1115, 345, 1745, 345, C.cyan, 3);
  c.fade(current.excludedOpacity, () => {
    api.focus.target('excluded-navigation', () =>
      legacyText(ctx, api, C, extractionFixture[0].text, 190, 375, 28, C.muted),
    );
    api.focus.target('excluded-navigation', () =>
      legacyText(ctx, api, C, extractionFixture.at(-1).text, 190, 850, 28, C.muted),
    );
  });
  if (current.selected > 0)
    c.fade(current.selected, () => {
      api.rect(ctx, 175, 410, 665, 315, '#63deec08', undefined, 10);
      api.line(ctx, 175, 410, 175, 725, C.cyan, 3);
    });
  current.spans.forEach((row, i) => {
    const amount = current.amounts[i],
      color = row.code ? C.pink : C.ink;
    if (amount === 0 || amount === 1)
      c.fade(amount === 0 ? 1 : 0.28, () =>
        api.focus.target('extracted-spans', () =>
          api.text(ctx, row.text, 195, ys[i], 29, color, 'left', row.code ? 'mono' : 'sans'),
        ),
      );
    if (amount > 0)
      api.focus.target('extracted-spans', () =>
        api.text(
          ctx,
          row.text,
          195 + (1125 - 195) * amount,
          ys[i],
          29,
          color,
          'left',
          row.code ? 'mono' : 'sans',
        ),
      );
  });
  if (b === 0)
    legacyText(
      ctx,
      api,
      C,
      current.selected === 1
        ? 'Article body selected · extraction pending'
        : 'Identify navigation and the main body',
      1430,
      465,
      27,
      C.muted,
      'center',
    );
  if (current.probeReady) {
    api.line(ctx, 1125, 705, 1195, 705, C.yellow, 4);
    api.line(ctx, 1125, 695, 1125, 715, C.yellow, 3);
    api.line(ctx, 1195, 695, 1195, 715, C.yellow, 3);
    legacyText(
      ctx,
      api,
      C,
      `${current.indentation} leading spaces retained`,
      1430,
      770,
      27,
      C.yellow,
      'center',
    );
    legacyText(
      ctx,
      api,
      C,
      current.punctuation ? 'Sentence punctuation preserved ✓' : 'Punctuation needs review',
      1430,
      835,
      27,
      current.punctuation ? C.green : C.pink,
      'center',
    );
  }
  if (b === 2)
    legacyText(
      ctx,
      api,
      C,
      'P1 retained spans → A: prose · C: code · E: prose',
      960,
      950,
      27,
      C.cyan,
      'center',
    );
  api.focus.target('extraction-policy', () =>
    legacyText(
      ctx,
      api,
      C,
      b === 2
        ? 'Source P1 · extraction policy main-body-v1 · inspect source types before scaling'
        : 'Move the selected spans and retain their structure',
      960,
      990,
      28,
      b === 2 ? C.yellow : C.muted,
      'center',
    ),
  );
}
export function drawExtractStage(ctx, scene, state, api) {
  withPretrainingOriginalFrame(ctx, scene, state, api, paintPretrainingOriginalExtract);
}
export default {
  id: 'extract',
  draw: drawExtractStage,
  cues: [
    'extract-b1-1',
    'extract-b1-2',
    'extract-b2-1',
    'extract-b2-2',
    'extract-code',
    'extract-b3-1',
    'extract-b3-2',
  ],
};
