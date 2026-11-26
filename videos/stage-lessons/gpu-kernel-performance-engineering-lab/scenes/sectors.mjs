// Scene 05: A warp can carry the same payload across more sectors
// Orbiting 3D warp-to-sector manifold: 4 aligned sectors (100%) -> 32 scattered naive store sectors (12.5%) -> 4 coalesced sectors (100%).
import {
  COSMOS,
  ROLE,
  aura,
  buildSectorStream3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainDuration,
  runPhase,
  sectorTransition,
  txt,
} from '../parts.mjs';

export default function sectors(s, c) {
  const phase = s.value(0);
  const coalescedVal = s.value(1); // 1 = 4 sectors, 0 = 32 scattered sectors
  const focusAligned = s.value(0);
  const shrinkLabel = s.value(0);

  const bgAura = aura(420, 20, 560, '#5ce1e622', '#ff6b8b18');
  const { view: stream3d } = buildSectorStream3d(coalescedVal, phase, { x: 430, y: 15, unit: 98 });

  const title = heroTitle(['Same 128-Byte Payload,', 'More Sectors'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.output,
    eyebrow: 'WARP COALESCING · 32-BYTE SECTORS',
  });

  const live = guardedDynamic(1, () => {
    const co = coalescedVal.value;
    const converted = Math.round(co * 32);
    const snap = sectorTransition(converted);
    const isCoalesced = snap.sectors.length <= 4;
    const col = isCoalesced ? ROLE.good : ROLE.bad;
    const pct = (snap.fraction * 100).toFixed(1);

    const nodes = [
      txt('3D WARP → SECTOR STREAM', 430, -405, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt(
        isCoalesced
          ? '32 adjacent lanes → 4 sectors (128 B / 128 B)'
          : 'Stride N = 4096 → 32 distinct sectors (128 B / 1024 B)',
        430,
        420,
        26,
        col,
        'mono',
      ),

      // Left diagnostic telemetry
      txt(
        isCoalesced
          ? shrinkLabel.value > 0.3
            ? 'COALESCED OUTPUT STORE'
            : 'ALIGNED INPUT LOAD (lane × 4 B)'
          : 'NAIVE COLUMN STORE (lane × 4096 × 4 B)',
        -855,
        -200,
        28,
        col,
        'mono',
        'left',
      ),

      // Fixed payload readout
      txt('USEFUL PAYLOAD (FIXED)', -855, -125, 26, COSMOS.muted, 'mono', 'left'),
      glassCell(-625, -45, 460, 86, ROLE.input, { fill: '#0f1d36', glow: 6 }),
      txt(`${snap.payload} bytes (32 floats)`, -625, -45, 32, COSMOS.ink, 'mono'),

      // Touched sectors bar
      txt('TOUCHED 32-BYTE SECTORS', -855, 42, 26, COSMOS.muted, 'mono', 'left'),
      glassCell(-475, 118, 760, 82, col, {
        fill: isCoalesced ? '#0e2624' : '#2c111e',
        glow: 8,
      }),
      rect(Math.max(24, (snap.sectors.length / 32) * 720), 54, {
        fill: col,
        stroke: null,
        radius: 6,
      })
        .at(-835 + Math.max(24, (snap.sectors.length / 32) * 720) * 0.5, 118)
        .opacity(0.35),
      txt(
        `${snap.sectors.length} sectors · ${snap.sectors.length * 32} B touched`,
        -475,
        118,
        30,
        col,
        'mono',
      ),

      // Payload fraction readout
      txt('PAYLOAD FRACTION', -855, 206, 26, COSMOS.muted, 'mono', 'left'),
      txt(`${pct}%`, -855, 286, 68, col, 'mono', 'left').glow(9, col),

      txt(
        'Access-stage address model · hardware counters measure DRAM traffic',
        -855,
        390,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, stream3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, stream3d, { theta: -0.25, phi: 0.9 });

  c.on('sectors-beat-1-focus-1', () =>
    s.play(focusAligned.to(1, { duration: remainDuration(c, 'sectors-beat-1-focus-1', 0.4) })),
  );
  c.on('sectors-beat-1-focus-2', () =>
    s.play(focusAligned.to(1, { duration: remainDuration(c, 'sectors-beat-1-focus-2', 0.35) })),
  );
  c.on('sectors-naive-store', () =>
    s.play(coalescedVal.to(0, { duration: remainDuration(c, 'sectors-naive-store', 1.1) })),
  );
  c.on('sectors-beat-2-focus-1', () =>
    s.play(coalescedVal.to(1, { duration: remainDuration(c, 'sectors-beat-2-focus-1', 1.1) })),
  );
  c.on('sectors-beat-2-focus-2', () =>
    s.play(shrinkLabel.to(1, { duration: remainDuration(c, 'sectors-beat-2-focus-2', 0.4) })),
  );
}
