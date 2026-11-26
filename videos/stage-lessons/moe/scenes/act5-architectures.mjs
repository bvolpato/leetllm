// Act 5 (Scenes 25 to 30): Frontier MoE family architectures, DeepSeek-V3 auxiliary-loss-free
// selection bias, GLM-5.3 / DeepSeek-V4 checkpoint contracts, Qwen3.6 hybrid mixers,
// expert parallelism across GPUs, and coalesced wire protocols.
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
} from '../../cinematic-kit.mjs';
import {
  EXP_COLORS,
  REMOTE_ASSIGNMENTS,
  ROLE,
  TOK_COLORS,
  arcPts,
  buildDualGpuFabric3d,
  cinemaAtmosphere,
  clamp,
  fmt,
  lumBar,
  moeSelection,
  moeWire,
  playCue,
  swapVis,
  vecStr,
} from '../parts.mjs';

// ---------------------------------------------------------------------------
// Scene 25: family-architecture: "Read the dense and shared paths too"
// ---------------------------------------------------------------------------
export function familyArchitecture(s, c) {
  const title = heroTitle(['Read the dense and', 'shared paths too'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.expert,
  });

  const vMix = s.value(1);
  const vDs2 = s.value(0);
  const vDs3 = s.value(0);

  const pMix = s.value(0);
  const pV2 = s.value(0);
  const pV3 = s.value(0);

  // View 1 (Beat 0): Mixtral 8x7B (46.7B total / 12.9B active, 2 of 8 SwiGLU)
  const mixLayer = guardedDynamic(vMix, (alpha) => {
    const mx = pMix.value;
    const nodes = [
      txt(
        'Mixtral 8x7B   ·   Article snapshot (Oct 10, 2026)',
        0,
        -235,
        30,
        ROLE.expert,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        '8 SwiGLU routed experts per layer   ·   top-2 normalized',
        0,
        -170,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    for (let i = 0; i < 8; i++) {
      const cx = -630 + i * 180;
      const sel = i === 0 || i === 2;
      const col = sel ? (mx > 0.25 ? ROLE.active : ROLE.token) : '#556791';
      nodes.push(
        lumBar(cx, -25, 148, 142, {
          color: col,
          fillOpacity: sel ? 0.38 : 0.16,
          strokeWidth: sel ? 2.8 : 1.8,
          glow: sel ? 10 : 3,
          opacity: alpha,
        }),
        txt(`E${i + 1}`, cx, -42, 32, sel ? COSMOS.ink : col, 'mono', 'center').opacity(alpha),
        txt(sel ? 'active' : 'stored', cx, 4, 26, sel ? col : COSMOS.dim, 'mono', 'center').opacity(
          alpha,
        ),
      );
    }

    nodes.push(
      lumBar(-355, 205, 640, 128, {
        color: ROLE.router,
        fillOpacity: 0.24,
        strokeWidth: 2.5,
        glow: 9,
        opacity: alpha,
      }),
      txt('Stored:  ~47B total', -355, 182, 32, ROLE.router, 'mono', 'center').opacity(alpha),
      txt(
        'Shared attention/embed != 8 x 7B',
        -355,
        232,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),

      lumBar(355, 205, 640, 128, {
        color: ROLE.active,
        fillOpacity: 0.24,
        strokeWidth: 2.5,
        glow: 9,
        opacity: alpha,
      }),
      txt('Active:  ~13B / token', 355, 182, 32, ROLE.active, 'mono', 'center').opacity(alpha),
      txt('Shared parts + 2 SwiGLU experts', 355, 232, 26, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),
    );
    return nodes;
  });

  // View 2 (Beat 1): DeepSeek-V2 (1 dense FFN + 160 fine-grained top-6 + 2 shared, 236B / 21B)
  const ds2Layer = guardedDynamic(vDs2, (alpha) => {
    const v2 = pV2.value;
    const nodes = [
      txt(
        'DeepSeek-V2   ·   236B total  /  21B active',
        0,
        -235,
        32,
        ROLE.token,
        'mono',
        'center',
      ).opacity(alpha),
      // Layer strip: Layer 0 dense, Layers 1..59 MoE
      lumBar(-575, -130, 310, 82, {
        color: ROLE.router,
        fillOpacity: 0.3,
        strokeWidth: 2.5,
        glow: 8,
        opacity: alpha,
      }),
      txt('Layer 1: Dense FFN', -575, -130, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
      arrow([-408, -130], [-330, -130], { stroke: '#6c82b6', width: 3, tip: 12 }).opacity(alpha),
      lumBar(220, -130, 1080, 82, {
        color: ROLE.token,
        fillOpacity: 0.22,
        strokeWidth: 2.4,
        glow: 7,
        opacity: alpha,
      }),
      txt(
        'Remaining layers:  160 narrow routed (top-6)  +  2 always-on shared',
        220,
        -130,
        26,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    // Fine-grained 16x4 visual pool representing 160 routed experts (6 lit) + 2 shared on left
    nodes.push(
      lumBar(-610, 100, 290, 215, {
        color: ROLE.active,
        fillOpacity: 0.3,
        strokeWidth: 2.8,
        glow: 10,
        opacity: alpha,
      }),
      txt('2 Shared', -610, 68, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('always-on', -610, 118, 28, ROLE.active, 'mono', 'center').opacity(alpha),
      txt('every token', -610, 162, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );

    const litIdx = new Set([2, 9, 17, 26, 35, 44]);
    for (let i = 0; i < 48; i++) {
      const colIdx = i % 12;
      const rowIdx = Math.floor(i / 12);
      const gx = -335 + colIdx * 96;
      const gy = 14 + rowIdx * 58;
      const on = litIdx.has(i) && v2 > 0.2;
      nodes.push(
        lumBar(gx, gy, 80, 44, {
          color: on ? ROLE.router : '#485b87',
          fillOpacity: on ? 0.55 : 0.16,
          strokeWidth: on ? 2.6 : 1.3,
          glow: on ? 9 : 0,
          radius: 5,
          opacity: alpha,
        }),
      );
    }

    nodes.push(
      txt(
        'Fine-grained experts are narrower -> compare hidden widths and FLOPs, not just 6 vs 2',
        0,
        345,
        28,
        ROLE.router,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // View 3 (Beat 2): DeepSeek-V3 (first 3 dense + 256 routed top-8 + 1 shared, 671B / 37B, MLA separate)
  const ds3Layer = guardedDynamic(vDs3, (alpha) => {
    const v3 = pV3.value;
    const nodes = [
      txt(
        'DeepSeek-V3   ·   671B total  /  37B active',
        0,
        -235,
        32,
        ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),
      // Layer strip: first 3 layers dense
      lumBar(-520, -125, 490, 86, {
        color: ROLE.router,
        fillOpacity: 0.3,
        strokeWidth: 2.5,
        glow: 9,
        opacity: alpha,
      }),
      txt('Layers 1-3: Dense FFNs', -520, -125, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      arrow([-265, -125], [-208, -125], { stroke: '#6c82b6', width: 3, tip: 12 }).opacity(alpha),
      lumBar(295, -125, 980, 86, {
        color: ROLE.active,
        fillOpacity: 0.24,
        strokeWidth: 2.5,
        glow: 8,
        opacity: alpha,
      }),
      txt(
        'Later layers:  256 routed (top-8)  +  1 shared expert',
        295,
        -125,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),

      // Three clean summary modules
      lumBar(-520, 125, 480, 185, {
        color: ROLE.active,
        fillOpacity: 0.24,
        strokeWidth: 2.5,
        glow: 9,
        opacity: alpha,
      }),
      txt('Routed pool', -520, 82, 28, ROLE.active, 'mono', 'center').opacity(alpha),
      txt('8 / 256 active', -520, 134, 34, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('+ 1 shared expert', -520, 184, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),

      lumBar(0, 125, 480, 185, {
        color: ROLE.router,
        fillOpacity: 0.24,
        strokeWidth: 2.5,
        glow: 9,
        opacity: alpha,
      }),
      txt('Parameter counts', 0, 82, 28, ROLE.router, 'mono', 'center').opacity(alpha),
      txt('671B / 37B', 0, 134, 34, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('5.5% active per token', 0, 184, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),

      lumBar(520, 125, 480, 185, {
        color: v3 > 0.25 ? ROLE.token : '#4e608e',
        fillOpacity: v3 > 0.25 ? 0.26 : 0.16,
        strokeWidth: 2.5,
        glow: v3 > 0.25 ? 9 : 4,
        opacity: alpha,
      }),
      txt('Attention (separate axis)', 520, 82, 28, ROLE.token, 'mono', 'center').opacity(alpha),
      txt('MLA KV compression', 520, 134, 30, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('Not caused by MoE sparsity', 520, 184, 26, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),

      txt(
        'Check dense prefix layers, shared experts, and attention type before comparing models',
        0,
        345,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.expert, ROLE.active), title, mixLayer, ds2Layer, ds3Layer);

  playCue(s, c, 'mo-family-architecture-op-0', (d) => s.play(vMix.to(1, { duration: d })), {
    dur: 0.3,
  });
  playCue(s, c, 'mo-family-mixtral', (d) => s.play(pMix.to(1, { duration: d })), { dur: 0.65 });
  playCue(
    s,
    c,
    'mo-family-architecture-op-1',
    (d) => s.play(swapVis(vMix, vDs2, Math.min(0.6, d * 0.4))),
    { dur: 0.6 },
  );
  playCue(s, c, 'mo-family-v2', (d) => s.play(pV2.to(1, { duration: d })), { dur: 0.7 });
  playCue(
    s,
    c,
    'mo-family-architecture-op-2',
    (d) => s.play(swapVis(vDs2, vDs3, Math.min(0.6, d * 0.4))),
    { dur: 0.6 },
  );
  playCue(s, c, 'mo-family-v3', (d) => s.play(pV3.to(1, { duration: d })), { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// Scene 26: selection-bias: "Choose with bias, weight with original affinity"
// ---------------------------------------------------------------------------
export function selectionBias(s, c) {
  const title = heroTitle(['Choose with bias, weight', 'with original affinity'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.active,
  });

  const eq = glowTex(
    'i^* \\in \\operatorname{TopK}(s_i + b_i), \\quad \\tilde{g}_i = \\frac{s_i}{\\sum s_j}',
    { x: 430, y: -380, size: 34, color: ROLE.active },
  );

  const sel = moeSelection(); // affinities [0.6,0.5,0.4], bias [0,0,0.3], scores [0.6,0.5,0.7], ids [2,0], weights [0.4,0.6]

  const pB0 = s.value(0.5);
  const pB1 = s.value(0);
  const pInput = s.value(0);
  const pIds = s.value(0);
  const pWeights = s.value(0);
  const pB2 = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const inp = pInput.value;
    const ids = pIds.value;
    const wts = pWeights.value;
    const b2 = pB2.value;
    const nodes = [];

    // Left: Input sigmoid affinities s = [0.6, 0.5, 0.4]
    const lx = -660;
    nodes.push(
      txt('Sigmoid affinities s', lx, -205, 28, ROLE.token, 'mono', 'center').opacity(alpha),
    );
    sel.affinities.forEach((a, i) => {
      const y = -110 + i * 110;
      nodes.push(
        lumBar(lx, y, 270, 78, {
          color: EXP_COLORS[i],
          fillOpacity: 0.24,
          strokeWidth: 2.4,
          glow: 7,
          opacity: alpha,
        }),
        txt(`E${i}:  s = ${fmt(a, 1)}`, lx, y, 30, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
    });

    // Fork wires to TOP (Selection branch with bias) and BOTTOM (Value branch without bias)
    nodes.push(
      glowingTrail(arcPts([lx + 142, -55], [-330, -145], -26, 20), {
        color: ROLE.router,
        width: 3.6,
        glow: 8,
        opacity: alpha,
      }),
      glowingTrail(arcPts([lx + 142, 65], [-330, 165], 26, 20), {
        color: ROLE.active,
        width: 3.6,
        glow: 8,
        opacity: alpha,
      }),
    );

    // TOP BRANCH: Selection scores s + b (bias +0.3 on E2)
    nodes.push(
      lumBar(65, -145, 760, 168, {
        color: inp > 0.25 ? ROLE.router : '#4e608e',
        fillOpacity: inp > 0.25 ? 0.24 : 0.14,
        strokeWidth: 2.6,
        glow: inp > 0.25 ? 9 : 3,
        opacity: alpha,
      }),
      txt('SELECT: add bias b = [0, 0, +0.3]', 65, -192, 26, ROLE.router, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        inp > 0.25
          ? 'E0: 0.6 · E1: 0.5 · E2: 0.4 + 0.3 = 0.7'
          : 'Unbiased top-2: E0 (0.6) and E1 (0.5)',
        65,
        -140,
        26,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        ids > 0.25 ? 'Biased top-2 IDs -> [E2, E0]' : 'Top-2 selection...',
        65,
        -88,
        30,
        ids > 0.25 ? ROLE.router : COSMOS.dim,
        'mono',
        'center',
      )
        .glow(ids > 0.25 ? 7 : 0, ROLE.router)
        .opacity(alpha),
    );

    // Arrow carrying chosen IDs down to value branch
    nodes.push(
      arrow([545, -145], [545, 165], {
        stroke: ids > 0.25 ? ROLE.router : '#566a98',
        width: 3.6,
        tip: 14,
      }).opacity(alpha),
      txt('chosen IDs', 665, 10, 26, ROLE.router, 'mono', 'center').opacity(alpha),
      txt('only (no b)', 665, 44, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );

    // BOTTOM BRANCH: Value weights from ORIGINAL affinities
    nodes.push(
      lumBar(65, 165, 760, 180, {
        color: wts > 0.25 ? ROLE.active : '#4e608e',
        fillOpacity: wts > 0.25 ? 0.26 : 0.14,
        strokeWidth: 2.6,
        glow: wts > 0.25 ? 10 : 3,
        opacity: alpha,
      }),
      txt(
        'VALUE: norm original s_i for [E2, E0]',
        65,
        114,
        26,
        ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        wts > 0.25 ? 's = [0.4, 0.6] -> w = [0.40, 0.60]' : 'Original affinities only (no bias)',
        65,
        166,
        28,
        wts > 0.25 ? COSMOS.ink : COSMOS.dim,
        'mono',
        'center',
      )
        .glow(wts > 0.25 ? 7 : 0, ROLE.active)
        .opacity(alpha),
      txt(
        wts > 0.25
          ? 'Using biased 0.7 distorts weights to [0.54, 0.46]'
          : 'Bias never multiplies expert outputs',
        65,
        218,
        26,
        wts > 0.25 ? ROLE.overflow : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),

      txt(
        b2 > 0.25
          ? 'Training updates b_i directly: lower for busy experts, raise for quiet ones (+ tiny seq loss)'
          : 'DeepSeek-V3 balances batch load without auxiliary-loss gradient fighting the LM objective',
        0,
        375,
        28,
        b2 > 0.25 ? ROLE.active : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    void pB0.value;
    void pB1.value;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.router), title, eq, layer);

  playCue(s, c, 'mo-selection-bias-op-0', (d) => s.play(pB0.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'mo-selection-bias-op-1', (d) => s.play(pB1.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'mo-selection-input', (d) => s.play(pInput.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-selection-ids', (d) => s.play(pIds.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-selection-weights', (d) => s.play(pWeights.to(1, { duration: d })), {
    dur: 0.7,
  });
  playCue(s, c, 'mo-selection-bias-op-2', (d) => s.play(pB2.to(1, { duration: d })), { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// Scene 27: checkpoint-contract: "Inspect the checkpoint routing contract"
// ---------------------------------------------------------------------------
export function checkpointContract(s, c) {
  const title = heroTitle(['Inspect the checkpoint', 'routing contract'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.token,
  });

  const vGlm = s.value(1);
  const vDs4 = s.value(0);

  const pScale = s.value(0);
  const pHash = s.value(0);
  const pAff = s.value(0);
  const pB2 = s.value(0);

  // View 1 (Beat 0): GLM-5.3 config -> executable routing math (routed_scaling_factor = 2.5)
  const glmLayer = guardedDynamic(vGlm, (alpha) => {
    const sc = pScale.value;
    const nodes = [
      txt(
        'GLM-5.3   ·   Article checkpoint snapshot',
        0,
        -235,
        32,
        ROLE.token,
        'mono',
        'center',
      ).opacity(alpha),
      lumBar(-530, -90, 460, 155, {
        color: ROLE.router,
        fillOpacity: 0.22,
        strokeWidth: 2.5,
        glow: 8,
        opacity: alpha,
      }),
      txt('Layer layout', -530, -132, 28, ROLE.router, 'mono', 'center').opacity(alpha),
      txt('3 dense + 75 MoE', -530, -82, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('8 / 256 routed + 1 shared', -530, -34, 26, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),

      arrow([-288, -90], [-200, -90], { stroke: ROLE.token, width: 3.4, tip: 13 }).opacity(alpha),

      lumBar(0, -90, 380, 155, {
        color: ROLE.expert,
        fillOpacity: 0.22,
        strokeWidth: 2.5,
        glow: 8,
        opacity: alpha,
      }),
      txt('Normalize top-8', 0, -125, 28, ROLE.expert, 'mono', 'center').opacity(alpha),
      txt('sum(g_i) = 1.0', 0, -70, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),

      arrow([202, -90], [290, -90], { stroke: ROLE.router, width: 3.4, tip: 13 }).opacity(alpha),

      lumBar(540, -90, 540, 155, {
        color: sc > 0.25 ? ROLE.active : '#4e608e',
        fillOpacity: sc > 0.25 ? 0.3 : 0.14,
        strokeWidth: 2.8,
        glow: sc > 0.25 ? 11 : 3,
        opacity: alpha,
      }),
      txt('Scale routed sum', 540, -132, 28, ROLE.active, 'mono', 'center').opacity(alpha),
      txt('x 2.5 scaling factor', 540, -82, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt(
        sc > 0.25 ? 'sum = 2.5 (non-convex)' : 'after normalization',
        540,
        -34,
        26,
        sc > 0.25 ? ROLE.router : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),

      lumBar(0, 165, 1340, 128, {
        color: sc > 0.25 ? ROLE.router : '#4a5c88',
        fillOpacity: 0.18,
        strokeWidth: 2.2,
        glow: 6,
        opacity: alpha,
      }),
      txt(
        'y_MoE = 2.5 · sum_{i in Top8} g_i E_i(x)  +  E_shared(x)',
        0,
        142,
        30,
        ROLE.token,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'Config fields change the forward formula directly; never assume weights sum to 1',
        0,
        196,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return nodes;
  });

  // View 2 (Beats 1-2): DeepSeek-V4-Flash 0731 (hash early blocks vs sqrt(softplus) later blocks)
  const ds4Layer = guardedDynamic(vDs4, (alpha) => {
    const hs = pHash.value;
    const af = pAff.value;
    const b2 = pB2.value;
    const nodes = [
      txt(
        'DeepSeek-V4-Flash 0731   ·   43 MoE blocks   ·   284B / 13B core',
        0,
        -235,
        30,
        ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),

      lumBar(-435, -60, 680, 215, {
        color: hs > 0.25 ? ROLE.router : '#4e608e',
        fillOpacity: hs > 0.25 ? 0.26 : 0.14,
        strokeWidth: 2.6,
        glow: hs > 0.25 ? 10 : 3,
        opacity: alpha,
      }),
      txt('First 3 MoE blocks', -435, -126, 30, ROLE.router, 'mono', 'center').opacity(alpha),
      txt('Token-ID hash routing', -435, -68, 34, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt(
        'Deterministic from token ID, no learned router',
        -435,
        -10,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),

      lumBar(435, -60, 680, 215, {
        color: af > 0.25 ? ROLE.token : '#4e608e',
        fillOpacity: af > 0.25 ? 0.26 : 0.14,
        strokeWidth: 2.6,
        glow: af > 0.25 ? 10 : 3,
        opacity: alpha,
      }),
      txt('Remaining 40 MoE blocks', 435, -126, 30, ROLE.token, 'mono', 'center').opacity(alpha),
      txt('sqrt(softplus(z)) affinities', 435, -68, 34, COSMOS.ink, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        '6 routed + 1 shared  (replaces V3 sigmoid)',
        435,
        -10,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),

      lumBar(0, 190, 1560, 145, {
        color: b2 > 0.25 ? ROLE.alt : '#4a5c88',
        fillOpacity: b2 > 0.25 ? 0.22 : 0.14,
        strokeWidth: 2.4,
        glow: b2 > 0.25 ? 9 : 3,
        opacity: alpha,
      }),
      txt(
        'Bias + seq loss · no node limit · extra modules add payload',
        0,
        162,
        26,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'Shared family names (like GLM-5.3 vs GLM-5.3-Flash) do not guarantee identical router or attention',
        0,
        218,
        26,
        b2 > 0.25 ? ROLE.alt : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.token, ROLE.alt), title, glmLayer, ds4Layer);

  playCue(s, c, 'mo-checkpoint-contract-op-0', (d) => s.play(vGlm.to(1, { duration: d })), {
    dur: 0.3,
  });
  playCue(s, c, 'mo-checkpoint-scale', (d) => s.play(pScale.to(1, { duration: d })), { dur: 0.65 });
  playCue(
    s,
    c,
    'mo-checkpoint-contract-op-1',
    (d) => s.play(swapVis(vGlm, vDs4, Math.min(0.6, d * 0.4))),
    { dur: 0.6 },
  );
  playCue(s, c, 'mo-checkpoint-hash', (d) => s.play(pHash.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'mo-checkpoint-affinity', (d) => s.play(pAff.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'mo-checkpoint-contract-op-2', (d) => s.play(pB2.to(1, { duration: d })), {
    dur: 0.7,
  });
}

// ---------------------------------------------------------------------------
// Scene 28: hybrid-mixer: "Keep token mixing and expert selection independent"
// ---------------------------------------------------------------------------
export function hybridMixer(s, c) {
  const title = heroTitle(['Keep token mixing and', 'expert selection independent'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.token,
  });

  const pB0 = s.value(0.5);
  const pPat = s.value(0);
  const pB1 = s.value(0);
  const pExp = s.value(0);
  const pB2 = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const pt = pPat.value;
    const ex = pExp.value;
    const b2 = pB2.value;
    const nodes = [
      txt(
        'Qwen3.6-35B-A3B   ·   40 layers = 10 x (3 Gated DeltaNet + 1 Gated Attention)',
        0,
        -235,
        28,
        ROLE.token,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Axis 1: Mixer', -825, -120, 26, ROLE.expert, 'mono', 'left').opacity(alpha),
      txt('Axis 2: MoE FFN', -825, 65, 26, ROLE.active, 'mono', 'left').opacity(alpha),
    ];

    // Draw 16 representative layers (4 full repeating 3+1 cycles, labeled "... x 10 cycles = 40")
    for (let i = 0; i < 16; i++) {
      const isAttn = i % 4 === 3;
      const cx = -355 + i * 74;
      const mixCol = isAttn ? ROLE.router : ROLE.token;
      const litMix = pt > 0.2;
      const litExp = ex > 0.2;
      nodes.push(
        lumBar(cx, -120, 62, 92, {
          color: mixCol,
          fillOpacity: litMix ? (isAttn ? 0.45 : 0.28) : 0.16,
          strokeWidth: isAttn ? 2.6 : 1.8,
          glow: litMix && isAttn ? 10 : 4,
          radius: 6,
          opacity: alpha,
        }),
        txt(isAttn ? 'A' : 'D', cx, -120, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),

        line([cx, -70], [cx, 15], { stroke: '#4d608d', width: 2 }).opacity(0.65 * alpha),

        lumBar(cx, 65, 62, 92, {
          color: litExp ? ROLE.active : '#4e608e',
          fillOpacity: litExp ? 0.34 : 0.16,
          strokeWidth: litExp ? 2.4 : 1.6,
          glow: litExp ? 8 : 2,
          radius: 6,
          opacity: alpha,
        }),
        txt('M', cx, 65, 28, litExp ? COSMOS.ink : COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    }

    // Legend & independent axes summary
    nodes.push(
      txt(
        'D = Gated DeltaNet (30 layers)   ·   A = Gated Attention (10 layers)   ·   M = 8/256 + 1 shared MoE (40 layers)',
        0,
        168,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      lumBar(-435, 285, 680, 118, {
        color: b2 > 0.25 ? ROLE.router : ROLE.token,
        fillOpacity: 0.22,
        strokeWidth: 2.5,
        glow: 8,
        opacity: alpha,
      }),
      txt(
        'Weight memory:  35B total  /  3B active',
        -435,
        262,
        28,
        ROLE.router,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Budget VRAM for all 35B weights', -435, 310, 26, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),

      lumBar(435, 285, 680, 118, {
        color: b2 > 0.25 ? ROLE.active : '#4e608e',
        fillOpacity: 0.22,
        strokeWidth: 2.5,
        glow: 8,
        opacity: alpha,
      }),
      txt(
        'Per-layer state:  follows mixer config',
        435,
        262,
        28,
        ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'DeltaNet recurrent state vs Attention KV cache',
        435,
        310,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    void pB0.value;
    void pB1.value;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.token, ROLE.active), title, layer);

  playCue(s, c, 'mo-hybrid-mixer-op-0', (d) => s.play(pB0.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'mo-hybrid-pattern', (d) => s.play(pPat.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'mo-hybrid-mixer-op-1', (d) => s.play(pB1.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'mo-hybrid-experts', (d) => s.play(pExp.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'mo-hybrid-mixer-op-2', (d) => s.play(pB2.to(1, { duration: d })), { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// Scene 29: expert-parallelism: "Follow a token across the interconnect"
// ---------------------------------------------------------------------------
export function expertParallelism(s, c) {
  const title = heroTitle(['Follow a token across', 'the interconnect'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.token,
  });

  const view3d = buildDualGpuFabric3d({ x: 635, y: -355, unit: 42 });

  const pOwners = s.value(0.5);
  const pRemote = s.value(0);
  const pCross = s.value(0);
  const pFixed = s.value(0);
  const pBoth = s.value(0);
  const pTotal = s.value(0);
  const pTp = s.value(0);
  const pLayout = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const rm = pRemote.value;
    const cr = pCross.value;
    const fx = pFixed.value;
    const bt = pBoth.value;
    const tot = pTotal.value;
    const tp = pTp.value;
    const lay = pLayout.value;
    const nodes = [];

    const g0X = -460;
    const g1X = 460;

    // Two resident GPU panels
    nodes.push(
      lumBar(g0X, 45, 620, 380, {
        color: ROLE.token,
        fillOpacity: 0.12,
        strokeWidth: 2.5,
        glow: 6,
        opacity: alpha,
      }),
      txt('GPU G0  (owns E0, E1)', g0X, -110, 30, ROLE.token, 'mono', 'center').opacity(alpha),

      lumBar(g1X, 45, 620, 380, {
        color: ROLE.alt,
        fillOpacity: 0.12,
        strokeWidth: 2.5,
        glow: 6,
        opacity: alpha,
      }),
      txt('GPU G1  (owns E2, E3)', g1X, -110, 30, ROLE.alt, 'mono', 'center').opacity(alpha),
    );

    // Resident stationary expert blocks inside G0 and G1
    const expPos = [
      { id: 0, x: g0X - 140, y: 5 },
      { id: 1, x: g0X + 140, y: 5 },
      { id: 2, x: g1X - 140, y: 5 },
      { id: 3, x: g1X + 140, y: 5 },
    ];
    expPos.forEach((ep) => {
      nodes.push(
        lumBar(ep.x, ep.y, 240, 108, {
          color: EXP_COLORS[ep.id],
          fillOpacity: fx > 0.25 ? 0.34 : 0.22,
          strokeWidth: 2.5,
          glow: fx > 0.25 ? 10 : 5,
          opacity: alpha,
        }),
        txt(`E${ep.id}`, ep.x, ep.y - 14, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),
        txt('pinned', ep.x, ep.y + 24, 26, EXP_COLORS[ep.id], 'mono', 'center').opacity(alpha),
      );
    });

    // 5 assignment rows at bottom of their source GPU (t0,t1,t4 on G0; t2,t3 on G1)
    const srcCoords = [
      [g0X - 185, 160], // t0 -> E0 (local)
      [g0X, 160], // t1 -> E2 (remote)
      [g1X - 120, 160], // t2 -> E2 (local)
      [g1X + 120, 160], // t3 -> E1 (remote)
      [g0X + 185, 160], // t4 -> E3 (remote)
    ];

    REMOTE_ASSIGNMENTS.forEach((a, idx) => {
      const [sx, sy] = srcCoords[idx];
      const dst = expPos[a.expert];
      const isRemote = (a.source === 0 && a.expert >= 2) || (a.source === 1 && a.expert < 2);
      const col = isRemote ? ROLE.router : ROLE.active;
      nodes.push(
        lumBar(sx, sy, 150, 74, {
          color: col,
          fillOpacity: 0.26,
          strokeWidth: 2.2,
          glow: isRemote && (rm > 0.2 || cr > 0.2) ? 10 : 4,
          opacity: alpha,
        }),
        txt(`t${a.token}->E${a.expert}`, sx, sy, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );

      // Remote all-to-all dispatch & return arcs cleanly in the corridor between tokens and experts
      if (isRemote && (rm > 0.08 || cr > 0.08)) {
        const prog = clamp(Math.max(rm, cr));
        const dPts = arcPts([sx, sy - 42], [dst.x, dst.y + 62], idx === 3 ? 12 : 24, 26);
        const cut = Math.max(2, Math.round(dPts.length * prog));
        nodes.push(
          glowingTrail(dPts.slice(0, cut), {
            color: ROLE.router,
            width: 3.6,
            glow: 9,
            opacity: 0.9 * alpha,
          }),
        );
        if (bt > 0.08) {
          const rPts = arcPts([dst.x, dst.y + 62], [sx, sy - 42], idx === 3 ? 42 : 52, 26);
          const rCut = Math.max(2, Math.round(rPts.length * clamp(bt)));
          nodes.push(
            glowingTrail(rPts.slice(0, rCut), {
              color: ROLE.active,
              width: 3.2,
              glow: 8,
              opacity: 0.85 * alpha,
            }),
          );
        }
      }
    });

    // Center payload readout & bottom EP vs TP strip
    nodes.push(
      lumBar(0, 290, 1480, 108, {
        color: tp > 0.25 ? ROLE.alt : tot > 0.25 ? ROLE.router : ROLE.expert,
        fillOpacity: 0.2,
        strokeWidth: 2.4,
        glow: 8,
        opacity: alpha,
      }),
      txt(
        tp > 0.25 || lay > 0.25
          ? 'EP assigns whole experts to devices  ·  TP shards each expert matrix  ·  combinable'
          : tot > 0.25
            ? '3 remote x 2 directions x 8 KiB = 48 KiB simple payload  (2 local stay on device)'
            : 'All-to-all dispatch moves hidden states; all-to-all combine returns outputs',
        0,
        290,
        28,
        tp > 0.25 ? ROLE.alt : tot > 0.25 ? ROLE.router : COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    );

    void pOwners.value;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.token, ROLE.alt), title, view3d, layer);
  orbitScene(s, c, view3d, { theta: -0.2, phi: 0.94, distance: 14.2 });

  playCue(s, c, 'expert-owners', (d) => s.play(pOwners.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'remote-state', (d) => s.play(pRemote.to(1, { duration: d })), { dur: 0.8 });
  playCue(s, c, 'cross-device', (d) => s.play(pCross.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'fixed-weights', (d) => s.play(pFixed.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'both-directions', (d) => s.play(pBoth.to(1, { duration: d })), { dur: 0.8 });
  playCue(s, c, 'payload-total', (d) => s.play(pTotal.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'tensor-shards', (d) => s.play(pTp.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'parallel-layout', (d) => s.play(pLayout.to(1, { duration: d })), { dur: 0.6 });
}

// ---------------------------------------------------------------------------
// Scene 30: wire-protocol: "Hold the routes fixed and change the messages"
// ---------------------------------------------------------------------------
export function wireProtocol(s, c) {
  const title = heroTitle(['Hold the routes fixed,', 'change the messages'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.router,
  });

  const wire = moeWire(); // separate 32 KiB, coalesced 16 KiB, output [2, 1.8]

  const vTotals = s.value(1);
  const vCoalesce = s.value(0);

  const pVec = s.value(0);
  const pThree = s.value(0);
  const pFive = s.value(0);
  const pSep = s.value(0);
  const pCoal = s.value(0);
  const pB2 = s.value(0);

  // View 1 (Beat 0): 8 KiB vector -> 3 remote = 48 KiB vs 5 remote = 80 KiB
  const totalsLayer = guardedDynamic(vTotals, (alpha) => {
    const vc = pVec.value;
    const th = pThree.value;
    const fv = pFive.value;
    const nodes = [
      txt(
        'Simple wire payload convention:  4,096 coords x 2 bytes = 8 KiB per vector',
        0,
        -225,
        28,
        ROLE.token,
        'mono',
        'center',
      ).opacity((0.55 + 0.45 * vc) * alpha),
      lumBar(-435, 10, 680, 265, {
        color: th > 0.25 ? ROLE.router : '#4e608e',
        fillOpacity: th > 0.25 ? 0.26 : 0.14,
        strokeWidth: 2.6,
        glow: th > 0.25 ? 10 : 3,
        opacity: alpha,
      }),
      txt(
        '3 remote assignments (2-GPU case)',
        -435,
        -72,
        28,
        ROLE.router,
        'mono',
        'center',
      ).opacity(alpha),
      txt('3 x 2 directions x 8 KiB', -435, -6, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(th > 0.25 ? '48 KiB' : '?', -435, 76, 56, ROLE.router, 'mono', 'center')
        .glow(th > 0.25 ? 9 : 0, ROLE.router)
        .opacity(alpha),

      lumBar(435, 10, 680, 265, {
        color: fv > 0.25 ? ROLE.overflow : '#4e608e',
        fillOpacity: fv > 0.25 ? 0.26 : 0.14,
        strokeWidth: 2.6,
        glow: fv > 0.25 ? 10 : 3,
        opacity: alpha,
      }),
      txt(
        'If all 5 assignments were remote',
        435,
        -72,
        28,
        ROLE.overflow,
        'mono',
        'center',
      ).opacity(alpha),
      txt('5 x 2 directions x 8 KiB', 435, -6, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(fv > 0.25 ? '80 KiB' : '?', 435, 76, 56, ROLE.overflow, 'mono', 'center')
        .glow(fv > 0.25 ? 9 : 0, ROLE.overflow)
        .opacity(alpha),

      txt(
        'Each remote assignment moves one vector out (dispatch) and one vector back (combine)',
        0,
        295,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return nodes;
  });

  // View 2 (Beats 1-2): 1 token on G0 choosing E2 & E3 on G1 -> 32 KiB separate vs 16 KiB coalesced
  const coalesceLayer = guardedDynamic(vCoalesce, (alpha) => {
    const sp = pSep.value;
    const cl = pCoal.value;
    const b2 = pB2.value;
    const nodes = [
      txt(
        '1 token on G0 selects E2 + E3 on G1   (identical expert math)',
        0,
        -235,
        30,
        ROLE.token,
        'mono',
        'center',
      ).opacity(alpha),

      // Top lane: Separate per-assignment roundtrips = 32 KiB
      lumBar(-560, -90, 280, 128, {
        color: ROLE.overflow,
        fillOpacity: 0.22,
        strokeWidth: 2.4,
        glow: 7,
        opacity: alpha,
      }),
      txt('Separate', -560, -112, 30, ROLE.overflow, 'mono', 'center').opacity(alpha),
      txt('4 x 8 = 32 KiB', -560, -64, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),

      arrow([-408, -115], [320, -115], { stroke: ROLE.overflow, width: 3.2, tip: 12 }).opacity(
        alpha,
      ),
      arrow([320, -65], [-408, -65], { stroke: ROLE.overflow, width: 3.2, tip: 12 }).opacity(alpha),
      txt(
        '2 out (16 KiB) + 2 back (16 KiB)',
        -45,
        -152,
        26,
        ROLE.overflow,
        'mono',
        'center',
      ).opacity((0.45 + 0.55 * sp) * alpha),

      lumBar(540, -90, 390, 128, {
        color: ROLE.overflow,
        fillOpacity: 0.2,
        strokeWidth: 2.2,
        glow: 6,
        opacity: alpha,
      }),
      txt('G1 runs E2 & E3', 540, -112, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt(`out = ${vecStr(wire.separate, 1)}`, 540, -64, 28, ROLE.router, 'mono', 'center').opacity(
        alpha,
      ),

      // Bottom lane: Coalesced per-destination combine = 16 KiB
      lumBar(-560, 125, 280, 128, {
        color: cl > 0.25 ? ROLE.active : '#4e608e',
        fillOpacity: cl > 0.25 ? 0.3 : 0.14,
        strokeWidth: 2.6,
        glow: cl > 0.25 ? 10 : 3,
        opacity: alpha,
      }),
      txt('Coalesced', -560, 103, 30, ROLE.active, 'mono', 'center').opacity(alpha),
      txt('2 x 8 = 16 KiB', -560, 151, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),

      arrow([-408, 100], [320, 100], { stroke: ROLE.active, width: 4, tip: 14 }).opacity(alpha),
      arrow([320, 150], [-408, 150], { stroke: ROLE.active, width: 4, tip: 14 }).opacity(alpha),
      txt('1 out (8 KiB) + 1 back (8 KiB)', -45, 62, 26, ROLE.active, 'mono', 'center').opacity(
        (0.45 + 0.55 * cl) * alpha,
      ),

      lumBar(540, 125, 390, 128, {
        color: cl > 0.25 ? ROLE.active : '#4e608e',
        fillOpacity: cl > 0.25 ? 0.3 : 0.14,
        strokeWidth: 2.6,
        glow: cl > 0.25 ? 10 : 3,
        opacity: alpha,
      }),
      txt('G1 combines locally', 540, 103, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt(
        `out = ${vecStr(wire.destinationCombined, 1)}`,
        540,
        151,
        28,
        ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),

      txt(
        b2 > 0.25
          ? 'Exact same output vector [2.0, 1.8] with half the vector bytes; measure latency with sync & metadata'
          : 'Destination-side weighted combine halves wire vectors without changing expert math',
        0,
        320,
        28,
        b2 > 0.25 ? ROLE.active : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.router, ROLE.active), title, totalsLayer, coalesceLayer);

  playCue(s, c, 'mo-wire-protocol-op-0', (d) => s.play(vTotals.to(1, { duration: d })), {
    dur: 0.3,
  });
  playCue(s, c, 'mo-wire-vector', (d) => s.play(pVec.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'mo-wire-three', (d) => s.play(pThree.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'mo-wire-five', (d) => s.play(pFive.to(1, { duration: d })), { dur: 0.6 });
  playCue(
    s,
    c,
    'mo-wire-protocol-op-1',
    (d) => s.play(swapVis(vTotals, vCoalesce, Math.min(0.6, d * 0.4))),
    { dur: 0.6 },
  );
  playCue(s, c, 'mo-wire-separate', (d) => s.play(pSep.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'mo-wire-coalesced', (d) => s.play(pCoal.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-wire-protocol-op-2', (d) => s.play(pB2.to(1, { duration: d })), { dur: 0.65 });
}
