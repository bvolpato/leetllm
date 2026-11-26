// Scene 14: The multiplier changes with the chosen rank: Ordinary α/r (2, 0.5, 2) vs rsLoRA α/√r (5.657, 2.828, 11.314).
import {
  COSMOS,
  SCALE_SWEEP,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function rankScaling(s, c) {
  const phase = s.value(0);
  const startOrd = s.value(0);
  const ord0 = s.value(0);
  const ord1 = s.value(0);
  const ord2 = s.value(0);
  const startRs = s.value(0);
  const rs0 = s.value(0);
  const rs1 = s.value(0);
  const rs2 = s.value(0);
  const showFooter = s.value(0);

  const bgAura = aura(0, 40, 660, '#ffd1661c', '#5ce1e61a');
  const title = heroTitle(['Ordinary vs rsLoRA', 'Rank Scaling'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'EXPLICIT MULTIPLIER COMPARISON',
  });

  const eqOrd = glowTex(String.raw`\text{LoRA: } \frac{\alpha}{r}`, {
    x: -440,
    y: -225,
    size: 38,
    color: COSMOS.gold,
  });
  const eqRs = glowTex(String.raw`\text{rsLoRA: } \frac{\alpha}{\sqrt{r}}`, {
    x: 420,
    y: -225,
    size: 38,
    color: COSMOS.cyan,
  });

  const baseY = 230;
  const maxBarH = 340;
  const ordMax = 2.6;
  const rsMax = 12.2;

  const live = guardedDynamic(1, () => {
    const oVals = [ord0.value, ord1.value, ord2.value];
    const rVals = [rs0.value, rs1.value, rs2.value];
    const sf = showFooter.value;
    const sr = startRs.value;

    const nodes = [
      // Left axis: Ordinary α / r
      line([-810, baseY], [-70, baseY], { stroke: '#3a4c78', width: 2.5 }),
      // Right axis: rsLoRA α / √r
      line([50, baseY], [810, baseY], { stroke: '#3a4c78', width: 2.5 }),
      // Subtle center divider
      line([0, -255], [0, 265], { stroke: '#233050', width: 2, dash: [8, 6] }),
    ];

    // 3 Ordinary bars
    SCALE_SWEEP.forEach((cfg, i) => {
      const cx = -690 + i * 250;
      const rev = oVals[i];
      const h = (cfg.ordinary / ordMax) * maxBarH * Math.max(0.08, rev);
      const col = i === 1 ? COSMOS.rose : COSMOS.gold;
      nodes.push(
        rect(128, h, { fill: col, stroke: '#ffffff', width: 1.2, radius: 6 })
          .at(cx, baseY - h * 0.5)
          .glow(rev > 0.3 ? 10 : 3, col)
          .opacity(Math.max(0.25, rev)),
        txt(
          rev > 0.3 ? `${cfg.ordinary}` : '?',
          cx,
          baseY - h - 30,
          32,
          rev > 0.3 ? col : COSMOS.muted,
          'mono',
        ).glow(rev > 0.3 ? 6 : 0, col),
        txt(`r=${cfg.r}, α=${cfg.alpha}`, cx, baseY + 38, 26, COSMOS.ink, 'mono'),
      );
    });

    // 3 rsLoRA bars
    SCALE_SWEEP.forEach((cfg, i) => {
      const cx = 175 + i * 250;
      const rev = rVals[i];
      const h = (cfg.rslora / rsMax) * maxBarH * Math.max(0.08, rev);
      const col = i === 1 ? COSMOS.emerald : COSMOS.cyan;
      nodes.push(
        rect(128, h, { fill: col, stroke: '#ffffff', width: 1.2, radius: 6 })
          .at(cx, baseY - h * 0.5)
          .glow(rev > 0.3 ? 10 : 3, col)
          .opacity(Math.max(0.22, Math.max(sr * 0.35, rev))),
        txt(
          rev > 0.3 ? cfg.rslora.toFixed(3) : '?',
          cx,
          baseY - h - 30,
          30,
          rev > 0.3 ? col : COSMOS.muted,
          'mono',
        ).glow(rev > 0.3 ? 6 : 0, col),
        txt(`r=${cfg.r}, α=${cfg.alpha}`, cx, baseY + 38, 26, COSMOS.ink, 'mono'),
      );
    });

    // Bottom contract bar
    nodes.push(
      glassCell(0, 368, 1660, 118, sf > 0.2 ? COSMOS.emerald : COSMOS.gold, {
        fill: '#10182d',
        glow: 8,
      }),
      txt(
        sf > 0.2
          ? 'B = 0 still gives zero step-0 correction under either scale · compare measured update norms + held-out quality'
          : sr > 0.2
            ? 'With α fixed, quadrupling rank r (8 -> 32) quarters α/r (2 -> 0.5) but halves α/√r (5.657 -> 2.828)'
            : 'Compute the explicit multiplier before interpreting any rank sweep',
        0,
        368,
        26,
        sf > 0.2 ? COSMOS.emerald : startOrd.value > 0.2 ? COSMOS.gold : COSMOS.ink,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eqOrd, eqRs, live);
  runPhase(s, c, phase, 14);

  c.on('rank-scaling-1', () => s.play(startOrd.to(1, { duration: 0.35 })));
  c.on('scale-ordinary-two', () => s.play(ord0.to(1, { duration: 0.4 })));
  c.on('scale-ordinary-half', () => s.play(ord1.to(1, { duration: 0.4 })));
  c.on('scale-ordinary-repair', () => s.play(ord2.to(1, { duration: 0.4 })));
  c.on('rank-scaling-2', () => s.play(startRs.to(1, { duration: 0.35 })));
  c.on('scale-rs-first', () => s.play(rs0.to(1, { duration: 0.4 })));
  c.on('scale-rs-second', () => s.play(rs1.to(1, { duration: 0.4 })));
  c.on('scale-rs-third', () => s.play(rs2.to(1, { duration: 0.4 })));
  c.on('rank-scaling-3', () =>
    s.play(showFooter.to(1, { duration: remainDuration(c, 'rank-scaling-3', 0.45) })),
  );
}
