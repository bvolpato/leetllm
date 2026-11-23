import { observations } from '../fixtures.mjs';
import { constructedFrame } from '../construction.mjs';
import { firstResponsibilities } from '../model.mjs';
import { drawConstructedHead, drawConstructedNote, drawConstructedText } from '../defaults.mjs';
export function drawEStep(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = constructedFrame(state),
    currentBeat = f.beat,
    clamp = (v) => Math.max(0, Math.min(1, v));
  api.focus.target('e-step-operation', () => {
    drawConstructedHead(ctx, api, 'Means 25 and 95 ms     Standard deviations 30 ms     Equal priors');
    const t = currentBeat === 0 ? 0 : currentBeat === 1 ? 6 * f.progress('em-effective-count') : 6;
    firstResponsibilities.forEach((row, i) => {
      const sourceX = 200 + i * 260,
        move = clamp(t - i),
        fastX = 350 + 200 * firstResponsibilities.slice(0, i).reduce((s, r) => s + r[0], 0),
        slowX = 350 + 200 * firstResponsibilities.slice(0, i).reduce((s, r) => s + r[1], 0);
      drawConstructedText(
        ctx,
        api,
        String.fromCharCode(65 + i) + ' · ' + observations[i] + ' ms',
        sourceX + 100,
        365,
        27,
        themeColors.muted,
        'center',
      );
      if (currentBeat > 0 || i < 6 * f.progress('em-each-row')) {
        api.rect(
          ctx,
          sourceX + (fastX - sourceX) * move,
          430 + (700 - 430) * move,
          row[0] * 200,
          65,
          themeColors.blue,
        );
        api.rect(
          ctx,
          sourceX + row[0] * 200 + (slowX - sourceX - row[0] * 200) * move,
          430 + (850 - 430) * move,
          row[1] * 200,
          65,
          themeColors.pink,
        );
        if (currentBeat === 0)
          drawConstructedText(
            ctx,
            api,
            '[' + row.map((v) => v.toFixed(3)).join(', ') + ']',
            sourceX + 100,
            570,
            25,
            themeColors.cyan,
            'center',
          );
      }
    });
    const completed = Math.min(6, Math.floor(t + 1e-9)),
      count = [0, 1].map((k) =>
        firstResponsibilities.slice(0, completed).reduce((s, r) => s + r[k], 0),
      );
    drawConstructedText(
      ctx,
      api,
      'Fast effective count   ' + count[0].toFixed(3),
      960,
      665,
      33,
      themeColors.blue,
      'center',
    );
    drawConstructedText(
      ctx,
      api,
      'Slow effective count   ' + count[1].toFixed(3),
      960,
      815,
      33,
      themeColors.pink,
      'center',
    );
    drawConstructedNote(
      ctx,
      api,
      'Each colored fraction moves once from its request into the corresponding effective count.',
    );
  });
}
export default {
  id: 'e-step',
  draw: drawEStep,
  cues: [
    'e-step-beat-1-focus-1',
    'em-each-row',
    'e-step-beat-2-focus-1',
    'em-effective-count',
    'e-step-beat-3-focus-1',
  ],
};
