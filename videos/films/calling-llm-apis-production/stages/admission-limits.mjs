import { apiChapterState } from '../construction.mjs';
import { chapterText, footer, heading, panel } from '../defaults.mjs';
export function drawAdmissionLimits(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    modelState = apiChapterState('admission-limits', state),
    u = modelState.p,
    done = modelState.settled;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'Rate, token allowance and concurrent work have separate owners');
      const labels = ['requests / minute', 'token admission', 'concurrent calls'],
        heights = [0.55, 0.85, 0.7];
      labels.forEach((v, i) => {
        const x = 300 + i * 550;
        api.rect(ctx, x, 420, 300, 370, themeColors.panel, themeColors.muted, 2);
        api.rect(
          ctx,
          x,
          790 - 370 * heights[i] * u,
          300,
          370 * heights[i] * u,
          [themeColors.blue, themeColors.cyan, themeColors.pink][i],
        );
        chapterText(
          ctx,
          api,
          v,
          x + 150,
          875,
          28,
          [themeColors.blue, themeColors.cyan, themeColors.pink][i],
          'center',
        );
      });
      footer(
        ctx,
        api,
        'Burst shape and reserved output can affect admission differently from billing',
      );
    } else {
      heading(
        ctx,
        api,
        currentBeat === 1
          ? 'Classify the supplied error before retrying'
          : 'Transport success still needs application success',
      );
      const rows =
        currentBeat === 1
          ? [
              ['429 rate limit', 'bounded retry'],
              ['429 credit exhausted', 'quota intervention'],
              ['503 transient', 'bounded retry'],
              ['401 / 403', 'credentials / access'],
              ['429 unknown', 'inspect'],
            ]
          : [
              ['HTTP 200 + refusal', 'inspect refusal'],
              ['HTTP 200 + incomplete', 'inspect incomplete'],
              ['HTTP 200 + wrong policy', 'reject validation'],
            ];
      rows.forEach((r, i) => {
        const y = 390 + i * (currentBeat === 1 ? 110 : 180);
        panel(ctx, api, r[0], 220, y, 680, 80, themeColors.blue, 27);
        if (u > (i + 0.5) / (rows.length + 1))
          panel(
            ctx,
            api,
            r[1],
            1080,
            y,
            620,
            80,
            /retry/.test(r[1]) ? themeColors.cyan : themeColors.yellow,
            27,
          );
      });
      footer(ctx, api, 'Tenant exhaustion is distinct from provider health');
    }
  }
}
export default {
  id: 'admission-limits',
  draw: drawAdmissionLimits,
  cues: ['ap-admission-limits-0', 'ap-admission-limits-1', 'ap-admission-limits-2'],
};
