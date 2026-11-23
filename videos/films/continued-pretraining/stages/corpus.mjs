import { DOMAIN_DOCUMENTS } from '../fixtures.mjs';
import { corpusSnapshot, replayGradient } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawCorpus(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const alpha = 0;
  const gradient = replayGradient(alpha);
  {
    const v = corpusSnapshot(currentBeat, progress);
    if (currentBeat < 2) {
      DOMAIN_DOCUMENTS.forEach((row, i) => {
        const y = 370 + i * 77,
          reason = v.decisions[i].reason,
          color =
            reason === 'retain'
              ? themeColors.green
              : reason === 'pending'
                ? themeColors.muted
                : themeColors.pink;
        api.focus.target('source-records', () =>
          text(ctx, api, row.id, 140, y, 29, themeColors.blue),
        );
        api.focus.target('source-records', () =>
          text(ctx, api, row.text, 255, y, 28, themeColors.ink),
        );
        api.focus.target('corpus-decisions', () => text(ctx, api, reason, 1210, y, 27, color));
      });
      if (v.heldout || api.focus.progress('corpus-b2-1', 0) > 0)
        api.focus.target('held-out-source', () =>
          text(
            ctx,
            api,
            'E1 held out first: The reef shelters young fish.',
            140,
            865,
            29,
            themeColors.yellow,
          ),
        );
      api.focus.target('training-manifest', () =>
        text(
          ctx,
          api,
          'Training manifest: ' + (v.retained.map((x) => x.id).join(', ') || 'pending'),
          960,
          950,
          33,
          themeColors.green,
          'center',
        ),
      );
      if (currentBeat === 0 && v.seconds >= 5.6875)
        text(
          ctx,
          api,
          'D1/D2 word-set overlap ' + v.nearDuplicateSimilarity.toFixed(2) + ' > 0.70',
          960,
          1020,
          25,
          themeColors.muted,
          'center',
        );
      if (currentBeat === 1 && v.overlap)
        text(
          ctx,
          api,
          'D6 exactly matches E1 · keep that lineage outside training',
          960,
          1020,
          27,
          themeColors.yellow,
          'center',
        );
    } else {
      text(
        ctx,
        api,
        'Training D1 · checkpoint tokenizer fixture tok-v1',
        960,
        300,
        35,
        themeColors.cyan,
        'center',
      );
      card(ctx, api, DOMAIN_DOCUMENTS[0].text, 250, 405, 1420, themeColors.blue);
      v.pieces.forEach((piece, i) =>
        api.focus.target('tokenizer-pieces', () =>
          components.card({
            label: i < v.shown ? piece.replace(/^ /, '▁') : '·',
            x: 160 + i * 205,
            y: 640,
            width: 180,
            height: 92,
            fontSize: 30,
            fill: themeColors.panel,
            stroke: i >= 5 && i < 7 ? themeColors.yellow : themeColors.cyan,
            textColor: i < v.shown ? themeColors.ink : themeColors.muted,
          }),
        ),
      );
      text(
        ctx,
        api,
        'reef → re + ef · two pieces under this unchanged vocabulary',
        960,
        845,
        33,
        themeColors.yellow,
        'center',
      );
    }
  }
}
export default {
  id: 'corpus',
  draw: drawCorpus,
  cues: ['corpus-b1-1', 'corpus-b1-2', 'corpus-b2-1', 'corpus-b2-2', 'corpus-b3-1'],
};
