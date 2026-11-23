import { prefBound, prefLerp } from '../arithmetic.mjs';
import { alignmentGroup } from '../model.mjs';
import { caption, constructionText, focusTarget, heading, line, rectangle } from '../defaults.mjs';
export function drawGroupAdvantage(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue group-advantage/' + id);
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
  const resultComplete = (id, beat = currentBeat) => cueProgress(id, beat) >= 1 - 1e-8;
  const construction = () => {
    const change = currentBeat >= 2 ? cueProgress('pa-group-uniform', 2) : 0,
      rewards = [1, 0, 0.5, 1].map((v) => prefLerp(v, 1, change)),
      v = alignmentGroup(rewards);
    heading(ctx, api, 'One prompt · four actual completion identities');
    for (let i = 0; i < 4; i++) {
      const x = 290 + i * 390,
        y = 680,
        h = rewards[i] * 270;
      constructionText(ctx, api, 'R' + i, x + 80, 370, 31, themeColors.blue);
      rectangle(ctx, api, x, y - h, 160, h, themeColors.blue, themeColors.blue);
      constructionText(
        ctx,
        api,
        'r = ' + rewards[i].toFixed(3),
        x + 80,
        750,
        29,
        themeColors.blue,
        'center',
      );
      if (currentBeat > 0 && resultComplete('pa-group-advantages', 1)) {
        const a = v.advantages[i];
        constructionText(
          ctx,
          api,
          'A = ' + a.toFixed(3),
          x + 80,
          890,
          30,
          a >= 0 ? themeColors.green : themeColors.pink,
          'center',
        );
      }
    }
    if (currentBeat > 0) {
      const lineY = 680 - v.mean * 270;
      line(ctx, api, 200, lineY, 1730, lineY, themeColors.yellow, 3);
      constructionText(
        ctx,
        api,
        'μ = ' + v.mean.toFixed(3) + ' · population σ = ' + v.std.toFixed(6),
        170,
        965,
        31,
        themeColors.yellow,
      );
    }
    if (v.std === 0)
      constructionText(
        ctx,
        api,
        'Guarded reward advantages = 0; KL/other loss remains separate',
        960,
        330,
        30,
        themeColors.pink,
        'center',
      );
    if (currentBeat === 3)
      constructionText(
        ctx,
        api,
        'Four equal backbones    ·    Parameter state drops from 2520 to 1400 GB',
        960,
        810,
        30,
        themeColors.muted,
        'center',
      );
    caption(
      ctx,
      api,
      'Each reply receives an advantage relative to the other replies in its group.',
    );
    return;
  };
  focusTarget(ctx, api, 'group-advantage-construction', construction);
}
export default {
  id: 'group-advantage',
  draw: drawGroupAdvantage,
  cues: [
    'group-advantage-b0',
    'group-advantage-b1',
    'pa-group-mean',
    'pa-group-advantages',
    'group-advantage-b2',
    'pa-group-uniform',
    'group-advantage-b3',
  ],
};
