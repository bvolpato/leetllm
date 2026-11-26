// Scene 04: Which row holds the comma? (Active vocabulary remap & inverse lookup)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function vocab(s, c) {
  const phase = s.value(0);
  const forwardArc = s.value(0);
  const reverseArc = s.value(0);
  const showStrip = s.value(0);

  const bgAura = aura(0, 20, 620, '#16316826', '#2a1c5214');
  const title = heroTitle(['Which Row Holds', 'the Comma?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'ACTIVE-VOCABULARY REMAP · 50,257 -> 17,485',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const fwd = forwardArc.value;
    const rev = reverseArc.value;
    const str = showStrip.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: GPT-2 vocabulary ID
      txt('GPT-2 VOCABULARY', -560, -172, 26, COSMOS.cyan, 'mono'),
      glassCell(-560, -56, 360, 148, COSMOS.cyan, { fill: '#0f1c34', glow: 7 }),
      txt('ID 11', -560, -82, 46, COSMOS.cyan, 'mono').glow(7, COSMOS.cyan),
      txt('piece:  ","', -560, -24, 30, COSMOS.ink, 'mono'),

      // Center: Sorted active table snippet
      txt('SORTED ACTIVE IDs', 0, -138, 26, COSMOS.muted, 'mono'),
      glassCell(0, -82, 300, 56, COSMOS.dim, { fill: '#0e1424', glow: 0 }),
      txt('row 0  ->  ID 0', 0, -80, 26, COSMOS.muted, 'mono'),
      glassCell(0, -18, 300, 56, COSMOS.dim, { fill: '#0e1424', glow: 0 }),
      txt('row 1  ->  ID 6', 0, -16, 26, COSMOS.muted, 'mono'),
      glassCell(0, 46, 300, 64, fwd > 0.3 ? COSMOS.gold : COSMOS.dim, {
        fill: fwd > 0.3 ? '#261e0e' : '#0e1424',
        glow: fwd > 0.3 ? 10 * pulse : 0,
      }),
      txt('row 2  ->  ID 11', 0, 48, 28, fwd > 0.3 ? COSMOS.gold : COSMOS.muted, 'mono'),

      // Right: Local embedding & output row
      txt('SHAKESPEARE CHECKPOINT', 560, -172, 26, COSMOS.gold, 'mono'),
      glassCell(560, -56, 360, 148, fwd > 0.3 ? COSMOS.gold : COSMOS.dim, {
        fill: fwd > 0.3 ? '#231c0e' : '#0e1424',
        glow: fwd > 0.3 ? 8 * pulse : 2,
      }),
      txt(fwd > 0.3 ? 'LOCAL ROW 2' : 'LOCAL ROW ?', 560, -82, 42, COSMOS.gold, 'mono').glow(
        7,
        COSMOS.gold,
      ),
      txt('input emb + output score', 560, -24, 26, COSMOS.muted, 'sans'),
    ];

    if (fwd > 0.05) {
      nodes.push(
        glowingArc([-376, -126], [376, -126], -115, {
          color: COSMOS.gold,
          width: 4,
          opacity: fwd,
        }),
        glowDot(
          -376 + 752 * Math.min(1, (p * 0.45) % 1),
          -126 - Math.sin(((p * 0.45) % 1) * Math.PI) * 57,
          {
            radius: 6,
            color: COSMOS.gold,
            opacity: fwd,
          },
        ),
        txt('encode: ID 11 -> local row 2', 0, -244, 26, COSMOS.gold, 'mono').opacity(fwd),
      );
    }

    if (rev > 0.05) {
      nodes.push(
        glowingArc([376, 20], [-376, 20], 130, {
          color: COSMOS.emerald,
          width: 4,
          opacity: rev,
        }),
        txt('decode: local row 2 -> ID 11 -> ","', 0, 134, 28, COSMOS.emerald, 'mono')
          .glow(6, COSMOS.emerald)
          .opacity(rev),
      );
    }

    // Active fraction strip (17,485 / 50,257 = 34.79%)
    const barW = 1520;
    const barH = 54;
    const barX = -760;
    const barY = 264;
    const activeW = barW * (17485 / 50257);
    const sOp = Math.max(0.25, str);

    nodes.push(
      txt(
        'FULL GPT-2 TABLE (50,257 ROWS) vs ACTIVE SHAKESPEARE ROWS (17,485 = 34.8%)',
        barX,
        barY - 58,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(sOp),
      rect(barW, barH, { fill: '#111626', stroke: COSMOS.rule, width: 2, radius: 10 })
        .at(0, barY)
        .opacity(sOp),
      rect(activeW, barH - 4, { fill: COSMOS.blue, stroke: COSMOS.cyan, width: 2, radius: 8 })
        .at(barX + activeW * 0.5, barY)
        .glow(str > 0.5 ? 9 : 3, COSMOS.cyan)
        .opacity(sOp),
      txt('17,485 active', barX + activeW * 0.5, barY + 2, 26, COSMOS.bg, 'mono').opacity(sOp),
      txt(
        '32,772 inactive GPT-2 IDs (reject unfamiliar prompt pieces before lookup)',
        barX + activeW + (barW - activeW) * 0.5,
        barY + 2,
        26,
        str > 0.5 ? COSMOS.rose : COSMOS.muted,
        'sans',
      ).opacity(sOp),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 12);

  c.on('lookup-row', () => s.play(forwardArc.to(1, { duration: 0.6 })));
  c.on('inverse-row', () =>
    s.play(reverseArc.to(1, { duration: remainDuration(c, 'inverse-row', 0.65) })),
  );
  c.on('active-rows', () =>
    s.play(showStrip.to(1, { duration: remainDuration(c, 'active-rows', 0.55) })),
  );
}
