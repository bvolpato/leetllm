import { sampleModel, vvProgress } from '../construction.mjs';
import { tokenCell } from '../defaults.mjs';

export function drawAdmission(ctx, scene, state, api) {
  const { C } = api;
  const p = (id, beat) => vvProgress(state, 'admission-' + id, beat);
  const changed = p('bigger', 2) > 0;
  const released = p('release', 1) > 0;
  const example = changed ? 2 : released ? 1 : 0;
  const s = sampleModel('admission', { beat: example, beatP: 0 });
  const placed = Math.floor(s.requestedTokens * (changed ? p('five', 2) : p('two', 0)));
  const verdict = changed ? p('five', 2) === 1 : released || p('two', 0) === 1;
  api.focus.target('admission-plan', () => {
    api.text(
      ctx,
      `Proposal: compute ${s.requestedTokens} more inputs for one request`,
      130,
      290,
      42,
      C.ink,
    );
    api.text(ctx, 'Step budget', 130, 461, 35, C.blue);
    for (let i = 0; i < Math.max(s.remainingTokens, placed); i++) {
      tokenCell(
        api,
        i < placed ? '+' + (i + 1) : '',
        450 + i * 184,
        402,
        170,
        88,
        i < s.remainingTokens ? C.blue : C.yellow,
        i < placed && i < s.remainingTokens,
      );
    }
    api.text(ctx, '4 input positions available', 450, 560, 30, C.blue);
    api.text(ctx, 'KV storage', 130, 713, 35, C.cyan);
    for (let i = 0; i < 8; i++) {
      const value = i < 3 ? 'used' : i - 3 < placed ? '+' + (i - 2) : '';
      const backed = i < 4 || s.freeBlocks > 0;
      tokenCell(
        api,
        value,
        450 + i * 146 + (i >= 4 ? 70 : 0),
        653,
        134,
        91,
        backed ? C.cyan : C.muted,
        Boolean(value) && backed,
      );
    }
    api.text(ctx, 'Existing block: 1 place left', 450, 818, 31, C.cyan);
    api.text(
      ctx,
      s.freeBlocks ? '1 new block available' : 'No new block available',
      1104,
      818,
      31,
      s.freeBlocks ? C.cyan : C.muted,
    );
    if (verdict) {
      const reason = s.admitted
        ? 'Both inputs fit and have backing storage'
        : s.memoryFits
          ? 'The fifth input is outside the step budget'
          : 'The second input has no backing block';
      api.text(ctx, reason, 960, 975, 43, s.admitted ? C.green : C.yellow, 'center');
    }
  });
}
export default {
  id: 'admission',
  draw: drawAdmission,
  cues: ['admission-two', 'admission-release', 'admission-bigger', 'admission-five'],
};
