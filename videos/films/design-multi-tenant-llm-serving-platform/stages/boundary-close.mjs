import { resultAfter } from '../../../lib/lesson-definition.mjs';
import { drawPagePool } from '../page-pool.mjs';
import { multiTenantConstructionModel } from '../model.mjs';

export function drawBoundaryClose(ctx, scene, state, api) {
  const { history, retired, reassigned, written } = multiTenantConstructionModel(scene.id, state);
  const doneOnHost = resultAfter(state, 'close-host');
  const wait = resultAfter(state, 'close-wait');
  let note = 'B has permission to continue. Its next block has no page.';
  if (doneOnHost) note = 'One device read is still outstanding. Can B take P4 now?';
  if (wait) note = 'Keep P4 with A until the last read finishes.';
  if (retired) note = 'A’s reads have finished. Its three pages return to the pool.';
  if (reassigned) note = 'P4 now maps to B’s third block. It has no valid positions yet.';
  if (written) note = 'B’s next read follows P1 → P3 → P4 through position 33.';
  drawPagePool(ctx, api, history, {
    pendingPosition: written ? undefined : 33,
    markedPosition: written ? 33 : 32,
    note,
    noteColor: written ? api.C.green : api.C.ink,
  });
}
export default {
  id: 'boundary-close',
  draw: drawBoundaryClose,
  cues: [
    'close-host',
    'close-decision',
    'close-wait',
    'close-last-read',
    'close-grant-page',
    'close-write',
  ],
};
