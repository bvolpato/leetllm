// Scene 13: Which change removes more attention scores? 12 MiB input, batch-vs-length quadratic score ablation, and 38.7 GB grid.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  activationBytes,
  afterDuration,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  runPhase,
  txt,
} from '../parts.mjs';

export default function activationBudget(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1); // Beat 0: 32 x 128 x 768 x 4 = 12 MiB
  const inputSolved = s.value(0);

  const showPart2 = s.value(0); // Beats 1 & 2: Halve batch (256->128) vs Halve length (256->64)
  const halfBatchProg = s.value(0);
  const halfLenProg = s.value(0);

  const showPart3 = s.value(0); // Beat 3: 32 x 12 x 12 x 2048^2 x 2 = 38.7 GB
  const largeRevealed = s.value(0);

  const bgAura = aura(0, 30, 560, '#5ce1e622', '#ffd16616');

  const title = heroTitle(['Activation Memory', 'and Quadratic Scores'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'ACTIVATIONS · BATCH SIZE VS SEQUENCE LENGTH',
  });

  const eq12Mib = glowTex(
    '32 \\times 128 \\times 768 \\times 4\\;\\mathrm{B} = 12\\;\\mathrm{MiB}',
    {
      x: 0,
      y: 165,
      size: 52,
      color: COSMOS.emerald,
    },
  );

  const eq38Gb = glowTex(
    '32 \\times 12 \\times 12 \\times 2048^2 \\times 2\\;\\mathrm{B} \\approx 38.7\\;\\mathrm{GB}',
    {
      x: 0,
      y: 235,
      size: 50,
      color: COSMOS.rose,
    },
  );

  const inputBytes = activationBytes({ batch: 32, tokens: 128, width: 768, bytes: 4 });
  const largeBytes = activationBytes({
    batch: 32,
    heads: 12,
    layers: 12,
    tokens: 2048,
    bytes: 2,
    scores: true,
  });

  const part1 = guardedDynamic(showPart1, (a) => {
    const solved = inputSolved.value;
    const dims = [
      { label: 'BATCH', val: '32', color: COSMOS.blue },
      { label: 'TOKENS', val: '128', color: COSMOS.cyan },
      { label: 'FEATURES', val: '768', color: COSMOS.gold },
      { label: 'FP32', val: '4 B', color: COSMOS.violet },
    ];
    const nodes = [
      txt('ONE INPUT BATCH IN FLOAT32', -855, -205, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
    ];
    dims.forEach((d, i) => {
      const cx = -615 + i * 410;
      nodes.push(
        glassCell(cx, -50, 320, 154, d.color, { fill: '#0e172c', glow: 8, opacity: a }),
        txt(d.label, cx, -86, 26, COSMOS.muted, 'mono').opacity(a),
        txt(d.val, cx, -22, 54, d.color, 'mono').opacity(a),
      );
      if (i < 3) {
        nodes.push(txt('×', cx + 205, -50, 44, COSMOS.muted, 'mono').opacity(a));
      }
    });
    nodes.push(
      glassCell(0, 340, 1580, 102, solved > 0.5 ? COSMOS.gold : COSMOS.rule, {
        fill: '#101627',
        glow: solved > 0.5 ? 7 : 0,
        opacity: a,
      }),
      txt(
        `Input alone: ${(inputBytes / 2 ** 20).toFixed(0)} MiB  +  saved activations  +  gradients  +  workspaces  +  optimizer`,
        0,
        343,
        28,
        solved > 0.5 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Part 2: Side-by-side 4 x (8x8) attention score grids (strictly withhold shrink until cues!)
  const part2 = guardedDynamic(showPart2, (a) => {
    const hb = halfBatchProg.value;
    const hl = halfLenProg.value;
    const planesLeft = 4 - Math.round(2 * hb);
    const sideRight = 8 - Math.round(4 * hl);
    const leftCount = planesLeft * 64;
    const rightCount = 4 * sideRight * sideRight;

    const nodes = [
      txt(
        'STORED ATTENTION SCORES (1 HEAD, 1 LAYER) · BOTH CHOICES HALVE INPUT TOKENS',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
    ];

    const panels = [
      {
        title: 'HALVE THE BATCH (4 -> 2)',
        cx: -435,
        color: COSMOS.cyan,
        isBatch: true,
        count: leftCount,
      },
      {
        title: 'HALVE SEQUENCE LENGTH (8 -> 4)',
        cx: 435,
        color: COSMOS.gold,
        isBatch: false,
        count: rightCount,
      },
    ];

    panels.forEach((panel) => {
      nodes.push(
        txt(panel.title, panel.cx, -140, 30, panel.color, 'mono').glow(5, panel.color).opacity(a),
      );
      for (let b = 0; b < 4; b++) {
        const col = b % 2;
        const row = Math.floor(b / 2);
        const gx0 = panel.cx - 210 + col * 230;
        const gy0 = -90 + row * 212;
        nodes.push(
          glassCell(gx0 + 92, gy0 + 92, 194, 194, COSMOS.rule, {
            fill: '#0c1222',
            glow: 0,
            opacity: a,
          }),
        );
        for (let q = 0; q < 8; q++) {
          for (let k = 0; k < 8; k++) {
            const keep = panel.isBatch ? b < planesLeft : q < sideRight && k < sideRight;
            if (keep) {
              nodes.push(
                rect(18, 18, { fill: panel.color, stroke: null, radius: 2 })
                  .at(gx0 + 12 + k * 22, gy0 + 12 + q * 22)
                  .opacity(0.9 * a),
              );
            }
          }
        }
      }
      const fracTag =
        panel.isBatch && hb > 0.7
          ? '  (1/2 left)'
          : !panel.isBatch && hl > 0.7
            ? '  (1/4 left)'
            : '';
      nodes.push(
        txt(`${panel.count} scores${fracTag}`, panel.cx, 375, 38, panel.color, 'mono')
          .glow(7, panel.color)
          .opacity(a),
      );
    });

    return group(...nodes);
  });

  // Part 3: Full-scale stored score grid = 38.7 GB
  const part3 = guardedDynamic(showPart3, (a) => {
    const rev = largeRevealed.value;
    const factors = [
      ['BATCH', '32', COSMOS.blue],
      ['HEADS', '12', COSMOS.cyan],
      ['LAYERS', '12', COSMOS.cyan],
      ['QUERY T', '2,048', COSMOS.gold],
      ['KEY T', '2,048', COSMOS.gold],
      ['FP16/BF16', '2 B', COSMOS.rose],
    ];
    const nodes = [
      txt(
        'EAGER STORED ATTENTION GRID AT SCALE',
        -855,
        -205,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ).opacity(a),
    ];
    factors.forEach(([label, val, col], i) => {
      const cx = -675 + i * 270;
      nodes.push(
        glassCell(cx, -35, 232, 160, col, { fill: '#101627', glow: 7, opacity: a }),
        txt(label, cx, -75, 26, COSMOS.muted, 'mono').opacity(a),
        txt(val, cx, -8, 42, col, 'mono').opacity(a),
      );
    });
    nodes.push(
      txt(
        rev > 0.5
          ? `${(largeBytes / 1e9).toFixed(2)} decimal GB just for attention scores · fused SDPA avoids materializing T × T`
          : 'Multiplying batch × heads × layers × T² × 2 bytes...',
        0,
        365,
        28,
        rev > 0.5 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, part1, part2, part3);
  runPhase(s, c, phase, 14);

  c.after('activation-input', () => {
    const dur = afterDuration(c, 'activation-input', 0.4);
    s.play(inputSolved.to(1, { duration: dur }));
  });
  c.show('activation-input', eq12Mib, { after: true, fade: 0.3 });

  c.hide('activation-grid', eq12Mib, { fade: 0.2 });
  c.on('activation-grid', () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('activation-halving', () => s.play(halfBatchProg.to(1, { duration: 0.7 })));
  c.on('activation-length', () => s.play(halfLenProg.to(1, { duration: 0.7 })));

  c.on('activation-large-grid', () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.after('activation-large-grid', () => {
    const dur = afterDuration(c, 'activation-large-grid', 0.45);
    s.play(largeRevealed.to(1, { duration: dur }));
  });
  c.show('activation-large-grid', eq38Gb, { after: true, fade: 0.3 });
}
