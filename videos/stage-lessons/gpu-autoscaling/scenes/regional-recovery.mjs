// Scene 35: regional-recovery - Verify a compatible ready destination before routing failover
// Luminous dual-region failover bridge: Region A (Failed) -> Compatibility & Budget Gate -> Region B (Ready),
// isolating in-flight streams while checking model, tokenizer, adapter, retrieval, safety, quota & warm capacity.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  glowDot,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function regionalRecovery(s, c) {
  const step = s.value(0); // 1=parity checklist, 2=in-flight contract, quota & tested RTO

  const header = cinemaHeader('REGIONAL FAILOVER & RTO', 'Verify ready parity', 'before failover', {
    x: -860,
    y: -420,
    accent: ROLE.active,
    size: 52,
  });

  const bgAura = aura(150, 40, 660, '#ff6b8b1a', '#6ee7b71e');

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const yHub = -125;
      const nodes = [];

      // Region A (Failed) -> Gate -> Region B (Healthy / Allowed)
      nodes.push(
        rect(430, 120, { fill: '#2a1320', stroke: ROLE.expired, width: 2.8, radius: 16 })
          .at(-625, yHub)
          .glow(8, ROLE.expired),
        txt('REGION A · FAILED', -625, yHub - 18, 28, ROLE.expired, 'mono'),
        txt('In-flight keeps own contract', -625, yHub + 24, 26, COSMOS.muted, 'sans'),

        beamWithPhotons(
          [
            [-405, yHub],
            [-195, yHub],
          ],
          ROLE.focus,
          0,
          { width: 3.6, glow: 9, photonCount: 1 },
        ),

        rect(380, 120, { fill: '#152038', stroke: ROLE.focus, width: 2.8, radius: 16 })
          .at(0, yHub)
          .glow(9, ROLE.focus),
        txt('FAILOVER GATE', 0, yHub - 18, 28, ROLE.focus, 'mono'),
        txt('New / retryable only', 0, yHub + 24, 26, COSMOS.ink, 'sans'),

        beamWithPhotons(
          [
            [195, yHub],
            [405, yHub],
          ],
          ROLE.warm,
          0,
          { width: 3.6, glow: 9, photonCount: 1 },
        ),

        rect(430, 120, { fill: '#0e2a25', stroke: ROLE.warm, width: 2.8, radius: 16 })
          .at(625, yHub)
          .glow(9, ROLE.warm),
        txt('REGION B · READY', 625, yHub - 18, 28, ROLE.warm, 'mono'),
        txt('Allowed tenant + warm GPUs', 625, yHub + 24, 26, COSMOS.ink, 'sans'),
      );

      // Four Parity Verification Rails below the bridge
      const checks = [
        {
          x: -645,
          title: 'Release Parity',
          desc: 'Model · tokenizer · template',
          col: ROLE.active,
        },
        { x: -215, title: 'Data & Policy', desc: 'Adapter · retrieval · safety', col: ROLE.decode },
        { x: 215, title: 'Tenant Scope', desc: 'Data residency · tools · auth', col: ROLE.focus },
        { x: 645, title: 'Live Supply', desc: 'Quota · artifacts · warm GPUs', col: ROLE.warm },
      ];
      for (const ch of checks) {
        nodes.push(
          glowDot(ch.x, 45, { radius: 10, color: ch.col, glow: 12 }),
          txt(ch.title, ch.x, 92, 28, ch.col, 'mono'),
          txt(ch.desc, ch.x, 140, 26, COSMOS.ink, 'sans'),
        );
      }

      if (st >= 1.5) {
        nodes.push(
          txt(
            'Regional spot loss can exhaust recovery capacity  ·  Test quota, cancellation & resumption under load',
            0,
            275,
            26,
            ROLE.focus,
            'sans',
          ).glow(6, ROLE.focus),
          txt(
            'Real RTO links secondary supply & readiness to remaining client deadline, not a routing arrow',
            0,
            355,
            26,
            ROLE.warm,
            'sans',
          ),
        );
      } else {
        nodes.push(
          txt(
            'Matching a model name alone never guarantees release parity or ready GPU capacity',
            0,
            315,
            28,
            COSMOS.muted,
            'sans',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);

  tweenOn(s, c, 'ga-regional-recovery-b0', step, 1, 0.35);
  tweenOn(s, c, 'ga-regional-recovery-b1', step, 2, 0.35);
}
