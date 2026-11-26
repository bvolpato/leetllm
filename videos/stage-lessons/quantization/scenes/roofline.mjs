// Scene 20: roofline: A100 (2.04 TB/s, 312 TF) vs H100 (3.35 TB/s, 989.5 TF) -> 1 FLOP/byte is memory-bound -> 54 GB (16.1 ms / 62 tok/s) vs 13.92 GB (4.16 ms / 241 tok/s).
import {
  COSMOS,
  ROOF_A100,
  ROOF_H100,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function roofline(s, c) {
  const showH100 = s.value(0);
  const showFloor = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['Hardware Roofline:', 'Why Small-Batch Decode Is Bandwidth-Bound'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.grid,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const h1 = showH100.value;
    const fl = showFloor.value;

    const barX = -460;
    const maxW = 860;
    const px = maxW / 18;

    const nodes = [
      txt(
        'SMALL-BATCH DECODE: ~1 FLOP / WEIGHT BYTE (FAR BELOW COMPUTE RIDGE POINT)',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      rect(760, 145, { fill: '#10203a', stroke: ROLE.weight, width: 2.6, radius: 12 })
        .at(-430, -100)
        .opacity(alpha),
      txt('A100 80GB SXM', -430, -138, 28, ROLE.weight, 'mono', 'center').opacity(alpha),
      txt(
        `BW ${(ROOF_A100.bandwidth / 1e12).toFixed(2)} TB/s  |  Dense ${(ROOF_A100.dense / 1e12).toFixed(0)} TF`,
        -430,
        -88,
        26,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        `Ridge: ${ROOF_A100.ridge.toFixed(0)} FLOP/B`,
        -430,
        -56,
        26,
        ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),

      rect(760, 145, { fill: '#0f2d24', stroke: ROLE.ok, width: 2.6, radius: 12 })
        .at(430, -100)
        .opacity(alpha * (0.48 + 0.52 * h1)),
      txt('H100 80GB SXM', 430, -138, 28, ROLE.ok, 'mono', 'center').opacity(
        alpha * (0.48 + 0.52 * h1),
      ),
      txt(
        `BW ${(ROOF_H100.bandwidth / 1e12).toFixed(2)} TB/s  |  Dense ${(ROOF_H100.dense / 1e12).toFixed(1)} TF`,
        430,
        -92,
        26,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha * (0.48 + 0.52 * h1)),
      txt(
        `Ridge: ${ROOF_H100.ridge.toFixed(0)} FLOP/B`,
        430,
        -56,
        26,
        ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha * (0.48 + 0.52 * h1)),

      // H100 weight-read floors
      txt('BF16 (54.0 GB)', -855, 65, 28, ROLE.err, 'mono', 'left').opacity(
        alpha * (0.5 + 0.5 * fl),
      ),
      lumBar(barX, 65, ROOF_H100.bf16Milliseconds * px, 40, ROLE.err, {
        opacity: alpha * (0.5 + 0.5 * fl),
        maxTrackW: maxW,
      }),
      txt(
        `${ROOF_H100.bf16Milliseconds.toFixed(1)} ms (~62 tok/s)`,
        barX + maxW + 24,
        65,
        26,
        ROLE.err,
        'mono',
        'left',
      ).opacity(alpha * (0.5 + 0.5 * fl)),

      txt('4-bit (13.92 GB)', -855, 155, 28, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.5 + 0.5 * fl),
      ),
      lumBar(barX, 155, ROOF_H100.compactMilliseconds * px, 40, ROLE.ok, {
        opacity: alpha * (0.5 + 0.5 * fl),
        maxTrackW: maxW,
      }),
      txt(
        `${ROOF_H100.compactMilliseconds.toFixed(2)} ms (~241 tok/s!)`,
        barX + maxW + 24,
        155,
        26,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha * (0.5 + 0.5 * fl)),

      chipPill(
        '~4x smaller weights lift ideal H100 ceiling ~3.9x (fused kernels required)',
        0,
        280,
        {
          w: 1640,
          h: 74,
          color: ROLE.ok,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'roofline-build-0', (d) => s.play(showH100.to(0, { duration: d })));
  playCue(s, c, 'roofline-build-1', (d) => s.play(showH100.to(1, { duration: d })));
  playCue(s, c, 'roofline-build-2', (d) => s.play(showFloor.to(1, { duration: d })));
}
