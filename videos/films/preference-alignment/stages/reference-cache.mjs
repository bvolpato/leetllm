import { prefBound } from '../arithmetic.mjs';
import { alignmentTokenScores } from '../model.mjs';
import {
  caption,
  cell,
  constructionText,
  focusTarget,
  heading,
  line,
  table,
} from '../defaults.mjs';
export function drawReferenceCache(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue reference-cache/' + id);
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
    if (currentBeat < 2) {
      const changed = currentBeat === 1 && resultComplete('pa-cache-mask', 1),
        old = alignmentTokenScores(),
        fresh = alignmentTokenScores(0, 0, !changed);
      heading(ctx, api, 'Same response text · a reference scalar belongs to its scoring mask');
      const ids = old.fixture.chosenIds;
      ids.forEach((id, i) => {
        const x = 210 + i * 250,
          color = i < 2 ? themeColors.blue : i === 5 ? themeColors.muted : themeColors.green;
        cell(ctx, api, id, x, 420, 210, 80, color, 36);
        constructionText(ctx, api, 'target ' + i, x + 105, 380, 25, themeColors.muted, 'center');
        const selected = fresh.selected[i];
        constructionText(
          ctx,
          api,
          selected ? 'included' : 'excluded',
          x + 105,
          585,
          27,
          selected ? themeColors.yellow : themeColors.muted,
          'center',
        );
        if (i === 4 && changed) line(ctx, api, x, 610, x + 210, 610, themeColors.pink, 5);
      });
      constructionText(
        ctx,
        api,
        'Reference revision R0 · same tokenizer/template/truncation',
        170,
        720,
        31,
        themeColors.blue,
      );
      constructionText(
        ctx,
        api,
        'Stored old-mask sum: ' + old.chosenRef.toFixed(6),
        170,
        835,
        34,
        changed ? themeColors.pink : themeColors.cyan,
      );
      constructionText(
        ctx,
        api,
        changed
          ? 'New-mask sum: ' + fresh.chosenRef.toFixed(6)
          : 'Cache matches this exact target set',
        170,
        930,
        34,
        changed ? themeColors.green : themeColors.cyan,
      );
      caption(
        ctx,
        api,
        'Changing the EOS mask does not change the text; it changes which terms belong in the sum.',
      );
    } else {
      heading(ctx, api, 'Full-model setup: updated actor cannot recreate its old reference');
      table(
        ctx,
        api,
        ['object', 'revision / data', 'available evidence'],
        [
          ['actor', 'π1 after updates', 'current scores'],
          ['planned pair cache', 'R0 on prepared IDs', 'original frozen scores'],
          ['new uncached dataset', 'not prepared under R0', 'no reference score'],
        ],
        170,
        410,
        1570,
        140,
      );
      constructionText(
        ctx,
        api,
        'Alternative repair: retain an explicit frozen R0, or prepare valid initial caches.',
        170,
        915,
        31,
        themeColors.green,
      );
      caption(
        ctx,
        api,
        'Pinned TRL full-model/precompute contract; adapter and separately retained-reference paths differ.',
      );
    }
    return;
  };
  focusTarget(ctx, api, 'reference-cache-construction', construction);
}
export default {
  id: 'reference-cache',
  draw: drawReferenceCache,
  cues: ['reference-cache-b0', 'reference-cache-b1', 'pa-cache-mask', 'reference-cache-b2'],
};
