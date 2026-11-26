// Scene 13: budget: Signature orbiting 3D patch-grid tokenization slab (14x14 -> 28x28 = 4x tokens, 16x pairs).
import {
  COSMOS,
  ROLE,
  aura,
  buildPatchGrid3d,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  txt,
} from '../parts.mjs';

export default function budget(s, c) {
  const density = s.value(0); // 0 = 14x14 (196), 1 = 28x28 (784)
  const showPairs = s.value(0);
  const showBoundary = s.value(0);

  const bgAura = aura(320, 20, 760, '#14386634', '#2a163826');
  const title = heroTitle(['Halving Patch Width:', '4x Tokens, 16x Pairs'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.patch,
  });

  const eq = glowTex(
    String.raw`P \to \tfrac{P}{2} \;\Longrightarrow\; N \to 4N,\quad N^2 \to 16N^2`,
    { x: 250, y: -395, size: 34, color: ROLE.warn, glow: 7 },
  );
  const eqLayer = guardedDynamic(showPairs, (a) => eq.opacity(a));

  // Signature orbiting 3D patch-grid slab on the right
  const slab3d = buildPatchGrid3d(density, { x: 400, y: 40 });
  orbitScene(s, c, slab3d, { theta: -0.34, phi: 0.94 });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const den = density.value;
    const pr = showPairs.value;
    const bd = showBoundary.value;
    const refined = den > 0.5;

    const barX = -855;
    const maxW = 660;
    const nodes = [
      txt(
        '224 x 224 IMAGE: PATCH WIDTH P = 16 -> P = 8',
        barX,
        -220,
        26,
        ROLE.patch,
        'mono',
        'left',
      ).opacity(alpha),

      // Patch grid readout (withheld until budget-refine!)
      txt('Patch Tokens N', barX, -135, 30, ROLE.patch, 'mono', 'left').opacity(alpha),
      lumBar(barX, -82, refined ? maxW * 0.64 : maxW * 0.16, 34, ROLE.patch, {
        opacity: alpha,
        maxTrackW: maxW,
      }),
      txt(
        refined ? '784 tokens  (4x)' : '196 tokens  (14 x 14)',
        barX,
        -25,
        30,
        refined ? ROLE.pos : ROLE.patch,
        'mono',
        'left',
      ).opacity(alpha),

      // Pairwise attention readout (withheld until budget-attention-block-count-b2-1!)
      txt('Dense Attention Pairs N^2', barX, 75, 30, ROLE.warn, 'mono', 'left').opacity(alpha),
      lumBar(barX, 128, pr > 0.4 ? maxW : maxW * 0.0625, 34, ROLE.warn, {
        opacity: alpha * (0.35 + 0.65 * Math.max(den, pr)),
        maxTrackW: maxW,
      }),
      txt(
        pr > 0.4
          ? '614,656 pairs  (16x!)'
          : refined
            ? 'Predict N^2 growth...'
            : '38,416 pairs  (1x)',
        barX,
        185,
        30,
        pr > 0.4 ? ROLE.warn : COSMOS.muted,
        'mono',
        'left',
      )
        .glow(pr > 0.4 ? 8 : 0, ROLE.warn)
        .opacity(alpha),

      // Footer checkpoint boundary note + right-side 3D caption
      txt(
        bd > 0.3
          ? 'Changing P alters projection input shape (P^2 x 3) and needs adaptation'
          : 'Halving P doubles BOTH height and width axes',
        barX,
        310,
        26,
        bd > 0.3 ? ROLE.bridge : COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
      txt(
        refined ? '28 x 28 Patch Manifold (784 cells)' : '14 x 14 Patch Manifold (196 cells)',
        400,
        345,
        28,
        refined ? ROLE.pos : ROLE.patch,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eqLayer, slab3d, layer);
  playCue(s, c, 'budget-patch-grid-0-b1-1', (d) => s.play(density.to(0.08, { duration: d })));
  // Strict prediction withholding: refine grid & reveal 4x / 16x only after cues!
  playCue(s, c, 'budget-refine', (d) => s.play(density.to(1, { duration: d })), { after: true });
  playCue(
    s,
    c,
    'budget-attention-block-count-b2-1',
    (d) => s.play(showPairs.to(1, { duration: d })),
    {
      after: true,
    },
  );
  playCue(s, c, 'budget-patch-grid-1-b3-1', (d) => s.play(showBoundary.to(1, { duration: d })));
}
