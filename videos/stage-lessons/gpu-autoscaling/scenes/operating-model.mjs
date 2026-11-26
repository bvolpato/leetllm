// Scene 31: operating-model - Price warm capacity and operational ownership together
// Beat 0: Luminous demand wave layered over Reserved/On-Demand baseline, Warm Headroom, and Retryable Spot overflow.
// Beat 1: Three-tier operational ownership spectrum (Managed Inference, GPU Instances, Managed Kubernetes) at equal SLO.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  glowBar,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function operatingModel(s, c) {
  const phase = s.value(0);
  const mode = s.value(0); // 0=capacity layers, 1=ownership spectrum

  const header = cinemaHeader(
    'ECONOMICS & PLATFORM OWNERSHIP',
    'Price warm headroom',
    '& ownership together',
    {
      x: -860,
      y: -420,
      accent: ROLE.focus,
      size: 52,
    },
  );

  const bgAura = aura(160, 40, 660, '#ffd1661e', '#60a5fa1a');

  // Mode 0: Layered capacity wave (Reserved baseline + Warm headroom + Spot burst overflow)
  const waveLayer = guardedDynamic(
    () => fadeOutHalf(mode.value),
    (a) => {
      const p = phase.value;
      const x0 = -820;
      const x1 = 820;
      const yBase = 280;

      // Glowing demand wave oscillating strictly above the Warm Headroom band (y <= 40)
      const wavePts = [];
      for (let i = 0; i <= 48; i++) {
        const u = i / 48;
        const x = x0 + u * (x1 - x0);
        const surge = Math.exp(-((u - 0.55) ** 2) / 0.045) * 280 + Math.sin(u * 10 + p * 0.6) * 20;
        const y = 12 - surge;
        wavePts.push([x, y]);
      }

      return group(
        // Stable On-Demand / Reserved baseline band
        rect(1640, 140, { fill: '#0f223d', stroke: ROLE.cold, width: 2.6, radius: 12 })
          .at(0, yBase - 70)
          .glow(7, ROLE.cold)
          .opacity(a),
        txt(
          'RESERVED / ON-DEMAND BASELINE  (PROTECTS SLO)',
          0,
          yBase - 70,
          28,
          ROLE.cold,
          'mono',
        ).opacity(a),

        // Warm idle headroom band
        rect(1640, 74, {
          fill: '#262012',
          stroke: ROLE.focus,
          width: 2.4,
          radius: 10,
          dash: [8, 6],
        })
          .at(0, yBase - 185)
          .glow(6, ROLE.focus)
          .opacity(a),
        txt(
          'WARM HEADROOM  (ABSORBS BURST DURING 207s BOOT)',
          0,
          yBase - 185,
          26,
          ROLE.focus,
          'mono',
        ).opacity(a),

        // Retryable Spot Overflow peak zone
        rect(620, 145, { fill: '#112536', stroke: ROLE.active, width: 2.4, radius: 14 })
          .at(90, -105)
          .glow(8, ROLE.active)
          .opacity(a),
        txt('RETRYABLE SPOT OVERFLOW', 90, -122, 28, ROLE.active, 'mono').opacity(a),
        txt('Preemptible burst tier', 90, -78, 26, COSMOS.muted, 'sans').opacity(a),

        // Demand wave curve
        beamWithPhotons(wavePts, ROLE.warm, p * 0.5, {
          width: 4.2,
          glow: 10,
          photonCount: 3,
          alpha: a,
        }),

        txt(
          'Rapid removal & reload raises both cost and latency  ·  Tune stabilization to lull lengths',
          0,
          388,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );
    },
  );

  // Mode 1: Operational Ownership Spectrum (Provider vs Your Team share)
  const ownerLayer = guardedDynamic(
    () => fadeInHalf(mode.value),
    (a) => {
      const tiers = [
        {
          name: 'Managed Inference',
          prov: 0.78,
          left: 'Provider: lifecycle & GPUs',
          right: 'Team: app quality & SLO',
          col: ROLE.warm,
          y: -130,
        },
        {
          name: 'Managed Kubernetes',
          prov: 0.44,
          left: 'Provider: control plane',
          right: 'Team: drivers · workers · scaling',
          col: ROLE.active,
          y: 40,
        },
        {
          name: 'Raw GPU Instances',
          prov: 0.2,
          left: 'Provider: hardware only',
          right: 'Team: engine · queues · recovery',
          col: ROLE.focus,
          y: 210,
        },
      ];
      const nodes = [
        txt(
          'OPERATIONAL OWNERSHIP SPECTRUM AT EQUAL SLO',
          860,
          -355,
          26,
          ROLE.focus,
          'mono',
          'right',
        ).opacity(a),
      ];
      for (const tr of tiers) {
        nodes.push(
          txt(tr.name, -860, tr.y - 14, 30, tr.col, 'mono', 'left').opacity(a),
          glowBar(-440, tr.y, 1280, 52, tr.prov, {
            fill: tr.col,
            bg: '#23162b',
            border: '#443563',
            glow: 8,
            opacity: a,
          }),
          txt(tr.left, -425, tr.y - 52, 26, tr.col, 'sans', 'left').opacity(a),
          txt(tr.right, 840, tr.y - 52, 26, ROLE.decode, 'sans', 'right').opacity(a),
        );
      }
      nodes.push(
        txt(
          'Compare total cost per useful request (failures, interruption, ops)  ·  Not raw $/GPU-hr',
          0,
          385,
          28,
          ROLE.focus,
          'sans',
        )
          .glow(6, ROLE.focus)
          .opacity(a),
      );
      return group(...nodes);
    },
  );

  s.add(bgAura, header, waveLayer, ownerLayer);
  driftValue(s, c, phase, 5.5, { startOffset: 0.1, endMargin: 0.5 });

  tweenOn(s, c, 'ga-operating-model-b0', mode, 0, 0.2);
  tweenOn(s, c, 'ga-operating-model-b1', mode, 1, 0.4);
}
