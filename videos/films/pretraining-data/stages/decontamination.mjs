import { drawText, note, pill, rectangle, withPretrainingMainFrame } from '../defaults.mjs';
export function paintPretrainingMainDecontamination(
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
    pill(ctx, api, C, 'Pinned benchmark / version / split', 960, 315, 1150, C.blue);
    ['Repository', 'Literal n-gram', 'Code-aware', 'Semantic retrieval'].forEach((v, i) => {
      const x = 280 + i * 420;
      rectangle(ctx, api, C, x, 485, 350, 170, C.panel, C.cyan);
      drawText(ctx, api, C, v, x + 175, 555, 27, C.cyan);
    });
    if (beg('layers')) {
      pill(ctx, api, C, 'README quotes the marker', 510, 815, 670, C.blue);
      pill(ctx, api, C, 'Solution contains the answer', 1410, 815, 720, C.yellow);
    }
  } else if (b === 1) {
    ['Marker copy', 'Copied prompt', 'Renamed code', 'Runbook'].forEach((v, i) => {
      const y = 415 + i * 130;
      drawText(ctx, api, C, v, 480, y, 34, C.blue);
      if (D('flags') && i < 3) pill(ctx, api, C, 'Candidate overlap', 1250, y - 10, 650, C.yellow);
      if (D('runbook') && i === 3)
        pill(ctx, api, C, 'No implemented match', 1250, y - 10, 650, C.muted);
    });
    note(
      ctx,
      api,
      C,
      'Sample unflagged records to look for missed overlaps.',
    );
  } else {
    const codeA = ['def decide(flag):', '    if flag:', '        return 1', '    return 2'],
      codeB = ['def decide(flag):', '    if flag:', '        return 1', '        return 2'];
    for (let k = 0; k < 2; k++) {
      drawText(
        ctx,
        api,
        C,
        k ? 'Program B' : 'Program A',
        480 + k * 960,
        300,
        36,
        k ? C.pink : C.blue,
      );
      (k ? codeB : codeA).forEach((v, i) => {
        const col = i === 3 && beg('indent') ? C.yellow : C.ink;
        api.text(ctx, v, 210 + k * 960, 395 + i * 81, 39, col, 'left', 'mono');
      });
    }
    pill(ctx, api, C, 'decide(False)', 960, 756, 550, C.yellow);
    if (D('left')) drawText(ctx, api, C, '2', 480, 875, 48, C.cyan);
    if (D('false')) drawText(ctx, api, C, 'None', 1440, 875, 48, C.pink);
    if (D('review'))
      drawText(
        ctx,
        api,
        C,
        'Same normalized tokens · different behavior → policy review',
        960,
        960,
        31,
        C.yellow,
      );
    note(
      ctx,
      api,
      C,
      b === 2
        ? 'With False, which function reaches its last return?'
        : 'Lexical normalization discards indentation and does not resolve scope.',
    );
  }
}
export function drawDecontaminationStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainDecontamination);
}
export default {
  id: 'decontamination',
  draw: drawDecontaminationStage,
  cues: [
    'pt-decontamination-pin',
    'pt-decontamination-layers',
    'pt-decontamination-flags',
    'pt-decontamination-runbook',
    'pt-decontamination-indent',
    'pt-decontamination-left',
    'pt-decontamination-false',
    'pt-decontamination-review',
  ],
};
