// Scene 7: strict-contract - Represent optional values without permitting surprise authority
// 3-Act Strict Pydantic & Duplicate-Key Parser Divergence Showcase:
//   Act 0: release_id pattern (1..128 ASCII) + strict=True + extra="forbid"
//   Act 1: include_gates matrix (omitted / null / true pass; numeric 1 rejected) + OpenAI strict required-null
//   Act 2: Duplicate JSON key divergence (object_pairs_hook rejects vs default json.loads keeps last)
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
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  hexGate,
  txt,
} from '../parts.mjs';

export default function strictContract(s, c) {
  const pulse = s.value(0);
  const act = s.value(0); // 0 = id+extra, 1 = bool|null+required, 2 = duplicate-key divergence
  const idOn = s.value(0);
  const extraOn = s.value(0);
  const nullOn = s.value(0);
  const boolOn = s.value(0);
  const reqNullOn = s.value(0);
  const dupReaderOn = s.value(0);
  const dupDefaultOn = s.value(0);

  const header = cinemaHeader(
    'STRICT PYDANTIC CONTRACT',
    'Represent optional fields',
    'without surprise authority',
    { accent: ROLE.runtime, size: 46 },
  );

  const stageAura = aura(160, 40, 620, '#5ce1e622', '#ffd16618');

  // Act 0: Identifier Regex + Strict Mode + extra="forbid"
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const p = pulse.value;
      const idv = idOn.value;
      const ex = extraOn.value;
      const nodes = [];

      nodes.push(
        txt(
          'RELEASE IDENTIFIER PATTERN  (1 TO 128 ASCII)',
          -855,
          -210,
          26,
          ROLE.runtime,
          'mono',
          'left',
        ).opacity(a),
        txt('^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$', -855, -155, 34, ROLE.key, 'mono', 'left')
          .glow(idv > 0.3 ? 7 : 3, ROLE.key)
          .opacity(a),
      );

      // Test cases along left -> hex gate -> right
      const rows = [
        ['"reranker-v16"', true, 'Starts with letter -> PASS', ROLE.ok],
        ['"_rc9"', false, 'Leading "_" -> REJECT', ROLE.fail],
        ['{"promote_now": true}', false, 'extra="forbid" -> REJECT', ROLE.fail],
      ];
      rows.forEach(([payload, pass, verdict, col], i) => {
        const y = -45 + i * 125;
        const active = i === 2 ? 0.35 + ex * 0.65 : 0.45 + idv * 0.55;
        nodes.push(
          energyRail(-855, y - 32, y + 32, col, { opacity: a * active }),
          txt(payload, -825, y, 28, COSMOS.ink, 'mono', 'left').opacity(a * active),
          beamWithPhotons(
            [
              [-360, y],
              [-40, y],
            ],
            col,
            p * 1.1 + i * 0.3,
            { alpha: a * active, width: 3.4 },
          ),
          circuitBreaker(30, y, 95, pass ? 0 : 1, ROLE.ok, { opacity: a * active }),
          txt(verdict, 150, y, 28, col, 'mono', 'left')
            .glow(6, col)
            .opacity(a * active),
        );
      });

      nodes.push(
        line([-855, 315], [840, 315], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          'strict=True disables string/bool coercion (JSON dates remain type-specific)',
          0,
          375,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 1: include_gates nullable Boolean + OpenAI strict schema
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const nl = nullOn.value;
      const bl = boolOn.value;
      const rn = reqNullOn.value;
      const nodes = [];

      nodes.push(
        txt(
          'include_gates : bool | None = None',
          -855,
          -210,
          30,
          ROLE.runtime,
          'mono',
          'left',
        ).opacity(a),
      );

      const cases = [
        ['omitted', 'PASS -> false', ROLE.ok, 0.45 + nl * 0.55],
        ['null', 'PASS -> false', ROLE.ok, 0.45 + nl * 0.55],
        ['true', 'PASS -> fetch gates', ROLE.runtime, 0.4 + bl * 0.6],
        ['1  (int)', 'REJECT: not Boolean', ROLE.fail, 0.4 + bl * 0.6],
      ];

      cases.forEach(([val, res, col, op], i) => {
        const y = -130 + i * 95;
        nodes.push(
          energyRail(-855, y - 26, y + 26, col, { opacity: a * op }),
          txt(val, -825, y, 28, COSMOS.ink, 'mono', 'left').opacity(a * op),
          beamWithPhotons(
            [
              [-550, y],
              [-320, y],
            ],
            col,
            p * 1.1 + i * 0.25,
            { alpha: a * op, width: 3.2 },
          ),
          txt(res, -290, y, 28, col, 'mono', 'left')
            .glow(6, col)
            .opacity(a * op),
        );
      });

      // Right side: OpenAI strict schema requirement
      const rOp = 0.4 + rn * 0.6;
      nodes.push(
        energyRail(165, -165, 215, ROLE.key, { opacity: a * rOp }),
        txt('OPENAI STRICT JSON SCHEMA', 195, -145, 26, ROLE.key, 'mono', 'left').opacity(a * rOp),
        txt(
          'required: ["release_id", "include_gates"]',
          195,
          -80,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a * rOp),
        txt(
          'include_gates: ["boolean", "null"]',
          195,
          -22,
          26,
          ROLE.runtime,
          'mono',
          'left',
        ).opacity(a * rOp),
        txt('additionalProperties: false', 195, 36, 26, ROLE.ok, 'mono', 'left').opacity(a * rOp),
        txt(
          'Generation constraints never replace',
          195,
          125,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a * rOp),
        txt('host value & permission checks', 195, 170, 26, ROLE.focus, 'sans', 'left').opacity(
          a * rOp,
        ),
      );

      return group(...nodes);
    },
  );

  // Act 2: Duplicate JSON keys divergence
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const dr = dupReaderOn.value;
      const dd = dupDefaultOn.value;
      const nodes = [];

      nodes.push(
        txt(
          'INPUT:  {"version": "reranker-v17",  "version": "reranker-v16"}',
          0,
          -180,
          30,
          ROLE.caution,
          'mono',
          'center',
        )
          .glow(6, ROLE.caution)
          .opacity(a),
      );

      // Left branch: Strict object_pairs_hook parser
      const lX = -460;
      nodes.push(
        beamWithPhotons(
          [
            [-140, -135],
            [lX, -35],
          ],
          ROLE.ok,
          p * 1.1,
          { alpha: a, width: 3.4 },
        ),
        hexGate(lX, 45, 76, ROLE.ok, { label: 'HOOK', opacity: a }),
        txt(
          'READER DISPATCHER (object_pairs_hook)',
          lX,
          175,
          26,
          ROLE.ok,
          'mono',
          'center',
        ).opacity(a),
        txt('REJECTS DUPLICATE KEY IMMEDIATELY', lX, 232, 28, ROLE.ok, 'mono', 'center')
          .glow(dr > 0.35 ? 8 : 2, ROLE.ok)
          .opacity(a * (0.4 + dr * 0.6)),
      );

      // Right branch: Default Python json.loads
      const rX = 460;
      nodes.push(
        beamWithPhotons(
          [
            [140, -135],
            [rX, -35],
          ],
          ROLE.fail,
          p * 1.1 + 0.5,
          { alpha: a, width: 3.4 },
        ),
        hexGate(rX, 45, 76, ROLE.fail, { label: 'DEFAULT', opacity: a }),
        txt('DEFAULT json.loads', rX, 175, 26, ROLE.fail, 'mono', 'center').opacity(a),
        txt('SILENTLY KEEPS LAST VALUE ("v16")', rX, 232, 28, ROLE.fail, 'mono', 'center')
          .glow(dd > 0.35 ? 8 : 2, ROLE.fail)
          .opacity(a * (0.4 + dd * 0.6)),
      );

      nodes.push(
        line([-855, 315], [840, 315], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          'Mismatched parsers let validator & executor see different requests',
          0,
          375,
          28,
          ROLE.focus,
          'serif',
          'center',
        )
          .glow(6, ROLE.focus)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1, act2);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('tu-strict-contract-1', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('tu-strict-contract-1').start, 0.25) }));
  });
  c.on('tu-strict-identifier', () => {
    s.play(idOn.to(1, { duration: clampDur(c, c.cue('tu-strict-identifier').start, 0.35) }));
  });
  c.on('tu-strict-extra', () => {
    s.play(extraOn.to(1, { duration: clampDur(c, c.cue('tu-strict-extra').start, 0.35) }));
  });
  c.on('tu-strict-contract-2', () => {
    s.play(act.to(1, { duration: clampDur(c, c.cue('tu-strict-contract-2').start, 0.35) }));
  });
  c.on('tu-strict-null', () => {
    s.play(nullOn.to(1, { duration: clampDur(c, c.cue('tu-strict-null').start, 0.3) }));
  });
  c.on('tu-strict-bool', () => {
    s.play(boolOn.to(1, { duration: clampDur(c, c.cue('tu-strict-bool').start, 0.3) }));
  });
  c.on('tu-strict-required-null', () => {
    s.play(
      reqNullOn.to(1, { duration: clampDur(c, c.cue('tu-strict-required-null').start, 0.35) }),
    );
  });
  c.on('tu-strict-contract-3', () => {
    s.play(act.to(2, { duration: clampDur(c, c.cue('tu-strict-contract-3').start, 0.35) }));
  });
  c.on('tu-duplicate-reader', () => {
    s.play(dupReaderOn.to(1, { duration: clampDur(c, c.cue('tu-duplicate-reader').start, 0.35) }));
  });
  c.on('tu-duplicate-default', () => {
    s.play(
      dupDefaultOn.to(1, { duration: clampDur(c, c.cue('tu-duplicate-default').start, 0.35) }),
    );
  });
}
