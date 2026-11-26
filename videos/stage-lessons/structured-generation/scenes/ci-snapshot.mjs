// Scene 18: ci-snapshot - What may this caller see?
// Caller scope lock (project-alpha, RUN-842) guarding a 3-row glowing optical access gate:
//   Row 1: project-beta / failed  -> Scope firewall blocks BEFORE CI read -> Skipped -> DENY
//   Row 2: project-alpha / passed -> Passes scope -> CI says failed -> REVIEW
//   Row 3: project-alpha / failed -> Passes scope -> CI says failed -> SHOW SNAPSHOT
import { group, line } from 'vizmatic/stage';
import {
  CI_RUN,
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  ciOutcome,
  clampDur,
  driftValue,
  fsmNode,
  guardedDynamic,
  opticalRail,
  quadArcPts,
  txt,
} from '../parts.mjs';

const SNAPSHOT = { [CI_RUN.project + '/' + CI_RUN.run_id]: CI_RUN.status };
const ROWS = [
  { project: 'project-beta', status: 'failed' },
  { project: 'project-alpha', status: 'passed' },
  { project: 'project-alpha', status: 'failed' },
];

export default function ciSnapshot(s, c) {
  const pulse = s.value(0);
  const r0Deny = s.value(0);
  const r1Show = s.value(0);
  const r1Read = s.value(0);
  const r1Rev = s.value(0);
  const r2Show = s.value(0);
  const r2Verdict = s.value(0);

  const header = cinemaHeader('SCOPE GATE BEFORE LOOKUP', 'What may this', 'caller see?', {
    accent: ROLE.prefix,
    size: 50,
  });

  const stageAura = aura(220, 40, 640, '#ffd1661b', '#6ee7b716');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const d0 = r0Deny.value;
      const s1 = r1Show.value;
      const rd1 = r1Read.value;
      const rv1 = r1Rev.value;
      const s2 = r2Show.value;
      const v2 = r2Verdict.value;
      const nodes = [];

      // Top caller scope & requested run badges
      nodes.push(
        opticalRail(-840, -250, -150, ROLE.prefix),
        txt('CALLER READ SCOPE', -805, -234, 26, ROLE.prefix, 'mono', 'left'),
        txt(CI_RUN.project, -805, -174, 42, ROLE.prefix, 'mono', 'left').glow(7, ROLE.prefix),

        opticalRail(120, -250, -150, ROLE.fsm),
        txt('REQUESTED RUN', 155, -234, 26, ROLE.fsm, 'mono', 'left'),
        txt(CI_RUN.run_id, 155, -174, 42, COSMOS.ink, 'mono', 'left'),

        fsmNode(730, -200, 56, 'AUTH', { color: ROLE.prefix, size: 26 }),
      );

      // Table column headers (floating typography, zero boxed cards!)
      nodes.push(
        txt('CANDIDATE PROJECT', -830, -82, 26, COSMOS.muted, 'mono', 'left'),
        txt('CLAIM', -320, -82, 26, COSMOS.muted, 'mono', 'left'),
        txt('CI LOOKUP', 20, -82, 26, COSMOS.muted, 'mono', 'left'),
        txt('HOST DECISION', 390, -82, 26, COSMOS.muted, 'mono', 'left'),
        line([-840, -52], [840, -52], { stroke: '#25355a', width: 2 }),
      );

      const states = [
        { visible: 1, read: d0, decided: d0 },
        { visible: s1, read: rd1, decided: rv1 },
        { visible: s2, read: v2, decided: v2 },
      ];

      ROWS.forEach((row, i) => {
        const st = states[i];
        if (st.visible < 0.05) return;
        const y = 32 + i * 136;
        const res = ciOutcome(
          { project: row.project, run_id: CI_RUN.run_id, status: row.status },
          CI_RUN.project,
          SNAPSHOT,
        );
        const isShow = res.outcome === 'show snapshot';
        const decCol =
          st.decided > 0.4
            ? isShow
              ? ROLE.legal
              : res.outcome === 'review'
                ? ROLE.review
                : ROLE.prune
            : COSMOS.dim;

        nodes.push(
          opticalRail(-840, y - 42, y + 42, st.decided > 0.4 ? decCol : ROLE.fsm, {
            opacity: st.visible,
          }),
          txt(
            row.project,
            -805,
            y,
            36,
            row.project === CI_RUN.project ? COSMOS.ink : ROLE.prune,
            'mono',
            'left',
          ).opacity(st.visible),
          txt(row.status, -320, y, 36, COSMOS.ink, 'mono', 'left').opacity(st.visible),
        );

        // CI Lookup column
        const lookupText =
          st.read > 0.4 ? (res.queried ? `CI: ${CI_RUN.status}` : 'SKIPPED (0 READS)') : 'pending';
        const lookupCol = st.read > 0.4 ? (res.queried ? ROLE.prefix : ROLE.prune) : COSMOS.dim;

        nodes.push(txt(lookupText, 20, y, 30, lookupCol, 'mono', 'left').opacity(st.visible));

        // Decision column + beam
        const decText = st.decided > 0.4 ? res.outcome.toUpperCase() : '?';
        nodes.push(
          txt(decText, 390, y, 36, decCol, 'mono', 'left')
            .glow(st.decided > 0.4 ? 9 : 0, decCol)
            .opacity(st.visible),
        );

        if (st.decided > 0.4 && isShow) {
          nodes.push(
            beamWithPhotons(quadArcPts([240, y], [375, y], -16), ROLE.legal, p * 1.2, {
              alpha: st.decided,
              width: 3.2,
              photonCount: 1,
            }),
          );
        }

        nodes.push(
          line([-840, y + 60], [840, y + 60], { stroke: '#1b2644', width: 1.4 }).opacity(
            st.visible,
          ),
        );
      });

      nodes.push(
        txt(
          v2 > 0.4
            ? 'Showing a snapshot is a read · Changing a deployment requires separate evidence and grant'
            : 'Scope runs before any lookup so unauthorized callers learn nothing about other projects',
          -840,
          388,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);
  driftValue(s, c, pulse, 4.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('ci-deny', () => {
    s.play(r0Deny.to(1, { duration: clampDur(c, c.cue('ci-deny').start, 0.4) }));
  });
  c.on('ci-second', () => {
    s.play(r1Show.to(1, { duration: clampDur(c, c.cue('ci-second').start, 0.35) }));
  });
  c.on('ci-status', () => {
    s.play(r1Read.to(1, { duration: clampDur(c, c.cue('ci-status').start, 0.35) }));
  });
  c.on('ci-review', () => {
    s.play(r1Rev.to(1, { duration: clampDur(c, c.cue('ci-review').start, 0.4) }));
  });
  c.on('ci-change', () => {
    s.play(r2Show.to(1, { duration: clampDur(c, c.cue('ci-change').start, 0.35) }));
  });
  c.on('ci-show', () => {
    s.play(r2Verdict.to(1, { duration: clampDur(c, c.cue('ci-show').start, 0.4) }));
  });
}
