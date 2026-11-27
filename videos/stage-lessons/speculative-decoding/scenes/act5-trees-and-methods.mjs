// Act 5: Speculative Trees & Proposal Architectures
// (tree-mask, tree-leak, medusa-contract, eagle-family, lookup-methods, block-contract)
import { group, line, line3d, point3d, rect } from 'vizmatic/stage';
import { cinematic3d, orbitScene } from '../../cinematic-kit.mjs';
import {
  COSMOS,
  cinemaRails,
  crossPhase,
  decomposition,
  glowingArc,
  guardedDynamic,
  heroAura,
  heroTitle,
  isolationFixture,
  onCue,
  probBarH,
  samplerBoundary,
  tokenPill,
  txt,
  visibility,
} from '../shared.mjs';

/**
 * Scene 20: tree-mask ("Construct tree visibility and equal-depth positions")
 * SIGNATURE 3D SCENE: Orbiting 3D candidate tree (prefix -> roots 0 & 1 at pos 10 -> children 2 & 3 at pos 11)
 * paired beside the glowing 4x4 ancestor visibility matrix!
 */
export function treeMask(s, c) {
  const parents = [null, null, 0, 1];
  const maskRows = [0, 1, 2, 3].map((q) => visibility(parents, q));

  const showTree = s.value(0);
  const showMatrix = s.value(0);
  const hlRow2 = s.value(0);
  const hlRow3 = s.value(0);
  const showPos = s.value(0);

  // Orbiting 3D candidate tree on left half of stage
  const view3d = cinematic3d({
    theta: -0.68,
    phi: 1.02,
    distance: 13.8,
    unit: 112,
    focus: [0, 0, 0.2],
  }).at(-420, 12);

  const pPrefix = [0, 0, 2.0];
  const p0 = [-1.4, -0.4, 0.4];
  const p1 = [1.4, 0.4, 0.4];
  const p2 = [-1.9, -0.7, -1.2];
  const p3 = [1.9, 0.7, -1.2];

  const treeEdges = [
    line3d(pPrefix, p0, { color: COSMOS.cyan, width: 3.4, glow: 10, blend: 'screen' }),
    line3d(pPrefix, p1, { color: COSMOS.violet, width: 3.4, glow: 10, blend: 'screen' }),
    line3d(p0, p2, { color: COSMOS.cyan, width: 3.8, glow: 12, blend: 'screen' }),
    line3d(p1, p3, { color: COSMOS.violet, width: 3.8, glow: 12, blend: 'screen' }),
    // Subtle equal-depth plane rings connecting pos 10 roots & pos 11 children
    line3d(p0, p1, { color: COSMOS.gold, width: 1.8, opacity: 0.45 }),
    line3d(p2, p3, { color: COSMOS.emerald, width: 1.8, opacity: 0.45 }),
  ];

  const treeNodes = [
    point3d(pPrefix, { color: COSMOS.blue, radius: 11, glow: 14, blend: 'screen', onTop: true }),
    point3d(p0, { color: COSMOS.cyan, radius: 11, glow: 14, blend: 'screen', onTop: true }),
    point3d(p1, { color: COSMOS.violet, radius: 11, glow: 14, blend: 'screen', onTop: true }),
    point3d(p2, { color: COSMOS.cyan, radius: 12, glow: 16, blend: 'screen', onTop: true }),
    point3d(p3, { color: COSMOS.violet, radius: 12, glow: 16, blend: 'screen', onTop: true }),
  ];

  view3d.add(...treeEdges, ...treeNodes);

  const title = heroTitle(['Speculative tree mask', 'and equal-depth positions'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'BRANCH-ISOLATED ATTENTION',
  });

  const rightPanel = guardedDynamic(
    () => 1,
    () => {
      const sm = showMatrix.value;
      const r2 = hlRow2.value;
      const r3 = hlRow3.value;
      const sp = showPos.value;

      const nodes = [];
      const gridX = 225;
      const gridY = -175;
      const cell = 112;

      nodes.push(
        txt(
          '4x4 CANDIDATE VISIBILITY MATRIX',
          gridX + 2 * cell,
          gridY - 92,
          28,
          COSMOS.gold,
          'mono',
        ),
        txt('parents = [none, none, 0, 1]', -420, -218, 26, COSMOS.muted, 'mono').opacity(
          Math.max(0.3, showTree.value),
        ),
      );

      // Column headers
      for (let col = 0; col < 4; col++) {
        nodes.push(
          txt(`c${col}`, gridX + col * cell + cell * 0.5, gridY - 40, 26, COSMOS.muted, 'mono'),
        );
      }

      // 4x4 visibility matrix cells
      for (let row = 0; row < 4; row++) {
        const y = gridY + row * cell + cell * 0.5;
        const isR2 = row === 2 && r2 > 0.25;
        const isR3 = row === 3 && r3 > 0.25;
        nodes.push(
          txt(
            `q${row}`,
            gridX - 46,
            y,
            28,
            isR2 ? COSMOS.cyan : isR3 ? COSMOS.violet : COSMOS.ink,
            'mono',
          ),
        );

        for (let col = 0; col < 4; col++) {
          const val = maskRows[row][col];
          const x = gridX + col * cell + cell * 0.5;
          const activeCol = isR2 ? COSMOS.cyan : isR3 ? COSMOS.violet : COSMOS.emerald;
          const strokeCol = val ? activeCol : '#2b395c';
          const fillCol = val ? (isR2 ? '#5ce1e648' : isR3 ? '#a78bfa48' : '#6ee7b730') : '#0d1222';
          nodes.push(
            rect(cell - 12, cell - 12, {
              fill: fillCol,
              stroke: strokeCol,
              width: isR2 || isR3 ? 3.2 : 2.0,
              radius: 10,
            })
              .at(x, y)
              .opacity(Math.max(0.25, sm)),
            txt(val ? '1' : '-inf', x, y, 28, val ? COSMOS.ink : COSMOS.dim, 'mono').opacity(
              Math.max(0.25, sm),
            ),
          );
        }

        // Depth position badge on right of each row
        if (sp > 0.05) {
          const pos = row < 2 ? 10 : 11;
          const pCol = row < 2 ? COSMOS.gold : COSMOS.emerald;
          nodes.push(
            txt(`pos ${pos}`, gridX + 4 * cell + 72, y, 28, pCol, 'mono')
              .glow(6, pCol)
              .opacity(sp),
          );
        }
      }

      // 3D depth legend below tree
      if (sp > 0.05) {
        nodes.push(
          txt(
            'Roots (0, 1) -> pos 10   |   Children (2, 3) -> pos 11',
            -420,
            358,
            27,
            COSMOS.gold,
            'mono',
          ).opacity(sp),
        );
      }

      nodes.push(
        txt(
          'Each candidate query attends only to shared prefix, its ancestors, and itself: never siblings',
          0,
          415,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes);
    },
  );

  s.add(heroAura(-420, 40, 460, '#5ce1e622', '#a78bfa18'), title, view3d, rightPanel);
  orbitScene(s, c, view3d, { theta: -0.18, phi: 0.9 });

  onCue(s, c, 'sd-tree-mask-b0', (d) => showTree.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sd-tree-mask-b1', (d) => showMatrix.to(1, { duration: d }), { desired: 0.65 });
  onCue(s, c, 'sd-tree-row2', (d) => hlRow2.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-tree-row3', (d) => hlRow3.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-tree-mask-b2', (d) => showPos.to(0.6, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-tree-position', (d) => showPos.to(1, { duration: d }), { desired: 0.55 });
}

/**
 * Scene 21: tree-leak ("Change an off-branch value to test isolation")
 * Perturbs off-branch node 1 value from 100 -> 10,000:
 *   Tree mask output stays pinned at 1.731!
 *   Flattened causal mask explodes from 97.598 -> 9,759.8!
 */
export function treeLeak(s, c) {
  const iso100 = isolationFixture(100);
  const iso10k = isolationFixture(10000);

  const showTest = s.value(0);
  const showTreeRes = s.value(0);
  const showFlatRes = s.value(0);
  const showTreeW = s.value(0);
  const showFlatW = s.value(0);
  const perturbVal = s.value(0); // 0 -> 1 ramps off-branch value 100 -> 10,000!
  const showExplode = s.value(0);

  const title = heroTitle(['Off-branch perturbation', 'proves tree isolation'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.emerald,
    eyebrow: 'QUERY NODE 2 ISOLATION TEST',
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const pv = perturbVal.value;
      const curOff = Math.round(100 + (10000 - 100) * pv);
      const curIso = isolationFixture(curOff);

      const nodes = [];

      // Top node-1 off-branch control bar
      nodes.push(
        tokenPill(`Off-branch Node 1 value = ${curOff.toLocaleString()}`, 0, -225, {
          w: 760,
          h: 82,
          color: pv > 0.2 ? COSMOS.rose : COSMOS.amber,
          wordColor: pv > 0.2 ? COSMOS.rose : COSMOS.gold,
          wordSize: 32,
          glow: pv > 0.2 ? 14 : 8,
          opacity: Math.max(0.3, showTest.value),
        }),
      );

      // Left column: Correct Tree Mask [1, 0, 1, 0] -> invariant 1.731
      const lx = -430;
      nodes.push(
        txt('TREE MASK  [1, 0, 1, 0]', lx, -100, 30, COSMOS.emerald, 'mono'),
        txt(
          `weights: [${curIso.tree.weights.map((w) => w.toFixed(3)).join(', ')}]`,
          lx,
          -42,
          26,
          COSMOS.muted,
          'mono',
        ).opacity(Math.max(0.25, showTreeW.value)),
        tokenPill(`output = ${curIso.tree.result.toFixed(3)}`, lx, 85, {
          w: 560,
          h: 120,
          color: COSMOS.emerald,
          wordColor: COSMOS.emerald,
          wordSize: 48,
          sub: 'INVARIANT: ZERO LEAK',
          subColor: COSMOS.emerald,
          subYOffset: 98,
          glow: 14,
          opacity: Math.max(0.2, showTreeRes.value),
        }),
      );

      // Right column: Flattened Causal Mask [1, 1, 1, 0] -> leaks node 1!
      const rx = 430;
      nodes.push(
        txt('FLATTENED CAUSAL  [1, 1, 1, 0]', rx, -100, 30, COSMOS.rose, 'mono'),
        txt(
          `weights: [${curIso.flat.weights.map((w) => w.toFixed(3)).join(', ')}]`,
          rx,
          -42,
          26,
          COSMOS.rose,
          'mono',
        ).opacity(Math.max(0.25, showFlatW.value)),
        tokenPill(`output = ${curIso.flat.result.toFixed(1)}`, rx, 85, {
          w: 560,
          h: 120,
          color: COSMOS.rose,
          wordColor: COSMOS.rose,
          wordSize: 48,
          sub: showExplode.value > 0.25 ? 'EXPLODES > 9,700!' : 'LEAKS SIBLING NODE 1',
          subColor: COSMOS.rose,
          subYOffset: 98,
          glow: 14,
          opacity: Math.max(0.2, showFlatRes.value),
        }),
      );

      // Ambient pulse beam showing isolation divider between left & right
      nodes.push(
        line([0, -135], [0, 235], { stroke: '#3a4b78', width: 2.2, dash: [6, 8] }),
        txt(
          `At v1=100: ${iso100.tree.result.toFixed(3)} vs ${iso100.flat.result.toFixed(3)}   |   At v1=10,000: ${iso10k.tree.result.toFixed(3)} vs ${iso10k.flat.result.toFixed(1)}`,
          0,
          415,
          27,
          COSMOS.gold,
          'mono',
        ),
      );
      return group(...nodes);
    },
  );

  s.add(heroAura(-430, 85, 420, '#6ee7b71a', '#ff6b8b14'), cinemaRails(), title, view);

  onCue(s, c, 'sd-tree-leak-b0', (d) => showTest.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-tree-weights', (d) => showTreeW.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-tree-correct', (d) => showTreeRes.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-flat-weights', (d) => showFlatW.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-tree-flat', (d) => showFlatRes.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-tree-leak-b1', (d) => perturbVal.to(0.15, { duration: d }), { desired: 0.3 });
  onCue(s, c, 'sd-tree-perturb', (d) => perturbVal.to(1, { duration: d }), { desired: 0.95 });
  onCue(s, c, 'sd-tree-perturbed-result', (d) => showExplode.to(1, { duration: d }), {
    desired: 0.5,
  });
}

/**
 * Scene 22: medusa-contract ("Separate extra prediction heads from target preservation")
 * Phase 1: Medusa-1 (frozen backbone W0) vs Medusa-2 (joint backbone + heads -> W1).
 * Phase 2: 2x2 preservation matrix: (Frozen W0 / Joint W1) x (Exact Verifier / Typical Acceptance).
 */
export function medusaContract(s, c) {
  const p1 = s.value(1);
  const p2 = s.value(0);

  const showHeads = s.value(0);
  const showTypical = s.value(0);

  const title = heroTitle(['Medusa heads vs', 'target preservation'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.violet,
    eyebrow: 'BACKBONE & ACCEPTANCE SEPARATION',
  });

  const v1 = guardedDynamic(p1, (a) => {
    const sh = showHeads.value;
    const nodes = [
      tokenPill('Medusa-1: Frozen Backbone W0', -440, -145, {
        w: 640,
        h: 96,
        color: COSMOS.blue,
        wordSize: 30,
        opacity: a,
      }),
      tokenPill('Medusa-2: Joint Training -> W1', 440, -145, {
        w: 640,
        h: 96,
        color: COSMOS.rose,
        wordSize: 30,
        opacity: a,
      }),
    ];
    for (let side = 0; side < 2; side++) {
      const cx = side === 0 ? -440 : 440;
      const col = side === 0 ? COSMOS.cyan : COSMOS.rose;
      for (let h = 0; h < 3; h++) {
        const hx = cx - 210 + h * 210;
        nodes.push(
          line([cx, -92], [hx, 45], { stroke: col, width: 2.8 }).opacity(Math.max(0.3, sh) * a),
          tokenPill(`Head +${h + 1}`, hx, 92, {
            w: 176,
            h: 82,
            color: col,
            wordSize: 27,
            opacity: Math.max(0.3, sh) * a,
          }),
        );
      }
    }
    nodes.push(
      txt(
        'Future heads propose candidates on target hidden features; track whether backbone weights changed',
        0,
        415,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const v2 = guardedDynamic(p2, (a) => {
    const typ = showTypical.value;
    const rows = [
      { label: 'Frozen W0', changed: false, y: -45, col: COSMOS.blue },
      { label: 'Joint W1', changed: true, y: 155, col: COSMOS.cyan },
    ];
    const nodes = [
      txt('EXACT VERIFIER', 0, -190, 28, COSMOS.emerald, 'mono').opacity(a),
      txt('TYPICAL ACCEPTANCE', 560, -190, 28, COSMOS.rose, 'mono').opacity(a),
    ];
    for (const r of rows) {
      const exactRes = samplerBoundary(r.changed, true);
      const typRes = samplerBoundary(r.changed, false);
      nodes.push(
        tokenPill(r.label, -580, r.y, { w: 360, h: 92, color: r.col, wordSize: 32, opacity: a }),
        tokenPill(exactRes.targetLawEstablished ? `Exact ${exactRes.target}` : 'Shifted', 0, r.y, {
          w: 460,
          h: 92,
          color: COSMOS.emerald,
          wordColor: COSMOS.emerald,
          wordSize: 30,
          opacity: a,
        }),
        tokenPill(
          typRes.targetLawEstablished ? `Exact ${typRes.target}` : 'Probabilities shift',
          560,
          r.y,
          {
            w: 460,
            h: 92,
            color: COSMOS.rose,
            wordColor: COSMOS.rose,
            wordSize: 30,
            opacity: Math.max(0.25, typ) * a,
          },
        ),
      );
    }
    nodes.push(
      txt(
        'Exact sampling preserves whichever checkpoint verifies (W0 or W1); typical acceptance alters odds',
        0,
        415,
        28,
        COSMOS.gold,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(heroAura(0, 20, 520, '#a78bfa1c', '#6ee7b716'), cinemaRails(), title, v1, v2);

  onCue(s, c, 'sd-medusa-contract-b0', (d) => showHeads.to(1, { duration: d }), { desired: 0.6 });
  onCue(s, c, 'sd-medusa-contract-b1', (d) => crossPhase(p1, p2, d), { desired: 0.45 });
  onCue(s, c, 'sd-medusa-contract-b1', (d) => showTypical.to(1, { duration: d }), {
    desired: 0.65,
  });
}

/**
 * Scene 23: eagle-family ("Follow the actual feature and training objectives")
 * Phase 1: Original EAGLE pre-head feature prediction + sampled token feedback.
 * Phase 2: EAGLE-2 confidence path products (0.8*0.5 = 0.40 vs 0.6*0.7 = 0.42!).
 * Phase 3: EAGLE-3 multi-layer fusion (low/mid/high) -> direct token objective + serving memory.
 */
export function eagleFamily(s, c) {
  const p1 = s.value(1);
  const p2 = s.value(0);
  const p3 = s.value(0);

  const showP1 = s.value(0);
  const showPathScore = s.value(0);
  const showE3 = s.value(0);
  const showMem = s.value(0);

  const title = heroTitle(['EAGLE 1 -> 2 -> 3', 'features, trees, direct tokens'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'FEATURE-CONDITIONED DRAFTING',
  });

  const v1 = guardedDynamic(p1, (a) => {
    const nodes = [
      txt('ORIGINAL EAGLE: FEATURE EXTRAPOLATION', 0, -215, 28, COSMOS.cyan, 'mono').opacity(a),
      tokenPill('Target Pre-Head Feature', -470, -70, {
        w: 540,
        h: 92,
        color: COSMOS.blue,
        wordSize: 28,
        opacity: a,
      }),
      line([-190, -70], [160, -70], { stroke: COSMOS.cyan, width: 3.8 })
        .glow(8, COSMOS.cyan)
        .opacity(a),
      tokenPill('Draft Predicted Feature', 460, -70, {
        w: 540,
        h: 92,
        color: COSMOS.cyan,
        wordSize: 28,
        opacity: a,
      }),

      tokenPill('Sampled Token Input', -470, 145, {
        w: 540,
        h: 92,
        color: COSMOS.gold,
        wordSize: 28,
        opacity: a,
      }),
      line([-190, 145], [160, 145], { stroke: COSMOS.gold, width: 3.8 })
        .glow(8, COSMOS.gold)
        .opacity(a),
      tokenPill('Shared Target LM Head', 460, 145, {
        w: 540,
        h: 92,
        color: COSMOS.emerald,
        wordSize: 28,
        opacity: a * Math.max(0.3, showP1.value),
      }),
      txt(
        'Draft predicts next pre-head features conditioned on the previously sampled token',
        0,
        415,
        29,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  const v2 = guardedDynamic(p2, (a) => {
    const sc = showPathScore.value;
    const paths = [
      { x: -380, r: 0.8, ch: 0.5, prod: 0.4, win: false },
      { x: 380, r: 0.6, ch: 0.7, prod: 0.42, win: true },
    ];
    const nodes = [
      txt('EAGLE-2: DYNAMIC CONFIDENCE-GUIDED TREE', 0, -215, 28, COSMOS.gold, 'mono').opacity(a),
    ];
    for (const p of paths) {
      const col = p.win ? COSMOS.emerald : COSMOS.blue;
      nodes.push(
        tokenPill(`root conf = ${p.r.toFixed(1)}`, p.x, -95, {
          w: 380,
          h: 82,
          color: COSMOS.blue,
          wordSize: 30,
          opacity: a,
        }),
        line([p.x, -48], [p.x, 42], { stroke: col, width: 3.6 }).opacity(a),
        tokenPill(`child conf = ${p.ch.toFixed(1)}`, p.x, 88, {
          w: 380,
          h: 82,
          color: COSMOS.cyan,
          wordSize: 30,
          opacity: a,
        }),
        txt(
          `${p.r.toFixed(1)} * ${p.ch.toFixed(1)} = ${p.prod.toFixed(2)}${p.win ? '  (HIGHER)' : ''}`,
          p.x,
          215,
          36,
          col,
          'mono',
        )
          .glow(p.win ? 10 : 0, col)
          .opacity(sc * a),
      );
    }
    nodes.push(
      txt(
        'Multiply conditional draft confidence along ancestry: 0.42 beats 0.40 on reranking',
        0,
        415,
        29,
        COSMOS.emerald,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const v3 = guardedDynamic(p3, (a) => {
    const e3 = showE3.value;
    const mem = showMem.value;
    const layers = [
      { label: 'Low Layer Features', x: -560 },
      { label: 'Mid Layer Features', x: 0 },
      { label: 'High Layer Features', x: 560 },
    ];
    const nodes = [
      txt(
        'EAGLE-3: MULTI-LAYER FUSION + DIRECT TOKEN TRAINING',
        0,
        -225,
        28,
        COSMOS.emerald,
        'mono',
      ).opacity(a),
    ];
    for (const l of layers) {
      nodes.push(
        tokenPill(l.label, l.x, -100, {
          w: 420,
          h: 82,
          color: COSMOS.blue,
          wordSize: 28,
          opacity: a,
        }),
        line([l.x, -54], [0, 56], { stroke: COSMOS.cyan, width: 3.2 })
          .glow(8, COSMOS.cyan)
          .opacity(a),
      );
    }
    nodes.push(
      tokenPill('Fuse -> Direct Token Objective (multi-step training)', 0, 110, {
        w: 1120,
        h: 92,
        color: COSMOS.emerald,
        wordColor: COSMOS.emerald,
        wordSize: 32,
        glow: 12,
        opacity: Math.max(0.3, e3) * a,
      }),
      txt(
        mem > 0.25
          ? 'Draft weights, fused features & tree buffers share GPU memory alongside the target'
          : 'EAGLE-3 removes feature-regression loss and practices multi-step rollouts in training',
        0,
        415,
        28,
        mem > 0.25 ? COSMOS.amber : COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(heroAura(0, 20, 520, '#5ce1e61a', '#6ee7b716'), cinemaRails(), title, v1, v2, v3);

  onCue(s, c, 'sd-eagle-family-b0', (d) => showP1.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sd-eagle-family-b1', (d) => crossPhase(p1, p2, d), { desired: 0.45 });
  onCue(s, c, 'sd-eagle-family-b1', (d) => showPathScore.to(1, { duration: d }), { desired: 0.65 });
  onCue(s, c, 'sd-eagle3-objective', (d) => crossPhase(p2, p3, d), { desired: 0.45 });
  onCue(s, c, 'sd-eagle3-objective', (d) => showE3.to(1, { duration: d }), { desired: 0.6 });
  onCue(s, c, 'sd-eagle-family-b2', (d) => showMem.to(1, { duration: d }), { desired: 0.5 });
}

/**
 * Scene 24: lookup-methods ("The train arrives at …")
 * Phase 1: N-gram prompt lookup matching "The train" -> copies "arrives at".
 * Phase 2: Point-mass q=[0,0,1] against p=[0.2,0.3,0.5] -> survives 0.50; residual=[0.4,0.6,0].
 * Phase 3: Method spectrum: Lookup, Native MTP, Trained Parallel Draft (PARD).
 */
export function lookupMethods(s, c) {
  const lk = decomposition([0.2, 0.3, 0.5], [0, 0, 1]);

  const p1 = s.value(1);
  const p2 = s.value(0);
  const p3 = s.value(0);

  const showMatch = s.value(0);
  const showCopy = s.value(0);
  const showResidual = s.value(0);
  const showOthers = s.value(0);

  const title = heroTitle(['Prompt lookup &', 'alternative proposers'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.gold,
    eyebrow: 'WEIGHT-FREE & PARALLEL DRAFTING',
  });

  const v1 = guardedDynamic(p1, (a) => {
    const cp = showCopy.value;
    const words = ['The', 'train', 'arrives', 'at', 'noon', 'The', 'train'];
    const nodes = [
      txt('MATCH TRAILING N-GRAM IN EARLIER PROMPT', 0, -210, 28, COSMOS.cyan, 'mono').opacity(a),
    ];
    words.forEach((w, i) => {
      const x = -720 + i * 240;
      const isMatch = i === 0 || i === 1 || i === 5 || i === 6;
      const isSpan = (i === 2 || i === 3) && cp > 0.2;
      const col = isSpan ? COSMOS.gold : isMatch ? COSMOS.cyan : COSMOS.blue;
      nodes.push(
        tokenPill(w, x, -60, {
          w: 205,
          h: 82,
          color: col,
          wordSize: 28,
          glow: isMatch || isSpan ? 11 : 5,
          opacity: a,
        }),
      );
    });
    if (showMatch.value > 0.1) {
      nodes.push(
        glowingArc(-600, -108, 600, -108, -72, {
          color: COSMOS.cyan,
          width: 3.4,
          opacity: showMatch.value * a,
        }),
      );
    }
    if (cp > 0.05) {
      nodes.push(
        tokenPill('Deterministic Draft:  "arrives" -> "at"', 0, 175, {
          w: 760,
          h: 88,
          color: COSMOS.gold,
          wordColor: COSMOS.gold,
          wordSize: 32,
          glow: 12,
          opacity: cp * a,
        }),
      );
    }
    nodes.push(
      txt(
        'Point-mass proposal q(x) = 1 accepts with probability p(x); rejection zeros out x and renormalizes',
        0,
        415,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const v2 = guardedDynamic(p2, (a) => {
    const sr = showResidual.value;
    const pVec = [0.2, 0.3, 0.5];
    const rVec = lk.residual; // [0.4, 0.6, 0]
    const labels = ['ID 0', 'ID 1', 'ID 2 (q=1)'];
    const nodes = [
      txt('TARGET p = [0.2, 0.3, 0.5]', -430, -195, 28, COSMOS.gold, 'mono').opacity(a),
      txt('RESIDUAL AFTER REJECTION', 430, -195, 28, COSMOS.emerald, 'mono').opacity(a),
    ];
    for (let i = 0; i < 3; i++) {
      const y = -80 + i * 135;
      nodes.push(
        txt(labels[i], -835, y, 28, i === 2 ? COSMOS.amber : COSMOS.ink, 'mono', 'left').opacity(a),
        probBarH(-590, y, 380, 34, pVec[i], 0.7, { color: COSMOS.gold, opacity: a }),
        txt(pVec[i].toFixed(1), -190, y, 28, COSMOS.gold, 'mono', 'left').opacity(a),

        probBarH(230, y, 380, 34, rVec[i] * sr, 0.7, { color: COSMOS.emerald, opacity: a }),
        txt(
          sr > 0.25 ? rVec[i].toFixed(1) : '...',
          635,
          y,
          28,
          i === 2 ? COSMOS.rose : COSMOS.emerald,
          'mono',
          'left',
        ).opacity(a),
      );
    }
    nodes.push(
      txt(
        'Remove ID 2 mass (0.5), normalize [0.2, 0.3, 0] / 0.5 -> [0.4, 0.6, 0]',
        0,
        415,
        29,
        COSMOS.emerald,
        'mono',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const v3 = guardedDynamic(p3, (a) => {
    const rows = [
      {
        k: 'Prompt / Output Lookup',
        v: 'zero neural weights: index search + buffers',
        c: COSMOS.gold,
      },
      {
        k: 'Native MTP Modules',
        v: 'family-specific multi-token heads inside target',
        c: COSMOS.cyan,
      },
      {
        k: 'Parallel Draft (PARD)',
        v: 'trained model emits multiple draft slots at once',
        c: COSMOS.violet,
      },
    ];
    const nodes = [];
    rows.forEach((r, i) => {
      const y = -115 + i * 165;
      nodes.push(
        tokenPill(r.k, -460, y, {
          w: 540,
          h: 92,
          color: r.c,
          wordSize: 30,
          opacity: a * Math.max(0.3, showOthers.value),
        }),
        line([-180, y], [-45, y], { stroke: r.c, width: 3.4 }).opacity(a),
        tokenPill(r.v, 410, y, {
          w: 880,
          h: 92,
          color: r.c,
          wordColor: COSMOS.ink,
          wordSize: 28,
          opacity: a * Math.max(0.3, showOthers.value),
        }),
      );
    });
    nodes.push(
      txt(
        'Always budget each proposer’s own weights, buffers, search work, and verification step',
        0,
        415,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(heroAura(0, 20, 520, '#ffd16618', '#5ce1e616'), cinemaRails(), title, v1, v2, v3);

  onCue(s, c, 'sd-lookup-methods-b0', (d) => showMatch.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sd-lookup-copy', (d) => showCopy.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sd-lookup-methods-b1', (d) => crossPhase(p1, p2, d), { desired: 0.45 });
  onCue(s, c, 'sd-lookup-residual', (d) => showResidual.to(1, { duration: d }), { desired: 0.65 });
  onCue(s, c, 'sd-lookup-methods-b2', (d) => crossPhase(p2, p3, d), { desired: 0.45 });
  onCue(s, c, 'sd-lookup-methods-b2', (d) => showOthers.to(1, { duration: d }), { desired: 0.6 });
}

/**
 * Scene 25: block-contract ("Which prefix passed?")
 * Side-by-side comparison: Token-wise verification (A pass, B reject -> Keep A) vs
 * Block verification (A fails, pair A B passes, A B C fails -> Keep A B), then Greedy switch (both keep A).
 */
export function blockContract(s, c) {
  const passA = s.value(0);
  const rejB = s.value(0);
  const failA = s.value(0);
  const passAB = s.value(0);
  const failABC = s.value(0);
  const showSglang = s.value(0);
  const isGreedy = s.value(0);

  const title = heroTitle(['Token-wise vs', 'block verification'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'PREFIX ACCEPTANCE RULES',
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const g = isGreedy.value > 0.5;
      const nodes = [];

      nodes.push(
        txt(
          g ? 'MODE: GREEDY DRAFT (POINT MASS)' : 'MODE: STOCHASTIC DRAFT',
          855,
          -365,
          28,
          g ? COSMOS.gold : COSMOS.cyan,
          'mono',
          'right',
        ),
      );

      // Row 1: Token-wise verification
      const y1 = -105;
      const tokVerdicts = [
        passA.value > 0.2 ? { t: 'PASS', c: COSMOS.emerald } : null,
        rejB.value > 0.2 ? { t: 'REJECT', c: COSMOS.rose } : null,
        rejB.value > 0.2 ? { t: 'STOPPED', c: COSMOS.dim } : null,
      ];
      nodes.push(txt('Token-wise', -835, y1, 34, COSMOS.ink, 'sans', 'left'));
      ['A', 'B', 'C'].forEach((tok, i) => {
        const v = tokVerdicts[i];
        const col = v ? v.c : COSMOS.blue;
        nodes.push(
          tokenPill(tok, -415 + i * 305, y1, {
            w: 220,
            h: 88,
            color: col,
            sub: v ? v.t : '...',
            subColor: col,
            subYOffset: 74,
          }),
        );
      });
      if (rejB.value > 0.2) {
        nodes.push(
          tokenPill('Keep A', 665, y1, {
            w: 290,
            h: 88,
            color: COSMOS.emerald,
            wordColor: COSMOS.emerald,
            wordSize: 32,
          }),
        );
      }

      // Row 2: Block (whole-prefix) verification
      const y2 = 155;
      const blkVerdicts = g
        ? [
            { t: 'PASS', c: COSMOS.emerald },
            { t: 'FAIL', c: COSMOS.rose },
            { t: 'FAIL', c: COSMOS.rose },
          ]
        : [
            failA.value > 0.2 ? { t: 'FAIL', c: COSMOS.rose } : null,
            passAB.value > 0.2 ? { t: 'PASS', c: COSMOS.emerald } : null,
            failABC.value > 0.2 ? { t: 'FAIL', c: COSMOS.rose } : null,
          ];
      nodes.push(txt('Block prefix', -835, y2, 34, COSMOS.cyan, 'sans', 'left'));
      ['A', 'A B', 'A B C'].forEach((tok, i) => {
        const v = blkVerdicts[i];
        const col = v ? v.c : COSMOS.blue;
        nodes.push(
          tokenPill(tok, -415 + i * 305, y2, {
            w: 220,
            h: 88,
            color: col,
            sub: v ? v.t : '...',
            subColor: col,
            subYOffset: 74,
          }),
        );
      });
      if (failABC.value > 0.2) {
        const outTxt = g ? 'Keep A' : 'Keep A B';
        nodes.push(
          tokenPill(outTxt, 665, y2, {
            w: 290,
            h: 88,
            color: COSMOS.gold,
            wordColor: COSMOS.gold,
            wordSize: 32,
          }),
        );
      }

      nodes.push(
        txt(
          g
            ? 'Under a greedy draft, both token-wise and block verification keep just A'
            : showSglang.value > 0.25
              ? 'Block verification tests whole prefixes with its own exact correction rule'
              : 'Token-wise stops at the first rejection; block verification can accept longer prefix A B',
          0,
          415,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes);
    },
  );

  s.add(heroAura(0, 20, 520, '#5ce1e61a', '#ffd16614'), cinemaRails(), title, view);

  onCue(s, c, 'sd-block-contract-b0', (d) => passA.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-block-reject', (d) => rejB.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-block-fail-a', (d) => failA.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-block-pair', (d) => passAB.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-block-full', (d) => failABC.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-block-contract-b1', (d) => showSglang.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-block-greedy', (d) => isGreedy.to(1, { duration: d }), { desired: 0.5 });
}
