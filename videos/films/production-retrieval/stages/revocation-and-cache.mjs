import { prEvent } from '../construction.mjs';
import { arrow, card, centeredText, extensionFooter, sourcePage } from '../defaults.mjs';
export function drawRevocationAndCache(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => prEvent(state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('revocation-and-cache-mechanism', () => {
    const grant = currentBeat > 0 ? 1 : ev('grant', 0),
      rollback = currentBeat > 1 ? 1 : currentBeat === 1 ? ev('rollback', 1) : 0,
      drop = currentBeat > 0 || done('tombstone', 0);
    if (currentBeat < 2) {
      sourcePage(ctx, api, 120, 355, 760, 410, {
        title: 'E1 · retained bundle ' + (rollback >= 0.5 ? 'B' : 'C'),
      });
      card(
        ctx,
        api,
        grant > 0 ? 'Current grant revision 10 · revoked' : 'Current grant revision 9 · valid',
        1100,
        355,
        650,
        110,
        grant > 0 ? themeColors.pink : themeColors.green,
        29,
      );
      if (grant > 0) {
        api.line(ctx, 1060, 370, 1060, 500, themeColors.pink, 7);
        arrow(ctx, api, 910, 430, 1030, 430, themeColors.cyan);
      }
      card(
        ctx,
        api,
        currentBeat === 1
          ? 'Independent current tombstone: E1 deleted'
          : 'Old snapshot still retains E1 bytes',
        1100,
        565,
        650,
        115,
        currentBeat === 1 ? themeColors.pink : themeColors.muted,
        29,
      );
      if (currentBeat === 1) {
        centeredText(ctx, api, 'Serving pointer', 470, 820, 27, themeColors.muted);
        const x = 120 + 610 * rollback;
        card(
          ctx,
          api,
          rollback === 1 ? 'B · restored retrieval config' : 'C → B rollback in progress',
          x,
          865,
          430,
          85,
          themeColors.blue,
          26,
        );
        if (rollback === 1)
          centeredText(
            ctx,
            api,
            'Tombstone remains · derived cache invalidated',
            1380,
            850,
            29,
            themeColors.pink,
          );
      } else
        card(
          ctx,
          api,
          drop ? 'Draft withheld · abstain' : 'Buffered qualifying draft · depends on E1',
          700,
          840,
          1050,
          110,
          drop ? themeColors.pink : themeColors.green,
          29,
        );
    } else {
      centeredText(
        ctx,
        api,
        'Buffered answer · every strip used E1',
        960,
        285,
        34,
        themeColors.yellow,
      );
      card(ctx, api, 'Current E1 permission revoked', 150, 355, 1620, 100, themeColors.pink, 33);
      const amount = ev('discard', 2),
        rows = [
          'Cited claim · “May rotate” [E1]',
          'Uncited explanation derived from E1',
          'Conclusion derived from the same context',
        ];
      rows.forEach((value, i) => {
        const x = 150 + amount * 160;
        if (amount < 1)
          card(ctx, api, value, x, 540 + i * 135, 1620 - 620 * amount, 100, themeColors.yellow, 28);
      });
      if (amount === 1)
        card(
          ctx,
          api,
          'Entire dependent draft removed · abstain',
          300,
          665,
          1320,
          150,
          themeColors.pink,
          36,
        );
      centeredText(
        ctx,
        api,
        'Previously disclosed model/caller text cannot be recalled',
        960,
        1000,
        29,
        themeColors.muted,
      );
    }
    extensionFooter(
      ctx,
      api,
      'Current authority is independent of snapshot bytes; no concurrent identity service is simulated',
    );
  });
}
export default {
  id: 'revocation-and-cache',
  draw: drawRevocationAndCache,
  cues: ['pr-grant', 'pr-tombstone', 'pr-rollback', 'pr-discard'],
};
