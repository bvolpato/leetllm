import {
  chapterFooter,
  chapterLine,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
import { beatCue } from '../model.mjs';
export function drawSourceBoundary(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0;
  const registry = beatCue(state, 1, 'lp-registry', 0.1, 0.5);
  {
    if (beat < 2) {
      chapterSubtitle(
        ctx,
        api,
        themeColors,
        beat ? 'Find OPT in the model registry' : 'Models tested in the paper',
      );
      focusScope(ctx, api, 'lp-source', () => {
        chapterText(
          ctx,
          api,
          themeColors,
          'Findings ACL 2024 · Gu et al.',
          220,
          380,
          34,
          themeColors.yellow,
        );
        chapterText(
          ctx,
          api,
          themeColors,
          'LoRA + bottleneck Adapter',
          220,
          470,
          31,
          themeColors.ink,
        );
        chapterText(ctx, api, themeColors, 'RoBERTa-Large + OPT', 220, 550, 31, themeColors.ink);
        chapterLine(ctx, api, themeColors, 960, 340, 960, 820, themeColors.muted, 2);
        chapterText(
          ctx,
          api,
          themeColors,
          'gccnlp/Light-PEFT  ·  7b10c22026fe',
          1060,
          380,
          32,
          themeColors.cyan,
        );
        chapterText(
          ctx,
          api,
          themeColors,
          'Torch 2.0.1 · Transformers 4.31',
          1060,
          470,
          29,
          themeColors.cyan,
        );
        if (beat) {
          chapterText(ctx, api, themeColors, 'Registered models', 1060, 570, 31, themeColors.ink);
          for (const [i, task] of ['sequence classification', 'multiple choice'].entries()) {
            if (registry > i / 2)
              chapterText(
                ctx,
                api,
                themeColors,
                'RoBERTa  ·  ' + task,
                1060,
                650 + 80 * i,
                33,
                themeColors.cyan,
              );
          }
        }
      });
      chapterFooter(
        ctx,
        api,
        themeColors,
        beat
          ? 'A decoder port needs the row and column layout of its heads.'
          : 'The paper lists the authors. The repository records the code contributors.',
      );
    } else {
      chapterSubtitle(ctx, api, themeColors, 'A subtree license has a defined boundary');
      focusScope(ctx, api, 'lp-license', () => {
        chapterText(ctx, api, themeColors, 'Light-PEFT /', 370, 390, 38, themeColors.blue);
        chapterLine(ctx, api, themeColors, 415, 430, 415, 770, themeColors.muted, 3);
        chapterLine(ctx, api, themeColors, 415, 520, 550, 520, themeColors.muted, 3);
        chapterLine(ctx, api, themeColors, 415, 720, 550, 720, themeColors.muted, 3);
        chapterText(
          ctx,
          api,
          themeColors,
          'root license: not present in this pin',
          590,
          530,
          33,
          themeColors.pink,
        );
        chapterText(
          ctx,
          api,
          themeColors,
          'bundled PEFT / LICENSE: Apache-2.0',
          590,
          730,
          33,
          themeColors.green,
        );
        chapterText(
          ctx,
          api,
          themeColors,
          'This file covers its subtree',
          590,
          800,
          28,
          themeColors.green,
        );
      });
      chapterFooter(
        ctx,
        api,
        themeColors,
        'Check source, dependency and checkpoint terms for the actual reuse.',
      );
    }
  }
}
export default {
  id: 'source-boundary',
  draw: drawSourceBoundary,
  cues: ['lp-source-pin', 'lp-registry', 'lp-license'],
};
