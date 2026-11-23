import { RETAINED_RELEASES } from '../fixtures.mjs';
import { probeRelease } from '../model.mjs';
import { line, panel } from '../defaults.mjs';
import { createHash } from 'node:crypto';
export function drawStrictModelLoader(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = state.beatP ?? 0;
  const drawText = (v, x, y, z = 30, col = themeColors.ink, a = 'left', mono = false) => {
    const text = String(v);
    const paint = () =>
      api.text(ctx, text, x, y, z, col, a, mono || text.includes('_') ? 'mono' : 'sans');
    return paint();
  };
  const footer = (v) => drawText(v, 960, 1025, 24, themeColors.muted, 'center');
  const paper = (title, rows, x, y, w = 760, col = themeColors.blue) => {
    panel(ctx, api, x, y, w, 95 + rows.length * 48, col);
    drawText(title, x + 20, y + 40, 30, col);
    line(ctx, api, x + 18, y + 60, x + w - 18, y + 60, col, 2);
    rows.forEach((v, i) => drawText(v, x + 22, y + 105 + i * 48, 27, col));
  };
  const probe = (release, x, y, ready = true) => {
    const v = probeRelease(release, 9);
    panel(
      ctx,
      api,
      x,
      y,
      730,
      210,
      ready ? (release === 'v1' ? themeColors.green : themeColors.blue) : themeColors.muted,
    );
    drawText('Same request: delay 9', x + 365, y + 45, 33, themeColors.ink, 'center');
    drawText('z = (9 − 5) / 10 = 0.4', x + 365, y + 105, 31, themeColors.yellow, 'center');
    drawText(
      ready
        ? `${v.model.intercept} + ${v.model.slope} × 0.4 = ${v.score.toFixed(2)} → ${v.warning ? 'WARN' : 'SILENT'}`
        : `${v.model.intercept} + ${v.model.slope} × 0.4 = pending`,
      x + 365,
      y + 168,
      31,
      ready ? (v.warning ? themeColors.green : themeColors.blue) : themeColors.muted,
      'center',
    );
  };
  {
    if (currentBeat === 0) {
      paper(
        'Saved complete computation',
        [
          'feature: delay_minutes',
          'impute 5 · center 5 · range 10',
          'slope 1.2 · intercept 0.5',
          'threshold 0.5 · train IDs / cutoff',
        ],
        130,
        340,
        850,
        themeColors.blue,
      );
      paper(
        'Separate identities',
        [
          'Training rows digest',
          'Full retrospective fixture digest',
          'Builder bytes / Python version',
        ],
        1110,
        340,
        680,
        themeColors.yellow,
      );
      probe('v1', 600, 760);
    } else if (currentBeat === 1) {
      const original = RETAINED_RELEASES.v1.bytes,
        changed = original + ' ',
        digest = (x) => createHash('sha256').update(x).digest('hex');
      paper(
        'One appended byte',
        [
          'original … }',
          'changed  … } [space]',
          `SHA ${digest(original).slice(0, 12)}`,
          `SHA ${digest(changed).slice(0, 12)}`,
        ],
        130,
        330,
        800,
        themeColors.pink,
      );
      paper(
        'Matching hash still checks values',
        [
          'scale 0 → REJECT',
          'slope NaN → REJECT',
          'duplicate key → REJECT',
          'True / huge input → REJECT',
        ],
        1050,
        330,
        740,
        themeColors.yellow,
      );
      drawText(
        'Digest equality precedes semantic validation and inference',
        960,
        900,
        37,
        themeColors.green,
        'center',
      );
    } else {
      paper(
        'Numeric JSON contract',
        [
          'Known schema and finite values',
          'Compatible code / environment',
          'Reload expected predictions',
        ],
        150,
        360,
        740,
        themeColors.blue,
      );
      paper(
        'General estimator persistence',
        [
          'Pickle can construct objects',
          'Untrusted artifact can execute code',
          'Cross-version sklearn load unsupported',
        ],
        1050,
        360,
        740,
        themeColors.pink,
      );
      drawText(
        'Restore the complete compatible computation, then verify it',
        960,
        900,
        37,
        themeColors.yellow,
        'center',
      );
    }
    footer(
      'The exact article Python loader and all edge cases were executed; visual package uses the same score fixture',
    );
  }
  return;
}
export default {
  id: 'strict-model-loader',
  draw: drawStrictModelLoader,
  cues: ['strict-model-loader-b1', 'strict-model-loader-b2', 'strict-model-loader-b3'],
};
