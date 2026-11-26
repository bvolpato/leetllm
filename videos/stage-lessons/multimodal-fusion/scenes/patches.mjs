// Scene 03: patches: ViT square patch grid (16x16 = 256 -> 24x24 = 576) with orbiting 3D patch manifold.
import {
  COSMOS,
  IMAGE_224,
  IMAGE_336,
  PATCH_SIZE,
  ROLE,
  VISUAL_TOKENS_224,
  VISUAL_TOKENS_336,
  aura,
  buildPatchGrid3d,
  dashboardChartNodes,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  txt,
} from '../parts.mjs';

export default function patches(s, c) {
  const show256 = s.value(0);
  const highlightGrid = s.value(0);
  const showPos = s.value(0);
  const showContext = s.value(0);
  const density = s.value(0);
  const show576 = s.value(0);

  const bgAura = aura(340, 20, 760, '#12386230', '#2b184e24');
  const title = heroTitle(['Pixels Become a Sequence', 'of Patch Features'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.vision,
  });

  const eq = glowTex(String.raw`N = \left(\frac{H}{P}\right)\left(\frac{W}{P}\right)`, {
    x: 430,
    y: -395,
    size: 38,
    color: ROLE.gold,
    glow: 7,
  });

  // Signature orbiting 3D patch-grid manifold on the right
  const slab3d = buildPatchGrid3d(density, { x: 430, y: 30 });
  orbitScene(s, c, slab3d, { theta: -0.32, phi: 0.94 });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const p256 = show256.value;
    const hGrid = highlightGrid.value;
    const pos = showPos.value;
    const ctx = showContext.value;
    const den = density.value;
    const p576 = show576.value;
    const highRes = den > 0.45;
    const curSide = highRes ? IMAGE_336 : IMAGE_224;
    const curPer = curSide / PATCH_SIZE;
    const curTokens = highRes ? VISUAL_TOKENS_336 : VISUAL_TOKENS_224;

    const nodes = [
      // Left: Dashboard trace with live ViT patch grid overlay
      dashboardChartNodes(-855, -230, 760, 355, {
        hour: 6,
        showReadings: false,
        highlightGreen: true,
        opacity: alpha,
        gridN: highRes ? 12 : 8,
        caption: `${curSide}px / ${PATCH_SIZE}px PATCH = ${curPer} x ${curPer} GRID`,
      }),

      // Positional + global context arcs over the patch grid
      glowingTrail(
        [
          [-750, -140],
          [-480, -205],
          [-210, -100],
        ],
        {
          color: ROLE.gold,
          width: 3.4,
          glow: 10,
          opacity: alpha * (0.15 + 0.85 * Math.max(pos, ctx)),
          core: false,
        },
      ),
      glowingTrail(
        [
          [-690, 40],
          [-460, -50],
          [-230, 55],
        ],
        {
          color: ROLE.bridge,
          width: 3.2,
          glow: 10,
          opacity: alpha * (0.15 + 0.85 * ctx),
          core: false,
        },
      ),

      // Lower-left token count comparison bars (visible from t=0)
      txt(
        `224px (16x16): ${VISUAL_TOKENS_224} visual tokens`,
        -855,
        180,
        28,
        p256 > 0.2 || hGrid > 0.2 ? ROLE.vision : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(-855, 232, 310, 30, ROLE.vision, {
        opacity: alpha * (0.65 + 0.35 * Math.max(p256, hGrid)),
        maxTrackW: 720,
      }),

      txt(
        highRes || p576 > 0.3
          ? `336px (24x24): ${VISUAL_TOKENS_336} visual tokens (2.25x!)`
          : '336px (24x24): finer detail, more downstream work',
        -855,
        295,
        28,
        highRes || p576 > 0.3 ? ROLE.gold : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(-855, 347, highRes || p576 > 0.3 ? 698 : 110, 30, ROLE.gold, {
        opacity: alpha * (0.48 + 0.52 * Math.max(den, p576)),
        maxTrackW: 720,
      }),

      // Right 3D manifold caption
      txt(
        `${curPer} x ${curPer} Patch Manifold (${curTokens} tokens)`,
        430,
        345,
        28,
        highRes ? ROLE.gold : ROLE.vision,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, slab3d, layer);
  playCue(s, c, 'patches-beat-1-focus-1', (d) => s.play(show256.to(1, { duration: d })));
  playCue(s, c, 'patches-beat-1-focus-2', (d) => s.play(highlightGrid.to(1, { duration: d })));
  playCue(s, c, 'patches-beat-2-focus-2', (d) => s.play(showPos.to(1, { duration: d })));
  playCue(s, c, 'patches-beat-2-focus-1', (d) => s.play(showContext.to(1, { duration: d })));
  playCue(s, c, 'patches-beat-3-focus-2', (d) => s.play(density.to(1, { duration: d })), {
    dur: 0.9,
  });
  playCue(s, c, 'patches-beat-3-focus-1', (d) => s.play(show576.to(1, { duration: d })));
}
