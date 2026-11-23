import { channelSnapshot } from '../construction.mjs';
import {
  carry,
  cueProgress,
  equation,
  formatValue,
  imageGrid,
  kernelGrid,
  text,
} from '../defaults.mjs';
export function drawChannels(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const stage = (beat, start = 0.08, end = 0.88) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : api.phase(progress, start, end);
  const fade = components.fade;
  ctx.save();
  {
    const changed = currentBeat === 0 ? 0 : cueProgress(ctx, api, 'second-filter', stage(1)),
      v = channelSnapshot(changed);
    text(
      ctx,
      api,
      currentBeat === 0 ? 'FILTER 1 · TWO INPUT CHANNELS' : 'FILTER 2 · ITS OWN KERNEL STACK',
      960,
      280,
      35,
      themeColors.cyan,
      'center',
    );
    v.images.forEach((im, i) => {
      const x = 170 + i * 890,
        id = i ? 'channel-second' : 'channel-first';
      api.focus.target(id, () => {
        imageGrid(
          ctx,
          api,
          im.slice(0, 3).map((row) => row.slice(0, 3)),
          x,
          380,
          83,
        );
        kernelGrid(ctx, api, v.kernels[i], x + 370, 380, 100);
      });
      text(ctx, api, '×', x + 315, 545, 47, themeColors.yellow, 'center');
      text(
        ctx,
        api,
        'channel ' + (i + 1),
        x + 300,
        340,
        31,
        i ? themeColors.cyan : themeColors.blue,
        'center',
      );
      const reveal =
        currentBeat > 0
          ? 1
          : cueProgress(
              ctx,
              api,
              i ? 'channel-second' : 'channel-first',
              stage(0, i * 0.3, 0.4 + i * 0.3),
            );
      equation(
        ctx,
        api,
        reveal >= 1
          ? (changed > 0 && changed < 1 ? '\\approx ' : '') + formatValue(v.sums[i])
          : '?',
        x + 300,
        805,
        57,
        i ? themeColors.cyan : themeColors.blue,
      );
    });
    const sumP = cueProgress(
      ctx,
      api,
      currentBeat === 0 ? 'channel-sum' : 'second-channel-sum',
      stage(currentBeat, 0.65, 0.95),
    );
    api.focus.target('channel-sum-rule', () =>
      equation(
        ctx,
        api,
        sumP >= 1
          ? formatValue(v.sums[0]) + '+' + formatValue(v.sums[1]) + '=' + formatValue(v.total)
          : 'Y=\\;?',
        960,
        970,
        62,
        themeColors.green,
      ),
    );
    if (sumP > 0 && sumP < 1) {
      const i = sumP < 0.5 ? 0 : 1;
      carry(
        ctx,
        api,
        {
          x: 400 + i * 890,
          y: 755,
          width: 140,
          height: 80,
        },
        {
          x: 810,
          y: 920,
          width: 300,
          height: 90,
        },
        sumP < 0.5 ? sumP * 2 : (sumP - 0.5) * 2,
        v.sums[i],
        true,
      );
    }
  }
  ctx.restore();
}
export default {
  id: 'channels',
  draw: drawChannels,
  cues: ['channel-first', 'channel-second', 'channel-sum', 'second-filter', 'second-channel-sum'],
};
