// Scene 8: typed-evidence - What can cross from the reader?
// Strict typed-evidence airlock backed directly by `typedEvidenceDecision`:
//   Phase 0: 5-field sheet (3 expected + extra tool & approved) stops completely (0 cross).
//   Phase 1: Clean 3-field sheet matches PI_SOURCE, crosses, and receives host `source_id`.
//   Phase 2: Report omitting gate keeps metrics and marks release eligibility UNRESOLVED.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  PI_SOURCE,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  circuitBreaker,
  clampDur,
  driftValue,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  hexGate,
  quadArcPts,
  txt,
  typedEvidenceDecision,
} from '../parts.mjs';

export default function typedEvidence(s, c) {
  const pulse = s.value(0);
  const extraHi = s.value(0);
  const stopTripped = s.value(0);
  const cleanMode = s.value(0); // 0 -> 1 clean copy, 1 -> 2 unresolved copy
  const crossBeam = s.value(0);
  const stampOn = s.value(0);
  const openVerdict = s.value(0);

  const badCheck = typedEvidenceDecision({
    candidate: 'C17',
    suite: 'R42',
    gate: 'passed',
    tool: 'promote',
    approved: true,
  });
  const goodCheck = typedEvidenceDecision({
    candidate: 'C17',
    suite: 'R42',
    gate: 'passed',
  });

  const header = cinemaHeader('TYPED EVIDENCE AIRLOCK', 'What can cross', 'from the reader?', {
    accent: ROLE.host,
    size: 48,
  });

  const stageAura = aura(120, 30, 620, '#5ce1e61a', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const ex = extraHi.value;
      const st = stopTripped.value;
      const cm = cleanMode.value;
      const cb = crossBeam.value;
      const sp = stampOn.value;
      const ov = openVerdict.value;
      const nodes = [];

      const m0 = fadeOutHalf(Math.min(1, cm));
      const m1 = fadeInHalf(Math.min(1, cm)) * fadeOutHalf(Math.max(0, cm - 1));
      const m2 = fadeInHalf(Math.max(0, cm - 1));

      // Center airlock gate & breaker (vertical trust line stops cleanly above gate!)
      const gateX = 20;
      const gateY = 8;
      const gateCol =
        cm < 0.5 ? (st > 0.3 ? ROLE.denied : ROLE.untrusted) : cm < 1.5 ? ROLE.ok : ROLE.focus;
      const gateLbl =
        cm < 0.5 ? (st > 0.3 ? 'REJECTED' : 'KEY CHECK') : cm < 1.5 ? 'ADMITTED' : 'OPEN GATE';

      nodes.push(
        line([gateX, -245], [gateX, gateY - 128], {
          stroke: '#2c3d66',
          width: 2.5,
          dash: [10, 10],
        }),
        hexGate(gateX, gateY, 68, gateCol, {
          label: gateLbl,
          sub: 'WHOLE-RECORD CHECK',
          glow: 10,
        }),
        circuitBreaker(gateX, 275, 110, m0 > 0.3 ? st : 0, ROLE.ok),
      );

      // Mode 0: 5-field copy with extra tool + approved keys -> WHOLE sheet stops!
      if (m0 > 0.02) {
        nodes.push(
          energyRail(-855, -195, 240, ROLE.untrusted, { width: 6, opacity: m0 }),
          txt('READER SHEET (5 KEYS)', -825, -172, 26, ROLE.untrusted, 'mono', 'left').opacity(m0),
          txt('candidate : "C17"', -825, -108, 28, COSMOS.ink, 'mono', 'left').opacity(m0),
          txt('suite     : "R42"', -825, -54, 28, COSMOS.ink, 'mono', 'left').opacity(m0),
          txt('gate      : "passed"', -825, 0, 28, COSMOS.ink, 'mono', 'left').opacity(m0),
          txt('tool      : "promote"   <- EXTRA', -825, 68, 28, ROLE.attack, 'mono', 'left')
            .glow(ex > 0.3 ? 8 : 3, ROLE.attack)
            .opacity(m0),
          txt('approved  : true        <- EXTRA', -825, 126, 28, ROLE.attack, 'mono', 'left')
            .glow(ex > 0.3 ? 8 : 3, ROLE.attack)
            .opacity(m0),
          txt(`decision: ${badCheck.reason}`, -825, 200, 26, ROLE.denied, 'mono', 'left').opacity(
            m0 * Math.max(0.35, st),
          ),
        );

        nodes.push(
          energyRail(285, -185, 200, ROLE.denied, { width: 6, opacity: m0 }),
          txt('HOST EVIDENCE SIDE', 315, -162, 26, ROLE.host, 'mono', 'left').opacity(m0),
          txt('0 FIELDS CROSSED', 315, -62, 36, ROLE.denied, 'mono', 'left')
            .glow(8, ROLE.denied)
            .opacity(m0),
          txt('Even the 3 good fields stay', 315, 10, 28, COSMOS.ink, 'sans', 'left').opacity(m0),
          txt('trapped on the reader side.', 315, 56, 28, COSMOS.muted, 'sans', 'left').opacity(m0),
          txt('RELEASE WRITES: 0', 315, 140, 28, ROLE.ok, 'mono', 'left').opacity(m0),
        );

        const bounce = quadArcPts([-245, 8], [gateX - 122, gateY], -14, 18);
        nodes.push(beamWithPhotons(bounce, ROLE.attack, p * 1.1, { width: 3.2, alpha: m0 }));
      }

      // Mode 1: Clean 3-field sheet crosses and gets host source_id stamped!
      if (m1 > 0.02) {
        nodes.push(
          energyRail(-855, -195, 200, ROLE.ok, { width: 6, opacity: m1 }),
          txt('FRESH COPY (EXACT 3 KEYS)', -825, -172, 26, ROLE.ok, 'mono', 'left').opacity(m1),
          txt(
            `candidate : "${PI_SOURCE.candidate}"`,
            -825,
            -96,
            30,
            COSMOS.ink,
            'mono',
            'left',
          ).opacity(m1),
          txt(
            `suite     : "${PI_SOURCE.suite}"`,
            -825,
            -30,
            30,
            COSMOS.ink,
            'mono',
            'left',
          ).opacity(m1),
          txt(`gate      : "${PI_SOURCE.gate}"`, -825, 36, 30, ROLE.ok, 'mono', 'left').opacity(m1),
          txt('Matches authoritative source', -825, 126, 26, ROLE.host, 'mono', 'left').opacity(m1),
        );

        const inArc = quadArcPts([-245, 8], [gateX - 122, gateY], 0, 18);
        const outArc = quadArcPts([gateX + 122, gateY], [270, 8], 0, 18);
        nodes.push(
          beamWithPhotons(inArc, ROLE.ok, p * 1.1, { width: 3.4, alpha: m1 }),
          beamWithPhotons(outArc, ROLE.ok, p * 1.1 + 0.5, {
            width: 3.4,
            alpha: m1 * Math.max(0.25, cb),
          }),
        );

        nodes.push(
          energyRail(285, -195, 210, ROLE.host, { width: 6, opacity: m1 }),
          txt('CHECKED HOST EVIDENCE', 315, -172, 26, ROLE.ok, 'mono', 'left').opacity(m1),
          txt(
            `candidate: ${goodCheck.record.candidate} · suite: ${goodCheck.record.suite}`,
            315,
            -98,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ).opacity(m1),
          txt(`gate: ${goodCheck.record.gate}`, 315, -42, 28, ROLE.ok, 'mono', 'left').opacity(m1),
          txt(
            `+ host source_id: ${goodCheck.record.source_id}`,
            315,
            34,
            28,
            ROLE.source,
            'mono',
            'left',
          )
            .glow(sp > 0.3 ? 8 : 3, ROLE.source)
            .opacity(m1 * Math.max(0.35, sp)),
          txt('1 CHECKED EVIDENCE · 0 RELEASE WRITES', 315, 138, 26, ROLE.host, 'mono', 'left')
            .glow(6, ROLE.host)
            .opacity(m1 * Math.max(0.4, sp)),
        );
      }

      // Mode 2: Metrics present, gate result open -> keep metrics + mark UNRESOLVED
      if (m2 > 0.02) {
        nodes.push(
          energyRail(-855, -195, 200, ROLE.focus, { width: 6, opacity: m2 }),
          txt('REPORT WITH OPEN GATE', -825, -172, 26, ROLE.focus, 'mono', 'left').opacity(m2),
          txt('accuracy : 0.94  (supported)', -825, -96, 28, ROLE.ok, 'mono', 'left').opacity(m2),
          txt('latency  : 142ms (supported)', -825, -34, 28, ROLE.ok, 'mono', 'left').opacity(m2),
          txt('gate     : [missing in report]', -825, 34, 28, ROLE.focus, 'mono', 'left').opacity(
            m2,
          ),
          txt(
            'Never force passed / failed guess!',
            -825,
            126,
            26,
            ROLE.attack,
            'mono',
            'left',
          ).opacity(m2),
        );

        nodes.push(
          energyRail(285, -195, 210, ROLE.focus, { width: 6, opacity: m2 }),
          txt('HOST ELIGIBILITY RECORD', 315, -172, 26, ROLE.host, 'mono', 'left').opacity(m2),
          txt('Supported metrics kept intact', 315, -92, 28, COSMOS.ink, 'sans', 'left').opacity(
            m2,
          ),
          txt('ELIGIBILITY: UNRESOLVED', 315, -14, 34, ROLE.focus, 'mono', 'left')
            .glow(ov > 0.3 ? 10 : 4, ROLE.focus)
            .opacity(m2),
          txt(
            'For release decisions, query the',
            315,
            76,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(m2),
          txt('authoritative evaluation service.', 315, 124, 26, ROLE.host, 'sans', 'left').opacity(
            m2,
          ),
        );
      }

      nodes.push(
        txt(
          'EXACT KEYS + SOURCE MATCH + HOST-STAMPED PROVENANCE',
          0,
          380,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('evidence-keys', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('evidence-keys').start, 0.25) }));
  });
  c.on('evidence-extra', () => {
    s.play(extraHi.to(1, { duration: clampDur(c, c.cue('evidence-extra').start, 0.35) }));
  });
  c.on('evidence-stop', () => {
    s.play(stopTripped.to(1, { duration: clampDur(c, c.cue('evidence-stop').start, 0.35) }));
  });
  c.on('evidence-clean', () => {
    s.play(cleanMode.to(1, { duration: clampDur(c, c.cue('evidence-clean').start, 0.4) }));
  });
  c.on('evidence-through', () => {
    s.play(crossBeam.to(1, { duration: clampDur(c, c.cue('evidence-through').start, 0.35) }));
  });
  c.on('evidence-stamp', () => {
    s.play(stampOn.to(1, { duration: clampDur(c, c.cue('evidence-stamp').start, 0.35) }));
  });
  c.on('evidence-gap', () => {
    s.play(cleanMode.to(2, { duration: clampDur(c, c.cue('evidence-gap').start, 0.4) }));
  });
  c.on('evidence-open', () => {
    s.play(openVerdict.to(1, { duration: clampDur(c, c.cue('evidence-open').start, 0.35) }));
  });
}
