// Scene 26: digest-identities - Preserve each service identity through validation
// Act 0 (Beats 0-1): Service catalog verification for auth-api (healthy), vector-indexer (degraded),
// report-worker (unknown status AND missing from catalog -> review unknown name!), plus empty
// mentions array {"mentions": []} accepted separately.
// Act 1 (Beat 2): Conflicting duplicate auth-api entries (healthy + outage): Dict conversion silently
// lets last entry win vs Identity gate inspects original array and REJECTS the duplicate!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  digestIdentity,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  fsmNode,
  guardedDynamic,
  opticalRail,
  quadArcPts,
  txt,
} from '../parts.mjs';

const CATALOG = ['auth-api', 'vector-indexer'];
const MENTIONS_3 = [
  { service: 'auth-api', status: 'healthy' },
  { service: 'vector-indexer', status: 'degraded' },
  { service: 'report-worker', status: 'unknown' },
];
const DUP_RES = digestIdentity(
  [
    { service: 'auth-api', status: 'healthy' },
    { service: 'auth-api', status: 'outage' },
  ],
  CATALOG,
);

export default function digestIdentities(s, c) {
  const pulse = s.value(0);
  const b0Hi = s.value(0);
  const unknownFlag = s.value(0);
  const b1Hi = s.value(0);
  const emptyOk = s.value(0);
  const act = s.value(0); // 0 = 3 services + empty array, 1 = duplicate auth-api
  const lastWins = s.value(0);
  const dupReject = s.value(0);

  const header = cinemaHeader(
    'SERVICE IDENTITY INTEGRITY',
    'Preserve each service',
    'identity through validation',
    { accent: ROLE.fsm, size: 48 },
  );

  const stageAura = aura(200, 40, 640, '#5ce1e61f', '#ff6b8b16');

  // Act 0: Catalog check + separate empty digest
  const act0 = guardedDynamic(
    () => fadeOutHalf(act.value),
    (a) => {
      const b0 = b0Hi.value;
      const uf = unknownFlag.value;
      const b1 = b1Hi.value;
      const eo = emptyOk.value;
      const nodes = [];

      nodes.push(
        txt('SERVICE NAME', -830, -210, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('PROPOSED STATUS', -260, -210, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('CATALOG CHECK', 240, -210, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        line([-840, -178], [840, -178], { stroke: '#25355a', width: 2 }).opacity(a),
      );

      MENTIONS_3.forEach((m, i) => {
        const y = -98 + i * 112;
        const inCat = CATALOG.includes(m.service);
        const col = inCat ? ROLE.legal : uf > 0.3 ? ROLE.review : ROLE.prefix;
        nodes.push(
          opticalRail(-840, y - 38, y + 38, col, { opacity: a }),
          txt(m.service, -805, y, 36, inCat ? COSMOS.ink : ROLE.review, 'mono', 'left')
            .glow(!inCat && uf > 0.3 ? 7 : 0, ROLE.review)
            .opacity(a),
          txt(
            m.status,
            -260,
            y,
            34,
            i === 0 ? ROLE.legal : i === 1 ? ROLE.prefix : COSMOS.muted,
            'mono',
            'left',
          ).opacity(a),
          txt(
            inCat ? 'IN CATALOG' : uf > 0.3 ? 'NOT IN CATALOG -> REVIEW' : 'checking catalog...',
            240,
            y,
            30,
            col,
            'mono',
            'left',
          )
            .glow(!inCat && uf > 0.3 ? 8 : 0, ROLE.review)
            .opacity(a),
        );
      });

      // Bottom empty-mentions strip
      nodes.push(line([-840, 200], [840, 200], { stroke: '#25355a', width: 2 }).opacity(a));
      if (eo > 0.05) {
        nodes.push(
          opticalRail(-840, 240, 330, ROLE.legal, { opacity: a * eo }),
          txt('EMPTY REPORT:  {"mentions": []}', -805, 264, 34, ROLE.legal, 'mono', 'left')
            .glow(7, ROLE.legal)
            .opacity(a * eo),
          txt(
            'ACCEPTED BY CONTRACT · CHECK OMISSIONS SEPARATELY',
            -805,
            318,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(a * eo),
        );
      } else {
        nodes.push(
          txt(
            b1 > 0.3
              ? 'Unknown status != unknown service name'
              : 'Validate service names against the catalog',
            -840,
            290,
            28,
            b0 > 0.3 ? COSMOS.ink : COSMOS.muted,
            'serif',
            'left',
          ).opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  // Act 1: Conflicting duplicate auth-api entries (Dict overwrite vs Array identity gate)
  const act1 = guardedDynamic(
    () => fadeInHalf(act.value),
    (a) => {
      const p = pulse.value;
      const lw = lastWins.value;
      const dr = dupReject.value;
      const nodes = [];

      nodes.push(
        txt(
          'CONFLICTING DUPLICATE ENTRIES IN ORIGINAL ARRAY',
          -840,
          -210,
          26,
          ROLE.prune,
          'mono',
          'left',
        ).opacity(a),
      );

      // Left: Original array preserving both entries
      nodes.push(
        opticalRail(-840, -135, 35, ROLE.schema, { opacity: a }),
        txt('ORIGINAL ARRAY', -805, -118, 26, ROLE.schema, 'mono', 'left').opacity(a),
        txt(
          '0: { service: "auth-api", status: "healthy" }',
          -805,
          -52,
          28,
          ROLE.legal,
          'mono',
          'left',
        ).opacity(a),
        txt(
          '1: { service: "auth-api", status: "outage"  }',
          -805,
          10,
          28,
          ROLE.prune,
          'mono',
          'left',
        ).opacity(a),
      );

      // Right top: Naive dict conversion silently drops healthy -> outage!
      nodes.push(
        beamWithPhotons(quadArcPts([35, -55], [225, -55], -22), ROLE.review, p * 1.1, {
          alpha: a * (0.4 + 0.6 * lw),
          width: 3.2,
          photonCount: lw > 0.2 ? 1 : 0,
        }),
        opticalRail(255, -135, 35, lw > 0.3 ? ROLE.review : COSMOS.dim, { opacity: a }),
        txt('DICT CONVERSION', 290, -118, 26, ROLE.review, 'mono', 'left').opacity(a),
        txt(
          lw > 0.3 ? 'auth-api -> "outage"' : 'same key collides...',
          290,
          -52,
          32,
          lw > 0.3 ? ROLE.review : COSMOS.dim,
          'mono',
          'left',
        )
          .glow(lw > 0.3 ? 8 : 0, ROLE.review)
          .opacity(a),
        txt(
          lw > 0.3 ? '"healthy" silently overwritten' : '',
          290,
          10,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a * lw),
      );

      // Bottom: Identity gate on original array -> REJECT duplicate!
      nodes.push(
        line([-840, 105], [840, 105], { stroke: '#25355a', width: 2 }).opacity(a),
        fsmNode(-720, 225, 62, dr > 0.3 ? 'REJECT' : 'CHECK', {
          color: dr > 0.3 ? ROLE.prune : ROLE.fsm,
          size: 26,
          opacity: a,
        }),
        txt(
          dr > 0.3
            ? `ARRAY IDENTITY GATE: DUPLICATE "${DUP_RES.duplicates[0]}" -> REJECT`
            : 'Check identities on the original list before building a map',
          -620,
          205,
          32,
          dr > 0.3 ? ROLE.prune : COSMOS.ink,
          'mono',
          'left',
        )
          .glow(dr > 0.3 ? 9 : 0, ROLE.prune)
          .opacity(a),
        txt(
          'Use timestamps or live telemetry to establish current state, never array position',
          -620,
          268,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1);
  driftValue(s, c, pulse, 5.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('sg-digest-identities-0', () => {
    s.play(b0Hi.to(1, { duration: clampDur(c, c.cue('sg-digest-identities-0').start, 0.35) }));
  });
  c.on('sg-digest-unknown', () => {
    s.play(unknownFlag.to(1, { duration: clampDur(c, c.cue('sg-digest-unknown').start, 0.4) }));
  });
  c.on('sg-digest-identities-1', () => {
    s.play(b1Hi.to(1, { duration: clampDur(c, c.cue('sg-digest-identities-1').start, 0.35) }));
  });
  c.on('sg-empty-digest', () => {
    s.play(emptyOk.to(1, { duration: clampDur(c, c.cue('sg-empty-digest').start, 0.4) }));
  });
  c.on('sg-digest-identities-2', () => {
    s.play(act.to(1, { duration: clampDur(c, c.cue('sg-digest-identities-2').start, 0.4) }));
  });
  c.on('sg-digest-last-wins', () => {
    s.play(lastWins.to(1, { duration: clampDur(c, c.cue('sg-digest-last-wins').start, 0.4) }));
  });
  c.on('sg-digest-duplicate', () => {
    s.play(dupReject.to(1, { duration: clampDur(c, c.cue('sg-digest-duplicate').start, 0.4) }));
  });
}
