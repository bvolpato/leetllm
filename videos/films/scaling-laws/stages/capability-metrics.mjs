import { spoken } from '../cue.mjs';
import { scalingEvent } from '../construction.mjs';
import { band, label, line, rectangle, text } from '../defaults.mjs';
export function drawCapabilityMetrics(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = scalingEvent(scene, state),
    end = progress === 1;
  const result = (caption) => {
    if (end) text(ctx, api, caption, 960, 960, 36, themeColors.green, 'center');
  };
  api.focus.target('sl-capability-metrics-construction', () => {
    if (currentBeat === 2) {
      const rows = [
        '10110',
        '11110',
        '01101',
        '11111',
        '11000',
        '10101',
        '11111',
        '00111',
        '11010',
        '01110',
      ];
      const admitted = (id, total) => Math.floor(spoken(scene, state, id).progress * total);
      const count =
          admitted('metric-first-three', 3) +
          Number(spoken(scene, state, 'metric-fourth').phase === 'after') +
          admitted('metric-rest', 6),
        selected = rows.slice(0, count),
        correct = selected.reduce((sum, row) => sum + [...row].filter((x) => x === '1').length, 0),
        whole = selected.filter((row) => row === '11111').length;
      band(ctx, api, 'Five tokens per answer   ·   blue = correct   ·   pink = incorrect');
      for (let i = 0; i < 10; i++) {
        text(ctx, api, 'E' + (i + 1), 230, 370 + i * 48, 25, themeColors.muted);
        for (let j = 0; j < 5; j++)
          rectangle(
            ctx,
            api,
            310 + j * 72,
            338 + i * 48,
            52,
            30,
            i < count
              ? rows[i][j] === '1'
                ? themeColors.cyan
                : themeColors.pink
              : themeColors.panel,
            themeColors.muted,
          );
      }
      text(ctx, api, 'Partial token credit', 1250, 375, 34, themeColors.cyan, 'center');
      rectangle(ctx, api, 900, 435, 650, 65, themeColors.panel, themeColors.muted);
      rectangle(
        ctx,
        api,
        900,
        435,
        count ? (650 * correct) / (count * 5) : 0,
        65,
        themeColors.cyan,
      );
      text(
        ctx,
        api,
        count ? correct + ' / ' + count * 5 + ' correct tokens' : 'Awaiting scores',
        1225,
        555,
        34,
        themeColors.cyan,
        'center',
      );
      text(ctx, api, 'Whole-answer exact match', 1250, 655, 34, themeColors.yellow, 'center');
      rectangle(ctx, api, 900, 710, 650, 65, themeColors.panel, themeColors.muted);
      rectangle(ctx, api, 900, 710, count ? (650 * whole) / count : 0, 65, themeColors.yellow);
      text(
        ctx,
        api,
        count ? whole + ' / ' + count + ' complete answers' : 'Awaiting scores',
        1225,
        825,
        34,
        themeColors.yellow,
        'center',
      );
      text(
        ctx,
        api,
        'Same answers on both scales   ·   ' + count + ' of 10 scored',
        960,
        950,
        31,
        themeColors.muted,
        'center',
      );
      return;
    }
    band(ctx, api, 'What does the score measure?');
    const pv = 0.3 + 0.6 * progress;
    if (currentBeat === 0) {
      text(ctx, api, 'Nats/token loss', 570, 440, 37, themeColors.blue, 'center');
      text(ctx, api, 'Perplexity = exp(loss)', 1350, 440, 37, themeColors.cyan, 'center');
      line(ctx, api, 800, 430, 1080, 430, themeColors.yellow, 4);
      for (let i = 0; i < 5; i++)
        label(
          ctx,
          api,
          ['Factual', 'Instruction', 'Code', 'Preference', 'Task'][i],
          190 + i * 325,
          650,
          280,
          [
            themeColors.blue,
            themeColors.cyan,
            themeColors.pink,
            themeColors.yellow,
            themeColors.green,
          ][i],
        );
      result('For a coding model, run its generated code against the tests.');
    } else {
      for (let i = 0; i < 5; i++) {
        const x = 240 + i * 320;
        rectangle(ctx, api, x, 360, 230, 230, themeColors.panel, themeColors.muted);
        rectangle(ctx, api, x, 590 - 230 * pv, 230, 230 * pv, themeColors.cyan);
        text(ctx, api, 'Token ' + (i + 1), x + 115, 655, 31, themeColors.ink, 'center');
        text(ctx, api, pv.toFixed(2), x + 115, 730, 35, themeColors.cyan, 'center');
      }
      const pp = pv ** 5;
      rectangle(ctx, api, 350, 815, 1200, 45, themeColors.panel, themeColors.muted);
      rectangle(ctx, api, 350, 815, 1200 * pp, 45, themeColors.yellow);
      text(
        ctx,
        api,
        `Independent whole-answer p⁵ = ${pp.toFixed(4)}`,
        960,
        925,
        35,
        themeColors.yellow,
        'center',
      );
      if (currentBeat === 2)
        text(
          ctx,
          api,
          'Finite exact-match counts can jump while expected p⁵ changes smoothly',
          960,
          300,
          30,
          themeColors.muted,
          'center',
        );
    }
  });
}
export default {
  id: 'capability-metrics',
  draw: drawCapabilityMetrics,
  cues: [
    'sl-capability-metrics-0',
    'sl-capability-metrics-1',
    'sl-capability-metrics-2',
    'metric-first-three',
    'metric-fourth',
    'metric-rest',
  ],
};
