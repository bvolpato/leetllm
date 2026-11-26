// Scene 04: two-loops - Trace current admission separately from future capacity
// Dual-clock parallel flow: fast sub-second Data Path vs multi-minute Control Loop,
// keeping R21's original deadline and 429 fast overload feedback distinct from +6 replica boot.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  dashedRule,
  driftValue,
  glowDot,
  guardedDynamic,
  quadArcPts,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function twoLoops(s, c) {
  const phase = s.value(0);
  const mode = s.value(0); // 1=data+control overview, 2=overload feedback & sidecar health trap

  const header = cinemaHeader(
    'TWO INCOMPATIBLE CLOCKS',
    'Current admission vs',
    'future capacity',
    {
      x: -860,
      y: -420,
      accent: ROLE.active,
      size: 52,
    },
  );

  const bgAura = aura(120, 60, 680, '#5ce1e620', '#60a5fa1a');

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const m = mode.value;
      const p = phase.value;
      const dataY = -75;
      const ctrlY = 235;
      const nodes = [];

      // Upper Track: Sub-second Data Path
      nodes.push(
        txt('DATA PATH  ·  SUB-SECOND', -860, dataY - 82, 26, ROLE.active, 'mono', 'left').glow(
          6,
          ROLE.active,
        ),
        beamWithPhotons(
          [
            [-760, dataY],
            [790, dataY],
          ],
          ROLE.active,
          p * 1.4,
          { width: 4.2, glow: 10, photonCount: 3 },
        ),
      );

      const dataNodes = [
        { x: -720, label: 'R21', sub: '30s budget', col: ROLE.ticket },
        { x: -350, label: 'Gateway', sub: 'auth + cap', col: ROLE.active },
        { x: 20, label: 'Queue', sub: 'bounded', col: ROLE.warmup },
        { x: 390, label: 'Scheduler', sub: 'batching', col: ROLE.active },
        { x: 740, label: 'Warm GPU', sub: 'stream out', col: ROLE.warm },
      ];
      for (const dn of dataNodes) {
        nodes.push(
          glowDot(dn.x, dataY, { radius: 13, color: dn.col, glow: 14 }),
          txt(dn.label, dn.x, dataY - 38, 28, COSMOS.ink, 'mono'),
          txt(dn.sub, dn.x, dataY + 42, 26, dn.col, 'mono'),
        );
      }

      // Dashed clock separation
      nodes.push(dashedRule(-860, 82, 860, 82, '#2d3f68', 0.7, 2.0));

      // Lower Track: Multi-minute Control Loop
      nodes.push(
        txt(
          'CONTROL LOOP  ·  MULTI-MINUTE',
          -440,
          ctrlY - 88,
          26,
          ROLE.control,
          'mono',
          'left',
        ).glow(6, ROLE.control),
        beamWithPhotons(
          [
            [-760, ctrlY],
            [790, ctrlY],
          ],
          ROLE.control,
          p * 0.35,
          { width: 3.6, glow: 9, photonCount: 2 },
        ),
      );

      const ctrlNodes = [
        { x: -720, label: 'Demand', sub: 'queue + KV', col: ROLE.focus },
        { x: -350, label: 'Autoscaler', sub: '+6 replicas', col: ROLE.control },
        { x: 20, label: 'Node Pool', sub: 'GPU hardware', col: ROLE.control },
        { x: 390, label: 'Load + Warm', sub: '207 s boot', col: ROLE.warmup },
        { x: 740, label: 'Engine Ready', sub: 'joins traffic', col: ROLE.warm },
      ];
      for (const cn of ctrlNodes) {
        nodes.push(
          glowDot(cn.x, ctrlY, { radius: 12, color: cn.col, glow: 12 }),
          txt(cn.label, cn.x, ctrlY - 38, 28, COSMOS.ink, 'mono'),
          txt(cn.sub, cn.x, ctrlY + 42, 26, cn.col, 'mono'),
        );
      }

      // Beat 1: Overload signal feedback beam strictly between rows, clear of all text
      if (m >= 1.4) {
        const bA = Math.min(1, (m - 1.4) * 2.5);
        const fbPts = [
          [-720, dataY + 72],
          [-720, ctrlY - 72],
        ];
        nodes.push(
          beamWithPhotons(fbPts, ROLE.reject, p * 1.1, {
            width: 3.6,
            glow: 10,
            photonCount: 2,
            alpha: bA,
          }),
          txt('429 overload signal', -680, 42, 26, ROLE.reject, 'mono', 'left')
            .glow(6, ROLE.reject)
            .opacity(bA),
          txt(
            'Retry keeps original deadline  ·  Check engine itself, not sidecar',
            0,
            392,
            28,
            ROLE.focus,
            'sans',
          )
            .glow(6, ROLE.focus)
            .opacity(bA),
        );
      } else {
        nodes.push(
          rect(420, 56, { fill: '#0e1b30', stroke: ROLE.warm, width: 2.0, radius: 12 }).at(
            560,
            -330,
          ),
          txt('Loaded + Warm + Healthy', 560, -330, 26, ROLE.warm, 'mono'),
          txt(
            'Future capacity cannot extend R21s active deadline',
            0,
            392,
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

  tweenOn(s, c, 'ga-two-loops-b0', mode, 1, 0.35);
  tweenOn(s, c, 'ga-two-loops-b1', mode, 2, 0.35);
}
