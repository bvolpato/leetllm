import { libraryText } from '../library-shelf.mjs';

const ruleLines = [
  'Rule AUTH-14. Service accounts may use the legacy token',
  'endpoint within 14 days of deprecation if',
  'audit logging is active.',
];
const rule = ruleLines.join(' ');
const kept = 16;
const prefix = rule.split(' ').slice(0, kept).join(' ');

export function drawScoredSpan(ctx, scene, state, api) {
  const { C, focus } = api;
  if ((state.beat ?? 0) === 0) {
    const cut = focus.progress('library-prefix', state.beatP >= 0.5 ? 1 : 0);
    focus.target('source', () => {
      api.text(ctx, 'Opening hours    /    longer source', 140, 289, 35, C.blue);
      api.text(
        ctx,
        'Building guide: reading rooms, maps, desks, study spaces.',
        140,
        428,
        44,
        C.ink,
      );
      api.text(ctx, 'Services: borrowing, returns, printing and events.', 140, 545, 44, C.ink);
      api.text(ctx, libraryText[2], 140, 746, 54, C.green);
      if (cut > 0) {
        api.line(ctx, 140, 622, 140 + 1130 * cut, 622, C.yellow, 4);
        api.text(ctx, 'End of scored prefix', 1320, 633, 36, C.yellow);
      }
    });
    return;
  }
  const cut = focus.progress('cut-after-if', 0);
  const reverse = focus.progress('swap-spans', 0) === 1;
  const readers = reverse ? ['Generator', 'Scorer'] : ['Scorer', 'Generator'];
  focus.target('source', () => {
    api.text(ctx, 'AUTH-14    /    one source revision', 140, 246, 33, C.green, 'left', 'mono');
    ruleLines.forEach((line, i) => {
      api.text(ctx, line, 140, 345 + 72 * i, 43, i === 2 && cut > 0 ? C.yellow : C.ink);
    });
    if (cut > 0) api.line(ctx, 140, 445, 140 + 1360 * cut, 445, C.yellow, 4);
    api.text(ctx, 'prefix = " ".join(rule.split()[:16])', 140, 582, 35, C.blue, 'left', 'mono');
  });
  focus.target('readers', () => {
    api.text(ctx, 'Reader', 140, 680, 29, C.muted);
    api.text(ctx, 'Input', 502, 680, 29, C.muted);
    api.text(ctx, '"audit logging" in text', 977, 680, 34, C.muted, 'left', 'mono');
    if (cut === 1) {
      [prefix, rule].forEach((text, i) => {
        const y = 768 + 100 * i;
        const color = i === 0 ? C.yellow : C.green;
        const checked = focus.progress(i === 0 ? 'prefix-result' : 'check-texts', 0) === 1;
        api.text(ctx, readers[i], 140, y, 42, C.ink);
        api.text(
          ctx,
          `${i === 0 ? 'prefix' : 'rule'}  ·  ${text.split(' ').length} words`,
          502,
          y,
          38,
          color,
        );
        api.text(
          ctx,
          checked ? (text.includes('audit logging') ? 'True' : 'False') : '?',
          1180,
          y,
          48,
          color,
        );
      });
    }
  });
  if (reverse)
    api.text(
      ctx,
      'The generator now gets the sentence only as far as “if”.',
      140,
      985,
      38,
      C.yellow,
    );
}
export default {
  id: 'scored-span',
  draw: drawScoredSpan,
  cues: [
    'library-prefix',
    'read-rule',
    'cut-after-if',
    'inspect-both',
    'prefix-result',
    'check-texts',
    'swap-spans',
  ],
};
