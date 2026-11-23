import { completed, opProgress } from '../construction.mjs';
import {
  drawConstructionEquation,
  drawConstructionFocus,
  drawConstructionGrid,
  drawConstructionText,
  drawConstructionTitle,
} from '../defaults.mjs';
export function drawForwardSchedule(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = opProgress(state, 'forward-schedule'),
    done = (name) => completed(state, name),
    result = (fn) => drawConstructionFocus(ctx, api, 'df-forward-schedule-result', fn);
  {
    drawConstructionTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'Multiply retained alpha factors'
        : currentBeat === 1
          ? 'How much signal survives three steps?'
          : 'Keep one pixel and the same noise draw',
    );
    if (currentBeat === 0) {
      drawConstructionGrid(
        ctx,
        api,
        [
          ['Beta', '0.02', '0.03', '0.04'],
          ['Alpha = 1 − beta', '0.98', '0.97', '0.96'],
        ],
        220,
        410,
        1480,
        190,
        themeColors.blue,
        29,
      );
      drawConstructionEquation(
        ctx,
        api,
        String.raw`\bar\alpha_t=\prod_{s\le t}(1-\beta_s)`,
        960,
        780,
        55,
      );
    } else if (currentBeat === 1) {
      result(() => {
        drawConstructionGrid(
          ctx,
          api,
          [
            ['Schedule', 'Retained fraction'],
            ['Three supplied steps', done('schedule-product') ? '0.912576' : '?'],
            ['Original 1,000-step linear', 'about 0.0000404'],
          ],
          260,
          410,
          1400,
          270,
          themeColors.blue,
          30,
        );
        drawConstructionText(
          ctx,
          api,
          'Three steps:  0.98 × 0.97 × 0.96',
          960,
          870,
          32,
          themeColors.yellow,
          'center',
        );
      });
    } else
      result(() => {
        drawConstructionGrid(
          ctx,
          api,
          [
            ['Same x0 = 1', 'Same epsilon = −0.4', 'State'],
            [
              'alpha bar 0.9',
              'signal 0.949 / noise −0.126',
              done('schedule-values') ? '0.822' : '?',
            ],
            [
              'alpha bar 0.5',
              'signal 0.707 / noise −0.283',
              done('schedule-values') ? '0.424' : '?',
            ],
            [
              'alpha bar 0.001',
              'signal 0.032 / noise −0.400',
              done('schedule-values') ? '−0.368' : '?',
            ],
          ],
          170,
          390,
          1580,
          360,
          themeColors.cyan,
          27,
        );
        drawConstructionEquation(
          ctx,
          api,
          String.raw`\mathrm{SNR}=\bar\alpha/(1-\bar\alpha)`,
          960,
          900,
          47,
        );
      });
    return;
  }
}
export default {
  id: 'forward-schedule',
  draw: drawForwardSchedule,
  cues: [
    'df-forward-schedule-0',
    'df-forward-schedule-1',
    'df-schedule-product',
    'df-forward-schedule-2',
    'df-schedule-values',
  ],
};
