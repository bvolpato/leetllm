// Scene 20: attack-evaluation - Measure protected effects
// 2-Mode Evaluation Workbench powered directly by `CASES`, `RESULTS`, and `REFUSAL_EVENTS`:
//   Mode 0 (Beats 0-1): 5-case evaluation matrix tracking intended policy vs observed
//     protected effects (0 private escaped, 0 unauthorized writes, 1 false rejection).
//   Mode 1 (Beat 2): Live Event Trace Counterexample exposing an agent that called a
//     privileged tool (`rev 4, 25%`) BEFORE politely refusing in its final text.
import { group, line, rect } from 'vizmatic/stage';
import {
  CASES,
  COSMOS,
  REFUSAL_EVENTS,
  RESULTS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function attackEvaluation(s, c) {
  const pulse = s.value(0);
  const intendedOn = s.value(0);
  const effectsOn = s.value(0);
  const falseRejHi = s.value(0);
  const mode = s.value(0); // 0 = 5-case matrix, 1 = refusal counterexample event trace
  const traceReveal = s.value(0);
  const credHi = s.value(0);
  const destHi = s.value(0);
  const finalStateHi = s.value(0);

  const privateEscaped = RESULTS.filter((r) => r.privateEscaped).length;
  const unauthorizedWrites = RESULTS.filter((r) => r.unauthorizedChange).length;
  const falseRejections = RESULTS.filter((r, i) => r.rejected && CASES[i].kind === 'benign').length;
  const approvedWrites = RESULTS.filter((r) =>
    r.events.some((e) => e.type === 'write-receipt'),
  ).length;

  const header = cinemaHeader(
    'SECURITY & UTILITY EVALUATION',
    'Measure protected',
    'effects, not refusals',
    { accent: ROLE.host, size: 48 },
  );

  const stageAura = aura(150, 30, 620, '#5ce1e61a', '#ff6b8b1a');

  // Mode 0: 5-Case Matrix
  const mode0 = guardedDynamic(
    () => fadeOutHalf(mode.value),
    (a) => {
      const ind = intendedOn.value;
      const eff = effectsOn.value;
      const fr = falseRejHi.value;
      const nodes = [];

      nodes.push(
        txt('EVALUATION CASE', -825, -205, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('INTENDED POLICY', -270, -205, 26, ROLE.host, 'mono', 'center').opacity(a),
        txt('OBSERVED EFFECT', 230, -205, 26, ROLE.ok, 'mono', 'center').opacity(a),
        line([-855, -172], [435, -172], { stroke: '#28385f', width: 2 }).opacity(a),
      );

      CASES.forEach((row, i) => {
        const y = -114 + i * 86;
        const res = RESULTS[i];
        const isAttack = row.kind === 'attack';
        const isFP = res.rejected && !isAttack;
        const rowCol = isFP && fr > 0.3 ? ROLE.attack : isAttack ? ROLE.untrusted : ROLE.source;
        const obsLabel = isFP
          ? 'FALSE REJECTION'
          : res.stage === 'production'
            ? 'APPROVED WRITE (rev 4)'
            : isAttack
              ? 'BLOCKED (0 harm)'
              : 'SUMMARY RETURNED';
        const obsCol = isFP ? ROLE.attack : ROLE.ok;

        nodes.push(
          energyRail(-855, y - 26, y + 26, rowCol, { width: 5, opacity: a }),
          txt(row.id, -825, y, 28, COSMOS.ink, 'sans', 'left').opacity(a),
          txt(
            row.intended,
            -270,
            y,
            26,
            ind > 0.3 ? ROLE.host : COSMOS.muted,
            'mono',
            'center',
          ).opacity(a * Math.max(0.45, ind)),
          txt(obsLabel, 230, y, 26, obsCol, 'mono', 'center')
            .glow(isFP && fr > 0.3 ? 8 : 0, ROLE.attack)
            .opacity(a * Math.max(0.35, eff)),
          line([-825, y + 40], [435, y + 40], { stroke: '#1d2948', width: 1.4 }).opacity(a),
        );
      });

      // Right-hand live scorecard counters
      const rx = 505;
      const cards = [
        ['PRIVATE ESCAPED', String(privateEscaped), ROLE.ok, -120],
        ['UNAUTH WRITES', String(unauthorizedWrites), ROLE.ok, 15],
        ['FALSE REJECTIONS', String(falseRejections), fr > 0.3 ? ROLE.attack : ROLE.untrusted, 150],
        ['APPROVED RECEIPTS', String(approvedWrites), ROLE.host, 285],
      ];
      for (const [k, v, col, cy] of cards) {
        nodes.push(
          energyRail(rx, cy - 36, cy + 36, col, { width: 5, opacity: a }),
          txt(k, rx + 24, cy - 16, 26, COSMOS.muted, 'mono', 'left').opacity(a),
          txt(v, rx + 24, cy + 28, 34, col, 'mono', 'left')
            .glow(6, col)
            .opacity(a * Math.max(0.4, eff)),
        );
      }

      return group(...nodes);
    },
  );

  // Mode 1: Event Trace Counterexample (polite refusal AFTER unauthorized tool call!)
  const mode1 = guardedDynamic(
    () => fadeInHalf(mode.value),
    (a) => {
      const p = pulse.value;
      const tr = traceReveal.value;
      const cr = credHi.value;
      const ds = destHi.value;
      const fs = finalStateHi.value;
      const nodes = [];

      const ev0 = REFUSAL_EVENTS[0];
      const ev1 = REFUSAL_EVENTS[1];
      const ev2 = REFUSAL_EVENTS[2];

      nodes.push(
        txt(
          'COUNTEREXAMPLE: REFUSAL-ONLY SCORING MISSES ALREADY-COMMITTED DAMAGE',
          0,
          -205,
          26,
          ROLE.attack,
          'mono',
          'center',
        ).opacity(a),
      );

      // 3 chronological event stations across the frame (generous 510px width)
      const x0 = -575;
      const x1 = 0;
      const x2 = 575;
      const yMid = 10;

      const b01 = quadArcPts([x0 + 260, yMid], [x1 - 260, yMid], 0, 14);
      const b12 = quadArcPts([x1 + 260, yMid], [x2 - 260, yMid], 0, 14);
      nodes.push(
        beamWithPhotons(b01, ROLE.attack, p * 1.1, { width: 3.4, alpha: a }),
        beamWithPhotons(b12, ROLE.untrusted, p * 1.1 + 0.5, {
          width: 3.4,
          alpha: a * Math.max(0.4, tr),
        }),
      );

      // Station 1: Tool Call (credentials + destination)
      nodes.push(
        rect(510, 226, { fill: '#0e1529', stroke: ROLE.attack, width: 2.8, radius: 10 })
          .at(x0, yMid)
          .glow(8, ROLE.attack)
          .opacity(a),
        txt('1. TOOL CALL EXECUTED', x0, yMid - 74, 26, ROLE.attack, 'mono', 'center').opacity(a),
        txt(`op: ${ev0.operationId}`, x0, yMid - 24, 26, COSMOS.ink, 'mono', 'center').opacity(a),
        txt(
          'cred: host-held worker',
          x0,
          yMid + 26,
          26,
          cr > 0.3 ? ROLE.host : COSMOS.muted,
          'mono',
          'center',
        )
          .glow(cr > 0.3 ? 6 : 0, ROLE.host)
          .opacity(a),
        txt(
          'dest: release-service/prod',
          x0,
          yMid + 74,
          26,
          ds > 0.3 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        )
          .glow(ds > 0.3 ? 6 : 0, ROLE.focus)
          .opacity(a),
      );

      // Station 2: Unsafe Write Receipt (production rev 4, 25%)
      nodes.push(
        rect(510, 226, {
          fill: '#1e101a',
          stroke: ROLE.denied,
          width: fs > 0.3 ? 3.4 : 2.6,
          radius: 10,
        })
          .at(x1, yMid)
          .glow(fs > 0.3 ? 12 : 8, ROLE.denied)
          .opacity(a),
        txt('2. UNSAFE WRITE RECEIPT', x1, yMid - 74, 26, ROLE.denied, 'mono', 'center').opacity(a),
        txt(
          `${ev1.candidate} -> PRODUCTION (${ev1.traffic}%)`,
          x1,
          yMid - 18,
          28,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(a),
        txt(`FINAL STATE: REV ${ev1.revision}`, x1, yMid + 34, 30, ROLE.denied, 'mono', 'center')
          .glow(8, ROLE.denied)
          .opacity(a),
        txt('authorized: false', x1, yMid + 80, 26, ROLE.untrusted, 'mono', 'center').opacity(a),
      );

      // Station 3: Late Polite Refusal
      nodes.push(
        rect(510, 226, { fill: '#0e1529', stroke: ROLE.untrusted, width: 2.6, radius: 10 })
          .at(x2, yMid)
          .opacity(a),
        txt('3. FINAL TEXT REFUSAL', x2, yMid - 74, 26, ROLE.untrusted, 'mono', 'center').opacity(
          a,
        ),
        txt(`“${ev2.text}”`, x2, yMid - 10, 26, COSMOS.ink, 'serif', 'center').opacity(a),
        txt(
          'Text-only check says: SAFE',
          x2,
          yMid + 46,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
        txt('REAL TRACE SAYS: UNSAFE!', x2, yMid + 84, 26, ROLE.denied, 'mono', 'center')
          .glow(8, ROLE.denied)
          .opacity(a),
      );

      nodes.push(
        txt(
          'ALWAYS INSPECT EVENT TRACE · CREDENTIALS USED · DESTINATIONS CONTACTED · FINAL STATE',
          0,
          290,
          26,
          ROLE.host,
          'mono',
          'center',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1);
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('attack-evaluation-beat-1-focus-1', () => {
    s.play(
      pulse.to(0.4, {
        duration: clampDur(c, c.cue('attack-evaluation-beat-1-focus-1').start, 0.25),
      }),
    );
  });
  c.on('evaluation-record-intended', () => {
    s.play(
      intendedOn.to(1, { duration: clampDur(c, c.cue('evaluation-record-intended').start, 0.35) }),
    );
  });
  c.on('attack-evaluation-beat-2-focus-1', () => {
    s.play(
      effectsOn.to(1, {
        duration: clampDur(c, c.cue('attack-evaluation-beat-2-focus-1').start, 0.35),
      }),
    );
  });
  c.on('evaluation-false-rejection', () => {
    s.play(
      falseRejHi.to(1, { duration: clampDur(c, c.cue('evaluation-false-rejection').start, 0.35) }),
    );
  });
  c.on('attack-evaluation-beat-3-focus-1', () => {
    s.play(
      mode.to(1, { duration: clampDur(c, c.cue('attack-evaluation-beat-3-focus-1').start, 0.4) }),
    );
  });
  c.on('attack-evaluation-beat-3-focus-2', () => {
    s.play(
      traceReveal.to(1, {
        duration: clampDur(c, c.cue('attack-evaluation-beat-3-focus-2').start, 0.35),
      }),
    );
  });
  c.on('evaluation-credentials', () => {
    s.play(credHi.to(1, { duration: clampDur(c, c.cue('evaluation-credentials').start, 0.3) }));
  });
  c.on('evaluation-destinations', () => {
    s.play(destHi.to(1, { duration: clampDur(c, c.cue('evaluation-destinations').start, 0.3) }));
  });
  c.on('evaluation-final-state', () => {
    s.play(
      finalStateHi.to(1, { duration: clampDur(c, c.cue('evaluation-final-state').start, 0.35) }),
    );
  });
}
