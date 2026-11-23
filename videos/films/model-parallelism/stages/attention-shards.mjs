import { mpClamp } from '../arithmetic.mjs';
import {
  parallelArrow,
  parallelFooter,
  parallelRectangle,
  parallelText,
  parallelTile,
} from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawAttentionShards(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mpClamp(state.beatP ?? 0);
  const cue = (name, index) => {
    const id = 'mp-attention-shards-' + name,
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
  api.focus.target('mp-attention-shards-mechanism', () => {
    const phase = Q('project', 0),
      att = Q('heads', 0),
      out = Q('output', 0);
    parallelText(
      ctx,
      api,
      'One classic dense transformer layer',
      960,
      300,
      34,
      themeColors.ink,
      'center',
    );
    for (let r = 0; r < 2; r++) {
      const x = 180 + r * 840,
        col = r ? themeColors.cyan : themeColors.blue;
      parallelText(ctx, api, 'rank ' + r + ' · heads ' + (r ? '2, 3' : '0, 1'), x, 380, 31, col);
      for (let k = 0; k < 3; k++) {
        parallelTile(
          ctx,
          api,
          ['Q', 'K', 'V'][k],
          x + k * 205,
          435,
          160,
          76,
          k < phase * 3 ? col : themeColors.muted,
        );
      }
      parallelRectangle(ctx, api, x, 590, 620, 95, att > 0 ? col : themeColors.muted);
      parallelText(
        ctx,
        api,
        att === 1 ? 'local head attention' : 'local attention pending',
        x + 310,
        650,
        28,
        col,
        'center',
      );
      if (out > 0) {
        parallelArrow(ctx, api, x + 310, 700, x + 310, 715, col);
        parallelText(ctx, api, 'head slice × matching Wₒ rows', x + 310, 750, 29, col, 'center');
      }
    }
    if (currentBeat > 0) {
      parallelArrow(ctx, api, 490, 785, 820, 845, themeColors.blue);
      parallelArrow(ctx, api, 1330, 785, 1100, 845, themeColors.cyan);
      parallelText(
        ctx,
        api,
        resultComplete('attention-sum', 1) ? 'attention sum: complete' : 'attention sum: pending',
        960,
        895,
        28,
        themeColors.yellow,
        'center',
      );
      parallelText(
        ctx,
        api,
        resultComplete('mlp-sum', 1) ? 'MLP sum: complete' : 'MLP sum: pending',
        170,
        950,
        28,
        themeColors.yellow,
      );
      if (resultComplete('count', 1))
        parallelText(
          ctx,
          api,
          '2 in-layer sum all-reduces',
          1500,
          950,
          30,
          themeColors.green,
          'center',
        );
    }
    parallelFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Count the collectives separately for each type of block.'
        : 'Independent head computation still needs the hidden-output sum.',
    );
  });
}
export default {
  id: 'attention-shards',
  draw: drawAttentionShards,
  cues: [
    'mp-attention-shards-0',
    'mp-attention-shards-project',
    'mp-attention-shards-heads',
    'mp-attention-shards-output',
    'mp-attention-shards-1',
    'mp-attention-shards-attention-sum',
    'mp-attention-shards-mlp-sum',
    'mp-attention-shards-count',
    'mp-attention-shards-2',
    'mp-attention-shards-hybrid',
  ],
};
