// Scene 15: weight-state - Build weights, growing KV and overhead separately
// Stacked glowing HBM memory tower for 8B BF16 (16.0 GB weights + 4.0 GiB [4.295 GB] KV + 15% = 23.3 GB)
// with explicit decimal GB vs binary GiB accounting and GQA/MQA callouts.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  DATA,
  GiB,
  ROLE,
  aura,
  cinemaHeader,
  glowTex,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function weightState(s, c) {
  const step = s.value(0); // 1=weights+KV factors, 2=4 GiB = 4.295 GB, 3=23.3 GB total, 4=GQA/MQA & multi-GPU

  const header = cinemaHeader('HBM MEMORY BUDGETING', 'Weights, growing KV', '& overhead apart', {
    x: -860,
    y: -420,
    accent: ROLE.active,
    size: 52,
  });

  const bgAura = aura(320, 40, 620, '#60a5fa20', '#fb923c1a');

  const kvEq = glowTex(
    String.raw`\text{KV} = 2 \cdot 32 \cdot 8 \cdot 128 \cdot 4096 \cdot 8 \cdot 2 = 4\;\text{GiB}`,
    {
      x: -290,
      y: -175,
      size: 34,
      color: ROLE.kv,
      glow: 6,
    },
  );

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const weightsGb = DATA.mem8B.weights / 1e9;
      const kvGib = DATA.mem8B.kv / GiB;
      const kvGb = DATA.mem8B.kv / 1e9;
      const totalGb = DATA.mem8B.total / 1e9;
      const ovhGb = totalGb - weightsGb - kvGb;

      // Vertical stacked HBM tower on right (x=470, bottom y=370, scale 26 px/GB)
      const tx = 470;
      const yBot = 370;
      const pxPerGb = 25;
      const hW = weightsGb * pxPerGb;
      const hKv = kvGb * pxPerGb;
      const hOvh = ovhGb * pxPerGb;

      const nodes = [
        txt('8B BF16 FOOTPRINT (8 REQ x 4K CTX)', tx, -385, 26, ROLE.focus, 'mono'),
        // Weights block (always shown)
        rect(360, hW, { fill: '#102342', stroke: ROLE.cold, width: 2.8, radius: 10 })
          .at(tx, yBot - hW * 0.5)
          .glow(8, ROLE.cold),
        txt(`Weights: ${weightsGb.toFixed(1)} GB`, tx, yBot - hW * 0.5, 30, ROLE.cold, 'mono'),
      ];

      // KV slab on top of weights
      if (st >= 1.4) {
        const kvY = yBot - hW - hKv * 0.5 - 6;
        nodes.push(
          rect(360, hKv, { fill: '#2c1e12', stroke: ROLE.kv, width: 2.8, radius: 10 })
            .at(tx, kvY)
            .glow(9, ROLE.kv),
          txt(`KV: ${kvGib.toFixed(0)} GiB (${kvGb.toFixed(2)} GB)`, tx, kvY, 26, ROLE.kv, 'mono'),
        );
      }

      // 15% overhead slab on top
      if (st >= 2.4) {
        const ovhY = yBot - hW - hKv - hOvh * 0.5 - 12;
        nodes.push(
          rect(360, hOvh, { fill: '#231636', stroke: ROLE.decode, width: 2.6, radius: 10 })
            .at(tx, ovhY)
            .glow(8, ROLE.decode),
          txt(`+15%: ${ovhGb.toFixed(1)} GB`, tx, ovhY, 26, ROLE.decode, 'mono'),
          txt(
            `TOTAL: ~${totalGb.toFixed(1)} GB`,
            tx,
            ovhY - hOvh * 0.5 - 42,
            34,
            ROLE.warm,
            'mono',
          ).glow(9, ROLE.warm),
        );
      }

      // Left breakdown equations & notes
      nodes.push(
        txt(
          '1. Resident weights: 8B x 2 B = 16.0 GB (decimal)',
          -860,
          -82,
          28,
          ROLE.cold,
          'mono',
          'left',
        ),
      );
      if (st >= 1.4) {
        nodes.push(
          txt(
            '2. Growing KV: 4 GiB = 4.295 decimal GB',
            -860,
            -18,
            28,
            ROLE.kv,
            'mono',
            'left',
          ).glow(6, ROLE.kv),
        );
      }
      if (st >= 2.4) {
        nodes.push(
          txt(
            `3. +15% runtime & CUDA graphs -> ~${totalGb.toFixed(1)} GB`,
            -860,
            48,
            28,
            ROLE.warm,
            'mono',
            'left',
          ).glow(7, ROLE.warm),
          txt(
            'Use to shortlist GPUs, then measure free VRAM after load',
            -860,
            112,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      }
      if (st >= 3.4) {
        nodes.push(
          txt(
            'GQA / MQA count KV heads only, not all query heads',
            -860,
            212,
            28,
            ROLE.active,
            'sans',
            'left',
          ).glow(5, ROLE.active),
          txt(
            'Only full-attention layers append this growing tensor',
            -860,
            270,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ),
          txt(
            'Multi-GPU: verify per-card weights + state vs free HBM',
            -860,
            326,
            26,
            ROLE.focus,
            'mono',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, kvEq, dyn);

  tweenOn(s, c, 'ga-weight-state-b0', step, 1, 0.35);
  tweenOn(s, c, 'ga-weight-state-b1', step, 2, 0.3);
  tweenOn(s, c, 'ga-memory-total', step, 3, 0.3);
  tweenOn(s, c, 'ga-weight-state-b2', step, 4, 0.35);
}
