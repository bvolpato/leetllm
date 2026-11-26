// Scene 24: How does a response correct its own arithmetic? (Self-correction in context & latency budget)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function reportedPatterns(s, c) {
  const phase = s.value(0);
  const sBack = s.value(0);
  const sRet = s.value(0);
  const sAuth = s.value(0);
  const sBudg = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#2e1d5414');
  const title = heroTitle(['How Does a Response', 'Correct Its Arithmetic?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'LONG COT TRACES · WRITTEN BACKTRACKING & TOKEN BUDGET',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sb = Math.max(0.65, sBack.value);
    const sr = Math.max(0.65, sRet.value);
    const sa = Math.max(0.65, sAuth.value);
    const bg = Math.max(0.65, sBudg.value);

    const rowY = -70;
    const nodes = [
      txt(
        'AUTOREGRESSIVE CONTEXT STREAM (ALL TOKENS RETAINED)',
        -830,
        -182,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glassCell(-655, rowY, 350, 128, COSMOS.rose, { fill: '#28111a', glow: 6, opacity: sr }),
      txt('1. INITIAL ATTEMPT', -655, rowY - 32, 26, COSMOS.rose, 'mono').opacity(sr),
      txt('14 x 12 = 148', -655, rowY + 18, 32, COSMOS.ink, 'mono').opacity(sr),

      glowingArc([-475, rowY], [-330, rowY], -26, { color: COSMOS.gold, width: 3.6, opacity: sb }),
      glassCell(-195, rowY, 260, 128, COSMOS.gold, {
        fill: '#251e0e',
        glow: sb > 0.7 ? 10 * pulse : 4,
        opacity: sb,
      }),
      txt('2. CHECK CUE', -195, rowY - 32, 26, COSMOS.gold, 'mono').opacity(sb),
      txt('"Wait..."', -195, rowY + 18, 34, COSMOS.gold, 'serif').opacity(sb),

      glowingArc([-60, rowY], [85, rowY], -26, { color: COSMOS.cyan, width: 3.6, opacity: sa }),
      glassCell(270, rowY, 360, 128, COSMOS.cyan, {
        fill: '#102138',
        glow: sa > 0.7 ? 8 : 3,
        opacity: sa,
      }),
      txt('3. DECOMPOSE', 270, rowY - 32, 26, COSMOS.cyan, 'mono').opacity(sa),
      txt('10x12 + 4x12', 270, rowY + 18, 30, COSMOS.ink, 'mono').opacity(sa),

      glowingArc([455, rowY], [570, rowY], -26, { color: COSMOS.emerald, width: 3.6, opacity: sa }),
      glassCell(715, rowY, 280, 128, COSMOS.emerald, {
        fill: '#0e2824',
        glow: sa > 0.7 ? 9 : 3,
        opacity: sa,
      }),
      txt('4. REVISED', 715, rowY - 32, 26, COSMOS.emerald, 'mono').opacity(sa),
      txt('168', 715, rowY + 18, 40, COSMOS.emerald, 'mono').opacity(sa),

      // Lower two diagnostic principles
      glassCell(-440, 175, 760, 180, COSMOS.violet, { fill: '#17132f', glow: 5, opacity: sr }),
      txt(
        'TEXT PATTERN != EXTERNAL SEARCH TREE',
        -790,
        122,
        26,
        COSMOS.violet,
        'mono',
        'left',
      ).opacity(sr),
      txt(
        '· Earlier tokens stay in context (no hidden undo)',
        -790,
        174,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(sr),
      txt(
        '· Compare accuracy WITH vs WITHOUT the extra step',
        -790,
        220,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ).opacity(sr),

      glassCell(440, 175, 760, 180, COSMOS.emerald, {
        fill: '#0e2226',
        glow: bg > 0.7 ? 8 : 3,
        opacity: bg,
      }),
      txt(
        'ACCURACY vs LATENCY & TOKEN BUDGET',
        90,
        122,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(bg),
      txt(
        '· Longer traces burn decode time and tokens',
        90,
        174,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(bg),
      txt(
        '· Test shorter budgets on easy questions per workload',
        90,
        220,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ).opacity(bg),
      glowDot(0, 345, { radius: 6, color: COSMOS.gold }),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('vr-reported-patterns-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-backtrack-reported-patterns', () => s.play(sBack.to(1, { duration: 0.45 })));
  c.on('vr-retained-reported-patterns', () => s.play(sRet.to(1, { duration: 0.45 })));
  c.on('vr-reported-patterns-b1', () => s.play(sAuth.to(0.6, { duration: 0.35 })));
  c.on('vr-authored-reported-patterns', () => s.play(sAuth.to(1, { duration: 0.45 })));
  c.on('vr-reported-patterns-b2', () => s.play(sBudg.to(0.6, { duration: 0.35 })));
  c.on('vr-budget-reported-patterns', () =>
    s.play(sBudg.to(1, { duration: remainDuration(c, 'vr-budget-reported-patterns', 0.45) })),
  );
}
