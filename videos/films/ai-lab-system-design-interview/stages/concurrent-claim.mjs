import { namedSystemCue, spokenResult, systemExtensionFrame } from '../construction.mjs';
import { card, text } from '../defaults.mjs';

export function drawConcurrentClaim(ctx, scene, state, api) {
  const { C, focus } = api;
  const pool = systemExtensionFrame(scene.id, state);
  const owned = pool.slotClaimed && !pool.resourcesReleased;
  const read = namedSystemCue(state, 'claim-read', 0, 0.65) > 0;
  const readWait = spokenResult(state, 'claim-backlog', 0, 0.35);
  focus.target('claim-wait', () => {
    const calc =
      pool.capacity.prefill.queuedTokens.toLocaleString('en-US') +
      ' tokens  ÷  ' +
      pool.capacity.prefill.serviceTokensPerSecond.toLocaleString('en-US') +
      ' tokens/s';
    text(
      ctx,
      api,
      readWait ? calc + '  =  ' + pool.wait * 1000 + ' ms' : calc,
      160,
      280,
      44,
      C.ink,
    );
    text(ctx, api, 'Queue limit  250 ms', 1760, 280, 36, C.yellow, 'right');
  });
  focus.target('claim-requests', () => {
    for (const [i, id] of ['R-201', 'R-202'].entries()) {
      const x = 160 + i * 850;
      text(ctx, api, id, x, 438, 57, C.ink);
      text(ctx, api, 'Needs 1 slot + 16 blocks', x, 509, 38, C.blue);
      const label =
        i === 0 && pool.resourcesReleased
          ? 'Completed · claim released'
          : i === 0 && owned
            ? 'Owns slot 64 + 16 blocks'
            : i === 1 && pool.secondRejected
              ? '503 · shared capacity'
              : read
                ? 'Initial read · both checks fit'
                : 'Awaiting capacity check';
      text(
        ctx,
        api,
        label,
        x,
        574,
        35,
        i === 1 && pool.secondRejected ? C.pink : i === 0 && pool.slotClaimed ? C.cyan : C.muted,
      );
    }
  });
  focus.target('claim-pool', () => {
    api.line(ctx, 160, 650, 1760, 650, C.muted, 2);
    text(ctx, api, 'Decode slots in use   ' + pool.activeDecode + ' / 64', 160, 744, 37, C.ink);
    text(ctx, api, 'Cache blocks free   ' + pool.freeKvBlocks + ' / 16', 1010, 744, 37, C.ink);
    card(ctx, api, '1–63   in use', 160, 800, 320, C.muted, 85, 32);
    card(
      ctx,
      api,
      owned ? '64   R-201' : '64   free',
      507,
      800,
      295,
      owned ? C.cyan : C.ink,
      85,
      32,
    );
    for (let i = 0; i < 16; i++)
      api.rect(
        ctx,
        1010 + (i % 8) * 81,
        801 + Math.floor(i / 8) * 53,
        65,
        39,
        owned ? C.cyan : C.panel,
        owned ? C.cyan : C.muted,
        4,
      );
    text(
      ctx,
      api,
      owned ? 'Reserved together for R-201' : 'Available to a single atomic claim',
      1010,
      976,
      31,
      owned ? C.cyan : C.muted,
    );
  });
}

export default {
  id: 'concurrent-claim',
  draw: drawConcurrentClaim,
  cues: [
    'claim-backlog',
    'claim-read',
    'claim-question',
    'claim-first',
    'claim-second',
    'claim-reject',
    'claim-release',
    'claim-retry',
  ],
};
