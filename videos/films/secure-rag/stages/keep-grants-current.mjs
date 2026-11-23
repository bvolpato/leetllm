import { authorize } from '../arithmetic.mjs';
import { CANDIDATES, POLICY, PRINCIPAL } from '../fixtures.mjs';
import { drawOriginalCard, drawOriginalLink, drawOriginalText } from '../defaults.mjs';
export function drawKeepGrantsCurrent(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.07, 0.9);
  {
    const source = api.focus.target('source-revocation', () =>
      drawOriginalCard(
        ctx,
        api,
        'Source revokes grant · policy 42',
        180,
        350,
        620,
        themeColors.pink,
        1,
        100,
        31,
      ),
    );
    const gate = api.focus.target('current-version', () =>
      drawOriginalCard(
        ctx,
        api,
        'Trusted current-version check',
        1080,
        350,
        660,
        themeColors.yellow,
        phaseForBeat(1),
        100,
        31,
      ),
    );
    drawOriginalLink(ctx, api, source, gate, phaseForBeat(1), themeColors.yellow);
    const updated = currentBeat < 1 ? 0 : currentBeat > 1 ? 3 : Math.floor(3 * phaseForBeat(1));
    for (let index = 0; index < 3; index++)
      api.focus.target('chunk-revisions', () =>
        drawOriginalCard(
          ctx,
          api,
          'Chunk ' + (index + 1) + ' · rev ' + (index < updated ? 42 : 41),
          230 + index * 540,
          620,
          400,
          index < updated ? themeColors.cyan : themeColors.pink,
          1,
          105,
          32,
        ),
      );
    const currentPolicy =
      currentBeat === 2
        ? null
        : {
            ...POLICY,
            groups: [],
          };
    const allowed =
      updated === 3 &&
      authorize(
        {
          ...CANDIDATES[5],
          policyRevision: 42,
        },
        PRINCIPAL,
        currentPolicy,
      );
    drawOriginalText(
      ctx,
      api,
      currentPolicy === null
        ? 'Current policy unavailable · protected request held'
        : updated === 3
          ? 'Chunks reconciled · revoked grant keeps request denied'
          : 'Reads held while source and index revisions disagree.',
      960,
      830,
      32,
      themeColors.pink,
    );
    api.focus.target('request-decision', () =>
      drawOriginalCard(
        ctx,
        api,
        `Request operations → ${allowed ? 'admit' : 'hold / deny'}`,
        510,
        910,
        900,
        allowed ? themeColors.green : themeColors.yellow,
        1,
        72,
        29,
      ),
    );
  }
}
export default {
  id: 'keep-grants-current',
  draw: drawKeepGrantsCurrent,
  cues: [
    'keep-grants-current-b1-1',
    'keep-grants-current-b2-1',
    'keep-grants-current-b2-2',
    'keep-grants-current-b3-1',
  ],
};
