// Scene 07: positions: Permutation invariance without positions vs distinct readouts with slot vectors + [CLS] token.
import {
  COSMOS,
  ROLE,
  a,
  attend,
  aura,
  bindCueBeat,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  pos,
  ps,
  sw,
  txt,
} from '../parts.mjs';

export default function positions(s, c) {
  const withPos = s.value(0); // 0 = no positions (invariant under swap), 1 = +pos (swap changes readout!)
  const showCls = s.value(0);

  const bgAura = aura(0, 0, 740, '#123a5e28', '#2a1b5418');
  const title = heroTitle(['Positional Embeddings:', 'recording spatial order'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.pos,
  });

  const noPosA = attend(ps);
  const noPosSw = attend([...ps].reverse());

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const wp = withPos.value > 0.5;
    const cls = showCls.value;
    const out1 = wp ? a : noPosA;
    const out2 = wp ? sw : noPosSw;
    const diff = Math.abs(out1[0] - out2[0]) + Math.abs(out1[1] - out2[1]) > 1e-4;
    const nodes = [
      txt(
        wp
          ? 'WITH SLOT POSITION VECTORS (+p_0, +p_1)'
          : 'WITHOUT POSITIONS (PERMUTATION-INVARIANT)',
        -855,
        -225,
        28,
        wp ? ROLE.pos : ROLE.patch,
        'mono',
        'left',
      )
        .glow(6, wp ? ROLE.pos : ROLE.patch)
        .opacity(alpha),

      // Order 1: [A, B]
      txt('LAYOUT 1:', -855, -110, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
      chipPill(wp ? 'A + p_0' : 'Patch A', -560, -110, {
        w: 230,
        h: 74,
        color: ROLE.patch,
        opacity: alpha,
      }),
      chipPill(wp ? 'B + p_1' : 'Patch B', -290, -110, {
        w: 230,
        h: 74,
        color: ROLE.attn,
        opacity: alpha,
      }),
      txt(
        `Summary = [${out1[0].toFixed(3)}, ${out1[1].toFixed(3)}]`,
        -110,
        -110,
        32,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha),

      // Order 2: [B, A] swapped!
      txt('SWAPPED:', -855, 25, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
      chipPill(wp ? 'B + p_0' : 'Patch B', -560, 25, {
        w: 230,
        h: 74,
        color: ROLE.attn,
        opacity: alpha,
      }),
      chipPill(wp ? 'A + p_1' : 'Patch A', -290, 25, {
        w: 230,
        h: 74,
        color: ROLE.patch,
        opacity: alpha,
      }),
      txt(
        `Summary = [${out2[0].toFixed(3)}, ${out2[1].toFixed(3)}]`,
        -110,
        25,
        32,
        diff ? ROLE.pos : ROLE.warn,
        'mono',
        'left',
      )
        .glow(8, diff ? ROLE.pos : ROLE.warn)
        .opacity(alpha),

      txt(
        diff
          ? `Different summaries! Added p_0=[${pos[0].join(',')}], p_1=[${pos[1].join(',')}] break symmetry`
          : 'Identical summaries! Self-attention alone cannot tell [A, B] from [B, A]',
        -855,
        145,
        30,
        diff ? ROLE.pos : ROLE.warn,
        'sans',
        'left',
      ).opacity(alpha),

      // [CLS] prepended sequence bar along bottom
      txt(
        'ViT SEQUENCE WITH PREPENDED [CLS]:',
        -855,
        260,
        26,
        cls > 0.2 ? ROLE.bridge : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      chipPill('[CLS] + p_cls', -690, 340, {
        w: 280,
        h: 70,
        color: cls > 0.2 ? ROLE.bridge : COSMOS.rule,
        size: 28,
        glow: cls > 0.2 ? 12 : 0,
        opacity: (0.3 + 0.7 * cls) * alpha,
      }),
      chipPill('P_1 + p_1', -385, 340, {
        w: 230,
        h: 70,
        color: ROLE.patch,
        size: 28,
        opacity: (0.3 + 0.7 * cls) * alpha,
      }),
      chipPill('P_2 + p_2', -120, 340, {
        w: 230,
        h: 70,
        color: ROLE.patch,
        size: 28,
        opacity: (0.3 + 0.7 * cls) * alpha,
      }),
      txt('· · · P_N + p_N', 150, 340, 28, COSMOS.muted, 'mono', 'left').opacity(
        (0.3 + 0.7 * cls) * alpha,
      ),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(
    s,
    c,
    'positions-permuted-position-summary-b2-1',
    (d) => s.play(withPos.to(1, { duration: d })),
    { dur: 0.5 },
  );
  playCue(
    s,
    c,
    'positions-class-and-patch-sequence-b3-1',
    (d) => s.play(showCls.to(1, { duration: d })),
    { dur: 0.5 },
  );
  bindCueBeat(s, c, s.value(0), ['positions-permuted-patch-a-b1-1']);
}
