// Scene 20: parallel-bytes - Count where tensor and pipeline splits communicate
// 4 orbiting 3D GPU monoliths showing TP collectives within layers (80 x 2 x 32 = 5,120 events)
// vs PP stage handoffs across 4x20 layers (3 x 32 = 96 transfers), plus NVLink vs cross-node fabric.
import { gridPlane3d, group } from 'vizmatic/stage';
import {
  COSMOS,
  DATA,
  ROLE,
  addBox3D,
  addPointerArc3D,
  aura,
  cinemaHeader,
  cinematic3d,
  driftValue,
  guardedDynamic,
  orbitScene,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function parallelBytes(s, c) {
  const pulse = s.value(0);
  const step = s.value(0); // 1=TP/PP overview, 2=80x32 setup, 3=TP 5120, 4=PP 96, 5=NVLink & bubbles

  const header = cinemaHeader(
    'TENSOR VS PIPELINE PARALLELISM',
    'Where multi-GPU splits',
    'communicate',
    {
      x: -860,
      y: -420,
      accent: ROLE.active,
      size: 52,
    },
  );

  const bgAura = aura(265, 20, 640, '#5ce1e620', '#ff6b8b1a');

  // 4 Orbiting 3D GPUs connected by NVLink collective arcs (TP) & sequential stage hops (PP)
  const parView = cinematic3d({
    theta: -0.78,
    phi: 1.0,
    distance: 17.2,
    unit: 100,
    focus: [0, 0, 0.95],
  }).at(285, -10);

  parView.add(
    gridPlane3d({
      x: [-3.8, 3.8],
      y: [-2.2, 2.2],
      z: 0,
      step: 1.2,
      color: '#25395e',
      width: 1.2,
      opacity: 0.5,
    }),
  );

  const tops = [];
  for (let i = 0; i < 4; i++) {
    const gx = -3.15 + i * 1.8;
    addBox3D(parView, gx, -1.0, 0.06, 1.15, 2.0, 1.45, ROLE.cold, ROLE.active, {
      faceOpacity: 0.78,
      edgeWidth: 2.2,
      edgeGlow: 7,
    });
    tops.push([gx + 0.57, 0, 1.54]);
  }

  // Dense TP collective arcs (upper cyan rings) + PP sequential stage beams (lower rose/gold arcs)
  for (let i = 0; i < 3; i++) {
    addPointerArc3D(parView, tops[i], tops[i + 1], ROLE.active, {
      lift: 0.85,
      pulseVal: pulse,
      phaseOffset: i * 0.25,
    });
    addPointerArc3D(parView, [tops[i][0], 0.7, 0.9], [tops[i + 1][0], 0.7, 0.9], ROLE.expired, {
      lift: 0.35,
      pulseVal: pulse,
      phaseOffset: 0.5 + i * 0.2,
    });
  }
  // Ring wrap collective GPU 3 -> GPU 0 for all-reduce
  addPointerArc3D(parView, tops[3], tops[0], ROLE.active, {
    lift: 1.35,
    pulseVal: pulse,
    phaseOffset: 0.12,
  });

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const nodes = [
        txt('4 GPUs · 80 LAYERS · 32 DECODE STEPS', 285, -402, 26, ROLE.focus, 'mono').glow(
          5,
          ROLE.focus,
        ),
        txt('CYAN: TP ALL-REDUCE   ·   ROSE: PP STAGE HOPS', 285, 438, 26, COSMOS.muted, 'mono'),
        txt('TENSOR PARALLEL (TP)', -860, -185, 26, ROLE.active, 'mono', 'left'),
        txt('2 collectives / layer (Attn + FFN)', -860, -130, 26, COSMOS.ink, 'sans', 'left'),
        txt('PIPELINE PARALLEL (PP)', -860, -52, 26, ROLE.expired, 'mono', 'left'),
        txt('4 stages x 20 layers -> 3 hops / step', -860, 2, 26, COSMOS.ink, 'sans', 'left'),
      ];

      if (st >= 2.5) {
        nodes.push(
          txt(
            `TP: 80 x 2 x 32 = ${DATA.tpEvents.toLocaleString()} events`,
            -860,
            96,
            30,
            ROLE.active,
            'mono',
            'left',
          ).glow(7, ROLE.active),
        );
      }
      if (st >= 3.5) {
        nodes.push(
          txt(
            `PP: 3 x 32 = ${DATA.ppEvents} stage transfers`,
            -860,
            158,
            30,
            ROLE.expired,
            'mono',
            'left',
          ).glow(7, ROLE.expired),
        );
      }
      if (st >= 4.5) {
        nodes.push(
          txt(
            'Keep TP inside NVLink / NVSwitch nodes',
            -860,
            248,
            28,
            ROLE.warm,
            'sans',
            'left',
          ).glow(6, ROLE.warm),
          txt(
            'PP bubbles still hurt tail latency: benchmark',
            -860,
            306,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      } else {
        nodes.push(
          txt(
            'Count != time: check message size, link & overlap',
            -860,
            265,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, parView, header, dyn);
  orbitScene(s, c, parView, { theta: -0.22, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 6.0, { startOffset: 0.1, endMargin: 0.5 });

  tweenOn(s, c, 'ga-parallel-bytes-b0', step, 1, 0.35);
  tweenOn(s, c, 'ga-parallel-bytes-b1', step, 2, 0.3);
  tweenOn(s, c, 'ga-tp-events', step, 3, 0.3);
  tweenOn(s, c, 'ga-pp-events', step, 4, 0.3);
  tweenOn(s, c, 'ga-parallel-bytes-b2', step, 5, 0.35);
}
