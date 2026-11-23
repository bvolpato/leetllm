import { bounded } from '../arithmetic.mjs';
import { SHARDS } from '../fixtures.mjs';
import { stageSnapshot } from '../model.mjs';
import { drawLedgerEquation, drawStateLedger, text } from '../defaults.mjs';
export function drawZero3(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api;
  const currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0, 0, 1);
  const colors = {
    weights: themeColors.blue,
    gradients: themeColors.pink,
    optimizer: themeColors.yellow,
  };
  {
    api.focus.target('state-ledger', () =>
      drawStateLedger(ctx, api, currentBeat, progress2, colors, 3, true, false),
    );
    const totals = [8, 5, 3.5, 2];
    const equation = String.raw`(2+2+4)/4=2`;
    if (stageSnapshot(3, currentBeat, progress2).q === 1)
      api.focus.target('rank-total', () =>
        drawLedgerEquation(
          ctx,
          api,
          String.raw`${equation}\quad\text{units per rank}`,
          960,
          1015,
          37,
          themeColors.green,
        ),
      );
    {
      const seconds = stageSnapshot(3, currentBeat, progress2).seconds;
      const progress = (id, fallback) => {
        const cue = state.cues?.[id];
        return cue
          ? cue.phase === 'before'
            ? 0
            : cue.phase === 'after'
              ? 1
              : bounded(cue.progress)
          : fallback;
      };
      const gather =
        currentBeat === 1 ? progress('zero3-b2-1', bounded((seconds - 3.375) / 2.55)) : 0;
      const release =
        currentBeat > 1
          ? 1
          : currentBeat === 1
            ? progress('zero3-b2-2', bounded((seconds - 8.1) / 0.85))
            : 0;
      const released = release === 1,
        count = Math.min(4, Math.floor(gather * 5));
      ['A', 'B', 'C', 'D'].forEach((id, i) =>
        api.focus.target('owned-parameter-shards', () =>
          components.card({
            label: `Rank ${i} owns ${id}`,
            x: 220 + i * 400,
            y: 410,
            width: 320,
            height: 65,
            fontSize: 25,
            fill: themeColors.panel,
            stroke: themeColors.blue,
            textColor: themeColors.blue,
          }),
        ),
      );
      if (currentBeat === 1 && !released) {
        const move = gather * (1 - release);
        SHARDS.forEach((id, i) => {
          const fromX = 280 + i * 400,
            toX = 630 + i * 170,
            fromY = 490,
            toY = 535;
          api.focus.target('gathered-shards', () => {
            api.rect(
              ctx,
              fromX + (toX - fromX) * move,
              fromY + (toY - fromY) * move,
              145,
              70,
              [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.green][i],
              undefined,
              5,
            );
            text(
              ctx,
              api,
              id,
              fromX + (toX - fromX) * move + 72.5,
              fromY + (toY - fromY) * move + 47,
              32,
              themeColors.bg,
              'center',
            );
          });
        });
        api.focus.target('gathered-shards', () =>
          text(
            ctx,
            api,
            release > 0
              ? 'Release temporary compute copy · persistent owner tiles remain'
              : gather > 0.98
                ? 'Wrapped unit ready for compute'
                : 'All-gather copies the same identified parameter shards',
            960,
            655,
            28,
            themeColors.yellow,
            'center',
          ),
        );
      } else if (released)
        api.focus.target('gathered-shards', () =>
          text(
            ctx,
            api,
            'Gathered copy released · local shards retained',
            960,
            560,
            29,
            themeColors.yellow,
            'center',
          ),
        );
      else
        text(
          ctx,
          api,
          currentBeat === 2
            ? 'Gathered copy released · local shards retained'
            : 'Four distinct parameter shards',
          960,
          560,
          29,
          themeColors.yellow,
          'center',
        );
    }
    text(ctx, api, `Stage ${3}: ${'all state'} shards`, 960, 295, 32, themeColors.ink, 'center');
  }
}
export default {
  id: 'zero3',
  draw: drawZero3,
  cues: ['zero3-b1-1', 'zero3-b2-1', 'zero3-b2-2', 'zero3-b3-1'],
};
