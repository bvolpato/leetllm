import { arrow, box, code, dag, focusProgress, footer, label, node } from '../defaults.mjs';
export function drawPolicyDefinition(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1,
    cueProgress = (i) => q('policy-definition-' + i);
  api.focus.target('cau-policy-definition-mechanism', () => {
    const version = done('new-action-version') ? 'assistant v2' : 'assistant v1';
    box(
      ctx,
      api,
      'Same ticket T1',
      ['risk recorded before routing', 'outcome: resolved within 24h'],
      180,
      315,
      1560,
      180,
      themeColors.yellow,
    );
    const nodes = [
      node(ctx, api, 'r', 'pre-routing risk', 220, 650, themeColors.yellow, 390),
      node(ctx, api, 'a', version, 760, 650, themeColors.cyan, 390),
      node(ctx, api, 'y', '24-hour outcome', 1300, 650, themeColors.pink, 390),
    ];
    dag(ctx, api, nodes, [
      {
        from: 'r',
        to: 'a',
        progress: cueProgress(0),
        color: themeColors.yellow,
      },
      {
        from: 'a',
        to: 'y',
        progress: cueProgress(0),
        color: themeColors.cyan,
      },
    ]);
    if (currentBeat === 1) {
      code(
        ctx,
        api,
        'model / prompt / tools / control versions',
        960,
        855,
        31,
        themeColors.yellow,
        'center',
      );
      label(
        ctx,
        api,
        done('new-action-version')
          ? 'Changed prompt → new action version'
          : 'Different text can come from one defined stochastic policy',
        960,
        925,
        themeColors.muted,
        29,
      );
    }
    if (currentBeat === 2 && q('queue-effect') > 0) {
      box(
        ctx,
        api,
        'Shared staff availability',
        ['T1 routing changes T2’s queue'],
        260,
        820,
        940,
        140,
        themeColors.yellow,
      );
      arrow(ctx, api, 960, 775, 960, 805, themeColors.yellow);
      box(ctx, api, 'Other unit', ['T2'], 1390, 820, 350, 140, themeColors.pink);
      arrow(ctx, api, 1215, 890, 1370, 890, themeColors.yellow);
    }
    footer(
      ctx,
      api,
      'A defined workflow can be stochastic; an unrecorded version change changes the action.',
    );
  });
}
export default {
  id: 'policy-definition',
  draw: drawPolicyDefinition,
  cues: [
    'cau-policy-definition-0',
    'cau-risk-recorded',
    'cau-policy-definition-1',
    'cau-new-action-version',
    'cau-policy-definition-2',
    'cau-queue-effect',
  ],
};
