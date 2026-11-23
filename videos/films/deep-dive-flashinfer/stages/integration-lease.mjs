import { tile } from '../cache-picture.mjs';
import { flashinferExtensionFrame } from '../construction.mjs';

export function drawIntegrationLease(ctx, scene, state, api) {
  const { C } = api;
  const { runs, writtenEarly, writtenLate, completed } = flashinferExtensionFrame(
    'integration-lease',
    state,
  );
  api.focus.target('lease-timelines', () => {
    api.text(ctx, 'R2 reads page 14, slot 1  /  expected value [0, 1]', 130, 278, 42, C.ink);
    api.text(ctx, 'Allocator policy', 130, 409, 32, C.muted);
    api.text(ctx, 'Value in slot 1 now', 875, 409, 32, C.muted, 'center');
    api.text(ctx, 'Value returned to R2', 1500, 409, 32, C.muted, 'center');
    for (let row = 0; row < 2; row++) {
      const y = 475 + row * 185;
      const { owner, value, returned } = runs[row];
      api.text(
        ctx,
        row === 0 ? 'Reuse on cancellation' : 'Wait for the read event',
        130,
        y + 65,
        38,
        C.ink,
      );
      tile(
        api,
        `${owner}   [${value.join(', ')}]`,
        665,
        y,
        420,
        100,
        owner === 'R9' ? C.yellow : C.blue,
      );
      tile(
        api,
        returned ? `[${returned.join(', ')}]` : 'Read pending',
        1260,
        y,
        480,
        100,
        !returned ? C.muted : row === 0 ? C.pink : C.cyan,
      );
    }
    const status = writtenLate
      ? 'Both slots now hold R9’s value. Only the lower read returned R2’s value.'
      : completed
        ? 'Read complete  /  the lower allocation can change owners.'
        : runs[1].returned
          ? 'Both reads used exactly the same physical address.'
          : writtenEarly
            ? 'What will the pending read return in each run?'
            : 'Two runs start with identical memory.';
    api.text(ctx, status, 960, 930, 38, C.yellow, 'center');
  });
}
export default {
  id: 'integration-lease',
  draw: drawIntegrationLease,
  cues: [
    'lease-early-write',
    'lease-question',
    'lease-early-read',
    'lease-late-read',
    'lease-event',
    'lease-late-write',
  ],
};
