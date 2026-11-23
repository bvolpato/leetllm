import { historyOwnership, mpClamp } from '../arithmetic.mjs';
import { parallelFooter, parallelRectangle, parallelText } from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawDecodeHistory(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mpClamp(state.beatP ?? 0);
  const cue = (name, index) => {
    const id = 'mp-decode-history-' + name,
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
  api.focus.target('mp-decode-history-mechanism', () => {
    const m = historyOwnership(),
      q = Q('modulo', 1),
      dcp = currentBeat > 1 || resultComplete('eight', 1);
    parallelText(
      ctx,
      api,
      'Same eight ranks · two KV-head identities · 32 positions',
      960,
      300,
      32,
      themeColors.ink,
      'center',
    );
    m.ranks.forEach((r) => {
      const y = 365 + r.rank * 71,
        col = r.head ? themeColors.cyan : themeColors.blue;
      parallelText(
        ctx,
        api,
        'rank ' + r.rank + ' · KV' + r.head + ' · lane ' + r.lane,
        170,
        y + 35,
        25,
        col,
      );
      for (let token = 0; token < 32; token++) {
        const keep = token % 4 === r.lane,
          removed = (dcp || token < q * 32) && !keep;
        if (removed) continue;
        parallelRectangle(ctx, api, 695 + token * 32, y, 25, 45, col, themeColors.panel);
        parallelText(ctx, api, String(token), 707 + token * 32, y + 29, 16, col, 'center');
      }
    });
    if (resultComplete('physical', 2))
      parallelText(
        ctx,
        api,
        '256 physical pairs → 64 unique pairs · 8 / rank',
        960,
        970,
        32,
        themeColors.green,
        'center',
      );
    else
      parallelText(
        ctx,
        api,
        dcp
          ? 'Each modulo lane keeps eight positions'
          : q > 0
            ? 'Redistributing history into modulo lanes'
            : 'Plain replicated cache: 32 positions on every rank',
        960,
        970,
        29,
        themeColors.yellow,
        'center',
      );
    parallelFooter(
      ctx,
      api,
      'DCP uses existing TP ranks. Page rounding, metadata and other hybrid state are excluded.',
    );
  });
}
export default {
  id: 'decode-history',
  draw: drawDecodeHistory,
  cues: [
    'mp-decode-history-0',
    'mp-decode-history-existing',
    'mp-decode-history-1',
    'mp-decode-history-premises',
    'mp-decode-history-modulo',
    'mp-decode-history-eight',
    'mp-decode-history-2',
    'mp-decode-history-physical',
  ],
};
