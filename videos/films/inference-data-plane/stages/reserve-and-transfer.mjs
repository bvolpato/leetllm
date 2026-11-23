import '../arithmetic.mjs';
import { rectangle, text } from '../defaults.mjs';
export function drawReserveAndTransfer(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const q = (i, a = 0.12, z = 0.8) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    text(
      ctx,
      api,
      'R4219 · lease12 · generation4 · destination64 slots',
      960,
      285,
      35,
      themeColors.yellow,
      'center',
    );
    const granted = api.focus.progress('reserve-and-transfer-b1', q(0)) >= 1,
      reserved = granted ? 48 : 0,
      written = Math.min(reserved, currentBeat >= 1 ? Math.floor(q(1) * 48) : 0),
      secondDecided =
        api.focus.progress('reservation-second-verdict', currentBeat > 0 ? 1 : q(0, 0.7, 0.95)) >=
        1;
    text(ctx, api, 'owner R4219 / g4', 470, 370, 29, themeColors.blue, 'center');
    for (let i = 0; i < 64; i++) {
      const xx = 210 + (i % 8) * 65,
        yy = 395 + Math.floor(i / 8) * 65,
        color =
          i < written ? themeColors.green : i < reserved ? themeColors.blue : themeColors.muted;
      rectangle(
        ctx,
        api,
        xx,
        yy,
        57,
        57,
        color,
        i < written ? themeColors.green : themeColors.panel,
      );
      text(
        ctx,
        api,
        String(i + 1),
        xx + 28.5,
        yy + 40,
        28,
        i < written ? themeColors.bg : color,
        'center',
      );
    }
    text(
      ctx,
      api,
      granted ? '48 reserved ·16 remain' : 'Target:48 blocks · reservation pending',
      1410,
      440,
      granted ? 43 : 31,
      granted ? themeColors.green : themeColors.yellow,
      'center',
    );
    rectangle(ctx, api, 1070, 555, 670, 145, themeColors.pink);
    text(ctx, api, 'R4220 needs24 slots', 1405, 610, 36, themeColors.pink, 'center');
    text(
      ctx,
      api,
      secondDecided ? 'WAIT:24 exceeds16' : 'second-request decision pending',
      1405,
      670,
      secondDecided ? 36 : 30,
      secondDecided ? themeColors.pink : themeColors.yellow,
      'center',
    );
    text(
      ctx,
      api,
      'Blue: atomic reservation · green: written values',
      1350,
      820,
      30,
      themeColors.green,
      'center',
    );
    text(
      ctx,
      api,
      'Reservation capacity and shared transfer bandwidth are separate limits',
      960,
      1040,
      31,
      themeColors.muted,
      'center',
    );
  };
  if (api.focus)
    api.focus.target('reserve-and-transfer-construction', () => {
      body();
    });
  else body();
}
export default {
  id: 'reserve-and-transfer',
  draw: drawReserveAndTransfer,
  cues: [
    'reserve-and-transfer-b1',
    'reservation-second-verdict',
    'reserve-and-transfer-b2',
    'reserve-and-transfer-b3',
  ],
};
