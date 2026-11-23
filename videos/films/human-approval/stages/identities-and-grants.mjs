import { approvalProgress, contractNote, contractTag, contractText } from '../defaults.mjs';
export function drawIdentitiesAndGrants(ctx, scene, state, api) {
  const { C: themeColors } = api,
    rawBeat = state.beat ?? 0,
    currentBeat = rawBeat,
    resultComplete = (id) => approvalProgress(ctx, api, id) === 1;
  api.focus.target('identities-and-grants-mechanism', () => {
    if (currentBeat < 2) {
      const names = ['Requester', 'Agent', 'Reviewer', 'Executor'],
        details = [
          'subject + tenant + task',
          'proposal + evidence',
          'subject + role + tenant',
          'narrow workload scope',
        ];
      names.forEach((name, i) => {
        const x = 300 + i * 430;
        contractText(
          ctx,
          api,
          name,
          x,
          350,
          35,
          [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.green][i],
        );
        if (
          approvalProgress(
            ctx,
            api,
            ['identity-requester', 'identity-agent', 'identity-reviewer', 'identity-executor'][i],
          )
        ) {
          api.circle(
            ctx,
            x,
            470,
            50,
            [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.green][i],
          );
          contractTag(
            ctx,
            api,
            details[i],
            x,
            620,
            [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.green][i],
            390,
          );
        }
      });
      if (currentBeat === 1) {
        contractText(ctx, api, 'Requester = reviewer?', 960, 800, 40, themeColors.yellow);
        if (resultComplete('identity-self'))
          contractText(
            ctx,
            api,
            'This policy requires a distinct eligible reviewer',
            960,
            925,
            35,
            themeColors.pink,
          );
      }
    }
    if (currentBeat === 2) {
      contractText(ctx, api, 'Emergency note ≠ break-glass grant', 960, 400, 40, themeColors.pink);
      ['narrow role', 'expiry', 'reason + alert', 'later review'].forEach((v, i) =>
        contractTag(ctx, api, v, 300 + i * 430, 580, themeColors.yellow, 380),
      );
      if (resultComplete('identity-deadlines')) {
        contractTag(ctx, api, 'Review expiry: last decision time', 500, 820, themeColors.blue, 760);
        contractTag(
          ctx,
          api,
          'Execution deadline: last dispatch',
          1420,
          820,
          themeColors.cyan,
          760,
        );
      }
    }
    contractNote(
      ctx,
      api,
      'Trusted identity services supply roles and tenant · never proposal text',
    );
  });
  return;
}
export default {
  id: 'identities-and-grants',
  draw: drawIdentitiesAndGrants,
  cues: [
    'identity-requester',
    'identity-agent',
    'identity-reviewer',
    'identity-executor',
    'identity-self',
    'identity-breakglass',
    'identity-deadlines',
  ],
};
