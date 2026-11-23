import { orderAudit } from '../arithmetic.mjs';
import { generationState } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawGenerate(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const audit = orderAudit(0.8, 0.7);
  {
    const current = generationState(currentBeat, progress),
      colors = [themeColors.cyan, themeColors.green, themeColors.pink];
    const seedCard = api.focus.target('candidate-rows', () =>
      card(ctx, api, 'S12 · reviewed pagination contract', 560, 330, 800, themeColors.blue, 80, 31),
    );
    const headers = ['Cursor end', 'Bounded retry', 'Page limit'];
    if (current.move > 0) {
      headers.forEach((h, i) => text(ctx, api, h, 1090 + i * 250, 475, 26, colors[i], 'center'));
      text(ctx, api, 'Candidate', 250, 475, 28, themeColors.muted);
    }
    current.rows.forEach((row, i) => {
      const initialX = [150, 690, 1230][Math.min(i, 2)],
        initialY = 560,
        finalX = 180,
        finalY = 515 + i * 79;
      const move = current.move,
        vertical = Math.min(1, move * 2),
        horizontal = Math.max(0, move * 2 - 1),
        x = api.lerp(initialX, finalX, horizontal),
        y = api.lerp(initialY, finalY, vertical),
        width = api.lerp(490, 680, horizontal),
        color = colors[row.family];
      const candidateCard = api.focus.target('candidate-rows', () =>
        card(ctx, api, row.id + ' · ' + row.task, x, y, width, color, 64, 25),
      );
      if (currentBeat === 0) {
        api.connect(ctx, api.groupBounds(seedCard), api.groupBounds(candidateCard), {
          color,
          gap: 16,
          width: 2,
        });
        if (current.expectedVisible || api.focus.progress('generate-b1-2', 0) > 0)
          api.focus.target('expected-behavior', () =>
            card(ctx, api, row.expected, x, 665, 490, color, 112, 25),
          );
      }
      if (move >= 1) {
        headers.forEach((_h, k) => {
          const on = k === row.family;
          api.focus.target('behavior-coverage', () =>
            api.rect(
              ctx,
              1035 + k * 250,
              y,
              110,
              60,
              on ? color : themeColors.panel,
              on ? color : themeColors.muted,
              1,
            ),
          );
          if (on) text(ctx, api, '✓', 1090 + k * 250, y + 42, 35, themeColors.bg, 'center');
        });
      }
    });
    if (current.move >= 1) {
      const cueStart = currentBeat === 1 ? 5.55 : 17.4625,
        cueAge = current.seconds - cueStart,
        cue = cueAge >= 0 && cueAge < 1.8 ? Math.sin((Math.PI * cueAge) / 1.8) : 0;
      teaching.valueChange({
        x: 180,
        y: 945,
        width: 370,
        height: 80,
        from: currentBeat === 1 ? 3 : 4,
        to: current.rows.length,
        progress: 1,
        emphasis: cue,
        label: 'Rows',
        format: (value) => String(Math.round(value)),
        fontSize: 34,
        showDelta: false,
      });
      text(
        ctx,
        api,
        'Distinct behaviors: ' + current.familyCount,
        1050,
        990,
        34,
        themeColors.yellow,
        'center',
      );
    } else {
    }
  }
}
export default {
  id: 'generate',
  draw: drawGenerate,
  cues: ['generate-b1-1', 'generate-b1-2', 'generate-b2-1', 'generate-b3-1'],
};
