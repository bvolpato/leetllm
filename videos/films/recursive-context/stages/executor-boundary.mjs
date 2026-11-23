import {
  arrow,
  contractText,
  cueComplete,
  cueProgress,
  footer,
  line,
  rectangle,
  tag,
} from '../defaults.mjs';
export function drawExecutorBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('executor-boundary-mechanism', () => {
    if (currentBeat === 0) {
      rectangle(ctx, api, 200, 340, 1520, 480, themeColors.panel);
      contractText(ctx, api, 'HOST PROCESS', 960, 400, 35, themeColors.pink);
      tag(ctx, api, 'Generated Python + private namespace', 960, 580, themeColors.cyan, 1170);
      if (cueProgress(ctx, api, 'enforced-boundary')) {
        line(ctx, api, 430, 720, 1490, 720, themeColors.yellow, 5);
        contractText(
          ctx,
          api,
          'Filesystem · egress · CPU · memory · credentials',
          960,
          925,
          33,
          themeColors.yellow,
        );
      }
    } else if (currentBeat === 1) {
      const accepted = cueComplete(ctx, api, 'configuration-pass');
      const observed = cueComplete(ctx, api, 'guest-observation');
      contractText(ctx, api, 'Declared policy', 493, 320, 41, themeColors.blue);
      [
        'Container or micro-VM',
        'Egress denied · no guest secrets',
        'Ephemeral storage',
        'Bounded CPU and memory',
      ].forEach((v, i) => tag(ctx, api, v, 493, 446 + i * 91, themeColors.blue, 743));
      if (accepted) contractText(ctx, api, 'Configuration passes', 493, 884, 38, themeColors.green);
      contractText(ctx, api, 'Example guest observation', 1395, 320, 41, themeColors.cyan);
      tag(
        ctx,
        api,
        observed ? 'Network connection succeeded' : 'Observation pending',
        1395,
        539,
        observed ? themeColors.pink : themeColors.muted,
        774,
      );
      if (cueComplete(ctx, api, 'sandbox-proof'))
        contractText(
          ctx,
          api,
          'Repair and verify egress enforcement',
          1395,
          884,
          35,
          themeColors.pink,
        );
    } else {
      tag(ctx, api, 'Guest: no reusable provider key', 480, 420, themeColors.cyan, 690);
      tag(ctx, api, 'Trusted host model proxy', 1440, 420, themeColors.blue, 690);
      if (cueProgress(ctx, api, 'host-proxy'))
        arrow(ctx, api, 870, 420, 1050, 420, themeColors.cyan);
      ['tenant authorization', 'full request/output limits', 'shared spending admission'].forEach(
        (v, i) => tag(ctx, api, v, 1440, 590 + i * 130, themeColors.yellow, 690),
      );
      contractText(
        ctx,
        api,
        'Isolation constrains effects; source checks establish support',
        700,
        940,
        31,
        themeColors.pink,
      );
    }
    if (currentBeat === 1)
      footer(ctx, api, 'Illustrative observation · the configuration fixture launches no sandbox');
  });
}
export default {
  id: 'executor-boundary',
  draw: drawExecutorBoundary,
  cues: [
    'host-exec',
    'enforced-boundary',
    'configuration-pass',
    'guest-observation',
    'sandbox-proof',
    'host-proxy',
  ],
};
