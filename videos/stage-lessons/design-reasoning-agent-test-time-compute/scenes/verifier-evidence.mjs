import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dotItem,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildVerifierEvidence(s, c) {
  s.add(aura(-460, -40, 560, ROLE.model, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader(
      'STEP SUPERVISION VS ROLLOUTS',
      'Human step labels and',
      'rollout success differ',
      {
        x: -860,
        y: -445,
        accent: ROLE.model,
        size: 46,
      },
    ),
  );

  const rollOn = s.value(0);
  const costOn = s.value(0);

  c.on('ra-verifier-evidence-1-2', () =>
    s.play(rollOn.to(1, { duration: clampDur(c, c.cue('ra-verifier-evidence-1-2').start, 0.5) })),
  );
  c.on('ra-verifier-evidence-2-1', () =>
    s.play(costOn.to(1, { duration: clampDur(c, c.cue('ra-verifier-evidence-2-1').start, 0.5) })),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const rl = rollOn.value;
        const cs = costOn.value;
        const nodes = [];

        // Left: Human Step Supervision (PRM)
        nodes.push(
          txt('PROCESS REWARD MODEL (PRM)', -840, -210, 28, ROLE.model, 'mono', 'left'),
          dotItem(-825, -130, 'LIGHTMAN ET AL: ~800,000 HUMAN STEP LABELS', ROLE.focus),
          dotItem(-825, -64, 'LABELS: POSITIVE (+), NEGATIVE (-), NEUTRAL (0)', ROLE.agent),
          dotItem(-825, 2, '2-CLASS SIGMOID: CHECK CALIBRATION FIRST!', ROLE.warn),
          dotItem(-825, 68, 'MEASURE VALID PRUNED VS INVALID KEPT', ROLE.ok),
        );

        nodes.push(line([20, -225], [20, 125], { stroke: '#233152', width: 2 }));

        // Right: Monte Carlo Rollout Completion Rate
        const rAlpha = 0.35 + 0.65 * rl;
        nodes.push(
          txt('ROLLOUT COMPLETION RATE', 70, -210, 28, ROLE.tool, 'mono', 'left').opacity(rAlpha),
          dotItem(85, -130, 'FINISH SAME PARTIAL PATH MULTIPLE TIMES', ROLE.tool, {
            opacity: rAlpha,
          }),
          dotItem(85, -64, 'FRACTION PASSING = DOWNSTREAM SUCCESS', ROLE.agent, {
            opacity: rAlpha,
          }),
          dotItem(85, 2, 'LATER CORRECTION CAN RESCUE A BAD STEP', ROLE.fail, { opacity: rAlpha }),
          dotItem(85, 68, 'ENDING PASS != INTERMEDIATE STEP VALID', ROLE.warn, { opacity: rAlpha }),
        );

        // Bottom: Early check vs Post-hoc check cost
        nodes.push(line([-860, 178], [840, 178], { stroke: '#233152', width: 2 }));
        const cAlpha = 0.3 + 0.7 * cs;
        nodes.push(
          metricReadout('STEP CHECK AT STEP 3', 'SAVES CALL 4', -420, 322, {
            color: ROLE.ok,
            size: 42,
            sub: 'still budget verifier tokens + latency',
          }).opacity(cAlpha),
          metricReadout('POST-HOC SCORER', 'PAYS ALL 4 CALLS', 420, 322, {
            color: ROLE.fail,
            size: 42,
            sub: 'require bool exact & finite score in [0,1]',
          }).opacity(cAlpha),
        );

        return group(...nodes);
      },
    ),
  );
}
