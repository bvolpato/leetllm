import { REQUESTS, REQUEST_IDS } from '../fixtures.mjs';
import { requestForward } from '../model.mjs';
import { neuralFrame } from '../construction.mjs';
import {
  arrow,
  block,
  equation,
  focusTarget,
  formatNumber,
  head,
  line,
  note,
  pill,
  text,
} from '../defaults.mjs';
export function drawBatch(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    S = f.shown,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'batch-mechanism', () => {
    head(ctx, api, 'Four request rows reuse one parameter bank');
    const hidden = S('batch-hidden', 0),
      out = S('batch-output', 1);
    focusTarget(ctx, api, 'batch-input', () => {
      block(ctx, api, REQUESTS, 300, 415, 130, themeColors.ink);
      REQUESTS.forEach((_, i) =>
        text(ctx, api, REQUEST_IDS[i], 190, 425 + i * 85, 26, themeColors.muted, 'right'),
      );
    });
    pill(ctx, api, 'W₁ [2×2] + b₁ [2]', 960, 330, 500, themeColors.cyan, 31);
    REQUESTS.forEach((_, i) => {
      arrow(ctx, api, 520, 415 + i * 85, 790, 415 + i * 85, themeColors.muted, 2);
      line(ctx, api, 800, 370, 800, 415 + i * 85, themeColors.muted, 1);
    });
    focusTarget(ctx, api, 'batch-contract', () => {
      if (hidden)
        block(
          ctx,
          api,
          REQUESTS.map((x) => requestForward(x).h),
          850,
          415,
          130,
          themeColors.cyan,
        );
      else
        block(
          ctx,
          api,
          REQUESTS.map(() => ['?', '?']),
          850,
          415,
          130,
          themeColors.muted,
        );
    });
    focusTarget(ctx, api, 'batch-score-column', () => {
      pill(ctx, api, 'W₂ [1×2] + c', 1510, 330, 390, themeColors.blue, 31);
      if (out)
        REQUESTS.forEach((x, i) => {
          arrow(ctx, api, 1080, 415 + i * 85, 1360, 415 + i * 85, themeColors.muted, 2);
          pill(
            ctx,
            api,
            formatNumber(ctx, api, requestForward(x).score),
            1510,
            415 + i * 85,
            300,
            themeColors.green,
            33,
          );
        });
    });
    equation(
      ctx,
      api,
      String.raw`X:[4,2]\ \longrightarrow H:[4,2]\ \longrightarrow\hat y:[4,1]`,
      960,
      875,
      44,
      themeColors.yellow,
    );
    equation(
      ctx,
      api,
      String.raw`H=\operatorname{ReLU}(XW_1^\top+b_1)`,
      960,
      960,
      39,
      themeColors.cyan,
    );
    note(
      ctx,
      api,
      'The same W and bias arrays broadcast to all four rows; activations scale with the batch.',
    );
    return;
  });
}
export default {
  id: 'batch',
  draw: drawBatch,
  cues: ['batch-hidden', 'batch-output'],
};
