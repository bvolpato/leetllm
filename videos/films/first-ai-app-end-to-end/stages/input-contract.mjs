import { request } from '../fixtures.mjs';
import { joinGeometry } from '../construction.mjs';
import { cueProgress } from '../receipt.mjs';
import { card, extensionText, focusTarget, outline } from '../defaults.mjs';
export function drawInputContract(ctx, scene, state, api) {
  if (drawInputContractExtension(ctx, scene, state, api)) return;
  const { C: themeColors } = api;
  const beat = state.beat;
  const join = cueProgress(scene, state, 'lookup-account');
  const extraPending =
    beat === 2 && cueProgress(scene, state, 'strict-app-input-verdict-b3-1') === 0;
  {
    card(ctx, api, 'BROWSER REQUEST', 160, 380, 650, 76, themeColors.blue, 28);
    api.focus.target('validated-app-request', () =>
      card(
        ctx,
        api,
        beat === 2
          ? `account_id: ${request.account_id}\ncredential_age_days: 999\n${request.credential_report}`
          : `account_id: ${request.account_id}\ncredential_report:\n${request.credential_report}`,
        160,
        500,
        650,
        130,
        themeColors.blue,
        23,
      ),
    );
    card(ctx, api, 'SERVER-OWNED RECORD', 1110, 380, 650, 76, themeColors.green, 28);
    api.focus.target('server-owned-facts', () =>
      card(
        ctx,
        api,
        beat === 2
          ? extraPending
            ? 'Waiting for validation'
            : 'Lookup skipped for invalid input'
          : join < 1
            ? 'Find record by account_id'
            : 'account_id: acct_10234\nage: 45 days · stale: true',
        1110,
        500,
        650,
        130,
        themeColors.green,
        25,
      ),
    );
    if (beat === 1) {
      const { actor, segments } = joinGeometry(join);
      for (const [from, to] of segments)
        api.arrow(ctx, from.x, from.y, to.x, to.y, themeColors.cyan, 4);
      api.focus.target('account-join-key', () =>
        card(
          ctx,
          api,
          '10234',
          actor.x,
          actor.y,
          actor.width,
          actor.height,
          themeColors.yellow,
          25,
        ),
      );
    }
    api.focus.target('strict-app-input-verdict', () =>
      card(
        ctx,
        api,
        extraPending
          ? 'Extra client field age = 999 · validation pending'
          : beat !== 2
            ? 'Strict input validation · ACCEPT'
            : 'Extra client field age = 999 · REJECT',
        290,
        825,
        1340,
        95,
        extraPending ? themeColors.yellow : beat !== 2 ? themeColors.green : themeColors.pink,
        29,
      ),
    );
  }
}
function drawInputContractExtension(ctx, scene, state, api) {
  const currentBeat = state.beat;
  const extended = currentBeat === 3;
  if (!extended) return false;
  const { C: themeColors } = api;
  const wrapper = extended ? 'input-contract-contract-extension' : 'input-contract-mechanism';
  focusTarget(ctx, api, wrapper, () => {
    extensionText(
      ctx,
      api,
      'Validate the transformed request',
      960,
      285,
      40,
      themeColors.cyan,
      'center',
    );
    const n = 20 - Math.floor(cueProgress(scene, state, 'input-contract-core-contract') * 20);
    extensionText(ctx, api, 'Report: twenty spaces', 425, 380, 34, themeColors.blue, 'center');
    for (let i = 0; i < n; i++)
      outline(
        ctx,
        api,
        220 + (i % 10) * 40,
        440 + Math.floor(i / 10) * 65,
        29,
        40,
        themeColors.blue,
      );
    api.arrow(ctx, 680, 490, 850, 490, themeColors.yellow, 5);
    extensionText(ctx, api, 'strip', 765, 435, 30, themeColors.yellow, 'center');
    outline(ctx, api, 900, 430, 650, 120, themeColors.pink);
    extensionText(
      ctx,
      api,
      n === 0 ? '"" · length 0' : 'strip surrounding whitespace',
      1225,
      505,
      35,
      n === 0 ? themeColors.pink : themeColors.muted,
      'center',
    );
    extensionText(
      ctx,
      api,
      '10 ≤ report characters ≤ 500',
      960,
      675,
      40,
      themeColors.yellow,
      'center',
    );
    extensionText(
      ctx,
      api,
      'Strict types · reject unknown fields',
      960,
      770,
      34,
      themeColors.ink,
      'center',
    );
    const rejected = cueProgress(scene, state, 'firstapp-result-whitespace-empty') > 0;
    extensionText(
      ctx,
      api,
      rejected
        ? 'HTTP 422 · traces 0 · provider calls 0'
        : n === 0
          ? 'Empty transformed report · validation pending'
          : 'Server validation precedes trace creation',
      960,
      925,
      36,
      rejected ? themeColors.pink : themeColors.muted,
      'center',
    );
  });
  return true;
}
export default {
  id: 'input-contract',
  draw: drawInputContract,
  cues: [
    'validated-app-request-b1-1',
    'lookup-account',
    'server-owned-facts-b2-1',
    'strict-app-input-verdict-b3-1',
    'input-contract-core-contract',
    'firstapp-result-whitespace-empty',
  ],
};
