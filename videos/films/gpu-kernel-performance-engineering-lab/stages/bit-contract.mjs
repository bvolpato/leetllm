import { copyPass, drawCopyPass } from '../copy-check.mjs';
import { chapterText, footer } from '../defaults.mjs';

export function drawBitContract(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = (key) => focus.progress(key, 0);
  const done = (key) => focus.cue(key)?.phase === 'after';
  const beat = state.beat ?? 0;
  if (beat < 3) {
    const repairing = beat === 2 && done('repair-reset');
    const poisoned = beat > 0 || done('fresh-poison');
    const stores = repairing
      ? Math.floor(16 * p('repaired-stores'))
      : beat > 0
        ? 15
        : poisoned
          ? Math.floor(15 * p('repeat-stores'))
          : 15;
    const snapshot = copyPass(
      poisoned ? 'poison' : 'previous',
      repairing ? 'repaired' : 'skipped',
      stores,
    );
    let readout = 'What will be left at B[2, 1]?';
    if (beat === 1 || (beat === 2 && !repairing)) {
      readout = done('poison-verdict')
        ? `Expected  0x40c00000     ·     found  0xffffffff     ·     ${snapshot.mismatches} mismatch`
        : 'Compare the 32 bits at B[2, 1] with the bits of six';
    }
    if (repairing)
      readout = done('repair-verdict')
        ? `${snapshot.mismatches} bit mismatches     ·     the repaired copy passes this input`
        : 'Compare all 16 output words';
    drawCopyPass(ctx, api, snapshot, {
      origin: repairing
        ? 'Repaired launch  ·  fresh poison'
        : poisoned
          ? 'Same skipped store  ·  fresh poison'
          : 'Same skipped store  ·  previous output',
      step: `${stores} / 16 destinations written by this launch`,
      readout,
      inspection: true,
      indices: beat === 1 && done('copy-index'),
    });
    return;
  }
  const different = done('zero-bits');
  chapterText(ctx, api, 'What does an absolute error of zero tell us?', 960, 290, 42);
  const zeros = new Float32Array([0, -0]);
  const words = new Uint32Array(zeros.buffer);
  focus.target('zero-words', () => {
    ['Expected  +0.0', 'Returned  −0.0'].forEach((label, i) => {
      const y = 460 + i * 170;
      chapterText(ctx, api, label, 320, y + 4, 40, i ? C.cyan : C.blue);
      const binary = words[i].toString(2).padStart(32, '0');
      for (let b = 0; b < 32; b++) {
        const x = 565 + b * 34 + Math.floor(b / 8) * 18;
        if (b === 0 && different) api.rect(ctx, x - 14, y - 40, 28, 58, '#534a2b', C.yellow, 4);
        chapterText(ctx, api, binary[b], x, y + 4, 33, b === 0 ? C.yellow : C.muted);
      }
    });
  });
  focus.target('zero-verdict', () =>
    chapterText(
      ctx,
      api,
      different ? 'One sign bit changed  ·  exact copy fails' : '|+0.0 − (−0.0)|  =  0',
      960,
      822,
      46,
      different ? C.yellow : C.ink,
    ),
  );
  footer(
    ctx,
    api,
    'Lab input: distinct integers 0 to N² − 1   ·   N ≤ 4096   ·   largest value 16,777,215',
  );
}
export default {
  id: 'bit-contract',
  draw: drawBitContract,
  cues: [
    'fresh-poison',
    'repeat-stores',
    'poison-verdict',
    'copy-index',
    'repair-reset',
    'repaired-stores',
    'repair-verdict',
    'zero-bits',
  ],
};
