// Scene 22: quantized-serving - Separate compressed weight bytes from a measured useful edit
// 3B parameter raw weight comparison: 16-bit (6.0 GB) vs 8-bit (3.0 GB) vs 4-bit (1.5 GB)
// + separate scales/metadata/KV/buffers + bandwidth-bound decode kernel & syntax/ACL checks!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function quantizedServing(s, c) {
  const phase = s.value(0);
  const sizesOn = s.value(0);
  const bwOn = s.value(0);

  const header = cinemaHeader(
    'QUANTIZED SERVING BUDGET',
    'Weight bytes !=',
    'measured useful edits',
    {
      x: -860,
      y: -445,
      accent: ROLE.gpu,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#60a5fa1a', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const sz = sizesOn.value;
      const bw = bwOn.value;
      const nodes = [];

      // 3B parameter weight towers: 16-bit (6 GB), 8-bit (3 GB), 4-bit (1.5 GB)
      const x0 = -560;
      const rows = [
        { label: 'FP16 / BF16 (16-bit)', gb: 6.0, w: 960, col: ROLE.gpu, y: -140 },
        { label: 'INT8 / FP8 (8-bit)', gb: 3.0, w: 480, col: ROLE.ed, y: -45 },
        { label: 'INT4 / GPTQ (4-bit)', gb: 1.5, w: 240, col: ROLE.ok, y: 50 },
      ];

      nodes.push(
        txt(
          'RAW WEIGHT PAYLOAD FOR 3 BILLION PARAMETERS (EXCLUDING OVERHEAD)',
          -840,
          -210,
          26,
          ROLE.ed,
          'mono',
          'left',
        ),
      );
      rows.forEach((r) => {
        nodes.push(
          txt(r.label, -840, r.y, 26, r.col, 'mono', 'left'),
          rect(r.w, 44, { fill: r.col, stroke: '#ffffff', width: 1.5, radius: 6 })
            .at(x0 + 260 + r.w * 0.5, r.y)
            .glow(7, r.col)
            .opacity(0.45 + sz * 0.5),
          txt(`${r.gb.toFixed(1)} GB`, x0 + 260 + r.w + 26, r.y, 28, r.col, 'mono', 'left'),
        );
      });

      // Bottom: Overhead & End-to-End Quality Contract
      const bAlpha = 0.4 + bw * 0.6;
      nodes.push(
        line([-840, 130], [840, 130], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'STILL BUDGET: scales · metadata · FP16 layers · batch KV cache · temp buffers',
          0,
          195,
          26,
          ROLE.warn,
          'mono',
          'center',
        ),
        txt(
          'Bandwidth-bound decode benefits ONLY with a suitable kernel; profile prefill & decode separately!',
          0,
          255,
          26,
          ROLE.ok,
          'mono',
          'center',
        ).opacity(bAlpha),
        txt(
          'Verify syntax, permission-sensitive calls, latency & char retention across languages',
          0,
          315,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(bAlpha),
        txt('POST-TRAINING GPTQ', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('4-bit = 1/4 raw bytes before overhead', 480, -378, 26, COSMOS.muted, 'mono', 'center'),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.gpu,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.0);

  c.on('cc-weight-six-onehalf', () => {
    s.play(sizesOn.to(1, { duration: clampDur(c, c.cue('cc-weight-six-onehalf').start, 0.35) }));
  });
  c.on('cc-quantized-serving-1', () => {
    s.play(bwOn.to(1, { duration: clampDur(c, c.cue('cc-quantized-serving-1').start, 0.4) }));
  });
}
