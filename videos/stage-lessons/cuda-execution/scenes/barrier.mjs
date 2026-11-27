// Scene 10: Can thread zero trust the sum? Unsynchronized shared-memory race, __syncthreads() replay, and cross-block second kernel.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  TOKEN_VALUES,
  WRITE_TIMES,
  afterDuration,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  rule,
  sharedTrace,
  txt,
} from '../parts.mjs';

export default function barrier(s, c) {
  const showPart1 = s.value(1); // Beats 0 & 1: race -> replay with barrier
  const barrierMode = s.value(0); // 0=unsynced race, 1=barrier replay
  const simTime = s.value(0);
  const readRevealed = s.value(0);

  const showPart2 = s.value(0); // Beat 2: Block A + Block B -> second kernel -> 2.625
  const blockBLit = s.value(0);
  const joinProg = s.value(0);
  const poolLit = s.value(0);

  const bgAura = aura(0, 20, 560, '#ff6b8b20', '#5ce1e616');

  const title = heroTitle(['Block Barriers', 'and Kernel Boundaries'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.rose,
    eyebrow: 'SHARED-MEMORY SYNCHRONIZATION · __syncthreads()',
  });

  const eqPool = glowTex('\\frac{10 + 11}{8} = 2.625', {
    x: 0,
    y: 374,
    size: 48,
    color: COSMOS.emerald,
  });

  const part1 = guardedDynamic(showPart1, (a) => {
    const isBarrier = barrierMode.value > 0.5;
    const t = simTime.value;
    const rev = readRevealed.value;
    const trace = sharedTrace(t, isBarrier);

    const nodes = [
      txt(
        isBarrier
          ? 'REPLAY WITH __syncthreads() · WAIT FOR ALL 4 ARRIVALS'
          : 'BLOCK A · UNSYNCHRONIZED WRITES TO shared[0..3]',
        -855,
        -205,
        26,
        isBarrier ? COSMOS.emerald : COSMOS.rose,
        'mono',
        'left',
      ).opacity(a),
    ];

    const colXs = [-600, -200, 200, 600];
    TOKEN_VALUES.slice(0, 4).forEach((val, i) => {
      const cx = colXs[i];
      const landed = trace.slots[i] !== null;
      const frac = Math.max(0, Math.min(1, t / WRITE_TIMES[i]));
      nodes.push(
        glassCell(cx, -95, 290, 92, COSMOS.blue, { fill: '#0f182e', glow: 6, opacity: a }),
        txt(`T${i} · val ${val}`, cx, -92, 34, COSMOS.ink, 'mono').opacity(a),
        glowingArc([cx, -45], [cx, 65], 0, {
          color: landed ? COSMOS.cyan : COSMOS.blue,
          width: 3.2,
          opacity: 0.85 * a,
        }),
        glassCell(cx, 115, 290, 96, landed ? COSMOS.cyan : COSMOS.rule, {
          fill: landed ? '#0e2230' : '#0c111e',
          glow: landed ? 8 : 0,
          opacity: a,
        }),
        txt(
          landed ? String(val) : '?',
          cx,
          118,
          40,
          landed ? COSMOS.cyan : COSMOS.dim,
          'mono',
        ).opacity(a),
        txt(`shared[${i}]`, cx, 190, 26, COSMOS.muted, 'mono').opacity(a),
      );
      if (frac > 0.02 && frac < 0.99) {
        nodes.push(
          glowDot(cx, -45 + frac * 110, { radius: 7, color: COSMOS.gold, glow: 11, opacity: a }),
        );
      }
    });

    // Barrier wall line across all 4 slots when in barrier mode
    if (isBarrier) {
      const allIn = trace.arrivals === 4;
      nodes.push(
        rule(-780, 232, 780, 232, allIn ? COSMOS.emerald : COSMOS.gold, 5)
          .glow(8, allIn ? COSMOS.emerald : COSMOS.gold)
          .opacity(a),
        txt(
          `__syncthreads() barrier: ${trace.arrivals} / 4 arrived`,
          -780,
          268,
          26,
          allIn ? COSMOS.emerald : COSMOS.gold,
          'mono',
          'left',
        ).opacity(a),
      );
    }

    // Bottom reader box
    if (!isBarrier) {
      const raced = trace.attempted;
      nodes.push(
        glassCell(0, 340, 1560, 112, raced ? COSMOS.rose : COSMOS.rule, {
          fill: raced ? '#24111c' : '#101524',
          glow: raced ? 10 : 0,
          opacity: a,
        }),
        txt(
          raced
            ? 'Thread 0 reads early at t = 0.5  ->  DATA RACE  ·  sum = ? (undefined)'
            : 'Thread 0 waiting to read shared[0..3]...',
          0,
          342,
          32,
          raced ? COSMOS.rose : COSMOS.muted,
          'mono',
        )
          .glow(6, raced ? COSMOS.rose : COSMOS.muted)
          .opacity(a),
      );
    } else {
      const safe = rev > 0.5 && trace.result !== null;
      nodes.push(
        glassCell(0, 355, 1560, 112, safe ? COSMOS.emerald : COSMOS.gold, {
          fill: safe ? '#0e2522' : '#181822',
          glow: safe ? 10 : 6,
          opacity: a,
        }),
        txt(
          safe
            ? 'Reader released after barrier: [3, 1, 4, 2]  ->  Block A sum = 10'
            : 'Reader waits behind block barrier until all 4 stores complete',
          0,
          358,
          32,
          safe ? COSMOS.emerald : COSMOS.gold,
          'mono',
        )
          .glow(6, safe ? COSMOS.emerald : COSMOS.gold)
          .opacity(a),
      );
    }

    return group(...nodes);
  });

  // Part 2: Cross-block synchronization via second kernel in same CUDA stream
  const part2 = guardedDynamic(showPart2, (a) => {
    const bLit = blockBLit.value;
    const jp = joinProg.value;
    const pl = poolLit.value;

    const nodes = [
      txt(
        'BLOCK BARRIERS ARE BLOCK-SCOPED · SECOND KERNEL IN SAME STREAM JOINS SUBTOTALS',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      glassCell(-470, -35, 540, 148, COSMOS.cyan, { fill: '#0e2130', glow: 8, opacity: a }),
      txt('BLOCK A (OWN SHARED + BARRIER)', -470, -72, 26, COSMOS.muted, 'mono').opacity(a),
      txt('subtotal = 10', -470, -10, 44, COSMOS.cyan, 'mono').opacity(a),

      glassCell(470, -35, 540, 148, bLit > 0.5 ? COSMOS.violet : COSMOS.rule, {
        fill: '#19142e',
        glow: bLit > 0.5 ? 8 : 0,
        opacity: a,
      }),
      txt('BLOCK B (OWN SHARED + BARRIER)', 470, -72, 26, COSMOS.muted, 'mono').opacity(a),
      txt('subtotal = 11', 470, -10, 44, COSMOS.violet, 'mono').opacity(bLit * a),

      glowingArc([-470, 42], [-140, 145], 24, {
        color: COSMOS.cyan,
        width: 3.6,
        opacity: Math.max(0.25, jp) * a,
      }),
      glowingArc([470, 42], [140, 145], 24, {
        color: COSMOS.violet,
        width: 3.6,
        opacity: Math.max(0.25, jp) * a,
      }),

      glassCell(
        0,
        195,
        820,
        128,
        pl > 0.5 ? COSMOS.emerald : jp > 0.5 ? COSMOS.gold : COSMOS.rule,
        {
          fill: '#0e2226',
          glow: pl > 0.5 ? 10 : 7,
          opacity: a,
        },
      ),
      txt('KERNEL 2 ON SAME STREAM', 0, 160, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        pl > 0.5
          ? 'Device pooled mean = 2.625'
          : jp > 0.5
            ? 'Combined device sum = 21'
            : 'Awaiting both block outputs',
        0,
        214,
        38,
        pl > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    if (jp > 0.05 && jp < 0.96) {
      nodes.push(
        glowDot(-470 + 330 * jp, 42 + 103 * jp, {
          radius: 7,
          color: COSMOS.cyan,
          glow: 11,
          opacity: a,
        }),
        glowDot(470 - 330 * jp, 42 + 103 * jp, {
          radius: 7,
          color: COSMOS.violet,
          glow: 11,
          opacity: a,
        }),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, part1, part2);

  c.on('early-writes', () => s.play(simTime.to(0.48, { duration: 0.7 })));
  c.on('early-reader', () => s.play(simTime.to(1.75, { duration: 0.75 })));

  c.on('barrier-replay', () => {
    s.play(barrierMode.to(1, { duration: 0.05 }));
    s.play(simTime.to(0, { duration: 0.05 }));
  });
  c.on('barrier-publish', () => s.play(simTime.to(2.0, { duration: 0.9 })));
  c.after('barrier-read', () => {
    const dur = afterDuration(c, 'barrier-read', 0.45);
    s.play(simTime.to(2.15, { duration: dur }));
    s.play(readRevealed.to(1, { duration: dur }));
  });

  c.on('second-subtotal', () => {
    s.play(
      par(
        showPart1.to(0, { duration: 0.2 }),
        delay(showPart2.to(1, { duration: 0.25 }), 0.22),
        delay(blockBLit.to(1, { duration: 0.4 }), 0.25),
      ),
    );
  });
  c.on('join-subtotals', () => s.play(joinProg.to(1, { duration: 0.65 })));
  c.on('pool-device', () => {
    const dur = remainDuration(c, 'pool-device', 0.55);
    s.play(poolLit.to(1, { duration: dur }));
  });
  c.show('pool-device', eqPool, { fade: 0.35 });
}
