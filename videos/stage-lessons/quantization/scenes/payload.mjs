// Scene 02: payload: 7B weights: 14 GB (16-bit) -> 3.5 GB (4-bit codes, 1/4 width) + scales + runtime memory.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function payload(s, c) {
  const showQ4 = s.value(0);
  const showScales = s.value(0);
  const showRuntime = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['7 Billion Weights:', 'From 14 GB Down to 4-Bit Codes'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.weight,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const q4 = showQ4.value;
    const sc = showScales.value;
    const rt = showRuntime.value;

    const barX = -480;
    const fullW = 960;
    const q4W = fullW * 0.25;
    const scaleW = fullW * (0.11 / 14);
    const runW = fullW * (3.0 / 14);

    const nodes = [
      txt(
        '7,000,000,000 WEIGHTS (COUNT FIXED; ONLY BITS PER WEIGHT CHANGE)',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      txt('16-bit (2 B/w)', -855, -105, 28, ROLE.weight, 'mono', 'left').opacity(alpha),
      lumBar(barX, -105, fullW, 48, ROLE.weight, { opacity: alpha, maxTrackW: fullW }),
      txt('14.0 GB', barX + fullW + 28, -105, 30, ROLE.weight, 'mono', 'left').opacity(alpha),

      txt('4-bit codes (0.5 B)', -855, 25, 28, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * q4),
      ),
      lumBar(barX, 25, fullW * (1 - 0.75 * q4), 48, q4 > 0.3 ? ROLE.ok : ROLE.weight, {
        opacity: alpha * (0.48 + 0.52 * q4),
        maxTrackW: fullW,
      }),
      txt(
        q4 > 0.35 ? '3.5 GB (1/4 width)' : '14.0 GB -> 3.5 GB',
        barX + fullW + 28,
        25,
        28,
        q4 > 0.35 ? ROLE.ok : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * q4)),

      txt('4-bit + scales + live', -855, 155, 28, ROLE.gold, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * sc),
      ),
      lumBar(barX, 155, q4W, 48, ROLE.ok, {
        opacity: alpha * (0.45 + 0.55 * sc),
        maxTrackW: fullW,
      }),
      lumBar(barX + q4W + 4, 155, Math.max(16, scaleW * 3), 48, ROLE.gold, {
        opacity: alpha * (0.45 + 0.55 * sc),
        glow: 8,
      }),
      lumBar(barX + q4W + 26, 155, runW * (0.35 + 0.65 * rt), 48, ROLE.code, {
        opacity: alpha * (0.45 + 0.55 * rt),
        glow: 8,
      }),
      txt(
        rt > 0.35 ? '+scales + KV/work' : '+scale metadata',
        barX + fullW + 28,
        155,
        26,
        rt > 0.35 ? ROLE.code : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * sc)),

      chipPill(
        rt > 0.35
          ? 'Weight bytes shrink 4x, while activations, workspace & KV cache still need device memory'
          : 'Packing 4-bit codes cuts raw weight payload 4x without dropping a single parameter',
        0,
        305,
        {
          w: 1640,
          h: 74,
          color: rt > 0.35 ? ROLE.gold : ROLE.ok,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'full-weight-payload', (d) => s.play(showQ4.to(0, { duration: d })));
  playCue(s, c, 'weight-storage', (d) => s.play(showQ4.to(0, { duration: d })));
  playCue(s, c, 'compact-weight-payload', (d) => s.play(showQ4.to(1, { duration: d })));
  playCue(s, c, 'scale-metadata', (d) => s.play(showScales.to(1, { duration: d })));
  playCue(s, c, 'runtime-resources', (d) => s.play(showRuntime.to(1, { duration: d })));
}
