import { clamp01 } from '../arithmetic.mjs';
import { classifierCueProgress } from '../construction.mjs';
import {
  drawExpandedClassifierCard,
  drawExpandedClassifierNote,
  drawExpandedClassifierText,
} from '../defaults.mjs';
export function drawPinnedHandoff(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    raw = clamp01(state.beatP ?? 0),
    cueProgress = (id) => classifierCueProgress(state, id);
  api.focus.target('handoff', () => {
    const samples = [
      ['r-104', 'v2', 'guarded', true],
      ['r-105', 'v2', 'human', false],
      ['r-106', 'v1', 'guarded', false],
    ];
    drawExpandedClassifierText(
      ctx,
      api,
      'Illustrative consumer · current bundle v2',
      960,
      285,
      32,
      themeColors.yellow,
      'center',
    );
    samples.forEach((r, i) => {
      const yy = 365 + i * 145;
      drawExpandedClassifierCard(
        ctx,
        api,
        r[0] + '  ·  ' + r[1] + '  ·  ' + r[2],
        190,
        yy,
        820,
        i ? themeColors.pink : themeColors.blue,
        90,
        32,
      );
      const visible =
        currentBeat > 0 ||
        (i === 0 ? cueProgress('handoff-r104') >= 1 : cueProgress('handoff-blocked') >= 1);
      if (visible)
        drawExpandedClassifierCard(
          ctx,
          api,
          r[3] ? 'string checks pass' : 'block',
          1260,
          yy,
          430,
          r[3] ? themeColors.green : themeColors.pink,
          90,
          30,
        );
    });
    if (currentBeat === 1 && cueProgress('handoff-forged') >= 1)
      drawExpandedClassifierCard(
        ctx,
        api,
        'Local test record passes the string checks',
        330,
        850,
        1260,
        themeColors.pink,
        100,
        32,
      );
    if (currentBeat === 2)
      drawExpandedClassifierCard(
        ctx,
        api,
        'Draft with evidence → request independent approval',
        270,
        850,
        1380,
        themeColors.yellow,
        100,
        33,
      );
    drawExpandedClassifierNote(
      ctx,
      api,
      'Producer verification + current ticket/configuration binding are required in production',
    );
  });
}
export default {
  id: 'pinned-handoff',
  draw: drawPinnedHandoff,
  cues: ['handoff-r104', 'handoff-blocked', 'handoff-forged', 'handoff-approval'],
};
