// Scene 04: contract - Give every request a decision owner and receipt
// 5 ordered decision boundaries for R-104 (Req ID -> AuthN -> AuthZ -> Quota -> Admission)
// writing one unified support receipt with route, policy version, quota decision & queue wait.
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

export default function contract(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 0..5 progressive highlights across boundaries + receipt

  const header = cinemaHeader(
    'REQUEST DECISION PIPELINE',
    'Give every request',
    'an owner & receipt',
    {
      x: -860,
      y: -445,
      accent: ROLE.req,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#ffd16618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const st = step.value;
      const nodes = [];

      const specs = [
        { x: -680, label: 'REQ ID', sub: 'server-minted', col: ROLE.req },
        { x: -340, label: 'AUTHN', sub: 'who owns key', col: ROLE.worker },
        { x: 0, label: 'AUTHZ', sub: 'model + data', col: ROLE.focus },
        { x: 340, label: 'QUOTA', sub: 'tenant budget', col: ROLE.ok },
        { x: 680, label: 'ADMIT', sub: 'fleet SLO', col: ROLE.policy },
      ];

      const built = specs.map((sp, i) => {
        const active = st >= i - 0.1;
        return {
          ...sp,
          obj: sysNode(sp.x, -30, sp.label, sp.col, {
            radius: 68,
            sub: sp.sub,
            opacity: active ? 1 : 0.42,
          }),
        };
      });

      for (let i = 0; i < built.length - 1; i++) {
        const [a, b] = trimSeg(
          [built[i].x, -30],
          [built[i + 1].x, -30],
          built[i].obj.r + 14,
          built[i + 1].obj.r + 14,
        );
        nodes.push(
          beamWithPhotons([a, b], built[i].col, p + i * 0.2, {
            width: 3.6,
            photonCount: 1,
            alpha: st >= i ? 0.95 : 0.35,
          }),
        );
      }

      built.forEach((b) => nodes.push(b.obj.node));

      // Top-right rule
      nodes.push(
        txt('EVEN REJECTED CALLS GET AN ID', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          'Order: ID -> AuthN -> AuthZ -> Quota -> Admit',
          480,
          -378,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom unified receipt rail
      const rcpY = 235;
      const rcpAlpha = st >= 4.5 ? 1 : 0.45;
      nodes.push(
        line([-840, 165], [840, 165], { stroke: ROLE.focus, width: 2.5 }).opacity(rcpAlpha * 0.75),
        txt(
          'UNIFIED RESPONSE & TRACE RECEIPT (R-104)',
          0,
          rcpY - 22,
          26,
          ROLE.focus,
          'mono',
          'center',
        ).opacity(rcpAlpha),
        txt(
          'request_id · route · policy_ver · quota_decision · queue_wait_ms · provider_result',
          0,
          rcpY + 32,
          26,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(rcpAlpha),
        txt(
          'Support traces any timeout or rejection straight back to its owning boundary',
          0,
          rcpY + 94,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.req,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.0);

  c.on('contract-request-id', () => {
    s.play(step.to(0.5, { duration: clampDur(c, c.cue('contract-request-id').start, 0.25) }));
  });
  c.on('contract-authenticate', () => {
    s.play(step.to(1, { duration: clampDur(c, c.cue('contract-authenticate').start, 0.25) }));
  });
  c.on('contract-authorize', () => {
    s.play(step.to(2, { duration: clampDur(c, c.cue('contract-authorize').start, 0.25) }));
  });
  c.on('contract-reserve-quota', () => {
    s.play(step.to(3, { duration: clampDur(c, c.cue('contract-reserve-quota').start, 0.25) }));
  });
  c.on('contract-admission', () => {
    s.play(step.to(4, { duration: clampDur(c, c.cue('contract-admission').start, 0.25) }));
  });
  c.on('contract-owned-receipt', () => {
    s.play(step.to(5, { duration: clampDur(c, c.cue('contract-owned-receipt').start, 0.35) }));
  });
}
