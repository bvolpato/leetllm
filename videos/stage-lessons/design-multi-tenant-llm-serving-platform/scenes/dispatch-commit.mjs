// Scene 11: dispatch-commit - Keep a database rollback from becoming free GPU work
// Beat 0: Commit reservation + durable dispatch outbox BEFORE external worker delivery.
// Beat 1: Unsafe branch launching GPU kernels inside a DB transaction that rolls back.
// Beat 2: Definite pre-execution placement failure (release hold) vs missing ACK (preserve & reconcile).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  driftValue,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function dispatchCommit(s, c) {
  const pulse = s.value(0);
  const b0On = s.value(0);
  const commitOn = s.value(0);
  const intentOn = s.value(0);
  const b1On = s.value(0);
  const unsafeGpuOn = s.value(0);
  const rollbackOn = s.value(0);
  const freeWorkOn = s.value(0);
  const b2On = s.value(0);
  const defFailOn = s.value(0);
  const uncertainOn = s.value(0);

  const stageAura = aura(0, 10, 760, '#60a5fa1a', '#ff6b8b16');
  const header = cinemaHeader(
    'TRANSACTIONAL DISPATCH BOUNDARY',
    'Keep a database rollback from',
    'becoming free GPU work',
    { x: -860, y: -450, accent: ROLE.A, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const committed = commitOn.value > 0.5;
      const intent = intentOn.value > 0.5;
      const b1 = b1On.value > 0.5;
      const unsafeGpu = unsafeGpuOn.value > 0.5;
      const rolled = rollbackOn.value > 0.5;
      const freeWork = freeWorkOn.value > 0.5;
      const b2 = b2On.value > 0.5;
      const defFail = defFailOn.value > 0.5;
      const uncert = uncertainOn.value > 0.5;

      const nodes = [];

      // Mode banner top right
      const modeCol = b2 ? ROLE.focus : b1 ? ROLE.fail : ROLE.ok;
      const modeLabel = b2
        ? 'DELIVERY OUTCOMES:  DEFINITE FAILURE  vs  MISSING ACK'
        : b1
          ? 'UNSAFE BRANCH:  GPU DISPATCH INSIDE DB TRANSACTION'
          : 'SAFE PATTERN:  COMMIT INTENT FIRST, DELIVER SECOND';
      nodes.push(
        rect(910, 78, { fill: '#0b1426', stroke: modeCol, width: 2.8, radius: 14 })
          .at(385, -395)
          .glow(7, modeCol),
        txt(modeLabel, 385, -395, 26, modeCol, 'mono', 'center'),
      );

      // Two persistent architectural domains: Left = Database Authority, Right = External Worker / GPU
      nodes.push(
        rect(730, 510, { fill: '#0a1224', stroke: ROLE.A, width: 2.8, radius: 18 }).at(-475, 45),
        txt('DATABASE AUTHORITY', -475, -172, 28, ROLE.A, 'mono', 'center'),

        rect(730, 510, { fill: '#0a1626', stroke: ROLE.worker, width: 2.8, radius: 18 }).at(
          475,
          45,
        ),
        txt('EXTERNAL WORKER / GPU', 475, -172, 28, ROLE.worker, 'mono', 'center'),
      );

      if (!b1 && !b2) {
        // Beat 0: Commit first, then deliver via durable intent
        nodes.push(
          rect(610, 126, {
            fill: committed ? '#0b211b' : '#1b170b',
            stroke: committed ? ROLE.ok : ROLE.held,
            width: 2.8,
            radius: 14,
          })
            .at(-475, -45)
            .glow(committed ? 9 : 4, committed ? ROLE.ok : ROLE.held),
          txt(
            committed ? '1. RESERVATION COMMITTED' : '1. TRANSACTION PENDING',
            -475,
            -70,
            28,
            committed ? ROLE.ok : ROLE.held,
            'mono',
            'center',
          ),
          txt('Allowance + idempotency atomic', -475, -20, 26, COSMOS.muted, 'sans', 'center'),

          rect(610, 126, {
            fill: intent ? '#0b211b' : '#0d1528',
            stroke: intent ? ROLE.ok : '#31426b',
            width: 2.8,
            radius: 14,
          })
            .at(-475, 145)
            .glow(intent ? 8 : 0, ROLE.ok),
          txt(
            intent ? '2. DURABLE DISPATCH OUTBOX' : '2. NO EXTERNAL PUBLISH YET',
            -475,
            120,
            28,
            intent ? ROLE.ok : COSMOS.muted,
            'mono',
            'center',
          ),
          txt('Survives crash & retries cleanly', -475, 170, 26, COSMOS.muted, 'sans', 'center'),
        );

        if (intent) {
          nodes.push(
            beamWithPhotons(
              [
                [-108, 145],
                [108, 145],
              ],
              ROLE.ok,
              p,
              { width: 4.5, glow: 10, photonCount: 2 },
            ),
            rect(610, 150, { fill: '#0b221c', stroke: ROLE.ok, width: 3.0, radius: 14 })
              .at(475, 145)
              .glow(9, ROLE.ok),
            txt('3. WORKER ACCEPTS JOB', 475, 118, 28, ROLE.ok, 'mono', 'center'),
            txt('Committed intent backs execution', 475, 170, 26, COSMOS.ink, 'sans', 'center'),
          );
        } else {
          nodes.push(
            rect(610, 150, { fill: '#0c1424', stroke: '#31426b', width: 2.2, radius: 14 }).at(
              475,
              145,
            ),
            txt('WORKER IDLE', 475, 118, 28, COSMOS.muted, 'mono', 'center'),
            txt('Waits for committed outbox record', 475, 170, 26, COSMOS.dim, 'sans', 'center'),
          );
        }
      } else if (b1 && !b2) {
        // Beat 1: Unsafe launch inside transaction -> DB rollback cannot unrun GPU kernels!
        nodes.push(
          rect(610, 148, {
            fill: rolled ? '#280f1a' : '#1b170b',
            stroke: rolled ? ROLE.fail : ROLE.held,
            width: 3.0,
            radius: 14,
          })
            .at(-475, 25)
            .glow(rolled ? 10 : 5, rolled ? ROLE.fail : ROLE.held),
          txt(
            rolled ? 'TX ROLLBACK: RECORD ERASED' : 'UNCOMMITTED TX OPEN',
            -475,
            -4,
            28,
            rolled ? ROLE.fail : ROLE.held,
            'mono',
            'center',
          ),
          txt(
            rolled ? 'Allowance hold vanished from DB' : 'Calls external GPU before commit',
            -475,
            52,
            26,
            COSMOS.ink,
            'sans',
            'center',
          ),
        );

        if (unsafeGpu || rolled) {
          nodes.push(
            beamWithPhotons(
              [
                [-108, 25],
                [108, 25],
              ],
              ROLE.fail,
              p,
              { width: 4.5, glow: 10, photonCount: 2 },
            ),
            rect(610, 148, { fill: '#280f1a', stroke: ROLE.fail, width: 3.2, radius: 14 })
              .at(475, 25)
              .glow(12, ROLE.fail),
            txt('GPU KERNELS ALREADY RUNNING', 475, -4, 28, ROLE.fail, 'mono', 'center'),
            txt('DB rollback cannot unrun kernels', 475, 52, 26, COSMOS.ink, 'sans', 'center'),
          );
        }

        if (freeWork) {
          nodes.push(
            rect(1440, 86, { fill: '#2a101c', stroke: ROLE.fail, width: 3.0, radius: 14 })
              .at(0, 385)
              .glow(10, ROLE.fail),
            txt(
              'UNACCOUNTED EXECUTION:  GPU burned compute without committed allowance',
              0,
              385,
              30,
              ROLE.fail,
              'mono',
              'center',
            ),
          );
        }
      } else {
        // Beat 2: Definite failure before start vs Missing ACK (uncertain ownership)
        nodes.push(
          rect(610, 140, {
            fill: '#0b1e1b',
            stroke: defFail ? ROLE.ok : ROLE.held,
            width: 2.8,
            radius: 14,
          })
            .at(-475, -30)
            .glow(defFail ? 9 : 4, defFail ? ROLE.ok : ROLE.held),
          txt(
            'DEFINITE PRE-START FAILURE',
            -475,
            -58,
            27,
            defFail ? ROLE.ok : ROLE.held,
            'mono',
            'center',
          ),
          txt('Worker rejected before execution', -475, -6, 26, COSMOS.ink, 'sans', 'center'),

          rect(610, 118, {
            fill: '#0c221d',
            stroke: defFail ? ROLE.ok : '#2c3d66',
            width: 2.6,
            radius: 14,
          })
            .at(-475, 165)
            .glow(defFail ? 8 : 0, ROLE.ok),
          txt(
            defFail ? 'SAFE TO RELEASE STAGED HOLD' : 'Evaluating failure proof...',
            -475,
            165,
            27,
            defFail ? ROLE.ok : COSMOS.dim,
            'mono',
            'center',
          ),

          rect(610, 140, { fill: '#22130c', stroke: ROLE.warn, width: 2.8, radius: 14 })
            .at(475, -30)
            .glow(8, ROLE.warn),
          txt('TRANSPORT TIMEOUT / NO ACK', 475, -58, 27, ROLE.warn, 'mono', 'center'),
          txt('Worker might have started kernels', 475, -6, 26, COSMOS.ink, 'sans', 'center'),

          rect(610, 118, {
            fill: '#260f1a',
            stroke: uncert ? ROLE.fail : '#2c3d66',
            width: 2.8,
            radius: 14,
          })
            .at(475, 165)
            .glow(uncert ? 9 : 0, ROLE.fail),
          txt(
            uncert ? 'KEEP HOLD · RECONCILE ATTEMPT' : 'Timeout != zero usage...',
            475,
            165,
            27,
            uncert ? ROLE.fail : COSMOS.dim,
            'mono',
            'center',
          ),
        );
      }

      if (!b1 || !freeWork) {
        nodes.push(
          txt(
            'Committed intent, worker acceptance, and device retirement are separate boundaries.',
            0,
            422,
            28,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.5);

  stepOn(s, c, 'mt-dispatch-commit-b0', b0On, 1);
  stepAfter(s, c, 'mt-dispatch-commit-s0-2', commitOn, 1);
  stepOn(s, c, 'mt-dispatch-commit-s0-3', intentOn, 1);
  stepOn(s, c, 'mt-dispatch-commit-b1', b1On, 1);
  stepAfter(s, c, 'mt-dispatch-commit-s1-0', unsafeGpuOn, 1);
  stepAfter(s, c, 'mt-dispatch-commit-s1-1', rollbackOn, 1);
  stepAfter(s, c, 'mt-dispatch-commit-s1-2', freeWorkOn, 1);
  stepOn(s, c, 'mt-dispatch-commit-b2', b2On, 1);
  stepAfter(s, c, 'mt-dispatch-commit-s2-1', defFailOn, 1);
  stepAfter(s, c, 'mt-dispatch-commit-s2-2', uncertainOn, 1);
}
