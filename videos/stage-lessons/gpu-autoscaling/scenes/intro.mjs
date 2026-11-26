// Scene 01: intro - Will your summary start in time?
// Orbiting 3D warm GPU (5 slots) + cold GPU wireframe (207s) + pinned R21 queue wave & 30s start gate.
// Strict prediction withholding: beat 1 asks whether R21 starts in time; reveals only AFTER last-five & turn-too-late.
import { gridPlane3d, group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  DATA,
  ROLE,
  addBox3D,
  addWireBox3D,
  aura,
  beamWithPhotons,
  cinemaHeader,
  cinematic3d,
  clampDur,
  dashedRule,
  driftValue,
  fadeInNodes,
  glowDot,
  guardedDynamic,
  hideNodes,
  orbitScene,
  quadArcPts,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const pulse = s.value(0);
  const ticketVis = s.value(0);
  const waveStep = s.value(0); // 1=t0(1..5), 2=t10+t20(6..15), 3=t30(16..20, AFTER), 4=t40/expired(AFTER)
  const coldVis = s.value(0);
  const askVis = s.value(0);

  const header = cinemaHeader(
    '9:00 AM SURGE  ·  QUEUE TICKET #21',
    'Will your summary',
    'start in time?',
    {
      x: -860,
      y: -420,
      accent: ROLE.ticket,
      size: 52,
    },
  );

  const bgAura = aura(320, -10, 620, '#ffd16622', '#5ce1e618');

  // Orbiting 3D GPU pair: Warm GPU 1 (emerald 5-slot chassis) + Cold GPU 2 (blue wireframe 207s)
  const gpuView = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 16.8,
    unit: 92,
    focus: [0, 0, 0.85],
  }).at(355, -165);

  gpuView.add(
    gridPlane3d({
      x: [-3.8, 3.8],
      y: [-2.2, 2.2],
      z: 0,
      step: 1.1,
      color: '#243659',
      width: 1.2,
      opacity: 0.5,
    }),
  );

  // Warm GPU 1 base chassis
  addBox3D(gpuView, -3.2, -1.25, 0.04, 2.8, 2.5, 0.42, '#0e2a2d', ROLE.warm, {
    faceOpacity: 0.84,
    edgeWidth: 2.3,
    edgeGlow: 8,
  });

  // 5 active slot monoliths on Warm GPU 1
  const warmSlots = [];
  for (let i = 0; i < 5; i++) {
    warmSlots.push(
      ...addBox3D(
        gpuView,
        -2.95 + i * 0.48,
        -0.82,
        0.5,
        0.36,
        1.64,
        1.15,
        ROLE.active,
        ROLE.active,
        {
          faceOpacity: 0.84,
          edgeWidth: 2.0,
          edgeGlow: 7,
        },
      ),
    );
  }

  // Cold GPU 2 hollow wireframe (still booting for 207s)
  const coldChassis = hideNodes([
    ...addWireBox3D(gpuView, 0.7, -1.25, 0.04, 2.8, 2.5, 1.65, ROLE.cold, {
      width: 2.4,
      opacity: 0.85,
      glow: 8,
    }),
  ]);

  // Dynamic wave timeline & R21 status across lower canvas + left readouts
  const dyn = guardedDynamic(
    () => 1,
    () => {
      const w = waveStep.value;
      const p = pulse.value;
      const blink = 0.68 + 0.32 * Math.sin(p * 5.2);
      const nodes = [
        txt('WARM GPU 1 (5 SLOTS)', 140, -432, 26, ROLE.warm, 'mono'),
        txt(
          coldVis.value > 0.3 ? 'COLD GPU 2 (207s)' : 'NEXT GPU: BOOTING',
          590,
          -432,
          26,
          ROLE.cold,
          'mono',
        ).opacity(Math.max(0.45, coldVis.value)),
      ];

      // Left setup telemetry
      nodes.push(
        txt('YOUR TICKET:  R21', -860, -185, 32, ROLE.ticket, 'mono', 'left').glow(
          ticketVis.value > 0.3 ? 9 : 4,
          ROLE.ticket,
        ),
        txt('Start deadline:  30 s (inclusive)', -860, -125, 28, COSMOS.ink, 'sans', 'left'),
        txt('Warm capacity:   5 slots x 10 s hold', -860, -72, 28, ROLE.active, 'sans', 'left'),
      );

      if (coldVis.value > 0.25) {
        nodes.push(
          txt(
            `Cold GPU ready:  ${DATA.coldTotal} s`,
            -860,
            -18,
            28,
            ROLE.cold,
            'mono',
            'left',
          ).opacity(coldVis.value),
        );
      }

      // Prediction prompt during beat 1 hold (disappears once reveal begins)
      if (askVis.value > 0.25 && w < 2.5) {
        nodes.push(
          txt('PREDICT: Does R21 get a slot by 30 s?', -860, 72, 30, ROLE.predict, 'sans', 'left')
            .glow(8, ROLE.predict)
            .opacity(askVis.value * blink),
        );
      }

      // Reveal readouts strictly AFTER cues in beat 2
      if (w >= 2.5) {
        nodes.push(
          txt('t = 30 s:  R16..R20 take last 5 starts', -860, 56, 28, ROLE.active, 'mono', 'left'),
        );
      }
      if (w >= 3.5) {
        nodes.push(
          txt(
            'R21 next opening:  40 s -> EXPIRED (-10 s)',
            -860,
            114,
            28,
            ROLE.expired,
            'mono',
            'left',
          ).glow(8, ROLE.expired),
        );
      }

      // Lower glowing wave timeline: t = 0, 10, 20, 30 (gate), 40s
      const baseX = -760;
      const stepX = 330;
      const barY = 305;
      const ticks = [0, 10, 20, 30, 40];
      const ranges = ['R1..R5', 'R6..R10', 'R11..R15', 'R16..R20', 'R21..R25'];

      // Timeline spine
      nodes.push(
        beamWithPhotons(
          [
            [baseX - 40, barY + 75],
            [baseX + 4 * stepX + 180, barY + 75],
          ],
          ROLE.active,
          p * 0.45,
          { width: 3.0, glow: 7, photonCount: 2 },
        ),
      );

      // 30s start deadline gate line (starts strictly below the label)
      const gateX = baseX + 3 * stepX + 188;
      nodes.push(
        dashedRule(gateX, 206, gateX, 425, ROLE.deadline, 0.9, 3.0),
        txt('30s GATE', gateX, 176, 26, ROLE.deadline, 'mono').glow(7, ROLE.deadline),
      );

      for (let i = 0; i < ticks.length; i++) {
        const cx = baseX + i * stepX + 55;
        nodes.push(txt(`${ticks[i]}s`, cx, barY + 114, 26, COSMOS.muted, 'mono'));

        // Show wave blocks strictly per progression (never reveal t=30 or t=40 before beat 2!)
        const visible =
          (i === 0 && w >= 0.5) ||
          ((i === 1 || i === 2) && w >= 1.5) ||
          (i === 3 && w >= 2.5) ||
          (i === 4 && w >= 3.5);

        if (visible) {
          const isExpired = i === 4;
          const col = isExpired ? ROLE.expired : i === 3 ? ROLE.warm : ROLE.active;
          nodes.push(
            rect(235, 76, {
              fill: isExpired ? '#2c1120' : '#0f2238',
              stroke: col,
              width: 2.6,
              radius: 12,
            })
              .at(cx, barY)
              .glow(7, col),
            txt(ranges[i], cx, barY, 28, isExpired ? ROLE.expired : COSMOS.ink, 'mono'),
          );
          if (isExpired) {
            nodes.push(
              txt('MISSED', cx, barY - 66, 26, ROLE.expired, 'mono').glow(7, ROLE.expired),
            );
          }
        } else if (i >= 1 && i <= 3) {
          // Unrevealed dashed placeholder slot outline (no numbers or answers!)
          nodes.push(
            rect(235, 76, {
              fill: '#0c1324',
              stroke: '#30436b',
              width: 1.8,
              radius: 12,
              dash: [6, 6],
            }).at(cx, barY),
            txt(i === 3 ? '???' : 'refill', cx, barY, 26, COSMOS.dim, 'mono'),
          );
        }
      }

      // Glowing R21 ticket dot (zero text crossing)
      nodes.push(
        glowDot(-882, -185, { radius: 8, color: w >= 3.5 ? ROLE.expired : ROLE.ticket, glow: 14 }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, gpuView, header, dyn);
  orbitScene(s, c, gpuView, { theta: -0.22, phi: 0.92 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 6.0, { startOffset: 0.1, endMargin: 0.5 });

  // Beat 0
  tweenOn(s, c, 'find-request', ticketVis, 1, 0.3);
  tweenOn(s, c, 'first-five', waveStep, 1, 0.3);
  c.on('cold-clock', () => {
    const t = c.cue('cold-clock').start;
    s.play(coldVis.to(1, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, coldChassis, 0.35);
  });

  // Beat 1 (Prediction question: DO NOT reveal wave 3 or 4!)
  tweenOn(s, c, 'two-refills', waveStep, 2, 0.35);
  tweenOn(s, c, 'last-tick-question', askVis, 1, 0.3);

  // Beat 2 (Strict AFTER reveals)
  tweenOn(s, c, 'last-five', waveStep, 3, 0.3, { after: true });
  tweenOn(s, c, 'turn-too-late', waveStep, 4, 0.3, { after: true });
}
