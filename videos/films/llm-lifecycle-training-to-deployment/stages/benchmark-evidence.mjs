import { sceneCues } from '../picture.mjs';

export function drawBenchmarkEvidence(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  api.focus.target('benchmark-evidence-mechanism', () => {
    if (state.beat === 0) {
      const measures = [
        ['MMLU', 'Knowledge across 57 academic subjects'],
        ['GSM8K', 'Multistep grade-school math'],
        ['Key assistant', 'Decision under the current rotation rule'],
      ];
      measures.forEach(([label, skill], i) => {
        const y = 377 + i * 178;
        api.text(ctx, label, 165, y, 52, i === 2 ? C.cyan : C.blue);
        api.text(ctx, skill, 655, y, 49, C.ink);
        api.line(ctx, 165, y + 58, 1760, y + 58, C.panel, 4);
      });
      return;
    }
    api.text(ctx, 'Training documents searched', 175, 366, 44, C.muted);
    api.text(ctx, '50,000', 172, 521, 116, C.ink);
    api.line(ctx, 960, 285, 960, 563, C.muted, 2);
    api.text(ctx, 'Exact question matches', 1054, 366, 44, C.muted);
    if (cue.after('benchmark-evidence-b2')) api.text(ctx, '0', 1054, 521, 116, C.yellow);
    api.text(ctx, 'Outside this search', 175, 750, 44, C.cyan);
    api.text(ctx, 'Different wording   ·   Documents outside the sample', 175, 847, 50, C.ink);
  });
}
export default {
  id: 'benchmark-evidence',
  draw: drawBenchmarkEvidence,
  cues: ['benchmark-evidence-b1', 'benchmark-evidence-b2'],
};
