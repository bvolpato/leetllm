import {
  drawArrow,
  drawFooter,
  drawHeading,
  drawRectangle,
  drawTag,
  drawText,
} from '../defaults.mjs';
export function drawJitApproval(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    clamp = (x) => Math.max(0, Math.min(1, x));
  const cue = (name, beat = 0) => {
      const id = 'sr-jit-approval-' + name,
        v = state.cues?.[id];
      if (state.cues && !v) throw Error('Missing secure RAG cue ' + id);
      return v
        ? {
            q: v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress,
            done: v.phase === 'after',
          }
        : {
            q: currentBeat < beat ? 0 : currentBeat > beat ? 1 : clamp((progress - 0.08) / 0.75),
            done: currentBeat > beat || (currentBeat === beat && progress > 0.86),
          };
    },
    Q = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sr-jit-approval-mechanism', () => {
    drawHeading(ctx, api, 'Credential lifetime and source-policy grant');
    const q = Q('renew', 0);
    for (let i = 0; i < 4; i++) {
      drawRectangle(
        ctx,
        api,
        200 + i * 390,
        400,
        300,
        100,
        i <= q * 3 ? themeColors.yellow : themeColors.muted,
      );
      drawText(
        ctx,
        api,
        'short token ' + (i + 1),
        350 + i * 390,
        460,
        27,
        themeColors.yellow,
        'center',
      );
      if (i && q * 3 >= i)
        drawArrow(ctx, api, 140 + i * 390, 450, 190 + i * 390, 450, themeColors.pink);
    }
    drawText(
      ctx,
      api,
      'Renewable broad grant remains standing authority',
      960,
      660,
      31,
      themeColors.pink,
      'center',
    );
    if (currentBeat === 1) {
      const approved = resultComplete('grant', 1);
      drawTag(
        ctx,
        api,
        'Source-policy exceptional grant',
        approved ? 'activated for approved task' : 'not yet established',
        170,
        790,
        760,
        approved ? themeColors.green : themeColors.yellow,
      );
      if (resultComplete('ordinary', 1))
        drawTag(
          ctx,
          api,
          'Ordinary allowed read',
          'no added confirmation gate',
          1050,
          790,
          690,
          themeColors.blue,
        );
    }
    drawFooter(
      ctx,
      api,
      'Approval applies where organizational policy requires it. A short expiry alone does not establish zero standing privilege.',
    );
  });
}
export default {
  id: 'jit-approval',
  draw: drawJitApproval,
  cues: [
    'sr-jit-approval-0',
    'sr-jit-approval-renew',
    'sr-jit-approval-1',
    'sr-jit-approval-grant',
    'sr-jit-approval-ordinary',
  ],
};
