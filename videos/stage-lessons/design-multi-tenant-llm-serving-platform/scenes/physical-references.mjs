// Scene 15: physical-references - Two readers of the same handbook
// Shared immutable public handbook (P0) plus private suffixes (P1 for A, P2 for B).
// Strict prediction withholding across 3 questions:
//   1. Count 4 entries -> 3 pages (withheld until `c.after('mt-physical-references-s1-0')`)
//   2. Retire A -> P1 reclaimable, P0 still pinned by B (withheld until Beat 2)
//   3. Host closes B stream while device read runs -> wait until `c.after('mt-physical-references-s3-1')`!
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  guardedDynamic,
  quadArcPts,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function physicalReferences(s, c) {
  const b0On = s.value(0);
  const b1On = s.value(0);
  const countedOn = s.value(0);
  const aRetireOn = s.value(0);
  const b2On = s.value(0);
  const hostCloseOn = s.value(0);
  const b3On = s.value(0);
  const bRetireOn = s.value(0);

  const stageAura = aura(0, 40, 760, '#5ce1e61e', '#60a5fa16');
  const header = cinemaHeader(
    'SHARED PREFIX REFERENCE COUNTS',
    'Two readers of',
    'the same handbook',
    { x: -860, y: -450, accent: ROLE.kv, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const counted = countedOn.value > 0.5;
      const aRet = aRetireOn.value > 0.5;
      const b2 = b2On.value > 0.5;
      const hostClosed = hostCloseOn.value > 0.5;
      const b3 = b3On.value > 0.5;
      const bRet = bRetireOn.value > 0.5;

      const pages = [
        {
          id: 'P1',
          content: 'A’s private suffix',
          readers: aRet ? [] : ['A'],
          col: ROLE.A,
          cx: -560,
        },
        {
          id: 'P0',
          content: 'Public handbook (shared)',
          readers: [...(aRet ? [] : ['A']), ...(bRet ? [] : ['B'])],
          col: ROLE.kv,
          cx: 0,
        },
        {
          id: 'P2',
          content: 'B’s private suffix',
          readers: bRet ? [] : ['B'],
          col: ROLE.B,
          cx: 560,
        },
      ];

      const logical = pages.reduce((acc, pg) => acc + pg.readers.length, 0);
      const physical = pages.filter((pg) => pg.readers.length > 0).length;

      const nodes = [];

      // Top readers: A / Alice (left) and B / Bob (right)
      const readers = [
        {
          name: 'A  /  Alice',
          cx: -390,
          col: ROLE.A,
          retired: aRet,
          status: aRet ? 'device reads finished' : 'active request',
        },
        {
          name: 'B  /  Bob',
          cx: 390,
          col: ROLE.B,
          retired: bRet,
          status: bRet
            ? 'device reads finished'
            : hostClosed
              ? 'host closed · 1 device read live'
              : 'active request',
        },
      ];

      readers.forEach((rd, idx) => {
        const stroke = rd.retired ? '#334366' : idx === 1 && hostClosed ? ROLE.warn : rd.col;
        nodes.push(
          rect(520, 126, { fill: '#0b1224', stroke, width: 2.8, radius: 16 })
            .at(rd.cx, -190)
            .glow(rd.retired ? 0 : 7, stroke),
          txt(rd.name, rd.cx, -216, 34, rd.retired ? COSMOS.muted : rd.col, 'mono', 'center'),
          txt(
            rd.status,
            rd.cx,
            -162,
            26,
            rd.retired ? COSMOS.dim : idx === 1 && hostClosed ? ROLE.warn : COSMOS.ink,
            'sans',
            'center',
          ),
        );

        // Active reference pointer beams from reader to its pages
        if (!rd.retired) {
          const privX = idx === 0 ? -560 : 560;
          const sharedX = idx === 0 ? -70 : 70;
          nodes.push(
            beamWithPhotons(
              quadArcPts([rd.cx - 40, -125], [privX, 18], idx === 0 ? -16 : 16),
              rd.col,
              0,
              {
                width: 4,
                glow: 8,
              },
            ),
            beamWithPhotons(
              quadArcPts([rd.cx + 40, -125], [sharedX, 18], idx === 0 ? 16 : -16),
              rd.col,
              0,
              {
                width: 4,
                glow: 8,
              },
            ),
          );
        }
      });

      // Three physical KV pages across the middle (P1, P0, P2)
      pages.forEach((pg) => {
        const n = pg.readers.length;
        const zero = n === 0;
        const reclaimRevealed = zero && (pg.id === 'P1' ? b2 : bRet);
        const stroke = reclaimRevealed ? ROLE.free : zero ? '#4c618a' : pg.col;
        nodes.push(
          rect(500, 210, {
            fill: reclaimRevealed ? '#0b1a18' : '#0b1426',
            stroke,
            width: 3.0,
            radius: 16,
          })
            .at(pg.cx, 126)
            .glow(reclaimRevealed ? 6 : zero ? 0 : 9, stroke),
          txt(pg.id, pg.cx, 66, 46, stroke, 'mono', 'center'),
          txt(pg.content, pg.cx, 128, 28, zero ? COSMOS.muted : COSMOS.ink, 'sans', 'center'),
          txt(
            reclaimRevealed
              ? '0 live refs · FREE'
              : zero
                ? '0 live references'
                : `${n} live ${n === 1 ? 'reference' : 'references'}`,
            pg.cx,
            184,
            28,
            reclaimRevealed ? ROLE.free : zero ? COSMOS.muted : ROLE.focus,
            'mono',
            'center',
          ),
        );
      });

      // Lower counters (strictly withheld until counted)
      nodes.push(
        txt(
          counted ? `${logical} live block entries` : 'Count the arrows from A and B',
          -810,
          312,
          32,
          counted ? COSMOS.ink : COSMOS.muted,
          'mono',
          'left',
        ),
        txt(
          counted ? `${physical} physical pages with readers` : 'How many physical pages?',
          810,
          312,
          32,
          counted ? ROLE.kv : ROLE.focus,
          'mono',
          'right',
        ),
      );

      // Context-sensitive teaching prompt / verdict
      let bottom = 'Count the lines from A and B. How many different physical pages do they reach?';
      let bottomCol = ROLE.focus;
      if (counted && !aRet) {
        bottom = '4 block entries reach 3 physical pages (P0 is shared).';
        bottomCol = ROLE.ok;
      } else if (aRet && !b2) {
        bottom =
          'A retired both references. Look at P1 and P0: which page can the allocator reclaim?';
        bottomCol = ROLE.focus;
      } else if (b2 && !hostClosed) {
        bottom = 'P1 returns to the free pool. B still holds a live reference to P0.';
        bottomCol = ROLE.ok;
      } else if (hostClosed && !b3) {
        bottom =
          'Host closed B’s stream, but 1 device op holds B’s pages. Can a request overwrite P0 yet?';
        bottomCol = ROLE.focus;
      } else if (b3 && !bRet) {
        bottom = 'Wait for that device operation before reclaiming P0.';
        bottomCol = ROLE.warn;
      } else if (bRet) {
        bottom =
          'B’s last reads finished. P0 and P2 return to the pool; allocator stored only 1 copy.';
        bottomCol = ROLE.ok;
      }

      nodes.push(txt(bottom, 0, 412, 30, bottomCol, 'sans', 'center'));

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  stepOn(s, c, 'mt-physical-references-b0', b0On, 1);
  stepOn(s, c, 'mt-physical-references-b1', b1On, 1);
  stepAfter(s, c, 'mt-physical-references-s1-0', countedOn, 1);
  stepAfter(s, c, 'mt-physical-references-s1-1', aRetireOn, 1);
  stepOn(s, c, 'mt-physical-references-b2', b2On, 1);
  stepAfter(s, c, 'mt-physical-references-s2-1', hostCloseOn, 1);
  stepOn(s, c, 'mt-physical-references-b3', b3On, 1);
  stepAfter(s, c, 'mt-physical-references-s3-1', bRetireOn, 1);
}
