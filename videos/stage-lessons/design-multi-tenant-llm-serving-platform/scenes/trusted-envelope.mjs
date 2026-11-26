// Scene 06: trusted-envelope - Carry authority beyond the gateway
// Assembles the immutable signed request envelope across 6 fields, verifies issuer/audience/expiry/op,
// blocks an untrusted JSON tenant spoof, and enforces service credentials downstream.
import { group, line, rect } from 'vizmatic/stage';
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

const ENVELOPE_FIELDS = [
  ['PRINCIPAL', 'Alice', ROLE.A],
  ['AUTHORIZED WORKSPACE', 'Workspace A', ROLE.A],
  ['REQUEST / ATTEMPT', 'A-1  /  attempt-1', ROLE.shared],
  ['POLICY REVISION', 'acl-v1', ROLE.policy],
  ['MODEL / ADAPTER', 'base-v3  /  docs-v2', ROLE.adapter],
  ['DEADLINE / OUTPUT CAP', 'Policy bound', ROLE.held],
];

export default function trustedEnvelope(s, c) {
  const pulse = s.value(0);
  const b0On = s.value(0);
  const idFieldsOn = s.value(0);
  const revFieldsOn = s.value(0);
  const b1On = s.value(0);
  const sigCheckOn = s.value(0);
  const spoofDeniedOn = s.value(0);
  const b2On = s.value(0);
  const localDenyOn = s.value(0);

  const stageAura = aura(0, -10, 760, '#60a5fa1c', '#a78bfa16');
  const header = cinemaHeader(
    'PROPAGATED REQUEST ENVELOPE',
    'Carry authority',
    'beyond the gateway',
    { x: -860, y: -450, accent: ROLE.A, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const idOk = idFieldsOn.value > 0.5 || b0On.value > 0.5;
      const revOk = revFieldsOn.value > 0.5;
      const b1 = b1On.value > 0.5;
      const sigOk = sigCheckOn.value > 0.5;
      const spoofDenied = spoofDeniedOn.value > 0.5;
      const b2 = b2On.value > 0.5;
      const locDeny = localDenyOn.value > 0.5;

      const nodes = [];

      // Signed envelope banner on top right
      nodes.push(
        rect(900, 82, { fill: '#0c162b', stroke: ROLE.A, width: 2.8, radius: 14 })
          .at(395, -395)
          .glow(7, ROLE.A),
        txt('SIGNED ENVELOPE: Alice -> Workspace A', 395, -395, 28, ROLE.A, 'mono', 'center'),
      );

      // 3x2 grid of immutable envelope fields
      ENVELOPE_FIELDS.forEach(([label, val, col], i) => {
        const colIdx = i % 3;
        const rowIdx = Math.floor(i / 3);
        const cx = -565 + colIdx * 565;
        const cy = -185 + rowIdx * 165;
        const active = i < 2 ? idOk : revOk || b1 || b2;
        nodes.push(
          rect(520, 126, {
            fill: '#0b1224',
            stroke: active ? col : '#263354',
            width: active ? 2.6 : 1.6,
            radius: 14,
          })
            .at(cx, cy)
            .glow(active ? 6 : 0, col),
          txt(label, cx - 228, cy - 26, 26, active ? col : COSMOS.muted, 'mono', 'left'),
          txt(
            active ? val : 'resolving...',
            cx - 228,
            cy + 24,
            30,
            active ? COSMOS.ink : COSMOS.dim,
            'mono',
            'left',
          ),
        );
      });

      // Lower interactive stage zone (y = 140 .. 430)
      if (b2) {
        // Beat 2: Downstream service credential & admin route enforcement
        const hops = [
          ['Gateway', -620, ROLE.A],
          ['Retrieval', -180, ROLE.shared],
          ['Worker', 260, ROLE.adapter],
          ['Admin API', 680, ROLE.focus],
        ];
        hops.forEach(([name, hx, col], idx) => {
          nodes.push(
            rect(300, 108, { fill: '#0d1528', stroke: col, width: 2.6, radius: 14 })
              .at(hx, 235)
              .glow(6, col),
            txt(name, hx, 214, 28, col, 'mono', 'center'),
            txt(
              idx === 3 ? 'Service auth' : 'Re-verifies grant',
              hx,
              258,
              26,
              COSMOS.muted,
              'sans',
              'center',
            ),
          );
          if (idx < 2) {
            nodes.push(
              beamWithPhotons(
                [
                  [hx + 154, 235],
                  [hops[idx + 1][1] - 154, 235],
                ],
                col,
                p + idx * 0.4,
                { width: 3.4, glow: 7, photonCount: 1 },
              ),
            );
          }
        });
        nodes.push(
          txt(
            locDeny
              ? 'Selecting B is denied before retrieval; grant changes propagate across every service.'
              : 'Every downstream boundary enforces its own scoped service credentials.',
            0,
            405,
            29,
            locDeny ? ROLE.fail : COSMOS.ink,
            'sans',
            'center',
          ),
        );
      } else if (b1) {
        // Beat 1: Signature checks + Untrusted JSON tenant: B blocked at shield
        nodes.push(
          txt(
            sigOk
              ? 'RECEIVER CHECKS:  Issuer  ·  Audience  ·  Expiry  ·  Operation'
              : 'SIGNATURE VERIFICATION IN PROGRESS',
            0,
            132,
            27,
            ROLE.focus,
            'mono',
            'center',
          ),

          // Left: Untrusted JSON body spoof
          rect(540, 118, { fill: '#220f19', stroke: ROLE.fail, width: 2.8, radius: 14 })
            .at(-540, 262)
            .glow(8, ROLE.fail),
          txt('UNTRUSTED REQUEST BODY', -780, 236, 26, ROLE.fail, 'mono', 'left'),
          txt('{ "tenant": "B" }', -780, 286, 32, COSMOS.ink, 'mono', 'left'),

          // Center shield wall
          line([-110, 185], [-110, 342], { stroke: ROLE.fail, width: 9 }).glow(10, ROLE.fail),
          beamWithPhotons(
            [
              [-265, 262],
              [-124, 262],
            ],
            ROLE.fail,
            p,
            { width: 4, glow: 8, photonCount: 1 },
          ),

          // Right: Retained trusted context
          rect(720, 118, { fill: '#0b1e1c', stroke: ROLE.ok, width: 2.8, radius: 14 })
            .at(440, 262)
            .glow(8, ROLE.ok),
          txt('RETAINED TRUSTED CONTEXT', 110, 236, 26, ROLE.ok, 'mono', 'left'),
          txt('Workspace A  /  Alice  (unchanged)', 110, 286, 30, COSMOS.ink, 'mono', 'left'),

          txt(
            spoofDenied
              ? 'Blocked: JSON cannot overwrite signed identity.'
              : 'A signature proves who signed bytes; receivers still verify permission.',
            0,
            412,
            29,
            spoofDenied ? ROLE.ok : COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else {
        // Beat 0: Pipeline overview beneath fields
        nodes.push(
          rect(1660, 112, { fill: '#0d1528', stroke: ROLE.shared, width: 2.4, radius: 14 }).at(
            0,
            255,
          ),
          txt(
            'ISSUER AUTHORITY  ->  SIGNED ENVELOPE  ->  WORKER DISPATCH',
            0,
            232,
            28,
            ROLE.shared,
            'mono',
            'center',
          ),
          txt(
            'Workers verify who issued the envelope and which operation it authorizes.',
            0,
            280,
            27,
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

  stepOn(s, c, 'mt-trusted-envelope-b0', b0On, 1);
  stepAfter(s, c, 'mt-trusted-envelope-s0-0', idFieldsOn, 1);
  stepAfter(s, c, 'mt-trusted-envelope-s0-1', revFieldsOn, 1);
  stepOn(s, c, 'mt-trusted-envelope-b1', b1On, 1);
  stepAfter(s, c, 'mt-trusted-envelope-s1-1', sigCheckOn, 1);
  stepOn(s, c, 'mt-trusted-envelope-s1-3', spoofDeniedOn, 1);
  stepOn(s, c, 'mt-trusted-envelope-b2', b2On, 1);
  stepAfter(s, c, 'mt-trusted-envelope-s2-1', localDenyOn, 1);
}
