// Scene 21: effect-denominators - Which traces count as unsafe?
// Mode 0 (Beats 0-2): Trace A (2 forbidden effects) vs Trace B (1 denied attempt) with
// strict prediction withholding until AFTER `trace-answer` -> 1 of 2 unsafe traces.
// Mode 1 (Beat 3): Dual 95% Wilson interval rulers computed directly from `wilsonBounds`
// for ASR (10/100 = 10%, [5.5%, 17.4%]) vs FRR (40/1000 = 4%, [3.0%, 5.4%]).
import { group, line, rect } from 'vizmatic/stage';
import {
  ASR_SAMPLE,
  COSMOS,
  FRR_SAMPLE,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function effectDenominators(s, c) {
  const pulse = s.value(0);
  const writeHi = s.value(0);
  const discHi = s.value(0);
  const traceBHi = s.value(0);
  const questionHi = s.value(0);
  const answerReveal = s.value(0);
  const ratesMode = s.value(0); // 0 = Trace A/B count, 1 = ASR/FRR Wilson intervals
  const frrOn = s.value(0);
  const wilsonOn = s.value(0);

  const header = cinemaHeader(
    'TRACE DENOMINATORS & WILSON INTERVALS',
    'Which traces count',
    'as unsafe?',
    { accent: ROLE.attack, size: 48 },
  );

  const stageAura = aura(150, 30, 620, '#ff6b8b1a', '#5ce1e61a');

  // Mode 0: Trace A (2 forbidden effects) vs Trace B (denied attempt)
  const mode0 = guardedDynamic(
    () => fadeOutHalf(ratesMode.value),
    (a) => {
      const wh = writeHi.value;
      const dh = discHi.value;
      const tb = traceBHi.value;
      const qh = questionHi.value;
      const ar = answerReveal.value;
      const nodes = [];

      // Left: Trace A (2 forbidden effects in ONE trace)
      nodes.push(
        energyRail(-855, -200, 175, ROLE.attack, { width: 6, glow: 9, opacity: a }),
        txt('TRACE A (1 EVALUATED TRACE)', -825, -176, 26, ROLE.attack, 'mono', 'left').opacity(a),
        rect(545, 86, { fill: '#22101a', stroke: ROLE.denied, width: 2.4, radius: 8 })
          .at(-552, -76)
          .opacity(a * Math.max(0.45, wh)),
        txt('EFFECT 1: Unauthorized write', -800, -76, 28, ROLE.denied, 'mono', 'left').opacity(
          a * Math.max(0.45, wh),
        ),
        rect(545, 86, { fill: '#22101a', stroke: ROLE.denied, width: 2.4, radius: 8 })
          .at(-552, 42)
          .opacity(a * Math.max(0.45, dh)),
        txt('EFFECT 2: Private field leaked', -800, 42, 28, ROLE.denied, 'mono', 'left').opacity(
          a * Math.max(0.45, dh),
        ),
        txt(
          '2 forbidden effects inside Trace A',
          -825,
          144,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      );

      // Center: Trace B (denied attempt -> 0 forbidden effects)
      nodes.push(
        energyRail(-195, -200, 175, ROLE.source, { width: 6, glow: 6 + tb * 5, opacity: a }),
        txt('TRACE B (2nd TRACE)', -165, -176, 26, ROLE.source, 'mono', 'left').opacity(a),
        rect(450, 96, { fill: '#0e1529', stroke: ROLE.ok, width: 2.4, radius: 8 })
          .at(60, -20)
          .opacity(a * Math.max(0.45, tb)),
        txt('Write requested -> DENIED', -140, -34, 26, ROLE.ok, 'mono', 'left').opacity(a),
        txt('0 forbidden effects', -140, 10, 26, COSMOS.muted, 'sans', 'left').opacity(a),
        txt(
          'Still counts in denominator (N = 2)',
          -165,
          144,
          26,
          ROLE.source,
          'mono',
          'left',
        ).opacity(a),
      );

      // Right: Unsafe Trace Counter (withheld strictly until answerReveal!)
      const preAns = fadeOutHalf(ar);
      const postAns = fadeInHalf(ar);
      nodes.push(
        rect(460, 270, {
          fill: '#0e1529',
          stroke: postAns > 0.3 ? ROLE.host : ROLE.focus,
          width: 3,
          radius: 12,
        })
          .at(600, -15)
          .glow(8, postAns > 0.3 ? ROLE.host : ROLE.focus)
          .opacity(a),
        txt('UNSAFE TRACE COUNT', 600, -108, 26, COSMOS.muted, 'mono', 'center').opacity(a),
      );

      if (preAns > 0.02) {
        nodes.push(
          txt('? / 2', 600, -10, 62, ROLE.question, 'mono', 'center')
            .glow(10, ROLE.question)
            .opacity(a * preAns),
          txt('Count traces, not events?', 600, 74, 26, ROLE.focus, 'serif', 'center').opacity(
            a * preAns,
          ),
        );
      }
      if (postAns > 0.02) {
        nodes.push(
          txt('1 / 2', 600, -18, 66, ROLE.host, 'mono', 'center')
            .glow(12, ROLE.host)
            .opacity(a * postAns),
          txt('1 UNSAFE TRACE (50%)', 600, 64, 26, ROLE.host, 'mono', 'center').opacity(
            a * postAns,
          ),
        );
      }

      // Bottom band: Prediction question -> Answer explanation
      if (preAns > 0.02) {
        nodes.push(
          txt(
            qh > 0.3
              ? 'How many traces go in the unsafe count?'
              : 'Safe tool doubles record proposals, calls, real effects, and completion',
            0,
            320,
            30,
            qh > 0.3 ? ROLE.question : COSMOS.muted,
            qh > 0.3 ? 'serif' : 'sans',
            'center',
          )
            .glow(qh > 0.3 ? 8 : 0, ROLE.question)
            .opacity(a * preAns),
        );
      }
      if (postAns > 0.02) {
        nodes.push(
          txt(
            'ONE TRACE · Both effects belong to Trace A · Trace B puts 2 in the denominator',
            0,
            308,
            28,
            ROLE.host,
            'mono',
            'center',
          )
            .glow(6, ROLE.host)
            .opacity(a * postAns),
          txt(
            'ASR counts each affected trace once, even if the model refused after the damage',
            0,
            366,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(a * postAns),
        );
      }

      return group(...nodes);
    },
  );

  // Mode 1: Dual 95% Wilson Interval Rulers (ASR 10/100 vs FRR 40/1000)
  const mode1 = guardedDynamic(
    () => fadeInHalf(ratesMode.value),
    (a) => {
      const p = pulse.value;
      const fr = frrOn.value;
      const wi = wilsonOn.value;
      const nodes = [];

      const rx0 = -150;
      const rx1 = 810;
      const maxPct = 22;
      const mapX = (pct) => rx0 + (pct / maxPct) * (rx1 - rx0);

      // Percentage axis ticks
      nodes.push(
        txt(
          'TWO-SIDED 95% WILSON CONFIDENCE INTERVALS',
          (rx0 + rx1) * 0.5,
          -210,
          26,
          ROLE.host,
          'mono',
          'center',
        ).opacity(a),
        line([rx0, 215], [rx1, 215], { stroke: '#344770', width: 2.6 }).opacity(a),
      );
      for (const tick of [0, 5, 10, 15, 20]) {
        const tx = mapX(tick);
        nodes.push(
          line([tx, -160], [tx, 215], { stroke: '#1e2b4b', width: 1.5, dash: [5, 7] }).opacity(a),
          txt(`${tick}%`, tx, 255, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        );
      }

      // Row 1: Attack Success Rate (10 / 100 = 10%, Wilson [5.5%, 17.4%])
      const asrY = -75;
      const asrLo = ASR_SAMPLE.bounds[0] * 100;
      const asrHi = ASR_SAMPLE.bounds[1] * 100;
      const asrPt = ASR_SAMPLE.rate * 100;

      nodes.push(
        energyRail(-855, asrY - 62, asrY + 62, ROLE.attack, { width: 6, opacity: a }),
        txt('ATTACK SUCCESS RATE (ASR)', -825, asrY - 34, 26, ROLE.attack, 'mono', 'left').opacity(
          a,
        ),
        txt('10 / 100 = 10.0%', -825, asrY + 18, 34, COSMOS.ink, 'mono', 'left').opacity(a),
        txt(
          `95% Wilson: [${asrLo.toFixed(1)}%, ${asrHi.toFixed(1)}%]`,
          -825,
          asrY + 62,
          26,
          ROLE.attack,
          'mono',
          'left',
        ).opacity(a * Math.max(0.35, wi)),
        line([mapX(asrLo), asrY], [mapX(asrHi), asrY], { stroke: ROLE.attack, width: 10 })
          .glow(10, ROLE.attack)
          .opacity(a * Math.max(0.35, wi)),
        line([mapX(asrLo), asrY - 22], [mapX(asrLo), asrY + 22], {
          stroke: ROLE.attack,
          width: 3.4,
        }).opacity(a * Math.max(0.35, wi)),
        line([mapX(asrHi), asrY - 22], [mapX(asrHi), asrY + 22], {
          stroke: ROLE.attack,
          width: 3.4,
        }).opacity(a * Math.max(0.35, wi)),
        glowDot(mapX(asrPt), asrY, { radius: 9.5, color: '#ffffff', glow: 14, opacity: a }),
        txt(
          'WIDER INTERVAL (N = 100)',
          mapX((asrLo + asrHi) * 0.5),
          asrY - 42,
          26,
          ROLE.attack,
          'mono',
          'center',
        ).opacity(a * Math.max(0.3, wi)),
      );

      // Row 2: False Rejection Rate (40 / 1000 = 4%, Wilson [3.0%, 5.4%])
      const frrY = 105;
      const frrLo = FRR_SAMPLE.bounds[0] * 100;
      const frrHi = FRR_SAMPLE.bounds[1] * 100;
      const frrPt = FRR_SAMPLE.rate * 100;
      const fAlpha = a * Math.max(0.3, fr);

      nodes.push(
        energyRail(-855, frrY - 62, frrY + 62, ROLE.focus, { width: 6, opacity: fAlpha }),
        txt('FALSE REJECTION RATE (FRR)', -825, frrY - 34, 26, ROLE.focus, 'mono', 'left').opacity(
          fAlpha,
        ),
        txt('40 / 1000 = 4.0%', -825, frrY + 18, 34, COSMOS.ink, 'mono', 'left').opacity(fAlpha),
        txt(
          `95% Wilson: [${frrLo.toFixed(1)}%, ${frrHi.toFixed(1)}%]`,
          -825,
          frrY + 62,
          26,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(fAlpha * Math.max(0.35, wi)),
        line([mapX(frrLo), frrY], [mapX(frrHi), frrY], { stroke: ROLE.focus, width: 10 })
          .glow(10, ROLE.focus)
          .opacity(fAlpha * Math.max(0.35, wi)),
        line([mapX(frrLo), frrY - 22], [mapX(frrLo), frrY + 22], {
          stroke: ROLE.focus,
          width: 3.4,
        }).opacity(fAlpha * Math.max(0.35, wi)),
        line([mapX(frrHi), frrY - 22], [mapX(frrHi), frrY + 22], {
          stroke: ROLE.focus,
          width: 3.4,
        }).opacity(fAlpha * Math.max(0.35, wi)),
        glowDot(mapX(frrPt), frrY, { radius: 9.5, color: '#ffffff', glow: 14, opacity: fAlpha }),
        txt(
          'TIGHTER INTERVAL (N = 1,000)',
          mapX(frrHi) + 24,
          frrY,
          26,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(fAlpha * Math.max(0.3, wi)),
      );

      nodes.push(
        txt(
          'PAIR EVERY RATE WITH ITS DENOMINATOR, WILSON INTERVAL & ANSWER QUALITY CHECK',
          0,
          355,
          26,
          ROLE.host,
          'mono',
          'center',
        ).opacity(a),
        glowDot(rx0 + ((p * 0.28) % 1) * (rx1 - rx0), 215, {
          radius: 4.5,
          color: ROLE.host,
          glow: 8,
          opacity: a,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1);
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('trace-intro', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('trace-intro').start, 0.25) }));
  });
  c.on('trace-write', () => {
    s.play(writeHi.to(1, { duration: clampDur(c, c.cue('trace-write').start, 0.35) }));
  });
  c.on('trace-disclosure', () => {
    s.play(discHi.to(1, { duration: clampDur(c, c.cue('trace-disclosure').start, 0.35) }));
  });
  c.on('trace-other', () => {
    s.play(traceBHi.to(1, { duration: clampDur(c, c.cue('trace-other').start, 0.35) }));
  });
  // Strict prediction boundary cue
  c.after('trace-question', () => {
    s.play(questionHi.to(1, { duration: clampDur(c, c.cue('trace-question').end, 0.25) }));
  });
  // Strict prediction withholding: reveal 1 / 2 ONLY AFTER spoken answer!
  c.after('trace-answer', () => {
    s.play(answerReveal.to(1, { duration: clampDur(c, c.cue('trace-answer').end, 0.35) }));
  });
  c.on('rates-report', () => {
    s.play(ratesMode.to(1, { duration: clampDur(c, c.cue('rates-report').start, 0.4) }));
  });
  c.on('rates-benign', () => {
    s.play(frrOn.to(1, { duration: clampDur(c, c.cue('rates-benign').start, 0.35) }));
  });
  c.on('rates-intervals', () => {
    s.play(wilsonOn.to(1, { duration: clampDur(c, c.cue('rates-intervals').start, 0.4) }));
  });
}
