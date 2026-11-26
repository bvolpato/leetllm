// Scene 09: hardware-ceilings: H100 SXM dense BF16 ridge (~295 FLOPs/B) -> 54 GB weight ceiling (~62 tok/s) -> 4k vs 32k KV traffic (8x).
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function hardwareCeilings(s, c) {
  const showDense = s.value(1);
  const show62 = s.value(0);
  const show32k = s.value(0);

  const bgAura = aura(0, 0, 740, '#16355e28', '#3c251218');
  const title = heroTitle(['Hardware Ceilings:', 'dense ridge & KV reads'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.wait,
  });

  const stageVis = s.value(1);
  const maxW = 860;
  const barX = -380;

  const layer = guardedDynamic(stageVis, (alpha) => {
    const s62 = show62.value;
    const s32 = show32k.value;
    const nodes = [
      txt('H100 SXM DENSE BF16 RIDGE POINT', -855, -225, 26, ROLE.clockA, 'mono', 'left').opacity(
        alpha,
      ),
      txt(
        'Dense Peak: 989.5 TFLOP/s  ÷  HBM BW: 3.35 TB/s  ≈  295 FLOPs/byte',
        -855,
        -155,
        32,
        ROLE.wait,
        'mono',
        'left',
      )
        .glow(8, ROLE.wait)
        .opacity(alpha),

      // Weight-only ceiling bar
      txt(
        '1-STREAM WEIGHT BANDWIDTH CEILING (54 GB WEIGHTS)',
        -855,
        -35,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        '3,350 GB/s ÷ 54 GB',
        -855,
        35,
        30,
        s62 > 0.2 ? ROLE.decode : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, 35, maxW * (0.1 + 0.9 * s62), 38, ROLE.decode, {
        opacity: (0.3 + 0.7 * s62) * alpha,
        maxTrackW: maxW,
      }),
      txt(
        s62 > 0.2 ? '≈ 62 tok/s max' : 'computing...',
        barX + maxW + 30,
        35,
        32,
        s62 > 0.2 ? ROLE.decode : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(s62 > 0.2 ? 8 : 0, ROLE.decode)
        .opacity(alpha),

      // KV read scaling: 4k vs 32k context (8x KV traffic!)
      txt(
        'KV CACHE READS PER DECODE STEP (WEIGHTS STAY FIXED)',
        -855,
        165,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      txt('4,096 positions', -855, 235, 30, ROLE.clockA, 'mono', 'left').opacity(alpha),
      lumBar(barX, 235, maxW * (1 / 8), 34, ROLE.clockA, { opacity: alpha, maxTrackW: maxW }),
      txt('1× KV bytes', barX + maxW + 30, 235, 30, ROLE.clockA, 'mono', 'left').opacity(alpha),

      txt(
        '32,768 positions',
        -855,
        320,
        30,
        s32 > 0.2 ? ROLE.stall : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, 320, maxW * (0.125 + 0.875 * s32), 34, ROLE.stall, {
        opacity: (0.3 + 0.7 * s32) * alpha,
        maxTrackW: maxW,
      }),
      txt(
        s32 > 0.2 ? '8× KV bytes' : 'long context',
        barX + maxW + 30,
        320,
        32,
        s32 > 0.2 ? ROLE.stall : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(s32 > 0.2 ? 8 : 0, ROLE.stall)
        .opacity(alpha),
    ];
    void showDense;
    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'hardware-ceilings-b2', (d) => s.play(show62.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'hardware-ceilings-b3', (d) => s.play(show32k.to(1, { duration: d })), {
    dur: 0.65,
  });
  bindCueBeat(s, c, s.value(0), ['hardware-ceilings-b1', 'weight-read-count']);
}
