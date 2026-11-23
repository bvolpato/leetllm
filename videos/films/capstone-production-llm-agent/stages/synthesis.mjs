import { composedRepairFixture } from '../model.mjs';
import {
  drawAgentUpgradeFooter,
  drawAgentUpgradeLedger,
  drawAgentUpgradeLines,
  drawAgentUpgradePaper,
  drawAgentUpgradeProgress,
  drawAgentUpgradeSubtitle,
  drawAgentUpgradeText,
} from '../defaults.mjs';
export function drawSynthesis(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  const { C: themeColors, components: components } = api;
  const complete = (id) => state.cues?.[id]?.phase === 'after';
  api.focus.target('synthesis-mechanism', () => {
    drawAgentUpgradeSubtitle(ctx, api);
    {
      const f = composedRepairFixture(),
        expiryFixed =
          currentBeat > 1 ||
          (currentBeat === 1 && drawAgentUpgradeProgress(ctx, api, 'synthesis-expiry-repair') > 0),
        verificationFixed =
          currentBeat > 1 &&
          drawAgentUpgradeProgress(ctx, api, 'synthesis-verification-repair') > 0,
        committed = currentBeat > 1 && complete('synthesis-commit-result'),
        replayed = currentBeat > 1 && complete('synthesis-replay-result');
      const earned = [
          complete('synthesis-packet-result'),
          complete('synthesis-stale-result'),
          committed,
          replayed,
        ],
        stage = replayed ? 3 : committed ? 2 : expiryFixed ? 1 : 0,
        step = f.steps[stage],
        resultVisible =
          currentBeat === 1 ? (expiryFixed ? earned[1] : earned[0]) : currentBeat > 1 && committed,
        replayPending =
          currentBeat > 1 &&
          drawAgentUpgradeProgress(ctx, api, 'synthesis-replay-result') > 0 &&
          !replayed;
      drawAgentUpgradePaper(
        ctx,
        api,
        160,
        320,
        750,
        410,
        'Retained packet /same operation',
        themeColors.yellow,
      );
      drawAgentUpgradeLines(
        ctx,
        api,
        [
          'Time2001 /reviewed expiry2300',
          'Stored expiry:' + (expiryFixed ? 2300 : 2400),
          'Current verification:' + (verificationFixed ? 'True' : 'False'),
          'Operation ' + f.operation.slice(0, 18),
        ],
        205,
        460,
        29,
        themeColors.yellow,
        70,
      );
      drawAgentUpgradeLedger(ctx, api, 1100, 320, committed ? 1 : 0);
      drawAgentUpgradeText(
        ctx,
        api,
        replayPending
          ? 'Replay result pending'
          : resultVisible
            ? step.result
            : currentBeat > 1
              ? 'Revalidate before committing'
              : currentBeat === 1
                ? 'Current execution result pending'
                : 'Predict: which boundary fails first?',
        960,
        790,
        40,
        resultVisible && !replayPending
          ? committed
            ? themeColors.green
            : themeColors.pink
          : themeColors.yellow,
        'center',
      );
      if (currentBeat > 0)
        drawAgentUpgradeText(
          ctx,
          api,
          expiryFixed
            ? 'Original expiry restored /review binding matches'
            : 'Edited expiry /original review retained',
          960,
          290,
          25,
          themeColors.blue,
          'center',
        );
      drawAgentUpgradeText(
        ctx,
        api,
        'Attempt history · one retained operation · attempts are separate from effect rows',
        960,
        840,
        26,
        themeColors.muted,
        'center',
      );
      const names = ['packet changed', 'stale preconditions', 'committed', 'duplicate ignored'];
      earned.forEach((visible, i) => {
        const label = visible
          ? i +
            1 +
            ' · ' +
            names[i] +
            '\n' +
            f.steps[i].effects +
            ' effect' +
            (f.steps[i].effects === 1 ? '' : 's')
          : i + 1 + ' · attempt result pending';
        components.card({
          label,
          x: 140 + i * 440,
          y: 870,
          width: 400,
          height: 88,
          fontSize: 24,
          baselineOffset: 24 * (0.34 - 0.7 * (label.split('\n').length - 1)),
          padding: 10,
          fill: themeColors.panel,
          stroke: visible ? (i < 2 ? themeColors.pink : themeColors.green) : themeColors.muted,
          textColor: visible ? (i < 2 ? themeColors.pink : themeColors.green) : themeColors.muted,
        });
      });
      drawAgentUpgradeFooter(
        ctx,
        api,
        'Repair one input at a time; retain prior attempts alongside the single committed effect',
      );
    }
  });
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: [
    'synthesis-b1',
    'synthesis-b2',
    'synthesis-packet-result',
    'synthesis-expiry-repair',
    'synthesis-stale-result',
    'synthesis-b3',
    'synthesis-verification-repair',
    'synthesis-commit-result',
    'synthesis-replay-result',
  ],
};
