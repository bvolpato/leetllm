import { bar, drawText, note, pill, rectangle, withPretrainingMainFrame } from '../defaults.mjs';
export function paintPretrainingMainProseGates(ctx, scene, state, api, C, c, b, p, cue, P, D, beg) {
  if (b === 0) {
    drawText(ctx, api, C, 'Executable English-prose subset', 960, 300, 36, C.blue);
    const labels = [
      'Words: 50 … 100,000',
      'Mean length: 3 … 10',
      'Hash / words ≤ 0.1',
      'Ellipsis / words ≤ 0.1',
    ];
    labels.forEach((v, i) => {
      rectangle(ctx, api, C, 250, 390 + i * 125, 1420, 85, C.panel, i < 2 ? C.blue : C.yellow);
      if (i < 2 ? beg('words') : beg('symbols'))
        drawText(ctx, api, C, v, 960, 447 + i * 125, 34, i < 2 ? C.blue : C.yellow);
    });
    note(
      ctx,
      api,
      C,
      'Whitespace-split words and exact implemented counters · no model-quality claim',
    );
  } else if (b === 1) {
    const rows = [
      ['Runbook', '71 words, including “the” and “and”', 'Keep'],
      ['Short note', '4 words  <  50', 'Drop'],
      ['sale × 80', '0 distinct listed stopwords  <  2', 'Drop'],
      ['CSS rules', '25 hash signs / 125 words  >  0.10', 'Drop'],
    ];
    rows.forEach(([v, reason, result], i) => {
      const y = 430 + i * 120;
      drawText(ctx, api, C, v, 400, y, 32, C.blue);
      if (beg('stopwords')) drawText(ctx, api, C, reason, 1000, y, 29, C.muted);
      if (D('outputs'))
        pill(ctx, api, C, result, 1550, y - 10, 210, result === 'Keep' ? C.green : C.pink);
    });
    note(
      ctx,
      api,
      C,
      'At least 80% of words contain a letter. At least two distinct listed English stopwords occur.',
    );
  } else {
    drawText(ctx, api, C, 'Published checks beyond this subset', 960, 310, 36, C.yellow);
    ['2-gram', '3-gram', '4-gram'].forEach((v, i) => {
      const x = 350 + i * 550;
      drawText(ctx, api, C, v, x, 430, 34, C.blue);
      const value = [0.2, 0.18, 0.16][i];
      bar(
        ctx,
        api,
        C,
        x - 170,
        550,
        340,
        P('ngrams') * value,
        0.25,
        C.cyan,
        'Character fraction limit',
      );
      if (D('ngrams')) drawText(ctx, api, C, value.toFixed(2), x, 675, 44, C.cyan);
    });
    if (D('subset'))
      pill(ctx, api, C, 'Next check for the runbook: repeated passages', 960, 850, 1200, C.yellow);
    note(
      ctx,
      api,
      C,
      'Longer n-grams have separate duplicate-character rules · evaluate code and other languages separately',
    );
  }
}
export function drawProseGatesStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainProseGates);
}
export default {
  id: 'prose-gates',
  draw: drawProseGatesStage,
  cues: [
    'pt-prose-gates-words',
    'pt-prose-gates-symbols',
    'pt-prose-gates-stopwords',
    'pt-prose-gates-outputs',
    'pt-prose-gates-ngrams',
    'pt-prose-gates-subset',
  ],
};
