import { spoken } from '../arithmetic.mjs';
import { replayMemory } from '../model.mjs';
import { ACTUAL_LAB_RUN } from '../fixtures.mjs';

export function drawReplayContract(ctx, scene, state, api) {
  const { C, text, rect, arrow } = api;
  const p = (cue, beat) => spoken(state, cue, beat);
  api.focus.target('replay-contract-mechanism', () => {
    if (state.beat < 2) {
      const memory = replayMemory();
      const saved = p('save-accessible', 0);
      const written = p('write-output', 0);
      const restore = p('restore-written', 1);
      text(ctx, 'Device arrays', 570, 280, 42, C.ink, 'center');
      text(ctx, 'Saved before pass 1', 1410, 280, 42, C.ink, 'center');
      ['X', 'Z', 'Y'].forEach((key, i) => {
        const top = 336 + i * 151;
        const color = [C.blue, C.cyan, C.yellow][i];
        const changed = key === 'Y' && written === 1 && restore < 1;
        const values = changed ? memory.afterPass[key] : memory.initial[key];
        text(ctx, key, 175, top + 74, 48, color);
        rect(ctx, 265, top, 610, 112, C.panel, color, 3);
        text(ctx, values.join('      '), 570, top + 73, 43, color, 'center');
        rect(ctx, 1105, top, 610, 112, C.panel, saved > 0 ? color : C.muted, 2);
        if (saved >= (i + 1) / 3)
          text(ctx, memory.saved[key].join('      '), 1410, top + 73, 43, color, 'center');
        if (state.beat === 0 && saved > i / 3 && written === 0)
          arrow(ctx, 900, top + 56, 1080, top + 56, color, 4);
        if (key === 'Y' && restore > 0) arrow(ctx, 1080, top + 56, 900, top + 56, C.yellow, 6);
      });
      let status = 'Nsight Compute needs two passes for this set of counters.';
      if (saved === 1) status = 'Original bytes saved for X, Z and Y.';
      if (written === 1) status = 'Pass 1 wrote Y. Which array needs its saved bytes back?';
      if (restore === 1) status = 'Y restored for pass 2. X and Z kept their values.';
      text(ctx, status, 960, 899, 40, C.ink, 'center');
      if (p('replay-cache-policy', 1) > 0)
        text(ctx, 'Default kernel replay   ·   flush caches before each pass   ·   serialize kernel launches', 960, 986, 30, C.muted, 'center');
      return;
    }
    text(ctx, 'Recorded RTX 5070 Ti profile', 145, 277, 36, C.ink);
    text(ctx, 'Kernel launched', 185, 477, 47, C.cyan);
    text(ctx, ACTUAL_LAB_RUN.counterError, 185, 601, 51, C.pink, 'left', 'mono');
    rect(ctx, 1100, 391, 650, 270, C.panel, C.muted, 2);
    text(ctx, 'Device-memory bytes', 1425, 486, 34, C.ink, 'center');
    text(ctx, 'unavailable', 1425, 589, 48, C.muted, 'center');
    if (p('counter-denied', 2) > 0)
      text(ctx, 'Collect on a host with counter access to place a measured roofline point.', 960, 880, 37, C.yellow, 'center');
  });
}
export default { id: 'replay-contract', draw: drawReplayContract, cues: ['save-accessible', 'write-output', 'restore-written', 'replay-cache-policy', 'counter-denied'] };
