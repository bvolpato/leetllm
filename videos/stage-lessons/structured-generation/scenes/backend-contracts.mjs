// Scene 13: backend-contracts - What does the backend enforce?
// 3-act optical contract flow:
//   Act 0 (Outlines v1): Generator(model, RunTriage) -> raw text -> RunTriage.model_validate_json(raw) -> typed status.
//   Act 1 (llama.cpp GBNF): Original schema (retry_count: int, min >= 0) -> converter skips bound -> -1 slips -> local validator catches it!
//   Act 2 (vLLM & hosted): structured_outputs replaces removed guided_* (v0.12.0), comparing wire schema vs endpoint rules.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  fsmNode,
  guardedDynamic,
  opticalRail,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function backendContracts(s, c) {
  const pulse = s.value(0);
  const act = s.value(0); // 0 = Outlines, 1 = llama.cpp GBNF, 2 = vLLM / hosted
  const b0Hi = s.value(0);
  const rawOut = s.value(0);
  const rawGlow = s.value(0);
  const localParse = s.value(0);
  const gbnfSkip = s.value(0);
  const vllmRemoved = s.value(0);

  const header = cinemaHeader(
    'BACKEND ENFORCEMENT BOUNDARIES',
    'What does each',
    'backend enforce?',
    { accent: ROLE.schema, size: 50 },
  );

  const stageAura = aura(200, 40, 640, '#60a5fa1e', '#a78bfa18');

  // Act 0: Outlines v1 raw text -> local Pydantic validation
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const p = pulse.value;
      const ro = rawOut.value;
      const rg = rawGlow.value;
      const lp = localParse.value;
      const b0 = b0Hi.value;
      const nodes = [];

      nodes.push(
        txt(
          'OUTLINES V1  ·  GENERATOR -> RAW STRING -> LOCAL MODEL',
          -840,
          -210,
          26,
          ROLE.schema,
          'mono',
          'left',
        ).opacity(a),
        opticalRail(-840, -140, -45, ROLE.schema, { opacity: a }),
        txt('Generator(model, RunTriage)', -805, -118, 36, ROLE.schema, 'mono', 'left')
          .glow(b0 > 0.3 ? 6 : 0, ROLE.schema)
          .opacity(a),
        txt(
          'Compiles Pydantic schema into token mask, returns raw string',
          -805,
          -62,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      );

      // Left node -> Center raw string -> Right typed model
      const x1 = -520;
      const x2 = 430;
      const yMid = 135;

      nodes.push(
        opticalRail(-840, yMid - 82, yMid + 82, ro > 0.3 ? ROLE.prefix : COSMOS.dim, {
          opacity: a,
        }),
        txt('RETURNED RAW TEXT', -805, yMid - 64, 26, ROLE.prefix, 'mono', 'left').opacity(a),
        txt(
          ro > 0.3 ? '{"run_id":"RUN-842",' : 'waiting for raw string...',
          -805,
          yMid - 8,
          28,
          ro > 0.3 ? COSMOS.ink : COSMOS.dim,
          'mono',
          'left',
        )
          .glow(rg > 0.4 ? 6 : 0, ROLE.prefix)
          .opacity(a),
        txt(
          ro > 0.3 ? ' "status":"failed","failing_job":"unit-tests"}' : '',
          -805,
          yMid + 42,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a * ro),
      );

      const bridge = quadArcPts([-40, yMid], [220, yMid], -34);
      nodes.push(
        beamWithPhotons(bridge, lp > 0.3 ? ROLE.legal : ROLE.fsm, p * 1.1, {
          alpha: a * (0.35 + 0.65 * Math.max(ro, lp)),
          width: 3.4,
          photonCount: lp > 0.2 ? 2 : 1,
        }),
        fsmNode(310, yMid, 72, lp > 0.5 ? 'TYPED' : 'PARSE', {
          color: lp > 0.5 ? ROLE.legal : ROLE.schema,
          accepting: lp > 0.5,
          size: 26,
          opacity: a,
        }),
        txt('RunTriage.model_validate_json', 420, yMid - 34, 26, ROLE.fsm, 'mono', 'left').opacity(
          a,
        ),
        txt(
          lp > 0.5 ? 'triage.status == "failed"' : 'not validated yet',
          420,
          yMid + 24,
          30,
          lp > 0.5 ? ROLE.legal : COSMOS.dim,
          'mono',
          'left',
        )
          .glow(lp > 0.5 ? 8 : 0, ROLE.legal)
          .opacity(a),
        txt(
          'Even after constrained decoding, parse and validate into your typed model locally',
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

  // Act 1: llama.cpp GBNF converter drops minimum: 0 -> local validator survives!
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const sk = gbnfSkip.value;
      const nodes = [];

      nodes.push(
        txt(
          'LLAMA.CPP GBNF CONVERTER  ·  DROPPED KEYWORDS',
          -840,
          -210,
          26,
          ROLE.review,
          'mono',
          'left',
        ).opacity(a),
      );

      // Top row: Original Schema -> Emitted GBNF Grammar
      const yTop = -80;
      nodes.push(
        opticalRail(-840, yTop - 60, yTop + 60, ROLE.schema, { opacity: a }),
        txt('ORIGINAL JSON SCHEMA', -805, yTop - 45, 26, ROLE.schema, 'mono', 'left').opacity(a),
        txt('retry_count: integer', -805, yTop + 4, 32, COSMOS.ink, 'mono', 'left').opacity(a),
        txt('minimum: 0', -805, yTop + 50, 32, ROLE.legal, 'mono', 'left').opacity(a),

        beamWithPhotons(quadArcPts([-180, yTop], [110, yTop], -28), ROLE.review, p * 1.1, {
          alpha: a,
          width: 3.4,
        }),

        opticalRail(150, yTop - 60, yTop + 60, sk > 0.4 ? ROLE.prune : ROLE.prefix, { opacity: a }),
        txt(
          'EMITTED GBNF GRAMMAR',
          185,
          yTop - 45,
          26,
          sk > 0.4 ? ROLE.prune : ROLE.prefix,
          'mono',
          'left',
        ).opacity(a),
        txt('integer syntax present', 185, yTop + 4, 32, COSMOS.ink, 'mono', 'left').opacity(a),
        txt(
          sk > 0.4 ? 'minimum: 0 SKIPPED' : 'inspect emitted rules',
          185,
          yTop + 50,
          32,
          sk > 0.4 ? ROLE.prune : ROLE.prefix,
          'mono',
          'left',
        )
          .glow(sk > 0.4 ? 9 : 0, ROLE.prune)
          .opacity(a),
      );

      // Bottom row: Candidate -1 passes grammar -> rejected by local validator!
      const yBot = 160;
      nodes.push(
        opticalRail(-840, yBot - 52, yBot + 52, ROLE.prefix, { opacity: a }),
        txt('CANDIDATE VALUE', -805, yBot - 34, 26, ROLE.prefix, 'mono', 'left').opacity(a),
        txt(
          'retry_count = -1  (valid integer)',
          -805,
          yBot + 22,
          32,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),

        beamWithPhotons(
          quadArcPts([-140, yBot], [110, yBot], 28),
          sk > 0.4 ? ROLE.prune : ROLE.fsm,
          p * 1.2 + 0.4,
          {
            alpha: a,
            width: 3.4,
          },
        ),

        opticalRail(150, yBot - 52, yBot + 52, sk > 0.4 ? ROLE.legal : ROLE.schema, { opacity: a }),
        txt('ORIGINAL LOCAL VALIDATOR', 185, yBot - 34, 26, ROLE.legal, 'mono', 'left').opacity(a),
        txt(
          sk > 0.4 ? 'MINIMUM 0 REJECTS -1' : 'retained local contract',
          185,
          yBot + 22,
          32,
          sk > 0.4 ? ROLE.prune : ROLE.legal,
          'mono',
          'left',
        )
          .glow(sk > 0.4 ? 9 : 0, ROLE.prune)
          .opacity(a),
        txt(
          'Inspect emitted grammars and always keep your original local validator in the loop',
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

  // Act 2: vLLM structured_outputs vs removed guided_* & hosted endpoints
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const vr = vllmRemoved.value;
      const nodes = [];

      nodes.push(
        txt('VLLM & HOSTED ENDPOINT SCHEMAS', -840, -210, 26, ROLE.fsm, 'mono', 'left').opacity(a),
      );

      // Left column: vLLM structured_outputs
      nodes.push(
        opticalRail(-840, -110, 120, ROLE.fsm, { opacity: a }),
        txt('VLLM REQUEST CONTRACT', -805, -90, 26, ROLE.fsm, 'mono', 'left').opacity(a),
        txt('structured_outputs', -805, -24, 42, ROLE.legal, 'mono', 'left')
          .glow(8, ROLE.legal)
          .opacity(a),
        txt(
          vr > 0.4 ? 'guided_json / guided_regex REMOVED (v0.12)' : 'inspect outgoing request keys',
          -805,
          44,
          28,
          vr > 0.4 ? ROLE.prune : COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      );

      // Center beam to hosted endpoint verifier
      nodes.push(
        beamWithPhotons(quadArcPts([-120, 5], [140, 5], -35), ROLE.fsm, p * 1.1, {
          alpha: a,
          width: 3.4,
        }),
      );

      // Right column: Hosted endpoint subset check
      nodes.push(
        opticalRail(180, -110, 120, ROLE.prefix, { opacity: a }),
        txt('HOSTED MODEL ENDPOINT', 215, -90, 26, ROLE.prefix, 'mono', 'left').opacity(a),
        txt('Outgoing JSON Schema', 215, -24, 34, COSMOS.ink, 'mono', 'left').opacity(a),
        txt('vs Endpoint Supported Subset', 215, 44, 28, ROLE.prefix, 'sans', 'left').opacity(a),
        line([-840, 220], [840, 220], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          'Compare the actual outgoing request schema against the exact rules that endpoint enforces',
          -840,
          310,
          30,
          COSMOS.ink,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1, act2);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('sg-backend-contracts-0', () => {
    s.play(b0Hi.to(1, { duration: clampDur(c, c.cue('sg-backend-contracts-0').start, 0.35) }));
  });
  c.on('sg-outlines-raw', () => {
    s.play(rawOut.to(1, { duration: clampDur(c, c.cue('sg-outlines-raw').start, 0.4) }));
  });
  c.on('sg-backend-raw', () => {
    s.play(rawGlow.to(1, { duration: clampDur(c, c.cue('sg-backend-raw').start, 0.35) }));
  });
  c.on('sg-backend-parse', () => {
    s.play(localParse.to(1, { duration: clampDur(c, c.cue('sg-backend-parse').start, 0.45) }));
  });
  c.on('sg-backend-contracts-1', () => {
    s.play(act.to(1, { duration: clampDur(c, c.cue('sg-backend-contracts-1').start, 0.4) }));
  });
  c.on('sg-gbnf-skip', () => {
    s.play(gbnfSkip.to(1, { duration: clampDur(c, c.cue('sg-gbnf-skip').start, 0.45) }));
  });
  c.on('sg-backend-contracts-2', () => {
    s.play(act.to(2, { duration: clampDur(c, c.cue('sg-backend-contracts-2').start, 0.4) }));
  });
  c.on('sg-backend-vllm', () => {
    s.play(vllmRemoved.to(1, { duration: clampDur(c, c.cue('sg-backend-vllm').start, 0.45) }));
  });
}
