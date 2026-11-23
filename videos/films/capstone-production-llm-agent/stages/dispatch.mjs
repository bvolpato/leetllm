import { dispatch, sampleModel } from '../model.mjs';
import {
  card,
  drawAgentUpgradeFooter,
  drawAgentUpgradeLines,
  drawAgentUpgradePaper,
  drawAgentUpgradeSubtitle,
  text,
} from '../defaults.mjs';
export function drawDispatch(ctx, scene, state, api) {
  if (drawAgentUpgrade(ctx, scene, state, api)) return;
  const { C: themeColors, components: components, teaching: teaching } = api,
    modelState = sampleModel('dispatch', state);
  {
    const tests = [
      ['Restore access', dispatch('Restore access')],
      [
        'Read A301',
        dispatch('Account lookup', {
          account: 'A301',
        }),
      ],
      ['Draft too early', dispatch('Cited draft')],
    ];
    const b = modelState.b,
      selected = b === 0 ? 1 : Math.min(2, Math.floor(3 * modelState.p)),
      failure = [0, 2, 3][selected],
      progress = b === 0 ? modelState.p : Math.min(1, 3 * modelState.p - selected),
      arrived = progress > 0.35;
    api.focus.target('dispatch-readout', () =>
      text(ctx, api, 'Proposal: ' + tests[selected][0], 960, 285, 39, themeColors.yellow, 'center'),
    );
    const gates = ['Tool allowlist', 'Argument schema', 'Admitted account', 'Current state'];
    gates.forEach((label, i) => {
      const reached = i <= failure && arrived,
        color = !reached ? themeColors.muted : i === failure ? themeColors.pink : themeColors.green;
      api.focus.target('dispatch-readout-2', () =>
        card(ctx, api, label, 180 + i * 420, 415, 340, color, 100),
      );
      if (i < 3)
        api.arrow(
          ctx,
          535 + i * 420,
          465,
          580 + i * 420,
          465,
          i < failure && arrived ? themeColors.green : themeColors.muted,
          3,
        );
      api.focus.target('dispatch-readout-3', () =>
        text(
          ctx,
          api,
          !reached ? 'Waiting' : i === failure ? 'BLOCK' : 'PASS',
          350 + i * 420,
          590,
          28,
          color,
          'center',
        ),
      );
    });
    if (progress > 0 && progress < 0.35) {
      const x = 180 + (420 * failure * progress) / 0.35;
      api.focus.target('dispatch-readout-4', () =>
        components.card({
          label: tests[selected][0],
          x,
          y: 330,
          width: 340,
          height: 60,
          fontSize: 25,
          fill: themeColors.bg,
          stroke: themeColors.yellow,
          textColor: themeColors.yellow,
          padding: 8,
        }),
      );
    }
    api.focus.target('dispatch-field-grid', () =>
      teaching.grid({
        x: 220,
        y: 670,
        width: 1480,
        height: 240,
        rows: 4,
        columns: 3,
        cellFocusTarget: (row, column) =>
          row > 0 && column === 2 ? 'dispatch-effects' : undefined,
        labels: [
          ['Proposed action', 'Enforcement', 'Observed effect'],
          ...tests.map(([name, result], i) => {
            const recorded = (b > 0 && i < selected) || (i === selected && arrived);
            return [name, recorded ? result : 'Recorded proposal', recorded ? '0 effects' : '—'];
          }),
        ],
        fontSize: 27,
        padding: 10,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
      }),
    );
    api.focus.target('dispatch-attempted-action-executed-action-observed-effect', () =>
      text(
        ctx,
        api,
        'Attempted action ≠ executed action ≠ observed effect',
        960,
        990,
        30,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
function drawAgentUpgrade(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  if (!(currentBeat >= 2)) return false;
  const { C: themeColors } = api;
  return api.focus.target('dispatch-mechanism', () => {
    drawAgentUpgradeSubtitle(ctx, api);
    {
      drawAgentUpgradePaper(
        ctx,
        api,
        200,
        320,
        1500,
        465,
        'Exact action envelope /host validation',
        themeColors.blue,
      );
      drawAgentUpgradeLines(
        ctx,
        api,
        [
          '{ action, args } only',
          'Allowlisted name +exact argument keys',
          'Strict types /nonblank strings /length ≤1600',
          'Extra approved=True →invalid decision',
        ],
        265,
        465,
        34,
        themeColors.ink,
        90,
      );
      drawAgentUpgradeFooter(
        ctx,
        api,
        'After syntax: bind the actual ticket resource and current state ·deep copy is not a sandbox',
      );
    }
    return true;
  });
}
export default {
  id: 'dispatch',
  draw: drawDispatch,
  cues: ['dispatch-gates', 'wrong-account', 'separate-attempt', 'zero-effects', 'dispatch-core-3'],
};
