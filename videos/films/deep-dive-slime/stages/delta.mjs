import { goal, old } from '../fixtures.mjs';
import { xor } from '../arithmetic.mjs';
import { applyPatch, versionedPatch } from '../protocols.mjs';
import { progress } from '../phrase-clock.mjs';

const base = { version: versionedPatch.baseVersion, bytes: old };
const first = applyPatch(base, versionedPatch);
const stale = { version: base.version - 1, bytes: old };
const retries = [first.state, stale].map((host) => applyPatch(host, versionedPatch));
const rawRetry = xor(first.state.bytes, versionedPatch.delta);
const changed = old.findIndex((byte, i) => byte !== goal[i]);

function byteRow(ctx, api, label, bytes, y, color) {
  api.text(ctx, label, 138, y + 65, 36, api.C.ink);
  bytes.forEach((byte, i) => {
    const x = 820 + i * 220;
    const ink = i === changed ? color : api.C.muted;
    api.rect(ctx, x, y, 170, 93, api.C.panel, i === changed ? ink : undefined, 8);
    api.text(ctx, String(byte), x + 85, y + 68, 53, ink, 'center');
  });
}

export function drawDelta(ctx, scene, state, api) {
  const { C } = api;
  const p = (id) => progress(scene, state, id);
  return api.focus.target('disk-hosts', () => {
    api.text(ctx, 'Patch on disk', 138, 268, 34, C.muted);
    api.text(ctx, `v${base.version} → v${first.state.version}`, 480, 268, 44, C.ink);
    api.text(
      ctx,
      `XOR payload  [${versionedPatch.delta.join(', ')}]`,
      1768,
      268,
      36,
      C.yellow,
      'right',
    );
    api.line(ctx, 138, 315, 1768, 315, C.muted, 2);
    if (state.beat < 2) {
      byteRow(ctx, api, 'Declared base  /  v11', old, 390, C.blue);
      byteRow(ctx, api, 'Intended destination  /  v12', goal, 538, C.green);
      const applied = p('write-patch') === 1;
      const toggled = state.beat === 1 && p('toggle-back') === 1;
      const current = toggled ? rawRetry : applied ? first.state.bytes : old;
      byteRow(ctx, api, 'Local checkpoint bytes', current, 710, toggled ? C.pink : C.blue);
      const equation = toggled
        ? `Raw retry    ${goal[changed]} XOR ${versionedPatch.delta[changed]} = ${current[changed]}`
        : applied
          ? `First write    ${old[changed]} XOR ${versionedPatch.delta[changed]} = ${current[changed]}`
          : 'Compare the third byte.';
      api.text(ctx, equation, 960, 951, 46, toggled ? C.pink : C.cyan, 'center');
      return;
    }
    api.text(
      ctx,
      `Base v11   [${old.join(', ')}]          Target v12   [${goal.join(', ')}]`,
      960,
      368,
      32,
      C.ink,
      'center',
    );
    [first.state, stale].forEach((host, i) => {
      const y = i ? 686 : 407;
      const ready = p(i ? 'retry-stale' : 'retry-done') === 1;
      byteRow(
        ctx,
        api,
        `Host ${i ? 'B' : 'A'}   /   recorded v${host.version}`,
        host.bytes,
        y,
        ready ? (i ? C.pink : C.green) : C.blue,
      );
      if (ready) {
        const valid = retries[i].reason === 'already applied';
        api.text(
          ctx,
          valid
            ? 'Destination verified. Leave these bytes in place.'
            : 'Wrong base. Restore known weights before reload.',
          138,
          y + 151,
          33,
          valid ? C.green : C.pink,
        );
      }
    });
    api.text(
      ctx,
      state.beat === 2
        ? 'Which host should write this patch on retry?'
        : 'Verify each admitted engine’s loaded version before serving.',
      960,
      972,
      40,
      state.beat === 2 ? C.yellow : C.ink,
      'center',
    );
  });
}
export default {
  id: 'delta',
  draw: drawDelta,
  cues: ['write-patch', 'toggle-back', 'host-receipts', 'retry-done', 'retry-stale'],
};
