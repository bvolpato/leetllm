// Scene 32: boundary-close - Return to B's next position
// Returns full-circle to the exact 5-page KV shelf from `pages.mjs` with B's position 33 pending!
// Strict prediction withholding:
//   - Beat 0 asks "Can B take page four now?" while A's device read is live -> P4 stays A's.
//   - Beat 1 reveals "Wait. Reference still live" ONLY after `close-wait`.
//   - Beat 2 retires A's 3 pages (`close-last-read`), grants empty P4 to B (`close-grant-page`),
//     and writes position 33 into P4 slot 0 (`close-write`) -> B maps P1 -> P3 -> P4!
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  buildPagePoolStage,
  cinemaHeader,
  driftValue,
  guardedDynamic,
  privateHistory,
  stepAfter,
  stepOn,
} from '../parts.mjs';

export default function boundaryClose(s, c) {
  const pulse = s.value(0);
  const hostClosed = s.value(0);
  const askOn = s.value(0);
  const waitOn = s.value(0);
  const retiredOn = s.value(0);
  const grantedOn = s.value(0);
  const writtenOn = s.value(0);

  const stageAura = aura(0, 60, 780, '#6ee7b71a', '#ff6b8b16');
  const header = cinemaHeader(
    'FULL-CIRCLE BOUNDARY RESOLUTION',
    'Return to B’s next position',
    null,
    { x: -860, y: -455, accent: ROLE.ok, size: 48 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const host = hostClosed.value > 0.5;
      const ask = askOn.value > 0.5;
      const wait = waitOn.value > 0.5;
      const ret = retiredOn.value > 0.5;
      const grant = grantedOn.value > 0.5;
      const wrote = writtenOn.value > 0.5;

      const history = privateHistory({
        bTokens: wrote ? 33 : 32,
        retired: ret,
        reassigned: grant,
      });

      const tracedPage = grant || (ask && !ret) ? 4 : -1;

      let note = 'Bob’s retrieval is authorized; B has allowance & a turn, but P1 and P3 are full.';
      let noteColor = COSMOS.ink;
      if (host && !wait) {
        note = 'A’s stream closed, yet one device read still holds A’s table. Can B take P4 now?';
        noteColor = ROLE.focus;
      }
      if (wait && !ret) {
        note = 'Wait. That device read still owns a reference to A’s pages; B stays queued.';
        noteColor = ROLE.warn;
      }
      if (ret && !grant) {
        note = 'A’s last read finished and retired A’s page table -> 3 whole pages are now free.';
        noteColor = ROLE.shared;
      }
      if (grant && !wrote) {
        note = 'Allocator assigns an empty P4 to B (no valid positions written yet).';
        noteColor = ROLE.B;
      }
      if (wrote) {
        note = 'B writes position 33 into P4 slot 0. Follow B’s table: P1 -> P3 -> P4.';
        noteColor = ROLE.ok;
      }

      return group(
        ...buildPagePoolStage({
          history,
          pendingPosition: wrote ? null : 33,
          markedPosition: wrote ? 33 : 32,
          tracedPage,
          note,
          noteColor,
          pulse: p,
        }),
      );
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.5);

  stepAfter(s, c, 'close-host', hostClosed, 1);
  stepOn(s, c, 'close-decision', askOn, 1);
  // Strict prediction withholding: reveal Wait ONLY after "Wait. That read still owns a reference".
  stepAfter(s, c, 'close-wait', waitOn, 1);
  stepAfter(s, c, 'close-last-read', retiredOn, 1);
  stepAfter(s, c, 'close-grant-page', grantedOn, 1);
  stepAfter(s, c, 'close-write', writtenOn, 1);
}
