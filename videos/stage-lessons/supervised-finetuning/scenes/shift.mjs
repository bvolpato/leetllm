// Scene 05: Where does the first prediction come from?: Causal shift 4->5, 5->6, 6->7 with prediction withholding.
import {
  COSMOS,
  TOKENS,
  arrow,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  streamX,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function shift(s, c) {
  const phase = s.value(0);
  const queryOpen = s.value(0);
  const linkCount = s.value(0); // 0=withheld, 1=4->5, 2=5->6, 3=6->7
  const checkShift = s.value(0);

  const bgAura = aura(80, 20, 620, '#ffd1661c', '#5ce1e614');
  const title = heroTitle(['Causal Shift &', 'Teacher Forcing'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'NEXT-TOKEN ALIGNMENT',
  });

  const eqShift = glowTex(String.raw`\text{logits}[t - 1] \;\longrightarrow\; \text{labels}[t]`, {
    x: 420,
    y: -365,
    size: 40,
    color: COSMOS.gold,
  });

  const topY = -125;
  const botY = 145;

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const qo = queryOpen.value;
    const links = Math.round(linkCount.value);
    const chk = checkShift.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt('INPUT / PREDICTOR LOGIT ROWS (0–7)', -830, -238, 26, COSMOS.cyan, 'mono', 'left'),
      txt('OBSERVED NEXT-TOKEN LABELS', -830, 268, 26, COSMOS.muted, 'mono', 'left'),
    ];

    // Top 8 input tokens + Bottom 8 observed target labels
    TOKENS.forEach((word, i) => {
      const x = streamX(i);
      const isTarget5 = i === 5 && links === 0 && qo > 0.3;
      const isActivePredictor =
        (links >= 1 && i === 4) || (links >= 2 && i === 5) || (links >= 3 && i === 6);
      const isActiveTarget =
        (links >= 1 && i === 5) || (links >= 2 && i === 6) || (links >= 3 && i === 7);

      const topCol = isActivePredictor
        ? COSMOS.gold
        : isTarget5
          ? COSMOS.emerald
          : i >= 5
            ? COSMOS.cyan
            : COSMOS.blue;
      nodes.push(
        tokenPill(word, x, topY, {
          color: topCol,
          textColor: isActivePredictor ? COSMOS.gold : COSMOS.ink,
          glow: isActivePredictor ? 11 * pulse : 5,
          index: i,
          indexColor: isActivePredictor ? COSMOS.gold : COSMOS.muted,
          indexOffsetY: -72,
        }),
      );

      const lblWord = i === 0 ? '·' : word;
      const botCol = isActiveTarget
        ? COSMOS.emerald
        : isTarget5
          ? COSMOS.gold
          : i === 0
            ? COSMOS.dim
            : '#37466b';
      nodes.push(
        tokenPill(lblWord, x, botY, {
          color: botCol,
          fill: isActiveTarget ? '#0c2624' : '#0d1324',
          textColor: isActiveTarget ? COSMOS.emerald : i === 0 ? COSMOS.dim : COSMOS.muted,
          glow: isActiveTarget ? 11 * pulse : 0,
        }),
      );
    });

    // Strict withholding before first-link: show ? above label 5
    if (links === 0) {
      const x5 = streamX(5);
      nodes.push(txt('?', x5, 10, 52, COSMOS.gold, 'mono').glow(10, COSMOS.gold));
    } else {
      // Glowing diagonal causal shift arrows: 4->5, 5->6, 6->7
      for (let k = 0; k < links; k++) {
        const src = 4 + k;
        const dst = 5 + k;
        const sx = streamX(src);
        const dx = streamX(dst);
        nodes.push(
          arrow([sx, topY + 50], [dx, botY - 50], {
            stroke: COSMOS.gold,
            width: 5,
            tip: 14,
          }).glow(10, COSMOS.gold),
          glowDot(
            sx + (dx - sx) * ((p * 0.65 + k * 0.3) % 1),
            topY + 50 + (botY - 50 - (topY + 50)) * ((p * 0.65 + k * 0.3) % 1),
            { radius: 5.5, color: '#ffffff' },
          ),
        );
      }
    }

    // Bottom readout banner
    let msg = 'Find "open" at position 5: which predictor row supplies its logits?';
    let msgCol = COSMOS.gold;
    if (chk > 0.5) {
      msg = 'Rows 4, 5, 6 → labels 5, 6, 7  ·  Trainers shift internally (never shift twice!)';
      msgCol = COSMOS.emerald;
    } else if (links === 1) {
      msg = 'Position 4 (ASSIST) predicts "open" at position 5';
      msgCol = COSMOS.emerald;
    } else if (links === 2) {
      msg = 'Teacher forcing: feed true "open" (pos 5) → predicts "ticket" (pos 6)';
      msgCol = COSMOS.emerald;
    } else if (links === 3) {
      msg = 'Feed true "ticket" (pos 6) → predicts "END" (pos 7)';
      msgCol = COSMOS.emerald;
    }

    nodes.push(
      glassCell(0, 365, 1620, 96, msgCol, { fill: '#101829', glow: 8 }),
      txt(msg, 0, 365, 29, msgCol, 'mono'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('query-open', () => s.play(queryOpen.to(1, { duration: 0.4 })));
  c.show('first-link', eqShift, { after: true });
  c.after('first-link', () => s.play(linkCount.to(1, { duration: 0.01 })));
  c.after('ticket-link', () => s.play(linkCount.to(2, { duration: 0.01 })));
  c.after('end-link', () => s.play(linkCount.to(3, { duration: 0.01 })));
  c.on('check-shift', () =>
    s.play(checkShift.to(1, { duration: remainDuration(c, 'check-shift', 0.45) })),
  );
}
