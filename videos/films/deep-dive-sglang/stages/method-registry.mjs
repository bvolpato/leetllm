import { phase } from '../arithmetic.mjs';
import { box, extensionText, footer, table, title } from '../defaults.mjs';
export function drawMethodRegistry(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    q = phase(state.beatP);
  api.focus.target('method-registry-mechanism', () => {
    title(
      ctx,
      api,
      currentBeat === 0
        ? 'Which draft methods can this worker load?'
        : currentBeat === 1
          ? 'Method-specific compatibility rules'
          : 'A comparison keeps workload and service contract fixed',
    );
    if (currentBeat === 0) {
      box(
        ctx,
        api,
        'Pinned built-ins\nEAGLE / EAGLE3 / standalone\nn-gram / DFlash family',
        180,
        390,
        760,
        240,
        themeColors.blue,
        30,
      );
      box(
        ctx,
        api,
        'Guide inspected for lesson\nUNO: trained LoRA draft\nbase-weight verification',
        1040,
        390,
        700,
        240,
        themeColors.pink,
        30,
      );
      extensionText(
        ctx,
        api,
        'Additional methods can register as plugins',
        960,
        815,
        32,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      table(
        ctx,
        api,
        [
          ['Method', 'Required / unsupported'],
          ['UNO', 'CUDA · FA3 · TP1 / PP1 · no grammar'],
          ['n-gram', 'overlap OFF · mixed chunk OFF'],
          ['EAGLE / standalone V2', 'overlap path · branching top-k 1'],
        ],
        190,
        365,
        1540,
        115,
        27,
      );
      extensionText(
        ctx,
        api,
        'An explicit incompatible configuration must fail',
        960,
        930,
        33,
        themeColors.pink,
        'center',
      );
    } else {
      table(
        ctx,
        api,
        [
          ['Controlled replay', 'Baseline', 'Candidate'],
          ['request IDs / lengths', 'same', 'same'],
          ['schema / quality', 'same', 'same'],
          ['speculation', 'disabled', 'valid configured method'],
          ['evidence', 'full receipt', 'full receipt'],
        ],
        210,
        360,
        1500,
        95,
        27,
      );
    }
    if (currentBeat === 2) footer(ctx, api, 'Replay the same ticket workload in both modes.');
  });
}
export default {
  id: 'method-registry',
  draw: drawMethodRegistry,
  cues: [
    'sg-method-registry-beat-0',
    'sg-method-registry-beat-1',
    'sg-method-ngram',
    'sg-method-eagle',
    'sg-method-registry-beat-2',
  ],
};
