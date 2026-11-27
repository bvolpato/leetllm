// Scene 25: Which operations count toward model FLOPs utilization? (Useful 40 + recompute 10 / peak 100 -> 40% MFU vs 50% HFU; H100 study 1,152 seqs: 96 GPUs 47% -> 4,608 GPUs 42%).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function mfuReceipt(s, c) {
  // step: 0=MFU vs HFU, 1=40% vs 50%, 2=H100 study 1152 seqs, 3=96 GPUs 47%, 4=4608 GPUs 42%
  const step = s.value(0);

  const bgAura = aura(0, 15, 620, '#34d3991c', '#60a5fa18');
  const title = heroTitle(['What Counts Toward', 'Model FLOPs Utilization?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.dp,
    eyebrow: 'MFU (MODEL WORK) VS HFU (+ RECOMPUTATION) · H100 SCALING',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st <= 1) {
      // Toy interval: Useful 40, Recompute 10, Peak 100 -> 40% MFU vs 50% HFU
      const scale = 11.5; // 100 -> 1150px
      const x0 = -580;
      nodes.push(
        txt(
          'SUPPLIED INTERVAL: USEFUL = 40  |  RECOMPUTATION = 10  |  PEAK = 100',
          0,
          -230,
          26,
          COSMOS.gold,
          'mono',
        ),
        // Peak rail
        glassCell(x0 + 575, -110, 1150, 76, ROLE.dim, { fill: '#0c1220', glow: 2 }),
        txt('Hardware Peak Capacity = 100', x0 + 575, -110, 26, COSMOS.muted, 'mono'),

        // MFU bar (40%)
        glassCell(x0 + 230, 20, 460, 86, ROLE.good, { fill: '#0e2624', glow: st >= 1 ? 10 : 5 }),
        txt('Useful Model Work = 40', x0 + 230, 20, 26, ROLE.good, 'mono'),
        txt('MFU = 40 / 100 = 40%', x0 + 490, 20, 28, ROLE.good, 'mono', 'left'),

        // HFU bar (40 + 10 = 50%)
        glassCell(x0 + 230, 150, 460, 86, ROLE.tp, { fill: '#101f38', glow: 6 }),
        txt('Useful = 40', x0 + 230, 150, 26, COSMOS.ink, 'mono'),
        glassCell(x0 + 460 + 58, 150, 116, 86, ROLE.ep, {
          fill: '#2a1d0d',
          glow: st >= 1 ? 10 : 5,
        }),
        txt('+10', x0 + 460 + 58, 150, 26, ROLE.ep, 'mono'),
        txt('HFU = 50 / 100 = 50%', x0 + 605, 150, 28, ROLE.ep, 'mono', 'left'),
      );
      void scale;
    } else {
      // H100 scaling study: fixed 1,152 sequences, 96 GPUs -> 47%, 4,608 GPUs -> 42%
      nodes.push(
        txt(
          'MEGATRON H100 SCALING STUDY (FIXED 1,152 SEQUENCES)',
          0,
          -230,
          26,
          COSMOS.gold,
          'mono',
        ),
        glassCell(-410, 10, 720, 310, st >= 3 ? ROLE.tp : ROLE.dim, {
          fill: '#101f38',
          glow: st >= 3 ? 10 : 4,
        }),
        txt('96 H100 GPUs', -410, -85, 30, ROLE.tp, 'mono'),
        txt(
          st >= 3 ? '47% MFU' : 'Baseline MFU',
          -410,
          15,
          48,
          st >= 3 ? ROLE.good : COSMOS.muted,
          'mono',
        ),
        txt('Fixed vocab, seq len, overlap', -410, 100, 26, COSMOS.muted, 'sans'),

        glassCell(410, 10, 720, 310, st >= 4 ? ROLE.ep : ROLE.dim, {
          fill: st >= 4 ? '#1f1a10' : '#0d1322',
          glow: st >= 4 ? 10 : 4,
        }),
        txt('4,608 H100 GPUs (48x scale)', 410, -85, 30, ROLE.ep, 'mono'),
        txt(
          st >= 4 ? '42% MFU' : 'Strong-scaled MFU',
          410,
          15,
          48,
          st >= 4 ? COSMOS.gold : COSMOS.muted,
          'mono',
        ),
        txt('Same 1,152-seq batch spread 48x wider', 410, 100, 26, COSMOS.muted, 'sans'),
      );
    }

    nodes.push(
      txt(
        'Compare ratios only under the same FLOP convention and peak; track validation loss for learning',
        0,
        355,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['mg-mfu-receipt-b0', 0],
    ['mg-mfu-forty-fifty', 1],
    ['mg-mfu-receipt-b1', 2],
    ['mg-baseline-mfu', 3],
    ['mg-reported-mfu', 4],
  ]);
}
