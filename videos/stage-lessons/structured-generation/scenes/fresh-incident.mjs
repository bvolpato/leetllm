// Scene 30: fresh-incident - What can the dashboard show for RUN-915?
// Finale synthesis command bridge!
// Completed gamma record (RUN-915, failed, failing_job: null) + untrusted proposal
// (rollback, approved: true) beside trusted host (project-gamma, CI failed/job unknown,
// 0 approvals). STRICT prediction withholding on BOTH Beat 0 (hold 3.5s) AND Beat 2
// (hold 2.9s: switch caller to project-delta -> 0 gamma lookups, Access denied)!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  FRESH_INCIDENT,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  ciOutcome,
  clampDur,
  driftValue,
  fsmNode,
  guardedDynamic,
  nullableRecord,
  opticalRail,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function freshIncident(s, c) {
  const pulse = s.value(0);
  const propShow = s.value(0);
  const grantsShow = s.value(0);
  const dashShow = s.value(0);
  const denyShow = s.value(0);
  const switchedDelta = s.value(0);
  const zeroStop = s.value(0);

  const header = cinemaHeader(
    'END-TO-END SYNTHESIS · RUN-915',
    'What can the dashboard',
    'show for RUN-915?',
    { accent: ROLE.legal, size: 48 },
  );

  const stageAura = aura(200, 40, 650, '#6ee7b71e', '#5ce1e618');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const pr = propShow.value;
      const gr = grantsShow.value;
      const ds = dashShow.value;
      const dn = denyShow.value;
      const sw = switchedDelta.value;
      const zs = zeroStop.value;
      const nodes = [];

      const isDelta = sw > 0.45;
      const scope = isDelta ? FRESH_INCIDENT.altScope : FRESH_INCIDENT.project;
      const out = ciOutcome(
        { ...FRESH_INCIDENT.record, project: FRESH_INCIDENT.project },
        scope,
        FRESH_INCIDENT.snapshot,
      );
      const schemaValid = nullableRecord(FRESH_INCIDENT.record);
      const canShow = !isDelta && ds > 0.45 && schemaValid && out.outcome === 'show snapshot';
      const resolvedDelta = isDelta && zs > 0.45;

      // Left upper panel: Completed Record + Untrusted Rollback Proposal
      nodes.push(
        opticalRail(-840, -230, 85, ROLE.fsm),
        txt('COMPLETED REPLY (VALID SCHEMA)', -805, -214, 26, ROLE.fsm, 'mono', 'left'),
        txt(
          `run_id: "${FRESH_INCIDENT.record.run_id}"`,
          -805,
          -154,
          34,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          `status: "${FRESH_INCIDENT.record.status}"`,
          -805,
          -104,
          34,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt('failing_job: null', -805, -54, 34, ROLE.prefix, 'mono', 'left'),
        txt(
          pr > 0.2 ? 'PROPOSAL: rollback  (approved: true)' : 'awaiting proposal...',
          -805,
          28,
          30,
          pr > 0.2 ? ROLE.review : COSMOS.dim,
          'mono',
          'left',
        ).glow(pr > 0.2 ? 6 : 0, ROLE.review),
      );

      // Center vertical divider
      nodes.push(line([-20, -235], [-20, 95], { stroke: '#25355a', width: 2 }));

      // Right upper panel: Trusted Host Context (Scope, CI, Approval Store)
      nodes.push(
        opticalRail(40, -230, 85, isDelta ? ROLE.prune : ROLE.prefix),
        txt(
          `TRUSTED HOST  ·  REQUEST FOR ${FRESH_INCIDENT.project}`,
          75,
          -214,
          26,
          ROLE.prefix,
          'mono',
          'left',
        ),
        txt(
          `READ SCOPE: ${scope}`,
          75,
          -154,
          36,
          isDelta ? ROLE.prune : ROLE.legal,
          'mono',
          'left',
        ).glow(isDelta ? 9 : 6, isDelta ? ROLE.prune : ROLE.legal),
        txt(
          resolvedDelta
            ? 'Scope excludes project-gamma -> 0 lookups'
            : isDelta
              ? 'How many gamma lookups should run?'
              : 'CI evidence: failed · job unidentified',
          75,
          -98,
          28,
          isDelta ? ROLE.prefix : COSMOS.ink,
          'sans',
          'left',
        ),
        txt(
          gr > 0.2
            ? `HOST APPROVALS: ${FRESH_INCIDENT.approvals.length}  (EMPTY STORE)`
            : 'checking approvals...',
          75,
          -28,
          28,
          gr > 0.2 ? ROLE.prune : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          gr > 0.2 ? 'DEPLOYMENT EVIDENCE: NONE' : '',
          75,
          28,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(gr),
      );

      // Horizontal optical gate bar separating inputs from verdicts
      nodes.push(line([-840, 128], [840, 128], { stroke: '#25355a', width: 2.5 }));

      // Bottom left: Dashboard Verdict
      const dashCol = resolvedDelta ? ROLE.prune : canShow ? ROLE.legal : ROLE.prefix;
      nodes.push(
        txt('DASHBOARD DISPLAY', -840, 178, 26, COSMOS.muted, 'mono', 'left'),
        txt(
          resolvedDelta
            ? 'ACCESS DENIED'
            : canShow
              ? 'FAILED SNAPSHOT'
              : isDelta
                ? 'LOOKUPS: ?'
                : '?',
          -840,
          255,
          50,
          dashCol,
          'mono',
          'left',
        ).glow(resolvedDelta || canShow ? 10 : 0, dashCol),
        txt(
          resolvedDelta
            ? `GAMMA SNAPSHOT LOOKUPS: ${Number(out.queried)}  (STOPPED AT SCOPE)`
            : canShow
              ? 'JOB UNKNOWN  (KEEP NULL UNTIL CI NAMES IT)'
              : isDelta
                ? 'Same reply · caller switched to project-delta'
                : 'What can the dashboard show?',
          -840,
          332,
          26,
          resolvedDelta ? ROLE.prune : canShow ? ROLE.fsm : ROLE.prefix,
          'mono',
          'left',
        ),
      );

      // Bottom right: Rollback Verdict + Finale Emblem
      const rbCol = dn > 0.45 ? ROLE.prune : ROLE.prefix;
      nodes.push(
        txt('PROPOSED ROLLBACK', 140, 178, 26, COSMOS.muted, 'mono', 'left'),
        txt(dn > 0.45 ? 'DENY' : '?', 140, 255, 50, rbCol, 'mono', 'left').glow(
          dn > 0.45 ? 10 : 0,
          rbCol,
        ),
        txt(
          dn > 0.45
            ? 'NO HOST APPROVAL · ZERO OPERATIONS DISPATCHED'
            : 'Should the host send rollback?',
          140,
          332,
          26,
          dn > 0.45 ? COSMOS.muted : ROLE.prefix,
          'mono',
          'left',
        ),
        fsmNode(760, 250, 62, resolvedDelta ? '0' : canShow ? 'OK' : '?', {
          color: resolvedDelta ? ROLE.prune : canShow ? ROLE.legal : ROLE.prefix,
          accepting: canShow,
          size: 34,
        }),
      );

      // Glowing optical gate conduit along y=128 (never crosses any upper/lower text!)
      if (canShow || resolvedDelta) {
        nodes.push(
          beamWithPhotons(
            quadArcPts([620, 128], [-620, 128], 0),
            resolvedDelta ? ROLE.prune : ROLE.legal,
            p * 1.1,
            { alpha: 0.85, width: 3.6 },
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('fresh-proposal', () => {
    s.play(propShow.to(1, { duration: clampDur(c, c.cue('fresh-proposal').start, 0.35) }));
  });
  c.on('fresh-input', () => {
    s.play(grantsShow.to(1, { duration: clampDur(c, c.cue('fresh-input').start, 0.35) }));
  });
  // Strict prediction withholding on Beat 0: reveal Dashboard & Deny AFTER spoken clauses!
  c.after('sg-fresh-show', () => {
    s.play(dashShow.to(1, { duration: clampDur(c, c.cue('sg-fresh-show').end, 0.4) }));
  });
  c.after('sg-fresh-deny', () => {
    s.play(denyShow.to(1, { duration: clampDur(c, c.cue('sg-fresh-deny').end, 0.4) }));
  });
  c.on('fresh-switch', () => {
    s.play(switchedDelta.to(1, { duration: clampDur(c, c.cue('fresh-switch').start, 0.4) }));
  });
  // Strict prediction withholding on Beat 2: reveal Zero lookups AFTER spoken clause!
  c.after('fresh-stop', () => {
    s.play(zeroStop.to(1, { duration: clampDur(c, c.cue('fresh-stop').end, 0.4) }));
  });
}
