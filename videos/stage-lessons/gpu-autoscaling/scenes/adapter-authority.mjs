// Scene 36: adapter-authority - Select an immutable adapter from authenticated membership
// Multi-tenant shared-base LoRA authority pipeline:
//   Beat 0: Authenticated Alice -> Tenant A Membership -> Approved Adapter #101 on Base v7 (200).
//   Beat 1: Revoke Alice's membership / spoofed tenant header / wrong base -> DENY (403).
//   Beat 2: Engine receives approved adapter ID + per-tenant cache_salt isolating prefixes, tools & logs.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  driftValue,
  glowDot,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function adapterAuthority(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1=Alice auth, 2=adapter 101 selected, 3=revoke Alice, 4=DENIED, 5=engine + cache_salt isolation

  const header = cinemaHeader(
    'MULTI-TENANT LORA AUTHORITY',
    'Immutable adapter from',
    'verified membership',
    {
      x: -860,
      y: -420,
      accent: ROLE.adapter,
      size: 52,
    },
  );

  const bgAura = aura(150, 40, 660, '#a78bfa22', '#6ee7b71a');

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const p = phase.value;
      const revoked = st >= 2.5 && st < 4.5;
      const denied = st >= 3.5 && st < 4.5;
      const yPipe = -110;
      const nodes = [];

      // Three-stage Authority Chain across upper canvas
      const pipe = [
        { x: -640, title: 'Gateway Auth', sub: 'Principal: Alice', col: ROLE.active },
        {
          x: 0,
          title: 'Membership Check',
          sub: revoked ? 'Tenant A: REVOKED' : 'Tenant A: ACTIVE',
          col: revoked ? ROLE.expired : ROLE.warm,
        },
        {
          x: 640,
          title: 'Approved Registry',
          sub: 'Base v7 · Immutable',
          col: ROLE.focus,
        },
      ];

      for (let i = 0; i < pipe.length; i++) {
        const nd = pipe[i];
        if (i < pipe.length - 1) {
          const bCol = revoked && i === 1 ? ROLE.expired : nd.col;
          nodes.push(
            beamWithPhotons(
              [
                [nd.x + 215, yPipe],
                [pipe[i + 1].x - 215, yPipe],
              ],
              bCol,
              p * 0.9,
              { width: 3.6, glow: 9, photonCount: 1 },
            ),
          );
        }
        nodes.push(
          rect(420, 118, { fill: '#111b33', stroke: nd.col, width: 2.8, radius: 16 })
            .at(nd.x, yPipe)
            .glow(8, nd.col),
          txt(nd.title, nd.x, yPipe - 18, 28, nd.col, 'mono'),
          txt(nd.sub, nd.x, yPipe + 24, 26, COSMOS.ink, 'sans'),
        );
      }

      // Beat 0: Approved Adapter #101 Selected (floating cinema readout)
      if (st >= 1.5 && st < 2.5) {
        nodes.push(
          beamWithPhotons(
            [
              [640, yPipe + 62],
              [0, 118],
            ],
            ROLE.warm,
            p * 1.0,
            { width: 3.8, glow: 10, photonCount: 2 },
          ),
          txt('200 APPROVED:  ADAPTER #101  ·  BASE v7', 0, 168, 34, ROLE.warm, 'mono').glow(
            9,
            ROLE.warm,
          ),
          txt(
            'Shared base weights in HBM  ·  Tenant B uses its own adapter',
            0,
            232,
            28,
            COSMOS.ink,
            'sans',
          ),
        );
      }

      // Beat 1: Revoked Membership + Rejections (403)
      if (revoked) {
        const failCases = [
          { x: -640, label: 'Revoked Alice', res: denied ? '403 DENY' : 'CHECKING...' },
          { x: -210, label: 'Raw X-Tenant Header', res: '403 IGNORED' },
          { x: 220, label: 'Wrong Base v6', res: '403 DENY' },
          { x: 645, label: 'Missing Adapter', res: 'ERROR' },
        ];
        for (const fc of failCases) {
          nodes.push(
            glowDot(fc.x, 120, { radius: 10, color: ROLE.expired, glow: 12 }),
            txt(fc.label, fc.x, 168, 26, COSMOS.ink, 'sans'),
            txt(fc.res, fc.x, 218, 28, ROLE.expired, 'mono').glow(7, ROLE.expired),
          );
        }
        nodes.push(
          txt(
            'Never trust raw client headers or paths  ·  Resolve strictly from gateway auth',
            0,
            365,
            28,
            ROLE.focus,
            'sans',
          ),
        );
      }

      // Beat 2: Engine dispatch + Per-tenant cache_salt isolation (floating cinema readout)
      if (st >= 4.5) {
        nodes.push(
          txt(
            'ENGINE RECEIVES:  name · ID #101 · path · salt:tenantA:101',
            0,
            128,
            30,
            ROLE.adapter,
            'mono',
          ).glow(8, ROLE.adapter),
          txt(
            'Apply tenant isolation across prefixes, prompts, retrieval, tools, logs & caches',
            0,
            198,
            26,
            COSMOS.ink,
            'sans',
          ),
          txt(
            'One resident base model  ·  Strict cryptographic tenant boundaries',
            0,
            355,
            28,
            ROLE.warm,
            'sans',
          ).glow(6, ROLE.warm),
        );
      } else if (st < 1.5) {
        nodes.push(
          txt(
            'Shared-base LoRA serves multiple tenants off one resident base model',
            0,
            215,
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
  driftValue(s, c, phase, 6.0, { startOffset: 0.1, endMargin: 0.5 });

  tweenOn(s, c, 'ga-adapter-authority-b0', step, 1, 0.3);
  tweenOn(s, c, 'ga-adapter-selected', step, 2, 0.3);
  tweenOn(s, c, 'ga-adapter-authority-b1', step, 3, 0.3);
  tweenOn(s, c, 'ga-adapter-revoked', step, 4, 0.3);
  tweenOn(s, c, 'ga-adapter-authority-b2', step, 5, 0.35);
}
