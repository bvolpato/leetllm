import { kernelChapterFrame } from '../construction.mjs';
import { drawChapterText, drawNote, drawRow, drawTitle } from '../defaults.mjs';
export function drawCheckerMutations(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress, at } = kernelChapterFrame('checker-mutations', state);
  api.focus.target('checker-mutations-construction', () => {
    if (currentBeat === 0) {
      drawTitle(
        ctx,
        api,
        'A valid witness must distinguish the mutant',
        'Reject a proposed witness when it rejects the unmodified original',
      );
      const valid = progress > 0.5;
      drawRow(
        ctx,
        api,
        ['original', valid ? 'PASS' : 'FAIL'],
        260,
        450,
        600,
        valid ? themeColors.green : themeColors.pink,
      );
      drawRow(ctx, api, ['mutant', 'FAIL'], 1100, 450, 600, themeColors.pink);
      drawRow(
        ctx,
        api,
        [valid ? 'eligible witnessed defect' : 'discard invalid witness'],
        400,
        720,
        1120,
        valid ? themeColors.green : themeColors.pink,
      );
      drawNote(ctx, api, 'Failing every implementation cannot earn checker coverage');
    } else if (currentBeat === 1) {
      drawTitle(
        ctx,
        api,
        'Keep unwitnessed proposals outside the denominator',
        'Six defects with a witness',
      );
      for (let i = 0; i < 8; i++) {
        const x = 290 + (i % 4) * 370,
          y = 430 + Math.floor(i / 4) * 180,
          c = i < 4 ? themeColors.green : i < 6 ? themeColors.pink : themeColors.muted;
        drawRow(ctx, api, [i < 4 ? 'Detected' : i < 6 ? 'Missed' : 'No witness'], x, y, 310, c);
      }
      if (at('rate', 1))
        drawChapterText(
          ctx,
          api,
          'detection = 4/6 ≈ 0.667',
          960,
          865,
          38,
          themeColors.yellow,
          'center',
        );
      drawNote(
        ctx,
        api,
        'Use the two misses to choose the next checker improvement',
      );
    } else {
      drawTitle(
        ctx,
        api,
        'Reconcile a released inventory before adopting its count',
        'A listed rule and an exercised witness are different objects',
      );
      const rows = [
        ['release list', 'rule A', 'rule B', 'rule C'],
        ['executed witness', 'A1', 'B1', 'missing'],
      ];
      rows.forEach((v, i) =>
        drawRow(ctx, api, v, 260, 460 + i * 230, 1400, i ? themeColors.pink : themeColors.blue),
      );
      if (progress > 0.55)
        drawChapterText(
          ctx,
          api,
          'unreconciled count remains open',
          960,
          855,
          34,
          themeColors.yellow,
          'center',
        );
      drawNote(
        ctx,
        api,
        'The cited preprint retains an appendix/main-text count disagreement;this worksheet is schematic',
      );
    }
  });
}
export default {
  id: 'checker-mutations',
  draw: drawCheckerMutations,
  cues: [
    'kg-checker-mutations-voice-0',
    'kg-checker-mutations-voice-1',
    'kg-checker-mutations-rate',
    'kg-checker-mutations-voice-2',
  ],
};
