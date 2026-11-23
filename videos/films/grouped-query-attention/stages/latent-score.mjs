import { chapterModel } from '../construction.mjs';
import { chapterEquation, chapterText, matrix, note, operation } from '../defaults.mjs';
export function drawLatentScore(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('latent-score', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    const reveal = (name) => (state.cues ? api.focus.progress(name, 0) > 0.7 : progress > 0.85);
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'Expand one content key, then score it',
        960,
        275,
        38,
        themeColors.cyan,
      );
      matrix(
        ctx,
        api,
        [
          [1, 2],
          [0, 1],
        ],
        230,
        390,
      );
      chapterText(ctx, api, 'W', 310, 345, 36, themeColors.blue);
      matrix(ctx, api, [[1], [2]], 510, 390);
      chapterText(ctx, api, 'latent c', 550, 345, 33, themeColors.blue);
      api.arrow(ctx, 640, 470, 880, 470, themeColors.muted, 4);
      matrix(
        ctx,
        api,
        reveal('latent-expanded-result') ? [[5], [2]] : [['?'], ['?']],
        940,
        390,
        themeColors.green,
      );
      chapterText(ctx, api, 'q = [1, 0]', 1400, 430, 38, themeColors.cyan);
      operation(ctx, api, 'latent-score', () =>
        chapterEquation(
          ctx,
          api,
          reveal('latent-expanded-result') ? String.raw`q^\top(Wc)=5` : String.raw`q^\top(Wc)=\ ?`,
          1400,
          620,
          56,
          themeColors.yellow,
        ),
      );
      note(ctx, api, 'Supplied 2D arithmetic · key expansion repeats work over historical latents');
    } else if (currentBeat === 1) {
      const moving = state.cues
        ? api.focus.progress('latent-absorbed-query', 0) > 0.2
        : progress > 0.5;
      chapterText(
        ctx,
        api,
        moving
          ? 'Move W transpose to the current query'
          : 'Expand the supplied key before regrouping',
        960,
        275,
        38,
        themeColors.cyan,
      );
      matrix(
        ctx,
        api,
        moving
          ? [
              [1, 0],
              [2, 1],
            ]
          : [
              [1, 2],
              [0, 1],
            ],
        230,
        400,
      );
      chapterText(ctx, api, moving ? 'W transpose' : 'W', 315, 345, 33, themeColors.blue);
      matrix(ctx, api, moving ? [[1], [0]] : [[1], [2]], 540, 400);
      chapterText(ctx, api, moving ? 'query q' : 'latent c', 582, 650, 30, themeColors.blue);
      api.arrow(ctx, 660, 480, 880, 480, themeColors.muted, 4);
      matrix(
        ctx,
        api,
        moving
          ? reveal('latent-absorbed-query')
            ? [[1], [2]]
            : [['?'], ['?']]
          : reveal('latent-expanded-result')
            ? [[5], [2]]
            : [['?'], ['?']],
        940,
        400,
        themeColors.green,
      );
      chapterText(
        ctx,
        api,
        moving ? 'absorbed query' : 'expanded key',
        982,
        650,
        30,
        themeColors.green,
      );
      matrix(ctx, api, moving ? [[1], [2]] : [[1], [0]], 1350, 400);
      chapterText(ctx, api, moving ? 'same latent' : 'query q', 1392, 650, 30, themeColors.blue);
      if (moving)
        chapterText(
          ctx,
          api,
          'Direct path retained: expanded key [5, 2] · score 5',
          960,
          735,
          30,
          themeColors.muted,
        );
      operation(ctx, api, 'latent-score', () =>
        chapterEquation(
          ctx,
          api,
          moving
            ? reveal('latent-absorbed-result')
              ? String.raw`(W^\top q)^\top c=1\cdot1+2\cdot2=5`
              : String.raw`(W^\top q)^\top c\ \stackrel{?}{=}\ q^\top(Wc)`
            : reveal('latent-expanded-result')
              ? String.raw`q^\top(Wc)=1\cdot5+0\cdot2=5`
              : String.raw`q^\top(Wc)=\ ?`,
          960,
          830,
          46,
          themeColors.yellow,
        ),
      );
      note(
        ctx,
        api,
        'One current absorbed query can be reused across all history; compare numerical paths with tolerance',
      );
    } else {
      chapterText(
        ctx,
        api,
        'Weight the latents before one value up-projection',
        960,
        275,
        37,
        themeColors.cyan,
      );
      matrix(
        ctx,
        api,
        [
          [1, 2],
          [3, 0],
        ],
        260,
        390,
      );
      chapterText(ctx, api, 'c₀, c₁ · weights ¼, ¾', 345, 650, 30, themeColors.blue);
      const weighted = [0.25 + 2.25 * progress, 0.5],
        projected = [weighted[0] + 2 * weighted[1], weighted[1]];
      matrix(ctx, api, [weighted.map((v) => v.toFixed(2))], 900, 450, themeColors.green);
      operation(ctx, api, 'latent-score', () =>
        chapterEquation(
          ctx,
          api,
          String.raw`W_V[${weighted.map((v) => v.toFixed(2)).join(',')}]^\top=[${projected.map((v) => v.toFixed(2)).join(',')}]^\top`,
          960,
          820,
          46,
          themeColors.yellow,
        ),
      );
      chapterText(ctx, api, 'Accumulate ¼·c₀, then ¾·c₁', 1130, 650, 32, themeColors.green);
      note(
        ctx,
        api,
        'Same supplied linear W as before · direct expanded-value path gives the same output',
      );
    }
  }
}
export default {
  id: 'latent-score',
  draw: drawLatentScore,
  cues: [
    'latent-score-0',
    'latent-score-1',
    'latent-expanded-result',
    'latent-absorbed-query',
    'latent-absorbed-result',
    'latent-score-2',
  ],
};
