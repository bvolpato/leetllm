import {
  drawAgentUpgradeArrow,
  drawAgentUpgradeBox,
  drawAgentUpgradeFooter,
  drawAgentUpgradeLines,
  drawAgentUpgradePaper,
  drawAgentUpgradeSubtitle,
  drawAgentUpgradeText,
} from '../defaults.mjs';
export function drawOperationalContract(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  const { C: themeColors } = api;
  const complete = (id) => state.cues?.[id]?.phase === 'after';
  api.focus.target('operational-contract-mechanism', () => {
    drawAgentUpgradeSubtitle(ctx, api);
    {
      if (currentBeat === 0) {
        const rows = [
          ['Deterministic planner', 'Validated model/retrieval +quality'],
          ['Host ticket/account fixtures', 'Authenticated producer +current grants'],
          ['Stored packet /review /local effect', 'Protected decisions +remote contract'],
        ];
        rows.forEach(([a, z], i) => {
          drawAgentUpgradeBox(ctx, api, a, 180, 350 + i * 190, 700, 100, themeColors.blue);
          drawAgentUpgradeArrow(ctx, api, 920, 400 + i * 190, 1030, 400 + i * 190);
          drawAgentUpgradeBox(ctx, api, z, 1070, 350 + i * 190, 670, 100, themeColors.yellow);
        });
      } else if (currentBeat === 1) {
        drawAgentUpgradePaper(
          ctx,
          api,
          160,
          330,
          720,
          470,
          'Retained pending review',
          themeColors.blue,
        );
        drawAgentUpgradeLines(
          ctx,
          api,
          [
            'Packet outlives HTTP connection',
            'Trusted decision store +usable review',
            'Revocation +separation of duties',
          ],
          200,
          480,
          29,
          themeColors.blue,
          95,
        );
        drawAgentUpgradePaper(
          ctx,
          api,
          1030,
          330,
          720,
          470,
          'LangGraph /distinct implementation',
          themeColors.cyan,
        );
        drawAgentUpgradeLines(
          ctx,
          api,
          [
            'Checkpointer +same thread ID',
            'interrupt waits for external input',
            'Resume restarts interrupted node',
          ],
          1070,
          480,
          29,
          themeColors.cyan,
          95,
        );
      } else {
        drawAgentUpgradeText(
          ctx,
          api,
          'Move COMMIT before the injected exception',
          960,
          330,
          36,
          themeColors.yellow,
          'center',
        );
        const xs = [240, 790, 1340],
          lab = ['INSERT', 'COMMIT', 'Failure +ROLLBACK'];
        lab.forEach((v, i) => {
          drawAgentUpgradeBox(
            ctx,
            api,
            v,
            xs[i],
            470,
            380,
            100,
            i === 1 ? themeColors.green : themeColors.blue,
          );
          if (i < 2) drawAgentUpgradeArrow(ctx, api, xs[i] + 410, 520, xs[i + 1] - 25, 520);
        });
        drawAgentUpgradeText(
          ctx,
          api,
          complete('durable-counterfactual-result')
            ? 'Previously committed effect remains1'
            : 'Counterfactual durable outcome pending',
          960,
          780,
          42,
          complete('durable-counterfactual-result') ? themeColors.green : themeColors.muted,
          'center',
        );
        drawAgentUpgradeText(
          ctx,
          api,
          'Retain necessary data /encryption /redaction /access /retention',
          960,
          930,
          29,
          themeColors.yellow,
          'center',
        );
      }
      drawAgentUpgradeFooter(
        ctx,
        api,
        'CPU lab proofs support their local boundary; production controls require their own implementation and evidence',
      );
    }
  });
}
export default {
  id: 'operational-contract',
  draw: drawOperationalContract,
  cues: [
    'operational-contract-b1',
    'operational-contract-b2',
    'operational-contract-b3',
    'durable-counterfactual-result',
  ],
};
