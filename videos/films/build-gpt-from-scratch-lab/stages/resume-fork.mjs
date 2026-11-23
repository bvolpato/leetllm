import { adamFork } from '../arithmetic.mjs';
import { ended, spoken } from '../construction.mjs';
import { drawChapterCard, drawChapterText, drawFooter, drawTable } from '../defaults.mjs';
export function drawResumeFork(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (cue, beat = currentBeat) => spoken(state, cue, beat),
    E = (cue, beat = currentBeat) => ended(state, cue, beat);
  api.focus.target('resume-fork-mechanism', () => {
    if (currentBeat === 0) {
      const frozen = cueProgress('freeze-storage', 0) > 0;
      drawChapterText(
        ctx,
        api,
        'Illustrative tensor storage · w starts at 1.0',
        960,
        280,
        35,
        themeColors.ink,
        'center',
      );
      drawChapterCard(
        ctx,
        api,
        'Live model: w = 0.9 after update',
        1020,
        420,
        720,
        themeColors.blue,
        120,
        36,
      );
      drawChapterCard(
        ctx,
        api,
        frozen ? 'Frozen snapshot: w = 1.0' : 'Shallow state: w = 0.9',
        170,
        420,
        720,
        frozen ? themeColors.green : themeColors.pink,
        120,
        36,
      );
      drawChapterText(
        ctx,
        api,
        frozen
          ? 'Separate copied tensor storage'
          : 'Two dictionaries can reference the same tensor storage',
        960,
        655,
        33,
        frozen ? themeColors.green : themeColors.pink,
        'center',
      );
      if (cueProgress('save-progress', 0) > 0)
        drawTable(
          ctx,
          api,
          [
            ['Weights + Adam state', 'Completed updates + config', 'Tokenizer + active-ID order'],
            ['Corpus hash + split', 'Progressed train RNG', 'Progressed validation RNG'],
          ],
          170,
          755,
          1580,
          190,
          26,
        );
    } else if (currentBeat === 1) {
      const f = adamFork(),
        restored = E('restore-moments', 1),
        reset = E('reset-moments', 1);
      drawChapterText(
        ctx,
        api,
        'Scalar Adam toy · β₁ = β₂ = 0.5 · ε = 0 · η = 0.1 · no decay',
        960,
        280,
        31,
        themeColors.ink,
        'center',
      );
      drawTable(
        ctx,
        api,
        [
          ['Gradient', 'Step', 'm', 'v', 'Weight'],
          ...f.prefix.states.map((s) => [
            String(s.gradient),
            String(s.step),
            s.m.toFixed(3),
            s.v.toFixed(3),
            s.weight.toFixed(3),
          ]),
        ],
        170,
        350,
        1580,
        210,
        30,
      );
      drawChapterText(
        ctx,
        api,
        'Both paths start next step at w = 0.8 with the same gradient −1',
        960,
        635,
        31,
        themeColors.yellow,
        'center',
      );
      if (restored)
        drawChapterCard(
          ctx,
          api,
          'Restored at step 2 · after step 3\nw = ' + f.restored.weight.toFixed(7),
          170,
          745,
          720,
          themeColors.green,
          140,
          35,
        );
      if (reset)
        drawChapterCard(
          ctx,
          api,
          'Fresh optimizer · after step 1\nw = ' + f.reset.weight.toFixed(7),
          1030,
          745,
          720,
          themeColors.pink,
          140,
          35,
        );
      drawChapterText(
        ctx,
        api,
        'Same deterministic pre-update loss · different following parameter update',
        960,
        960,
        28,
        themeColors.muted,
        'center',
      );
    } else {
      drawChapterText(
        ctx,
        api,
        'Actual pinned CPU checkpoint · update 321 → next update 322',
        960,
        280,
        34,
        themeColors.ink,
        'center',
      );
      const count = E('exact-resume', 2)
        ? 4
        : Math.min(3, Math.floor(4 * cueProgress('exact-resume', 2)));
      ['probe logits', 'next sampled batch', 'pre-update loss', 'post-update weights'].forEach(
        (v, i) => {
          const x = 170 + (i % 2) * 860,
            y = 405 + Math.floor(i / 2) * 195;
          drawChapterCard(
            ctx,
            api,
            v,
            x,
            y,
            720,
            count > i ? themeColors.green : themeColors.muted,
            125,
            34,
          );
          if (count > i)
            drawChapterText(
              ctx,
              api,
              'EXACT MATCH',
              x + 360,
              y + 95,
              25,
              themeColors.green,
              'center',
            );
        },
      );
      drawChapterText(
        ctx,
        api,
        'Additional CUDA, dropout, scaler and scheduler state depends on the actual training loop',
        960,
        895,
        27,
        themeColors.muted,
        'center',
      );
      drawChapterText(
        ctx,
        api,
        'AdamW decoupling and parameter grouping are separate choices',
        960,
        955,
        29,
        themeColors.yellow,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'Initial RNG seeds omit progress · checkpoint equivalence is scoped to the pinned environment',
    );
  });
}
export default {
  id: 'resume-fork',
  draw: drawResumeFork,
  cues: [
    'resume-fork-1',
    'freeze-storage',
    'save-progress',
    'resume-fork-2',
    'restore-moments',
    'reset-moments',
    'resume-fork-3',
    'exact-resume',
  ],
};
