// Scene 19: Plan a finite buffer before launching concurrent work.
// Capacity 12 rows; Session A holds 8 live rows, Session B asks for 5 -> 8 + 5 = 13 > 12 (1 row spills).
import {
  COSMOS,
  ROLE,
  aura,
  buildAlignedSlotBuffer3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function bufferCapacity(s, c) {
  const phase = s.value(0);
  const alignVal = s.value(0.5);
  const focusSlot = s.value(0);
  const allocated = s.value(0);
  const concurrent = s.value(0);

  const bgAura = aura(470, 12, 500, '#fb923c24', '#ff6b8b1e');
  const { view: rig3d } = buildAlignedSlotBuffer3d(alignVal, focusSlot, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Plan a Finite Buffer', 'Before Overlap'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.brand,
    eyebrow: 'SYMMETRIC BUFFER ENVELOPE · CAPACITY 12',
    subtitle: 'Size up front from max tokens, hidden width, top-k & topology',
  });

  const live = guardedDynamic(1, () => {
    const isAlloc = Math.round(allocated.value) >= 1;
    const isConc = Math.round(concurrent.value) >= 1;

    const nodes = [
      txt('3D FIXED-ENVELOPE SYMMETRIC SLOTS', 470, -415, 26, ROLE.brand, 'mono').glow(
        5,
        ROLE.brand,
      ),
      txt(
        isConc
          ? 'Session A (8) + Session B (5) = 13 > 12 capacity!'
          : 'get_buffer_size_hint() -> reserve bytes up front',
        470,
        435,
        26,
        isConc ? ROLE.bad : COSMOS.muted,
        'mono',
      ),
      txt('12-SLOT FINITE BUFFER', -860, -135, 26, ROLE.token, 'mono', 'left'),
    ];

    // 12 slots in 2 rows of 6 + 1 spill slot when concurrent
    for (let i = 0; i < 12; i++) {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const cx = -790 + col * 136;
      const cy = -58 + row * 94;
      const inA = isConc && i < 8;
      const inB = isConc && i >= 8;
      const border = inA ? ROLE.rank0 : inB ? ROLE.brand : isAlloc ? ROLE.nvlink : COSMOS.dim;
      const fill = inA ? '#14335e' : inB ? '#422312' : '#0f1628';
      nodes.push(
        rect(122, 72, { fill, stroke: border, width: 2.2, radius: 7 }).at(cx, cy),
        txt(inA ? `A:${i}` : inB ? `B:${i - 8}` : `s${i}`, cx, cy, 26, border, 'mono'),
      );
    }

    if (!isConc) {
      nodes.push(
        glassCell(-440, 200, 820, 96, isAlloc ? ROLE.nvlink : COSMOS.dim, {
          fill: '#0d1d2b',
          glow: isAlloc ? 7 : 0,
        }),
        txt(
          isAlloc ? 'Buffer constructed: 12-row storage reserved' : 'Size hint -> plan 12 rows',
          -440,
          200,
          28,
          isAlloc ? ROLE.nvlink : COSMOS.muted,
          'mono',
        ),
        txt(
          'V2 can need more memory than V1 (include scratch space)',
          -860,
          320,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    } else {
      nodes.push(
        glowTex(String.raw`8 + 5 = 13 > 12 \;\; (\text{1 row spills!})`, {
          x: -440,
          y: 175,
          size: 38,
          color: ROLE.bad,
          glow: 7,
        }),
        glassCell(-440, 286, 820, 96, ROLE.bad, { fill: '#2c101a', glow: 7 }),
        txt('Only 4 slots free · wait for reader or reserve more', -440, 286, 26, ROLE.bad, 'mono'),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-buffer-capacity-b0', () => {
    const dur = remainDuration(c, 'de-buffer-capacity-b0', 0.75);
    s.play(allocated.to(1, { duration: dur }));
    s.play(focusSlot.to(4, { duration: dur }));
  });
  c.on('de-buffer-capacity-b1', () => {
    const dur = remainDuration(c, 'de-buffer-capacity-b1', 0.75);
    s.play(concurrent.to(1, { duration: dur }));
    s.play(focusSlot.to(7, { duration: dur }));
  });
}
