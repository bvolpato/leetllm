import { clamp } from '../arithmetic.mjs';
import { drawText, footer, frame, mark } from '../defaults.mjs';
export function drawUsageBuckets(ctx, scene, state, api) {
  return api.focus.target('usage-buckets-geometry', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueProgress = (id) =>
      state.cues ? api.focus.progress(id, 0) : clamp(((state.beatP ?? 0) - 0.15) / 0.65);
    const cueComplete = (id) => cueProgress(id) === 1;
    {
      const values = [2000, 400, 200],
        labels = ['Read 2,000', 'Write 400', 'Ordinary 200'],
        colors = [themeColors.blue, themeColors.yellow, themeColors.cyan];
      drawText(ctx, api, 'One conserved input · 2,600 tokens', 150, 270, 36);
      let x = 180;
      values.forEach((value, i) => {
        const width = (1520 * value) / 2600,
          ids = ['usage-read', 'usage-write', 'usage-ordinary'];
        const amount = currentBeat ? 1 : cueProgress(ids[i]);
        mark(ctx, api, ids[i], () => {
          frame(ctx, api, x, 400, width, 100, colors[i]);
          if (amount > 0) api.rect(ctx, x, 400, width * amount, 100, colors[i], undefined, 0);
          drawText(
            ctx,
            api,
            labels[i],
            x + width / 2,
            565 + (i === 2 ? 60 : 0),
            27,
            colors[i],
            'center',
          );
        });
        x += width;
      });
      if (currentBeat === 0)
        drawText(
          ctx,
          api,
          'Disjoint portions · output stays separate',
          960,
          805,
          32,
          themeColors.muted,
          'center',
        );
      if (currentBeat === 1) {
        api.text(
          ctx,
          'Responses: input_tokens includes the whole bar',
          180,
          730,
          31,
          themeColors.ink,
          'left',
          'mono',
        );
        mark(ctx, api, 'usage-subtract', () => {
          drawText(
            ctx,
            api,
            cueComplete('usage-subtract')
              ? '2,600 − 2,000 − 400 = 200 ordinary'
              : '2,600 − 2,000 − 400 = pending',
            960,
            865,
            38,
            cueComplete('usage-subtract') ? themeColors.green : themeColors.muted,
            'center',
          );
        });
      }
      if (currentBeat === 2) {
        api.text(
          ctx,
          'Claude: input_tokens is the ordinary portion',
          180,
          730,
          31,
          themeColors.ink,
          'left',
          'mono',
        );
        mark(ctx, api, 'usage-claude', () => {
          drawText(
            ctx,
            api,
            cueComplete('usage-claude')
              ? '2,000 + 400 + 200 = 2,600 total'
              : '2,000 + 400 + 200 = pending',
            960,
            865,
            38,
            cueComplete('usage-claude') ? themeColors.green : themeColors.muted,
            'center',
          );
        });
      }
      footer(
        ctx,
        api,
        'Normalize read / write / ordinary before pricing; cache writes are not reads.',
      );
    }
  });
}
export default {
  id: 'usage-buckets',
  draw: drawUsageBuckets,
  cues: ['usage-read', 'usage-write', 'usage-ordinary', 'usage-subtract', 'usage-claude'],
};
