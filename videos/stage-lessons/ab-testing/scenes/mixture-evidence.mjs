// Scene 13 (mixture-evidence): "Which model expected this outcome?"
// Single stream mSPRT: 1 success -> 0.5 & 1.5 (avg 1.0) -> 1 failure -> 0.667 & 1.0 (avg 0.833) -> 20-outcome stream (10 S -> peak 28.833 > 20 -> prediction hold -> 10 F -> drops to 0.509, running max stays 28.833, p = 0.0347!).
import { line } from 'vizmatic/stage';
import {
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  TRT_COLOR,
  WARN_COLOR,
  aura,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  makePlot,
  mixtureEvidence,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const ROWS = mixtureEvidence(); // n = 0..20

export default function mixtureEvidenceScene(s, c) {
  const phase = s.value(0);
  const step1 = s.value(0); // 0 -> 1 (first success), 2 (then failure)
  const hitA = s.value(0);
  const hitB = s.value(0);
  const showAvg = s.value(0);
  const showExp = s.value(0);
  const toStream = s.value(0);
  const streamN = s.value(0); // 0 -> 10 -> 20
  const showAsk = s.value(0);
  const showAnytime = s.value(0);
  const showTwoArms = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a30', '#261b4f20');
  const title = heroTitle(['Always-Valid Inference:', 'Mixture Martingale & Running Max'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: CTRL_COLOR,
    eyebrow: 'mSPRT · VILLE’S INEQUALITY (1/α = 20)',
  });

  const live = guardedDynamic(s.value(1), () => {
    const nodes = [];

    // Part 1: 2-step hand calculation (Model 20% vs Model 60% against Null 40%)
    const p1Op = Math.max(0, 1 - toStream.value * 2.6);
    if (p1Op > 0.02) {
      const s1 = step1.value;
      const r20 = s1 < 0.5 ? 1.0 : s1 < 1.5 ? 0.5 : 2 / 3;
      const r60 = s1 < 0.5 ? 1.0 : s1 < 1.5 ? 1.5 : 1.0;
      const avg = (r20 + r60) / 2;

      nodes.push(
        txt(
          'NULL = 40% SUCCESS   ·   EQUAL WEIGHTS ON 20% AND 60% MODELS',
          -855,
          -245,
          26,
          CTRL_COLOR,
          'mono',
          'left',
        ).opacity(p1Op),
        lumBar(-430, -100, 810, 130, {
          color: CTRL_COLOR,
          fillOpacity: 0.16,
          glow: 7,
          opacity: p1Op,
        }),
        txt('Model A (20% alt)', -805, -130, 28, CTRL_COLOR, 'mono', 'left').opacity(p1Op),
        txt(`Likelihood ratio = ${r20.toFixed(3)}`, -805, -75, 36, CTRL_COLOR, 'mono', 'left')
          .glow(7, CTRL_COLOR)
          .opacity(p1Op),

        lumBar(445, -100, 800, 130, {
          color: TRT_COLOR,
          fillOpacity: 0.16,
          glow: 7,
          opacity: p1Op,
        }),
        txt('Model B (60% alt)', 75, -130, 28, TRT_COLOR, 'mono', 'left').opacity(p1Op),
        txt(`Likelihood ratio = ${r60.toFixed(3)}`, 75, -75, 36, TRT_COLOR, 'mono', 'left')
          .glow(7, TRT_COLOR)
          .opacity(p1Op),

        lumBar(0, 105, 1690, 124, { color: WARN_COLOR, fillOpacity: 0.16, glow: 8, opacity: p1Op }),
        txt(
          `MIXTURE AVERAGE Λ = (${r20.toFixed(3)} + ${r60.toFixed(3)}) / 2 = ${avg.toFixed(3)}`,
          0,
          82,
          36,
          WARN_COLOR,
          'mono',
        )
          .glow(8, WARN_COLOR)
          .opacity(p1Op),
        txt(
          'Under the null, E[next Λ | history] = current Λ (nonnegative martingale)',
          0,
          135,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(p1Op),
      );
    }

    // Part 2: 20-outcome stream (10 successes -> peak 28.833 -> 10 failures -> drops to 0.509 while max stays 28.833!)
    const p2Op = Math.max(0, (toStream.value - 0.45) / 0.55);
    if (p2Op > 0.02) {
      const plot = makePlot(-820, -230, 1140, 440, { x: [0, 20], y: [0, 32] });
      const nCur = Math.max(0, Math.min(20, Math.round(streamN.value)));
      const curPts = [];
      const maxPts = [];
      for (let i = 0; i <= nCur; i++) {
        curPts.push(plot.pt([ROWS[i].n, ROWS[i].current]));
        maxPts.push(plot.pt([ROWS[i].n, ROWS[i].maximum]));
      }

      nodes.push(
        ...plot.axesNodes(0.85),
        txt(
          '20-OUTCOME STREAM (10 SUCCESSES THEN 10 FAILURES)',
          -820,
          -265,
          26,
          CTRL_COLOR,
          'mono',
          'left',
        ).opacity(p2Op),
        // Stopping line 1/alpha = 20
        line(plot.pt([0, 20]), plot.pt([20, 20]), {
          stroke: WARN_COLOR,
          width: 3.5,
          dash: [9, 6],
        })
          .glow(7, WARN_COLOR)
          .opacity(p2Op),
        txt(
          '1 / α = 20',
          plot.left + 18,
          plot.yPx(20) - 24,
          26,
          WARN_COLOR,
          'mono',
          'left',
        ).opacity(p2Op),
        ...[0, 5, 10, 15, 20].map((k) =>
          txt(
            `n=${k}`,
            plot.xPx(k),
            plot.bottom + 36,
            26,
            k === 10 ? GOOD_COLOR : COSMOS.muted,
            'mono',
          ).opacity(p2Op),
        ),
      );

      if (maxPts.length >= 2) {
        nodes.push(
          glowingTrail(maxPts, { color: WARN_COLOR, width: 4.5, glow: 10, opacity: p2Op }),
        );
      }
      if (curPts.length >= 2) {
        nodes.push(
          glowingTrail(curPts, {
            gradientColors: [CTRL_COLOR, GOOD_COLOR, BAD_COLOR],
            width: 4.2,
            glow: 9,
            opacity: p2Op,
          }),
        );
      }
      if (curPts.length >= 1) {
        const last = ROWS[nCur];
        const ptC = curPts[curPts.length - 1];
        nodes.push(
          glowDot(ptC[0], ptC[1], { radius: 9, color: COSMOS.ink, glow: 12, opacity: p2Op }),
          txt(
            `Current Λ = ${last.current.toFixed(3)}`,
            390,
            -145,
            30,
            CTRL_COLOR,
            'mono',
            'left',
          ).opacity(p2Op),
          txt(`Running max = ${last.maximum.toFixed(3)}`, 390, -75, 30, WARN_COLOR, 'mono', 'left')
            .glow(7, WARN_COLOR)
            .opacity(p2Op),
          txt(`Anytime p = ${last.p.toFixed(4)}`, 390, -5, 30, GOOD_COLOR, 'mono', 'left')
            .glow(7, GOOD_COLOR)
            .opacity(Math.max(0.25, showAnytime.value) * p2Op),
        );
      }

      // Strict prediction withholding before failures deal
      const askOp = showAsk.value * Math.max(0, 1 - showAnytime.value * 2.6) * p2Op;
      if (askOp > 0.02) {
        nodes.push(
          txt(
            'Ten failures arrive next and pull Λ down. What happens to the running maximum?',
            -855,
            345,
            30,
            WARN_COLOR,
            'serif',
            'left',
          )
            .glow(7, WARN_COLOR)
            .opacity(askOp),
        );
      }
      const anyOp = Math.max(0, (showAnytime.value - 0.45) / 0.55) * p2Op;
      if (anyOp > 0.02) {
        nodes.push(
          txt(
            showTwoArms.value > 0.5
              ? 'Two-arm tests leave the shared null rate unknown: use a derived two-arm mSPRT!'
              : 'Current Λ drops to 0.509, yet running max STAYS at 28.833 (anytime p = 0.0347)!',
            -855,
            345,
            28,
            showTwoArms.value > 0.5 ? COSMOS.cyan : GOOD_COLOR,
            'mono',
            'left',
          )
            .glow(6, showTwoArms.value > 0.5 ? COSMOS.cyan : GOOD_COLOR)
            .opacity(anyOp),
        );
      }
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'success', step1, 1, { duration: 0.45 });
  tweenCue(s, c, 'first-hit', hitA, 1, { duration: 0.35 });
  tweenCue(s, c, 'second-hit', hitB, 1, { duration: 0.35 });
  tweenCue(s, c, 'average', showAvg, 1, { duration: 0.35 });
  tweenCue(s, c, 'failure', step1, 2, { duration: 0.45 });
  tweenCue(s, c, 'first-miss', hitA, 0.5, { duration: 0.35 });
  tweenCue(s, c, 'second-miss', hitB, 0.5, { duration: 0.35 });
  tweenCue(s, c, 'second-average', showAvg, 0.6, { duration: 0.35 });
  tweenCue(s, c, 'expected', showExp, 1, { duration: 0.4 });
  tweenCue(s, c, 'restart', toStream, 1, { duration: 0.55 });
  tweenCue(s, c, 'ten', streamN, 10, { duration: 0.9 });
  tweenCue(s, c, 'ask', showAsk, 1, { duration: 0.45 });
  tweenCue(s, c, 'failures', streamN, 20, { duration: 1.0, after: true });
  tweenCue(s, c, 'anytime', showAnytime, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'two-arms', showTwoArms, 1, { duration: 0.45 });
}
