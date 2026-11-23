import { auditBoard } from '../audit-board.mjs';

export function drawBenchmarkScope(ctx, scene, state, api) {
  const { C, text, line, rect, focus, progress } = auditBoard(ctx, scene, state, api);
  if (state.beat < 2) {
    focus('probe', () => {
      const rows =
        state.beat === 0
          ? [
              ['BBQ', 'Ambiguous or clarified question', 'Answer choice'],
              ['StereoSet', 'Sentence context', 'Preference and LM ability'],
              ['CrowS-Pairs', 'Masked sentence pair', 'Model preference'],
            ]
          : [
              ['BOLD', 'Generation prompt', 'Scored language'],
              ['RealToxicityPrompts', 'Web text prompt', 'Toxicity score'],
              ['WEAT / SEAT', 'Words or sentences', 'Embedding association'],
            ];
      ['Test', 'What goes in', 'What comes out'].forEach((s, i) =>
        text(s, [115, 605, 1300][i], 329, 38, C.muted),
      );
      rows.forEach(([test, input, output], i) => {
        const y = 483 + 149 * i;
        text(test, 115, y, 38, C.blue);
        text(input, 605, y, 35);
        text(output, 1300, y, 35, C.yellow);
        line(115, y + 43, 1803, y + 43, '#484d56', 2);
      });
      text('Keep the result with the protocol that produced it.', 960, 972, 38, C.muted, 'center');
    });
  } else {
    focus('product', () => {
      text('p4    /    Production routing evaluation', 114, 290, 43);
      const stage = Math.ceil(progress('product-run') * 4);
      ['Conversation', 'Retrieval + policy', 'Judge', 'Router'].forEach((label, j) => {
        const x = 115 + j * 436,
          active = j < stage;
        rect(x, 445, 352, 127, C.panel, active ? C.blue : C.muted);
        text(label, x + 176, 523, 34, active ? C.ink : C.muted, 'center');
        if (j < 3) line(x + 365, 508, x + 420, 508, C.muted);
      });
      text('Observed route', 118, 719, 36, C.muted);
      text('Which claim reached automatic service?', 550, 719, 39);
      text('Observed outcome', 118, 846, 36, C.muted);
      text('How long did it wait? Was it resolved?', 550, 846, 39);
    });
  }
}
export default { id: 'benchmark-scope', draw: drawBenchmarkScope };
