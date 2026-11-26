// Scene 31: Preserve a tiny decimal difference instead of rounding it away (Exact Fraction tolerance & 20-digit tail)
import {
  COSMOS,
  DEC_FAIL,
  DEC_PASS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function labExactness(s, c) {
  const phase = s.value(0);
  const sTyped = s.value(0);
  const sFrac = s.value(0);
  const sEq = s.value(0);
  const sBey = s.value(0);
  const sTail = s.value(0);
  const sGold = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#2e1d5414');
  const title = heroTitle(['Preserve Tiny Differences', 'with Exact Rationals'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.emerald,
    eyebrow: 'EXACT DECIMAL PARSER · NO BINARY FLOAT ROUNDING',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const ty = Math.max(0.65, sTyped.value);
    const fr = Math.max(0.65, sFrac.value);
    const eq = sEq.value;
    const by = sBey.value;
    const tl = Math.max(0.65, sTail.value);
    const gd = sGold.value;

    // Tolerance interval ruler around 50.35 +/- 0.01 -> [50.34, 50.36]
    const rx0 = -760;
    const rx1 = 160;
    const ry = -60;
    const mapX = (v) => rx0 + ((v - 50.335) / 0.03) * (rx1 - rx0);
    const xExp = mapX(50.35);
    const xPass = mapX(50.36);
    const xFail = mapX(50.361);

    const nodes = [
      txt(
        'EXACT TOLERANCE BAND:  expected = 50.35,  tol = 0.01',
        rx0,
        -188,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(fr),

      line([rx0, ry], [rx1, ry], { stroke: COSMOS.rule, width: 3 }),
      line([mapX(50.34), ry], [xPass, ry], { stroke: COSMOS.emerald, width: 9 }).glow(
        8,
        COSMOS.emerald,
      ),
      glowDot(xExp, ry, { radius: 8, color: COSMOS.cyan }),
      txt('50.35', xExp, ry + 42, 26, COSMOS.cyan, 'mono'),

      glowDot(xPass, ry, { radius: 9, color: COSMOS.emerald }),
      txt(
        eq > 0.3 ? `50.36 (${DEC_PASS.pass ? 'PASS' : ''})` : '50.36',
        xPass - 12,
        ry - 48,
        28,
        COSMOS.emerald,
        'mono',
        'right',
      ).glow(eq > 0.3 ? 7 : 2, COSMOS.emerald),

      glowDot(xFail, ry, { radius: 9, color: COSMOS.rose }),
      txt(
        by > 0.3 ? `50.361 (${DEC_FAIL.pass ? '' : 'FAIL'})` : '50.361',
        xFail + 12,
        ry + 42,
        28,
        COSMOS.rose,
        'mono',
        'left',
      ).glow(by > 0.3 ? 8 * pulse : 2, COSMOS.rose),

      // Right card: Type & 20-digit tail rules
      glassCell(565, -45, 580, 260, COSMOS.cyan, {
        fill: '#102138',
        glow: ty > 0.7 ? 8 : 3,
        opacity: ty,
      }),
      txt('BOUNDED DECIMAL CONTRACT', 565, -135, 26, COSMOS.cyan, 'mono').opacity(ty),
      txt('· Reject bool & float references', 565, -75, 26, COSMOS.rose, 'sans').opacity(ty),
      txt('· <= 20 digits before & after "."', 565, -20, 26, COSMOS.ink, 'mono').opacity(ty),
      txt('· Exact integer / rational diff', 565, 35, 26, COSMOS.emerald, 'sans').opacity(ty),

      // Bottom strip: 20-digit tail vs binary float64 erasure & gold-first validation
      glassCell(-440, 195, 760, 150, COSMOS.gold, {
        fill: '#221c0f',
        glow: tl > 0.7 ? 8 : 3,
        opacity: tl,
      }),
      txt('20-DIGIT TAIL PRESERVATION', -790, 152, 26, COSMOS.gold, 'mono', 'left').opacity(tl),
      txt(
        'Binary float64 erases 20-digit tail differences;',
        -790,
        200,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(tl),
      txt(
        'exact Fractions preserve zero-tolerance contracts',
        -790,
        240,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ).opacity(tl),

      glassCell(440, 195, 760, 150, gd > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: gd > 0.3 ? '#28111a' : '#12182b',
        glow: gd > 0.3 ? 8 : 3,
        opacity: Math.max(0.75, gd),
      }),
      txt('GOLD-FIRST VALIDATION ORDER', 90, 152, 26, COSMOS.rose, 'mono', 'left').opacity(
        Math.max(0.75, gd),
      ),
      txt(
        'Invalid reference quarantines the task even',
        90,
        200,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(Math.max(0.75, gd)),
      txt(
        'when the candidate itself is also malformed',
        90,
        240,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(Math.max(0.75, gd)),
    ];

    return group(...nodes);
  });

  const eqAbs = glowTex('\\left|p - e\\right| \\le t \\quad \\text{(exact }\\mathbb{Q}\\text{)}', {
    x: -320,
    y: 52,
    size: 38,
    color: COSMOS.emerald,
    glow: 6,
  });

  s.add(bgAura, title, live, eqAbs);
  runPhase(s, c, phase, 14);

  c.on('vr-lab-exactness-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-typed-lab-exactness', () => s.play(sTyped.to(1, { duration: 0.45 })));
  c.on('vr-lab-exactness-b1', () => s.play(sFrac.to(0.6, { duration: 0.35 })));
  c.on('vr-fractions-lab-exactness', () => s.play(sFrac.to(1, { duration: 0.45 })));
  c.on('vr-equality-lab-exactness', () => s.play(sEq.to(1, { duration: 0.45 })));
  c.on('vr-beyond-lab-exactness', () => s.play(sBey.to(1, { duration: 0.45 })));
  c.on('vr-lab-exactness-b2', () => s.play(sTail.to(0.6, { duration: 0.35 })));
  c.on('vr-tail-lab-exactness', () => s.play(sTail.to(1, { duration: 0.45 })));
  c.on('vr-gold-first-lab-exactness', () =>
    s.play(sGold.to(1, { duration: remainDuration(c, 'vr-gold-first-lab-exactness', 0.45) })),
  );
}
