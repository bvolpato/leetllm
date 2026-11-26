// Scene 16: Which token incentive survives clipping? (3D PPO/GRPO clipped surrogate + A=+1 / A=-1 prediction)
import {
  CLIP_NEG,
  CLIP_POS,
  COSMOS,
  aura,
  buildClipSurface3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function tokenSurrogate(s, c) {
  const phase = s.value(0);
  const sRatio = s.value(0);
  const sPosRaw = s.value(0);
  const sPosBound = s.value(0);
  const sPosSel = s.value(0);
  const sNegMode = s.value(0);
  const sNegRaw = s.value(0);
  const sNegBound = s.value(0);
  const sNegSel = s.value(0);
  const sReduce = s.value(0);

  const bgAura = aura(390, 20, 560, '#14385c28', '#3c1b4a16');
  const surf3d = buildClipSurface3d(phase, { x: 420, y: 20 });

  const title = heroTitle(['Which Token Incentive', 'Survives Clipping?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'TOKENWISE GRPO SURROGATE · CLIP RAILS [0.8, 1.2]',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sr = Math.max(0.65, sRatio.value);
    const pr = sPosRaw.value;
    const pb = sPosBound.value;
    const ps = sPosSel.value;
    const nm = sNegMode.value;
    const nr = sNegRaw.value;
    const nb = sNegBound.value;
    const ns = sNegSel.value;
    const rd = sReduce.value;

    const nodes = [
      txt('3D CLIPPED SURROGATE min(r·A, clip(r)·A)', 420, -370, 26, COSMOS.cyan, 'mono'),
      txt('Gold rails mark [0.8, 1.2] clipping plateau', 420, 412, 26, COSMOS.muted, 'sans'),

      // Positive advantage branch (A = +1, r = 1.4 -> clipped to 1.2)
      glassCell(-465, -110, 740, 175, nm < 0.5 ? COSMOS.emerald : COSMOS.dim, {
        fill: nm < 0.5 ? '#0e2524' : '#0f1422',
        glow: nm < 0.5 && ps > 0.3 ? 9 * pulse : 4,
        opacity: nm < 0.5 ? sr : 0.55,
      }),
      txt(
        'CASE 1: PASSING TOKEN (A = +1, r = 1.4)',
        -805,
        -162,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(sr),
      txt(
        pr > 0.2
          ? `raw = ${CLIP_POS.raw.toFixed(1)}    clipped = ${pb > 0.2 ? CLIP_POS.alternative.toFixed(1) : '?'}`
          : 'ratio r = pi / pi_old = 1.4',
        -805,
        -108,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(sr),
      txt(
        ps > 0.3
          ? `min(1.4, 1.2) = +${CLIP_POS.surrogate.toFixed(1)}  (upper plateau)`
          : 'Take min(raw, clipped)',
        -805,
        -52,
        28,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(sr),

      // Negative advantage branch (A = -1, r = 0.7 -> clipped to 0.8; strictly withhold -0.8 until sNegSel!)
      glassCell(-465, 118, 740, 190, nm > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: nm > 0.3 ? '#291018' : '#12182b',
        glow: nm > 0.3 && ns > 0.3 ? 10 * pulse : 3,
        opacity: Math.max(0.7, nm),
      }),
      txt(
        'CASE 2: FAILING TOKEN (A = -1, r = 0.7)',
        -805,
        62,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ).opacity(Math.max(0.7, nm)),
      txt(
        nr > 0.2
          ? `raw = ${CLIP_NEG.raw.toFixed(1)}    clipped = ${nb > 0.2 ? CLIP_NEG.alternative.toFixed(1) : '?'}`
          : 'Compare raw vs clipped product',
        -805,
        118,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(Math.max(0.7, nm)),
      txt(
        ns > 0.5
          ? `min(-0.7, -0.8) = ${CLIP_NEG.surrogate.toFixed(1)} (plateau <= 0.8)`
          : nb > 0.3
            ? 'Which value is farther left: -0.7 or -0.8?'
            : 'Denominator uses rollout policy pi_old',
        -805,
        176,
        26,
        ns > 0.5 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ).opacity(Math.max(0.7, nm)),
    ];

    if (rd > 0.05) {
      nodes.push(
        txt(
          'Tokenwise GRPO: mean inside each response (skip padding), average responses, negate',
          -855,
          355,
          26,
          COSMOS.cyan,
          'sans',
          'left',
        ).opacity(rd),
      );
    }

    return group(...nodes);
  });

  const eqClip = glowTex('\\min\\!\\big(r_t A,\\; \\operatorname{clip}(r_t, 0.8, 1.2) A\\big)', {
    x: -465,
    y: 282,
    size: 36,
    color: COSMOS.gold,
    glow: 6,
  });

  s.add(bgAura, surf3d, title, live, eqClip);
  runPhase(s, c, phase, 16);
  orbitScene(s, c, surf3d, { theta: -0.24, phi: 0.92 });

  c.on('clip-ratio', () => s.play(sRatio.to(1, { duration: 0.45 })));
  c.on('clip-raw', () => s.play(sPosRaw.to(1, { duration: 0.45 })));
  c.on('clip-bound', () => s.play(sPosBound.to(1, { duration: 0.45 })));
  c.on('clip-select', () => s.play(sPosSel.to(1, { duration: 0.45 })));
  c.on('clip-next', () => s.play(sNegMode.to(1, { duration: 0.45 })));
  c.on('clip-negative-raw', () => s.play(sNegRaw.to(1, { duration: 0.45 })));
  c.on('clip-negative-bound', () => s.play(sNegBound.to(1, { duration: 0.45 })));
  c.after('clip-negative-select', () =>
    s.play(sNegSel.to(1, { duration: remainDuration(c, 'clip-negative-select', 0.45) })),
  );
  c.on('clip-reduce', () => s.play(sReduce.to(0.6, { duration: 0.4 })));
  c.on('clip-average', () =>
    s.play(sReduce.to(1, { duration: remainDuration(c, 'clip-average', 0.45) })),
  );
}
