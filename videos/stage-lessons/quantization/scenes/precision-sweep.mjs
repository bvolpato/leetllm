// Scene 18: precision-sweep: 4 weights on 2-bit (MSE 1.007, 1B), 4-bit (MSE 0.067, 2B), 8-bit (near-0, 4B).
import {
  COSMOS,
  PREC_2,
  PREC_4,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  precisionExperiment,
  txt,
} from '../parts.mjs';

export default function precisionSweep(s, c) {
  const showMse = s.value(0);
  const showBytes = s.value(0);

  const prec8 = precisionExperiment(8);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Precision Sweep:', '2-Bit vs 4-Bit vs 8-Bit Output Error'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.grid,
  });

  const rows = [
    {
      lbl: '2-bit (3 codes)',
      p: PREC_2,
      col: ROLE.err,
      tag: `MSE ${PREC_2.mse.toFixed(3)}  |  ${PREC_2.payload} B`,
    },
    {
      lbl: '4-bit (15 codes)',
      p: PREC_4,
      col: ROLE.gold,
      tag: `MSE ${PREC_4.mse.toFixed(3)}  |  ${PREC_4.payload} B`,
    },
    {
      lbl: '8-bit (255 codes)',
      p: prec8,
      col: ROLE.ok,
      tag: `MSE ${prec8.mse.toFixed(4)}  |  ${prec8.payload} B`,
    },
  ];

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const ms = showMse.value;
    const bt = showBytes.value;

    const barX = -460;
    const maxW = 860;
    const px = maxW / 1.1;

    const nodes = [
      txt(
        'WEIGHTS [0.3, -1.2, 2.0, 0.7]  |  3 HELD-OUT INPUT VECTORS',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    rows.forEach((r, idx) => {
      const y = -110 + idx * 108;
      nodes.push(
        txt(r.lbl, -855, y, 28, r.col, 'mono', 'left').opacity(alpha),
        lumBar(barX, y, Math.max(12, r.p.mse * px), 44, r.col, {
          opacity: alpha * (0.48 + 0.52 * ms),
          maxTrackW: maxW,
        }),
        txt(r.tag, barX + maxW + 24, y, 26, r.col, 'mono', 'left').opacity(alpha),
      );
    });

    nodes.push(
      chipPill(
        bt > 0.35
          ? 'Fake-quantized floats test accuracy only: real speed depends on packed bytes + fused GPU kernels!'
          : 'Moving from 2-bit to 4-bit slashes output MSE by ~15x (1.007 -> 0.067) at just 2 bytes for 4 weights',
        0,
        245,
        {
          w: 1620,
          h: 78,
          color: bt > 0.35 ? ROLE.gold : ROLE.ok,
          size: 26,
          opacity: alpha,
        },
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'precision-sweep-build-0', (d) => s.play(showMse.to(0.35, { duration: d })));
  playCue(s, c, 'precision-sweep-build-1', (d) => s.play(showMse.to(1, { duration: d })));
  playCue(s, c, 'precision-sweep-build-2', (d) => s.play(showBytes.to(1, { duration: d })));
}
