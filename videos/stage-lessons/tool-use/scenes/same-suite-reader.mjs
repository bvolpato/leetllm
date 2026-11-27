// Scene 12: same-suite-reader - What can these evaluation receipts tell us?
// Act 0: Dual Luminous Receipt Instruments (`c17` vs `c16` on `ranking-suite-v1`) with strict
//        prediction withholding on the `+0.03` lead until AFTER `tu-eval-reader-delta`!
// Act 1: 5-Path Circuit Breaker rejecting 5 malformed/unauthorized proposals (0 reads).
// Act 2: Immutable Receipt Provenance & Connector Text Quarantine.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  EVAL_COMPARISON,
  EVAL_ROWS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  circuitBreaker,
  clampDur,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  glowMeter,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function sameSuiteReader(s, c) {
  const pulse = s.value(0);
  const act = s.value(0); // 0 = receipts + delta, 1 = 5 rejections, 2 = provenance
  const v17On = s.value(0);
  const v16On = s.value(0);
  const deltaReveal = s.value(0);
  const rejectSweep = s.value(0);

  const [row17, row16] = EVAL_ROWS;
  const deltaStr = `+${EVAL_COMPARISON.delta.toFixed(2)}`;

  const header = cinemaHeader(
    'SAME-SUITE EVALUATION READER',
    'What can these receipts',
    'actually tell us?',
    { accent: ROLE.runtime, size: 48 },
  );

  const stageAura = aura(120, 40, 620, '#5ce1e622', '#6ee7b718');

  // Act 0: Two receipts + live subtraction (strictly withheld until tu-eval-reader-delta!)
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const p = 0;
      const r17 = v17On.value;
      const r16 = v16On.value;
      const dl = deltaReveal.value;
      const nodes = [];

      nodes.push(
        txt(
          `SUITE: ${row17.suite}  (LIKE-FOR-LIKE COMPARISON)`,
          0,
          -210,
          26,
          ROLE.runtime,
          'mono',
          'center',
        ).opacity(a),
      );

      // Left Receipt: reranker-v17 / c17
      const lx = -780;
      nodes.push(
        energyRail(lx, -155, 85, ROLE.ok, { opacity: a }),
        txt(
          `${row17.version}  ·  call_id: ${row17.call_id}`,
          lx + 30,
          -135,
          28,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(a),
        txt(r17 > 0.4 ? row17.score.toFixed(2) : '?', lx + 30, -45, 76, ROLE.ok, 'mono', 'left')
          .glow(8, ROLE.ok)
          .opacity(a),
        glowMeter(lx + 30, 35, 620, 28, r17 > 0.4 ? row17.score : 0.08, {
          fill: ROLE.ok,
          opacity: a,
        }),
        txt(`gate: ${row17.gate}`, lx + 30, 82, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      );

      // Right Receipt: reranker-v16 / c16
      const rx = 80;
      nodes.push(
        energyRail(rx, -155, 85, ROLE.proposal, { opacity: a }),
        txt(
          `${row16.version}  ·  call_id: ${row16.call_id}`,
          rx + 30,
          -135,
          28,
          ROLE.proposal,
          'mono',
          'left',
        ).opacity(a),
        txt(
          r16 > 0.4 ? row16.score.toFixed(2) : '?',
          rx + 30,
          -45,
          76,
          ROLE.proposal,
          'mono',
          'left',
        )
          .glow(8, ROLE.proposal)
          .opacity(a),
        glowMeter(rx + 30, 35, 620, 28, r16 > 0.4 ? row16.score : 0.08, {
          fill: ROLE.proposal,
          opacity: a,
        }),
        txt(`gate: ${row16.gate}`, rx + 30, 82, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      );

      // Bottom difference readout (strict prediction withholding!)
      nodes.push(
        line([-855, 165], [840, 165], { stroke: '#25355a', width: 2 }).opacity(a),
        beamWithPhotons(
          [
            [-420, 165],
            [420, 165],
          ],
          dl > 0.5 ? ROLE.ok : ROLE.focus,
          p * 1.1,
          { alpha: a * (0.4 + r16 * 0.6), width: 3.2 },
        ),
        txt(
          dl > 0.5
            ? `0.84 - 0.81 = ${deltaStr}   (v17 leads on this suite)`
            : r16 > 0.4
              ? '0.84 - 0.81 = ?   (How far ahead is v17?)'
              : 'Awaiting both evaluation receipts...',
          0,
          255,
          38,
          dl > 0.5 ? ROLE.ok : ROLE.focus,
          'mono',
          'center',
        )
          .glow(8, dl > 0.5 ? ROLE.ok : ROLE.focus)
          .opacity(a),
        txt(
          'Deployment still requires a separate permission & policy check',
          0,
          340,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 1: 5 Invalid Proposals Deflected by 5 Circuit Breakers
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = 0;
      const sw = rejectSweep.value;
      const nodes = [];

      const cases = [
        ['promote_model({})', 'get_eval only'],
        ['{"version": "reranker-v99"}', 'outside caller allowed set'],
        ['{"version": "v17", "approved": true}', 'extra field forbidden'],
        ['{"version": "v17", "version": "v16"}', 'duplicate version key'],
        ['{"version":', 'truncated JSON'],
      ];

      nodes.push(
        txt(
          'ALLOWLIST: get_eval · EXACTLY 1 ALLOWED VERSION',
          -855,
          -210,
          26,
          ROLE.runtime,
          'mono',
          'left',
        ).opacity(a),
      );

      cases.forEach(([callStr, reason], i) => {
        const y = -130 + i * 95;
        const active = Math.min(1, Math.max(0.25, sw * 5 - i + 0.5));
        nodes.push(
          energyRail(-855, y - 26, y + 26, ROLE.denied, { opacity: a * active }),
          txt(callStr, -825, y, 26, COSMOS.ink, 'mono', 'left').opacity(a * active),
          beamWithPhotons(
            [
              [-110, y],
              [70, y],
            ],
            ROLE.denied,
            p * 1.2 + i * 0.18,
            { alpha: a * active, width: 3 },
          ),
          circuitBreaker(145, y, 95, 1, ROLE.ok, { opacity: a * active }),
          txt(reason, 240, y, 26, ROLE.denied, 'mono', 'left')
            .glow(6, ROLE.denied)
            .opacity(a * active),
        );
      });

      nodes.push(
        txt(
          '5 REJECTED PROPOSALS  ·  0 SERVICE READS DISPATCHED',
          0,
          380,
          28,
          ROLE.focus,
          'mono',
          'center',
        )
          .glow(7, ROLE.focus)
          .opacity(a * (0.4 + sw * 0.6)),
      );

      return group(...nodes);
    },
  );

  // Act 2: Immutable Provenance & Connector Text Quarantine
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const nodes = [];
      const fields = [
        ['CALL IDENTITY', 'c17  /  c16  (pinned to each read)', ROLE.key],
        ['SUITE & REVISION', 'ranking-suite-v1  (never mix suites)', ROLE.runtime],
        ['SCORE & GATE', '0.84 / 0.81  ·  passed (immutable)', ROLE.ok],
        ['CONNECTOR TEXT', 'Evidence only · NEVER policy authority', ROLE.untrusted],
      ];

      nodes.push(
        txt(
          'IMMUTABLE RECEIPT FIELDS CARRIED TO FINAL ANSWER',
          -855,
          -205,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(a),
      );
      fields.forEach(([k, v, col], i) => {
        const y = -115 + i * 112;
        nodes.push(
          energyRail(-855, y - 30, y + 32, col, { opacity: a }),
          txt(k, -825, y, 28, col, 'mono', 'left').glow(6, col).opacity(a),
          txt(v, -310, y, 28, COSMOS.ink, 'sans', 'left').opacity(a),
        );
      });

      nodes.push(
        line([-855, 325], [840, 325], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          'Different suites cannot support a like-for-like comparison',
          0,
          382,
          28,
          ROLE.focus,
          'serif',
          'center',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1, act2);

  c.on('tu-same-suite-reader-1', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('tu-same-suite-reader-1').start, 0.25) }));
  });
  c.on('tu-eval-reader-inputs', () => {
    s.play(v17On.to(1, { duration: clampDur(c, c.cue('tu-eval-reader-inputs').start, 0.35) }));
  });
  c.on('tu-eval-reader-sixteen', () => {
    s.play(v16On.to(1, { duration: clampDur(c, c.cue('tu-eval-reader-sixteen').start, 0.35) }));
  });
  // Strict prediction withholding: reveal +0.03 AFTER tu-eval-reader-delta!
  c.after('tu-eval-reader-delta', () => {
    s.play(deltaReveal.to(1, { duration: clampDur(c, c.cue('tu-eval-reader-delta').end, 0.35) }));
  });
  c.on('tu-same-suite-reader-2', () => {
    s.play(act.to(1, { duration: clampDur(c, c.cue('tu-same-suite-reader-2').start, 0.35) }));
  });
  c.on('tu-eval-reader-reject', () => {
    s.play(rejectSweep.to(1, { duration: clampDur(c, c.cue('tu-eval-reader-reject').start, 0.8) }));
  });
  c.on('tu-same-suite-reader-3', () => {
    s.play(act.to(2, { duration: clampDur(c, c.cue('tu-same-suite-reader-3').start, 0.35) }));
  });
}
