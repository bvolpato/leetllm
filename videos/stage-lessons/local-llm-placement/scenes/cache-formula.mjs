// Scene 04: cache-formula: 2 * L * n_kv * d_head * bytes_elem -> 128 KiB/tok -> Gemma 40 sliding (1024 win) + 8 full layers.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  chipPill,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function cacheFormula(s, c) {
  const showExample = s.value(0);
  const showGemma = s.value(0);
  const accent = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['KV Cache Byte Formula:', 'Sliding vs Full Layers'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.vram,
  });

  const eq = glowTex(
    String.raw`\text{KV Bytes} = 2 \cdot L \cdot n_{\text{kv}} \cdot d_{\text{head}} \cdot b \cdot T_{\text{ret}} \cdot S`,
    { x: 0, y: -215, size: 38, color: ROLE.vram, glow: 7 },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const ex = showExample.value;
    const gm = showGemma.value;

    const nodes = [
      // Row 1: Uniform 32-layer baseline
      txt(
        'UNIFORM 32-LAYER EXAMPLE (8 KV HEADS x 128 WIDTH x 2 BYTES)',
        -855,
        -80,
        26,
        ROLE.weights,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * ex)),
      chipPill('128 KiB / token', -640, 5, {
        w: 390,
        h: 74,
        color: ROLE.vram,
        size: 30,
        opacity: alpha * (0.45 + 0.55 * ex),
      }),
      chipPill('4096 tok -> 0.5 GiB', -140, 5, {
        w: 460,
        h: 74,
        color: ROLE.gold,
        size: 28,
        opacity: alpha * (0.45 + 0.55 * ex),
      }),
      chipPill('4 x 32k -> 16 GiB', 435, 5, {
        w: 490,
        h: 74,
        color: ROLE.work,
        size: 28,
        opacity: alpha * (0.45 + 0.55 * ex),
      }),

      // Row 2: Gemma 4 12B Hybrid (40 sliding + 8 full)
      txt(
        'GEMMA 4 12B HYBRID LAYER GROUPS (SUM SEPARATELY!)',
        -855,
        130,
        26,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * gm)),
      chipPill('40 Sliding: 8H x 256d (win 1024)', -430, 220, {
        w: 790,
        h: 78,
        color: ROLE.vram,
        fill: gm > 0.3 ? '#0f273d' : '#10182d',
        size: 28,
        glow: gm > 0.3 ? 10 : 0,
        opacity: alpha * (0.45 + 0.55 * gm),
      }),
      chipPill('8 Full: 1H x 512d (all tokens)', 430, 220, {
        w: 790,
        h: 78,
        color: ROLE.kv,
        fill: gm > 0.3 ? '#20153d' : '#10182d',
        size: 28,
        glow: gm > 0.3 ? 10 : 0,
        opacity: alpha * (0.45 + 0.55 * gm),
      }),
      txt(
        'Read head_dim from config (never assume hidden/n_q); both K and V arrays are cached separately',
        0,
        345,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, layer);
  playCue(s, c, 'pl-cache-formula-1-0', (d) => s.play(showExample.to(1, { duration: d })));
  playCue(s, c, 'pl-cache-formula-2-0', (d) => s.play(showGemma.to(1, { duration: d })));
  bindCueBeat(s, c, accent, [
    'pl-cache-formula-0-0',
    'pl-cache-formula-0-1',
    'pl-cache-formula-0-2',
    'pl-cache-formula-0-3',
    'pl-cache-formula-0-4',
    'pl-cache-formula-1-1',
    'pl-cache-formula-1-2',
    'pl-cache-formula-2-1',
    'pl-cache-formula-2-2',
    'pl-cache-formula-2-3',
    'pl-cache-formula-2-4',
  ]);
}
