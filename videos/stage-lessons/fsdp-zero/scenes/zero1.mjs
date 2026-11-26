// Scene 05: Shard optimizer state first (ZeRO-1): 4 optimizer units / 4 ranks = 1 unit -> total drops 8 -> 5 units!
import {
  COSMOS,
  ROLE,
  ZERO_0,
  ZERO_1,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function zero1(s, c) {
  const phase = s.value(0);
  const shardOpt = s.value(0); // 0 -> 1 shrinks optimizer from 4 -> 1
  const showFive = s.value(0);
  const focusW = s.value(0);

  const bgAura = aura(0, 20, 640, '#ffd1661e', '#6ee7b716');
  const title = heroTitle(['ZeRO Stage 1:', 'Shard Optimizer State'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.opt,
    eyebrow: 'OPTIMIZER SHARDING · 8 → 5 UNITS / RANK',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const so = shardOpt.value;
    const sf = showFive.value;
    const fw = focusW.value;

    const unitPx = 44;
    const baseY = 175;
    const rankXs = [-620, -340, -60, 220];
    const optNow = ZERO_0.optimizer + (ZERO_1.optimizer - ZERO_0.optimizer) * so;
    const totalNow = ZERO_1.weights + ZERO_1.gradients + optNow;

    const nodes = [txt('OPTIMIZER PARTITIONED ACROSS 4 RANKS', -200, -210, 28, ROLE.opt, 'mono')];

    rankXs.forEach((rx, r) => {
      nodes.push(txt(`Rank ${r}`, rx, baseY + 42, 28, COSMOS.ink, 'mono'));
      let curBottom = baseY;
      const hW = ZERO_1.weights * unitPx;
      nodes.push(
        rect(186, hW - 6, {
          fill: '#132a4f',
          stroke: fw > 0.5 ? COSMOS.gold : ROLE.weights,
          width: fw > 0.5 ? 3.2 : 2.4,
          radius: 8,
        })
          .at(rx, curBottom - hW * 0.5)
          .glow(fw > 0.5 ? 10 : 4, ROLE.weights),
        txt('W: 2', rx, curBottom - hW * 0.5, 26, ROLE.weights, 'mono'),
      );
      curBottom -= hW;

      const hG = ZERO_1.gradients * unitPx;
      nodes.push(
        rect(186, hG - 6, { fill: '#231742', stroke: ROLE.grads, width: 2.4, radius: 8 }).at(
          rx,
          curBottom - hG * 0.5,
        ),
        txt('G: 2', rx, curBottom - hG * 0.5, 26, ROLE.grads, 'mono'),
      );
      curBottom -= hG;

      const hO = optNow * unitPx;
      nodes.push(
        rect(186, Math.max(46, hO - 4), {
          fill: '#2b2210',
          stroke: ROLE.opt,
          width: 2.8,
          radius: 8,
        })
          .at(rx, curBottom - Math.max(46, hO) * 0.5)
          .glow(8, ROLE.opt),
        txt(
          so > 0.7 ? `O${r}: 1` : `Opt: ${optNow.toFixed(1)}`,
          rx,
          curBottom - Math.max(46, hO) * 0.5,
          26,
          ROLE.opt,
          'mono',
        ),
      );
    });

    nodes.push(
      glassCell(600, -40, 440, 290, sf > 0.5 ? ROLE.good : ROLE.opt, {
        fill: '#0e2226',
        glow: 10,
      }),
      txt('PER RANK TOTAL', 600, -138, 26, COSMOS.muted, 'mono'),
      txt(
        `${totalNow.toFixed(1)} units`,
        600,
        -68,
        52,
        sf > 0.5 ? ROLE.good : COSMOS.gold,
        'mono',
      ).glow(7, sf > 0.5 ? ROLE.good : COSMOS.gold),
      txt('2 W + 2 G + 1 Opt', 600, 12, 28, COSMOS.ink, 'mono'),
      txt('Weights stay full', 600, 68, 26, fw > 0.5 ? COSMOS.gold : COSMOS.muted, 'sans'),
    );

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-720 + u * 1440, 280, { radius: 6, color: ROLE.good }),
      txt(
        'Each rank updates only its own 1/4 optimizer shard · full parameters stay on every GPU',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('zero1-b1-1', () =>
    s.play(shardOpt.to(0.5, { duration: remainDuration(c, 'zero1-b1-1', 0.5) })),
  );
  c.on('zero1-b2-1', () =>
    s.play(shardOpt.to(1, { duration: remainDuration(c, 'zero1-b2-1', 0.5) })),
  );
  c.on('zero1-b2-2', () =>
    s.play(showFive.to(1, { duration: remainDuration(c, 'zero1-b2-2', 0.45) })),
  );
  c.on('zero1-b3-1', () =>
    s.play(focusW.to(1, { duration: remainDuration(c, 'zero1-b3-1', 0.45) })),
  );
}
