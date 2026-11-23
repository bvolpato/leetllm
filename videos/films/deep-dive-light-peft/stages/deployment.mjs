import { IDENTITY_FIXTURE } from '../fixtures.mjs';
import { beatCue, identityCacheKey } from '../model.mjs';
import { chapterPanel } from '../defaults.mjs';

const recordA = { base: 'R1', adapter: 'V4', width: 3, ids: IDENTITY_FIXTURE.baseA };
const requestB = { base: 'R1', adapter: 'V4', width: 3, ids: IDENTITY_FIXTURE.baseB };
const weakKey = (row) => [row.base, row.adapter, row.width].join(' / ');
const sameShortKey = weakKey(recordA) === weakKey(requestB);
const sameIds = recordA.ids.every((id, i) => id === requestB.ids[i]);

export function drawDeployment(ctx, scene, state, api) {
  const { C } = api;
  const inspect = beatCue(state, 0, 'lp-cache-inspect', 0.16, 0.45);
  const keyed = beatCue(state, 1, 'deployment-beat-1-focus-1', 0.08, 0.4);
  const miss = beatCue(state, 1, 'lp-cache-miss', 0.54, 0.73);
  api.text(ctx, 'Same token prefix and runtime', 145, 268, 36, C.muted);
  api.text(ctx, 'Base rev.    /    Adapter rev.    /    Head count', 530, 377, 35, C.ink, 'center');
  api.text(ctx, 'Original head in each physical slot', 1390, 377, 35, C.ink, 'center');
  api.focus.target('cache-lookup', () => {
    [recordA, requestB].forEach((row, i) => {
      const y = 465 + i * 165;
      api.text(ctx, i ? 'Request B' : 'Cached A', 130, y + 70, 43, i ? C.cyan : C.blue);
      chapterPanel(ctx, api, C, weakKey(row), 430, y, 507, 102, C.blue, 44);
      row.ids.forEach((id, j) => {
        const visible = inspect >= (j + 1) / row.ids.length;
        const isDifferent = recordA.ids[j] !== requestB.ids[j];
        chapterPanel(
          ctx,
          api,
          C,
          visible ? 'H' + id : '?',
          1070 + 205 * j,
          y,
          171,
          102,
          keyed > 0 && isDifferent ? C.yellow : C.cyan,
          44,
        );
      });
    });
  });
  api.focus.target('cache-keys', () => {
    const full = keyed > 0;
    const lines = full
      ? [
          'Cache A: ' + identityCacheKey(weakKey(recordA), recordA.ids),
          'Cache B: ' + identityCacheKey(weakKey(requestB), requestB.ids),
        ]
      : ['Key under test    ' + weakKey(recordA)];
    lines.forEach((label, i) => api.text(ctx, label, 960, 837 + 57 * i, 34, C.ink, 'center'));
    const verdict =
      miss === 1 && !sameIds
        ? 'Cache miss for B   ·   build state using B’s head IDs'
        : keyed > 0
          ? 'Compare the middle slot'
          : sameShortKey
            ? 'The lookup keys match. Can B reuse the entry?'
            : '';
    api.text(ctx, verdict, 960, 994, 38, miss === 1 ? C.pink : C.yellow, 'center');
  });
}
export default {
  id: 'deployment',
  draw: drawDeployment,
  cues: ['lp-cache-inspect', 'deployment-beat-1-focus-1', 'lp-cache-miss'],
};
