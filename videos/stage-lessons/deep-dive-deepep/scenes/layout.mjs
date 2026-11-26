// Scene 04: Aligned storage contains gaps that have no source token.
// Counts [3, 1], alignment 1 -> 4, starts [0, 4], endpoints [3, 5], capacity 8, rejects gap slot 3.
import {
  COSMOS,
  LAYOUT_ALIGNED4,
  LAYOUT_UNALIGNED,
  ROLE,
  aura,
  buildAlignedSlotBuffer3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function layout(s, c) {
  const phase = s.value(0);
  const alignMode = s.value(0); // 0 = unaligned (4 slots), 1 = aligned 4 (8 slots)
  const focusSlot = s.value(0);
  const revealEight = s.value(0);
  const revealReject = s.value(0);

  const bgAura = aura(470, 12, 500, '#5ce1e622', '#ff6b8b1a');
  const { view: rig3d } = buildAlignedSlotBuffer3d(alignMode, focusSlot, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Aligned Storage', 'Has Padding Gaps'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.nvlink,
    eyebrow: 'EXPANDED EXPERT LAYOUT · COUNTS [3, 1]',
    subtitle: 'Valid endpoints and allocated capacity are different numbers',
  });

  const live = guardedDynamic(1, () => {
    const isAligned = Math.round(alignMode.value) >= 1;
    const showEight = Math.round(revealEight.value) >= 1;
    const isRejected = Math.round(revealReject.value) >= 1;
    const L = isAligned ? LAYOUT_ALIGNED4 : LAYOUT_UNALIGNED;
    const nSlots = L.capacity;
    const slotW = isAligned ? 96 : 190;
    const gap = 8;
    const startX = -850 + slotW * 0.5;

    const nodes = [
      txt('3D SYMMETRIC BUFFER SLOTS (ALIGN 4)', 470, -415, 26, ROLE.nvlink, 'mono').glow(
        5,
        ROLE.nvlink,
      ),
      txt(
        isRejected
          ? 'Slot 3 rejected: no source token identity'
          : 'Cyan: valid tokens  ·  Rose: alignment gaps',
        470,
        435,
        26,
        isRejected ? ROLE.bad : COSMOS.muted,
        'mono',
      ),
      txt(
        `Alignment ${L.alignment}  ·  starts [${L.starts.join(', ')}]  ·  endpoints [${L.endpoints.join(', ')}]`,
        -860,
        -125,
        26,
        ROLE.token,
        'mono',
        'left',
      ),
    ];

    for (let i = 0; i < nSlots; i++) {
      const cx = startX + i * (slotW + gap);
      const valid = L.valid[i];
      const badSlot = isRejected && i === 3;
      const col = badSlot ? ROLE.bad : valid ? ROLE.nvlink : COSMOS.dim;
      const fill = badSlot ? '#3b1222' : valid ? '#0e2c3b' : '#121726';
      nodes.push(
        txt(`s${i}`, cx, -64, 26, COSMOS.muted, 'mono'),
        rect(slotW, 92, {
          fill,
          stroke: col,
          width: badSlot ? 3.2 : 2.2,
          radius: 8,
          dash: valid || badSlot ? undefined : [6, 5],
        }).at(cx, 12),
        txt(valid ? L.inverse.get(i) : 'gap', cx, 12, 28, col, 'mono'),
      );
    }

    // Inverse map strip
    const invText = [...L.inverse].map(([slot, tok]) => `${slot}->${tok}`).join('   ');
    nodes.push(txt(`Inverse map: ${invText}`, -860, 122, 26, ROLE.nvlink, 'mono', 'left'));

    // Summary readout
    const capReady = !isAligned || showEight;
    nodes.push(
      glassCell(-440, 232, 820, 88, isRejected ? ROLE.bad : capReady ? ROLE.good : COSMOS.dim, {
        fill: isRejected ? '#2c101a' : '#0e2028',
        glow: 7,
      }),
      txt(
        isRejected
          ? 'Lookup slot 3 -> REJECTED (no source ID)'
          : capReady
            ? `Valid rows: ${L.valid.filter(Boolean).length}   ·   Allocated slots: ${L.capacity}`
            : 'Computing aligned capacity...',
        -440,
        232,
        28,
        isRejected ? ROLE.bad : capReady ? ROLE.good : COSMOS.muted,
        'mono',
      ),
      txt(
        isRejected
          ? 'Zeroing gaps helps kernels, never creates real tokens'
          : 'No-CPU-sync consumers must slice strictly by valid ranges',
        -860,
        348,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('layout-beat-1-focus-1', () =>
    s.play(focusSlot.to(2, { duration: remainDuration(c, 'layout-beat-1-focus-1', 0.8) })),
  );
  c.on('layout-beat-2-focus-1', () => {
    const dur = remainDuration(c, 'layout-beat-2-focus-1', 0.65);
    s.play(alignMode.to(1, { duration: dur }));
    s.play(focusSlot.to(4, { duration: dur }));
  });
  c.after('dep-result-layout-eight', () =>
    s.play(revealEight.to(1, { duration: remainAfterDuration(c, 'dep-result-layout-eight', 0.3) })),
  );
  c.on('layout-beat-3-focus-1', () =>
    s.play(focusSlot.to(3, { duration: remainDuration(c, 'layout-beat-3-focus-1', 0.6) })),
  );
  c.after('dep-result-layout-reject', () =>
    s.play(
      revealReject.to(1, { duration: remainAfterDuration(c, 'dep-result-layout-reject', 0.3) }),
    ),
  );
}
