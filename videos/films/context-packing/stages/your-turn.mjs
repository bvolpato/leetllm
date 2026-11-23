import { clamp } from '../arithmetic.mjs';
import { longContextModel } from '../construction.mjs';
import { contextText, footer, modelTarget } from '../defaults.mjs';
export function drawYourTurn(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = longContextModel('your-turn', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    contextText(
      ctx,
      api,
      currentBeat === 0 || (currentBeat === 1 && progress < 1)
        ? 'Predict whether another 9-unit exchange fits'
        : 'Reject the overflow; inspect the note',
      960,
      270,
      35,
      themeColors.cyan,
    );
    const allocations = [
      ['instructions', 6, themeColors.blue],
      ['question', 2, themeColors.cyan],
      ['D1 note', 6, themeColors.yellow],
      ['recent', 8, themeColors.green],
      ['answer', 12, themeColors.pink],
    ];
    let x = 190;
    allocations.forEach(([label, units, color]) => {
      const paint = () => {
        api.rect(ctx, x, 465, units * 36 - 5, 120, themeColors.panel, color, 3);
        contextText(ctx, api, label, x + (units * 36 - 5) / 2, 650, 27, color);
        contextText(ctx, api, String(units), x + (units * 36 - 5) / 2, 540, 40, color);
      };
      if (label === 'D1 note') modelTarget(ctx, api, 'your-turn', paint);
      else paint();
      x += units * 36;
    });
    api.line(ctx, 190 + 40 * 36, 425, 190 + 40 * 36, 705, themeColors.red, 4);
    contextText(ctx, api, '40-unit limit', 1630, 770, 30, themeColors.red);
    if (currentBeat === 1 && progress >= 1) {
      const resultCue = state.cues?.['your-turn-1'],
        arrival =
          resultCue && Number.isFinite(state.t) ? clamp((state.t - resultCue.end) / 0.7) : 1,
        start = 190 + 34 * 36,
        shift = (1 - arrival) * 210;
      api.rect(ctx, start, 465 - shift, 9 * 36 - 5, 120, themeColors.panel, themeColors.red, 3);
      contextText(ctx, api, '9', start + 160, 540 - shift, 40, themeColors.red);
    }
    if (currentBeat === 2) {
      api.rect(ctx, 530, 320, 420, 100, themeColors.panel, themeColors.yellow, 2);
      contextText(ctx, api, 'D1 · original source span', 740, 382, 29, themeColors.yellow);
      contextText(ctx, api, 'cause: inspect source', 1180, 382, 30, themeColors.yellow);
    }
    contextText(
      ctx,
      api,
      currentBeat === 0 || (currentBeat === 1 && progress < 1)
        ? '34 used · 6 remain'
        : currentBeat === 1
          ? '43 would exceed 40'
          : 'D1 note lacks cause → reopen the original source',
      960,
      865,
      44,
      currentBeat === 0 ? themeColors.green : themeColors.yellow,
    );
    footer(
      ctx,
      api,
      'Fresh supplied budget · complete exchanges stay atomic · recount verified source material',
    );
  }
}
export default {
  id: 'your-turn',
  draw: drawYourTurn,
  cues: ['your-turn-0', 'your-turn-1', 'your-turn-2'],
};
