// Scene 04: Count the replicated state: 4-rank teaching ledger (2W + 2G + 4O = 8 units/rank, 32 total).
import {
  COSMOS,
  ROLE,
  ZERO_0,
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

export default function ledger(s, c) {
  const phase = s.value(0);
  const showW = s.value(0);
  const showG = s.value(0);
  const showO = s.value(0);
  const showTot = s.value(0);
  const showActNote = s.value(0);

  const bgAura = aura(0, 20, 640, '#60a5fa1e', '#ffd16618');
  const title = heroTitle(['Count the Replicated', 'Training State'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.opt,
    eyebrow: '4-RANK LEDGER · DDP BASELINE (ZERO-0)',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sw = showW.value;
    const sg = showG.value;
    const so = showO.value;
    const st = showTot.value;
    const sn = showActNote.value;

    const unitPx = 44; // 8 units = 352 px
    const baseY = 175;
    const rankXs = [-620, -340, -60, 220];

    const nodes = [txt('4 RANKS · IDENTICAL REPLICATED COPIES', -200, -210, 28, ROLE.comm, 'mono')];

    rankXs.forEach((rx, r) => {
      nodes.push(txt(`Rank ${r}`, rx, baseY + 42, 28, COSMOS.ink, 'mono'));
      let curBottom = baseY;
      // Weights (2 units)
      const hW = ZERO_0.weights * unitPx;
      nodes.push(
        rect(172, hW - 6, {
          fill: '#132a4f',
          stroke: sw > 0.3 ? ROLE.weights : COSMOS.dim,
          width: 2.5,
          radius: 8,
        })
          .at(rx, curBottom - hW * 0.5)
          .opacity(0.3 + 0.7 * sw),
        txt('W: 2', rx, curBottom - hW * 0.5, 26, ROLE.weights, 'mono').opacity(0.3 + 0.7 * sw),
      );
      curBottom -= hW;

      // Gradients (2 units)
      const hG = ZERO_0.gradients * unitPx;
      nodes.push(
        rect(172, hG - 6, {
          fill: '#231742',
          stroke: sg > 0.3 ? ROLE.grads : COSMOS.dim,
          width: 2.5,
          radius: 8,
        })
          .at(rx, curBottom - hG * 0.5)
          .opacity(0.25 + 0.75 * sg),
        txt('G: 2', rx, curBottom - hG * 0.5, 26, ROLE.grads, 'mono').opacity(0.25 + 0.75 * sg),
      );
      curBottom -= hG;

      // Optimizer (4 units)
      const hO = ZERO_0.optimizer * unitPx;
      nodes.push(
        rect(172, hO - 6, {
          fill: '#2b2210',
          stroke: so > 0.3 ? ROLE.opt : COSMOS.dim,
          width: 2.5,
          radius: 8,
        })
          .at(rx, curBottom - hO * 0.5)
          .opacity(0.2 + 0.8 * so),
        txt('Opt: 4', rx, curBottom - hO * 0.5, 28, ROLE.opt, 'mono').opacity(0.2 + 0.8 * so),
      );
    });

    // Right readout
    nodes.push(
      glassCell(600, -40, 440, 260, st > 0.5 ? ROLE.bad : ROLE.opt, {
        fill: '#1b1424',
        glow: st > 0.5 ? 10 : 4,
      }),
      txt('PER RANK', 600, -124, 26, COSMOS.muted, 'mono'),
      txt('8 units', 600, -64, 52, COSMOS.gold, 'mono').glow(6, COSMOS.gold),
      txt('4 RANKS TOTAL', 600, 12, 26, COSMOS.muted, 'mono'),
      txt(st > 0.5 ? '32 units' : '4 × 8', 600, 62, 36, ROLE.bad, 'mono'),
    );

    const u = (p * 0.6) % 1;
    nodes.push(
      glowDot(-720 + u * 1440, 280, { radius: 6, color: ROLE.opt }),
      txt(
        sn > 0.5
          ? 'Activations, comm workspaces & allocator overhead sit on top of this state ledger'
          : 'Optimizer history (4 units) dominates the 8-unit per-rank footprint',
        0,
        355,
        28,
        sn > 0.5 ? ROLE.comm : COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('ledger-weights', () =>
    s.play(showW.to(1, { duration: remainDuration(c, 'ledger-weights', 0.4) })),
  );
  c.on('ledger-gradients', () =>
    s.play(showG.to(1, { duration: remainDuration(c, 'ledger-gradients', 0.4) })),
  );
  c.on('ledger-optimizer', () =>
    s.play(showO.to(1, { duration: remainDuration(c, 'ledger-optimizer', 0.4) })),
  );
  c.on('ledger-b2-1', () =>
    s.play(showTot.to(1, { duration: remainDuration(c, 'ledger-b2-1', 0.45) })),
  );
  c.on('ledger-b3-1', () =>
    s.play(showActNote.to(1, { duration: remainDuration(c, 'ledger-b3-1', 0.45) })),
  );
}
