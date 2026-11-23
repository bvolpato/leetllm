import { SCENES } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawContract(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('contract', state);
  {
    const labels = ['Request ID', 'Authenticate', 'Authorize', 'Reserve quota', 'Admit / route'];
    const nodes = labels.map((label, i) => ({
      id: `step-${i}`,
      label: `${i + 1}  ${label}`,
      x: 110 + i * 350,
      y: 390,
      width: 300,
      height: 105,
      color:
        i <= modelState.stage
          ? [
              themeColors.blue,
              themeColors.cyan,
              themeColors.yellow,
              themeColors.green,
              themeColors.pink,
            ][i]
          : themeColors.muted,
      focusTarget: 'contract-boundary-' + i,
    }));
    teaching.flowGraph({
      nodes,
      edges: labels.slice(1).map((_, i) => ({
        from: `step-${i}`,
        to: `step-${i + 1}`,
        progress: i < modelState.stage ? 1 : modelState.q,
        color: themeColors.cyan,
      })),
    });
    const fields = [
      modelState.requestId,
      modelState.stage >= 1 || modelState.step ? 'caller O2' : 'caller pending',
      modelState.stage >= 2 || modelState.step ? 'policy P7' : 'policy pending',
      modelState.stage >= 3 || modelState.step ? 'quota Q8 reserved' : 'quota pending',
      modelState.step ? 'route A · receipt' : 'route pending',
    ];
    api.focus.target('contract-receipt', () =>
      teaching.grid({
        x: 180,
        y: 700,
        width: 1560,
        height: 115,
        rows: 1,
        columns: 5,
        labels: [fields],
        fontSize: 25,
        fill: themeColors.panel,
        stroke: themeColors.yellow,
        textColor: themeColors.ink,
      }),
    );
    text(
      ctx,
      api,
      'The response path and support path share one request identity',
      960,
      900,
      31,
      themeColors.muted,
      'center',
    );
  }
  const order = SCENES.indexOf('contract');
  const overview = [
    ['Gateway · request ID', themeColors.blue],
    [
      order >= 4 ? 'Queue · 250 ms' : 'Admission',
      order >= 4 ? themeColors.yellow : themeColors.muted,
    ],
    [
      order >= 5 ? 'ACL · filter first' : 'Data eligibility',
      order >= 5 ? themeColors.green : themeColors.muted,
    ],
    [
      order >= 2 ? 'Worker · KV budget' : 'Model worker',
      order >= 2 ? themeColors.cyan : themeColors.muted,
    ],
    [
      order >= 1 ? 'Receipt · decision owner' : 'Decision receipt',
      order >= 1 ? themeColors.blue : themeColors.muted,
    ],
  ];
  const nodes = overview.map(([label, color], i) =>
    card(ctx, api, label, 115 + i * 345, 1005, 310, color, 54, 23),
  );
  for (let i = 0; i < 4; i++)
    teaching.transfer({
      source: {
        shape: nodes[i],
        opacity: 1,
      },
      target: {
        shape: nodes[i + 1],
        opacity: 1,
      },
      progress: 1,
      color: themeColors.muted,
    });
}
export default {
  id: 'contract',
  draw: drawContract,
  cues: [
    'contract-request-id',
    'contract-authenticate',
    'contract-authorize',
    'contract-reserve-quota',
    'contract-admission',
    'contract-owned-receipt',
  ],
};
