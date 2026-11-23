import { CLAIMS } from '../fixtures.mjs';
import { metrics, omissionSnapshot } from '../model.mjs';
import { equation, foot, text } from '../defaults.mjs';
export function drawOmittedPoint(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase } = api,
    beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.88);
  {
    const snapshot = omissionSnapshot(beat, progress2);
    if (beat === 0 && state.cues?.['emit-short-answer']) {
      snapshot.ids = ['closed', 'box'].slice(
        0,
        Math.ceil(2 * api.focus.progress('emit-short-answer', 0)),
      );
      Object.assign(snapshot, metrics(snapshot.ids));
    }
    if (beat === 2 && state.cues?.['receipt-answer']) {
      snapshot.ids = api.focus.visible('receipt-answer') ? ['next'] : [];
      Object.assign(snapshot, metrics(snapshot.ids));
    }
    const emitted = new Set(snapshot.ids);
    text(ctx, api, 'How do I return a book on Sunday?', 960, 280, 38, themeColors.ink, 'center');
    text(ctx, api, 'Required task points', 470, 350, 29, themeColors.blue, 'center');
    text(
      ctx,
      api,
      beat === 2 ? 'Try a receipt-only answer' : 'Build the emitted answer',
      1430,
      350,
      29,
      themeColors.yellow,
      'center',
    );
    CLAIMS.slice(0, 3).forEach((claim, i) => {
      const covered = emitted.has(claim.id),
        y = 390 + i * 170;
      api.focus.target('required-points', () =>
        components.panel({
          x: 150,
          y,
          width: 730,
          height: 115,
          fill: themeColors.panel,
          stroke: covered ? themeColors.green : themeColors.muted,
        }),
      );
      text(ctx, api, claim.text, 180, y + 52, 31, covered ? themeColors.green : themeColors.muted);
      text(
        ctx,
        api,
        covered ? 'Covered by emitted claim' : 'Missing from answer',
        180,
        y + 91,
        24,
        covered ? themeColors.green : themeColors.muted,
      );
      if (covered) api.arrow(ctx, 900, y + 57, 1035, y + 57, themeColors.green, 4);
    });
    api.focus.target('emitted-answer', () =>
      components.panel({
        x: 1070,
        y: 390,
        width: 700,
        height: 455,
        fill: themeColors.panel,
        stroke: themeColors.yellow,
      }),
    );
    if (snapshot.ids.length === 0)
      text(
        ctx,
        api,
        beat === 2 ? 'Which task points would it cover?' : 'Waiting for the first claim',
        1420,
        555,
        29,
        themeColors.muted,
        'center',
      );
    snapshot.ids.forEach((id, i) => {
      const claim = CLAIMS.find((item) => item.id === id),
        y = 475 + i * 100;
      text(ctx, api, claim.text, 1105, y, 31, themeColors.green);
      text(ctx, api, `Supported by source ${claim.source}`, 1105, y + 39, 23, themeColors.muted);
    });
    const count = snapshot.ids.length;
    text(ctx, api, 'Faithfulness', 1205, 760, 25, themeColors.green, 'center');
    text(ctx, api, 'Task completeness', 1590, 760, 25, themeColors.yellow, 'center');
    api.focus.target('faithfulness-ratio', () =>
      equation(
        ctx,
        api,
        count ? String.raw`\frac{${count}}{${count}}=1` : String.raw`\text{undefined}`,
        1205,
        820,
        count ? 35 : 26,
        themeColors.green,
      ),
    );
    api.focus.target('completeness-ratio', () =>
      equation(ctx, api, String.raw`\frac{${count}}{3}`, 1590, 820, 37, themeColors.yellow),
    );
    foot(
      ctx,
      api,
      'The same supported claims can leave required parts of the user’s question unanswered',
    );
  }
}
export default {
  id: 'omitted-point',
  draw: drawOmittedPoint,
  cues: [
    'emit-short-answer',
    'completeness-denominator',
    'support-denominator',
    'receipt-answer',
    'missing-action',
  ],
};
