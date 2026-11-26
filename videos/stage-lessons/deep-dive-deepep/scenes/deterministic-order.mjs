// Scene 10: Sort the data and the coordinates that identify it.
// Deterministic mode sorts rows WITH source metadata (and updates slot pointers in expanded mode).
import {
  COSMOS,
  ROLE,
  aura,
  buildAlignedSlotBuffer3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function deterministicOrder(s, c) {
  const phase = s.value(0);
  const alignVal = s.value(1);
  const focusSlot = s.value(0);
  const sortProg = s.value(0);
  const expandedPtrs = s.value(0);

  const bgAura = aura(470, 12, 500, '#5ce1e622', '#a78bfa1c');
  const { view: rig3d } = buildAlignedSlotBuffer3d(alignVal, focusSlot, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Sort Values and', 'Source Coordinates'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.nvlink,
    eyebrow: 'DETERMINISTIC MODE · REPRODUCIBLE SLOTS',
    subtitle: 'Moving values alone breaks combine; source metadata moves too',
  });

  const arrival = [
    { id: 'c', val: 30, target: 2, col: ROLE.brand },
    { id: 'a', val: 10, target: 0, col: ROLE.nvlink },
    { id: 'd', val: 40, target: 3, col: ROLE.meta },
    { id: 'b', val: 20, target: 1, col: ROLE.rank0 },
  ];
  const sorted = [
    { id: 'a', val: 10, col: ROLE.nvlink },
    { id: 'b', val: 20, col: ROLE.rank0 },
    { id: 'c', val: 30, col: ROLE.brand },
    { id: 'd', val: 40, col: ROLE.meta },
  ];

  const live = guardedDynamic(1, () => {
    const isSorted = Math.round(sortProg.value) >= 1;
    const isExp = Math.round(expandedPtrs.value) >= 1;

    const nodes = [
      txt('3D SOURCE-GLOBAL SORTED SEGMENTS', 470, -415, 26, ROLE.nvlink, 'mono').glow(
        5,
        ROLE.nvlink,
      ),
      txt(
        isExp
          ? 'Padding stays outside valid data · pointers updated'
          : 'Sort rows with scales, expert IDs, gates & source meta',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
      txt('ARRIVAL ORDER', -675, -135, 26, COSMOS.muted, 'mono'),
      txt('SOURCE-GLOBAL ORDER', -215, -135, 26, ROLE.nvlink, 'mono'),
    ];

    arrival.forEach((item, idx) => {
      const y = -68 + idx * 82;
      nodes.push(
        rect(330, 62, { fill: '#0e172a', stroke: item.col, width: 2.2, radius: 8 }).at(-675, y),
        txt(`${item.id} · val ${item.val}`, -675, y, 27, item.col, 'mono'),
      );
      if (isSorted) {
        const ty = -68 + item.target * 82;
        nodes.push(line([-505, y], [-385, ty], { stroke: item.col, width: 2.6 }).opacity(0.85));
      }
    });

    sorted.forEach((item, idx) => {
      const y = -68 + idx * 82;
      const col = isSorted ? ROLE.good : COSMOS.dim;
      nodes.push(
        rect(340, 62, {
          fill: isSorted ? '#0d221c' : '#101524',
          stroke: col,
          width: 2.2,
          radius: 8,
        }).at(-215, y),
        txt(
          isSorted ? `slot ${idx} <- ${item.id} · ${item.val}` : `slot ${idx} · pending`,
          -215,
          y,
          26,
          col,
          'mono',
        ),
      );
    });

    nodes.push(
      glassCell(-440, 290, 840, 96, isExp ? ROLE.token : ROLE.nvlink, {
        fill: '#0e1c2a',
        glow: 7,
      }),
      txt(
        isExp
          ? 'Time sorted path separately: adds epilogue work'
          : 'Expanded mode sorts per expert & updates ptrs',
        -440,
        290,
        26,
        isExp ? ROLE.token : ROLE.nvlink,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-deterministic-order-b0', () => {
    const dur = remainDuration(c, 'de-deterministic-order-b0', 0.9);
    s.play(sortProg.to(1, { duration: dur }));
    s.play(focusSlot.to(3, { duration: dur }));
  });
  c.on('de-deterministic-order-b1', () => {
    const dur = remainDuration(c, 'de-deterministic-order-b1', 0.7);
    s.play(expandedPtrs.to(1, { duration: dur }));
    s.play(focusSlot.to(4, { duration: dur }));
  });
}
