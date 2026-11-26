// Scene 10: scoped-read - Deny a cross-project read without returning another project's row
// Project Isolation Optical Partition (`ads` vs `search`) funneling BOTH cross-project and
// missing release queries into the identical `not_found_or_not_authorized` outward beam.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  circuitBreaker,
  clampDur,
  driftValue,
  energyRail,
  guardedDynamic,
  hexGate,
  quadArcPts,
  scopedReleaseRead,
  txt,
} from '../parts.mjs';

export default function scopedRead(s, c) {
  const pulse = s.value(0);
  const scopeCheckOn = s.value(0);
  const uniformOn = s.value(0);
  const noPayloadOn = s.value(0);
  const liveOwnerOn = s.value(0);
  const recheckOn = s.value(0);

  const foreignRes = scopedReleaseRead({ project_id: 'ads' }, 'reranker-v16');
  const missingRes = scopedReleaseRead({ project_id: 'ads' }, 'reranker-v99');

  const header = cinemaHeader(
    'TENANT & IDOR ISOLATION',
    'Deny cross-project reads',
    'with a uniform response',
    { accent: ROLE.denied, size: 48 },
  );

  const stageAura = aura(120, 30, 620, '#ff6b8b1c', '#a78bfa1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const sc = scopeCheckOn.value;
      const uf = uniformOn.value;
      const np = noPayloadOn.value;
      const lo = liveOwnerOn.value;
      const rc = recheckOn.value;
      const nodes = [];

      // Left: Trusted Session `ads` + two schema-valid queries
      nodes.push(
        energyRail(-855, -210, -70, ROLE.session),
        txt('TRUSTED SESSION', -825, -190, 26, ROLE.session, 'mono', 'left'),
        txt('session.project_id = "ads"', -825, -135, 30, COSMOS.ink, 'mono', 'left'),
        txt('Never read tenant from model args', -825, -86, 26, COSMOS.muted, 'sans', 'left'),
      );

      // Query 1: Cross-project release (`reranker-v16`, owned by `search`)
      const y1 = 40;
      const y2 = 220;
      nodes.push(
        energyRail(-855, y1 - 40, y1 + 44, ROLE.denied),
        txt('QUERY A: reranker-v16', -825, y1 - 20, 28, COSMOS.ink, 'mono', 'left'),
        txt('Resolved owner: "search" != "ads"', -825, y1 + 26, 26, ROLE.denied, 'mono', 'left'),
        beamWithPhotons(
          [
            [-320, y1],
            [-75, y1],
          ],
          ROLE.denied,
          p * 1.1,
          { alpha: 0.45 + sc * 0.55, width: 3.4 },
        ),
        circuitBreaker(0, y1, 105, 1, ROLE.ok),
      );

      // Query 2: Missing release (`reranker-v99`)
      const uOp = 0.35 + uf * 0.65;
      nodes.push(
        energyRail(-855, y2 - 40, y2 + 44, ROLE.caution, { opacity: uOp }),
        txt('QUERY B: reranker-v99', -825, y2 - 20, 28, COSMOS.ink, 'mono', 'left').opacity(uOp),
        txt(
          'Resolved row: NONE (missing)',
          -825,
          y2 + 26,
          26,
          ROLE.caution,
          'mono',
          'left',
        ).opacity(uOp),
        beamWithPhotons(
          [
            [-320, y2],
            [-75, y2],
          ],
          ROLE.caution,
          p * 1.1 + 0.45,
          { alpha: uOp, width: 3.4 },
        ),
        circuitBreaker(0, y2, 105, 1, ROLE.ok, { opacity: uOp }),
      );

      // Center-right: Uniform Outward Denial Sink vs Private Internal Audit Log
      nodes.push(
        beamWithPhotons(quadArcPts([72, y1], [275, 125], -22), ROLE.denied, p * 1.2, {
          alpha: 0.45 + uf * 0.55,
          width: 3.4,
        }),
        beamWithPhotons(quadArcPts([72, y2], [275, 125], 22), ROLE.denied, p * 1.2 + 0.5, {
          alpha: uOp,
          width: 3.4,
        }),
        hexGate(360, 125, 78, ROLE.denied, { label: 'DENY', glow: 12 }),
        energyRail(470, 25, 225, ROLE.denied),
        txt('PUBLIC MODEL OBSERVATION', 500, 48, 26, ROLE.denied, 'mono', 'left'),
        txt(foreignRes.error, 500, 102, 26, COSMOS.ink, 'mono', 'left').glow(6, ROLE.denied),
        txt(
          np > 0.35 && foreignRes.error === missingRes.error
            ? 'Identical code · ZERO release fields'
            : 'No status or owner leaked',
          500,
          154,
          26,
          ROLE.focus,
          'sans',
          'left',
        ),
        txt(
          'Test timing & other endpoints too',
          500,
          202,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(uOp),
      );

      // Top-right: Private Audit Partition (stays behind wall, never enters model)
      nodes.push(
        energyRail(200, -345, -135, ROLE.runtime),
        txt('PRIVATE OPERATOR AUDIT LOG', 230, -325, 26, ROLE.runtime, 'mono', 'left'),
        txt('Query A -> cross_project_denied (search)', 230, -268, 26, COSMOS.ink, 'mono', 'left'),
        txt('Query B -> release_not_found', 230, -214, 26, COSMOS.muted, 'mono', 'left'),
        txt('Exact cause kept strictly internal', 230, -162, 26, ROLE.ok, 'sans', 'left'),
      );

      // Bottom rule: Live ownership recheck on every request
      const lOp = 0.4 + lo * 0.6;
      nodes.push(
        line([-855, 345], [840, 345], { stroke: '#25355a', width: 2 }).opacity(lOp),
        txt(
          rc > 0.35
            ? 'RECHECK LIVE OWNERSHIP ON EVERY CALL (EVEN AFTER DISCOVERY OR PRIOR READ)'
            : 'SCHEMA VALIDATION NEVER ESTABLISHES RESOURCE OWNERSHIP',
          0,
          395,
          26,
          rc > 0.35 ? ROLE.focus : ROLE.runtime,
          'mono',
          'center',
        )
          .glow(rc > 0.35 ? 7 : 3, rc > 0.35 ? ROLE.focus : ROLE.runtime)
          .opacity(lOp),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('tu-scoped-read-1', () => {
    s.play(pulse.to(0.35, { duration: clampDur(c, c.cue('tu-scoped-read-1').start, 0.25) }));
  });
  c.on('tu-read-resolved-scope', () => {
    s.play(
      scopeCheckOn.to(1, { duration: clampDur(c, c.cue('tu-read-resolved-scope').start, 0.35) }),
    );
  });
  c.on('tu-scoped-read-2', () => {
    s.play(uniformOn.to(1, { duration: clampDur(c, c.cue('tu-scoped-read-2').start, 0.35) }));
  });
  c.on('tu-read-uniform-denial', () => {
    s.play(
      noPayloadOn.to(1, { duration: clampDur(c, c.cue('tu-read-uniform-denial').start, 0.35) }),
    );
  });
  c.on('tu-scoped-read-3', () => {
    s.play(liveOwnerOn.to(1, { duration: clampDur(c, c.cue('tu-scoped-read-3').start, 0.35) }));
  });
  c.on('tu-read-current-owner', () => {
    s.play(recheckOn.to(1, { duration: clampDur(c, c.cue('tu-read-current-owner').start, 0.35) }));
  });
}
