// Scene 22: Read the historical experiment with its denominators.
// April EP8 PR: Flash 1 tok = 56.5 us (1.96x -> 51% time / 49% cut);
// Flash 512 tok = 146.5 us -> 3072 rows * 6HI / 146.5 us ~ 1055 TFLOP/s (rounded 1056); Pro + missing env fields.
import {
  COSMOS,
  FLASH_1_BASE_US,
  FLASH_1_REDUCTION,
  FLASH_1_SHARE,
  FLASH_1_SPEEDUP,
  FLASH_1_US,
  FLASH_512_TFLOPS,
  FLASH_512_US,
  FLASH_BALANCED_ROWS,
  ROLE,
  aura,
  buildMegaMoeRing3d,
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

export default function benchmarkReceipt(s, c) {
  const phase = s.value(0);
  const overlap3d = s.value(0.5);
  const step = s.value(0); // 1=56.5us 1.96x, 2=51%/49%, 3=512@146.5us, 4=1055 TFLOP/s, 5=Pro, 6=missing fields

  const bgAura = aura(445, 20, 520, '#ffd16620', '#5ce1e61a');
  const { view: ring3d } = buildMegaMoeRing3d(overlap3d, phase, { x: 455, y: 15, unit: 94 });

  const title = heroTitle(['Read the Benchmark', 'With Its Denominators'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.gold,
    eyebrow: 'APRIL EP8 BENCHMARK · WORK / TIME',
    subtitle: 'Reconstruct ratios and verify every omitted hardware field',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const nodes = [
      txt('3D EP8 8-RANK AVERAGE BENCHMARK', 455, -415, 26, ROLE.gold, 'mono').glow(5, ROLE.gold),
      txt('Table columns = modeled work / elapsed time', 455, 435, 26, COSMOS.muted, 'sans'),
    ];

    // Row 1: Flash 1 tok/rank (56.5 us vs 110.7 us legacy -> 1.96x -> 51% time)
    nodes.push(
      txt('FLASH · 1 SOURCE TOKEN / RANK (EP8)', -860, -172, 26, ROLE.a, 'mono', 'left'),
      rect(520, 38, { fill: '#2a1828', stroke: ROLE.b, width: 2, radius: 5 }).at(-595, -124),
      txt(`Legacy ~${FLASH_1_BASE_US.toFixed(1)} us`, -840, -124, 26, COSMOS.ink, 'mono', 'left'),

      rect(520 * FLASH_1_SHARE, 38, { fill: '#103b31', stroke: ROLE.good, width: 2.2, radius: 5 })
        .at(-855 + 260 * FLASH_1_SHARE, -72)
        .glow(st >= 0.6 ? 8 : 0, ROLE.good),
      txt(
        st >= 1.6
          ? `Mega MoE ${FLASH_1_US} us (${FLASH_1_SPEEDUP}x -> ${Math.round(FLASH_1_SHARE * 100)}% time, -${Math.round(FLASH_1_REDUCTION * 100)}%)`
          : `Mega MoE ${FLASH_1_US} us (${FLASH_1_SPEEDUP}x speedup)`,
        -840,
        -22,
        26,
        ROLE.good,
        'mono',
        'left',
      ),
    );

    // Row 2: Flash 512 tok/rank -> 146.5 us -> 1055 TFLOP/s
    if (st >= 2.6) {
      nodes.push(
        glassCell(-460, 92, 800, 134, st >= 3.6 ? ROLE.c : COSMOS.dim, {
          fill: '#0e2030',
          glow: st >= 3.6 ? 9 : 4,
        }),
        txt(`FLASH · 512 TOK/RANK  ->  ${FLASH_512_US} us`, -830, 50, 26, ROLE.c, 'mono', 'left'),
        txt(
          st >= 3.6
            ? `${FLASH_BALANCED_ROWS}×6HI / ${FLASH_512_US}us ≈ ${Math.round(FLASH_512_TFLOPS)} TFLOP/s (1056)`
            : 'Balanced local rows = 3,072 (2-GEMM model)',
          -830,
          94,
          26,
          st >= 3.6 ? ROLE.gold : COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          'Bandwidth = estimated bytes / elapsed time',
          -830,
          136,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    }

    // Row 3: Pro curve & unresolved environment fields
    if (st >= 4.6) {
      nodes.push(
        glassCell(-460, 258, 800, 134, st >= 5.5 ? ROLE.warn : ROLE.scale, {
          fill: '#201624',
          glow: 8,
        }),
        txt(
          st >= 5.5
            ? 'HARNESS SKIP WARNING + MISSING FIELDS'
            : 'PRO (H=7168, I=3072) + ENV RECEIPT',
          -830,
          216,
          26,
          st >= 5.5 ? ROLE.warn : ROLE.scale,
          'mono',
          'left',
        ),
        txt(
          'Missing: SKU · driver · clocks · topo · warmup',
          -830,
          260,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          st >= 5.5
            ? 'Failed legacy import skips check -> restore & verify!'
            : 'Match outputs on your workload & record env',
          -830,
          302,
          26,
          st >= 5.5 ? ROLE.bad : COSMOS.muted,
          'sans',
          'left',
        ),
      );
    }

    nodes.push(
      txt(
        'Never treat a timing-only run as a verified speedup',
        -860,
        390,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, ring3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, ring3d, { theta: -0.2, phi: 0.94 });

  c.on('br-flash1', () => s.play(step.to(1, { duration: remainDuration(c, 'br-flash1', 0.45) })));
  c.after('br-ratio', () =>
    s.play(step.to(2, { duration: remainAfterDuration(c, 'br-ratio', 0.35) })),
  );
  c.on('br-512', () => {
    const dur = remainDuration(c, 'br-512', 0.5);
    s.play(step.to(3, { duration: dur }));
    s.play(overlap3d.to(1, { duration: dur }));
  });
  c.after('br-tflops', () =>
    s.play(step.to(4, { duration: remainAfterDuration(c, 'br-tflops', 0.35) })),
  );
  c.on('br-pro', () => s.play(step.to(5, { duration: remainDuration(c, 'br-pro', 0.45) })));
  c.on('br-missing', () => s.play(step.to(6, { duration: remainDuration(c, 'br-missing', 0.45) })));
}
