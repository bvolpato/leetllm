import { box, constructionFooter, focusProgress, table } from '../defaults.mjs';
export function drawHostApproval(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => focusProgress(ctx, api, id) >= 1;
    api.focus.target('sg-host-approval-mechanism', () => {
      const action = done('sg-approval-action') ? 'rollback' : 'retry_tests';
      box(
        ctx,
        api,
        'Model proposal',
        ['RUN-842 / ' + action, 'approved: true'],
        180,
        300,
        1550,
        160,
        themeColors.blue,
      );
      const rows = [
        ['None', done('sg-approval-none') ? 'deny' : '?'],
        ['RUN-999 / retry_tests', done('sg-approval-wrong') ? 'deny' : '?'],
        [
          'RUN-842 / retry_tests',
          done('sg-approval-match')
            ? action === 'retry_tests'
              ? 'continue host checks'
              : 'action outside policy'
            : '?',
        ],
      ];
      table(
        ctx,
        api,
        ['Trusted stored approval', 'Result'],
        rows,
        260,
        590,
        1400,
        105,
        [0.55, 0.45],
      );
      constructionFooter(
        ctx,
        api,
        action === 'rollback'
          ? 'Requested: rollback     Stored approval: retry tests'
          : done('sg-approval-match')
            ? 'At execution, verify the caller, scope and current approval.'
            : 'Match both the run ID and the action.',
      );
    });
  }
}
export default {
  id: 'host-approval',
  draw: drawHostApproval,
  cues: [
    'sg-host-approval-0',
    'sg-approval-none',
    'sg-approval-wrong',
    'sg-host-approval-1',
    'sg-approval-match',
    'sg-host-approval-2',
    'sg-approval-action',
  ],
};
