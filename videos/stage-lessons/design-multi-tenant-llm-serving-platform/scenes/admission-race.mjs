// Scene 09: admission-race - Make two gateways compete for one allowance
// Contrasts two gateways reading stale 1,000 (overpromising 1,400 = +400 excess) against
// an explicit rewind to 1,000 with atomic check-and-update (first holds 700 -> 300 left, second denied).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  buildLedgerNodes,
  cinemaHeader,
  guardedDynamic,
  quadArcPts,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function admissionRace(s, c) {
  const b0On = s.value(0);
  const staleReadOn = s.value(0);
  const excessOn = s.value(0);
  const b1On = s.value(0);
  const restartOn = s.value(0);
  const firstWinOn = s.value(0);
  const secondLoseOn = s.value(0);
  const b2On = s.value(0);

  const stageAura = aura(0, 20, 760, '#ff6b8b1a', '#5ce1e61a');
  const header = cinemaHeader(
    'CONCURRENT ADMISSION RACE',
    'Make two gateways compete',
    'for one allowance',
    { x: -860, y: -450, accent: ROLE.focus, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const stale = staleReadOn.value > 0.5;
      const excess = excessOn.value > 0.5;
      const atomic = b1On.value > 0.5 || restartOn.value > 0.5;
      const first = firstWinOn.value > 0.5;
      const second = secondLoseOn.value > 0.5;
      const b2 = b2On.value > 0.5;

      const nodes = [];

      // Mode badge on top right
      const modeCol = atomic ? ROLE.ok : ROLE.fail;
      const modeText = atomic
        ? 'EXPLICIT RESTART:  ATOMIC CHECK-AND-UPDATE'
        : 'REJECTED DESIGN:  UNSYNCHRONIZED STALE READS';
      nodes.push(
        rect(900, 80, {
          fill: atomic ? '#0b1e1c' : '#240f19',
          stroke: modeCol,
          width: 2.8,
          radius: 14,
        })
          .at(395, -395)
          .glow(8, modeCol),
        txt(modeText, 395, -395, 26, modeCol, 'mono', 'center'),
      );

      // Two competing gateways G1/r1 (left) and G2/r2 (right)
      const g1Col = ROLE.A;
      const g2Col = ROLE.B;
      nodes.push(
        rect(520, 140, { fill: '#0b1326', stroke: g1Col, width: 2.8, radius: 16 })
          .at(-560, -165)
          .glow(first ? 10 : 5, g1Col),
        txt('GATEWAY G1  ·  r1', -560, -196, 26, g1Col, 'mono', 'center'),
        txt('Requests 700 units', -560, -142, 34, COSMOS.ink, 'mono', 'center'),

        rect(520, 140, { fill: '#1a0f1d', stroke: g2Col, width: 2.8, radius: 16 })
          .at(560, -165)
          .glow(second ? 10 : 5, g2Col),
        txt('GATEWAY G2  ·  r2', 560, -196, 26, g2Col, 'mono', 'center'),
        txt('Requests 700 units', 560, -142, 34, COSMOS.ink, 'mono', 'center'),
      );

      if (!atomic) {
        // Beat 0: Both read 1,000 before either writes
        nodes.push(
          beamWithPhotons(quadArcPts([-300, -165], [-165, 35], -22), g1Col, 0, {
            width: 4,
            glow: 8,
          }),
          beamWithPhotons(quadArcPts([300, -165], [165, 35], 22), g2Col, 0, {
            width: 4,
            glow: 8,
          }),
          rect(620, 148, { fill: '#19160c', stroke: ROLE.held, width: 3.0, radius: 16 })
            .at(0, 75)
            .glow(8, ROLE.held),
          txt('SHARED ALLOWANCE READ', 0, 40, 26, ROLE.held, 'mono', 'center'),
          txt(
            stale ? 'Both observe: 1,000' : 'Initial available: 1,000',
            0,
            96,
            38,
            COSMOS.ink,
            'mono',
            'center',
          ),
        );

        if (excess) {
          nodes.push(
            rect(1340, 114, { fill: '#26101a', stroke: ROLE.fail, width: 3.2, radius: 16 })
              .at(0, 285)
              .glow(10, ROLE.fail),
            txt(
              '700 + 700 = 1,400 PROMISED  ·  EXCEEDS ALLOWANCE BY 400 UNITS',
              0,
              285,
              31,
              ROLE.fail,
              'mono',
              'center',
            ),
          );
        } else {
          nodes.push(
            txt(
              'Each gateway checks available >= 700 independently before either commits.',
              0,
              285,
              29,
              COSMOS.muted,
              'sans',
              'center',
            ),
          );
        }
      } else {
        // Beat 1 & Beat 2: Serialized atomic check-and-update ledger
        const held = first ? 700 : 0;
        const available = 1000 - held;

        // Winner / Loser status pills directly under G1 and G2
        if (first) {
          nodes.push(
            rect(520, 62, { fill: '#0c241d', stroke: ROLE.ok, width: 2.6, radius: 12 })
              .at(-560, -45)
              .glow(8, ROLE.ok),
            txt('ADMITTED: holds 700 -> 300 left', -560, -45, 26, ROLE.ok, 'mono', 'center'),
          );
        }
        if (second) {
          nodes.push(
            rect(520, 62, { fill: '#28101b', stroke: ROLE.fail, width: 2.6, radius: 12 })
              .at(560, -45)
              .glow(8, ROLE.fail),
            txt('DENIED: observes 300 < 700', 560, -45, 26, ROLE.fail, 'mono', 'center'),
          );
        }

        nodes.push(
          ...buildLedgerNodes({
            available,
            held,
            settled: 0,
            total: 1000,
            xLeft: -820,
            yBar: 175,
            width: 1640,
            height: 70,
            showEquation: true,
            equationY: 288,
          }),
        );
      }

      nodes.push(
        txt(
          b2
            ? 'A local process lock protects one host; multi-host fleets require durable conditional transactions.'
            : atomic
              ? 'Safety property: exactly one admission wins regardless of contender ordering.'
              : 'Two separate successful reads never prove a safe combined admission decision.',
          0,
          420,
          28,
          b2 ? ROLE.focus : COSMOS.muted,
          'sans',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  stepOn(s, c, 'mt-admission-race-b0', b0On, 1);
  stepAfter(s, c, 'mt-admission-race-s0-2', staleReadOn, 1);
  stepAfter(s, c, 'mt-admission-race-s0-3', excessOn, 1);
  stepOn(s, c, 'mt-admission-race-b1', b1On, 1);
  stepAfter(s, c, 'mt-admission-race-s1-0', restartOn, 1);
  stepAfter(s, c, 'mt-admission-race-s1-1', firstWinOn, 1);
  stepAfter(s, c, 'mt-admission-race-s1-2', secondLoseOn, 1);
  stepOn(s, c, 'mt-admission-race-b2', b2On, 1);
}
