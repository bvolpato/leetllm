// Scene 26: startup-mitigation - Keep each startup mitigation on its measured critical path
// Luminous 4-phase critical-path Gantt (95 + 22 + 78 + 12 = 207s) paired with target mitigations,
// plus counterexample beam showing lazy image streaming shifting fetch delay onto the first request.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  DATA,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  driftValue,
  guardedDynamic,
  phases,
  quadArcPts,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function startupMitigation(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1=4 phases + mitigations, 2=207s total, 3=counterexample lazy pull -> 1st req + shared cache contention

  const header = cinemaHeader(
    'COLD START MITIGATIONS',
    'Every optimization stays',
    'on the critical path',
    {
      x: -860,
      y: -420,
      accent: ROLE.active,
      size: 52,
    },
  );

  const bgAura = aura(150, 40, 660, '#5ce1e61c', '#ff6b8b1a');

  const stageMeta = [
    { name: 'Node', dur: phases[0][1], fix: 'Warm pools / reserved capacity', col: ROLE.cold },
    { name: 'Image', dur: phases[1][1], fix: 'Lazy pull / container streaming', col: ROLE.decode },
    { name: 'Weights', dur: phases[2][1], fix: 'Local NVMe / shared cache', col: ROLE.active },
    { name: 'Warmup', dur: phases[3][1], fix: 'Real engine readiness warmup', col: ROLE.warm },
  ];

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const p = phase.value;
      const xLeft = -520;
      const scale = 4.6; // 207 * 4.6 = 952 px
      let acc = 0;
      const nodes = [];

      if (st >= 1.5) {
        nodes.push(
          txt(
            `TOTAL SERIAL PATH: ${DATA.coldTotal} s`,
            860,
            -355,
            30,
            ROLE.warm,
            'mono',
            'right',
          ).glow(7, ROLE.warm),
        );
      }

      stageMeta.forEach((sg, i) => {
        const y = -165 + i * 112;
        const x1 = xLeft + acc * scale;
        const w = sg.dur * scale;
        acc += sg.dur;

        nodes.push(
          txt(`${sg.name} (${sg.dur}s)`, -860, y, 28, sg.col, 'mono', 'left'),
          rect(Math.max(44, w), 54, { fill: '#111d36', stroke: sg.col, width: 2.6, radius: 10 })
            .at(x1 + w * 0.5, y)
            .glow(7, sg.col),
          txt(sg.fix, 480, y, 26, COSMOS.ink, 'sans', 'left'),
        );
      });

      // Beat 1: Counterexample beam moving unfetched image bytes onto first request (ends at top edge of box)
      if (st >= 2.5) {
        const imgX = xLeft + (95 + 11) * scale;
        const arcPts = quadArcPts([imgX, -22], [120, 252], 65, 24);
        nodes.push(
          beamWithPhotons(arcPts, ROLE.expired, p * 0.9, { width: 4.0, glow: 11, photonCount: 2 }),
          rect(620, 68, { fill: '#2a1220', stroke: ROLE.expired, width: 2.6, radius: 14 })
            .at(120, 295)
            .glow(8, ROLE.expired),
          txt('Unfetched image bytes -> 1st Request', 120, 295, 26, ROLE.expired, 'mono'),
          txt(
            'Shared weight caches bottleneck on concurrent fleet loads  ·  Measure end-to-end readiness',
            0,
            405,
            26,
            ROLE.focus,
            'sans',
          ).glow(5, ROLE.focus),
        );
      } else {
        nodes.push(
          txt(
            'Each mitigation targets a specific stage on the measured startup chain',
            0,
            395,
            28,
            COSMOS.muted,
            'sans',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);
  driftValue(s, c, phase, 5.5, { startOffset: 0.1, endMargin: 0.5 });

  tweenOn(s, c, 'ga-startup-mitigation-b0', step, 1, 0.35);
  tweenOn(s, c, 'ga-startup-total', step, 2, 0.3);
  tweenOn(s, c, 'ga-startup-mitigation-b1', step, 3, 0.35);
}
