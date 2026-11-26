// Scene 13: approval-bindings - Four checks for one release
// Interactive 5-field request vs APR-9 form driving a 4-gate execution pipeline
// (Ownership -> Evaluation -> Target Allowlist -> Approval Binding) and live local
// write ledger backed directly by `exactApprovalDecision` and `localPromotionCases`.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PI_APPROVAL,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  exactApprovalDecision,
  guardedDynamic,
  hexGate,
  quadArcPts,
  txt,
} from '../parts.mjs';

const PROBE_SEQUENCE = [
  {
    label: 'Current request vs APR-9',
    req: PI_APPROVAL,
    grant: PI_APPROVAL,
    gate: -1,
    ledger: 0,
    note: '4 checks run in strict order',
  },
  {
    label: 'No approval',
    req: PI_APPROVAL,
    grant: null,
    gate: 3,
    ledger: 0,
    note: 'Reaches empty approval lookup',
  },
  {
    label: 'Unknown approval ID',
    req: PI_APPROVAL,
    grant: null,
    gate: 3,
    ledger: 0,
    note: 'Unknown ID -> empty lookup',
  },
  {
    label: 'Wrong user (attacker)',
    req: { ...PI_APPROVAL, user: 'attacker' },
    grant: PI_APPROVAL,
    gate: 0,
    ledger: 0,
    note: 'Stops at Check 1: Ownership',
  },
  {
    label: 'Stale suite (R41)',
    req: { ...PI_APPROVAL, suite: 'R41' },
    grant: PI_APPROVAL,
    gate: 1,
    ledger: 0,
    note: 'Stops at Check 2: Evaluation',
  },
  {
    label: 'Wrong operation (OP-OTHER)',
    req: { ...PI_APPROVAL, operation: 'OP-OTHER' },
    grant: PI_APPROVAL,
    gate: 3,
    ledger: 0,
    note: 'Stops at Check 4: Approval binding',
  },
  {
    label: 'Staging target (allowed, unbound)',
    req: { ...PI_APPROVAL, target: 'staging' },
    grant: PI_APPROVAL,
    gate: 3,
    ledger: 0,
    note: 'Passes allowlist, fails APR-9 target',
  },
  {
    label: '100% target (prod-100pct)',
    req: { ...PI_APPROVAL, target: 'prod-100pct' },
    grant: PI_APPROVAL,
    gate: 2,
    ledger: 0,
    note: 'Stops at Check 3: Target allowlist',
  },
  {
    label: 'Matching tuple (consumes APR-9)',
    req: PI_APPROVAL,
    grant: PI_APPROVAL,
    gate: 4,
    ledger: 1,
    note: 'Executes ONCE · APR-9 consumed',
  },
  {
    label: 'Replay after consumption',
    req: PI_APPROVAL,
    grant: null,
    gate: 3,
    ledger: 1,
    note: 'Replay finds empty store -> adds 0',
  },
];

export default function approvalBindings(s, c) {
  const pulse = s.value(0);
  const stepIdx = s.value(0);

  const header = cinemaHeader('ORDERED AUTHORIZATION PIPELINE', 'Four checks for', 'one release', {
    accent: ROLE.host,
    size: 48,
  });

  const stageAura = aura(180, 30, 640, '#5ce1e61c', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const idx = Math.max(0, Math.min(PROBE_SEQUENCE.length - 1, Math.round(stepIdx.value)));
      const probe = PROBE_SEQUENCE[idx];
      const consumed = idx === 9;
      const decision = exactApprovalDecision(probe.req, probe.grant, { consumed });
      const nodes = [];

      // Left: 5-Field Aligned Form (Request vs APR-9)
      const fields = [
        ['user', probe.req.user, probe.grant ? probe.grant.user : '(none)'],
        ['candidate', probe.req.candidate, probe.grant ? probe.grant.candidate : '(none)'],
        ['suite', probe.req.suite, probe.grant ? probe.grant.suite : '(none)'],
        ['target', probe.req.target, probe.grant ? probe.grant.target : '(none)'],
        ['operation', probe.req.operation, probe.grant ? probe.grant.operation : '(none)'],
      ];

      nodes.push(
        energyRail(-855, -210, 210, idx === 8 ? ROLE.ok : idx === 0 ? ROLE.host : ROLE.untrusted, {
          width: 6,
        }),
        txt('FIELD', -825, -192, 26, COSMOS.dim, 'mono', 'left'),
        txt('REQUEST', -560, -192, 26, ROLE.host, 'mono', 'center'),
        txt(
          consumed ? 'APR-9 (USED)' : 'APR-9 GRANT',
          -275,
          -192,
          26,
          ROLE.approval,
          'mono',
          'center',
        ),
        line([-825, -162], [-145, -162], { stroke: '#28385f', width: 2 }),
      );

      fields.forEach(([k, rv, gv], fi) => {
        const y = -114 + fi * 68;
        const mismatch = !probe.grant || rv !== gv;
        const col = idx === 0 ? COSMOS.ink : mismatch ? ROLE.denied : ROLE.ok;
        nodes.push(
          txt(k, -825, y, 26, COSMOS.muted, 'mono', 'left'),
          txt(rv, -560, y, 26, col, 'mono', 'center').glow(mismatch && idx > 0 ? 5 : 0, col),
          txt(gv, -275, y, 26, probe.grant ? ROLE.approval : ROLE.denied, 'mono', 'center'),
          line([-825, y + 32], [-145, y + 32], { stroke: '#1d2948', width: 1.4 }),
        );
      });

      // Right Top: 4 Ordered Execution Gates (compact labels -> max r = 85, spacing = 240px!)
      const gateXs = [15, 255, 495, 735];
      const gateLabels = ['OWNER', 'EVAL', 'TARGET', 'APR-9'];
      const gateY = -105;

      nodes.push(
        txt('EXECUTION ORDER (1 -> 2 -> 3 -> 4)', 375, -242, 26, ROLE.host, 'mono', 'center'),
      );

      for (let g = 0; g < 4; g++) {
        const isFail = probe.gate === g;
        const isPass = probe.gate > g;
        const col = isFail ? ROLE.denied : isPass ? ROLE.ok : '#3b4e7d';
        if (g < 3) {
          const rCur = Math.max(48, Math.ceil(gateLabels[g].length * 9.8 + 26));
          const rNxt = Math.max(48, Math.ceil(gateLabels[g + 1].length * 9.8 + 26));
          const seg = quadArcPts(
            [gateXs[g] + rCur + 10, gateY],
            [gateXs[g + 1] - rNxt - 10, gateY],
            0,
            14,
          );
          if (isPass) {
            nodes.push(
              beamWithPhotons(seg, ROLE.ok, p * 1.1 + g * 0.25, { width: 3.2, photonCount: 1 }),
            );
          } else {
            nodes.push(line(seg[0], seg.at(-1), { stroke: '#293960', width: 2.2, dash: [6, 6] }));
          }
        }
        nodes.push(
          hexGate(gateXs[g], gateY, 48, col, {
            label: gateLabels[g],
            sub: isFail ? 'STOP' : isPass ? 'PASS' : 'WAIT',
            glow: isFail || isPass ? 10 : 4,
          }),
        );
      }

      // Right Bottom: Active Probe Banner (clear below gate sub labels at y = +22!)
      const activeCol = decision === 'allow' ? ROLE.ok : idx === 0 ? ROLE.host : ROLE.denied;

      nodes.push(
        rect(820, 124, { fill: '#0e1529', stroke: activeCol, width: 2.6, radius: 10 }).at(375, 152),
        txt(`PROBE: ${probe.label}`, 375, 122, 28, activeCol, 'mono', 'center').glow(6, activeCol),
        txt(probe.note, 375, 176, 26, COSMOS.ink, 'sans', 'center'),
      );

      // Local Write Ledger readout
      const ledCol = probe.ledger > 0 ? ROLE.ok : COSMOS.muted;
      nodes.push(
        energyRail(-855, 268, 396, ledCol, { width: 6, glow: probe.ledger > 0 ? 10 : 4 }),
        txt('LOCAL WRITE LEDGER', -825, 294, 26, ROLE.host, 'mono', 'left'),
        txt(
          `ENTRIES: ${probe.ledger}   ${probe.ledger === 1 ? '(C17 · R42 · prod-10pct · OP-9)' : '(EMPTY)'}`,
          -825,
          354,
          30,
          ledCol,
          'mono',
          'left',
        ).glow(probe.ledger > 0 ? 8 : 0, ledCol),
        txt(
          idx >= 9
            ? '7 failures + 1 match + 1 replay = 1 write'
            : 'Proposals supplied directly -> tests host',
          835,
          354,
          26,
          idx >= 9 ? ROLE.ok : COSMOS.muted,
          'mono',
          'right',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  const jump = (cueId, targetStep) => {
    c.on(cueId, () => {
      s.play(stepIdx.to(targetStep, { duration: clampDur(c, c.cue(cueId).start, 0.25) }));
    });
  };

  jump('binding-record', 0);
  jump('binding-order', 0);
  jump('binding-none', 1);
  jump('binding-unknown', 2);
  jump('binding-owner', 3);
  jump('binding-suite', 4);
  jump('binding-operation', 5);
  jump('pi-target-binding', 6);
  jump('pi-forbidden-target', 7);
  jump('pi-local-execute', 8);
  jump('pi-local-replay', 9);
}
