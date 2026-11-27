// Scene 14: parser-bytes - Parse one unambiguous completed record
// 3-act strict JSON parser gate:
//   Act 0: Streaming fragments stay provisional; completed object read as ordered pairs
//          ("run_id","842"), ("run_id","999") -> duplicate hook rejects vs dict overwrites to 999.
//   Act 1: Nonstandard constants (NaN/Infinity) + decimal float overflow (1e999 -> Infinity) +
//          empty array [] parses as JSON yet fails object contract.
//   Act 2: status: incomplete envelope with {broken bypasses parser completely (NOT CALLED).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
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

export default function parserBytes(s, c) {
  const act = s.value(0); // 0 = duplicate keys, 1 = NaN/overflow/[], 2 = incomplete bypass
  const provHi = s.value(0);
  const pairsOn = s.value(0);
  const dupReject = s.value(0);
  const lastWins = s.value(0);
  const constReject = s.value(0);
  const overflowOn = s.value(0);
  const finiteReject = s.value(0);
  const arrayReject = s.value(0);
  const incompleteStop = s.value(0);

  const header = cinemaHeader('STRICT PARSER HOOKS', 'Parse one unambiguous', 'completed record', {
    accent: ROLE.prune,
    size: 48,
  });

  const stageAura = aura(200, 40, 640, '#ff6b8b1e', '#5ce1e616');

  // Act 0: Duplicate keys (object_pairs_hook vs ordinary dict)
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const pv = provHi.value;
      const pr = pairsOn.value;
      const dr = dupReject.value;
      const lw = lastWins.value;
      const nodes = [];

      nodes.push(
        txt(
          'STREAMING FRAGMENTS STAY PROVISIONAL  ·  ORDERED PAIRS',
          -840,
          -220,
          26,
          pv > 0.3 ? ROLE.prefix : ROLE.fsm,
          'mono',
          'left',
        )
          .glow(pv > 0.3 ? 6 : 0, ROLE.prefix)
          .opacity(a),
      );

      // Left: Ordered pairs stream
      nodes.push(
        opticalRail(-840, -145, 5, ROLE.schema, { opacity: a }),
        txt('ORDERED KEY-VALUE PAIRS', -805, -130, 26, ROLE.schema, 'mono', 'left').opacity(a),
        txt('1. ("run_id", "842")', -805, -70, 34, COSMOS.ink, 'mono', 'left').opacity(a),
        txt(
          '2. ("run_id", "999")',
          -805,
          -14,
          34,
          dr > 0.3 ? ROLE.prune : ROLE.prefix,
          'mono',
          'left',
        )
          .glow(dr > 0.3 ? 7 : 0, ROLE.prune)
          .opacity(a),
      );

      // Right top: object_pairs_hook (strict!)
      nodes.push(
        beamWithPhotons(
          quadArcPts([-310, -55], [60, -75], -22),
          dr > 0.3 ? ROLE.prune : ROLE.fsm,
          0,
          {
            alpha: a * (0.35 + 0.65 * Math.max(pr, dr)),
            width: 3.4,
          },
        ),
        opticalRail(100, -145, 5, dr > 0.3 ? ROLE.prune : ROLE.prefix, { opacity: a }),
        txt(
          'object_pairs_hook (STRICT)',
          135,
          -130,
          26,
          dr > 0.3 ? ROLE.prune : ROLE.prefix,
          'mono',
          'left',
        ).opacity(a),
        txt(
          pr > 0.3 ? 'seen key: "run_id" = "842"' : 'inspect pair stream',
          135,
          -70,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
        txt(
          dr > 0.3 ? '2nd "run_id" -> REJECT DUPLICATE' : 'awaiting second pair...',
          135,
          -14,
          30,
          dr > 0.3 ? ROLE.prune : COSMOS.dim,
          'mono',
          'left',
        )
          .glow(dr > 0.3 ? 9 : 0, ROLE.prune)
          .opacity(a),
      );

      // Bottom: Ordinary Python dict silently overwrites 842 -> 999
      nodes.push(
        line([-840, 80], [840, 80], { stroke: '#243458', width: 2 }).opacity(a),
        opticalRail(-840, 130, 265, lw > 0.3 ? ROLE.review : COSMOS.dim, { opacity: a }),
        txt(
          'ORDINARY PYTHON DICT (SILENT OVERWRITE)',
          -805,
          148,
          26,
          lw > 0.3 ? ROLE.review : COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
        txt(
          lw > 0.3
            ? '{"run_id": "999"}   <-  "842" VANISHED SILENTLY'
            : 'Converts pairs straight into dict -> last value wins',
          -805,
          218,
          32,
          lw > 0.3 ? ROLE.review : COSMOS.muted,
          'mono',
          'left',
        )
          .glow(lw > 0.3 ? 7 : 0, ROLE.review)
          .opacity(a),
        txt(
          'Reject duplicate keys before dictionary conversion erases the conflict',
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

  // Act 1: Nonstandard constants (NaN/Infinity) + 1e999 float overflow + [] object check
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const cr = constReject.value;
      const ov = overflowOn.value;
      const fr = finiteReject.value;
      const ar = arrayReject.value;
      const nodes = [];

      nodes.push(
        txt(
          'NONFINITE NUMBERS & TOP-LEVEL SHAPE CHECKS',
          -840,
          -220,
          26,
          ROLE.prune,
          'mono',
          'left',
        ).opacity(a),
      );

      // Left column: parse_constant rejects NaN / Infinity
      nodes.push(
        opticalRail(-840, -145, 55, cr > 0.3 ? ROLE.prune : ROLE.schema, { opacity: a }),
        txt('NONSTANDARD CONSTANTS', -805, -130, 26, ROLE.schema, 'mono', 'left').opacity(a),
        txt('NaN   /   Infinity', -805, -62, 38, COSMOS.ink, 'mono', 'left').opacity(a),
        txt(
          cr > 0.3 ? 'parse_constant -> REJECT' : 'accepted by Python default!',
          -805,
          18,
          30,
          cr > 0.3 ? ROLE.prune : ROLE.prefix,
          'mono',
          'left',
        )
          .glow(cr > 0.3 ? 8 : 0, ROLE.prune)
          .opacity(a),
      );

      // Right column: 1e999 -> float('inf') -> parse_float rejects!
      nodes.push(
        opticalRail(40, -145, 55, fr > 0.3 ? ROLE.prune : ROLE.prefix, { opacity: a }),
        txt('DECIMAL EXPONENT OVERFLOW', 75, -130, 26, ROLE.prefix, 'mono', 'left').opacity(a),
        txt(
          ov > 0.3 ? '1e999  ->  float("inf")' : '1e999',
          75,
          -62,
          38,
          ov > 0.3 ? ROLE.review : COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
        txt(
          fr > 0.3 ? 'parse_float (isfinite) -> REJECT' : 'overflows to Infinity on conversion',
          75,
          18,
          30,
          fr > 0.3 ? ROLE.prune : COSMOS.muted,
          'mono',
          'left',
        )
          .glow(fr > 0.3 ? 8 : 0, ROLE.prune)
          .opacity(a),
      );

      // Bottom band: Empty array [] parses cleanly, yet fails required object contract!
      nodes.push(
        line([-840, 125], [840, 125], { stroke: '#243458', width: 2 }).opacity(a),
        fsmNode(-680, 240, 62, '[]', {
          color: ar > 0.3 ? ROLE.prune : ROLE.fsm,
          size: 36,
          opacity: a,
        }),
        beamWithPhotons(
          quadArcPts([-605, 240], [-290, 240], -20),
          ar > 0.3 ? ROLE.prune : ROLE.fsm,
          0,
          {
            alpha: a,
            width: 3.2,
          },
        ),
        txt('json.loads("[]") -> VALID JSON', -260, 208, 30, ROLE.legal, 'mono', 'left').opacity(a),
        txt(
          ar > 0.3
            ? 'OBJECT CONTRACT -> REJECT (NOT A RECORD)'
            : 'Next: verify expected object & fields',
          -260,
          268,
          30,
          ar > 0.3 ? ROLE.prune : COSMOS.muted,
          'mono',
          'left',
        )
          .glow(ar > 0.3 ? 8 : 0, ROLE.prune)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 2: status: incomplete bypasses parser completely
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const inc = incompleteStop.value;
      const nodes = [];

      nodes.push(
        txt(
          'COMPLETION GATE BEFORE PARSING',
          -840,
          -210,
          26,
          ROLE.envelope,
          'mono',
          'left',
        ).opacity(a),
        opticalRail(-840, -120, 80, ROLE.review, { opacity: a }),
        txt('PROVIDER ENVELOPE', -805, -100, 26, ROLE.review, 'mono', 'left').opacity(a),
        txt('status: "incomplete"', -805, -30, 40, ROLE.review, 'mono', 'left')
          .glow(8, ROLE.review)
          .opacity(a),
        txt('text: "{broken"', -805, 40, 36, COSMOS.muted, 'mono', 'left').opacity(a),

        // Glowing barrier wall between envelope and parser
        line([20, -135], [20, 125], { stroke: ROLE.prune, width: 6 })
          .glow(12, ROLE.prune)
          .opacity(a * (0.4 + 0.6 * inc)),
        txt('STOP', 20, 168, 28, ROLE.prune, 'mono', 'center').opacity(a),

        opticalRail(150, -120, 80, inc > 0.3 ? ROLE.prune : COSMOS.dim, { opacity: a }),
        txt('LOCAL JSON PARSER', 185, -100, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt(
          inc > 0.3 ? 'NEVER CALLED' : 'awaiting status check...',
          185,
          -26,
          42,
          inc > 0.3 ? ROLE.prune : COSMOS.dim,
          'mono',
          'left',
        )
          .glow(inc > 0.3 ? 10 : 0, ROLE.prune)
          .opacity(a),
        txt(
          inc > 0.3 ? 'Keep incomplete result · no provisional commit' : '',
          185,
          44,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(a * inc),

        txt(
          'Bound input byte size and nesting depth whenever you do accept complete text for parsing',
          -840,
          345,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1, act2);

  c.on('sg-parser-bytes-0', () => {
    s.play(provHi.to(0.5, { duration: clampDur(c, c.cue('sg-parser-bytes-0').start, 0.3) }));
  });
  c.on('sg-parser-provisional', () => {
    s.play(provHi.to(1, { duration: clampDur(c, c.cue('sg-parser-provisional').start, 0.3) }));
  });
  c.on('sg-parser-pairs', () => {
    s.play(pairsOn.to(1, { duration: clampDur(c, c.cue('sg-parser-pairs').start, 0.35) }));
  });
  c.on('sg-duplicate-reject', () => {
    s.play(dupReject.to(1, { duration: clampDur(c, c.cue('sg-duplicate-reject').start, 0.35) }));
  });
  c.on('sg-parser-last', () => {
    s.play(lastWins.to(1, { duration: clampDur(c, c.cue('sg-parser-last').start, 0.35) }));
  });
  c.on('sg-parser-bytes-1', () => {
    s.play(act.to(1, { duration: clampDur(c, c.cue('sg-parser-bytes-1').start, 0.4) }));
  });
  c.on('sg-parser-constants', () => {
    s.play(constReject.to(1, { duration: clampDur(c, c.cue('sg-parser-constants').start, 0.35) }));
  });
  c.on('sg-parser-overflow', () => {
    s.play(overflowOn.to(1, { duration: clampDur(c, c.cue('sg-parser-overflow').start, 0.35) }));
  });
  c.on('sg-finite-reject', () => {
    s.play(finiteReject.to(1, { duration: clampDur(c, c.cue('sg-finite-reject').start, 0.35) }));
  });
  c.on('sg-parser-object', () => {
    s.play(arrayReject.to(1, { duration: clampDur(c, c.cue('sg-parser-object').start, 0.35) }));
  });
  c.on('sg-parser-bytes-2', () => {
    s.play(act.to(2, { duration: clampDur(c, c.cue('sg-parser-bytes-2').start, 0.4) }));
  });
  c.on('sg-parser-incomplete', () => {
    s.play(
      incompleteStop.to(1, { duration: clampDur(c, c.cue('sg-parser-incomplete').start, 0.4) }),
    );
  });
}
