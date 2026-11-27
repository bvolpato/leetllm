// Scene 10: idempotency-binding - Replay the same operation without changing its meaning
// Beat 0: Key r1 + fingerprint F1 replay returns existing record; F2 triggers CONFLICT.
// Beat 1: Completion msg-7 / msg-8 settle one logical attempt; conflicting output rejected.
// Beat 2: New 1,200-unit example: 200 in + 500 cap -> hold 700 (500 left) -> actual 150 out
//         -> settle 350, return 350, 850 available -> replay leaves 850 unchanged.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  buildLedgerNodes,
  cinemaHeader,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function idempotencyBinding(s, c) {
  const b0On = s.value(0);
  const sameAcceptOn = s.value(0);
  const conflictOn = s.value(0);
  const b1On = s.value(0);
  const dupMsgOn = s.value(0);
  const replayOkOn = s.value(0);
  const compConflictOn = s.value(0);
  const b2On = s.value(0);
  const exSetupOn = s.value(0);
  const exHoldOn = s.value(0);
  const exActualOn = s.value(0);
  const exSettleOn = s.value(0);
  const exReplayOn = s.value(0);

  const stageAura = aura(0, 20, 760, '#5ce1e61a', '#6ee7b716');
  const header = cinemaHeader(
    'IDEMPOTENCY & REPLAY SAFETY',
    'Replay the same operation',
    'without changing its meaning',
    { x: -860, y: -450, accent: ROLE.shared, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const sameOk = sameAcceptOn.value > 0.5;
      const conf = conflictOn.value > 0.5;
      const b1 = b1On.value > 0.5;
      const dupMsg = dupMsgOn.value > 0.5;
      const repOk = replayOkOn.value > 0.5;
      const compConf = compConflictOn.value > 0.5;
      const b2 = b2On.value > 0.5;
      const exHold = exHoldOn.value > 0.5;
      const exAct = exActualOn.value > 0.5;
      const exSet = exSettleOn.value > 0.5;
      const exRep = exReplayOn.value > 0.5;

      const nodes = [];

      if (!b1 && !b2) {
        // Beat 0: Request idempotency key + fingerprint binding
        nodes.push(
          rect(720, 148, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 16 })
            .at(-470, -145)
            .glow(6, ROLE.A),
          txt('IDEMPOTENCY KEY  ·  TENANT A', -790, -182, 26, ROLE.A, 'mono', 'left'),
          txt('key: r1   +   fingerprint: F1', -790, -124, 34, COSMOS.ink, 'mono', 'left'),

          rect(720, 148, { fill: '#0b1926', stroke: ROLE.shared, width: 2.8, radius: 16 })
            .at(470, -145)
            .glow(6, ROLE.shared),
          txt('STORED RESERVATION RECORD', 150, -182, 26, ROLE.shared, 'mono', 'left'),
          txt('r1 / F1   (immutable binding)', 150, -124, 34, COSMOS.ink, 'mono', 'left'),

          beamWithPhotons(
            [
              [-108, -145],
              [108, -145],
            ],
            ROLE.shared,
            0,
            { width: 4, glow: 8 },
          ),

          // Row 1: Same key + F1 -> replay safe
          rect(1660, 118, {
            fill: sameOk ? '#0b201b' : '#0b1224',
            stroke: sameOk ? ROLE.ok : '#2c3d66',
            width: 2.8,
            radius: 16,
          })
            .at(0, 72)
            .glow(sameOk ? 8 : 0, ROLE.ok),
          txt('RETRY:  key r1 + same F1', -790, 72, 30, ROLE.A, 'mono', 'left'),
          txt(
            sameOk ? 'RETURN EXISTING RESERVATION  (no double hold)' : 'Checking fingerprint...',
            790,
            72,
            28,
            sameOk ? ROLE.ok : COSMOS.dim,
            'mono',
            'right',
          ),

          // Row 2: Same key + F2 -> CONFLICT gate
          rect(1660, 118, {
            fill: conf ? '#240f19' : '#0b1224',
            stroke: conf ? ROLE.fail : '#2c3d66',
            width: 2.8,
            radius: 16,
          })
            .at(0, 240)
            .glow(conf ? 9 : 0, ROLE.fail),
          txt('RETRY:  key r1 + DIFFERENT F2', -790, 240, 30, ROLE.fail, 'mono', 'left'),
          line([-80, 192], [-80, 288], { stroke: conf ? ROLE.fail : '#2c3d66', width: 7 }),
          txt(
            conf ? 'CONFLICT  ·  no dispatch, balance untouched' : 'Verifying payload hash...',
            790,
            240,
            28,
            conf ? ROLE.fail : COSMOS.dim,
            'mono',
            'right',
          ),
        );
      } else if (b1 && !b2) {
        // Beat 1: Completion delivery replay (msg-7 vs msg-8 -> one logical attempt)
        nodes.push(
          rect(520, 126, { fill: '#0b1728', stroke: ROLE.shared, width: 2.8, radius: 16 })
            .at(-550, -145)
            .glow(6, ROLE.shared),
          txt('TRANSPORT DELIVERY 1', -550, -176, 26, ROLE.shared, 'mono', 'center'),
          txt('msg-7  ->  A / r1 / attempt-1', -550, -124, 28, COSMOS.ink, 'mono', 'center'),

          rect(520, 126, { fill: '#0b1728', stroke: ROLE.shared, width: 2.8, radius: 16 })
            .at(550, -145)
            .glow(6, ROLE.shared),
          txt('TRANSPORT DELIVERY 2', 550, -176, 26, ROLE.shared, 'mono', 'center'),
          txt('msg-8  ->  A / r1 / attempt-1', 550, -124, 28, COSMOS.ink, 'mono', 'center'),

          beamWithPhotons(
            [
              [-550, -80],
              [-140, 48],
            ],
            ROLE.shared,
            0,
            { width: 3.6, glow: 8 },
          ),
          beamWithPhotons(
            [
              [550, -80],
              [140, 48],
            ],
            ROLE.shared,
            0,
            { width: 3.6, glow: 8 },
          ),

          rect(980, 118, {
            fill: '#0c211c',
            stroke: dupMsg ? ROLE.ok : ROLE.shared,
            width: 3.0,
            radius: 16,
          })
            .at(0, 96)
            .glow(dupMsg ? 9 : 4, ROLE.ok),
          txt('ONE LOGICAL USAGE SETTLEMENT', 0, 68, 28, ROLE.ok, 'mono', 'center'),
          txt(
            dupMsg ? 'Keyed by (tenant, reservation, attempt)' : 'Joining transport messages...',
            0,
            118,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ),

          // Identical vs conflicting completion comparison
          rect(790, 116, {
            fill: '#0b1d1a',
            stroke: repOk ? ROLE.ok : '#2c3d66',
            width: 2.6,
            radius: 14,
          })
            .at(-435, 290)
            .glow(repOk ? 8 : 0, ROLE.ok),
          txt(
            'IDENTICAL COMPLETION',
            -435,
            264,
            26,
            repOk ? ROLE.ok : COSMOS.muted,
            'mono',
            'center',
          ),
          txt(
            repOk ? 'Harmless replay (no new charge)' : '...',
            -435,
            312,
            26,
            COSMOS.ink,
            'sans',
            'center',
          ),

          rect(790, 116, {
            fill: '#240f19',
            stroke: compConf ? ROLE.fail : '#2c3d66',
            width: 2.6,
            radius: 14,
          })
            .at(435, 290)
            .glow(compConf ? 9 : 0, ROLE.fail),
          txt(
            'CONFLICTING OUTPUT COUNT',
            435,
            264,
            26,
            compConf ? ROLE.fail : COSMOS.muted,
            'mono',
            'center',
          ),
          txt(
            compConf ? 'Rejected · keep first trusted receipt' : '...',
            435,
            312,
            26,
            COSMOS.ink,
            'sans',
            'center',
          ),
        );
      } else {
        // Beat 2: New 1,200-unit worked conservation example
        const settled = exSet ? 350 : 0;
        const held = exSet ? 0 : exHold ? 700 : 0;
        const available = 1200 - held - settled;

        nodes.push(
          rect(910, 96, { fill: '#0b1628', stroke: ROLE.focus, width: 2.8, radius: 14 })
            .at(385, -388)
            .glow(7, ROLE.focus),
          txt(
            exSetupOn.value > 0.5
              ? 'NEW EXAMPLE:  1,200 allowance  ·  200 in + 500 cap'
              : 'NEW ALLOWANCE EXAMPLE:  1,200 units',
            385,
            -406,
            26,
            ROLE.focus,
            'mono',
            'center',
          ),
          txt(
            exRep
              ? 'REPLAYED  ·  850 AVAILABLE UNCHANGED'
              : exSet
                ? 'SETTLED 350 (200 + 150)  ·  RETURNED 350 UNUSED'
                : exAct
                  ? 'TRUSTED COMPLETION REPORTS: 150 OUTPUT TOKENS'
                  : exHold
                    ? 'ADMISSION HOLDS 700  ·  LEAVES 500 AVAILABLE'
                    : 'Preparing reservation...',
            385,
            -364,
            26,
            exRep ? ROLE.focus : exSet ? ROLE.ok : COSMOS.ink,
            'mono',
            'center',
          ),

          ...buildLedgerNodes({
            available,
            held,
            settled,
            total: 1200,
            xLeft: -820,
            yBar: 95,
            width: 1640,
            height: 76,
            showEquation: true,
            equationY: 220,
          }),
        );
      }

      nodes.push(
        txt(
          'Request fingerprint and attempt identity survive changing transport message IDs.',
          0,
          422,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  stepOn(s, c, 'mt-idempotency-binding-b0', b0On, 1);
  stepAfter(s, c, 'mt-idempotency-binding-s0-2', sameAcceptOn, 1);
  stepOn(s, c, 'mt-idempotency-binding-s0-3', conflictOn, 1);
  stepOn(s, c, 'mt-idempotency-binding-b1', b1On, 1);
  stepAfter(s, c, 'mt-idempotency-binding-s1-2', dupMsgOn, 1);
  stepAfter(s, c, 'mt-idempotency-binding-s1-3', replayOkOn, 1);
  stepOn(s, c, 'mt-idempotency-binding-s1-4', compConflictOn, 1);
  stepOn(s, c, 'mt-idempotency-binding-b2', b2On, 1);
  stepAfter(s, c, 'mt-idempotency-binding-s2-0', exSetupOn, 1);
  stepAfter(s, c, 'mt-idempotency-binding-s2-1', exHoldOn, 1);
  stepAfter(s, c, 'mt-idempotency-binding-s2-2', exActualOn, 1);
  stepAfter(s, c, 'mt-idempotency-binding-s2-3', exSettleOn, 1);
  stepOn(s, c, 'mt-idempotency-binding-s2-4', exReplayOn, 1);
}
