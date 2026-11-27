// Scene 21 (earned-transfer): "Two reports on the same batch"
// Finale: Report A fakes lower mean (1.04 -> 0.693) by dividing by 3 (including ignored token);
// Report B earns 0.693 by doubling p1 (0.25 -> 0.50)! Repair A -> back to 1.040; hand off to RNNs.
import {
  COSMOS,
  DANGER_COLOR,
  MARK_COLOR,
  MODEL,
  TARGET_COLOR,
  WORD_COLOR,
  aura,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

const L1_START = Math.log(4); // 1.386
const L2_START = Math.log(2); // 0.693
const BASE_SUM = MODEL.freshSum; // 2.079
const BASE_MEAN = MODEL.freshMean; // 1.040

export default function earnedTransfer(s, c) {
  const showTargets = s.value(0);
  const showIgnored = s.value(0);
  const showLosses = s.value(0);
  const showSum = s.value(0);
  const showStartMean = s.value(0);

  const divA = s.value(2); // 2 -> 3 (bug!) -> 2 (repaired!)
  const p1B = s.value(0.25); // 0.25 -> 0.50 (genuine learning!)
  const showPredict = s.value(0);

  const showAnswerB = s.value(0);
  const showCountDiag = s.value(0);
  const showRepaired = s.value(0);
  const showEarned = s.value(0);
  const showNextRnn = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a3d34', '#3a193218');
  const title = heroTitle(['Two Reports on', 'the Same Batch'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: TARGET_COLOR,
    eyebrow: 'EARNED TRANSFER · DIAGNOSTIC FINALE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const dA = divA.value;
    const pB1 = p1B.value;
    const lB1 = -Math.log(pB1);
    const sumB = lB1 + L2_START;
    const meanA = BASE_SUM / dA;
    const meanB = sumB / 2;

    const aBroken = dA > 2.4;
    const bImproved = pB1 > 0.35;
    const rev = showAnswerB.value > 0.5;

    const nodes = [
      // Divider between Report A (left) and Report B (right) + quiet persistent footer balance
      rule(0, -245, 0, 230, COSMOS.rule, 2).opacity(0.8),
      rule(-855, 230, 855, 230, COSMOS.cyan, 2.2).opacity(0.6),
      txt(
        'SAME 3-POSITION BATCH   ·   COMPARE PREDICTIONS AND REDUCTION DIVISORS',
        -855,
        440,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
    ];

    const renderReport = (cxLeft, titleText, p1, l1, div, mean, accentCol, isA) => {
      const x0 = cxLeft;
      nodes.push(txt(titleText, x0, -238, 30, accentCol, 'mono', 'left').glow(6, accentCol));
      const rows = [
        { y: -158, label: 'tok 1', p: p1, l: l1, col: WORD_COLOR[0] },
        { y: -88, label: 'tok 2', p: 0.5, l: L2_START, col: TARGET_COLOR },
        { y: -18, label: 'tok 3', p: null, l: 0, col: COSMOS.dim },
      ];
      rows.forEach((r, idx) => {
        const isIgn = idx === 2;
        const vis = isIgn ? showIgnored.value : Math.max(0.35, showTargets.value);
        nodes.push(
          txt(r.label, x0, r.y, 28, isIgn ? COSMOS.dim : COSMOS.ink, 'mono', 'left').opacity(vis),
        );
        if (!isIgn) {
          const bw = r.p * 260;
          nodes.push(
            lumBar(x0 + 125 + bw / 2, r.y, bw, 32, {
              color: r.col,
              fillOpacity: 0.76,
              glow: 8,
              opacity: vis,
            }),
            txt(`p=${r.p.toFixed(2)}`, x0 + 140 + bw, r.y, 26, r.col, 'mono', 'left').opacity(vis),
          );
          if (showLosses.value > 0.02) {
            nodes.push(
              txt(`L=${r.l.toFixed(2)}`, x0 + 540, r.y, 28, MARK_COLOR, 'mono', 'left').opacity(
                showLosses.value,
              ),
            );
          }
        } else {
          const ignTag = isA && aBroken ? 'counted in divisor' : 'ignored (−100)';
          nodes.push(
            txt(
              ignTag,
              x0 + 125,
              r.y,
              26,
              isA && aBroken ? (rev ? DANGER_COLOR : COSMOS.cyan) : COSMOS.dim,
              'mono',
              'left',
            ).opacity(vis),
          );
        }
      });

      if (showSum.value > 0.02) {
        const sumVal = l1 + L2_START;
        nodes.push(
          txt(
            `Sum = ${sumVal.toFixed(2)}   ÷   divisor = ${div.toFixed(0)}`,
            x0,
            68,
            28,
            isA && aBroken && rev ? DANGER_COLOR : COSMOS.muted,
            'mono',
            'left',
          ).opacity(showSum.value),
        );
      }

      if (showStartMean.value > 0.02) {
        const mCol =
          isA && aBroken && rev
            ? DANGER_COLOR
            : !isA && bImproved && rev
              ? TARGET_COLOR
              : MARK_COLOR;
        nodes.push(
          txt(`Mean = ${mean.toFixed(3)} nats`, x0, 148, 42, mCol, 'mono', 'left')
            .glow(8, mCol)
            .opacity(showStartMean.value),
        );
      }
    };

    renderReport(
      -855,
      'REPORT A',
      0.25,
      L1_START,
      dA,
      meanA,
      aBroken && rev ? DANGER_COLOR : COSMOS.cyan,
      true,
    );
    renderReport(
      70,
      'REPORT B',
      pB1,
      lB1,
      2,
      meanB,
      bImproved && rev ? TARGET_COLOR : COSMOS.cyan,
      false,
    );

    // Highlight winner B once answer is spoken (placed cleanly to the right of "Mean = 0.693 nats")
    if (showAnswerB.value > 0.02) {
      nodes.push(
        glowRing(645, 148, 28, TARGET_COLOR, {
          width: 3.5,
          glow: 12,
          opacity: showAnswerB.value,
        }),
        txt('B', 645, 148, 28, TARGET_COLOR, 'mono').opacity(showAnswerB.value),
      );
    }

    // Bottom diagnostic / prediction / next-lesson footer (clean floating typography)
    if (showPredict.value > 0.02 && showAnswerB.value < 0.8) {
      nodes.push(
        txt(
          'Both reports read 0.693 nats. Which one shows a genuinely better prediction?',
          -855,
          292,
          32,
          MARK_COLOR,
          'serif',
          'left',
        )
          .glow(6, MARK_COLOR)
          .opacity(showPredict.value * (1 - showAnswerB.value)),
      );
    }

    // Non-overlapping crossfade between diagnostic footer and NEXT lesson banner (P5 clean!)
    const diagFade = Math.max(0, 1 - showNextRnn.value * 2.6);
    const nextFade = Math.max(0, (showNextRnn.value - 0.45) / 0.55);

    if (showCountDiag.value > 0.02 && diagFade > 0.02) {
      nodes.push(
        txt(
          'Report A: predictions never moved; dividing by 3 diluted loss with an ignored token',
          -855,
          278,
          28,
          DANGER_COLOR,
          'sans',
          'left',
        ).opacity(showCountDiag.value * diagFade),
      );
    }

    if (showRepaired.value > 0.02 && diagFade > 0.02) {
      nodes.push(
        txt(
          'Repaired A (÷ 2): returns to 1.040 nats',
          -855,
          332,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(showRepaired.value * diagFade),
      );
    }

    if (showEarned.value > 0.02 && diagFade > 0.02) {
      nodes.push(
        txt(
          'Report B earned 0.693 nats: tok 1 probability doubled (0.25 → 0.50)',
          -855,
          388,
          28,
          TARGET_COLOR,
          'mono',
          'left',
        )
          .glow(7, TARGET_COLOR)
          .opacity(showEarned.value * diagFade),
      );
    }

    if (nextFade > 0.02) {
      nodes.push(
        rule(-855, 255, 855, 255, COSMOS.rule, 2).opacity(nextFade),
        txt(
          'NEXT: Recurrent Networks: carrying preceding words forward in a hidden state',
          0,
          325,
          34,
          COSMOS.cyan,
          'serif',
        )
          .glow(8, COSMOS.cyan)
          .opacity(nextFade),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  // Beat 0
  tweenCue(s, c, 'fresh-targets', showTargets, 1, { duration: 0.45 });
  tweenCue(s, c, 'fresh-ignored', showIgnored, 1, { duration: 0.45 });
  tweenCue(s, c, 'fresh-two-losses', showLosses, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'fresh-loss-sum', showSum, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'fresh-start', showStartMean, 1, { duration: 0.45 });

  // Beat 1
  tweenCue(s, c, 'earned-dashboard', divA, 3, { duration: 0.7 });
  tweenCue(s, c, 'fresh-b-update', p1B, 0.5, { duration: 0.7 });
  tweenCue(s, c, 'earned-predict', showPredict, 1, { duration: 0.45 });

  // Beat 2
  tweenCue(s, c, 'fresh-b-answer', showAnswerB, 1, { duration: 0.45 });
  tweenCue(s, c, 'fresh-counted', showCountDiag, 1, { duration: 0.45 });
  c.after('fresh-mean-repair', () => {
    s.play(divA.to(2, { duration: 0.65 }));
    s.play(showRepaired.to(1, { duration: 0.45 }));
  });
  tweenCue(s, c, 'fresh-earned', showEarned, 1, { duration: 0.45 });

  // Beat 3
  tweenCue(s, c, 'earned-next', showNextRnn, 1, { duration: 0.55 });
}
