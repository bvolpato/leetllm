// Scene 15: cache-compatibility - Matching text and allowed reuse answer different questions
// Composite KV cache identity (token IDs + positions + model/adapter rev + cache config + tenant ACL),
// showing adapter mismatch breaks numerical compatibility while cross-tenant breaks authorization!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function cacheCompatibility(s, c) {
  const phase = s.value(0);
  const adapterBreak = s.value(0);
  const tenantBreak = s.value(0);
  const fallbackMiss = s.value(0);

  const header = cinemaHeader(
    'PREFIX CACHE IDENTITY & ACL',
    'Matching text !=',
    'allowed cache reuse',
    {
      x: -860,
      y: -445,
      accent: ROLE.policy,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#a78bfa1a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const ad = adapterBreak.value;
      const tn = tenantBreak.value;
      const fb = fallbackMiss.value;
      const nodes = [];

      // Left: Numerical Compatibility Key
      const lx = -840;
      nodes.push(
        txt('1. NUMERICAL COMPATIBILITY KEY', lx, -185, 26, ROLE.req, 'mono', 'left'),
        txt('· Exact token IDs & positions', lx, -125, 26, COSMOS.ink, 'mono', 'left'),
        txt(
          '· Base model + LoRA adapter revision',
          lx,
          -72,
          26,
          ad > 0.4 ? ROLE.fail : COSMOS.ink,
          'mono',
          'left',
        ),
        txt('· Relevant KV cache configuration', lx, -19, 26, COSMOS.ink, 'mono', 'left'),
        txt(
          ad > 0.4
            ? 'NEW ADAPTER -> OLD KV TENSORS INVALID!'
            : 'Different tokenizer -> different KV state',
          lx,
          50,
          26,
          ad > 0.4 ? ROLE.fail : COSMOS.muted,
          'mono',
          'left',
        ),
      );

      // Right: Authorization & Deletion Scope
      const rx = 100;
      const tAlpha = 0.4 + tn * 0.6;
      nodes.push(
        line([45, -210], [45, 90], { stroke: '#2c3d66', width: 2.5 }),
        txt('2. TENANT & AUTHORIZATION SCOPE', rx, -185, 26, ROLE.focus, 'mono', 'left').opacity(
          tAlpha,
        ),
        txt(
          '· Tenant + current grant in lookup key',
          rx,
          -125,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(tAlpha),
        txt('· Same text != cross-tenant reuse!', rx, -72, 26, ROLE.fail, 'mono', 'left').opacity(
          tAlpha,
        ),
        txt('· Propagate delete & revoke to:', rx, -19, 26, ROLE.warn, 'mono', 'left').opacity(
          tAlpha,
        ),
        txt(
          '  cached answers · RAG · traces · index',
          rx,
          34,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(tAlpha),
      );

      // Bottom: Hosted fallback route miss caveat
      const fAlpha = 0.4 + fb * 0.6;
      nodes.push(
        line([-840, 145], [840, 145], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'HOSTED FALLBACK & ISOLATION CONTRACT',
          0,
          205,
          26,
          ROLE.policy,
          'mono',
          'center',
        ).opacity(fAlpha),
        txt(
          'Fallback route does NOT carry old cache hits -> recomputes prefill & changes billing!',
          0,
          262,
          26,
          fb > 0.4 ? ROLE.warn : COSMOS.ink,
          'mono',
          'center',
        ).opacity(fAlpha),
        txt(
          'Your service ALWAYS owns entitlement, current grants & safe handling of private outputs',
          0,
          320,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(fAlpha),
        txt('TWO INDEPENDENT CHECKS', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Math Match  AND  Current Access', 480, -378, 26, ROLE.ok, 'mono', 'center'),
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
  driftValue(s, c, phase, 4.2);

  c.on('sd-cache-compatibility-0-result', () => {
    s.play(
      adapterBreak.to(1, {
        duration: clampDur(c, c.cue('sd-cache-compatibility-0-result').start, 0.35),
      }),
    );
  });
  c.on('sd-cache-compatibility-1-operation', () => {
    s.play(
      tenantBreak.to(1, {
        duration: clampDur(c, c.cue('sd-cache-compatibility-1-operation').start, 0.4),
      }),
    );
  });
  c.on('sd-cache-compatibility-2-operation', () => {
    s.play(
      fallbackMiss.to(1, {
        duration: clampDur(c, c.cue('sd-cache-compatibility-2-operation').start, 0.4),
      }),
    );
  });
}
