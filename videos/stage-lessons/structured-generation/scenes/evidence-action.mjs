// Scene 19: evidence-action - Check what an exact quote establishes
// Source log optical rail linked via verbatim substring beam to Quoted Bytes and Proposed Decision.
// Passes genuine quote, rejects invented rollback sentence, then restores genuine quote while
// flipping action retry_tests -> rollback: substring check STILL passes yet action is unjustified!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  RUN_LOG,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fsmNode,
  guardedDynamic,
  opticalRail,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function evidenceAction(s, c) {
  const b0Hi = s.value(0);
  const quotePass = s.value(0);
  const inventedMode = s.value(0);
  const restoreQuote = s.value(0);
  const actionRollback = s.value(0);
  const stillPasses = s.value(0);
  const orderNote = s.value(0);

  const header = cinemaHeader(
    'VERBATIM QUOTES VS JUSTIFICATION',
    'Check what an exact',
    'quote establishes',
    { accent: ROLE.prefix, size: 48 },
  );

  const stageAura = aura(200, 40, 640, '#ffd1661c', '#ff6b8b18');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const b0 = b0Hi.value;
      const qp = quotePass.value;
      const inv = inventedMode.value;
      const rst = restoreQuote.value;
      const arb = actionRollback.value;
      const sp = stillPasses.value;
      const on = orderNote.value;
      const nodes = [];

      const isInvented = inv > 0.45 && rst < 0.45;
      const isRollback = arb > 0.45;
      const membershipOk = !isInvented && (qp > 0.45 || sp > 0.45);

      // Top supplied source log rail
      nodes.push(
        opticalRail(-840, -255, -145, ROLE.prefix),
        txt('SUPPLIED SOURCE LOG (TRUSTED INPUT)', -805, -240, 26, ROLE.prefix, 'mono', 'left'),
        txt(RUN_LOG, -805, -180, 34, COSMOS.ink, 'sans', 'left').glow(
          b0 > 0.3 ? 5 : 0,
          ROLE.prefix,
        ),
        line([-840, -118], [840, -118], { stroke: '#25355a', width: 2 }),
      );

      // Left lower lane: Quoted bytes + substring membership beam from source log
      const qCol = isInvented ? ROLE.prune : membershipOk ? ROLE.legal : ROLE.fsm;
      nodes.push(
        beamWithPhotons(quadArcPts([-460, -118], [-460, -20], 0), qCol, 0, {
          alpha: 0.85,
          width: 3.4,
          photonCount: isInvented ? 0 : 2,
        }),
        opticalRail(-840, -15, 165, qCol),
        txt(
          isInvented ? 'INVENTED QUOTE CANDIDATE' : 'QUOTED EVIDENCE SPAN',
          -805,
          2,
          26,
          qCol,
          'mono',
          'left',
        ),
        txt(
          isInvented ? '“RUN-842 needs immediate rollback.”' : '“Run RUN-842 failed in unit-tests',
          -805,
          62,
          30,
          isInvented ? ROLE.prune : COSMOS.ink,
          'sans',
          'left',
        ),
        txt(
          isInvented ? '(absent from source log)' : 'after auth-cache timed out.”',
          -805,
          106,
          28,
          isInvented ? ROLE.prune : COSMOS.ink,
          'sans',
          'left',
        ),
        txt(
          isInvented
            ? 'SUBSTRING CHECK: FAIL (ABSENT)'
            : membershipOk
              ? 'SUBSTRING + RUN ID: PASS'
              : 'checking verbatim span...',
          -805,
          165,
          28,
          isInvented ? ROLE.prune : membershipOk ? ROLE.legal : COSMOS.dim,
          'mono',
          'left',
        ).glow(isInvented || membershipOk ? 8 : 0, isInvented ? ROLE.prune : ROLE.legal),
      );

      // Right lower lane: Proposed Decision (retry_tests -> rollback)
      const actCol = isRollback ? ROLE.prune : ROLE.schema;
      nodes.push(
        opticalRail(175, -15, 165, actCol),
        txt('PROPOSED ACTION', 210, 2, 26, actCol, 'mono', 'left'),
        txt(isRollback ? 'rollback' : 'retry_tests', 210, 74, 48, actCol, 'mono', 'left').glow(
          isRollback ? 10 : 6,
          actCol,
        ),
        fsmNode(735, 74, 58, isRollback ? 'GAP' : 'OK', {
          color: isRollback ? ROLE.prune : ROLE.legal,
          accepting: !isRollback,
          size: 28,
        }),
      );

      if (isRollback) {
        nodes.push(
          txt('TRUE QUOTE != JUSTIFIED ROLLBACK', 210, 165, 26, ROLE.prune, 'mono', 'left').glow(
            8,
            ROLE.prune,
          ),
        );
      }

      // Bottom synthesis bar (concise so every state is effortless to read in motion)
      nodes.push(
        line([-840, 245], [840, 245], { stroke: '#233154', width: 2 }),
        txt(
          on > 0.4
            ? 'Verify quote support + permission'
            : isRollback
              ? 'True quote != rollback justification'
              : isInvented
                ? 'Invented words fail source match'
                : 'Quote before decision aids checks',
          -840,
          335,
          30,
          isRollback ? ROLE.review : COSMOS.muted,
          'serif',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);

  c.on('sg-evidence-action-0', () => {
    s.play(b0Hi.to(1, { duration: clampDur(c, c.cue('sg-evidence-action-0').start, 0.35) }));
  });
  c.on('sg-quote-pass', () => {
    s.play(quotePass.to(1, { duration: clampDur(c, c.cue('sg-quote-pass').start, 0.4) }));
  });
  c.on('sg-quote-invented', () => {
    s.play(inventedMode.to(1, { duration: clampDur(c, c.cue('sg-quote-invented').start, 0.45) }));
  });
  c.on('sg-evidence-action-1', () => {
    s.play(
      restoreQuote.to(1, { duration: clampDur(c, c.cue('sg-evidence-action-1').start, 0.35) }),
    );
  });
  c.on('sg-action-change', () => {
    s.play(actionRollback.to(1, { duration: clampDur(c, c.cue('sg-action-change').start, 0.45) }));
  });
  c.on('sg-membership-still-pass', () => {
    s.play(
      stillPasses.to(1, { duration: clampDur(c, c.cue('sg-membership-still-pass').start, 0.35) }),
    );
  });
  c.on('sg-evidence-action-2', () => {
    s.play(orderNote.to(1, { duration: clampDur(c, c.cue('sg-evidence-action-2').start, 0.4) }));
  });
}
