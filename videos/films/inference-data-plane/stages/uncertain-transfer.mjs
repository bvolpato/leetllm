import '../fixtures.mjs';
import { memory, rectangle, text } from '../defaults.mjs';
export function drawUncertainTransfer(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const q = (i, a = 0.12, z = 0.8) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    const fresh = false,
      expected = [1, 2, 3, 4, 5, 6],
      arrived = [1, 2, 3, 4],
      unique = new Set(arrived);
    text(
      ctx,
      api,
      'R4219 / op17 / g4 · expired lease blocks commit',
      960,
      280,
      37,
      themeColors.yellow,
      'center',
    );
    arrived.forEach((v, i) => {
      rectangle(
        ctx,
        api,
        210 + i * 250,
        355,
        200,
        90,
        unique.size === 6 ? themeColors.green : themeColors.blue,
      );
      text(ctx, api, 'segment' + v, 310 + i * 250, 412, 30, themeColors.blue, 'center');
    });
    const reclaimed = q(2) > 0.95,
      late = currentBeat >= 2 && q(2) < 0.85;
    memory(
      ctx,
      api,
      190,
      550,
      12,
      4,
      reclaimed ? 0 : late ? 40 : 32,
      reclaimed ? 'old generation4 ·48 slots released' : 'old generation4 ·48 charged blocks',
      reclaimed ? themeColors.muted : themeColors.pink,
      46,
    );
    memory(
      ctx,
      api,
      1120,
      550,
      12,
      4,
      currentBeat >= 2 ? 48 : 0,
      'retry generation5 · disjoint capacity',
      themeColors.green,
      46,
    );
    if (late) {
      rectangle(ctx, api, 540, 805, 420, 75, themeColors.yellow);
      text(ctx, api, 'late writer → old cell40', 750, 854, 28, themeColors.yellow, 'center');
    }
    text(
      ctx,
      api,
      reclaimed
        ? 'transport + GPU readers quiescent → reclaim old charge'
        : `${unique.size}/6 unique segments → REJECT commit; keep old charge`,
      960,
      930,
      35,
      reclaimed ? themeColors.green : themeColors.pink,
      'center',
    );
    text(
      ctx,
      api,
      'Control generation fences events; actual memory accesses determine reuse',
      960,
      1030,
      31,
      themeColors.muted,
      'center',
    );
  };
  if (api.focus)
    api.focus.target('uncertain-transfer-construction', () => {
      body();
    });
  else body();
}
export default {
  id: 'uncertain-transfer',
  draw: drawUncertainTransfer,
  cues: [
    'uncertain-transfer-b1',
    'uncertain-transfer-b2',
    'uncertain-transfer-b3',
    'uncertain-transfer-b4',
  ],
};
