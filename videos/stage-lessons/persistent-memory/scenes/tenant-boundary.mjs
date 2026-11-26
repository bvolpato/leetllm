// Scene 09: tenant-boundary
// Two tenants sharing username "Ada", PostgreSQL RLS role matrix, and pooled connection scope rebind.
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
  memNode,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function tenantBoundary(s, c) {
  const phase = s.value(0);
  const showSame = s.value(0);
  const showRls = s.value(0);
  const showBypass = s.value(0);
  const clearPool = s.value(0);
  const rebindPool = s.value(0);

  const header = cinemaHeader('TENANT ISOLATION', 'Two People Sign In', 'As Ada', {
    x: -860,
    y: -445,
    accent: ROLE.policy,
    size: 46,
  });

  const bgAuras = aura(0, 20, 680, '#5ce1e618', '#a78bfa1a');

  const visual = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const rls = showRls.value;
      const byp = showBypass.value;
      const clr = clearPool.value;
      const reb = rebindPool.value;

      const nodes = [];

      // Vertical isolation barrier (clean gap above & below)
      nodes.push(
        line([0, -250], [0, 60], { stroke: ROLE.fail, width: 4, dash: [14, 10] }).glow(
          8,
          ROLE.fail,
        ),
        txt('TENANT BOUNDARY', 0, -295, 26, ROLE.fail, 'mono', 'center'),
      );

      // Left tenant: billing / Ada
      const bActive = clr < 0.5;
      const bCol = bActive ? ROLE.prompt : COSMOS.muted;
      const billNode = memNode(-520, -100, 'billing / Ada', bCol, {
        radius: 86,
        sub: 'own replay + shared rule',
        size: 26,
      });
      nodes.push(billNode.node);

      // Right tenant: payments / Ada
      const pActive = reb > 0.5;
      const pCol = pActive ? ROLE.ok : ROLE.policy;
      const payNode = memNode(520, -100, 'payments / Ada', pCol, {
        radius: 86,
        sub: 'private payments incident',
        size: 26,
      });
      nodes.push(payNode.node);

      // Top-right PostgreSQL RLS policy readout
      const rlsY = -435;
      nodes.push(
        txt('POSTGRESQL ROW SECURITY', 480, rlsY, 26, ROLE.score, 'mono', 'center'),
        txt('ordinary role -> RLS enforced', 480, rlsY + 46, 26, ROLE.ok, 'mono', 'center'),
        txt(
          rls > 0.5 ? 'table owner -> needs FORCE RLS' : 'table owner -> bypasses by default',
          480,
          rlsY + 90,
          26,
          rls > 0.5 ? ROLE.pending : COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          byp > 0.5 ? 'SUPERUSER / BYPASSRLS -> bypasses!' : 'grant check runs in trusted service',
          480,
          rlsY + 134,
          26,
          byp > 0.5 ? ROLE.fail : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom pooled connection rig (floating cinema rails, zero card chrome)
      const poolX = 0;
      const poolY = 235;
      let poolScope = 'SCOPE: tenant = billing';
      let poolResult = 'returns: billing replay + shared retry rule';
      let poolCol = ROLE.prompt;

      if (reb > 0.5) {
        poolScope = 'SCOPE: tenant = payments';
        poolResult = 'returns: ONLY Payments Ada permitted rows';
        poolCol = ROLE.ok;
      } else if (clr > 0.5) {
        poolScope = 'SCOPE: CLEARED (NULL)';
        poolResult = 'unbound connection -> 0 private rows';
        poolCol = ROLE.score;
      }

      nodes.push(
        line([-440, poolY - 82], [440, poolY - 82], { stroke: poolCol, width: 3 }).glow(8, poolCol),
        txt(
          'REUSED DATABASE CONNECTION POOL',
          poolX,
          poolY - 42,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt(poolScope, poolX, poolY + 12, 32, poolCol, 'mono', 'center').glow(6, poolCol),
        txt(poolResult, poolX, poolY + 66, 26, COSMOS.ink, 'mono', 'center'),
      );

      // Active routing beam from active tenant inner side into connection pool (clear of sub labels)
      const leftExit = [-520 + billNode.r + 16, -68];
      const rightExit = [520 - payNode.r - 16, -68];
      const leftEntry = [-180, poolY - 92];
      const rightEntry = [180, poolY - 92];
      if (reb > 0.5) {
        nodes.push(
          beamWithPhotons([rightExit, rightEntry], ROLE.ok, p, { width: 4, photonCount: 2 }),
        );
      } else if (clr < 0.5) {
        nodes.push(
          beamWithPhotons([leftExit, leftEntry], ROLE.prompt, p, { width: 4, photonCount: 2 }),
        );
      } else {
        nodes.push(
          line(leftExit, leftEntry, { stroke: COSMOS.muted, width: 2.5, dash: [10, 10] }),
          line(rightExit, rightEntry, { stroke: COSMOS.muted, width: 2.5, dash: [10, 10] }),
        );
      }

      nodes.push(
        txt(
          'stored text is historical data; re-check policy on every action',
          0,
          395,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      const dotX = -760 + ((p * 120) % 240);
      nodes.push(glowDot(dotX, 445, { radius: 4.5, color: poolCol, glow: 8, opacity: 0.7 }));

      return group(...nodes);
    },
  );

  s.add(bgAuras, header, visual);
  driftValue(s, c, phase, 4.0);

  c.on('same-username', () => {
    s.play(showSame.to(1, { duration: clampDur(c, c.cue('same-username').start, 0.4) }));
  });
  c.on('rls-owner', () => {
    s.play(showRls.to(1, { duration: clampDur(c, c.cue('rls-owner').start, 0.4) }));
  });
  c.on('rls-bypass', () => {
    s.play(showBypass.to(1, { duration: clampDur(c, c.cue('rls-bypass').start, 0.4) }));
  });
  c.on('pool-clear', () => {
    s.play(clearPool.to(1, { duration: clampDur(c, c.cue('pool-clear').start, 0.4) }));
  });
  c.on('pool-rebind', () => {
    s.play(rebindPool.to(1, { duration: clampDur(c, c.cue('pool-rebind').start, 0.45) }));
  });
}
