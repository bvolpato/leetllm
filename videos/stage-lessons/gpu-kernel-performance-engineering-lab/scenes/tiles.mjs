// Scene 09: Use shared storage to exchange the access order
// Orbiting 3D shared-memory transpose cube + 4x4 full tile -> partial 3x3 boundary tile (all 16 threads hit unconditional barrier).
import {
  COSMOS,
  ROLE,
  aura,
  buildTransposeCube3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  sharedTileSnapshot,
  txt,
} from '../parts.mjs';

export default function tiles(s, c) {
  const phase = s.value(0);
  const stageVal = s.value(0); // 0=load, 1=barrier, 2=transposed read
  const loadProg = s.value(0);
  const barrierProg = s.value(0);
  const readProg = s.value(0);
  const partialMode = s.value(0);
  const allArrive = s.value(0);

  const bgAura = aura(430, 15, 560, '#ffd1661e', '#5ce1e61a');
  const { view: cube3d } = buildTransposeCube3d(stageVal, phase, { x: 445, y: 15, unit: 96 });

  const title = heroTitle(['Shared Storage Swaps', 'Access Order'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.shared,
    eyebrow: 'TILED TRANSPOSE · __syncthreads()',
  });

  const live = guardedDynamic(1, () => {
    const isPartial = partialMode.value > 0.5;
    const lp = loadProg.value;
    const bp = barrierProg.value;
    const rp = readProg.value;
    const aa = allArrive.value;

    // Derive exact counts from sharedTileSnapshot model
    const fullRef = sharedTileSnapshot(isPartial ? 1 : 0, 1);
    const totalValid = fullRef.entries.length; // 16 or 9
    const loaded = Math.min(totalValid, Math.floor(lp * (totalValid + 0.99)));
    const arrived = isPartial ? (aa > 0.3 ? 16 : 9) : Math.min(16, Math.floor(bp * 16.99));
    const read = Math.min(totalValid, Math.floor(rp * (totalValid + 0.99)));

    const nodes = [
      txt('3D SHARED-MEMORY TRANSPOSE CUBE', 445, -405, 26, COSMOS.gold, 'mono').glow(
        5,
        COSMOS.gold,
      ),
      txt(
        'Global A (blue) → Shared Tile (gold) → Global B (cyan)',
        445,
        420,
        26,
        COSMOS.muted,
        'sans',
      ),

      // Left: Compact 4x4 Shared Tile grid (showing active vs out-of-bounds slots in partial mode)
      txt(
        isPartial ? 'PARTIAL 3×3 BOUNDARY TILE (4×4 BLOCK)' : 'SHARED TILE[ty][tx] → TILE[tx][ty]',
        -490,
        -215,
        28,
        isPartial ? ROLE.warn : ROLE.shared,
        'mono',
      ),
    ];

    const cellS = 98;
    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        const cx = -645 + col * 106;
        const cy = -120 + r * 106;
        const valid = !isPartial || (r < 3 && col < 3);
        const val = r * 4 + col;
        const isLoaded = valid && (isPartial || r * 4 + col < loaded);
        const isRead = valid && (isPartial || r * 4 + col < read);
        const border = !valid
          ? COSMOS.rule
          : isRead
            ? ROLE.output
            : isLoaded
              ? ROLE.shared
              : ROLE.input;
        const fill = !valid ? '#0b101d' : isRead ? '#0e2d3e' : isLoaded ? '#292010' : '#0f1c35';
        nodes.push(
          glassCell(cx, cy, cellS, cellS, border, {
            fill,
            dash: !valid ? [6, 5] : undefined,
            glow: valid && isRead ? 6 : 2,
          }),
          txt(
            valid ? String(val) : 'skip',
            cx,
            cy,
            valid ? 34 : 26,
            !valid ? COSMOS.dim : isRead ? ROLE.output : COSMOS.ink,
            'mono',
          ),
        );
      }
    }

    // Pipeline telemetry below the 4x4 tile
    nodes.push(
      txt(
        `Loads ${isPartial ? totalValid : loaded}/${totalValid} · Barrier ${arrived}/16 · Reads ${isPartial ? totalValid : read}/${totalValid}`,
        -490,
        288,
        28,
        arrived === 16 ? ROLE.good : ROLE.gold,
        'mono',
      ).glow(5, arrived === 16 ? ROLE.good : ROLE.gold),
      txt(
        isPartial
          ? 'Guards protect loads/stores · __syncthreads() stays OUTSIDE guards'
          : 'Both global row reads and global row writes are coalesced',
        -490,
        365,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, cube3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, cube3d, { theta: -0.18, phi: 0.92 });

  c.on('tile-load-rows', () => {
    s.play(loadProg.to(1, { duration: remainDuration(c, 'tile-load-rows', 0.85) }));
  });
  c.on('tile-wait-producers', () => {
    s.play(stageVal.to(1, { duration: 0.35 }));
    s.play(barrierProg.to(1, { duration: remainDuration(c, 'tile-wait-producers', 0.65) }));
  });
  c.on('tile-transposed-reads', () => {
    s.play(stageVal.to(2, { duration: 0.35 }));
    s.play(readProg.to(1, { duration: remainDuration(c, 'tile-transposed-reads', 0.9) }));
  });
  c.on('tile-matched-producers', () => {
    s.play(partialMode.to(1, { duration: remainDuration(c, 'tile-matched-producers', 0.45) }));
  });
  c.on('tile-all-threads-arrive', () => {
    s.play(allArrive.to(1, { duration: remainDuration(c, 'tile-all-threads-arrive', 0.45) }));
  });
}
