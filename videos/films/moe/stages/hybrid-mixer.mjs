import { mc } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import { footer, mechanismText, rectangle } from '../defaults.mjs';
export function drawHybridMixer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mc(state.beatP ?? 0),
    resultComplete = (id) => moeCue(state, id),
    cueProgress = (i) => moeCue(state, 'hybrid-mixer-op-' + i, 'progress');
  api.focus.target('mo-hybrid-mixer-mechanism', () => {
    const ready = resultComplete('hybrid-pattern'),
      sel = resultComplete('hybrid-experts');
    mechanismText(
      ctx,
      api,
      'Qwen3.6-35B-A3B · sequence mixing and sparse FFN are independent',
      960,
      285,
      32,
      themeColors.yellow,
    );
    for (let i = 0; i < 40; i++) {
      if (i / 40 > cueProgress(0) && !ready && currentBeat === 0) continue;
      const x = 180 + (i % 10) * 160,
        y = 390 + Math.floor(i / 10) * 135;
      rectangle(ctx, api, x, y, 125, 47, i % 4 === 3 ? themeColors.pink : themeColors.blue);
      mechanismText(
        ctx,
        api,
        i % 4 === 3 ? 'attention' : 'DeltaNet',
        x + 62,
        y + 31,
        21,
        themeColors.bg,
      );
      rectangle(ctx, api, x, y + 55, 125, 40, themeColors.panel, themeColors.yellow);
      if (sel)
        for (let k = 0; k < 8; k++)
          rectangle(ctx, api, x + 8 + k * 13, y + 65, 8, 16, themeColors.yellow);
    }
    mechanismText(
      ctx,
      api,
      'Mixer above · MoE feed-forward below, at every layer',
      960,
      960,
      31,
      themeColors.cyan,
    );
    if (sel)
      mechanismText(
        ctx,
        api,
        'Each FFN: 8 of 256 routed + 1 shared',
        960,
        330,
        30,
        themeColors.yellow,
      );
    footer(
      ctx,
      api,
      'Mixer choice governs sequence state; expert selection alone gives no cache-size or latency result.',
    );
  });
}
export default {
  id: 'hybrid-mixer',
  draw: drawHybridMixer,
  cues: [
    'mo-hybrid-mixer-op-0',
    'mo-hybrid-pattern',
    'mo-hybrid-mixer-op-1',
    'mo-hybrid-experts',
    'mo-hybrid-mixer-op-2',
  ],
};
