import { maskedProbabilities, phase } from '../arithmetic.mjs';
import { chapterBox, chapterText, footer, subtitle } from '../defaults.mjs';
import { facts } from '../fixtures.mjs';

function drawFormatExamples(ctx, api) {
  const { C, focus } = api;
  chapterText(ctx, api, 'Return JSON with one integer field: deadline_minutes.', 180, 290, 44);
  const rows = [
    ['Plain prompt', 'Within ninety minutes.', 'A sentence', C.blue],
    [
      'JSON mode',
      '{"deadline_minutes":"soon"}',
      'A string',
      C.cyan,
      'grammar-json-mode',
      'json-mode-example',
    ],
    [
      'Strict schema',
      '{"deadline_minutes":90}',
      'An integer',
      C.green,
      'pf-grammar-mask-b0',
      'schema-example',
    ],
  ];
  rows.forEach(([mode, value, kind, color, cue, target], i) => {
    if (cue && focus.cue(cue)?.phase === 'before') return;
    const y = 355 + i * 147;
    const row = () => {
      api.rect(ctx, 172, y, 1576, 115, C.panel, undefined, 9);
      chapterText(ctx, api, mode, 208, y + 72, 37, color);
      chapterText(ctx, api, value, 610, y + 73, 39);
      chapterText(ctx, api, kind, 1690, y + 71, 32, C.muted, 'right');
    };
    if (target) focus.target(target, row);
    else row();
  });
  if (focus.cue('grammar-rule-check')?.phase !== 'before') {
    focus.target('runbook-deadline', () => {
      chapterText(
        ctx,
        api,
        facts.sourceId + ' requires ' + facts.deadline + ' minutes.',
        960,
        889,
        48,
        C.yellow,
        'center',
      );
    });
  }
  if (focus.cue('grammar-incomplete')?.phase !== 'before')
    focus.target('response-status', () =>
      footer(ctx, api, 'Refused or unfinished response → review'),
    );
}

export function drawGrammarMask(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    u = api.focus.progress('pf-grammar-mask-b' + currentBeat);
  if (currentBeat === 0) return drawFormatExamples(ctx, api);
  api.focus.target('pf-grammar-mask-mechanism', () => {
    if (currentBeat === 1 || currentBeat === 2) {
      const objectStart = currentBeat === 1;
      const logits = objectStart ? [2, 1, 0, -0.5] : [1, 0, 2];
      const allowed = objectStart ? [true, false, false, false] : [true, true, false];
      const names = objectStart ? ['{', '[', '`', 'H'] : ['A', 'B', 'X'];
      const before = maskedProbabilities(
        logits,
        logits.map(() => true),
      );
      const after = maskedProbabilities(logits, allowed);
      const peak = Math.max(...logits.filter((_, i) => allowed[i]));
      const masses = logits.map((z, i) => (allowed[i] ? Math.exp(z - peak) : 0));
      const mask = api.focus.progress(objectStart ? 'object-mask' : 'two-mask');
      const ready = api.focus.progress(objectStart ? 'object-normalize' : 'pf-mask-result') >= 1;
      subtitle(
        ctx,
        api,
        objectStart
          ? 'First character of a JSON object'
          : 'Another decoding step · A and B are legal',
      );
      const xs = [230, 425, 650, 1040, 1395];
      ['Token', 'Logit', 'Before mask', 'Legal mass', 'After mask'].forEach((s, i) =>
        chapterText(ctx, api, s, xs[i], 375, 30, themeColors.muted),
      );
      for (let i = 0; i < names.length; i++) {
        const y = 482 + i * 113;
        const excluded = mask > 0 && !allowed[i];
        const tone = excluded ? themeColors.muted : themeColors.ink;
        chapterText(ctx, api, names[i], xs[0], y, 48, tone);
        chapterText(
          ctx,
          api,
          excluded ? '−∞' : logits[i],
          xs[1],
          y,
          39,
          excluded ? themeColors.pink : tone,
        );
        chapterText(ctx, api, before[i].toFixed(3), xs[2], y, 37, themeColors.blue);
        api.rect(ctx, xs[2], y + 14, 290 * before[i], 11, themeColors.blue, undefined, 2);
        chapterText(ctx, api, mask > 0 ? masses[i].toFixed(3) : '·', xs[3], y, 37, tone);
        chapterText(
          ctx,
          api,
          ready ? after[i].toFixed(3) : 'P = ?',
          xs[4],
          y,
          37,
          ready ? themeColors.green : themeColors.muted,
        );
        if (ready && after[i] > 0)
          api.rect(ctx, xs[4], y + 14, 290 * after[i], 11, themeColors.green, undefined, 2);
      }
      const total = masses.reduce((a, b) => a + b, 0);
      const message = !mask
        ? 'Which characters can the parser accept here?'
        : ready
          ? objectStart
            ? 'All legal mass goes to {   ·   the document still needs a closing brace'
            : 'A takes 1 / ' + total.toFixed(3) + ' of the legal mass. B takes the rest.'
          : 'Center on the largest legal logit, then exponentiate. Legal mass totals ' +
            total.toFixed(3) +
            '.';
      footer(ctx, api, message, themeColors.yellow);
    } else {
      subtitle(ctx, api, 'One token closes two nested structures');
      chapterBox(ctx, api, 'decoded token: {"a":[', 210, 370, 650, 115, themeColors.blue, 29);
      chapterText(ctx, api, 'Stack', 1400, 350, 32, themeColors.green, 'center');
      const array = phase(u, 0.45, 0.65),
        object = phase(u, 0.7, 0.9),
        ox = 1250 + 200 * phase(object, 0, 0.35),
        oy = 450 + 380 * phase(object, 0.35, 1);
      chapterBox(
        ctx,
        api,
        array >= 0.999 ? 'array · popped' : 'array',
        1250 - 160 * array,
        570 + 260 * array,
        280,
        80,
        array >= 0.999 ? themeColors.muted : themeColors.green,
        28,
      );
      chapterBox(
        ctx,
        api,
        object >= 0.999 ? 'object · popped' : 'object',
        ox,
        oy,
        280,
        80,
        object >= 0.999 ? themeColors.muted : themeColors.green,
        28,
      );
      chapterText(
        ctx,
        api,
        'Live stack depth: ' + (array >= 0.999 ? (object >= 0.999 ? 0 : 1) : 2),
        1400,
        405,
        29,
        themeColors.yellow,
        'center',
      );
      chapterBox(
        ctx,
        api,
        'next token: "]}"\ncloses array, then object',
        210,
        660,
        650,
        130,
        themeColors.cyan,
        30,
      );
      if (object >= 0.999)
        chapterText(ctx, api, 'Combined: {"a":[]}', 210, 900, 32, themeColors.green);
    }
  });
  return;
}
export default {
  id: 'grammar-mask',
  draw: drawGrammarMask,
  cues: [
    'grammar-json-mode',
    'pf-grammar-mask-b0',
    'grammar-rule-check',
    'grammar-incomplete',
    'pf-grammar-mask-b1',
    'object-mask',
    'object-normalize',
    'pf-grammar-mask-b2',
    'two-mask',
    'pf-mask-result',
    'pf-grammar-mask-b3',
  ],
};
