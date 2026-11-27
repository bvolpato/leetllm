// Act 4: Speedup Economics, Position Yield, Load Limits & Admission Budget
// (cost, position-yield, load-cost, verification-budget)
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  cinemaRails,
  crossPhase,
  expectedYield,
  glowDot,
  guardedDynamic,
  heroAura,
  heroTitle,
  onCue,
  probBarH,
  tokenPill,
  txt,
  verificationBudget,
  weightWorksheet,
} from '../shared.mjs';

/**
 * Scene 16: cost ("What do five guesses buy?")
 * Phase 1: Geometric yield 1 + 0.8 + ... + 0.8^5 = 3.69 tokens/round, plus timing bars:
 *   Flat verify (1.50 steps -> 2.46x) vs Longer verify (1.75 steps -> prediction withheld -> 2.11x).
 * Phase 2: Depth 5 (3.69 / 1.75 = 2.11x) vs Depth 10 (4.57 / 2.50 = 1.83x).
 */
export function cost(s, c) {
  const alpha = 0.8;
  const y5 = expectedYield(alpha, 5); // 3.68928
  const y10 = expectedYield(alpha, 10); // 4.57050

  const p1 = s.value(1);
  const p2 = s.value(0);

  const termsProg = s.value(0);
  const showYieldVal = s.value(0);
  const showDraftBar = s.value(0);
  const showFlatVerify = s.value(0);
  const showFlatSpeed = s.value(0);
  const showLonger = s.value(0);
  const askSpeed = s.value(0);
  const showSlowSpeed = s.value(0);
  const showMeasure = s.value(0);
  const showDepth10Yield = s.value(0);
  const showDepth10Speed = s.value(0);

  const title = heroTitle(['Expected yield', 'and modeled speedup'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.gold,
    eyebrow: 'ROUND ECONOMICS',
  });

  // Phase 1: Geometric series + flat vs longer verification pass
  const v1 = guardedDynamic(p1, (a) => {
    const tp = termsProg.value;
    const sy = showYieldVal.value;
    const db = showDraftBar.value;
    const fv = showFlatVerify.value;
    const fs = showFlatSpeed.value;
    const lv = showLonger.value;
    const ask = askSpeed.value;
    const ss = showSlowSpeed.value;
    const ms = showMeasure.value;

    const nodes = [];

    // Geometric yield bar ribbon at top
    const terms = [1, 0.8, 0.64, 0.512, 0.4096, 0.32768];
    const labels = ['1', '0.8', '0.8^2', '0.8^3', '0.8^4', '0.8^5'];
    let curX = -830;
    const barY = -175;
    nodes.push(
      txt(
        'EXPECTED TOKENS / ROUND (K=5, alpha=0.80)',
        -830,
        -238,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
    );
    for (let i = 0; i < terms.length; i++) {
      const w = terms[i] * 285;
      const vis = i === 0 ? 1 : Math.max(0, Math.min(1, tp * 5 - (i - 1)));
      if (vis > 0.04) {
        const col = i === 0 ? COSMOS.gold : COSMOS.cyan;
        nodes.push(
          rect(w - 6, 52, {
            fill: i === 0 ? '#ffd16648' : '#5ce1e63c',
            stroke: col,
            width: 2.4,
            radius: 7,
          })
            .at(curX + (w - 6) * 0.5, barY)
            .opacity(vis * a),
          txt(labels[i], curX + (w - 6) * 0.5, barY, 26, COSMOS.ink, 'mono').opacity(vis * a),
        );
      }
      curX += w;
    }
    if (sy > 0.05) {
      nodes.push(
        txt(`= ${y5.toFixed(2)} tokens`, 855, barY, 38, COSMOS.gold, 'mono', 'right')
          .glow(8, COSMOS.gold)
          .opacity(sy * a),
      );
    }

    // Two timing bars: Flat verify (0.50 + 1.00 = 1.50 -> 2.46x) vs Longer verify (0.50 + 1.25 = 1.75 -> ? / 2.11x)
    const unitPx = 470;
    const barLeft = -470;

    // Subtle step-cost reference axis visible only in beat 0 (cleanly below timing bar lane!)
    if (db < 0.04) {
      nodes.push(
        line([barLeft, 248], [barLeft + 1.8 * unitPx, 248], {
          stroke: '#3a4b78',
          width: 2.0,
        }).opacity(a),
        txt(
          'Geometric series: 1 (bonus/correction) + alpha + alpha^2 + ... + alpha^5',
          0,
          198,
          30,
          COSMOS.muted,
          'mono',
        ).opacity(a),
        txt('0.0 steps', barLeft, 288, 26, COSMOS.dim, 'mono', 'left').opacity(a),
        txt('1.0 target step', barLeft + unitPx, 288, 26, COSMOS.dim, 'mono', 'center').opacity(a),
      );
    }

    if (db > 0.04) {
      const yRow1 = 25;
      const dW = 0.5 * unitPx * db;
      const vW = 1.0 * unitPx * fv;
      nodes.push(
        txt('Flat verify', -830, yRow1, 32, COSMOS.ink, 'sans', 'left').opacity(a),
        rect(dW, 56, { fill: '#5ce1e644', stroke: COSMOS.cyan, width: 2.6, radius: 8 })
          .at(barLeft + dW * 0.5, yRow1)
          .opacity(a),
        txt('Draft 0.50', barLeft, yRow1 + 60, 26, COSMOS.cyan, 'mono', 'left').opacity(db * a),
      );
      if (vW > 2) {
        nodes.push(
          rect(vW, 56, { fill: '#60a5fa44', stroke: COSMOS.blue, width: 2.6, radius: 8 })
            .at(barLeft + 0.5 * unitPx + vW * 0.5, yRow1)
            .opacity(a),
          txt(
            'Verify 1.00  (total 1.50)',
            barLeft + 1.0 * unitPx,
            yRow1 + 60,
            26,
            COSMOS.blue,
            'mono',
          ).opacity(fv > 0.35 ? fv * a : 0),
        );
      }
      if (fs > 0.05) {
        nodes.push(
          txt(`${(y5 / 1.5).toFixed(2)}x`, 855, yRow1, 52, COSMOS.emerald, 'mono', 'right')
            .glow(10, COSMOS.emerald)
            .opacity(fs * a),
        );
      }
    }

    if (lv > 0.04) {
      const yRow2 = 205;
      const dW = 0.5 * unitPx;
      const vW = (1.0 + 0.25 * lv) * unitPx;
      nodes.push(
        txt('Longer verify', -830, yRow2, 32, COSMOS.amber, 'sans', 'left').opacity(lv * a),
        rect(dW, 56, { fill: '#5ce1e644', stroke: COSMOS.cyan, width: 2.6, radius: 8 })
          .at(barLeft + dW * 0.5, yRow2)
          .opacity(lv * a),
        rect(vW, 56, { fill: '#fb923c48', stroke: COSMOS.amber, width: 2.8, radius: 8 })
          .at(barLeft + dW + vW * 0.5, yRow2)
          .glow(8, COSMOS.amber)
          .opacity(lv * a),
        txt(
          'Verify 1.25  (total 1.75)',
          barLeft + dW + vW * 0.5,
          yRow2 + 60,
          26,
          COSMOS.amber,
          'mono',
        ).opacity(lv * a),
        txt(
          ss > 0.25 ? `${(y5 / 1.75).toFixed(2)}x` : ask > 0.2 ? '?' : '...',
          855,
          yRow2,
          52,
          ss > 0.25 ? COSMOS.gold : COSMOS.amber,
          'mono',
          'right',
        )
          .glow(10, COSMOS.gold)
          .opacity(lv * a),
      );
    }

    nodes.push(
      txt(
        ms > 0.25
          ? 'Real serving speed depends on measured drafting, verify, cache repair & scheduling'
          : ask > 0.2 && ss < 0.2
            ? `Same ${y5.toFixed(2)} tokens divided by 1.75 target steps: what speedup?`
            : 'Time measured in ordinary target decode steps',
        0,
        415,
        29,
        ask > 0.2 && ss < 0.2 ? COSMOS.amber : COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Phase 2: Depth 5 vs Depth 10
  const v2 = guardedDynamic(p2, (a) => {
    const dy = showDepth10Yield.value;
    const ds = showDepth10Speed.value;
    const unitPx = 330;
    const barLeft = -470;
    const configs = [
      {
        k: 5,
        y: -60,
        yld: y5,
        draft: 0.5,
        verify: 1.25,
        col: COSMOS.emerald,
        readyY: 1,
        readyS: 1,
      },
      {
        k: 10,
        y: 155,
        yld: y10,
        draft: 1.0,
        verify: 1.5,
        col: COSMOS.rose,
        readyY: dy,
        readyS: ds,
      },
    ];
    const nodes = [
      txt(
        'DEPTH 5 vs DEPTH 10  (same per-guess draft +0.10, verify +0.05)',
        0,
        -210,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
    ];
    for (const cfg of configs) {
      const dW = cfg.draft * unitPx;
      const vW = cfg.verify * unitPx;
      nodes.push(
        txt(`${cfg.k} guesses`, -830, cfg.y, 34, COSMOS.ink, 'mono', 'left').opacity(a),
        rect(dW, 56, { fill: '#5ce1e644', stroke: COSMOS.cyan, width: 2.6, radius: 8 })
          .at(barLeft + dW * 0.5, cfg.y)
          .opacity(a),
        rect(vW, 56, { fill: '#60a5fa44', stroke: COSMOS.blue, width: 2.6, radius: 8 })
          .at(barLeft + dW + vW * 0.5, cfg.y)
          .opacity(a),
        txt(
          `Draft ${cfg.draft.toFixed(2)} + Verify ${cfg.verify.toFixed(2)} = ${(cfg.draft + cfg.verify).toFixed(2)} steps`,
          barLeft,
          cfg.y + 62,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      );
      if (cfg.readyY > 0.05) {
        nodes.push(
          txt(
            `${cfg.yld.toFixed(2)} tok`,
            620,
            cfg.y - 18,
            30,
            COSMOS.ink,
            'mono',
            'right',
          ).opacity(cfg.readyY * a),
        );
      }
      if (cfg.readyS > 0.05) {
        nodes.push(
          txt(
            `${(cfg.yld / (cfg.draft + cfg.verify)).toFixed(2)}x`,
            855,
            cfg.y,
            52,
            cfg.col,
            'mono',
            'right',
          )
            .glow(10, cfg.col)
            .opacity(cfg.readyS * a),
        );
      }
    }
    nodes.push(
      txt(
        'Diminishing geometric returns + linear cost growth make depth 5 beat depth 10 here',
        0,
        415,
        29,
        COSMOS.emerald,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(heroAura(0, 40, 520, '#ffd16618', '#6ee7b716'), cinemaRails(), title, v1, v2);

  onCue(s, c, 'yield-terms', (d) => termsProg.to(1, { duration: d }), { desired: 0.9 });
  onCue(s, c, 'yield-value', (d) => showYieldVal.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'draft-time', (d) => showDraftBar.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'flat-time', (d) => showFlatVerify.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'flat-speed', (d) => showFlatSpeed.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'longer-verify', (d) => showLonger.to(1, { duration: d }), { desired: 0.65 });
  onCue(s, c, 'speed-question', (d) => askSpeed.to(1, { duration: d }), { desired: 0.4 });
  onCue(s, c, 'slow-speed', (d) => showSlowSpeed.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'measure-round', (d) => showMeasure.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'depth-ten', (d) => crossPhase(p1, p2, d), { desired: 0.45 });
  onCue(s, c, 'longer-yield', (d) => showDepth10Yield.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'depth-result', (d) => showDepth10Speed.to(1, { duration: d }), { desired: 0.5 });
}

/**
 * Scene 17: position-yield ("How far does the sampler get?")
 * 100 rounds, 2 guesses each: compares (90% -> 10%), (50% -> 50%), (10% -> 90%).
 * Withholds "9 rounds keep both" until spoken cue `yield-both`!
 */
export function positionYield(s, c) {
  const y5 = expectedYield(0.8, 5);

  const firstPass = s.value(0);
  const askSecond = s.value(0);
  const revealBoth = s.value(0);
  const showReverse = s.value(0);
  const showTotals = s.value(0);
  const showMiddle = s.value(0);
  const showRateRule = s.value(0);
  const showGeo = s.value(0);

  const title = heroTitle(['Conditional survival', 'by reached position'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: '100 ROUNDS, 2 GUESSES EACH',
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const fp = firstPass.value;
      const rb = revealBoth.value;
      const rev = showReverse.value;
      const tot = showTotals.value;
      const mid = showMiddle.value;
      const rr = showRateRule.value;
      const geo = showGeo.value;

      const policies = [
        { rates: '90% -> 10%', n1: 90, n2: 9, vis: 1, col: COSMOS.emerald },
        { rates: '50% -> 50%', n1: 50, n2: 25, vis: mid, col: COSMOS.cyan },
        { rates: '10% -> 90%', n1: 10, n2: 9, vis: rev, col: COSMOS.amber },
      ];

      const nodes = [
        txt('RATES', -830, -230, 26, COSMOS.muted, 'mono', 'left'),
        txt('POS 1 KEPT (OF 100)', -460, -230, 26, COSMOS.cyan, 'mono', 'left'),
        txt('POS 2 KEPT (OF REACHED)', 70, -230, 26, COSMOS.gold, 'mono', 'left'),
        txt('EMITTED / ROUND', 855, -230, 26, COSMOS.emerald, 'mono', 'right'),
      ];

      const rowYs = [-115, 65, 245];
      policies.forEach((p, idx) => {
        if (p.vis < 0.04) return;
        const y = rowYs[idx];
        const bar1W = 380;
        const bar2Max = 380;
        const n1Shown = idx === 0 ? p.n1 * fp : p.n1;
        const showN2 = idx === 0 ? rb > 0.25 : true;
        const avg = (100 + p.n1 + p.n2) / 100;

        nodes.push(
          txt(p.rates, -830, y, 34, COSMOS.ink, 'mono', 'left').opacity(p.vis),
          probBarH(-460, y, bar1W, 38, n1Shown, 100, { color: COSMOS.cyan, opacity: p.vis }),
          txt(
            `${Math.round(n1Shown)} / 100`,
            -460,
            y - 46,
            26,
            COSMOS.cyan,
            'mono',
            'left',
          ).opacity(p.vis),
        );

        // Second bar denominator is proportional to n1 (only survivors reach pos 2!)
        const denomW = Math.max(48, (p.n1 / 100) * bar2Max);
        const fill2W = showN2 ? (p.n2 / p.n1) * denomW : 0;
        nodes.push(
          rect(denomW, 38, { fill: '#111626', stroke: '#3a4b78', width: 1.8, radius: 7 })
            .at(70 + denomW * 0.5, y)
            .opacity(p.vis),
        );
        if (fill2W > 2) {
          nodes.push(
            rect(fill2W, 32, { fill: COSMOS.gold, stroke: null, radius: 5 })
              .at(70 + fill2W * 0.5, y)
              .glow(8, COSMOS.gold)
              .opacity(p.vis),
          );
        }
        nodes.push(
          txt(
            showN2 ? `${p.n2} of ${p.n1}` : `? of ${p.n1}`,
            70,
            y - 46,
            26,
            showN2 ? COSMOS.gold : COSMOS.amber,
            'mono',
            'left',
          ).opacity(p.vis),
        );

        if (tot > 0.05) {
          nodes.push(
            txt(avg.toFixed(2), 855, y, 48, p.col, 'mono', 'right')
              .glow(8, p.col)
              .opacity(tot * p.vis),
          );
        }
      });

      let foot = '100 rounds, 2 guesses each: only pos-1 survivors reach pos-2';
      let fCol = COSMOS.muted;
      if (geo > 0.25) {
        foot = `Constant 80% at depth 5: 1 + 0.8 + 0.64 + ... + 0.8^5 = ${y5.toFixed(2)} emitted tokens/round`;
        fCol = COSMOS.emerald;
      } else if (rr > 0.25) {
        foot = 'Measure acceptance at position k as: accepted_k / reached_k';
        fCol = COSMOS.cyan;
      } else if (askSecond.value > 0.25 && rb < 0.2) {
        foot = '90 rounds reach pos 2, and 10% pass: how many rounds keep both words?';
        fCol = COSMOS.amber;
      }
      nodes.push(txt(foot, 0, 415, 29, fCol, 'sans'));

      return group(...nodes);
    },
  );

  s.add(heroAura(0, 40, 520, '#5ce1e61a', '#ffd16614'), cinemaRails(), title, view);

  onCue(s, c, 'yield-first', (d) => firstPass.to(1, { duration: d }), { desired: 0.7 });
  onCue(s, c, 'yield-reached', (d) => askSecond.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'yield-both', (d) => revealBoth.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'yield-reverse', (d) => showReverse.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'yield-totals', (d) => showTotals.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'yield-middle', (d) => showMiddle.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'yield-rate', (d) => showRateRule.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'yield-geometric', (d) => showGeo.to(1, { duration: d }), { desired: 0.5 });
}

/**
 * Scene 18: load-cost ("What changes at batch 64?")
 * Phase 1: Batch-64 intensity (64 FLOPs/byte) vs dense ridge (295.4 FLOPs/byte).
 * Phase 2: Compute-bound toy model (K=2, alpha=0.8 -> 2.44 / 3.20 = 0.763x -> ordinary decode wins).
 * Phase 3: Measured EAGLE-3 batch-64 H100 result (1.38x vs Original EAGLE 0.99x).
 */
export function loadCost(s, c) {
  const ridge = weightWorksheet(1).ridge;
  const y2 = expectedYield(0.8, 2); // 2.44

  const p1 = s.value(1);
  const p2 = s.value(0);
  const p3 = s.value(0);

  const show64 = s.value(0);
  const showComputeWin = s.value(0);
  const showEagle3 = s.value(0);
  const showOrigEagle = s.value(0);

  const title = heroTitle(['Batch 64 & the', 'compute-bound limit'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.amber,
    eyebrow: 'SERVING LOAD SCALING',
  });

  // Phase 1: Intensity ruler 1 -> 64 -> 295.4
  const v1 = guardedDynamic(p1, (a) => {
    const x0 = -740;
    const w = 1480;
    const y = 30;
    const toX = (val) => x0 + (val / 320) * w;
    const x1 = toX(1);
    const x64 = toX(64);
    const xR = toX(ridge);

    const nodes = [
      txt('ARITHMETIC INTENSITY (WEIGHT-ONLY ROOF)', 0, -195, 28, COSMOS.cyan, 'mono').opacity(a),
      line([x0, y], [x0 + w, y], { stroke: '#3a4b78', width: 4.0 }).opacity(a),
      // Bandwidth-bound zone [0..ridge]
      line([x0, y], [xR, y], { stroke: COSMOS.cyan, width: 6.0 }).glow(10, COSMOS.cyan).opacity(a),
      // Compute-bound zone [ridge..320]
      line([xR, y], [x0 + w, y], { stroke: COSMOS.gold, width: 6.0 })
        .glow(10, COSMOS.gold)
        .opacity(a),

      // Markers at 1, 64, and 295.4
      glowDot(x1, y, { radius: 8, color: COSMOS.blue, glow: 10, opacity: a }),
      txt('1 FLOP/B', x1 + 35, y - 62, 26, COSMOS.blue, 'mono').opacity(a),

      glowDot(x64, y, {
        radius: 11,
        color: COSMOS.emerald,
        glow: 16,
        opacity: Math.max(0.25, show64.value) * a,
      }),
      txt('Batch 64: 64 FLOPs/B', x64, y + 72, 30, COSMOS.emerald, 'mono')
        .glow(6, COSMOS.emerald)
        .opacity(Math.max(0.25, show64.value) * a),

      line([xR, y - 55], [xR, y + 55], { stroke: COSMOS.gold, width: 4.5 })
        .glow(12, COSMOS.gold)
        .opacity(a),
      txt(`Ridge ~${ridge.toFixed(1)} FLOPs/B`, xR - 45, y - 82, 28, COSMOS.gold, 'mono').opacity(
        a,
      ),

      txt(
        '64 streams sharing one weight read still sit on the bandwidth slope below the dense ridge',
        0,
        415,
        29,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  // Phase 2: Compute-bound regime (3 positions = 3.0 steps + 0.2 draft = 3.2 steps for 2.44 tokens)
  const v2 = guardedDynamic(p2, (a) => {
    const cw = showComputeWin.value;
    const nodes = [
      txt(
        'WHEN COMPUTE SETS THE PACE (1 STEP PER POSITION)',
        0,
        -210,
        28,
        COSMOS.rose,
        'mono',
      ).opacity(a),
      txt(
        'K = 2 guesses  ->  3 verified positions + 0.20 draft = 3.20 steps',
        0,
        -142,
        30,
        COSMOS.ink,
        'mono',
      ).opacity(a),
    ];
    for (let i = 0; i < 3; i++) {
      nodes.push(
        tokenPill(`Pos ${i + 1} (1.0 step)`, -460 + i * 360, 10, {
          w: 300,
          h: 88,
          color: COSMOS.blue,
          wordSize: 28,
          opacity: a,
        }),
      );
    }
    nodes.push(
      tokenPill('Draft 0.2', 640, 10, {
        w: 220,
        h: 88,
        color: COSMOS.cyan,
        wordSize: 28,
        opacity: a,
      }),
    );
    if (cw > 0.05) {
      nodes.push(
        txt(
          `Expected output: ${y2.toFixed(2)} tok / 3.20 steps = ${(y2 / 3.2).toFixed(2)}x  (< 1.00x)`,
          0,
          175,
          38,
          COSMOS.rose,
          'mono',
        )
          .glow(10, COSMOS.rose)
          .opacity(cw * a),
        txt(
          'ORDINARY DECODING WINS UNDER FULL COMPUTE SATURATION',
          0,
          250,
          28,
          COSMOS.amber,
          'mono',
        ).opacity(cw * a),
      );
    }
    return group(...nodes);
  });

  // Phase 3: Measured H100 batch-64 EAGLE-3 vs Original EAGLE
  const v3 = guardedDynamic(p3, (a) => {
    const e3 = showEagle3.value;
    const oe = showOrigEagle.value;
    const baseY = 235;
    const scaleH = 265; // 1.38 -> 366 px
    const y1x = baseY - 1.0 * scaleH;

    const nodes = [
      txt(
        'MEASURED: 1x H100 | BATCH 64 | LLAMA 3.1 8B | MT-BENCH | SGLANG 0.4.4',
        0,
        -235,
        26,
        COSMOS.muted,
        'mono',
      ).opacity(a),
      line([-640, baseY], [640, baseY], { stroke: '#3a4b78', width: 2.6 }).opacity(a),
      // 1.00x baseline dashed line
      line([-640, y1x], [640, y1x], { stroke: COSMOS.gold, width: 2.4, dash: [8, 6] }).opacity(a),
      txt('1.00x baseline', 640, y1x - 24, 26, COSMOS.gold, 'mono', 'right').opacity(a),
    ];

    // Original EAGLE bar (0.99x): fixed label height cleanly above 1.00x baseline
    const h0 = 0.99 * scaleH * Math.max(0.05, oe);
    nodes.push(
      rect(240, h0, { fill: '#60a5fa44', stroke: COSMOS.blue, width: 3.0, radius: 10 })
        .at(-290, baseY - h0 * 0.5)
        .opacity(oe * a),
      txt('Original EAGLE', -290, baseY + 46, 30, COSMOS.blue, 'mono').opacity(a),
      txt('0.99x', -290, y1x - 42, 42, COSMOS.blue, 'mono').opacity(oe > 0.35 ? oe * a : 0),
    );

    // EAGLE-3 chain bar (1.38x): fixed label height cleanly above final top
    const h1 = 1.38 * scaleH * Math.max(0.05, e3);
    nodes.push(
      rect(240, h1, { fill: '#6ee7b748', stroke: COSMOS.emerald, width: 3.4, radius: 10 })
        .at(290, baseY - h1 * 0.5)
        .glow(12, COSMOS.emerald)
        .opacity(e3 * a),
      txt('EAGLE-3 (3-tok chain)', 290, baseY + 46, 30, COSMOS.emerald, 'mono').opacity(a),
      txt('1.38x', 290, baseY - 1.38 * scaleH - 42, 46, COSMOS.emerald, 'mono')
        .glow(10, COSMOS.emerald)
        .opacity(e3 > 0.35 ? e3 * a : 0),
    );

    nodes.push(
      txt(
        'Real throughput depends on draft overhead, batching, and architecture: always measure at load',
        0,
        415,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(heroAura(0, 20, 520, '#fb923c18', '#6ee7b716'), cinemaRails(), title, v1, v2, v3);

  onCue(s, c, 'sd-load-cost-b0', (d) => show64.to(1, { duration: d }), { desired: 0.6 });
  onCue(s, c, 'sd-load-cost-b1', (d) => crossPhase(p1, p2, d), { desired: 0.45 });
  onCue(s, c, 'sd-compute-bound', (d) => showComputeWin.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sd-load-cost-b2', (d) => crossPhase(p2, p3, d), { desired: 0.45 });
  onCue(s, c, 'sd-historical-throughput', (d) => showEagle3.to(1, { duration: d }), {
    desired: 0.6,
  });
  onCue(s, c, 'sd-original-throughput', (d) => showOrigEagle.to(1, { duration: d }), {
    desired: 0.55,
  });
}

/**
 * Scene 19: verification-budget ("Can sixteen streams fit in this step?")
 * 16 streams x (1 pending + 4 draft) = 80 > 64 limit (DENIED) vs
 * 16 streams x (1 pending + 2 draft) = 48 <= 64 limit (FITS, ~39.0 expected output tokens).
 */
export function verificationBudgetScene(s, c) {
  const b4 = verificationBudget(16, 4, 64, 0.8); // 80 inputs, fits: false
  const b2 = verificationBudget(16, 2, 64, 0.8); // 48 inputs, expectedOutput: 39.04, fits: true

  const showPending = s.value(0);
  const show80 = s.value(0);
  const showDeny = s.value(0);
  const showDepth2 = s.value(0);
  const show48 = s.value(0);

  const title = heroTitle(['Verification budget', 'admission vs output'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.rose,
    eyebrow: 'SCHEDULER STEP LIMIT: 64 POSITIONS',
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const s80 = show80.value;
      const den = showDeny.value;
      const d2 = showDepth2.value;
      const s48 = show48.value;

      const nodes = [];
      const barLeft = -520;
      const scaleW = 13.5; // 80 -> 1080 px, 64 -> 864 px, 48 -> 648 px
      const limitX = barLeft + 64 * scaleW;

      // Vertical glowing 64-position admission wall
      nodes.push(
        line([limitX, -220], [limitX, 265], {
          stroke: COSMOS.gold,
          width: 4.5,
          dash: [10, 8],
        }).glow(12, COSMOS.gold),
        txt('STEP LIMIT = 64', limitX, -252, 28, COSMOS.gold, 'mono'),
      );

      // Row 1: Depth 4 -> 16 * (1 + 4) = 80 positions (exceeds 64)
      const y1 = -85;
      const w80 = b4.inputs * scaleW * Math.max(0.2, s80);
      nodes.push(
        txt('Depth 4', -835, y1 - 14, 34, COSMOS.ink, 'mono', 'left'),
        txt('16 * (1 + 4)', -835, y1 + 26, 26, COSMOS.muted, 'mono', 'left'),
        rect(w80, 66, {
          fill: den > 0.3 ? '#ff6b8b48' : '#5ce1e640',
          stroke: den > 0.3 ? COSMOS.rose : COSMOS.cyan,
          width: 3.0,
          radius: 10,
        })
          .at(barLeft + w80 * 0.5, y1)
          .glow(10, den > 0.3 ? COSMOS.rose : COSMOS.cyan),
        txt(
          den > 0.3 ? `${b4.inputs} pos: WON'T FIT` : `${b4.inputs} input positions`,
          barLeft + w80 * 0.5,
          y1,
          28,
          COSMOS.ink,
          'mono',
        ).opacity(s80 > 0.55 ? s80 : 0),
      );

      // Row 2: Depth 2 -> 16 * (1 + 2) = 48 positions (fits! ~39 expected output)
      if (d2 > 0.04) {
        const y2 = 120;
        const w48 = b2.inputs * scaleW * Math.max(0.2, s48);
        nodes.push(
          txt('Depth 2', -835, y2 - 14, 34, COSMOS.emerald, 'mono', 'left').opacity(d2),
          txt('16 * (1 + 2)', -835, y2 + 26, 26, COSMOS.muted, 'mono', 'left').opacity(d2),
          rect(w48, 66, {
            fill: '#6ee7b744',
            stroke: COSMOS.emerald,
            width: 3.0,
            radius: 10,
          })
            .at(barLeft + w48 * 0.5, y2)
            .glow(10, COSMOS.emerald)
            .opacity(d2),
          txt(`${b2.inputs} pos: FITS`, barLeft + w48 * 0.5, y2, 28, COSMOS.ink, 'mono').opacity(
            s48 > 0.55 ? s48 : 0,
          ),
          txt(
            `Expected output: ~${b2.expectedOutput.toFixed(0)} tok`,
            limitX + 28,
            y2,
            28,
            COSMOS.cyan,
            'mono',
            'left',
          ).opacity(s48),
        );
      }

      nodes.push(
        txt(
          showPending.value > 0.1
            ? 'Admission reserves worst-case input positions (pending + draft); rejections never refund evaluated slots'
            : 'Each stream brings 1 pending token plus K draft tokens',
          0,
          415,
          27,
          COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(heroAura(0, 20, 520, '#ff6b8b18', '#6ee7b716'), cinemaRails(), title, view);

  onCue(s, c, 'sd-verification-budget-b0', (d) => showPending.to(1, { duration: d }), {
    desired: 0.45,
  });
  onCue(s, c, 'sd-budget-eighty', (d) => show80.to(1, { duration: d }), { desired: 0.65 });
  onCue(s, c, 'sd-budget-deny', (d) => showDeny.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-verification-budget-b1', (d) => showDepth2.to(1, { duration: d }), {
    desired: 0.55,
  });
  onCue(s, c, 'sd-budget-depths', (d) => show48.to(1, { duration: d }), { desired: 0.6 });
}
