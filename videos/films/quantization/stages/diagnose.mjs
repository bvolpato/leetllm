import { detailProgress } from '../construction.mjs';
import { drawDetailArrow, drawDetailText } from '../defaults.mjs';
export function drawDiagnose(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0,
    progress = detailProgress(state, 'diagnose', beat);
  const body = () => {
    const problems = [
      'Reloaded JSON task fails',
      'Decode remains slow',
      'Prompt ingestion is slow',
    ];
    const checks = [
      ['saved digest + reload', 'tokenizer + chat template', 'constraints + paired tasks'],
      ['device placement + dispatch', 'unpack + cache traffic', 'batching + queueing'],
      ['arithmetic + attention', 'conversion + scheduling', 'TTFT queue share'],
    ];
    drawDetailText(ctx, api, problems[beat], 960, 310, 42, themeColors.pink, 'center');
    checks[beat].forEach((label, i) => {
      const y = 475 + i * 170;
      drawDetailText(
        ctx,
        api,
        label,
        960,
        y,
        38,
        i <= Math.floor(progress * 2) ? themeColors.cyan : themeColors.muted,
        'center',
      );
      if (i < 2) drawDetailArrow(ctx, api, 960, y + 35, 960, y + 110, themeColors.yellow);
    });
    drawDetailText(
      ctx,
      api,
      'Change one thing and rerun the same requests',
      960,
      970,
      33,
      themeColors.green,
      'center',
    );
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(`${'diagnose'}-state-${i}`, inner);
  }
  focused();
}
export default {
  id: 'diagnose',
  draw: drawDiagnose,
  cues: ['diagnose-build-0', 'diagnose-build-1', 'diagnose-build-2'],
};
