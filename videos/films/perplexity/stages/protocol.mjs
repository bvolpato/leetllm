import { box, drawText, focus, sub } from '../defaults.mjs';
import { spokenCue } from '../construction.mjs';
export function drawProtocol(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (id) => spokenCue(scene, state, id);
  {
    if (currentBeat === 1) {
      const slide = cue('protocol-context-cut');
      const removed = slide.phase === 'after';
      sub(ctx, api, 'Same model   ·   Same target word: queued');
      focus(ctx, api, 'protocol-simulation-43', () => {
        box(
          ctx,
          api,
          'Earlier line: amber means queued',
          180,
          405,
          735,
          115,
          removed ? themeColors.muted : themeColors.blue,
          35,
        );
        box(
          ctx,
          api,
          'Current question: status for amber?',
          1005,
          405,
          735,
          115,
          themeColors.blue,
          32,
        );
        const left = api.lerp(180, 1005, slide.progress);
        api.line(ctx, left, 545, left, 575, themeColors.cyan, 4);
        api.line(ctx, left, 575, 1740, 575, themeColors.cyan, 4);
        api.line(ctx, 1740, 545, 1740, 575, themeColors.cyan, 4);
        drawText(
          ctx,
          api,
          'History in view',
          (left + 1740) / 2,
          635,
          34,
          themeColors.cyan,
          'center',
        );
      });
      focus(ctx, api, 'protocol-object-labels-i-44', () => {
        [0.8, 0.2].forEach((p, row) => {
          const shareCue = cue(row === 0 ? 'protocol-long-share' : 'protocol-short-share');
          if (row === 1 && !removed) return;
          const y = 795 + row * 130;
          const color = row === 0 ? themeColors.blue : themeColors.pink;
          drawText(ctx, api, row === 0 ? 'With the clue' : 'Without the clue', 180, y, 38, color);
          api.rect(ctx, 585, y - 54, 500, 67, themeColors.panel, themeColors.muted, 2);
          if (shareCue.phase !== 'after') return;
          api.rect(ctx, 585, y - 54, 500 * p, 67, color);
          drawText(ctx, api, Math.round(100 * p) + '%', 1160, y, 39, color);
          drawText(ctx, api, (-Math.log(p)).toFixed(3) + ' nats', 1610, y, 42, color, 'center');
        });
      });
    } else {
      sub(ctx, api, 'Comparing two checkpoints on support tickets');
      focus(ctx, api, 'protocol-simulation-43', () => {
        const fields = [
          'corpus / split',
          'tokenizer / objective',
          'context / stride',
          'document / target policy',
        ];
        fields.forEach((v, i) => {
          const y = 350 + i * 150;
          box(ctx, api, v, 220, y, 650, 85, themeColors.blue, 31);
          box(
            ctx,
            api,
            currentBeat === 2 && i === 0
              ? 'Check training and selection records'
              : 'fixed across compared runs',
            1050,
            y,
            650,
            85,
            currentBeat === 2 && i === 0 ? themeColors.yellow : themeColors.green,
            29,
          );
        });
      });
      focus(ctx, api, 'protocol-object-labels-i-44', () =>
        drawText(
          ctx,
          api,
          currentBeat === 2
            ? 'Did either checkpoint already see these tickets?'
            : 'Only the checkpoint revision changes in a controlled weights comparison',
          960,
          1030,
          31,
          themeColors.yellow,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'protocol',
  draw: drawProtocol,
  cues: [
    'protocol-beat-1-focus-1',
    'protocol-beat-1-focus-2',
    'protocol-beat-2-focus-1',
    'protocol-context-cut',
    'protocol-long-share',
    'protocol-short-share',
    'protocol-beat-3-focus-1',
  ],
};
