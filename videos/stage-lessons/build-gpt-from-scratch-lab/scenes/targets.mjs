// Scene 02: What would this loader reward? (Unshifted copy bug vs shifted next-token targets)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  prompt,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function targets(s, c) {
  const phase = s.value(0);
  const copyFocus = s.value(0);
  const slideShift = s.value(0);

  const bgAura = aura(0, 40, 620, '#1e306824', '#2e1d5212');
  const title = heroTitle(['What Would This', 'Loader Reward?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.rose,
    eyebrow: 'TARGET ALIGNMENT · SHIFT BY ONE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const cf = copyFocus.value;
    const sh = slideShift.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const tileW = 216;
    const gap = 24;
    const stride = tileW + gap;
    const x0 = -600;
    const sourceY = -155;
    const inputY = 25;
    const labelY = 215;

    const nodes = [
      txt('SOURCE STREAM (6 PIECES)', -855, sourceY - 68, 26, COSMOS.muted, 'mono', 'left'),
      txt('MODEL INPUTS  x[0..4]', -855, inputY - 76, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        sh > 0.5 ? 'SHIFTED LABELS  y = source[1..5]' : 'UNSHIFTED LABELS  y = x[0..4]',
        -855,
        labelY + 78,
        26,
        sh > 0.5 ? COSMOS.emerald : COSMOS.rose,
        'mono',
        'left',
      ),
    ];

    // Top source row (all 6 pieces)
    prompt.forEach((tok, i) => {
      const cx = x0 + i * stride;
      const isLast = i === 5;
      nodes.push(
        glassCell(cx, sourceY, tileW, 74, isLast && sh > 0.5 ? COSMOS.gold : COSMOS.dim, {
          fill: '#0d1324',
          glow: isLast && sh > 0.5 ? 8 : 2,
          opacity: 0.85,
        }),
        txt(
          tok.piece,
          cx,
          sourceY + 2,
          32,
          isLast && sh > 0.5 ? COSMOS.gold : COSMOS.muted,
          'mono',
        ),
      );
    });

    // Middle input row (first 5 pieces)
    for (let i = 0; i < 5; i++) {
      const cx = x0 + i * stride;
      const isComma = i === 2;
      const isSpe = i === 4;
      const stroke = isComma ? COSMOS.gold : isSpe && sh > 0.5 ? COSMOS.emerald : COSMOS.cyan;
      nodes.push(
        glassCell(cx, inputY, tileW, 84, stroke, {
          fill: isComma ? '#231d0f' : '#0f1d35',
          glow: isComma ? 9 * pulse : 5,
        }),
        txt(prompt[i].piece, cx, inputY + 2, 34, isComma ? COSMOS.gold : COSMOS.ink, 'mono'),
      );
    }

    // Bottom label row slides smoothly left by 1 stride as sh: 0 -> 1
    for (let i = 0; i < 6; i++) {
      const cx = x0 + (i - sh) * stride;
      const alpha = i === 0 ? Math.max(0, 1 - sh * 2.2) : i === 5 ? Math.min(1, sh * 1.4) : 1;
      if (alpha < 0.03) continue;
      const activeTarget = (sh > 0.5 && (i === 3 || i === 5)) || (sh <= 0.5 && i === 2 && cf > 0.3);
      const stroke = sh > 0.5 ? COSMOS.emerald : i === 2 ? COSMOS.rose : COSMOS.dim;
      nodes.push(
        glassCell(cx, labelY, tileW, 84, stroke, {
          fill: sh > 0.5 ? '#0d2422' : i === 2 ? '#271019' : '#121524',
          glow: activeTarget ? 9 * pulse : 3,
          opacity: alpha,
        }),
        txt(
          prompt[i].piece,
          cx,
          labelY + 2,
          34,
          sh > 0.5 ? COSMOS.emerald : i === 2 ? COSMOS.rose : COSMOS.muted,
          'mono',
        ).opacity(alpha),
      );
    }

    // Vertical supervision arrows between input i and label slot i
    for (let i = 0; i < 5; i++) {
      const cx = x0 + i * stride;
      const showArrow = sh > 0.5 || (i === 2 && cf > 0.1);
      if (!showArrow) continue;
      const arrowCol = sh > 0.5 ? COSMOS.emerald : COSMOS.rose;
      const arrowAlpha = sh > 0.5 ? Math.min(1, (sh - 0.3) * 1.6) : cf;
      nodes.push(
        glowingArc([cx, inputY + 46], [cx, labelY - 46], 0, {
          color: arrowCol,
          width: i === 2 || i === 4 ? 4.0 : 2.8,
          opacity: arrowAlpha,
        }),
        glowDot(cx, labelY - 48, { radius: 5.5, color: arrowCol, opacity: arrowAlpha }),
      );
    }

    // Status summary floating below (strictly withholding "another comma" until slide beat)
    if (sh > 0.55) {
      nodes.push(
        txt(
          'Shifted left by 1:  "," -> "↵"   and   "Spe" -> "ak"   (all 5 positions scored in 1 forward pass)',
          0,
          388,
          30,
          COSMOS.emerald,
          'sans',
        )
          .glow(6, COSMOS.emerald)
          .opacity((sh - 0.55) / 0.45),
      );
    } else if (cf > 0.25) {
      nodes.push(
        txt(
          'Comma at position 2 points straight down to its own copy...',
          0,
          388,
          30,
          COSMOS.rose,
          'sans',
        ).opacity(cf),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 12);

  c.on('copy-pair', () => s.play(copyFocus.to(1, { duration: 0.55 })));
  c.on('slide-labels', () =>
    s.play(slideShift.to(1, { duration: remainDuration(c, 'slide-labels', 0.85) })),
  );
}
