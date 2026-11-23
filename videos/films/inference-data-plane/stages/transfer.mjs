import { memory, rectangle, text } from '../defaults.mjs';
export function drawTransfer(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const q = (i, a = 0.12, z = 0.8) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    if (currentBeat < 3) {
      text(
        ctx,
        api,
        'R4219 · op18 · generation5 · verified compatible state',
        960,
        280,
        36,
        themeColors.yellow,
        'center',
      );
      memory(ctx, api, 200, 440, 8, 6, 48, 'prefill retains source state', themeColors.blue, 65);
      memory(
        ctx,
        api,
        1170,
        440,
        8,
        6,
        Math.floor(q(0) * 48),
        'decode owns validated state',
        themeColors.green,
        65,
      );
      if (currentBeat >= 1) {
        rectangle(ctx, api, 735, 820, 450, 95, themeColors.green);
        text(ctx, api, 'token #1 → client receipt', 960, 879, 32, themeColors.green, 'center');
      }
      text(
        ctx,
        api,
        'One request owner follows admission, transfer, decode and delivery',
        960,
        1030,
        31,
        themeColors.muted,
        'center',
      );
    } else {
      const fresh = true,
        expected = [1, 2, 3, 4, 5, 6],
        arrived = [1, 2, 2, 3, 4, 6].slice(0, Math.ceil(q(3, 0.04, 0.25) * 6)),
        unique = new Set(arrived);
      text(
        ctx,
        api,
        'Fresh receipt:6 notifications; is coverage complete?',
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
      const reclaimed = false,
        late = false;
      memory(
        ctx,
        api,
        190,
        550,
        12,
        4,
        (i) => unique.has(Math.floor(i / 8) + 1),
        'old generation4 ·48 charged blocks',
        themeColors.pink,
        46,
      );
      if (api.focus.progress('fresh-reuse-reveal', q(3, 0.8, 0.94)) >= 1)
        memory(
          ctx,
          api,
          1120,
          550,
          12,
          4,
          0,
          'retry generation5 · disjoint capacity',
          themeColors.green,
          46,
        );
      {
        const show = api.focus.progress('fresh-coverage-reveal', q(3, 0.4, 0.6)) >= 1;
        api.focus.target('transfer-coverage-consequence', () => {
          if (show)
            text(
              ctx,
              api,
              `${unique.size}/6 unique segments → REJECT commit`,
              960,
              900,
              35,
              themeColors.pink,
              'center',
            );
          else
            text(
              ctx,
              api,
              'Predict: may decode commit from these notifications?',
              960,
              900,
              35,
              themeColors.yellow,
              'center',
            );
        });
        const reuse = api.focus.progress('fresh-reuse-reveal', q(3, 0.8, 0.94)) >= 1;
        api.focus.target('transfer-reuse-consequence', () => {
          text(
            ctx,
            api,
            reuse
              ? 'Active old writer → keep charge; no reuse before quiescence'
              : 'Predict: can active old-writer cells be reused?',
            960,
            966,
            30,
            reuse ? themeColors.pink : themeColors.yellow,
            'center',
          );
        });
      }
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
    }
  };
  if (api.focus)
    api.focus.target('transfer-construction', () => {
      body();
    });
  else body();
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'transfer-b1',
    'transfer-b2',
    'transfer-b3',
    'transfer-b4',
    'fresh-coverage-reveal',
    'fresh-reuse-reveal',
  ],
};
