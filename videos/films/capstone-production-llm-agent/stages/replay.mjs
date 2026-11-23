import { operation, reviewed } from '../model.mjs';
import {
  drawAgentUpgradeArrow,
  drawAgentUpgradeFooter,
  drawAgentUpgradeLedger,
  drawAgentUpgradeLines,
  drawAgentUpgradePaper,
  drawAgentUpgradeProgress,
  drawAgentUpgradeSubtitle,
  drawAgentUpgradeText,
} from '../defaults.mjs';
export function drawReplay(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  const { C: themeColors } = api;
  const complete = (id) => state.cues?.[id]?.phase === 'after';
  api.focus.target('replay-mechanism', () => {
    drawAgentUpgradeSubtitle(ctx, api);
    {
      const inserted = drawAgentUpgradeProgress(ctx, api, 'transaction-buffer') > 0,
        rolled = complete('rollback-transaction'),
        retry = drawAgentUpgradeProgress(ctx, api, 'retry-commit'),
        duplicate = complete('duplicate-replay');
      const committed = complete('retry-commit'),
        pending = !committed && ((inserted && !rolled) || retry > 0);
      drawAgentUpgradePaper(
        ctx,
        api,
        160,
        320,
        700,
        390,
        'Approval remains committed',
        themeColors.blue,
      );
      drawAgentUpgradeLines(
        ctx,
        api,
        [
          'Same retained operation',
          operation.slice(0, 20),
          'Review ' + reviewed.slice(0, 18),
          'Valid current preconditions',
        ],
        205,
        460,
        29,
        themeColors.blue,
        65,
      );
      drawAgentUpgradeLedger(ctx, api, 1100, 320, committed ? 1 : 0, pending ? 1 : 0);
      const status = duplicate
        ? 'Duplicate ignored'
        : committed
          ? 'Local effect committed'
          : retry > 0
            ? 'Retry /insert pending'
            : rolled
              ? 'ROLLBACK /zero effects'
              : inserted
                ? 'INSERT /uncommitted'
                : 'BEGIN';
      drawAgentUpgradeText(
        ctx,
        api,
        status,
        960,
        855,
        44,
        committed ? themeColors.green : themeColors.yellow,
        'center',
      );
      if (pending) drawAgentUpgradeArrow(ctx, api, 900, 550, 1065, 550, themeColors.yellow);
      if (committed) drawAgentUpgradeArrow(ctx, api, 900, 550, 1065, 550, themeColors.green);
      drawAgentUpgradeFooter(
        ctx,
        api,
        'Only the local effect row is atomic here; remote outcome needs destination idempotency or reconciliation',
      );
    }
  });
}
export default {
  id: 'replay',
  draw: drawReplay,
  cues: [
    'transaction-buffer',
    'rollback-transaction',
    'retry-commit',
    'duplicate-replay',
    'single-effect',
  ],
};
