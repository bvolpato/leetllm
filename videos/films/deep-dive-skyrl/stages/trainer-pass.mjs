import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterArrow,
  drawSkyChapterBox,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawTrainerPass(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('trainer-pass', state),
    cueProgress = () => api.focus.progress(`sky-${'trainer-pass'}-b${currentBeat}`, progress),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-trainer-pass-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'The same normalized record acquires training tensors'
        : 'After the policy update',
    );
    if (!currentBeat) {
      const labels = [
          'query-42_0',
          'IDs + masks + rewards',
          'current logprobs',
          'critic (if enabled)',
          'advantages + returns',
          'policy / critic update',
        ],
        n = Math.min(labels.length, Math.floor(cueProgress() * (labels.length + 1)));
      labels.forEach((v, i) => {
        const x = 170 + (i % 3) * 560,
          y = 380 + Math.floor(i / 3) * 285;
        drawSkyChapterBox(
          ctx,
          api,
          v,
          x,
          y,
          480,
          115,
          i < n ? themeColors.cyan : themeColors.muted,
          29,
        );
        if (i < 2 || (i > 2 && i < 5))
          drawSkyChapterArrow(ctx, api, x + 490, y + 57, x + 540, y + 57);
      });
      if (done('trainer-advantages'))
        drawSkyChapterText(
          ctx,
          api,
          'Derived fields retain the original action positions',
          960,
          950,
          33,
          themeColors.green,
          'center',
        );
    } else {
      const names = ['validation', 'checkpoint', 'sampler load'];
      names.forEach((v, i) => {
        drawSkyChapterBox(
          ctx,
          api,
          v,
          210 + i * 550,
          420,
          460,
          120,
          [themeColors.blue, themeColors.yellow, themeColors.cyan][i],
          35,
        );
        drawSkyChapterBox(
          ctx,
          api,
          i === 0
            ? 'observed score'
            : i === 1
              ? done('trainer-checkpoint')
                ? 'writing'
                : 'pending'
              : 'pending',
          210 + i * 550,
          700,
          460,
          110,
          i === 0 ? themeColors.green : themeColors.muted,
          31,
        );
      });
      drawSkyChapterText(
        ctx,
        api,
        'The next synchronous batch waits for the sampler to load the weights',
        960,
        950,
        34,
        themeColors.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'trainer-pass',
  draw: drawTrainerPass,
  cues: [
    'sky-trainer-pass-b0',
    'sky-trainer-advantages',
    'sky-trainer-pass-b1',
    'sky-trainer-checkpoint',
  ],
};
