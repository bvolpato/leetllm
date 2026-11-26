// Scene 25: host-approval - Match permission to this resource and operation
// Model proposal beacon (RUN-842 / retry_tests -> rollback, approved: true flagged untrusted)
// tested against 3 host approval store lanes:
//   1. Empty store            -> DENY
//   2. RUN-999 / retry_tests  -> DENY (wrong run)
//   3. RUN-842 / retry_tests  -> CONTINUE HOST CHECKS (then DENY: outside policy when action flips to rollback!)
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  fsmNode,
  guardedDynamic,
  opticalRail,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function hostApproval(s, c) {
  const pulse = s.value(0);
  const b0Hi = s.value(0);
  const noneDeny = s.value(0);
  const wrongDeny = s.value(0);
  const b1Hi = s.value(0);
  const matchOk = s.value(0);
  const b2Hi = s.value(0);
  const actionFlip = s.value(0);

  const header = cinemaHeader(
    'HOST EXECUTION AUTHORIZATION',
    'Match permission to resource',
    'and operation',
    { accent: ROLE.prefix, size: 48 },
  );

  const stageAura = aura(200, 40, 640, '#ffd1661b', '#ff6b8b16');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const b0 = b0Hi.value;
      const nd = noneDeny.value;
      const wd = wrongDeny.value;
      const b1 = b1Hi.value;
      const mo = matchOk.value;
      const b2 = b2Hi.value;
      const af = actionFlip.value;
      const nodes = [];

      const isRollback = af > 0.45;
      const propAction = isRollback ? 'rollback' : 'retry_tests';

      // Top untrusted model proposal beacon
      nodes.push(
        opticalRail(-840, -250, -145, isRollback ? ROLE.prune : ROLE.fsm),
        txt(
          'MODEL PROPOSAL (UNTRUSTED TEXT)',
          -805,
          -234,
          26,
          isRollback ? ROLE.prune : ROLE.fsm,
          'mono',
          'left',
        ),
        txt('approved: true (untrusted)', 200, -234, 26, ROLE.review, 'mono', 'left'),
        txt(
          `run_id: "RUN-842"   action: "${propAction}"`,
          -805,
          -174,
          36,
          isRollback ? ROLE.prune : COSMOS.ink,
          'mono',
          'left',
        ).glow(isRollback ? 8 : b0 > 0.3 ? 5 : 0, isRollback ? ROLE.prune : ROLE.fsm),
        line([-840, -112], [840, -112], { stroke: '#25355a', width: 2 }),
      );

      // Column headings
      nodes.push(
        txt('TRUSTED HOST APPROVAL STORE', -830, -64, 26, COSMOS.muted, 'mono', 'left'),
        txt('MATCH CHECK', 10, -64, 26, COSMOS.muted, 'mono', 'left'),
        txt('HOST VERDICT', 425, -64, 26, COSMOS.muted, 'mono', 'left'),
      );

      // Row 0: Empty store
      const y0 = 28;
      nodes.push(
        opticalRail(-840, y0 - 38, y0 + 38, nd > 0.4 ? ROLE.prune : COSMOS.dim),
        txt('(empty approval store)', -805, y0, 34, COSMOS.muted, 'mono', 'left'),
        txt(
          nd > 0.4 ? 'no grant found' : '...',
          10,
          y0,
          28,
          nd > 0.4 ? ROLE.prune : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          nd > 0.4 ? 'DENY' : '?',
          425,
          y0,
          36,
          nd > 0.4 ? ROLE.prune : COSMOS.dim,
          'mono',
          'left',
        ).glow(nd > 0.4 ? 9 : 0, ROLE.prune),
      );

      // Row 1: Wrong run (RUN-999 / retry_tests)
      const y1 = 136;
      nodes.push(
        opticalRail(-840, y1 - 38, y1 + 38, wd > 0.4 ? ROLE.prune : COSMOS.dim),
        txt('RUN-999  /  retry_tests', -805, y1, 34, COSMOS.ink, 'mono', 'left'),
        txt(
          wd > 0.4 ? 'run_id mismatch' : '...',
          10,
          y1,
          28,
          wd > 0.4 ? ROLE.prune : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          wd > 0.4 ? 'DENY' : '?',
          425,
          y1,
          36,
          wd > 0.4 ? ROLE.prune : COSMOS.dim,
          'mono',
          'left',
        ).glow(wd > 0.4 ? 9 : 0, ROLE.prune),
      );

      // Row 2: Matching store entry (RUN-842 / retry_tests)
      const y2 = 246;
      const r2Lit = mo > 0.4 || b1 > 0.4;
      const r2Col = isRollback ? ROLE.prune : mo > 0.4 ? ROLE.legal : ROLE.prefix;
      nodes.push(
        opticalRail(-840, y2 - 40, y2 + 40, r2Lit ? r2Col : COSMOS.dim),
        txt(
          'RUN-842  /  retry_tests',
          -805,
          y2,
          34,
          r2Lit ? COSMOS.ink : COSMOS.muted,
          'mono',
          'left',
        ),
        txt(
          isRollback ? 'action mismatch' : mo > 0.4 ? 'run + action ok' : '...',
          10,
          y2,
          28,
          r2Lit ? r2Col : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          isRollback ? 'DENY · OUTSIDE POLICY' : mo > 0.4 ? 'CONTINUE CHECKS' : '?',
          425,
          y2,
          34,
          r2Lit ? r2Col : COSMOS.dim,
          'mono',
          'left',
        ).glow(mo > 0.4 || isRollback ? 9 : 0, r2Col),
      );

      if (mo > 0.4 && !isRollback) {
        nodes.push(
          beamWithPhotons(quadArcPts([295, y2], [405, y2], -12), ROLE.legal, p * 1.2, {
            width: 3.2,
            photonCount: 1,
          }),
        );
      }

      // Far-right policy emblem
      nodes.push(
        fsmNode(760, -200, 52, isRollback ? 'LOCK' : mo > 0.4 ? 'PASS' : 'GATE', {
          color: isRollback ? ROLE.prune : mo > 0.4 ? ROLE.legal : ROLE.prefix,
          accepting: mo > 0.4 && !isRollback,
          size: 26,
        }),
        txt(
          isRollback || b2 > 0.4
            ? 'Stored approval is bound to (RUN-842, retry_tests) · Rollback falls outside policy'
            : mo > 0.4
              ? 'At execution time, re-verify caller identity, current access, and approval freshness'
              : 'A boolean approved: true field emitted by the model never grants execution authority',
          -840,
          365,
          28,
          isRollback ? ROLE.prune : COSMOS.muted,
          'serif',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);
  driftValue(s, c, pulse, 4.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('sg-host-approval-0', () => {
    s.play(b0Hi.to(1, { duration: clampDur(c, c.cue('sg-host-approval-0').start, 0.35) }));
  });
  c.on('sg-approval-none', () => {
    s.play(noneDeny.to(1, { duration: clampDur(c, c.cue('sg-approval-none').start, 0.4) }));
  });
  c.on('sg-approval-wrong', () => {
    s.play(wrongDeny.to(1, { duration: clampDur(c, c.cue('sg-approval-wrong').start, 0.4) }));
  });
  c.on('sg-host-approval-1', () => {
    s.play(b1Hi.to(1, { duration: clampDur(c, c.cue('sg-host-approval-1').start, 0.35) }));
  });
  c.on('sg-approval-match', () => {
    s.play(matchOk.to(1, { duration: clampDur(c, c.cue('sg-approval-match').start, 0.4) }));
  });
  c.on('sg-host-approval-2', () => {
    s.play(b2Hi.to(1, { duration: clampDur(c, c.cue('sg-host-approval-2').start, 0.35) }));
  });
  c.on('sg-approval-action', () => {
    s.play(actionFlip.to(1, { duration: clampDur(c, c.cue('sg-approval-action').start, 0.45) }));
  });
}
