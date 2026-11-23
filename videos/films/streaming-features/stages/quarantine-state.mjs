import { applyLatestState } from '../arithmetic.mjs';
import { spoken } from '../request-clock.mjs';
import { drawFooter } from '../defaults.mjs';

const first = { job: 'J-205', event: 630, available: 631, version: 7, phase: 'worker_scaled' };
const other = { ...first, available: 632, phase: 'worker_scale_failed' };

export function drawQuarantineState(ctx, scene, state, api) {
  const { C } = api;
  const clock = spoken(scene, state);
  const conflict = clock.started('payloads') || state.beat > 0;
  const resolved = clock.finished('quarantine') || state.beat > 1;
  const repaired = clock.finished('higher') || state.beat > 1;
  api.focus.target('quarantine-state-mechanism', () => {
    api.text(
      ctx,
      'J-205     /     Worker event 10:30     /     Source version 7',
      108,
      256,
      37,
      C.muted,
    );
    ['A then B', 'B then A'].forEach((label, i) => {
      const ordered = i ? [other, first] : [first, other];
      const store = new Map();
      applyLatestState(store, ordered[0]);
      if (resolved) applyLatestState(store, ordered[1]);
      if (clock.finished('retry') || repaired) applyLatestState(store, ordered[0]);
      if (repaired) applyLatestState(store, { ...first, version: 8, available: 638 });
      const x = 111 + i * 904;
      api.text(ctx, label, x, 378, 43, C.ink);
      api.text(ctx, `1     ${ordered[0].phase}`, x, 490, 36, C.cyan, 'left', 'mono');
      if (conflict) api.text(ctx, `2     ${ordered[1].phase}`, x, 607, 36, C.cyan, 'left', 'mono');
      api.line(ctx, x, 664, x + 793, 664, '#505560', 3);
      let answer = 'Which phase can the store serve?';
      if (resolved)
        answer = store.get(first.job).quarantined ? 'QUARANTINED' : 'validated v8 replaces state';
      api.text(ctx, answer, x, 760, 36, repaired ? C.green : resolved ? C.pink : C.yellow);
    });
    if (state.beat > 1) {
      api.text(
        ctx,
        'J-205   ·   historical lookup before current publication → read history',
        109,
        910,
        35,
        C.ink,
      );
      drawFooter(ctx, api, 'Captured 09:00 H1 age remains 8 h after later quarantine or repair');
    } else if (clock.started('retry') && !repaired) {
      api.text(ctx, 'Repeat the first message under the same version.', 108, 920, 38, C.yellow);
    }
  });
}
export default {
  id: 'quarantine-state',
  draw: drawQuarantineState,
  cues: ['payloads', 'quarantine', 'retry', 'higher'].map((id) => 'sf-quarantine-state-' + id),
};
