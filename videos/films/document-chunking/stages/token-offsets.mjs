import { LONG_SECTION } from '../fixtures.mjs';
import { extendedFrame } from '../construction.mjs';
import { extendedLine, extendedNote, extendedText, spanBracket } from '../defaults.mjs';
export function drawTokenOffsets(ctx, scene, state, api) {
  const { C: themeColors } = api,
    {
      b: currentBeat,
      p: progress2,
      progress,
      begun,
      freshStage,
    } = extendedFrame('token-offsets', state);
  const colors = [themeColors.blue, themeColors.green, themeColors.pink];
  api.focus.target('token-offsets-operation', () => {
    const labels = 'Source: Incident Runbook\nSection: Rollback failure',
      indexed = 'Source: Incident Runbook\nSection: Rollback failure\n' + LONG_SECTION;
    if (currentBeat === 0) {
      extendedText(
        ctx,
        api,
        'One evidence span · separate measurement units',
        960,
        280,
        33,
        themeColors.ink,
        'center',
      );
      extendedText(ctx, api, LONG_SECTION, 960, 410, 27, themeColors.blue, 'center');
      const measuring = begun('measure-full-input');
      const measurements = [
        ['Whitespace words', 15, themeColors.blue],
        ['Normalized characters', LONG_SECTION.length, themeColors.green],
        ['Embedder tokens', measuring ? 'Tokenize' : '?', themeColors.yellow],
      ];
      measurements.forEach(([label, value, color], i) => {
        const x = 410 + i * 550;
        extendedText(ctx, api, label, x, 590, 29, color, 'center');
        extendedText(ctx, api, value, x, 705, 53, color, 'center');
      });
      if (begun('token-model-contract')) {
        extendedText(
          ctx,
          api,
          'MiniLM-L6-v2  /  384 output coordinates  /  default input limit: 256 wordpieces',
          960,
          875,
          32,
          themeColors.cyan,
          'center',
        );
      }
      if (measuring) extendedNote(
        ctx,
        api,
        "Count the heading, the body and the special tokens with the embedding model's tokenizer.",
      );
    } else if (currentBeat === 1 || currentBeat === 2) {
      const cap = 16;
      const shorter = currentBeat === 2 && progress('shorter-child') === 1;
      const groups = [
        { label: 'Body', count: shorter ? 11 : 12, color: themeColors.blue },
        { label: 'Heading', count: 3, color: themeColors.cyan },
        { label: 'Special tokens', count: 2, color: themeColors.yellow },
      ];
      const total = groups.reduce((sum, group) => sum + group.count, 0);
      extendedText(ctx, api, 'Illustrative tokenizer readings  /  input limit: 16 tokens', 126, 293, 38);
      const firstTotal = currentBeat === 2 && progress('token-total') === 1;
      const left = 160, step = 92;
      for (let i = 0; i < cap; i++)
        api.rect(ctx, left + i * step, 559, step - 6, 110, themeColors.panel, themeColors.muted, 4);
      let start = 0;
      for (const [index, group] of groups.entries()) {
        const x = left + start * step;
        extendedText(ctx, api, group.label + '  ' + group.count, 160 + index * 571, 478, 43, group.color);
        for (let n = 0; firstTotal && n < group.count; n++) {
          api.rect(ctx, x + n * step, 559, step - 6, 110, themeColors.panel, group.color, 4);
          extendedText(ctx, api, String(start + n + 1), x + (n + 0.5) * step, 628, 30, group.color, 'center');
        }
        start += group.count;
      }
      const stop = left + cap * step - 3;
      extendedLine(ctx, api, stop, 537, stop, 716, themeColors.pink, 5);
      extendedText(ctx, api, 'Limit', stop, 760, 32, themeColors.pink, 'center');
      const settled = firstTotal && (!shorter || progress('all-sixteen') === 1);
      extendedText(ctx, api, settled ? groups.map(g => g.count).join(' + ') + ' = ' + total +
        (total > cap ? ' tokens  /  split and retokenize' : ' tokens  /  fits') :
        'Will the full input fit?', 960, 914, 46, settled ? themeColors.ink : themeColors.yellow, 'center');
    } else if (currentBeat === 3) {
      extendedText(
        ctx,
        api,
        'Source evidence · chars [0, 93)',
        960,
        290,
        31,
        themeColors.blue,
        'center',
      );
      extendedText(ctx, api, LONG_SECTION, 960, 390, 27, themeColors.blue, 'center');
      const u = progress('prepend-labels');
      extendedText(
        ctx,
        api,
        'Source: Incident Runbook',
        api.lerp(300, 960, u),
        api.lerp(600, 545, u),
        29,
        themeColors.yellow,
        'center',
      );
      extendedText(
        ctx,
        api,
        'Section: Rollback failure',
        api.lerp(1610, 960, u),
        api.lerp(680, 600, u),
        29,
        themeColors.green,
        'center',
      );
      extendedText(ctx, api, LONG_SECTION, 960, 830, 27, themeColors.blue, 'center');
      spanBracket(
        ctx,
        api,
        180,
        1740,
        890,
        'Indexed representation · ' + indexed.split(/\s+/).length + ' visible words',
        themeColors.cyan,
      );
      extendedText(
        ctx,
        api,
        'Added labels consume budget. They are not source-span quotations.',
        960,
        720,
        31,
        themeColors.yellow,
        'center',
      );
      extendedNote(
        ctx,
        api,
        'Retain immutable version and an explicit raw-to-normalized offset map.',
      );
    } else {
      const lines = [
        '## Rollback failure',
        'Page on-call within 15 minutes with deploy ID.',
        '## Routine deploy notes',
        'Archive within 14 days after release.',
      ];
      lines.forEach((text, i) =>
        extendedText(
          ctx,
          api,
          text,
          230,
          355 + i * 120,
          i % 2 ? 28 : 34,
          i % 2 ? themeColors.ink : colors[i / 2],
        ),
      );
      spanBracket(ctx, api, 1190, 1700, 445, 'section=0', themeColors.blue);
      spanBracket(ctx, api, 1190, 1700, 685, 'section=1', themeColors.green);
      extendedText(
        ctx,
        api,
        'Flat ## teaching parser',
        1450,
        340,
        31,
        themeColors.yellow,
        'center',
      );
      extendedText(
        ctx,
        api,
        'Nested headings + fenced code',
        1450,
        820,
        27,
        themeColors.muted,
        'center',
      );
      extendedText(
        ctx,
        api,
        'require appropriate parsing',
        1450,
        875,
        27,
        themeColors.muted,
        'center',
      );
      extendedNote(
        ctx,
        api,
        'Section ordinals are application locators. They are not PDF anchors.',
      );
    }
  });
}
export default {
  id: 'token-offsets',
  draw: drawTokenOffsets,
  cues: [
    'token-offsets-0', 'measure-full-input', 'token-total', 'shorter-child', 'all-sixteen',
    'token-model-contract',
    'token-offsets-1',
    'prepend-labels',
    'token-offsets-2',
  ],
};
