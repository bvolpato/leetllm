import { spokenProgress } from '../model.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterPanel,
  chapterStripe,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawRuntimeLayout(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = (id, fallback = progress) => spokenProgress(state, id, fallback),
    done = (id) => q(id) >= 0.98;
  {
    if (beat === 0) {
      chapterSubtitle(ctx, api, themeColors, 'Receiving geometry owns the legal slices');
      focusScope(ctx, api, 'lp-layout', () => {
        chapterStripe(
          ctx,
          api,
          themeColors,
          ['Q0', 'Q1', 'Q2', 'Q3'],
          320,
          410,
          'grouped-query example',
          undefined,
          themeColors.blue,
          260,
          90,
        );
        chapterPanel(ctx, api, themeColors, 'KV group0', 470, 680, 390, 100, themeColors.cyan, 33);
        chapterPanel(
          ctx,
          api,
          themeColors,
          'KV group1',
          1060,
          680,
          390,
          100,
          themeColors.purple,
          33,
        );
        chapterArrow(ctx, api, themeColors, 450, 520, 600, 650, themeColors.cyan);
        chapterArrow(ctx, api, themeColors, 722, 520, 700, 650, themeColors.cyan);
        chapterArrow(ctx, api, themeColors, 994, 520, 1200, 650, themeColors.purple);
        chapterArrow(ctx, api, themeColors, 1266, 520, 1300, 650, themeColors.purple);
        chapterText(
          ctx,
          api,
          themeColors,
          'Also bind fused QKV / paired gated FFN / shards / compiler widths',
          960,
          920,
          29,
          themeColors.yellow,
          'center',
        );
      });
    } else if (beat === 1) {
      chapterSubtitle(
        ctx,
        api,
        themeColors,
        'Constructor defaults and the resolved caller can differ',
      );
      focusScope(ctx, api, 'lp-lr', () => {
        const caller = done('lp-caller');
        ['attention', 'FFN'].forEach((name, i) => {
          chapterText(ctx, api, themeColors, name, 360, 440 + i * 240, 34, themeColors.blue);
          chapterPanel(
            ctx,
            api,
            themeColors,
            [100, 50][i],
            760,
            375 + i * 240,
            300,
            120,
            themeColors.muted,
            44,
          );
          chapterArrow(
            ctx,
            api,
            themeColors,
            1100,
            435 + i * 240,
            1270,
            435 + i * 240,
            themeColors.yellow,
          );
          chapterPanel(
            ctx,
            api,
            themeColors,
            caller ? 1 : '?',
            1350,
            375 + i * 240,
            300,
            120,
            caller ? themeColors.green : themeColors.yellow,
            44,
          );
        });
        chapterText(
          ctx,
          api,
          themeColors,
          'constructor default',
          910,
          855,
          29,
          themeColors.muted,
          'center',
        );
        chapterText(
          ctx,
          api,
          themeColors,
          'actual caller default',
          1500,
          855,
          29,
          themeColors.green,
          'center',
        );
      });
      chapterFooter(
        ctx,
        api,
        themeColors,
        'Resolve autocast, scaling, clipping and mask learning rates before interpreting scores.',
      );
    } else {
      chapterSubtitle(
        ctx,
        api,
        themeColors,
        'Smaller dimensions need actual receiving-system timing',
      );
      focusScope(ctx, api, 'lp-profile', () => {
        ['prepare', 'forward', 'backward', 'total elapsed'].forEach((s, i) => {
          chapterText(ctx, api, themeColors, s, 230, 400 + i * 145, 32, themeColors.blue);
          api.rect(
            ctx,
            700,
            350 + i * 145,
            [430, 650, 750, 1000][i],
            75,
            [themeColors.muted, themeColors.cyan, themeColors.purple, themeColors.yellow][i],
            undefined,
            0,
          );
        });
      });
      chapterFooter(
        ctx,
        api,
        themeColors,
        'Schematic phase inventory · no timing or utilization result is asserted.',
      );
    }
  }
}
export default {
  id: 'runtime-layout',
  draw: drawRuntimeLayout,
  cues: ['lp-groups', 'lp-gated-ffn', 'lp-constructor', 'lp-caller', 'lp-profile'],
};
