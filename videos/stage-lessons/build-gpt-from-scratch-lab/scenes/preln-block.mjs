// Scene 11: Scale the same prediction to a full batch (3D heads, Pre-LN residual highway, 40 MB logits)
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  LAB_LOGIT_MB,
  aura,
  box3d,
  cinematic3d,
  glassCell,
  glowTex,
  glowingArc,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function prelnBlock(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const showHeads = s.value(0);
  const showScorePlane = s.value(0);

  const showPart2 = s.value(0);
  const showAttnAdd = s.value(0);
  const showExpand = s.value(0);
  const showGelu = s.value(0);
  const showProject = s.value(0);
  const showMlpAdd = s.value(0);

  const showPart3 = s.value(0);
  const showTied = s.value(0);
  const showMem = s.value(0);

  const bgAura = aura(320, 0, 560, '#1c346e28', '#3c216414');

  // Orbiting 3D tensor prism for Beat 1 (4 head slices of width 24 + causal plane)
  const heads3d = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 15.2,
    unit: 102,
    focus: [0, 0, 0.5],
  }).at(390, 20);
  const headColors = [COSMOS.cyan, COSMOS.blue, COSMOS.violet, COSMOS.gold];
  headColors.forEach((col, i) => {
    const z = -0.7 + i * 0.65;
    heads3d.add(...box3d(-1.8, -1.5, z, 3.6, 3.0, 0.36, '#102238', col, 0.72));
  });

  const part1 = guardedDynamic(showPart1, (a) => {
    const sh = showHeads.value;
    const sp = showScorePlane.value;
    const nodes = [
      heroTitle(['Scale to a', 'Full CPU Batch'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.cyan,
        eyebrow: 'TINY GPT LAB · [12, 48, 96] -> 4 HEADS',
      }).opacity(a),

      txt('INPUT TENSOR SHAPE', -855, -180, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt(
        '[12 windows, 48 positions, 96 features]',
        -855,
        -124,
        34,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(a),
    ];

    if (sh > 0.05) {
      nodes.push(
        txt('FUSED QKV -> 4 HEADS', -855, -24, 26, COSMOS.cyan, 'mono', 'left').opacity(sh * a),
        txt('[12, 4 heads, 48 pos, d_k = 24]', -855, 32, 34, COSMOS.cyan, 'mono', 'left')
          .glow(6, COSMOS.cyan)
          .opacity(sh * a),
      );
    }

    if (sp > 0.05) {
      nodes.push(
        txt('PER-HEAD CAUSAL SCORE GRID', -855, 134, 26, COSMOS.gold, 'mono', 'left').opacity(
          sp * a,
        ),
        txt(
          '48 queries x 48 keys  (divide by sqrt(24), mask -inf)',
          -855,
          192,
          30,
          COSMOS.gold,
          'mono',
          'left',
        )
          .glow(6, COSMOS.gold)
          .opacity(sp * a),
        txt(
          'Every row keeps >= 1 finite allowed key',
          -855,
          250,
          28,
          COSMOS.emerald,
          'sans',
          'left',
        ).opacity(sp * a),
      );
    }

    nodes.push(
      txt('4 PARALLEL ATTENTION HEADS', 390, -370, 26, COSMOS.cyan, 'mono').opacity(a),
      txt(
        'Each head slice has width 24 -> concatenated back to 96',
        390,
        405,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Beat 2: Pre-LN Residual Highway + live GELU curve
  const geluPts = Array.from({ length: 45 }, (_, i) => {
    const x = -3 + (6 * i) / 44;
    // Exact GELU(x) = 0.5 * x * (1 + erf(x / sqrt(2))) using Abramowitz-Stegun erf
    const t = 1 / (1 + 0.3275911 * Math.abs(x / Math.SQRT2));
    const poly =
      t *
      (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
    const erf = Math.sign(x) * (1 - poly * Math.exp(-(x * x) / 2));
    const y = 0.5 * x * (1 + erf);
    return [370 + x * 52, 260 - y * 44];
  });

  const part2 = guardedDynamic(showPart2, (a) => {
    const aa = showAttnAdd.value;
    const ex = showExpand.value;
    const ge = showGelu.value;
    const pr = showProject.value;
    const ma = showMlpAdd.value;

    const skipY = -140;
    const branchY = 90;

    const nodes = [
      heroTitle(['Pre-LN Residual', 'Highway & GELU MLP'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.blue,
        eyebrow: 'TWO SHORTCUTS FOR CLEAN GRADIENT FLOW',
      }).opacity(a),

      // Direct blue residual identity stream across the top (split cleanly around the two + add junctions)
      glowingTrail(
        [
          [-820, skipY],
          [-280, skipY],
        ],
        { color: COSMOS.blue, width: 5.5, opacity: a },
      ),
      glowingTrail(
        [
          [-200, skipY],
          [740, skipY],
        ],
        { color: COSMOS.blue, width: 5.5, opacity: a },
      ),
      txt('IDENTITY RESIDUAL PATH  h', -820, skipY - 46, 26, COSMOS.blue, 'mono', 'left').opacity(
        a,
      ),

      // Branch 1: LN1 -> Causal Attn -> + u
      glowingArc([-730, skipY], [-620, branchY], 50, { color: COSMOS.cyan, width: 3, opacity: a }),
      glassCell(-500, branchY, 240, 86, COSMOS.cyan, { fill: '#10223b', glow: 6, opacity: a }),
      txt('LN -> Attn', -500, branchY + 2, 30, COSMOS.cyan, 'mono').opacity(a),
    ];

    if (aa > 0.05) {
      nodes.push(
        glowingArc([-380, branchY], [-240, skipY + 42], 32, {
          color: COSMOS.emerald,
          width: 3.4,
          opacity: aa * a,
        }),
        glassCell(-240, skipY, 72, 72, COSMOS.emerald, {
          fill: '#0e2824',
          radius: 36,
          glow: 8,
          opacity: aa * a,
        }),
        txt('+', -240, skipY + 2, 40, COSMOS.emerald, 'mono').opacity(aa * a),
        txt('u = h + Attn(LN(h))', -240, skipY - 64, 26, COSMOS.emerald, 'mono').opacity(aa * a),
      );
    }

    if (ex > 0.05) {
      nodes.push(
        glowingArc([-140, skipY], [-50, branchY], 50, {
          color: COSMOS.violet,
          width: 3.2,
          opacity: ex * a,
        }),
        glassCell(110, branchY, 310, 86, COSMOS.violet, {
          fill: '#1d1435',
          glow: 7,
          opacity: ex * a,
        }),
        txt('LN -> 96 -> 384', 110, branchY + 2, 30, COSMOS.violet, 'mono').opacity(ex * a),
      );
    }

    if (ge > 0.05) {
      nodes.push(
        line([205, 260], [535, 260], { stroke: COSMOS.rule, width: 1.8 }).opacity(ge * a),
        line([370, 325], [370, 120], { stroke: COSMOS.rule, width: 1.8 }).opacity(ge * a),
        glowingTrail(geluPts, { color: COSMOS.gold, width: 4.5, opacity: ge * a }),
        txt('GELU(x) = x · Phi(x)', 370, 362, 28, COSMOS.gold, 'mono')
          .glow(6, COSMOS.gold)
          .opacity(ge * a),
      );
    }

    if (pr > 0.05) {
      nodes.push(
        glassCell(670, branchY, 210, 86, COSMOS.gold, {
          fill: '#251e0e',
          glow: 6,
          opacity: pr * a,
        }),
        txt('384 -> 96', 670, branchY + 2, 30, COSMOS.gold, 'mono').opacity(pr * a),
      );
    }

    if (ma > 0.05) {
      nodes.push(
        glowingArc([760, branchY - 46], [780, skipY + 44], 10, {
          color: COSMOS.emerald,
          width: 3.6,
          opacity: ma * a,
        }),
        glassCell(780, skipY, 72, 72, COSMOS.emerald, {
          fill: '#0e2824',
          radius: 36,
          glow: 9,
          opacity: ma * a,
        }),
        txt('+', 780, skipY + 2, 40, COSMOS.emerald, 'mono').opacity(ma * a),
        txt("h' = u + MLP(LN(u))", 640, skipY - 64, 26, COSMOS.emerald, 'mono').opacity(ma * a),
        txt(
          'Token-wise MLP · both shortcuts carry direct gradients',
          -820,
          340,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(ma * a),
      );
    }

    return group(...nodes);
  });

  // Beat 3: Final LN + Tied Output -> 40.3 MB float32 logits
  const part3 = guardedDynamic(showPart3, (a) => {
    const td = showTied.value;
    const mm = showMem.value;
    const nodes = [
      heroTitle(['Two Blocks to', 'Vocabulary Logits'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.gold,
        eyebrow: 'TIED OUTPUT HEAD · CROSS-ENTROPY MEMORY FOOTPRINT',
      }).opacity(a),

      glassCell(-640, -10, 320, 108, COSMOS.cyan, { fill: '#102138', glow: 6, opacity: a }),
      txt('2x Pre-LN + LN_f', -640, -28, 30, COSMOS.cyan, 'mono').opacity(a),
      txt('[576, 96]', -640, 18, 28, COSMOS.ink, 'mono').opacity(a),

      // Lower logit-memory readout visible from Beat 3 start (luminance >= 40), glowing rose on logit-storage
      txt(
        'FLOAT32 LOGIT TENSOR ALONE (BEFORE BACKWARD)',
        -800,
        165,
        26,
        mm > 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ).opacity(Math.max(0.75, mm) * a),
      txt(
        mm > 0.3 ? `~${LAB_LOGIT_MB.toFixed(1)} MB / batch` : '576 pos x 17,485 vocab x 4 B',
        -800,
        238,
        mm > 0.3 ? 66 : 44,
        mm > 0.3 ? COSMOS.rose : COSMOS.cyan,
        'mono',
        'left',
      )
        .glow(mm > 0.3 ? 9 : 4, mm > 0.3 ? COSMOS.rose : COSMOS.cyan)
        .opacity(Math.max(0.75, mm) * a),
      txt(
        'Exact GELU · no dropout · no GPT-2 depth-scaled residual init',
        -800,
        324,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(Math.max(0.75, mm) * a),
    ];

    if (td > 0.05) {
      nodes.push(
        glowingArc([-476, -10], [-240, -10], -32, {
          color: COSMOS.gold,
          width: 3.8,
          opacity: td * a,
        }),
        glassCell(-40, -10, 390, 108, COSMOS.gold, { fill: '#261f0e', glow: 8, opacity: td * a }),
        txt('Tied W_e^T', -40, -28, 32, COSMOS.gold, 'mono').opacity(td * a),
        txt('[96, 17,485]', -40, 18, 28, COSMOS.ink, 'mono').opacity(td * a),
        glowingArc([160, -10], [340, -10], -32, {
          color: COSMOS.emerald,
          width: 3.8,
          opacity: td * a,
        }),
        glassCell(565, -10, 440, 108, COSMOS.emerald, {
          fill: '#0e2624',
          glow: 8,
          opacity: td * a,
        }),
        txt('Flat Logits', 565, -28, 32, COSMOS.emerald, 'mono').opacity(td * a),
        txt('[576, 17,485]', 565, 18, 28, COSMOS.ink, 'mono').opacity(td * a),
      );
    }

    return group(...nodes);
  });

  const eqLogit = glowTex('576 \\times 17{,}485 \\times 4\\text{ B} \\approx 40.3\\text{ MB}', {
    x: 420,
    y: 245,
    size: 38,
    color: COSMOS.gold,
    glow: 6,
  });

  s.add(bgAura, heads3d, part1, part2, part3);
  const part1End = Math.max(0.6, c.end - c.cue('preln-block-2').start + 0.35);
  orbitScene(s, c, heads3d, { theta: -0.22, phi: 0.9 }, { startOffset: 0.1, endMargin: part1End });

  c.on('preln-block-1', () => s.play(phase.to(1.2, { duration: 0.4 })));
  c.on('split-heads', () => s.play(showHeads.to(1, { duration: 0.5 })));
  c.on('score-shape', () => s.play(showScorePlane.to(1, { duration: 0.5 })));

  c.on('preln-block-2', () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.16)),
    );
  });
  c.hide('preln-block-2', [heads3d], { fade: 0.2 });
  c.on('residual-block', () => s.play(showAttnAdd.to(1, { duration: 0.45 })));
  c.on('expand-width', () => s.play(showExpand.to(1, { duration: 0.45 })));
  c.on('apply-gelu', () => s.play(showGelu.to(1, { duration: 0.5 })));
  c.on('gelu-width', () => s.play(showProject.to(1, { duration: 0.45 })));
  c.on('add-mlp', () => s.play(showMlpAdd.to(1, { duration: 0.45 })));

  c.on('preln-block-3', () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.16)),
    );
  });
  c.on('tied-output', () => s.play(showTied.to(1, { duration: 0.5 })));
  c.on('logit-storage', () =>
    s.play(showMem.to(1, { duration: remainDuration(c, 'logit-storage', 0.5) })),
  );
  c.show('logit-storage', eqLogit, { fade: 0.4 });
}
