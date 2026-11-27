// Scene 2: interface-contract - What does the parser check?
// 3-act optical contract pipeline:
//   Act 0: Preamble trimmed from {"run_id":"RUN-842","status":"failed"} -> JSON + required fields pass.
//   Act 1: JSON-mode object {"foo":"bar"} passes syntax ring yet fails strict schema gate (both keys missing).
//   Act 2: Dashboard record vs Tool request get_run_status("RUN-842") -> Host returns CI snapshot.
import { group, line } from 'vizmatic/stage';
import {
  CI_RUN,
  COSMOS,
  ROLE,
  RUN_LOG,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  fsmNode,
  guardedDynamic,
  opticalRail,
  quadArcPts,
  txt,
} from '../parts.mjs';

const TWO_FIELDS = JSON.stringify({ run_id: CI_RUN.run_id, status: CI_RUN.status });

export default function interfaceContract(s, c) {
  const trimmed = s.value(0);
  const act = s.value(0); // 0 = trim preamble, 1 = missing keys, 2 = tool lookup
  const missingVerdict = s.value(0);
  const lookupBeam = s.value(0);

  const header = cinemaHeader('SYNTAX VS SCHEMA CONTRACT', 'What does the', 'parser check?', {
    accent: ROLE.schema,
    size: 50,
  });

  const stageAura = aura(240, 30, 620, '#60a5fa20', '#5ce1e616');

  // Persistent source log strip at top-right
  const logStrip = guardedDynamic(
    () => 1,
    () =>
      group(
        opticalRail(20, -430, -330, ROLE.prefix, { width: 4 }),
        txt('RUNNER LOG', 48, -415, 26, ROLE.prefix, 'mono', 'left'),
        txt('Run RUN-842 failed in unit-tests', 48, -372, 26, COSMOS.muted, 'sans', 'left'),
        txt('after auth-cache timed out.', 48, -338, 26, COSMOS.muted, 'sans', 'left'),
      ),
  );

  // Act 0 & 1: Parser + Schema Dual Gate
  const act01 = guardedDynamic(
    () => fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const tr = trimmed.value;
      const isMissing = act.value > 0.5;
      const mv = missingVerdict.value;
      const nodes = [];

      const raw = isMissing ? '{"foo":"bar"}' : tr > 0.5 ? TWO_FIELDS : 'Sure! ' + TWO_FIELDS;
      const syntaxOk = isMissing || tr > 0.5;
      const schemaOk = !isMissing && tr > 0.5;

      nodes.push(
        txt(
          isMissing ? 'JSON MODE REPLY BYTES' : 'UNCONSTRAINED REPLY BYTES',
          -840,
          -175,
          26,
          isMissing ? ROLE.review : ROLE.fsm,
          'mono',
          'left',
        ).opacity(a),
        txt(raw, -840, -108, 40, COSMOS.ink, 'mono', 'left').opacity(a),
      );

      if (!isMissing && tr < 0.5) {
        nodes.push(
          line([-840, -76], [-700, -76], { stroke: ROLE.prune, width: 5 })
            .glow(9, ROLE.prune)
            .opacity(a),
          txt('PREAMBLE BREAKS PARSER', -840, -34, 26, ROLE.prune, 'mono', 'left').opacity(a),
        );
      }

      // Two glowing verification rings connected by photon beam
      const g1X = -460;
      const g2X = 260;
      const gY = 145;
      const beamPts = quadArcPts([g1X + 95, gY], [g2X - 95, gY], -40);
      nodes.push(
        fsmNode(g1X, gY, 82, syntaxOk ? 'OBJECT' : 'CRASH', {
          color: syntaxOk ? ROLE.legal : ROLE.prune,
          accepting: syntaxOk,
          size: 28,
          opacity: a,
        }),
        txt('1. JSON PARSER', g1X, gY + 130, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        beamWithPhotons(beamPts, syntaxOk ? ROLE.fsm : '#2f3d61', 0, {
          alpha: a * (syntaxOk ? 0.95 : 0.35),
          photonCount: syntaxOk ? 2 : 0,
        }),
        fsmNode(
          g2X,
          gY,
          82,
          isMissing ? (mv > 0.5 ? 'MISSING' : '?') : schemaOk ? 'VALID' : 'WAIT',
          {
            color: isMissing
              ? mv > 0.5
                ? ROLE.prune
                : ROLE.prefix
              : schemaOk
                ? ROLE.legal
                : COSMOS.dim,
            accepting: schemaOk,
            size: 26,
            opacity: a,
          },
        ),
        txt('2. REQUIRED KEYS', g2X, gY + 130, 26, COSMOS.muted, 'mono', 'center').opacity(a),
      );

      // Right-hand field checklist status
      const rx = 500;
      nodes.push(
        txt(
          'run_id: str',
          rx,
          gY - 40,
          28,
          schemaOk ? ROLE.legal : isMissing && mv > 0.5 ? ROLE.prune : COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
        txt(
          'status: enum',
          rx,
          gY + 25,
          28,
          schemaOk ? ROLE.legal : isMissing && mv > 0.5 ? ROLE.prune : COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      );

      if (isMissing && mv > 0.45) {
        nodes.push(
          txt(
            'SYNTAX VALID  ·  BOTH REQUIRED KEYS MISSING',
            -840,
            365,
            30,
            ROLE.prune,
            'mono',
            'left',
          )
            .glow(8, ROLE.prune)
            .opacity(a * mv),
        );
      } else if (schemaOk) {
        nodes.push(
          txt(
            'PREAMBLE REMOVED  ·  BOTH FIELDS READABLE',
            -840,
            365,
            30,
            ROLE.legal,
            'mono',
            'left',
          )
            .glow(8, ROLE.legal)
            .opacity(a * tr),
        );
      } else {
        nodes.push(
          txt(
            'Prompting for JSON still leaves conversational tokens open',
            -840,
            365,
            28,
            COSMOS.muted,
            'serif',
            'left',
          ).opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  // Act 2: Structured Record vs Tool Lookup
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const lk = lookupBeam.value;
      const nodes = [];

      // Top lane: Structured response for dashboard
      nodes.push(
        opticalRail(-840, -175, -60, ROLE.legal, { opacity: a }),
        txt(
          'STRUCTURED RECORD  (TERMINAL DATA)',
          -805,
          -160,
          26,
          ROLE.legal,
          'mono',
          'left',
        ).opacity(a),
        txt(TWO_FIELDS, -805, -100, 36, COSMOS.ink, 'mono', 'left').opacity(a),
        txt(
          'Host writes record directly to dashboard',
          160,
          -100,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      );

      // Bottom lane: Named Tool Lookup + Return Snapshot Beam
      const toolY = 125;
      nodes.push(
        opticalRail(-840, toolY - 60, toolY + 80, ROLE.fsm, { opacity: a }),
        txt(
          'NAMED TOOL CALL  (HOST LOOKUP)',
          -805,
          toolY - 45,
          26,
          ROLE.fsm,
          'mono',
          'left',
        ).opacity(a),
        txt('get_run_status("RUN-842")', -805, toolY + 20, 36, ROLE.fsm, 'mono', 'left')
          .glow(6, ROLE.fsm)
          .opacity(a),
      );

      const outArc = quadArcPts([-140, toolY + 10], [260, toolY - 15], -55);
      nodes.push(
        beamWithPhotons(outArc, ROLE.fsm, 0, { alpha: a, width: 3.4 }),
        fsmNode(365, toolY + 15, 72, 'HOST', { color: ROLE.schema, size: 28, opacity: a }),
      );

      if (lk > 0.05) {
        const retArc = quadArcPts([260, toolY + 45], [-140, toolY + 65], 65);
        nodes.push(
          beamWithPhotons(retArc, ROLE.prefix, 0, { alpha: a * lk, width: 3.6 }),
          txt('SNAPSHOT RETURNED', 485, toolY - 10, 28, ROLE.prefix, 'mono', 'left')
            .glow(8, ROLE.prefix)
            .opacity(a * lk),
          txt(
            'RUN-842: failed (if authorized)',
            485,
            toolY + 38,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(a * lk),
        );
      }

      nodes.push(
        txt(
          'Record updates state · Tool call fetches live state through host permission',
          -840,
          365,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, logStrip, act01, act2);

  c.on('interface-trim', () => {
    s.play(trimmed.to(1, { duration: clampDur(c, c.cue('interface-trim').start, 0.4) }));
  });
  c.onBeat(1, () => {
    s.play(act.to(1, { duration: clampDur(c, c.beats[1].start, 0.35) }));
  });
  c.on('interface-fields', () => {
    s.play(missingVerdict.to(1, { duration: clampDur(c, c.cue('interface-fields').start, 0.4) }));
  });
  c.onBeat(2, () => {
    s.play(act.to(2, { duration: clampDur(c, c.beats[2].start, 0.4) }));
  });
  c.on('interface-lookup', () => {
    s.play(lookupBeam.to(1, { duration: clampDur(c, c.cue('interface-lookup').start, 0.45) }));
  });
}
