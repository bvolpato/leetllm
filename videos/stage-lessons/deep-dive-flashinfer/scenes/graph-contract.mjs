// Scene 17: Check what a captured replay may change: CUDA Graph fixed addresses vs stale length, CTA grid count mismatch, 0.7.1 MLA wrapper.
import {
  COSMOS,
  ROLE,
  aura,
  delay,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  par,
  remainAfter,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function graphContract(s, c) {
  const phase = s.value(0);
  const showAddr = s.value(1);
  const addrStale = s.value(0);
  const showCta = s.value(0);
  const ctaMismatch = s.value(0);
  const showMla = s.value(0);
  const cuteNote = s.value(0);

  const bgAura = aura(0, 20, 650, '#5ce1e61c', '#ff6b8b1a');

  const title = heroTitle(['Check What Captured', 'Replay May Change'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.r2,
    eyebrow: 'CUDA GRAPHS · WORKSPACE & LAUNCH GRID',
  });

  // View 0: Fixed buffer address 0x7f..A vs updated problem contents
  const addrView = guardedDynamic(showAddr, (a) => {
    const st = addrStale.value > 0.5;
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt(
        'PLAN RUNS OUTSIDE CAPTURE · COMPATIBLE RUN() CAPTURES INSIDE GRAPH',
        0,
        -162,
        26,
        COSMOS.cyan,
        'mono',
      ).opacity(a),

      // Left: fixed metadata buffer
      glassCell(-470, 25, 680, 240, ROLE.r0, { fill: '#10213d', glow: 8, opacity: a }),
      txt('FIXED METADATA BUFFER (ADDR 0xA0)', -470, -52, 26, ROLE.r0, 'mono').opacity(a),
      txt('Reserved: batch=3, max_q=8, max_pages=6', -470, 4, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        st ? 'New contents: tail=2 -> length 10' : 'Initial contents: tail=1 -> length 9',
        -470,
        68,
        28,
        st ? COSMOS.gold : COSMOS.ink,
        'mono',
      ).opacity(a),

      glowingArc([-125, 25], [125, 25], 0, {
        color: st ? ROLE.bad : ROLE.good,
        width: 4.0,
        opacity: 0.9 * a,
      }),

      // Right: captured plan / launch record
      glassCell(470, 25, 680, 240, st ? ROLE.bad : ROLE.good, {
        fill: st ? '#2c101b' : '#0f2824',
        glow: st ? 11 * pulse : 8,
        opacity: a,
      }),
      txt('CAPTURED GRAPH LAUNCH', 470, -52, 26, st ? ROLE.bad : ROLE.good, 'mono').opacity(a),
      txt('Reads fixed buffer addr 0xA0', 470, 4, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        st ? 'STALE: old plan still expects 9 keys!' : 'VALID: plan matches 9 keys',
        470,
        68,
        28,
        st ? ROLE.bad : ROLE.good,
        'mono',
      ).opacity(a),

      glassCell(0, 295, 1620, 120, COSMOS.gold, { fill: '#141c33', glow: 7, opacity: a }),
      txt(
        'Unchanged addresses and tensor shapes never make stale metadata valid',
        0,
        295,
        28,
        COSMOS.gold,
        'sans',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  // View 1: Replan != compile != capture; fixed split size changing CTA count 2 -> 3!
  const ctaView = guardedDynamic(showCta, (a) => {
    const mm = ctaMismatch.value > 0.5;
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt(
        'THREE SEPARATE OPERATIONS:  REPLAN  !=  RECOMPILE  !=  RECAPTURE',
        0,
        -162,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(a),

      // Left: growing KV history requiring 2 -> 3 CTAs under fixed split size
      txt('FIXED SPLIT SIZE -> CTA WORK ASSIGNMENT', -460, -76, 26, ROLE.r2, 'mono').opacity(a),
      glassCell(-690, 35, 200, 130, ROLE.r0, { fill: '#10213d', glow: 6, opacity: a }),
      txt('CTA 0', -690, 35, 30, ROLE.r0, 'mono').opacity(a),
      glassCell(-460, 35, 200, 130, ROLE.r0, { fill: '#10213d', glow: 6, opacity: a }),
      txt('CTA 1', -460, 35, 30, ROLE.r0, 'mono').opacity(a),
      glassCell(-230, 35, 200, 130, mm ? ROLE.bad : COSMOS.dim, {
        fill: mm ? '#33101d' : '#0b101d',
        glow: mm ? 11 * pulse : 0,
        dash: mm ? undefined : [8, 6],
        opacity: mm ? a : 0.45 * a,
      }),
      txt(mm ? 'CTA 2!' : 'idle', -230, 35, 30, mm ? ROLE.bad : COSMOS.dim, 'mono').opacity(a),

      // Right: captured graph launch grid fixed at 2 CTAs
      glassCell(445, 35, 700, 210, mm ? ROLE.bad : ROLE.good, {
        fill: mm ? '#2c101b' : '#0e2824',
        glow: mm ? 10 * pulse : 7,
        opacity: a,
      }),
      txt('CAPTURED GRAPH LAUNCH GRID', 445, -24, 26, COSMOS.cyan, 'mono').opacity(a),
      txt('Frozen grid = 2 thread blocks (CTAs)', 445, 30, 28, COSMOS.ink, 'mono').opacity(a),
      txt(
        mm ? 'MISMATCH: history now needs 3 CTAs!' : 'Matches current 2-CTA schedule',
        445,
        88,
        28,
        mm ? ROLE.bad : ROLE.good,
        'mono',
      ).opacity(a),

      glassCell(0, 295, 1620, 120, mm ? ROLE.bad : ROLE.r2, {
        fill: '#0e172a',
        glow: 8,
        opacity: a,
      }),
      txt(
        'Fixed batch size alone never guarantees graph compatibility: verify work assignment too',
        0,
        295,
        28,
        mm ? ROLE.bad : COSMOS.ink,
        'sans',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  // View 2: v0.7.1 planned MLA wrapper vs monolithic CuTe plans
  const mlaView = guardedDynamic(showMla, (a) => {
    const cn = cuteNote.value;
    const nodes = [
      txt('WRAPPER-SPECIFIC GRAPH CONTRACTS (v0.7.1)', 0, -155, 28, COSMOS.violet, 'mono').opacity(
        a,
      ),

      glassCell(-440, 40, 740, 250, ROLE.violet, { fill: '#1c1336', glow: 8, opacity: a }),
      txt('PLANNED MLA WRAPPER (backend="auto")', -440, -38, 26, ROLE.violet, 'mono').opacity(a),
      txt('Selects backend during plan()', -440, 22, 28, COSMOS.ink, 'sans').opacity(a),
      txt('Non-FA graph plan ties metadata ptrs', -440, 76, 26, COSMOS.muted, 'sans').opacity(a),
      txt('New backend -> new wrapper + capture', -440, 126, 26, COSMOS.gold, 'mono').opacity(a),

      glassCell(440, 40, 740, 250, cn > 0.5 ? ROLE.good : ROLE.r2, {
        fill: cn > 0.5 ? '#0e2824' : '#0f2336',
        glow: cn > 0.5 ? 10 : 6,
        opacity: a,
      }),
      txt('MONOLITHIC CuTe PLANS', 440, -38, 26, ROLE.good, 'mono').opacity(a),
      txt('Redistribute queries in place', 440, 22, 28, COSMOS.ink, 'sans').opacity(a),
      txt('Valid only within declared bounds', 440, 76, 26, COSMOS.muted, 'sans').opacity(a),
      txt('Still refresh metadata outside capture', 440, 126, 26, COSMOS.gold, 'mono').opacity(a),

      txt(
        'Always check each wrapper graph contract before reusing a captured replay',
        0,
        305,
        28,
        COSMOS.ink,
        'sans',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, addrView, ctaView, mlaView);
  runPhase(s, c, phase, 14);

  c.on('fi-graph-contract-0', () =>
    s.play(addrStale.to(0.1, { duration: remainDuration(c, 'fi-graph-contract-0', 0.3) })),
  );
  c.on('fi-graph-contract-0-result', () =>
    s.play(addrStale.to(1, { duration: remainDuration(c, 'fi-graph-contract-0-result', 0.4) })),
  );
  c.on('fi-graph-contract-1', () => {
    s.play(par(showAddr.to(0, { duration: 0.18 }), delay(showCta.to(1, { duration: 0.22 }), 0.2)));
  });
  c.on('fi-graph-contract-1-result', () =>
    s.play(ctaMismatch.to(1, { duration: remainDuration(c, 'fi-graph-contract-1-result', 0.4) })),
  );
  c.on('fi-graph-contract-2', () => {
    s.play(par(showCta.to(0, { duration: 0.18 }), delay(showMla.to(1, { duration: 0.22 }), 0.2)));
  });
  c.after('fi-graph-contract-2-result', () =>
    s.play(cuteNote.to(1, { duration: remainAfter(c, 'fi-graph-contract-2-result', 0.35) })),
  );
}
