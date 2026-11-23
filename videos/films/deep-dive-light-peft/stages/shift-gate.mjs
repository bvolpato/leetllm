import { spokenProgress } from '../model.mjs';
import {
  chapterFooter,
  chapterPanel,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawShiftGate(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = (id, fallback = progress) => spokenProgress(state, id, fallback),
    done = (id) => q(id) >= 0.98;
  {
    chapterSubtitle(
      ctx,
      api,
      themeColors,
      'Required held-out populations keep their own denominators',
    );
    focusScope(ctx, api, 'lp-shift', () => {
      for (let i = 0; i < 60; i++) {
        const shifted = i >= 50,
          pass = i < 56,
          x = 250 + (i % 10) * 145,
          y = 365 + Math.floor(i / 10) * 73;
        chapterPanel(
          ctx,
          api,
          themeColors,
          shifted ? 'S' + (i - 49) : 'F' + (i + 1),
          x,
          y,
          120,
          55,
          pass ? (shifted ? themeColors.cyan : themeColors.green) : themeColors.pink,
          23,
        );
      }
      chapterText(
        ctx,
        api,
        themeColors,
        '50 familiar · all pass',
        580,
        865,
        31,
        themeColors.green,
        'center',
      );
      chapterText(
        ctx,
        api,
        themeColors,
        '10 shifted · 6 pass',
        1350,
        865,
        31,
        themeColors.cyan,
        'center',
      );
    });
    focusScope(ctx, api, 'lp-shift-total', () =>
      chapterText(
        ctx,
        api,
        themeColors,
        beat > 1 || done('lp-shift-aggregate')
          ? 'Aggregate 56/60 = 93.3% · shifted 6/10 = 60%'
          : 'Keep each population visible',
        960,
        935,
        31,
        themeColors.yellow,
        'center',
      ),
    );
    focusScope(ctx, api, 'lp-shift-gate', () => {
      if (beat)
        chapterFooter(
          ctx,
          api,
          themeColors,
          beat > 1 || done('lp-shift-hold')
            ? 'HOLD · required shifted 60% < invented 80% gate · retain original rollback state'
            : 'Required shifted slice · invented 80% gate → decision?',
          themeColors.pink,
        );
    });
  }
}
export default {
  id: 'shift-gate',
  draw: drawShiftGate,
  cues: ['lp-shift-counts', 'lp-shift-aggregate', 'lp-shift-slice', 'lp-shift-hold'],
};
