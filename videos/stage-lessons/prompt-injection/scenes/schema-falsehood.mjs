// Scene 9: schema-falsehood - A valid shape can describe the wrong evidence
// 3-barrier verification gauntlet (1. Shape -> 2. Facts -> 3. Authz): a schema-valid lie
// (`gate: "passed"` while source says `"failed"`) clears Barrier 1 and slams into Barrier 2
// (`source-mismatch`), plus clipped-quote condition loss and immutable revision pinning.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  PI_SOURCE,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  glowDot,
  guardedDynamic,
  hexGate,
  quadArcPts,
  txt,
  typedEvidenceDecision,
} from '../parts.mjs';

export default function schemaFalsehood(s, c) {
  const pulse = s.value(0);
  const lieReject = s.value(0);
  const quoteStale = s.value(0);
  const threeOps = s.value(0);

  const lieDecision = typedEvidenceDecision(
    { candidate: 'C17', suite: 'R42', gate: 'passed' },
    { ...PI_SOURCE, gate: 'failed' },
  );

  const header = cinemaHeader(
    'SCHEMA vs TRUTH vs PERMISSION',
    'A valid shape can describe',
    'the wrong evidence',
    { accent: ROLE.attack, size: 48 },
  );

  const stageAura = aura(80, 40, 640, '#ff6b8b1a', '#5ce1e61a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const lr = lieReject.value;
      const qs = quoteStale.value;
      const to = threeOps.value;
      const nodes = [];

      // Top 3-barrier optical gauntlet with clean clearance below top labels
      const gY = -58;
      const g1X = -430;
      const g2X = 50;
      const g3X = 530;

      nodes.push(
        txt('RECORD: { C17, R42, gate: "passed" }', -855, -225, 26, ROLE.untrusted, 'mono', 'left'),
        txt('AUTHORITATIVE SOURCE: gate = "failed"', 845, -225, 26, ROLE.attack, 'mono', 'right'),
      );

      // Beams trimmed cleanly outside compact hex gates (r <= 105)
      const b0 = quadArcPts([-840, gY], [g1X - 115, gY], 0, 16);
      const b1 = quadArcPts([g1X + 115, gY], [g2X - 115, gY], 0, 18);
      const b2 = quadArcPts([g2X + 115, gY], [g3X - 115, gY], 0, 18);

      nodes.push(
        beamWithPhotons(b0, ROLE.ok, p * 1.1, { width: 3.4 }),
        beamWithPhotons(b1, lr > 0.3 ? ROLE.attack : ROLE.untrusted, p * 1.1 + 0.35, {
          width: 3.4,
        }),
        line(b2[0], b2.at(-1), {
          stroke: to > 0.3 ? ROLE.host : '#2a3a62',
          width: 2.6,
          dash: [8, 8],
        }).opacity(0.75),
      );

      nodes.push(
        hexGate(g1X, gY, 58, ROLE.ok, {
          label: '1. SHAPE',
          sub: 'TYPES VALID (PASS)',
          glow: 9,
        }),
        hexGate(g2X, gY, 58, lr > 0.2 ? ROLE.denied : ROLE.untrusted, {
          label: '2. FACTS',
          sub: lr > 0.2 ? `REJECT: ${lieDecision.reason}` : 'SOURCE BINDING CHECK',
          glow: 11,
        }),
        hexGate(g3X, gY, 58, to > 0.3 ? ROLE.host : '#394c7a', {
          label: '3. AUTHZ',
          sub: 'SEPARATE PERMISSION',
          glow: to > 0.3 ? 10 : 4,
        }),
      );

      // Divider
      nodes.push(line([-855, 118], [845, 118], { stroke: '#25355a', width: 2 }));

      // Bottom 3 failure modes as clean floating provenance columns
      const c1X = -855;
      const c2X = -260;
      const c3X = 320;
      const topY = 152;

      nodes.push(
        energyRail(c1X, topY, 385, ROLE.attack, { width: 5 }),
        txt('CROSS-SUITE LIE', c1X + 24, topY + 22, 26, ROLE.attack, 'mono', 'left'),
        txt('Real source ID from another', c1X + 24, topY + 78, 26, COSMOS.ink, 'sans', 'left'),
        txt(
          'suite fails candidate+version',
          c1X + 24,
          topY + 120,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
        txt(
          'binding. Detector stays quiet.',
          c1X + 24,
          topY + 174,
          26,
          ROLE.untrusted,
          'mono',
          'left',
        ),
      );

      const col2Alpha = 0.45 + qs * 0.55;
      nodes.push(
        energyRail(c2X, topY, 385, qs > 0.3 ? ROLE.focus : '#334673', {
          width: 5,
          opacity: col2Alpha,
        }),
        txt('CLIPPED & STALE', c2X + 24, topY + 22, 26, ROLE.focus, 'mono', 'left').opacity(
          col2Alpha,
        ),
        txt(
          '“...passed...” drops condition',
          c2X + 24,
          topY + 78,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(col2Alpha),
        txt(
          'Pin immutable artifact + eval',
          c2X + 24,
          topY + 126,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(col2Alpha),
        txt(
          'revisions; never trust "latest"',
          c2X + 24,
          topY + 174,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(col2Alpha),
      );

      const col3Alpha = 0.45 + to * 0.55;
      nodes.push(
        energyRail(c3X, topY, 385, to > 0.3 ? ROLE.host : '#334673', {
          width: 5,
          opacity: col3Alpha,
        }),
        txt('3 SEPARATE GATES', c3X + 24, topY + 22, 26, ROLE.host, 'mono', 'left').opacity(
          col3Alpha,
        ),
        txt('Return UNRESOLVED when', c3X + 24, topY + 78, 26, COSMOS.ink, 'sans', 'left').opacity(
          col3Alpha,
        ),
        txt(
          'support is open. Recheck',
          c3X + 24,
          topY + 120,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(col3Alpha),
        txt(
          'current facts at execution.',
          c3X + 24,
          topY + 174,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(col3Alpha),
      );

      nodes.push(
        glowDot(-840 + ((p * 0.25) % 1) * 1680, 118, { radius: 4.5, color: ROLE.host, glow: 8 }),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('pi-schema-falsehood-0', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('pi-schema-falsehood-0').start, 0.25) }));
  });
  c.on('pi-false-reject', () => {
    s.play(lieReject.to(1, { duration: clampDur(c, c.cue('pi-false-reject').start, 0.35) }));
  });
  c.on('pi-schema-falsehood-1', () => {
    s.play(quoteStale.to(1, { duration: clampDur(c, c.cue('pi-schema-falsehood-1').start, 0.45) }));
  });
  c.on('pi-schema-falsehood-2', () => {
    s.play(threeOps.to(1, { duration: clampDur(c, c.cue('pi-schema-falsehood-2').start, 0.45) }));
  });
}
