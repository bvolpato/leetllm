import { mpClamp } from '../arithmetic.mjs';
import { parallelFooter, parallelRectangle, parallelText, parallelTile } from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawHeadReplication(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mpClamp(state.beatP ?? 0);
  const cue = (name, index) => {
    const id = 'mp-head-replication-' + name,
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
  const resultComplete = (name, index) => cue(name, index).done;
  api.focus.target('mp-head-replication-mechanism', () => {
    const eight = currentBeat > 1 || resultComplete('eight', 1),
      n = eight ? 8 : 2;
    parallelText(
      ctx,
      api,
      '16 Q heads · 2 KV heads · width 256',
      960,
      300,
      33,
      themeColors.ink,
      'center',
    );
    for (let r = 0; r < n; r++) {
      const x = eight ? 180 + (r % 4) * 425 : 180 + r * 850,
        y = 390 + Math.floor(r / 4) * 250;
      parallelRectangle(
        ctx,
        api,
        x,
        y,
        eight ? 385 : 740,
        eight ? 205 : 365,
        r < n / 2 ? themeColors.blue : themeColors.cyan,
      );
      parallelText(ctx, api, 'rank ' + r, x + 20, y + 38, 27, themeColors.muted);
      const qheads = 16 / n;
      for (let j = 0; j < qheads; j++)
        parallelTile(
          ctx,
          api,
          'Q' + (r * qheads + j),
          x + 20 + (j % 4) * (eight ? 86 : 172),
          y + 65 + Math.floor(j / 4) * 80,
          eight ? 76 : 145,
          53,
          themeColors.blue,
        );
      if (!eight || resultComplete('replicate', 1))
        parallelTile(
          ctx,
          api,
          'KV' + Math.floor(r / (n / 2)),
          x + (eight ? 210 : 280),
          y + (eight ? 125 : 270),
          150,
          58,
          r < n / 2 ? themeColors.blue : themeColors.cyan,
        );
    }
    if (eight && resultComplete('replicate', 1))
      parallelText(
        ctx,
        api,
        'Each KV projection repeats on four ranks',
        960,
        940,
        32,
        themeColors.yellow,
        'center',
      );
    else
      parallelText(
        ctx,
        api,
        eight ? 'TP8 query-head placement · KV placement pending' : 'TP2 divides both head counts',
        960,
        940,
        32,
        themeColors.yellow,
        'center',
      );
    parallelFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Plain replication leaves one full-history KV head per rank; hybrid state is separate.'
        : '10 full-attention layers; the other 30 layers keep a different state.',
    );
  });
}
export default {
  id: 'head-replication',
  draw: drawHeadReplication,
  cues: [
    'mp-head-replication-0',
    'mp-head-replication-premises',
    'mp-head-replication-hybrid',
    'mp-head-replication-1',
    'mp-head-replication-two',
    'mp-head-replication-eight',
    'mp-head-replication-replicate',
    'mp-head-replication-2',
    'mp-head-replication-plateau',
  ],
};
