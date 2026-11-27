// Scene 14: scorer-contract - Which records can the scorer use?
// 3-mode luminous Scorer Validation Pipeline (no boxed tables!):
//   Mode 0: Boolean quality gate (true vs "true" vs 1) with verdict withheld until AFTER beat-0 cue
//   Mode 1: Strict schema & ordering laser checks (unique ID, duplicate, missing r06, NaN, send < sched)
//   Mode 2: Unboxed glowing qualification telemetry across r01..r06 + success-only latency population.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SERVING_COHORT,
  aura,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowingTrail,
  guardedDynamic,
  servingRequestMetrics,
  txt,
} from '../parts.mjs';

export default function scorerContract(s, c) {
  const showBoolVerdict = s.value(0); // strictly AFTER scorer-contract-beat-0
  const mode01 = s.value(0); // 0 = boolean flags, 1 = schema checks
  const mode12 = s.value(0); // 0 = schema checks, 1 = qualification matrix
  const popFocus = s.value(0); // scorer-contract-beat-3

  const header = cinemaHeader('STRICT SCORER CONTRACT', 'Which records can', 'the scorer use?', {
    x: -860,
    y: -435,
    accent: ROLE.open,
    size: 50,
  });

  const stageAura = aura(140, 20, 680, '#5ce1e61a', '#6ee7b716');

  // Mode 0: Three quality flags entering the boolean parser gate
  const view0 = guardedDynamic(
    () => fadeOutHalf(mode01.value),
    (a) => {
      const sv = showBoolVerdict.value;
      const flags = [
        { code: '"quality_pass": true', type: 'boolean', ok: true },
        { code: '"quality_pass": "true"', type: 'string (quoted)', ok: false },
        { code: '"quality_pass": 1', type: 'number', ok: false },
      ];
      const nodes = [
        txt('QUALITY JUDGMENT RECORD', -780, -195, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('PARSER GATE', 220, -195, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      ];

      flags.forEach((f, i) => {
        const yy = -85 + i * 145;
        const col = sv < 0.1 ? ROLE.workload : f.ok ? ROLE.qualified : ROLE.fail;
        nodes.push(
          glowDot(-800, yy, { radius: 9.5, color: col, glow: 10, opacity: a }),
          glowingTrail(
            [
              [-780, yy],
              [140, yy],
            ],
            { color: col, width: 4.5, glow: 8, opacity: a },
          ),
          txt(f.code, -740, yy - 38, 34, COSMOS.ink, 'mono', 'left').opacity(a),
        );
        if (sv > 0.1) {
          nodes.push(
            txt(
              f.ok ? `ACCEPTED  ·  ${f.type}` : `REJECTED  ·  ${f.type}`,
              220,
              yy,
              30,
              col,
              'mono',
              'left',
            )
              .glow(6, col)
              .opacity(a * sv),
          );
        }
      });

      nodes.push(
        txt(
          'Adapter supplies token events  ·  Separate quality check supplies boolean judgment',
          0,
          410,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 1: Strict parser & cohort integrity checks
  const view1 = guardedDynamic(
    () => fadeInHalf(mode01.value) * fadeOutHalf(mode12.value),
    (a) => {
      const checks = [
        { label: 'Unique known manifest IDs', status: 'REQUIRED', ok: true },
        { label: 'Duplicate JSON keys / duplicate IDs', status: 'REJECTED (malformed)', ok: false },
        { label: 'Missing terminal record (e.g. r06)', status: 'REJECTED (incomplete)', ok: false },
        {
          label: 'NaN / Infinity / negative timestamps',
          status: 'REJECTED (nonfinite)',
          ok: false,
        },
        { label: 'scheduled <= sent <= tokens <= terminal', status: 'REQUIRED ORDER', ok: true },
      ];
      const nodes = [
        txt('PARSER & COHORT INVARIANTS', -800, -210, 26, ROLE.focus, 'mono', 'left').opacity(a),
      ];
      checks.forEach((ck, i) => {
        const yy = -125 + i * 102;
        const col = ck.ok ? ROLE.qualified : ROLE.fail;
        nodes.push(
          glowDot(-800, yy, { radius: 8.5, color: col, glow: 9, opacity: a }),
          line([-780, yy + 38], [800, yy + 38], { stroke: '#17223a', width: 1.5 }).opacity(a),
          txt(ck.label, -755, yy, 28, COSMOS.ink, 'sans', 'left').opacity(a),
          txt(ck.status, 800, yy, 28, col, 'mono', 'right').glow(5, col).opacity(a),
        );
      });
      nodes.push(
        txt(
          'Every offered ID needs exactly one terminal outcome before scoring proceeds',
          0,
          418,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 2: Unboxed glowing qualification telemetry across r01..r06
  const view2 = guardedDynamic(
    () => fadeInHalf(mode12.value),
    (a) => {
      const pf = popFocus.value;
      const topY = -148;
      const stepY = 74;
      const cols = [-840, -610, -340, -110, 145, 420, 740];
      const heads = ['ID', 'STATUS', 'TOKENS', 'QUALITY', 'TTFT<=300', 'TPOT<=80', 'QUAL'];

      const nodes = heads.map((h, i) =>
        txt(h, cols[i], topY - 58, 26, COSMOS.muted, 'mono', i === 0 ? 'left' : 'center').opacity(
          a,
        ),
      );

      SERVING_COHORT.forEach((r, i) => {
        const m = servingRequestMetrics(r);
        const yy = topY + i * stepY;
        const qCol = m.qualified
          ? ROLE.qualified
          : r.status === 'timeout'
            ? ROLE.timeout
            : ROLE.fail;
        const vals = [
          r.id,
          r.status,
          String(r.tokens.length),
          r.quality ? 'true' : 'false',
          `${m.ttft}ms`,
          m.tpot === null ? 'n/a' : `${m.tpot}ms`,
          m.qualified ? 'YES' : 'NO',
        ];
        nodes.push(
          line([-840, yy + 34], [830, yy + 34], { stroke: '#162038', width: 1.4 }).opacity(a),
        );
        vals.forEach((v, j) => {
          let col = COSMOS.ink;
          if (j === 0) col = ROLE.open;
          if (j === 1 && r.status !== 'success') col = ROLE.timeout;
          if (j === 3 && !r.quality) col = ROLE.fail;
          if (j === 4 && m.ttft > 300) col = ROLE.fail;
          if (j === 5 && m.tpot === null) col = ROLE.focus;
          if (j === 6) col = qCol;
          nodes.push(
            txt(v, cols[j], yy, 28, col, 'mono', j === 0 ? 'left' : 'center')
              .glow(j === 6 ? 6 : 0, col)
              .opacity(a),
          );
        });
      });

      // Bottom summary: Beat 2 vs Beat 3
      if (pf > 0.3) {
        nodes.push(
          txt(
            'LATENCY PERCENTILES: 5 SUCCESSFUL  ·  ATTAINMENT DENOMINATOR: 6 OFFERED',
            0,
            356,
            28,
            ROLE.focus,
            'mono',
          )
            .glow(6, ROLE.focus)
            .opacity(a * pf),
          txt(
            'Report prints input byte hashes  ·  Capacity estimate = null (no sweep yet)',
            0,
            414,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(a * pf),
        );
      } else {
        nodes.push(
          txt(
            '3 QUALIFY  ·  5 PROTOCOL SUCCESS  ·  6 OFFERED (not_sent / timeout stay in denominator)',
            0,
            372,
            26,
            ROLE.open,
            'mono',
          ).opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view0, view1, view2);

  c.after('scorer-contract-beat-0', () => {
    const t = c.cue('scorer-contract-beat-0').end;
    s.play(showBoolVerdict.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('scorer-contract-beat-1', () => {
    const t = c.cue('scorer-contract-beat-1').start;
    s.play(mode01.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('scorer-contract-beat-2', () => {
    const t = c.cue('scorer-contract-beat-2').start;
    s.play(mode12.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('scorer-contract-beat-3', () => {
    const t = c.cue('scorer-contract-beat-3').start;
    s.play(popFocus.to(1, { duration: clampDur(c, t, 0.4) }));
  });
}
