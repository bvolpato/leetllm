import {
  drawExtendedMaskGrid,
  drawExtendedNote,
  drawExtendedRow,
  drawExtendedText,
  drawExtendedTitle,
  withTransformerExtendedFrame,
} from '../defaults.mjs';
export function paintArchitectureVisibility(
  ctx,
  scene,
  state,
  api,
  C,
  id,
  s,
  b,
  p,
  f,
  mix,
  known,
  colors,
) {
  if (b === 0) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Change legal reads to match the task',
      'Blue cells mark readable input positions',
    );
    const modes = ['full', 'causal', 'full'],
      names = ['encoder self-read', 'decoder self-read', 'target → source'];
    for (let i = 0; i < 3; i++) {
      const active =
        i === 0 ? known('encoder', 0) : i === 1 ? known('decoder', 0) : known('cross', 0);
      drawExtendedMaskGrid(ctx, api, C, 3, 230 + i * 535, 450, 400, modes[i], active ? 1 : 0);
      drawExtendedText(ctx, api, C, names[i], 430 + i * 535, 400, 28, colors[i], 'center');
    }
    drawExtendedNote(
      ctx,
      api,
      C,
      'Cross-attention takes queries from the target and keys/values from the encoded source',
    );
  } else if (b === 1) {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Pretraining targets can come from ordinary text',
      'Schematic missing-span task · sentinel serialization omitted',
    );
    drawExtendedRow(
      ctx,
      api,
      C,
      f,
      ['function', 'returns', 'the', 'result'],
      230,
      430,
      1450,
      C.blue,
    );
    drawExtendedRow(ctx, api, C, f, ['function', '<span>', 'result'], 230, 620, 1450, C.pink);
    if (p > 0.4) {
      drawExtendedText(ctx, api, C, 'missing target', 230, 845, 30, C.green);
      drawExtendedRow(ctx, api, C, f, ['returns', 'the'], 700, 790, 980, C.green);
    }
    drawExtendedNote(
      ctx,
      api,
      C,
      'Architecture defines visibility · instruction-following ability requires training and evaluation',
    );
  } else {
    drawExtendedTitle(
      ctx,
      api,
      C,
      'Growing target cache, fixed source cache',
      'Source projections can remain unchanged across target steps',
    );
    const n = 1 + Math.floor(p * 3);
    for (let i = 0; i < 4; i++) {
      api.rect(ctx, 270 + i * 320, 430, 280, 100, i < n ? C.blue : C.panel, C.blue, 2, 8);
      drawExtendedText(
        ctx,
        api,
        C,
        i < n ? 'target ' + i : '?',
        410 + i * 320,
        495,
        29,
        i < n ? C.panel : C.muted,
        'center',
      );
    }
    for (let i = 0; i < 3; i++) {
      api.rect(ctx, 430 + i * 350, 730, 300, 100, C.green);
      drawExtendedText(ctx, api, C, 'source ' + i, 580 + i * 350, 795, 29, C.panel, 'center');
    }
    drawExtendedText(
      ctx,
      api,
      C,
      'target self-attention: ' + n + ' positions',
      960,
      620,
      31,
      C.blue,
      'center',
    );
    drawExtendedNote(ctx, api, C, 'The source history stays fixed while the target sequence grows');
  }
}
export function drawArchitectureVisibilityStage(ctx, scene, state, api) {
  withTransformerExtendedFrame(ctx, scene, state, api, paintArchitectureVisibility);
}
export default {
  id: 'architecture-visibility',
  draw: drawArchitectureVisibilityStage,
  cues: [
    'tr-architecture-visibility-voice-0',
    'tr-architecture-visibility-encoder',
    'tr-architecture-visibility-decoder',
    'tr-architecture-visibility-cross',
    'tr-architecture-visibility-voice-1',
    'tr-architecture-visibility-voice-2',
    'tr-architecture-visibility-cache',
  ],
};
