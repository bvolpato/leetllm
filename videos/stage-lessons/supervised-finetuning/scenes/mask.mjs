// Scene 06: Which labels contribute to the loss?: Live -100 ignore_index veil + causal prefix gradient trace.
import {
  COSMOS,
  MASK,
  TOKENS,
  arrow,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  maskSnapshot,
  remainDuration,
  runPhase,
  streamX,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function mask(s, c) {
  const phase = s.value(0);
  const fwdWave = s.value(0);
  const showLabels = s.value(0);
  const maskProg = s.value(0);
  const traceTicket = s.value(0);
  const countTargets = s.value(0);

  const bgAura = aura(0, 30, 620, '#6ee7b71e', '#5ce1e614');
  const title = heroTitle(['Response-Only', 'Loss Masking'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.emerald,
    eyebrow: 'IGNORE_INDEX = −100 · CONTEXT STAYS LIVE',
  });

  const eqMask = glowTex(
    String.raw`\mathcal{L}_{\text{SFT}} = -\frac{1}{\sum m_t}\sum_{t} m_t \log p_\theta(x_t \mid x_{<t})`,
    {
      x: 340,
      y: -365,
      size: 34,
      color: COSMOS.emerald,
    },
  );

  const topY = -125;
  const botY = 165;
  const activeCount = maskSnapshot(0, 1).count;

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const fw = fwdWave.value;
    const sl = showLabels.value;
    const mp = maskProg.value;
    const tr = traceTicket.value;
    const ct = countTargets.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const maskedSlots = Math.round(mp * 5);

    const nodes = [
      txt(
        'FULL CAUSAL FORWARD PASS (ALL 8 INPUT POSITIONS)',
        -830,
        -238,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    // Input stream (always intact!)
    TOKENS.forEach((word, i) => {
      const x = streamX(i);
      const inPrefix = tr > 0.4 && i <= 5;
      const isPredictor5 = tr > 0.4 && i === 5;
      const col = isPredictor5
        ? COSMOS.gold
        : inPrefix
          ? COSMOS.cyan
          : i >= 5
            ? COSMOS.emerald
            : COSMOS.blue;
      nodes.push(
        tokenPill(word, x, topY, {
          color: col,
          textColor: isPredictor5 ? COSMOS.gold : COSMOS.ink,
          glow: isPredictor5 ? 12 * pulse : inPrefix ? 9 : 5,
          index: i,
          indexColor: isPredictor5 ? COSMOS.gold : COSMOS.muted,
          indexOffsetY: -72,
        }),
      );
    });

    // Forward wave sweep across all 8 tokens
    if (fw > 0.02 && tr < 0.3) {
      const endX = streamX(0) + (streamX(7) - streamX(0)) * fw;
      nodes.push(
        line([streamX(0), topY + 66], [endX, topY + 66], { stroke: COSMOS.cyan, width: 4 })
          .glow(8, COSMOS.cyan)
          .opacity(fw),
        glowDot(endX, topY + 66, { radius: 8, color: COSMOS.cyan, opacity: fw }),
      );
    }

    // Causal prefix attention bracket + gradient flow when tracing "ticket" (pos 6)
    if (tr > 0.05) {
      const x0 = streamX(0) - 85;
      const x5 = streamX(5);
      const x6 = streamX(6);
      nodes.push(
        line([x0, 22], [x5, 22], { stroke: COSMOS.gold, width: 4.5 })
          .glow(9, COSMOS.gold)
          .opacity(tr),
        line([x0, -20], [x0, 22], { stroke: COSMOS.gold, width: 3.5 }).opacity(tr),
        arrow([x5, 22], [x6, botY - 50], { stroke: COSMOS.gold, width: 5, tip: 14 })
          .glow(10, COSMOS.gold)
          .opacity(tr),
        txt(
          'Causal attention reads pos 0–5 (policy + 18 days + open)',
          -290,
          62,
          27,
          COSMOS.gold,
          'mono',
        ).opacity(tr),
      );
      // Glowing backward gradient arc flowing back into prompt representations
      nodes.push(
        glowingArc([x6, botY - 46], [streamX(3), topY + 46], -38, {
          color: COSMOS.violet,
          width: 3.2,
          opacity: tr * 0.78,
        }),
      );
    }

    // Label stream with live -100 ignore veil
    if (sl > 0.05) {
      nodes.push(
        txt(
          'CROSS-ENTROPY LABELS (ignore_index = −100)',
          -830,
          268,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(sl),
      );
      TOKENS.forEach((word, i) => {
        const x = streamX(i);
        const isIgnored = !MASK[i] && i < maskedSlots;
        const isActive = MASK[i] === 1 && maskedSlots >= 5;
        const lbl = isIgnored ? '−100' : word;
        const col = isIgnored ? COSMOS.dim : isActive ? COSMOS.emerald : COSMOS.blue;
        nodes.push(
          tokenPill(lbl, x, botY, {
            color: col,
            fill: isIgnored ? '#0b0e19' : isActive ? '#0c2624' : '#10182b',
            textColor: isIgnored ? COSMOS.dim : isActive ? COSMOS.emerald : COSMOS.ink,
            dash: isIgnored ? [7, 5] : undefined,
            glow: isActive ? 11 * pulse : 0,
            opacity: isIgnored ? 0.62 * sl : sl,
          }),
        );
      });
    }

    // Bottom status bar
    let footerMsg = 'All 8 positions enter the causal forward pass';
    let footerCol = COSMOS.cyan;
    if (ct > 0.5) {
      footerMsg = `8 input positions  ·  5 ignored (−100)  ·  ${activeCount} active loss targets (open, ticket, END)`;
      footerCol = COSMOS.emerald;
    } else if (tr > 0.5) {
      footerMsg =
        'Prompt stays in causal attention  ·  Reply gradients flow back through prompt weights';
      footerCol = COSMOS.gold;
    } else if (maskedSlots >= 5) {
      footerMsg = 'Positions 0–4 masked to −100  ·  Only assistant reply + END enter the loss';
      footerCol = COSMOS.emerald;
    }

    nodes.push(
      glassCell(0, 368, 1620, 92, footerCol, { fill: '#101829', glow: 8 }),
      txt(footerMsg, 0, 368, 28, footerCol, 'mono'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('forward-pass', () => s.play(fwdWave.to(1, { duration: 0.8 })));
  c.on('inspect-labels', () => s.play(showLabels.to(1, { duration: 0.45 })));
  c.on('mask-context', () => s.play(maskProg.to(1, { duration: 0.9 })));
  c.on('trace-ticket', () => s.play(traceTicket.to(1, { duration: 0.65 })));
  c.show('count-targets', eqMask);
  c.on('count-targets', () =>
    s.play(countTargets.to(1, { duration: remainDuration(c, 'count-targets', 0.45) })),
  );
}
