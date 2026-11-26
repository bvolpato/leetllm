// Scene 21: precision-roles: Three separate axes (Weights W4/W8, Activations A16/A8/A4, KV Cache FP16/FP8) + SmoothQuant + FP8 KV calibration.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function precisionRoles(s, c) {
  const showSmooth = s.value(0);
  const showKv = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(
    ['Three Independent Precision Axes:', 'Weights, Activations & KV Cache'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.code,
    },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sm = showSmooth.value;
    const kv = showKv.value;

    const nodes = [
      txt(
        'KEEP ALL THREE PRECISION DECISIONS SEPARATE IN YOUR RUNTIME PLAN',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      // 3 pillars
      rect(520, 235, { fill: '#10203a', stroke: ROLE.weight, width: 2.8, radius: 14 })
        .at(-585, -30)
        .opacity(alpha),
      txt('1. WEIGHTS (W)', -585, -108, 28, ROLE.weight, 'mono', 'center').opacity(alpha),
      txt('W4A16: 4-bit weights', -585, -48, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('Cuts weight bytes ~4x', -585, 6, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Needs fused unpack GEMM', -585, 58, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),

      rect(520, 235, {
        fill: sm > 0.35 ? '#261e10' : '#10182d',
        stroke: sm > 0.35 ? ROLE.gold : ROLE.grid,
        width: 2.8,
        radius: 14,
      })
        .at(0, -30)
        .opacity(alpha * (0.5 + 0.5 * sm)),
      txt('2. ACTIVATIONS (A)', 0, -108, 28, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('W8A8 / W4A4 / FP8', 0, -48, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('SmoothQuant shifts outliers', 0, 6, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('from X into W before quant', 0, 58, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),

      rect(520, 235, {
        fill: kv > 0.35 ? '#181434' : '#10182d',
        stroke: kv > 0.35 ? ROLE.code : ROLE.grid,
        width: 2.8,
        radius: 14,
      })
        .at(585, -30)
        .opacity(alpha * (0.5 + 0.5 * kv)),
      txt('3. KV CACHE FORMAT', 585, -108, 28, ROLE.code, 'mono', 'center').opacity(alpha),
      txt('Independent of W format!', 585, -48, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('FP8 KV needs runtime check', 585, 6, 26, ROLE.code, 'mono', 'center').opacity(alpha),
      txt('Per-head scale -> FlashAttn', 585, 58, 26, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),

      chipPill(
        kv > 0.35
          ? 'Verify exact backend support & calibration path for FP8 KV cache before changing attention precision'
          : sm > 0.35
            ? 'SmoothQuant preserves the pre-quantization real product while taming activation outliers for W8A8'
            : 'W4A16 shrinks weights only; W8A8/FP8 also quantizes activations; KV cache is a third separate setting',
        0,
        225,
        {
          w: 1620,
          h: 78,
          color: kv > 0.35 ? ROLE.code : sm > 0.35 ? ROLE.gold : ROLE.weight,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'precision-roles-build-0', (d) => s.play(showSmooth.to(0, { duration: d })));
  playCue(s, c, 'precision-roles-build-1', (d) => s.play(showSmooth.to(1, { duration: d })));
  playCue(s, c, 'precision-roles-build-2', (d) => s.play(showKv.to(1, { duration: d })));
}
