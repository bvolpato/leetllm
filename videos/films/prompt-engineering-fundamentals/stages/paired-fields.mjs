import { chapterBox, chapterText, footer, line, subtitle } from '../defaults.mjs';

export function drawPairedFields(ctx, scene, state, api) {
  const { C, focus } = api;
  if ((state.beat ?? 0) === 0) {
    subtitle(ctx, api, 'Same six incidents   ·   both prompts score 4 / 6');
    const xs = [185, 760, 1240];
    ['Incident', 'Old reply', 'Revised reply'].forEach((label, i) =>
      chapterText(ctx, api, label, xs[i], 404, 38, C.muted),
    );
    line(ctx, api, 180, 440, 1740, 440);
    chapterText(ctx, api, 'First page already sent', xs[0], 566, 40);
    chapterText(ctx, api, 'page_on_call', xs[1], 566, 45, C.pink);
    chapterText(ctx, api, 'needs_review', xs[2], 566, 45, C.green);
    if (focus.progress('pf-paired-fields-b0') > 0) {
      focus.target('overdue-comparison', () => {
        chapterText(ctx, api, 'No page at minute 31', xs[0], 760, 40);
        chapterText(ctx, api, 'overdue: true', xs[1], 760, 45, C.green);
        chapterText(ctx, api, 'overdue: false', xs[2], 760, 45, C.pink);
        chapterText(ctx, api, 'IR-7 deadline: 30', xs[0], 836, 33, C.muted);
      });
    }
    return;
  }
  focus.target('pf-paired-fields-mechanism', () => {
    subtitle(ctx, api, 'Use the same model, settings, tools and context preparation.');
    chapterBox(ctx, api, 'Development incidents', 190, 375, 780, 116, C.cyan, 43);
    for (const [i, label] of [
      'Instructions only',
      'Add a boundary example',
      'Ask for a short explanation',
    ].entries())
      chapterText(ctx, api, label, 262, 596 + i * 98, 38);
    line(ctx, api, 1025, 345, 1025, 870, C.muted, 3);
    chapterBox(ctx, api, 'Untouched final incidents', 1090, 375, 655, 116, C.green, 42);
    chapterText(ctx, api, 'Test the chosen version.', 1420, 690, 38, C.ink, 'center');
    footer(ctx, api, 'Keep tickets from the same incident in the same set.');
  });
}
export default {
  id: 'paired-fields',
  draw: drawPairedFields,
  cues: ['pf-paired-fields-b0', 'pf-paired-fields-b1'],
};
