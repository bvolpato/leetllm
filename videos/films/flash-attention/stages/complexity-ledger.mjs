import { flashExtensionFrame } from '../model.mjs';
import {
  drawFlashExtensionEquation,
  drawFlashExtensionFooter,
  drawFlashExtensionRectangle,
  drawFlashExtensionText,
} from '../defaults.mjs';
export function drawComplexityLedger(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('complexity-ledger', state),
    currentBeat = f.beat,
    progress = f.progress,
    colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink];
  const paint = () => {
    const n = 1 + (currentBeat === 2 ? 1 : progress),
      m = currentBeat === 2 ? 1 + f.go('fa-scale-memory', progress) : 1,
      labels = [
        'Dense FLOPs',
        'Row statistics',
        currentBeat === 2 && m > 1 ? 'IO with current M' : 'IO at fixed M',
      ],
      values = [n * n, n, (n * n) / m];
    for (let i = 0; i < 3; i++) {
      const x = 290 + i * 500;
      drawFlashExtensionText(ctx, api, labels[i], x + 200, 310, 31, colors[i], 'center');
      drawFlashExtensionRectangle(
        ctx,
        api,
        x,
        790 - (360 * values[i]) / 4,
        400,
        (360 * values[i]) / 4,
        colors[i],
      );
      drawFlashExtensionText(
        ctx,
        api,
        values[i].toFixed(2) + '×',
        x + 200,
        855,
        37,
        colors[i],
        'center',
      );
    }
    drawFlashExtensionEquation(
      ctx,
      api,
      currentBeat === 2
        ? 'n:1\\to2,\\quad M:1\\to' + m.toFixed(2)
        : 'M:\\ \\text{scalar elements},\\quad d\\le M\\le nd',
      960,
      935,
      36,
      themeColors.ink,
      'center',
    );
    drawFlashExtensionFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'At doubled n and current M: IO ' + (4 / m).toFixed(2) + '×, dense FLOPs 4×, row state 2×'
        : 'At fixed d and M, auxiliary state is linear while dense work and this IO expression stay quadratic',
    );
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('complexity-ledger-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'complexity-ledger',
  draw: drawComplexityLedger,
  cues: [
    'complexity-ledger-beat-1',
    'complexity-ledger-beat-2',
    'complexity-ledger-beat-3',
    'fa-scale-memory',
  ],
};
