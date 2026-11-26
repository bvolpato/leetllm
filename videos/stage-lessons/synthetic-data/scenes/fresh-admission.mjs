// Scene 19: Would you release this search assistant? (Finale: 12M budget, 3 release gates HOLD, 50-case rare gap +2)
import {
  COSMOS,
  RELEASE_RATES,
  RELEASE_SUITES,
  RELEASE_VERDICT,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function freshAdmission(s, c) {
  const phase = s.value(0);
  // Act 1: Token budget & prep cost prediction
  const sTokens = s.value(0);
  const sMix = s.value(0);
  const sPrepPrem = s.value(0);
  const sCostAsk = s.value(0);
  const sExtraCost = s.value(0);
  // Act 2: Three release gates prediction
  const sAct2 = s.value(0);
  const sCommonRule = s.value(0);
  const sCommonCnt = s.value(0);
  const sRareRule = s.value(0);
  const sRareCnt = s.value(0);
  const sUnsafeRule = s.value(0);
  const sUnsafeCnt = s.value(0);
  const sGateAsk = s.value(0);
  const sDecision = s.value(0);
  // Act 3: 50 rare cases +2 gap prediction
  const sAct3 = s.value(0);
  const sGapAsk = s.value(0);
  const sTwoMore = s.value(0);
  const sWouldPass = s.value(0);
  const sObsOnly = s.value(0);
  const sNextAct = s.value(0);

  const bgAura = aura(0, 15, 680, '#123a5c2a', '#35172b18');

  const title = heroTitle(['Would You Release This', 'Search Assistant?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'RELEASE GATES FINALE · TOKEN COST, SLICE FLOORS & RARE GAP',
  });

  const rare = RELEASE_SUITES.find((r) => r.id === 'rare');
  const gap = rare.limit - rare.count;

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    // Act 3: 50 Rare Cases Precision Meter (38 observed vs 40 floor -> +2 gap!)
    if (sAct3.value > 0.5) {
      const askG = sGapAsk.value > 0.3 && sTwoMore.value < 0.5;
      const hypo = sTwoMore.value > 0.5 && sObsOnly.value < 0.5;
      const wld = sWouldPass.value > 0.5 && hypo;
      const obs = sObsOnly.value > 0.5;
      const nxt = sNextAct.value > 0.3;

      const leftX = -810;
      const totalW = 1620;
      const step = totalW / rare.total;
      const barY = 42;
      const floorX = leftX + rare.limit * step;
      const obsX = leftX + rare.count * step;

      const nodes = [
        txt(
          'RARE SLICE: RETRY, THEN PAGINATE (50 HELD-OUT SEARCHES)',
          leftX,
          -186,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ),

        // Gold floor marker at 40 / 50
        txt(
          `FLOOR: ${rare.limit} / ${rare.total} (80%)`,
          floorX,
          barY - 118,
          28,
          COSMOS.gold,
          'mono',
        ),
        line([floorX, barY - 88], [floorX, barY + 86], { stroke: COSMOS.gold, width: 4.2 }).glow(
          9,
          COSMOS.gold,
        ),
      ];

      for (let i = 0; i < rare.total; i++) {
        const cx = leftX + (i + 0.5) * step;
        const isObs = i < rare.count;
        const isGap = hypo && i >= rare.count && i < rare.limit;
        const fill = isObs ? '#1d4ed8' : isGap ? '#b45309' : '#10182b';
        const stroke = isObs ? COSMOS.blue : isGap ? COSMOS.gold : COSMOS.rule;
        nodes.push(
          rect(step - 4, 118, { fill, stroke, width: isGap ? 2.6 : 1.4, radius: 3 })
            .at(cx, barY)
            .glow(isGap ? 10 * pulse : 0, COSMOS.gold),
        );
      }

      nodes.push(
        line([obsX, barY + 64], [obsX, barY + 112], { stroke: COSMOS.blue, width: 4 }),
        txt(
          `Observed: ${rare.count} correct`,
          obsX - 18,
          barY + 148,
          30,
          COSMOS.blue,
          'mono',
          'right',
        ),
      );

      if (hypo) {
        nodes.push(
          txt(`+${gap} needed`, floorX + 18, barY + 148, 30, COSMOS.gold, 'mono', 'left').glow(
            6,
            COSMOS.gold,
          ),
        );
      }

      let foot = '50 rare searches vs floor of 40';
      let footCol = COSMOS.cyan;
      if (askG) {
        foot = 'PREDICT: How many more correct answers reach the floor of 40?';
        footCol = COSMOS.gold;
      } else if (hypo) {
        foot = `+${gap} more -> 40 / 50 meets floor`;
        footCol = COSMOS.gold;
      } else if (obs) {
        foot = 'HOLD (38/50) · audit retry batches & retest';
        footCol = COSMOS.rose;
      }

      nodes.push(
        glassCell(0, 344, 1660, 102, footCol, { fill: '#10182b', glow: nxt ? 11 * pulse : 7 }),
        glowDot(-790, 344, { radius: 7, color: footCol }),
        txt(foot, -755, 346, 26, footCol, 'mono', 'left'),
      );
      return group(...nodes);
    }

    // Act 2: Three Held-Out Release Gates Table
    if (sAct2.value > 0.5) {
      const hasVerdict = sDecision.value > 0.5;
      const askGate = sGateAsk.value > 0.3 && !hasVerdict;

      const cols = [-815, -240, 140, 560];
      const nodes = [
        txt(
          'FICTIONAL HELD-OUT EVALUATION · DECLARED RELEASE GATES',
          -815,
          -196,
          26,
          COSMOS.blue,
          'mono',
          'left',
        ),
        txt('SLICE', cols[0], -136, 26, COSMOS.muted, 'mono', 'left'),
        txt('OBSERVED', cols[1], -136, 26, COSMOS.muted, 'mono', 'left'),
        txt('RELEASE RULE', cols[2], -136, 26, COSMOS.muted, 'mono', 'left'),
        txt('RATE', cols[3], -136, 26, COSMOS.muted, 'mono', 'left'),
        line([-825, -106], [835, -106], { stroke: COSMOS.rule, width: 2.2 }),
      ];

      const ruleVals = [sCommonRule.value, sRareRule.value, sUnsafeRule.value];
      const cntVals = [sCommonCnt.value, sRareCnt.value, sUnsafeCnt.value];

      RELEASE_SUITES.forEach((slc, i) => {
        const y = -28 + i * 124;
        const rOn = ruleVals[i] > 0.2;
        const cOn = cntVals[i] > 0.5;
        const pass = RELEASE_VERDICT.passes[i];
        const col = hasVerdict ? (pass ? COSMOS.emerald : COSMOS.rose) : COSMOS.cyan;
        const reqText = `${slc.id === 'unsafe' ? 'At most' : 'At least'} ${slc.limit} / ${slc.total}`;

        nodes.push(
          glassCell(5, y, 1660, 96, rOn ? col : COSMOS.rule, {
            fill: hasVerdict ? (pass ? '#0e2824' : '#281119') : '#0f1b30',
            glow: hasVerdict && !pass ? 10 * pulse : rOn ? 5 : 1,
            opacity: rOn ? 1 : 0.45,
          }),
          txt(slc.label, cols[0], y + 2, 30, COSMOS.ink, 'sans', 'left'),
          txt(
            cOn ? `${slc.count} / ${slc.total}` : `? / ${slc.total}`,
            cols[1],
            y + 2,
            34,
            cOn ? col : COSMOS.gold,
            'mono',
            'left',
          ),
          txt(rOn ? reqText : 'pending...', cols[2], y + 2, 28, COSMOS.ink, 'mono', 'left'),
          txt(
            cOn ? `${(RELEASE_RATES[slc.id] * 100).toFixed(1)}%` : '...',
            cols[3],
            y + 2,
            30,
            cOn ? col : COSMOS.dim,
            'mono',
            'left',
          ),
        );
      });

      const bannerCol = hasVerdict ? COSMOS.rose : COSMOS.gold;
      const bannerTxt = hasVerdict
        ? 'HOLD THIS RELEASE · rare searches (38/50) miss floor of 40 (other two pass)'
        : askGate
          ? 'PREDICT: Which gate, if any, should hold this checkpoint?'
          : 'Apply every declared slice floor before approving a checkpoint';

      nodes.push(
        glassCell(5, 360, 1660, 96, bannerCol, { fill: '#10182b', glow: 8 }),
        glowDot(-785, 360, { radius: 7, color: bannerCol }),
        txt(bannerTxt, -750, 362, 28, bannerCol, 'mono', 'left'),
      );
      return group(...nodes);
    }

    // Act 1: 12M Token Mixture & +18 Compute Units Preparation Cost Prediction
    const tok = Math.max(0.75, sTokens.value);
    const mix = sMix.value;
    const prp = sPrepPrem.value > 0.2;
    const askC = sCostAsk.value > 0.3 && sExtraCost.value < 0.5;
    const ext = sExtraCost.value > 0.5;

    const barX = -380;
    const unit = 96; // 12 * 96 = 1152 px

    const nodes = [
      txt(
        'MATCHED STARTING CHECKPOINT · 12 MILLION TRAINING TOKENS',
        -815,
        -196,
        26,
        COSMOS.blue,
        'mono',
        'left',
      ),

      // Baseline bar: 12M real
      txt('BASELINE', -815, -72, 30, COSMOS.blue, 'mono', 'left'),
      rect(12 * unit, 88, { fill: '#173f7a', stroke: COSMOS.blue, width: 2.6, radius: 8 })
        .at(barX + 6 * unit, -72)
        .opacity(tok)
        .glow(6, COSMOS.blue),
      txt('12M real tokens', barX + 6 * unit, -70, 30, COSMOS.ink, 'mono'),

      // Candidate bar: 8M real + 4M synthetic
      txt('CANDIDATE', -815, 72, 30, COSMOS.cyan, 'mono', 'left'),
      rect(12 * unit, 88, { fill: '#0c1222', stroke: COSMOS.cyan, width: 2.2, radius: 8 }).at(
        barX + 6 * unit,
        72,
      ),
      rect((12 - 4 * mix) * unit, 88, {
        fill: '#173f7a',
        stroke: COSMOS.blue,
        width: 2.2,
        radius: 6,
      }).at(barX + (12 - 4 * mix) * unit * 0.5, 72),
      rect(Math.max(4, 4 * mix * unit), 88, {
        fill: '#0e4a5c',
        stroke: COSMOS.cyan,
        width: 2.4,
        radius: 6,
      })
        .at(barX + (12 - 2 * mix) * unit, 72)
        .opacity(Math.max(0.15, mix)),
      txt(
        mix > 0.5 ? '8M real' : '12M training tokens',
        barX + (mix > 0.5 ? 4 * unit : 6 * unit),
        74,
        30,
        COSMOS.ink,
        'mono',
      ),
    ];

    if (mix > 0.5) {
      nodes.push(txt('4M synth', barX + 10 * unit, 74, 28, COSMOS.cyan, 'mono'));
    }

    // Preparation cost bar
    nodes.push(
      glassCell(0, 214, 1630, 92, prp ? COSMOS.amber : COSMOS.rule, {
        fill: prp ? '#241a0d' : '#0c1222',
        glow: prp ? 7 : 2,
      }),
      txt('GENERATION & SCREENING OVERHEAD', -775, 216, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        prp ? '+18 extra compute units' : 'extra pipeline compute...',
        775,
        216,
        32,
        prp ? COSMOS.amber : COSMOS.dim,
        'mono',
        'right',
      ),

      // Cost prediction rail (strictly withholds answer until c.after('fresh-extra-cost'))
      glassCell(0, 355, 1630, 96, ext ? COSMOS.emerald : COSMOS.gold, {
        fill: '#10182b',
        glow: 7,
      }),
      glowDot(-775, 355, { radius: 7, color: ext ? COSMOS.emerald : COSMOS.gold }),
      txt(
        ext
          ? 'ANSWER: Leaves out generation + screening work (+18 units) & fewer real tokens!'
          : askC
            ? 'PREDICT: What work does the equal 12M token count leave out?'
            : 'Compare baseline and candidate under equal 12M training tokens',
        -740,
        357,
        26,
        ext ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 16);

  c.on('fresh-tokens', () => s.play(sTokens.to(1, { duration: 0.4 })));
  c.on('fresh-mixture', () => s.play(sMix.to(1, { duration: 0.7 })));
  c.on('fresh-generation-premise', () => s.play(sPrepPrem.to(1, { duration: 0.4 })));
  c.on('fresh-cost-predict', () => s.play(sCostAsk.to(1, { duration: 0.4 })));
  c.after('fresh-extra-cost', () => s.play(sExtraCost.to(1, { duration: 0.35 })));

  c.on('common-rule', () => {
    s.play(sAct2.to(1, { duration: 0.3 }), sCommonRule.to(1, { duration: 0.4 }));
  });
  c.after('common-count', () => s.play(sCommonCnt.to(1, { duration: 0.35 })));
  c.on('rare-rule', () => s.play(sRareRule.to(1, { duration: 0.4 })));
  c.after('rare-count', () => s.play(sRareCnt.to(1, { duration: 0.35 })));
  c.on('unsafe-rule', () => s.play(sUnsafeRule.to(1, { duration: 0.4 })));
  c.after('fresh-results', () => s.play(sUnsafeCnt.to(1, { duration: 0.35 })));
  c.on('fresh-gate-predict', () => s.play(sGateAsk.to(1, { duration: 0.4 })));
  c.after('fresh-decision', () => s.play(sDecision.to(1, { duration: 0.35 })));

  c.on('rare-detail', () => s.play(sAct3.to(1, { duration: 0.35 })));
  c.on('gap-question', () => s.play(sGapAsk.to(1, { duration: 0.4 })));
  c.after('two-more', () => s.play(sTwoMore.to(1, { duration: 0.35 })));
  c.after('would-pass', () => s.play(sWouldPass.to(1, { duration: 0.35 })));
  c.after('observed-only', () => s.play(sObsOnly.to(1, { duration: 0.35 })));
  c.on('next-action', () =>
    s.play(sNextAct.to(1, { duration: remainDuration(c, 'next-action', 0.45) })),
  );
}
