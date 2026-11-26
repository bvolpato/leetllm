// Scene 24: keda-phases - Separate activation, HPA scaling and node supply
// Luminous 4-stage control architecture: Always-On Gateway/Queue -> KEDA 0<->1 (cooldownPeriod)
// -> HPA 1<->N (downscale stabilizationWindow) -> Karpenter Unschedulable Pod -> GPU Node.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  driftValue,
  glowDot,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function kedaPhases(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1=KEDA 0<->1 + HPA + Karpenter, 2=cooldown vs stabilization, 3=gateway/durable queue

  const header = cinemaHeader(
    'KEDA 2.20 · HPA · KARPENTER',
    'Separate activation,',
    'HPA & node supply',
    {
      x: -860,
      y: -420,
      accent: ROLE.control,
      size: 52,
    },
  );

  const bgAura = aura(150, 40, 680, '#60a5fa20', '#5ce1e61a');

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const p = phase.value;
      const yMain = -45;
      const nodes = [];

      // Four stage hubs across the canvas
      const stages = [
        {
          x: -700,
          title: 'Gateway / Queue',
          sub: 'Always-on demand',
          col: ROLE.focus,
          hi: st >= 2.5,
        },
        { x: -235, title: 'KEDA 0 <-> 1', sub: 'Activation only', col: ROLE.active, hi: st >= 0.4 },
        { x: 235, title: 'HPA 1 <-> N', sub: 'Running replicas', col: ROLE.control, hi: st >= 0.4 },
        { x: 700, title: 'Karpenter', sub: 'Unschedulable GPU', col: ROLE.expired, hi: st >= 0.4 },
      ];

      for (let i = 0; i < stages.length; i++) {
        const sg = stages[i];
        if (i < stages.length - 1) {
          nodes.push(
            beamWithPhotons(
              [
                [sg.x + 175, yMain],
                [stages[i + 1].x - 175, yMain],
              ],
              sg.col,
              p * 0.85,
              { width: 3.4, glow: 8, photonCount: 1 },
            ),
          );
        }
        nodes.push(
          rect(330, 118, {
            fill: '#101b32',
            stroke: sg.col,
            width: sg.hi ? 3.0 : 2.2,
            radius: 16,
          })
            .at(sg.x, yMain)
            .glow(sg.hi ? 10 : 5, sg.col),
          txt(sg.title, sg.x, yMain - 18, 28, sg.col, 'mono'),
          txt(sg.sub, sg.x, yMain + 26, 26, COSMOS.ink, 'sans'),
        );
      }

      // Timer contracts directly underneath KEDA and HPA (Beat 1 highlight)
      const timerOp = st >= 1.5 ? 1 : 0.4;
      nodes.push(
        glowDot(-235, 112, { radius: 9, color: ROLE.active, glow: 10, opacity: timerOp }),
        txt('cooldownPeriod', -235, 152, 28, ROLE.active, 'mono')
          .glow(st >= 1.5 ? 6 : 0, ROLE.active)
          .opacity(timerOp),
        txt('Return to 0 ONLY', -235, 198, 26, COSMOS.ink, 'sans').opacity(timerOp),
        txt('(not every scale event)', -235, 240, 26, COSMOS.muted, 'sans').opacity(timerOp),

        glowDot(235, 112, { radius: 9, color: ROLE.drain, glow: 10, opacity: timerOp }),
        txt('stabilizationWindow', 235, 152, 28, ROLE.drain, 'mono')
          .glow(st >= 1.5 ? 6 : 0, ROLE.drain)
          .opacity(timerOp),
        txt('Downscale guard', 235, 198, 26, COSMOS.ink, 'sans').opacity(timerOp),
        txt('Keep scale-up fast', 235, 240, 26, ROLE.warm, 'sans').opacity(timerOp),
      );

      // Node supply -> engine load/warm note under Karpenter
      nodes.push(
        glowDot(700, 112, { radius: 9, color: ROLE.expired, glow: 10 }),
        txt('Node -> Load -> Warm', 700, 156, 26, ROLE.expired, 'mono'),
        txt('Pod still boots engine', 700, 200, 26, COSMOS.muted, 'sans'),
      );

      // Zero-scale demand note under Gateway (Beat 2 highlight)
      const gwOp = st >= 2.5 ? 1 : 0.45;
      nodes.push(
        glowDot(-700, 112, { radius: 9, color: ROLE.focus, glow: 10, opacity: gwOp }),
        txt('No engine pods at 0', -700, 156, 26, ROLE.focus, 'mono').opacity(gwOp),
        txt('KEDA never buffers', -700, 200, 26, COSMOS.ink, 'sans').opacity(gwOp),
      );

      // Distinct replica state counters strip along bottom
      const foot =
        st >= 2.5
          ? 'Keep Desired · Starting · Ready · Draining · Failed on separate counters and clocks'
          : st >= 1.5
            ? 'A 5-minute pause applied in both directions strands a burst'
            : 'KEDA handles 0<->1 and creates the HPA; Karpenter supplies unschedulable GPU nodes';
      nodes.push(txt(foot, 0, 385, 28, st >= 2.5 ? ROLE.warm : ROLE.focus, 'sans'));

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);
  driftValue(s, c, phase, 6.0, { startOffset: 0.1, endMargin: 0.5 });

  tweenOn(s, c, 'ga-keda-phases-b0', step, 1, 0.35);
  tweenOn(s, c, 'ga-keda-phases-b1', step, 2, 0.35);
  tweenOn(s, c, 'ga-keda-phases-b2', step, 3, 0.35);
}
