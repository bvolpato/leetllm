import { operation, packet, packetBinding, reviewed } from '../model.mjs';
import {
  drawAgentUpgradeArrow,
  drawAgentUpgradeBox,
  drawAgentUpgradeFooter,
  drawAgentUpgradeLines,
  drawAgentUpgradePaper,
  drawAgentUpgradeProgress,
  drawAgentUpgradeSubtitle,
  drawAgentUpgradeText,
} from '../defaults.mjs';
export function drawExpiry(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  const { C: themeColors } = api;
  const complete = (id) => state.cues?.[id]?.phase === 'after';
  api.focus.target('expiry-mechanism', () => {
    drawAgentUpgradeSubtitle(ctx, api);
    {
      if (currentBeat < 2) {
        const edit = currentBeat > 0 ? drawAgentUpgradeProgress(ctx, api, 'changed-expiration') : 0,
          stored = {
            ...packet,
            expiresAt: 1300 + Math.round(1000 * edit),
          },
          match = packetBinding(stored) === reviewed,
          checked = currentBeat === 0 ? complete('expired-execution') : complete('digest-mismatch');
        drawAgentUpgradePaper(
          ctx,
          api,
          170,
          320,
          740,
          430,
          'Current stored packet',
          themeColors.yellow,
        );
        drawAgentUpgradeLines(
          ctx,
          api,
          [
            'Operation ' + operation.slice(0, 18),
            'Expiry:' + stored.expiresAt,
            packetBinding(stored).slice(0, 20),
          ],
          215,
          465,
          31,
          themeColors.yellow,
          90,
        );
        drawAgentUpgradePaper(
          ctx,
          api,
          1030,
          320,
          710,
          430,
          'Original retained review',
          themeColors.blue,
        );
        drawAgentUpgradeLines(
          ctx,
          api,
          ['Same operation', 'Reviewed expiry:1300', reviewed.slice(0, 20)],
          1075,
          465,
          31,
          themeColors.blue,
          90,
        );
        const outcome = checked
          ? currentBeat === 0
            ? 'BLOCK: expired'
            : 'BLOCK: packet changed'
          : currentBeat === 0
            ? 'Expiration check pending'
            : 'Predict /compare full packet';
        drawAgentUpgradeText(
          ctx,
          api,
          outcome,
          960,
          855,
          43,
          checked ? themeColors.pink : themeColors.yellow,
          'center',
        );
        drawAgentUpgradeText(
          ctx,
          api,
          'Prior committed effect remains1',
          960,
          945,
          30,
          themeColors.green,
          'center',
        );
      } else {
        const rows = [
            ['Verification revoked', false],
            ['Scope changed', 'admin'],
            ['Ticket question changed', 'Other question'],
          ],
          checked = complete('expiry-stale-result');
        rows.forEach(([name, v], i) => {
          drawAgentUpgradeBox(ctx, api, name, 180, 340 + i * 190, 760, 100, themeColors.yellow);
          drawAgentUpgradeArrow(ctx, api, 975, 390 + i * 190, 1080, 390 + i * 190);
          drawAgentUpgradeBox(
            ctx,
            api,
            checked ? 'BLOCK: stale preconditions' : 'Current eligibility check pending',
            1120,
            340 + i * 190,
            620,
            100,
            checked ? themeColors.pink : themeColors.muted,
          );
        });
      }
      drawAgentUpgradeFooter(
        ctx,
        api,
        'Stored review matching, current eligibility, expiration and existing effect are distinct checks',
      );
    }
  });
}
export default {
  id: 'expiry',
  draw: drawExpiry,
  cues: [
    'expiry-boundary',
    'expired-execution',
    'prior-effect',
    'changed-expiration',
    'reviewed-expiration',
    'compare-packet-digest',
    'digest-mismatch',
    'expiry-core-3',
    'expiry-stale-result',
  ],
};
