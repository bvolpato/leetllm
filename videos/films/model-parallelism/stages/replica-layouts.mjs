import { mpClamp } from '../arithmetic.mjs';
import { parallelFooter, parallelRectangle, parallelText, parallelTile } from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawReplicaLayouts(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mpClamp(state.beatP ?? 0);
  const cue = (name, index) => {
    const id = 'mp-replica-layouts-' + name,
      q = state.cues?.[id];
    if (state.cues && !q) throw Error('Missing model-parallel cue ' + id);
    return q
      ? {
          q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          q: currentBeat < index ? 0 : currentBeat > index ? 1 : smoothstep(progress),
          done: currentBeat > index || (currentBeat === index && progress >= 0.92),
        };
  };
  const Q = (name, index) => cue(name, index).q,
    resultComplete = (name, index) => cue(name, index).done;
  api.focus.target('mp-replica-layouts-mechanism', () => {
    const pairs = Q('pairs', 0) > 0;
    parallelText(
      ctx,
      api,
      'The same eight physical devices',
      960,
      300,
      34,
      themeColors.ink,
      'center',
    );
    for (let r = 0; r < 8; r++) {
      const x = 180 + (r % 4) * 420,
        y = 410 + Math.floor(r / 4) * 250,
        col = pairs
          ? [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow][
              Math.floor(r / 2)
            ]
          : themeColors.blue;
      parallelRectangle(ctx, api, x, y, 340, 205, col);
      parallelText(ctx, api, 'GPU ' + r, x + 170, y + 45, 29, col, 'center');
      parallelText(
        ctx,
        api,
        pairs ? 'TP2 replica ' + Math.floor(r / 2) : 'one TP8 replica',
        x + 170,
        y + 92,
        26,
        col,
        'center',
      );
      if (r < Q('copies', 1) * 8) {
        parallelTile(ctx, api, 'W part ' + (r % 2), x + 15, y + 115, 150, 36, col);
        parallelTile(ctx, api, 'KV[R' + Math.floor(r / 2) + ']', x + 175, y + 158, 150, 34, col);
      }
    }
    if (currentBeat === 2) {
      const q = Q('expert-group', 2);
      parallelRectangle(ctx, api, 155, 380, 1615, 515, themeColors.yellow, null);
      parallelText(
        ctx,
        api,
        q === 1
          ? 'EP group = TP × DP across all eight ranks'
          : 'Attention groups stay paired; expert routing can cross them',
        960,
        945,
        29,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1 && resultComplete('copies', 1))
      parallelText(
        ctx,
        api,
        'Four separate attention caches and four copies of the weight shards',
        960,
        945,
        29,
        themeColors.yellow,
        'center',
      );
    parallelFooter(
      ctx,
      api,
      'Compare throughput on the same requests across all eight GPUs.',
    );
  });
}
export default {
  id: 'replica-layouts',
  draw: drawReplicaLayouts,
  cues: [
    'mp-replica-layouts-0',
    'mp-replica-layouts-pairs',
    'mp-replica-layouts-1',
    'mp-replica-layouts-copies',
    'mp-replica-layouts-2',
    'mp-replica-layouts-expert-group',
  ],
};
