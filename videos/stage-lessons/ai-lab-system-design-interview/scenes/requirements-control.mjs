// Scene 03: requirements-control - Which queue does your team own?
// Hosted provider vs self-hosted queue/worker ownership, Control Plane (policy v7) feeding
// Data Plane (fail-closed when policy missing), plus 3 interview follow-ups (RAG, Sandbox, Eval).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  sysNode,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function requirementsControl(s, c) {
  const phase = s.value(0);
  const selfHost = s.value(0);
  const ctrlOn = s.value(0);
  const failClosed = s.value(0);
  const followups = s.value(0);

  const header = cinemaHeader('OWNERSHIP & CONTROL PLANE', 'Which queue does', 'your team own?', {
    x: -860,
    y: -445,
    accent: ROLE.policy,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#a78bfa1a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const sh = selfHost.value;
      const ct = ctrlOn.value;
      const fc = failClosed.value;
      const fu = followups.value;
      const nodes = [];

      // Left: Control Plane (Policy v7 -> entitlements, routes, quotas)
      const cpPt = [-540, -25];
      const gwPt = [0, -25];
      const wkPt = [540, -25];

      const cpCol = fc > 0.4 ? ROLE.fail : ROLE.policy;
      const nCp = sysNode(cpPt[0], cpPt[1], fc > 0.4 ? 'POLICY ?' : 'POLICY v7', cpCol, {
        radius: 82,
        sub: fc > 0.4 ? 'unavailable -> fail closed!' : 'entitlement · route · quota',
        opacity: 0.45 + ct * 0.55,
      });

      const nGw = sysNode(gwPt[0], gwPt[1], 'GATEWAY', ROLE.req, {
        radius: 82,
        sub: 'key · budget · admission',
      });

      const nWk = sysNode(
        wkPt[0],
        wkPt[1],
        sh > 0.4 ? 'LOCAL GPU' : 'PROVIDER',
        sh > 0.4 ? ROLE.ok : ROLE.worker,
        {
          radius: 82,
          sub: sh > 0.4 ? 'YOU own queue + worker' : 'provider owns quota + tail',
        },
      );

      const [b1a, b1b] = trimSeg(cpPt, gwPt, nCp.r + 18, nGw.r + 18);
      const [b2a, b2b] = trimSeg(gwPt, wkPt, nGw.r + 18, nWk.r + 18);

      nodes.push(
        fc > 0.4
          ? line(b1a, b1b, { stroke: ROLE.fail, width: 3.5, dash: [12, 10] }).glow(7, ROLE.fail)
          : beamWithPhotons([b1a, b1b], ROLE.policy, p, {
              width: 3.8,
              photonCount: 2,
              alpha: 0.45 + ct * 0.55,
            }),
        beamWithPhotons([b2a, b2b], sh > 0.4 ? ROLE.ok : ROLE.worker, p + 0.4, {
          width: 4,
          photonCount: 2,
        }),
        nCp.node,
        nGw.node,
        nWk.node,
      );

      // Top-right plane separation
      nodes.push(
        txt('CONTROL VS DATA PLANE', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Control: admin writes policy v7', 480, -378, 26, ROLE.policy, 'mono', 'center'),
        txt('Data: gateway enforces per call', 480, -334, 26, ROLE.req, 'mono', 'center'),
      );

      // Bottom 3 follow-up extensions (RAG, Repo Sandbox, Eval Gate)
      const botY = 235;
      const fuAlpha = 0.35 + fu * 0.65;
      nodes.push(
        line([-840, 165], [840, 165], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'THREE INTERVIEW FOLLOW-UPS THAT EXTEND THE BOARD',
          0,
          botY - 26,
          26,
          ROLE.focus,
          'mono',
          'center',
        ).opacity(fuAlpha),
        txt(
          '1. Docs -> versioned index + ACL',
          -570,
          botY + 34,
          26,
          ROLE.req,
          'mono',
          'center',
        ).opacity(fuAlpha),
        txt(
          '2. Repo -> durable task + sandbox',
          0,
          botY + 34,
          26,
          ROLE.ok,
          'mono',
          'center',
        ).opacity(fuAlpha),
        txt(
          '3. Candidate -> rollout eval gate',
          570,
          botY + 34,
          26,
          ROLE.policy,
          'mono',
          'center',
        ).opacity(fuAlpha),
        txt(
          fc > 0.4 && fu < 0.4
            ? 'FAIL CLOSED: keep beta models & private data closed when policy is missing!'
            : 'Name what you record for support and which action you can stop for abuse',
          0,
          botY + 108,
          26,
          fc > 0.4 && fu < 0.4 ? ROLE.fail : COSMOS.muted,
          'mono',
          'center',
        ),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.policy,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.on('requirements-host', () => {
    s.play(selfHost.to(1, { duration: clampDur(c, c.cue('requirements-host').start, 0.4) }));
  });
  c.on('sd-requirements-control-1-operation', () => {
    s.play(
      ctrlOn.to(1, {
        duration: clampDur(c, c.cue('sd-requirements-control-1-operation').start, 0.35),
      }),
    );
  });
  c.on('requirements-policy-missing', () => {
    s.play(
      failClosed.to(1, { duration: clampDur(c, c.cue('requirements-policy-missing').start, 0.35) }),
    );
  });
  c.on('sd-requirements-control-2-operation', () => {
    s.play(
      followups.to(1, {
        duration: clampDur(c, c.cue('sd-requirements-control-2-operation').start, 0.4),
      }),
    );
  });
}
