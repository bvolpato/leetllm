import { scheduleRequests } from '../arithmetic.mjs';
import { capacityEvent } from '../construction.mjs';
import { drawCapacityCard, drawCapacityText, drawCenteredText, drawFooter } from '../defaults.mjs';
export function drawContinuousSchedule(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => capacityEvent(scene, state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('continuous-schedule-mechanism', () => {
    const lengths = [2, 2, 5, 3, 1],
      staticRun = scheduleRequests(lengths, 3, false),
      cont = scheduleRequests(lengths, 3, true);
    drawCenteredText(
      ctx,
      api,
      'R1=2 · R2=2 · R3=5 · R4=3 · R5=1 remaining tokens',
      960,
      295,
      32,
      themeColors.yellow,
    );
    if (currentBeat === 0) {
      lengths.forEach((n, i) => {
        drawCapacityText(
          ctx,
          api,
          'R' + (i + 1),
          185,
          420 + i * 95,
          30,
          i === 2 ? themeColors.pink : themeColors.cyan,
        );
        for (let j = 0; j < n; j++)
          drawCapacityCard(
            ctx,
            api,
            't' + (j + 1),
            340 + j * 220,
            375 + i * 95,
            180,
            66,
            i === 2 ? themeColors.pink : themeColors.cyan,
            25,
          );
      });
    } else {
      const p = currentBeat === 1 ? ev('static', 1) : 1,
        cp = currentBeat === 1 ? Math.max(ev('refill', 1) * 0.7, ev('done', 1)) : 1;
      [
        [staticRun, 220, p, 'STATIC'],
        [cont, 1050, cp, 'CONTINUOUS'],
      ].forEach(([run, x, progress, label]) => {
        drawCenteredText(
          ctx,
          api,
          label,
          x + 330,
          365,
          32,
          label === 'STATIC' ? themeColors.blue : themeColors.green,
        );
        for (let col = 0; col < run.frames.length; col++) {
          const active = col < Math.floor(progress * run.frames.length + 1e-8);
          drawCenteredText(ctx, api, col + 1, x + col * 80 + 30, 435, 24, themeColors.muted);
          run.frames[col].slots.forEach((id, row) => {
            if (id !== null)
              drawCapacityCard(
                ctx,
                api,
                'R' + (id + 1),
                x + col * 80,
                480 + row * 120,
                64,
                90,
                active ? (id === 2 ? themeColors.pink : themeColors.green) : themeColors.muted,
                23,
              );
          });
        }
        if (progress === 1)
          drawCenteredText(
            ctx,
            api,
            run.reads + ' full weight reads',
            x + 330,
            910,
            31,
            label === 'STATIC' ? themeColors.blue : themeColors.green,
          );
      });
      if (currentBeat === 2 && done('ratio', 2))
        drawCenteredText(
          ctx,
          api,
          'Same 13 emitted tokens: 13/8 = 1.625 → 13/5 = 2.6 tokens/read',
          960,
          980,
          32,
          themeColors.yellow,
        );
    }
    drawFooter(
      ctx,
      api,
      'R3 keeps its history when R4 and R5 join the batch',
    );
  });
}
export default {
  id: 'continuous-schedule',
  draw: drawContinuousSchedule,
  cues: [
    'ic-continuous-schedule-fixture',
    'ic-continuous-schedule-static',
    'ic-continuous-schedule-refill',
    'ic-continuous-schedule-done',
    'ic-continuous-schedule-ratio',
  ],
};
