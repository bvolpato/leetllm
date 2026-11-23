import { bounded } from '../arithmetic.mjs';
import { GRADIENT_CONTRIBUTIONS, SHARDS } from '../fixtures.mjs';
import { parameterSyncPosition, reduceScatter } from '../model.mjs';
import { card, drawStateLedger, text } from '../defaults.mjs';
export function drawZero2(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const colors = {
    weights: themeColors.blue,
    gradients: themeColors.pink,
    optimizer: themeColors.yellow,
  };
  {
    api.focus.target('state-ledger', () =>
      drawStateLedger(ctx, api, currentBeat, progress, colors, 2, true, true),
    );
    const totals = [8, 5, 3.5, 2];
    const equation = String.raw`2+2/4+4/4=3.5`;
    {
      text(
        ctx,
        api,
        'W = weights · G = gradients · O = optimizer',
        560,
        1015,
        24,
        themeColors.muted,
        'center',
      );
      if (currentBeat < 2) {
        text(
          ctx,
          api,
          'The same shard IDs keep their owners',
          1430,
          410,
          30,
          themeColors.yellow,
          'center',
        );
        SHARDS.forEach((id, i) =>
          card(
            ctx,
            api,
            `Target: rank ${i} → G${id} + O${id}`,
            1120,
            490 + i * 110,
            620,
            themeColors.pink,
          ),
        );
      } else {
        const sums = reduceScatter(),
          cp = (id) => {
            const cue = state.cues?.[id];
            return cue
              ? cue.phase === 'before'
                ? 0
                : cue.phase === 'after'
                  ? 1
                  : bounded(cue.progress)
              : 0;
          },
          sumProgress = cp('zero2-b3-1'),
          ownerProgress = cp('zero2-b3-2'),
          syncProgress = cp('zero2-parameter-sync'),
          syncStarted =
            state.cues?.['zero2-parameter-sync'] &&
            state.cues['zero2-parameter-sync'].phase !== 'before';
        if (!syncStarted) {
          const reduced = sumProgress > 0,
            columns = Math.min(4, Math.floor(sumProgress * 5)),
            owned = ownerProgress > 0.9;
          text(
            ctx,
            api,
            'Same contributions · two output contracts',
            1450,
            365,
            29,
            themeColors.ink,
            'center',
          );
          GRADIENT_CONTRIBUTIONS.forEach((row, rank) => {
            text(ctx, api, 'R' + rank, 1080, 460 + rank * 65, 24, themeColors.muted);
            row.forEach((v, column) =>
              api.focus.target('gradient-contributions', () =>
                components.card({
                  label: String(v),
                  x: 1150 + column * 155,
                  y: 418 + rank * 65,
                  width: 125,
                  height: 52,
                  fontSize: 24,
                  fill: themeColors.panel,
                  stroke: column < columns ? themeColors.yellow : themeColors.pink,
                  textColor: themeColors.ink,
                }),
              ),
            );
          });
          SHARDS.forEach((id, i) =>
            text(ctx, api, 'G' + id, 1212 + i * 155, 405, 22, themeColors.pink, 'center'),
          );
          text(
            ctx,
            api,
            owned
              ? 'Reduce-scatter · only the owned sum'
              : reduced
                ? 'Sum by coordinate before scattering'
                : 'All-reduce has a full output on every rank',
            1450,
            745,
            26,
            owned ? themeColors.green : themeColors.yellow,
            'center',
          );
          for (let rank = 0; rank < 4; rank++) {
            text(ctx, api, 'R' + rank, 1100, 810 + rank * 44, 23, themeColors.muted);
            api.focus.target('owned-sums', () =>
              text(
                ctx,
                api,
                owned
                  ? 'G' + SHARDS[rank] + ' = ' + sums[rank]
                  : reduced
                    ? SHARDS.map((id, i) => (i < columns ? String(sums[i]) : '…')).join('   ')
                    : '[' + sums.join(', ') + ']',
                1200,
                810 + rank * 44,
                25,
                owned ? themeColors.green : themeColors.yellow,
              ),
            );
          }
        } else {
          text(
            ctx,
            api,
            'Local partition updates → parameter all-gather',
            1450,
            365,
            28,
            themeColors.ink,
            'center',
          );
          SHARDS.forEach((id, i) => {
            text(ctx, api, id + '′', 1210 + i * 155, 420, 28, themeColors.blue, 'center');
            api.circle(ctx, 1210 + i * 155, 465, 14, themeColors.blue);
          });
          for (let rank = 0; rank < 4; rank++) {
            const q = bounded(syncProgress * 4 - rank),
              y = 700 + rank * 65;
            text(ctx, api, 'R' + rank, 1080, y + 10, 25, themeColors.muted);
            if (q > 0)
              api.focus.target('parameter-sync', () =>
                SHARDS.forEach((id, i) => {
                  const pos = parameterSyncPosition(rank, i, syncProgress);
                  api.circle(
                    ctx,
                    pos.x,
                    pos.y,
                    24,
                    [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.green][i],
                  );
                  text(ctx, api, id + '′', pos.x, pos.y + 8, 22, themeColors.bg, 'center');
                }),
              );
          }
          api.focus.target('parameter-sync', () =>
            text(
              ctx,
              api,
              syncProgress > 0.98
                ? 'All ranks again hold complete updated compute weights'
                : 'Updated owners share their slices with every rank',
              1450,
              1010,
              25,
              themeColors.yellow,
              'center',
            ),
          );
        }
      }
    }
    text(
      ctx,
      api,
      `Stage ${2}: ${'gradient + optimizer'} shards`,
      960,
      295,
      32,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'zero2',
  draw: drawZero2,
  cues: ['zero2-b1-1', 'zero2-b2-1', 'zero2-b3-1', 'zero2-b3-2', 'zero2-parameter-sync'],
};
