// Scene 04: What if the page IDs are sorted? Sorting [3,14,6] -> [3,6,14] redirects k5 to empty slot on Page 6.
import {
  COSMOS,
  PAGE_SIZE,
  R2_PAGES,
  R2_SORTED_PAGES,
  ROLE,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainAfter,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function pagePermutation(s, c) {
  const phase = s.value(0);
  const isSorted = s.value(0); // 0=original [3,14,6], 1=sorted [3,6,14]
  const showEmpty = s.value(0);
  const showLength = s.value(0);

  const bgAura = aura(0, 20, 640, '#ff6b8b1a', '#5ce1e61a');

  const title = heroTitle(['What If Page IDs', 'Are Sorted?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: ROLE.bad,
    eyebrow: 'LOGICAL ORDER VS PHYSICAL IDs',
    subtitle: 'Physical bytes stay fixed; changing list order corrupts lookup',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sorted = isSorted.value > 0.5;
    const diag = showEmpty.value;
    const lenVis = showLength.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const activeList = sorted ? R2_SORTED_PAGES : R2_PAGES;
    const targetPage = activeList[1]; // 6 when sorted, 14 when original

    const nodes = [
      // Left: Lookup list entries [0, 1, 2]
      txt(
        sorted ? 'SORTED LIST [3, 6, 14]' : 'ORDERED LIST [3, 14, 6]',
        -590,
        -172,
        28,
        sorted ? ROLE.bad : ROLE.good,
        'mono',
      ),
      txt('PHYSICAL MEMORY (UNCHANGED)', 360, -172, 28, ROLE.r2, 'mono'),
    ];

    // Lookup list boxes on left
    activeList.forEach((pid, idx) => {
      const cy = -82 + idx * 124;
      const isEntry1 = idx === 1;
      const col = isEntry1 ? (sorted ? ROLE.bad : COSMOS.gold) : ROLE.r2;
      nodes.push(
        glassCell(-620, cy, 390, 88, col, {
          fill: isEntry1 ? (sorted ? '#2e101c' : '#2a2210') : '#0f1b33',
          glow: isEntry1 ? 11 * pulse : 4,
        }),
        txt(`entry ${idx} -> Page ${pid}`, -620, cy, 28, col, 'mono'),
      );
    });

    // Fixed physical pages on right: Page 3 (k0..k3), Page 14 (k4..k7), Page 6 (k8, empty x3)
    const physPages = [
      { id: 3, slots: ['k0', 'k1', 'k2', 'k3'], cy: -82 },
      { id: 14, slots: ['k4', 'k5', 'k6', 'k7'], cy: 42 },
      { id: 6, slots: ['k8', 'empty', 'empty', 'empty'], cy: 166 },
    ];

    physPages.forEach((pg) => {
      const isHit = pg.id === targetPage;
      nodes.push(
        txt(
          `Page ${pg.id}`,
          -35,
          pg.cy,
          28,
          isHit ? (sorted ? ROLE.bad : ROLE.good) : ROLE.r2,
          'mono',
          'right',
        ),
      );
      pg.slots.forEach((slLabel, sIdx) => {
        const cx = 75 + sIdx * 205;
        const isTargetSlot = isHit && sIdx === 1;
        const isEmpty = slLabel === 'empty';
        const stroke = isTargetSlot
          ? sorted
            ? ROLE.bad
            : ROLE.good
          : isEmpty
            ? COSMOS.dim
            : ROLE.r2;
        const fill = isTargetSlot
          ? sorted
            ? '#33101d'
            : '#0f2d26'
          : isEmpty
            ? '#0b101d'
            : '#102438';
        nodes.push(
          glassCell(cx, pg.cy, 184, 82, stroke, {
            fill,
            glow: isTargetSlot ? 12 * pulse : isEmpty ? 0 : 4,
            dash: isEmpty ? [8, 6] : undefined,
          }),
          txt(
            `s${sIdx}: ${slLabel}`,
            cx,
            pg.cy,
            26,
            isTargetSlot ? (sorted ? ROLE.bad : ROLE.good) : isEmpty ? COSMOS.dim : COSMOS.ink,
            'mono',
          ),
        );
      });
    });

    // Glowing indirection arc from entry 1 stopping cleanly left of "Page N" labels
    const destY = sorted ? 166 : 42;
    nodes.push(
      glowingArc([-420, 42], [-210, destY], sorted ? 38 : -18, {
        color: sorted ? ROLE.bad : ROLE.good,
        width: 4.0,
        opacity: 0.92,
      }),
    );

    // Bottom status / length formula panel
    if (lenVis > 0.05) {
      nodes.push(
        glassCell(0, 342, 1660, 114, ROLE.good, { fill: '#0d2324', glow: 8, opacity: lenVis }),
        txt(
          `KV len = ${PAGE_SIZE} × (3 - 1) + 1 = 9 keys   (2 full pages + 1 tail slot)`,
          0,
          318,
          30,
          ROLE.good,
          'mono',
        ).opacity(lenVis),
        txt(
          'CPU check rejects: empty list, negative page IDs, or tail outside 1..4',
          0,
          366,
          26,
          COSMOS.ink,
          'sans',
        ).opacity(lenVis),
      );
    } else if (sorted && diag > 0.5) {
      nodes.push(
        glassCell(0, 342, 1660, 114, ROLE.bad, { fill: '#2c101b', glow: 9 }),
        txt(
          'k5 lookup -> entry 1, slot 1 -> Page 6, slot 1 = EMPTY!',
          0,
          318,
          32,
          ROLE.bad,
          'mono',
        ).glow(6, ROLE.bad),
        txt(
          'Address is in bounds, but sorting swapped which page is second',
          0,
          366,
          26,
          COSMOS.ink,
          'sans',
        ),
      );
    } else {
      nodes.push(
        glassCell(0, 342, 1660, 114, COSMOS.gold, { fill: '#141d34', glow: 7 }),
        txt(
          sorted
            ? 'Sorted list changes entry 1 from Page 14 to Page 6...'
            : 'Restored [3, 14, 6]: entry 1, slot 1 lands back on k5',
          0,
          342,
          30,
          sorted ? COSMOS.gold : ROLE.good,
          'mono',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('fi-page-permutation-sort', () =>
    s.play(isSorted.to(1, { duration: remainDuration(c, 'fi-page-permutation-sort', 0.45) })),
  );
  c.after('fi-page-permutation-wrongpage', () =>
    s.play(showEmpty.to(1, { duration: remainAfter(c, 'fi-page-permutation-wrongpage', 0.4) })),
  );
  c.on('fi-page-permutation-repair', () => {
    s.play(isSorted.to(0, { duration: remainDuration(c, 'fi-page-permutation-repair', 0.45) }));
    s.play(showEmpty.to(0, { duration: remainDuration(c, 'fi-page-permutation-repair', 0.3) }));
  });
  c.on('pages-length', () =>
    s.play(showLength.to(1, { duration: remainDuration(c, 'pages-length', 0.45) })),
  );
}
