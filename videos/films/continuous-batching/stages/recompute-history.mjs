import {
  drawBatchingUpgradeArrow,
  drawBatchingUpgradeBox,
  drawBatchingUpgradeFoot,
  drawBatchingUpgradeTable,
  drawBatchingUpgradeText,
} from '../defaults.mjs';
export function drawRecomputeHistory(ctx, scene, state, api) {
  api.focus.target(scene.id + '-mechanism', () => {
    const currentBeat = state.beat ?? 0,
      progress2 = state.beatP ?? 0;
    const { C: themeColors } = api;
    const cue = (name) => !!state.cues?.[name] && state.cues[name].phase !== 'before',
      progress = (name) => state.cues?.[name]?.progress ?? 0;
    {
      const prompt = [101, 102, 103].map((token, i) => ({
          id: 'B-prompt-' + i,
          token,
        })),
        accepted = [201, 202].map((token, i) => ({
          id: 'B-output-' + i,
          token,
        }));
      if (currentBeat < 2) {
        const phase =
          currentBeat === 0 || !cue('history-drop')
            ? 'resident'
            : cue('history-next')
              ? 'resident'
              : cue('history-replay')
                ? 'replay'
                : 'dropped';
        api.teaching.tokenHistory({
          ...{
            prompt,
            accepted,
            processed: [...prompt, accepted[0]],
            emitted: accepted,
          },
          phase,
          replayProgress: phase === 'replay' ? progress('history-replay') : 0,
          x: 100,
          y: 300,
          width: 1700,
          height: 620,
          fontSize: 30,
          focusPrefix: 'b-history',
        });
        drawBatchingUpgradeText(
          ctx,
          api,
          currentBeat === 1 && cue('history-next')
            ? 'Next ordinary input 202; no resampling or duplicate delivery'
            : 'Accepted output and processed positions are separate ledgers',
          960,
          970,
          30,
          themeColors.yellow,
          'center',
        );
      } else {
        drawBatchingUpgradeText(
          ctx,
          api,
          'Same retained B history · distinct recovery operations',
          960,
          285,
          33,
          themeColors.muted,
          'center',
        );
        drawBatchingUpgradeBox(
          ctx,
          api,
          'GPU cache  ·  101  102  103  201',
          160,
          410,
          700,
          130,
          themeColors.cyan,
          32,
        );
        drawBatchingUpgradeBox(
          ctx,
          api,
          'Host-compatible state',
          1060,
          410,
          700,
          130,
          themeColors.blue,
          32,
        );
        drawBatchingUpgradeArrow(ctx, api, 890, 450, 1030, 450, themeColors.cyan);
        drawBatchingUpgradeArrow(ctx, api, 1030, 510, 890, 510, themeColors.blue);
        drawBatchingUpgradeTable(
          ctx,
          api,
          [
            ['Choice', 'Preserved result', 'Additional work'],
            ['Recompute', 'accepted 201, 202', 'replay 4 positions'],
            ['Swap', 'same compatible state', 'transfer out and back'],
          ],
          180,
          690,
          1560,
          90,
        );
      }
      drawBatchingUpgradeFoot(
        ctx,
        api,
        'Preserve model computation, positions, adapter and sampling state on resume',
      );
    }
    return;
  });
}
export default {
  id: 'recompute-history',
  draw: drawRecomputeHistory,
  cues: [
    'recompute-history-b1',
    'recompute-history-b2',
    'history-drop',
    'history-replay',
    'history-next',
    'recompute-history-b3',
  ],
};
