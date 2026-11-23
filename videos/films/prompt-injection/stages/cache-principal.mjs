import { promptCueSnapshot } from '../construction.mjs';
import { drawPromptCard, drawPromptRows, drawPromptText } from '../defaults.mjs';
export function drawCachePrincipal(ctx, scene, state, api) {
  return paintCachePrincipal(ctx, scene, state, api);
}
function paintCachePrincipal(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = promptCueSnapshot('cache-principal', state),
    {
      b: currentBeat,
      p: progress,
      progress: sentenceProgress,
      P: cueProgress,
      D: resultComplete,
    } = modelState;
  const withMechanismFocus = (paint) => api.focus.target('pi-cache-principal-mechanism', paint);
  const active = Math.min(4, Math.floor(sentenceProgress * 5));
  withMechanismFocus(() => {
    const stored = ['intern', 'read', 'report-C17/R42'],
      requested =
        currentBeat === 2 || (currentBeat === 0 && sentenceProgress > 0.5)
          ? ['owner', 'promote', stored[2]]
          : stored,
      hit = stored.every((v, i) => v === requested[i]);
    drawPromptText(ctx, api, 'Private application cache key', 180, 320, 33, themeColors.blue);
    drawPromptRows(
      ctx,
      api,
      [
        ['principal', stored[0]],
        ['privilege', stored[1]],
        ['source URI', stored[2]],
      ],
      180,
      430,
      700,
    );
    drawPromptText(ctx, api, 'Authenticated lookup', 1050, 320, 33, themeColors.green);
    drawPromptRows(
      ctx,
      api,
      [
        ['principal', requested[0]],
        ['privilege', requested[1]],
        ['source URI', requested[2]],
      ],
      1050,
      430,
      700,
      {
        active: Math.min(2, Math.floor(sentenceProgress * 3)),
      },
    );
    drawPromptCard(
      ctx,
      api,
      hit ? 'Exact private key: HIT' : 'Different access context: MISS',
      180,
      785,
      1570,
      hit ? themeColors.cyan : themeColors.yellow,
      95,
      32,
    );
    if (currentBeat > 0) {
      drawPromptText(
        ctx,
        api,
        currentBeat === 1
          ? 'Access is checked again on every hit'
          : 'A miss may fetch the same poisoned source',
        960,
        950,
        31,
        themeColors.green,
        'center',
      );
    }
  });
}
export default {
  id: 'cache-principal',
  draw: drawCachePrincipal,
  cues: ['pi-cache-principal-0', 'pi-cache-principal-1', 'pi-cache-principal-2'],
};
