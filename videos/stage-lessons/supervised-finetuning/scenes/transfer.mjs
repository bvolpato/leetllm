// Scene 22: Inspect one batch before you scale: Live ID-mask fractures ticket->END beam, position-mask restores it.
import {
  COSMOS,
  PAD_IDS,
  PAD_LABELS_BY_ID,
  PAD_LABELS_BY_POS,
  PAD_TOKENS,
  arrow,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const phase = s.value(0);
  const byIdBroken = s.value(0);
  const posRestored = s.value(0);

  const bgAura = aura(0, 30, 620, '#ff6b8b1a', '#6ee7b716');
  const title = heroTitle(['Inspect One Batch', 'Before You Scale'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.emerald,
    eyebrow: 'PRE-FLIGHT AUDIT · EOS vs PAD COLLISION',
  });

  const colX = (i) => -575 + i * 245;

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const broken = byIdBroken.value > 0.5 && posRestored.value < 0.5;
    const restored = posRestored.value > 0.5;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const labels = broken ? PAD_LABELS_BY_ID : PAD_LABELS_BY_POS;
    const activeCount = labels.filter((v) => v !== -100).length;
    const wallX = (colX(3) + colX(4)) * 0.5;

    const topY = -140;
    const idY = -20;
    const lblY = 160;

    const nodes = [
      txt('REAL REPLY', (colX(0) + colX(3)) * 0.5, -238, 28, COSMOS.cyan, 'mono'),
      txt('PADDING', (colX(4) + colX(5)) * 0.5, -238, 28, COSMOS.dim, 'mono'),
      line([wallX, -245], [wallX, 235], { stroke: COSMOS.gold, width: 4, dash: [10, 6] }).glow(
        8,
        COSMOS.gold,
      ),
      txt('INPUT', -835, topY, 26, COSMOS.blue, 'mono', 'left'),
      txt('TOKEN ID', -835, idY, 26, COSMOS.muted, 'mono', 'left'),
      txt('LABEL', -835, lblY, 26, COSMOS.emerald, 'mono', 'left'),
    ];

    PAD_TOKENS.forEach((tok, i) => {
      const x = colX(i);
      const id = PAD_IDS[i];
      const isPad = i >= 4;
      const isEnd = i === 3;
      const lbl = labels[i];
      const active = lbl !== -100;

      // Token row
      nodes.push(
        glassCell(x, topY, 204, 82, isPad ? COSMOS.dim : COSMOS.blue, {
          fill: isPad ? '#0c0f1b' : '#101a30',
          dash: isPad ? [7, 5] : undefined,
          glow: isPad ? 0 : 6,
          opacity: isPad ? 0.7 : 1,
        }),
        txt(tok, x, topY, 30, isPad ? COSMOS.dim : COSMOS.ink, 'mono'),
        txt(String(id), x, idY, 38, id === 2 ? COSMOS.gold : COSMOS.ink, 'mono'),
      );

      // Label row
      const lblCol = active ? COSMOS.emerald : isEnd && broken ? COSMOS.rose : COSMOS.dim;
      nodes.push(
        glassCell(x, lblY, 204, 86, lblCol, {
          fill: active ? '#0c2624' : isEnd && broken ? '#26101b' : '#0b0e19',
          dash: active ? undefined : [7, 5],
          glow: active || (isEnd && broken) ? 10 * pulse : 0,
          opacity: active || (isEnd && broken) ? 1 : 0.62,
        }),
        txt(active ? String(lbl) : '−100', x, lblY, 34, lblCol, 'mono'),
      );

      // Glowing shifted prediction arrows from i-1 -> i (open, ticket, END)
      if (i >= 1 && i <= 3) {
        const sx = colX(i - 1);
        if (active) {
          nodes.push(
            arrow([sx, idY + 40], [x, lblY - 52], {
              stroke: COSMOS.emerald,
              width: 4.5,
              tip: 13,
            }).glow(9, COSMOS.emerald),
          );
        } else if (isEnd && broken) {
          // Strict withholding during question hold: fractured gap with clean floating "?"
          const mx = (sx + x) * 0.5;
          const my = (idY + 40 + (lblY - 52)) * 0.5;
          nodes.push(
            line([sx, idY + 40], [mx - 36, my - 14], {
              stroke: COSMOS.rose,
              width: 3,
              dash: [8, 6],
            }).opacity(0.75),
            line([mx + 36, my + 14], [x, lblY - 52], {
              stroke: COSMOS.rose,
              width: 3,
              dash: [8, 6],
            }).opacity(0.75),
            txt('?', mx, my, 42, COSMOS.gold, 'mono').glow(8, COSMOS.gold),
          );
        }
      }
    });

    // Bottom status bar (strict withholding during Beat 0!)
    let footCol = COSMOS.cyan;
    let footMsg = `Collated row before masking · Active targets = ${activeCount}`;
    if (broken) {
      footCol = COSMOS.gold;
      footMsg = `Rule: mask every ID == 2  (${activeCount} active targets)  ·  Which prediction disappeared?`;
    } else if (restored) {
      footCol = COSMOS.emerald;
      footMsg = `Position-based mask restores END (${activeCount} targets) · Overfit 1 batch, generate, then test packing`;
    }

    nodes.push(
      glassCell(0, 355, 1660, 102, footCol, { fill: '#101829', glow: 9 }),
      txt(footMsg, 0, 355, 28, footCol, 'mono'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('id-mask', () => s.play(byIdBroken.to(1, { duration: 0.35 })));
  c.on('position-mask', () =>
    s.play(posRestored.to(1, { duration: remainDuration(c, 'position-mask', 0.45) })),
  );
}
