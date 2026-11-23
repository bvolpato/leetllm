import { guideWork, clamp } from '../arithmetic.mjs';
import { drawText, footer, line, mark, tokenRail } from '../defaults.mjs';
export function drawFreshBudget(ctx, scene, state, api) {
  return api.focus.target('fresh-budget-geometry', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueProgress = (id) =>
      state.cues ? api.focus.progress(id, 0) : clamp(((state.beatP ?? 0) - 0.15) / 0.65);
    const cueVisible = (id) => (state.cues ? api.focus.visible(id) : (state.beatP ?? 0) > 0.32);
    const cueComplete = (id) => cueProgress(id) === 1;
    {
      const edit = (currentBeat > 0 && cueVisible('fresh-edit')) || currentBeat > 1;
      const work = guideWork(4800, 64, 16, edit ? 4097 : 4801),
        reveal =
          currentBeat === 0
            ? cueComplete('fresh-sixty-four')
            : currentBeat === 1
              ? cueComplete('fresh-work')
              : true;
      const repairing = currentBeat === 2 && cueVisible('fresh-repair'),
        authorized = currentBeat === 2 && cueComplete('fresh-repair'),
        repaired = currentBeat === 2 && cueComplete('fresh-repair-complete'),
        capReady = currentBeat === 2 && cueComplete('fresh-cap'),
        cap = authorized ? 768 : 700;
      drawText(ctx, api, 'Fresh guide 4,800 + question 64 · full blocks of 16', 150, 270, 32);
      tokenRail(
        ctx,
        api,
        180,
        405,
        1520,
        [4800, 64],
        4864,
        [themeColors.blue, themeColors.cyan],
        85,
      );
      drawText(
        ctx,
        api,
        edit
          ? 'First changed position: 4,097 (one-based)'
          : 'Compatible completed guide on this worker',
        180,
        355,
        30,
        edit ? themeColors.pink : themeColors.blue,
      );
      if (edit) {
        const x = 180 + (1520 * 4096) / 4864;
        line(ctx, api, x, 380, x, 555, themeColors.pink, 4);
        mark(ctx, api, 'fresh-reuse', () => {
          drawText(
            ctx,
            api,
            currentBeat > 1 || cueComplete('fresh-reuse')
              ? '4,096 exact positions · 256 full blocks'
              : 'Reusable boundary pending',
            180,
            640,
            31,
            currentBeat > 1 || cueComplete('fresh-reuse') ? themeColors.green : themeColors.muted,
          );
        });
      } else if (!reveal)
        mark(ctx, api, 'fresh-predict', () =>
          drawText(
            ctx,
            api,
            'Predict the fresh input work',
            960,
            685,
            38,
            themeColors.yellow,
            'center',
          ),
        );
      if (reveal) {
        const max = 900,
          y = 735;
        drawText(ctx, api, 'Fresh work', 180, y - 30, 29);
        tokenRail(
          ctx,
          api,
          180,
          y,
          1520,
          edit ? [704, 64] : [64],
          max,
          edit ? [themeColors.yellow, themeColors.cyan] : [themeColors.cyan],
          70,
        );
        drawText(
          ctx,
          api,
          edit ? '704 guide + 64 question = ' + work.fresh : '64 new input tokens',
          180,
          y + 125,
          34,
          themeColors.green,
        );
        if (capReady) {
          const x = 180 + (1520 * cap) / max;
          line(ctx, api, x, y - 20, x, y + 95, repaired ? themeColors.green : themeColors.pink, 4);
          drawText(
            ctx,
            api,
            'cap ' + cap,
            x + 18,
            y - 35,
            29,
            repaired ? themeColors.green : themeColors.pink,
          );
          if (repaired)
            drawText(
              ctx,
              api,
              '768 = 768 · admitted by the authorized budget',
              960,
              980,
              33,
              themeColors.green,
              'center',
            );
          else if (repairing)
            drawText(
              ctx,
              api,
              'Authorized admission pending',
              960,
              980,
              33,
              themeColors.muted,
              'center',
            );
          else if (cueComplete('fresh-fail'))
            drawText(
              ctx,
              api,
              '768 > 700 · defer or authorize more work',
              960,
              980,
              33,
              themeColors.pink,
              'center',
            );
        }
      }
      if (currentBeat === 0)
        footer(ctx, api, 'The output still needs generation; a cache hit is input-state reuse.');
    }
  });
}
export default {
  id: 'fresh-budget',
  draw: drawFreshBudget,
  cues: [
    'fresh-input',
    'fresh-predict',
    'fresh-sixty-four',
    'fresh-edit',
    'fresh-reuse',
    'fresh-work',
    'fresh-cap',
    'fresh-fail',
    'fresh-repair',
    'fresh-repair-complete',
  ],
};
