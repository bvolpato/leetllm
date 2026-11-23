import { promptCueSnapshot } from '../construction.mjs';
import { drawPromptCard, drawPromptRows, drawPromptText } from '../defaults.mjs';
export function drawOutboundContract(ctx, scene, state, api) {
  return paintOutboundContract(ctx, scene, state, api);
}
function paintOutboundContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = promptCueSnapshot('outbound-contract', state),
    {
      b: currentBeat,
      p: progress,
      progress: sentenceProgress,
      P: cueProgress,
      D: resultComplete,
    } = modelState;
  const withMechanismFocus = (paint) => api.focus.target('pi-outbound-contract-mechanism', paint);
  const active = Math.min(4, Math.floor(sentenceProgress * 5));
  withMechanismFocus(() => {
    const raw =
        currentBeat === 0
          ? 'https://evals.mlplatform.example/runs/R42'
          : currentBeat === 1
            ? 'https://evals.mlplatform.example/runs/R42?secret=PRIVATE'
            : 'https://evals.mlplatform.example/runs/R42',
      u = new URL(raw),
      fields = [
        ['scheme', u.protocol],
        ['hostname', u.hostname],
        ['port', u.port || '443 default'],
        ['path', u.pathname],
        ['credentials', u.username || 'none'],
        ['query', u.search || 'none'],
        ['fragment', u.hash || 'none'],
      ];
    drawPromptText(ctx, api, 'Model-proposed outgoing resource', 180, 310, 31, themeColors.blue);
    drawPromptText(ctx, api, raw, 180, 390, 27, themeColors.ink);
    const shownFields = currentBeat === 2 ? fields.slice(0, 4) : fields;
    drawPromptRows(
      ctx,
      api,
      currentBeat
        ? shownFields
        : shownFields.slice(0, Math.max(1, Math.ceil(sentenceProgress * shownFields.length))),
      180,
      455,
      1580,
      {
        active: Math.floor(sentenceProgress * shownFields.length),
      },
    );
    if (currentBeat === 1 && resultComplete('pi-query-denied', sentenceProgress > 0.8))
      drawPromptCard(
        ctx,
        api,
        'Nonempty query rejected before any network request',
        180,
        1010,
        1580,
        themeColors.pink,
        55,
        27,
      );
    if (currentBeat === 2) {
      drawPromptText(ctx, api, 'Initial string check', 180, 880, 29, themeColors.cyan);
      drawPromptText(
        ctx,
        api,
        'Redirect → different destination → new egress check',
        180,
        950,
        31,
        themeColors.yellow,
      );
    }
  });
}
export default {
  id: 'outbound-contract',
  draw: drawOutboundContract,
  cues: [
    'pi-outbound-contract-0',
    'pi-outbound-contract-1',
    'pi-query-denied',
    'pi-outbound-contract-2',
  ],
};
