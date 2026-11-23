import { bucketFor } from '../arithmetic.mjs';
import { sampleRuntimeChapter } from '../construction.mjs';
import {
  runtimeNote,
  runtimeRow,
  runtimeRule,
  runtimeTile,
  runtimeTitle,
  runtimeWire,
} from '../defaults.mjs';
export function drawCompatibleDispatch(ctx, scene, state, api) {
  return api.focus.target('gr-compatible-dispatch-mechanism', () =>
    paintCompatibleDispatch(ctx, scene, state, api),
  );
}
function paintCompatibleDispatch(ctx, scene, state, api) {
  const modelState = sampleRuntimeChapter('compatible-dispatch', state),
    { id, b: currentBeat, g: cueProgress, done: resultComplete } = modelState;
  const { C: themeColors } = api;
  {
    runtimeTitle(ctx, api, 'Match the full descriptor before selecting retained capacity');
    const requests = [6, 16, 17],
      request = currentBeat === 0 ? requests[Math.min(2, Math.floor(cueProgress(0, 1) * 3))] : 6,
      choice = bucketFor(request);
    [1, 2, 4, 8, 16].forEach((n, i) =>
      runtimeTile(
        ctx,
        api,
        n,
        180 + i * 320,
        410,
        260,
        choice === n ? themeColors.green : themeColors.muted,
        105,
        42,
      ),
    );
    runtimeTile(
      ctx,
      api,
      `Request · ${request} valid rows`,
      560,
      610,
      800,
      themeColors.blue,
      95,
      34,
    );
    const p = cueProgress(0, 1);
    if (choice)
      runtimeWire(
        ctx,
        api,
        960,
        595,
        180 + [1, 2, 4, 8, 16].indexOf(choice) * 320 + 130,
        535,
        p,
        themeColors.green,
      );
    runtimeRule(
      ctx,
      api,
      resultComplete(0, 1)
        ? choice
          ? `Smallest fitting bucket = ${choice}`
          : 'No fitting bucket · supported fallback'
        : 'Check capacity and execution attributes',
      845,
      themeColors.yellow,
      34,
    );
    if (currentBeat > 0)
      runtimeRow(ctx, api, ['dtype', 'layout', 'addresses', 'adapter'], 890, {
        x: 200,
        pitch: 405,
        color: themeColors.cyan,
        size: 27,
      });
    runtimeNote(
      ctx,
      api,
      currentBeat === 2
        ? 'SGLang settings · decode, prefill and padding · 7 Nov 2026'
        : 'vLLM batch descriptor · token and request counts, uniformity and LoRA state · 7 Nov 2026',
    );
    return;
  }
}
export default {
  id: 'compatible-dispatch',
  draw: drawCompatibleDispatch,
  cues: [
    'gr-compatible-dispatch-b0-operation',
    'gr-compatible-dispatch-b0-s0',
    'gr-compatible-dispatch-b0-s1',
    'gr-compatible-dispatch-b0-s2',
    'gr-compatible-dispatch-b1-operation',
    'gr-compatible-dispatch-b1-s0',
    'gr-compatible-dispatch-b1-s1',
    'gr-compatible-dispatch-b1-s2',
    'gr-compatible-dispatch-b1-s3',
    'gr-compatible-dispatch-b2-operation',
    'gr-compatible-dispatch-b2-s0',
    'gr-compatible-dispatch-b2-s1',
    'gr-compatible-dispatch-b2-s2',
  ],
};
