import { drawText, line, note, pill, withPretrainingMainFrame } from '../defaults.mjs';
export function paintPretrainingMainAnnealSynthetic(
  ctx,
  scene,
  state,
  api,
  C,
  c,
  b,
  p,
  cue,
  P,
  D,
  beg,
) {
  if (b === 0) {
    drawText(ctx, api, C, 'Same starting checkpoint · separate controls', 960, 300, 35, C.blue);
    line(ctx, api, C, 300, 730, 1650, 730, C.muted);
    const end = 300 + P('forty') * 1350;
    line(ctx, api, C, 300, 430, end, 430 + (end - 300) * 0.22, C.cyan, 5);
    drawText(ctx, api, C, 'Learning-rate cooldown', 650, 850, 32, C.cyan);
    if (D('forty')) drawText(ctx, api, C, 'Final 40M tokens', 1430, 850, 34, C.yellow);
    if (D('compare'))
      drawText(ctx, api, C, 'Candidate mixture A versus B · same start', 960, 945, 32, C.blue);
    note(ctx, api, C, 'Llama 3 used separate 40B-token probes to compare candidate data.');
  } else if (b === 1) {
    pill(ctx, api, C, 'Retained real code R1', 470, 430, 640, C.blue);
    if (beg('generated')) {
      pill(ctx, api, C, 'Exercise G1', 1420, 430, 560, C.cyan);
      pill(ctx, api, C, 'Explanation G2', 1420, 625, 560, C.cyan);
      line(ctx, api, C, 800, 430, 1100, 430, C.cyan);
      line(ctx, api, C, 800, 500, 1100, 625, C.cyan);
    }
    if (D('provenance'))
      drawText(
        ctx,
        api,
        C,
        'Parent lineage + terms + executable/source checks',
        960,
        855,
        34,
        C.yellow,
      );
    if (D('generated')) note(ctx, api, C, 'One source program, two generated variants.');
  } else {
    const real = ['R1', 'R2', 'rare R3'],
      synthetic = ['G1', 'G2', 'G3'];
    drawText(ctx, api, C, 'Replacement', 500, 320, 37, C.pink);
    drawText(ctx, api, C, 'Retain + accumulate', 1410, 320, 37, C.cyan);
    synthetic.forEach((v, i) => pill(ctx, api, C, v, 500, 460 + i * 135, 420, C.pink));
    if (beg('retain'))
      [...real, ...synthetic].forEach((v, i) =>
        pill(
          ctx,
          api,
          C,
          v,
          1140 + (i % 2) * 500,
          420 + Math.floor(i / 2) * 150,
          440,
          i < 3 ? C.blue : C.cyan,
        ),
      );
    if (D('floor'))
      drawText(
        ctx,
        api,
        C,
        'Check the rare cases against their release minimum.',
        960,
        945,
        35,
        C.yellow,
      );
    if (D('retain'))
      note(ctx, api, C, 'The original rare record R3 survives in the accumulated mix.');
  }
}
export function drawAnnealSyntheticStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainAnnealSynthetic);
}
export default {
  id: 'anneal-synthetic',
  draw: drawAnnealSyntheticStage,
  cues: [
    'pt-anneal-synthetic-forty',
    'pt-anneal-synthetic-compare',
    'pt-anneal-synthetic-generated',
    'pt-anneal-synthetic-provenance',
    'pt-anneal-synthetic-retain',
    'pt-anneal-synthetic-floor',
  ],
};
