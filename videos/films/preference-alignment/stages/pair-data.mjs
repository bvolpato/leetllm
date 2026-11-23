import { prefBound, prefLerp } from '../arithmetic.mjs';
import { caption, constructionText, focusTarget, heading, rectangle, table } from '../defaults.mjs';
export function drawPairData(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id)) throw Error('Undeclared cue pair-data/' + id);
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : prefBound(cue.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : prefBound((progress - 0.12) / 0.76);
  };
  const construction = () => {
    heading(ctx, api, 'A comparison owns its rendered prompt and both complete responses');
    if (currentBeat < 2) {
      const split = currentBeat === 1 ? cueProgress('pa-data-groups', 1) : 0;
      constructionText(ctx, api, 'TRAIN', 170, 380, 29, themeColors.blue);
      constructionText(ctx, api, 'HELD OUT', 1290, 380, 29, themeColors.yellow);
      for (let i = 0; i < 3; i++) {
        const same = i < 2,
          prompt = same ? 'P7' : 'P1',
          x = same ? prefLerp(170, 1090, split) : 170,
          y = 430 + i * 145;
        rectangle(ctx, api, x, y, 650, 110, same ? themeColors.blue : themeColors.cyan);
        constructionText(
          ctx,
          api,
          prompt + ' · response A / response B',
          x + 24,
          y + 45,
          28,
          themeColors.ink,
        );
        constructionText(
          ctx,
          api,
          'generator g' + i + ' · vote ' + (i === 1 ? 'B > A' : 'A > B'),
          x + 24,
          y + 88,
          25,
          i === 1 ? themeColors.pink : themeColors.green,
        );
      }
      if (split === 1)
        constructionText(
          ctx,
          api,
          'Both P7 votes move together; opposite votes remain separate.',
          170,
          955,
          30,
          themeColors.yellow,
        );
    } else {
      table(
        ctx,
        api,
        ['behavior', 'stored pair evidence', 'new-generation risk'],
        [
          ['policy compliance', 'A > B under P7', 'C invents an exception'],
          [
            'tool use / refusals',
            'own actual prompt + boundaries',
            'different missing distinction',
          ],
          ['style / reasoning', 'separate rubric outcomes', 'high pair accuracy can miss it'],
        ],
        170,
        430,
        1580,
        145,
      );
      constructionText(
        ctx,
        api,
        'A vague rubric stays vague after adding more votes.',
        170,
        960,
        31,
        themeColors.pink,
      );
    }
    caption(
      ctx,
      api,
      'Unseen-prompt generalization and known-prompt/new-response evaluation are different designs.',
    );
    return;
  };
  focusTarget(ctx, api, 'pair-data-construction', construction);
}
export default {
  id: 'pair-data',
  draw: drawPairData,
  cues: ['pair-data-b0', 'pair-data-b1', 'pa-data-groups', 'pair-data-b2'],
};
