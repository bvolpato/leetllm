import { newChapterModel, trainingSchedule } from '../model.mjs';
import {
  chapterEquation,
  chapterFooter,
  chapterGrid,
  chapterLine,
  chapterText,
  chapterTitle,
} from '../defaults.mjs';
export function drawMicrobatchBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('microbatch-budget', state),
    { b: currentBeat } = modelState;
  const cueProgress = () =>
      api.focus.progress('mg-microbatch-budget-b' + currentBeat, modelState.p),
    R = (id) => api.focus.progress('mg-' + id, state.cues ? 0 : modelState.p),
    done = (id) => R(id) >= 1;
  api.focus.target('mg-microbatch-budget-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'Keep 64 example IDs independent of tensor/context copies'
        : currentBeat === 1
          ? 'Idle slots and useful-work ratio have different denominators'
          : 'Training adds warmup, backward and drain',
    );
    if (!currentBeat) {
      for (let d = 0; d < 4; d++) {
        chapterText(ctx, api, 'DP ' + d, 130, 415 + d * 130, 28, themeColors.cyan);
        for (let j = 0; j < 16; j++) {
          const x = 310 + j * 88,
            y = 370 + d * 130;
          api.rect(
            ctx,
            x,
            y,
            75,
            70,
            j < Math.floor(cueProgress() * 17) ? themeColors.blue : themeColors.panel,
            themeColors.muted,
            1,
          );
          chapterText(ctx, api, 'S' + (d * 16 + j), x + 37, y + 45, 23, themeColors.ink, 'center');
          if (j % 2 === 1)
            chapterLine(ctx, api, x + 81, y - 10, x + 81, y + 80, themeColors.yellow, 2);
        }
      }
      if (done('micro-eight'))
        chapterText(
          ctx,
          api,
          '16 samples / 2 per microbatch = 8 per replica',
          960,
          920,
          34,
          themeColors.green,
          'center',
        );
      if (done('token-budget'))
        chapterFooter(
          ctx,
          api,
          '64 × 2048 = 131,072 token positions before masks',
          themeColors.green,
        );
    } else if (currentBeat === 1) {
      for (let lane = 0; lane < 2; lane++) {
        chapterText(ctx, api, 'Stage ' + lane, 140, 490 + lane * 165, 30, themeColors.cyan);
        for (let tick = 0; tick < 9; tick++) {
          const active = tick >= lane && tick < lane + 8;
          api.rect(
            ctx,
            390 + tick * 140,
            420 + lane * 165,
            126,
            100,
            active ? themeColors.blue : themeColors.panel,
            active ? themeColors.blue : themeColors.pink,
            2,
          );
          chapterText(
            ctx,
            api,
            active ? 'μ' + (tick - lane) : 'idle',
            453 + tick * 140,
            480 + lane * 165,
            28,
            active ? themeColors.ink : themeColors.pink,
            'center',
          );
        }
      }
      if (done('bubble-ratios')) {
        chapterEquation(ctx, api, '\\text{idle fraction}=\\frac2{18}=\\frac19', 960, 850, 39);
        chapterEquation(ctx, api, '\\text{idle / useful}=\\frac2{16}=\\frac18', 960, 945, 39);
      }
    } else {
      const tick = Math.min(9, Math.floor(cueProgress() * 10)),
        rows = [
          [
            'slot',
            ...Array.from(
              {
                length: 10,
              },
              (_, i) => i,
            ),
          ],
          ...trainingSchedule().map((row) =>
            row.map((v, i) => (i === 0 || i <= tick + 1 ? v : '…')),
          ),
        ];
      chapterGrid(ctx, api, rows, 160, 430, 1600, 300, themeColors.blue, 25);
      chapterFooter(
        ctx,
        api,
        'Valid two-stage toy · each forward and backward waits for its required predecessor',
      );
    }
  });
  return true;
}
export default {
  id: 'microbatch-budget',
  draw: drawMicrobatchBudget,
  cues: [
    'mg-microbatch-budget-b0',
    'mg-micro-eight',
    'mg-token-budget',
    'mg-microbatch-budget-b1',
    'mg-bubble-ratios',
    'mg-microbatch-budget-b2',
  ],
};
