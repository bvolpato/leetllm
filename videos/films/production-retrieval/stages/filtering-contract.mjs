import { prEvent } from '../construction.mjs';
import { filteredRecallFixture } from '../model.mjs';
import { arrow, card, centeredText, extensionFooter, panel } from '../defaults.mjs';
export function drawFilteringContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => prEvent(state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('filtering-contract-mechanism', () => {
    const f = filteredRecallFixture();
    if (currentBeat === 0) {
      centeredText(ctx, api, 'Inside the trusted engine', 650, 290, 34, themeColors.blue);
      const nodes = [
        {
          x: 250,
          y: 580,
          id: 'entry · denied',
          ok: false,
        },
        {
          x: 620,
          y: 400,
          id: 'bridge · denied',
          ok: false,
        },
        {
          x: 940,
          y: 660,
          id: 'P1 · allowed',
          ok: true,
        },
      ];
      nodes.forEach((n) => {
        api.circle(ctx, n.x, n.y, 45, n.ok ? themeColors.green : themeColors.muted);
        centeredText(
          ctx,
          api,
          n.id,
          n.x,
          n.y + 95,
          26,
          n.ok ? themeColors.green : themeColors.muted,
        );
      });
      if (ev('graph', 0) > 0) {
        arrow(ctx, api, 300, 555, 575, 425, themeColors.yellow);
        arrow(ctx, api, 655, 375, 900, 625, themeColors.yellow);
      }
      panel(ctx, api, 1200, 350, 580, 440, themeColors.green);
      centeredText(ctx, api, 'Returned payload boundary', 1490, 420, 29, themeColors.green);
      if (done('graph', 0)) card(ctx, api, 'P1 text only', 1290, 545, 400, 110, themeColors.green);
    } else {
      centeredText(
        ctx,
        api,
        currentBeat === 1 ? 'Global top 3 → filter' : 'Permitted payloads → external reranker',
        960,
        285,
        35,
        themeColors.yellow,
      );
      f.records.forEach((r, i) => {
        const y = 375 + i * 110;
        card(
          ctx,
          api,
          r.id + ' · distance ' + r.distance,
          140,
          y,
          450,
          80,
          r.allowed ? themeColors.cyan : themeColors.pink,
          28,
        );
        const visible = currentBeat > 1 || ev('globalcut', 1) > i / 5;
        if (visible && i < 3)
          card(
            ctx,
            api,
            r.allowed ? r.id : 'restricted → removed',
            780,
            y,
            470,
            80,
            r.allowed ? themeColors.green : themeColors.pink,
            27,
          );
        if (currentBeat === 1 && done('allowedcut', 1) && r.allowed)
          card(
            ctx,
            api,
            'Allowed top 3 · ' + r.id,
            1400,
            375 + (i - 2) * 140,
            390,
            95,
            themeColors.green,
            26,
          );
      });
      if (currentBeat === 2) {
        panel(ctx, api, 1370, 375, 440, 510, themeColors.pink);
        centeredText(ctx, api, 'External boundary', 1590, 440, 28, themeColors.pink);
        if (done('disclosure', 2))
          centeredText(
            ctx,
            api,
            'Late filtering cannot recall disclosed text',
            960,
            985,
            31,
            themeColors.pink,
          );
      }
    }
    extensionFooter(
      ctx,
      api,
      'Supplied distance-order toy; safe internal traversal does not authorize external disclosure',
    );
  });
}
export default {
  id: 'filtering-contract',
  draw: drawFilteringContract,
  cues: ['pr-graph', 'pr-globalcut', 'pr-allowedcut', 'pr-disclosure'],
};
