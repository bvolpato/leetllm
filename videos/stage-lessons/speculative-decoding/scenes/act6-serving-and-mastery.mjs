// Act 6: Paired Service Metrics, Diagnostics, Transfer & Fresh-State Finale
// (paired-service, diagnose, transfer, fresh-state)
import { group, line, linear, rect } from 'vizmatic/stage';
import {
  CHAIN,
  COSMOS,
  cinemaRails,
  crossPhase,
  decomposition,
  freshStateFrame,
  glowDot,
  glowingArc,
  guardedDynamic,
  heroAura,
  heroTitle,
  onCue,
  probBarH,
  tokenPill,
  transferSnapshot,
  txt,
} from '../shared.mjs';

/**
 * Scene 26: paired-service ("Which offered load can we serve?")
 * Phase 1: Matched A/B request identity (same prompts, weights, quantization, hardware, arrivals).
 * Phase 2: Client stream timeline: tokens at 300, 301, 302, 500 ms -> gaps 1, 1, 198 ms (mean 66.7 ms).
 * Phase 3: Two 20s trials at 95% SLO (Trial A 174/180 = 96.7% PASS vs Trial B 204/220 = 92.7% FAIL).
 *   Prediction withheld during beat 2 until spoken cue `sd-service-verdict`!
 */
export function pairedService(s, c) {
  const p1 = s.value(1);
  const p2 = s.value(0);
  const p3 = s.value(0);

  const showPaired = s.value(0);
  const showGaps = s.value(0);
  const showAvg = s.value(0);
  const showTrials = s.value(0);
  const showVerdict = s.value(0);
  const showCap = s.value(0);

  const title = heroTitle(['Paired load testing', 'and tail-gap latency'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'PRODUCTION EVALUATION',
  });

  // Phase 1: Paired A/B protocol
  const v1 = guardedDynamic(p1, (a) => {
    const fields = ['Target + Quant', 'Prompts + Sampling', 'Hardware', 'Offered Arrivals'];
    const nodes = [];
    fields.forEach((f, i) => {
      nodes.push(
        tokenPill(f, -630 + i * 420, -155, {
          w: 360,
          h: 82,
          color: COSMOS.blue,
          wordSize: 27,
          opacity: a * Math.max(0.3, showPaired.value),
        }),
      );
    });
    nodes.push(
      tokenPill('Matched Request IDs & Load', 0, 25, {
        w: 620,
        h: 86,
        color: COSMOS.gold,
        wordColor: COSMOS.gold,
        wordSize: 30,
        opacity: a,
      }),
      line([0, 72], [-380, 178], { stroke: COSMOS.cyan, width: 3.4 }).opacity(a),
      line([0, 72], [380, 178], { stroke: COSMOS.emerald, width: 3.4 }).opacity(a),
      tokenPill('Baseline Target', -380, 225, {
        w: 460,
        h: 86,
        color: COSMOS.blue,
        wordSize: 30,
        opacity: a,
      }),
      tokenPill('Speculative Decoding', 380, 225, {
        w: 460,
        h: 86,
        color: COSMOS.emerald,
        wordSize: 30,
        opacity: a,
      }),
      txt(
        'Pair identical prompts, weights, and arrivals: watch TTFT as well as decode rate',
        0,
        415,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Phase 2: Client stream timeline 300, 301, 302, 500 ms
  const v2 = guardedDynamic(p2, (a) => {
    const xL = -680;
    const xR = 680;
    const y = -45;
    const times = [300, 301, 302, 500];
    const xs = times.map((ms) => xL + ((ms - 300) / 200) * (xR - xL));
    const labelXs = [-680, -470, -260, 680];

    const nodes = [
      txt('CLIENT TOKEN ARRIVALS (ms AFTER SUBMISSION)', 0, -210, 28, COSMOS.cyan, 'mono').opacity(
        a,
      ),
      line([xL, y], [xR, y], { stroke: '#3a4b78', width: 4.0 }).opacity(a),
      // Highlight the 198 ms stall gap!
      line([xs[2], y], [xs[3], y], { stroke: COSMOS.rose, width: 7.0 })
        .glow(14, COSMOS.rose)
        .opacity(Math.max(0.25, showGaps.value) * a),
    ];

    xs.forEach((x, i) => {
      nodes.push(
        glowDot(x, y, {
          radius: 9,
          color: i === 3 ? COSMOS.rose : COSMOS.cyan,
          glow: 14,
          opacity: a,
        }),
        line([x, y - 18], [labelXs[i], y - 78], { stroke: COSMOS.muted, width: 1.8 }).opacity(a),
        txt(
          `${times[i]} ms`,
          labelXs[i],
          y - 108,
          28,
          i === 3 ? COSMOS.rose : COSMOS.cyan,
          'mono',
        ).opacity(a),
      );
    });

    if (showGaps.value > 0.05) {
      nodes.push(
        txt('Gaps:  1 ms,  1 ms,  198 ms', 0, 108, 42, COSMOS.gold, 'mono')
          .glow(8, COSMOS.gold)
          .opacity(showGaps.value * a),
      );
    }
    if (showAvg.value > 0.05) {
      nodes.push(
        txt(
          'Mean gap: 66.7 ms   |   Max user stall: 198 ms',
          0,
          210,
          34,
          COSMOS.rose,
          'mono',
        ).opacity(showAvg.value * a),
      );
    }
    nodes.push(
      txt(
        'Average inter-token time hides bursty stalls; bundled arrivals mask individual gaps',
        0,
        415,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Phase 3: Trial A (174/180 = 96.67%) vs Trial B (204/220 = 92.73%) at 95% SLO
  const v3 = guardedDynamic(p3, (a) => {
    const verd = showVerdict.value;
    const cap = showCap.value;
    const trials = [
      { name: 'Trial A', qual: 174, offer: 180, cx: -430, pass: true },
      { name: 'Trial B', qual: 204, offer: 220, cx: 430, pass: false },
    ];
    const nodes = [
      txt(
        '20-SECOND TRIALS   |   REQUIRED ATTAINMENT: >= 95%',
        0,
        -225,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    ];
    for (const tr of trials) {
      const pct = (100 * tr.qual) / tr.offer;
      const barW = 640;
      const x0 = tr.cx - barW * 0.5;
      const col = verd > 0.25 ? (tr.pass ? COSMOS.emerald : COSMOS.rose) : COSMOS.cyan;
      const sloX = x0 + 0.95 * barW;

      nodes.push(
        txt(tr.name, tr.cx, -125, 42, col, 'serif').opacity(a),
        probBarH(x0, -40, barW, 56, pct, 100, {
          color: col,
          opacity: a * Math.max(0.3, showTrials.value),
        }),
        line([sloX, -82], [sloX, 2], { stroke: COSMOS.gold, width: 3.5 })
          .glow(8, COSMOS.gold)
          .opacity(a),
        txt('95%', sloX, -104, 26, COSMOS.gold, 'mono').opacity(a),
        txt(`${tr.qual} / ${tr.offer} = ${pct.toFixed(1)}%`, tr.cx, 58, 36, col, 'mono').opacity(a),
      );
      if (cap > 0.05) {
        nodes.push(
          txt(
            `${(tr.offer / 20).toFixed(0)} offered/s  |  ${(tr.qual / 20).toFixed(1)} qualified/s`,
            tr.cx,
            135,
            28,
            COSMOS.ink,
            'mono',
          ).opacity(cap * a),
        );
      }
      if (verd > 0.05) {
        nodes.push(
          tokenPill(tr.pass ? 'PASS (96.7% >= 95%)' : 'FAIL (92.7% < 95%)', tr.cx, 245, {
            w: 440,
            h: 78,
            color: tr.pass ? COSMOS.emerald : COSMOS.rose,
            wordColor: tr.pass ? COSMOS.emerald : COSMOS.rose,
            wordSize: 30,
            opacity: verd * a,
          }),
        );
      }
    }
    nodes.push(
      txt(
        verd > 0.25
          ? 'Trial A passes (8.7 qualified/s at 9 offered/s): keep failures & cancellations in denominator'
          : 'Trial B completed more requests/sec, yet which trial met the 95% requirement?',
        0,
        415,
        28,
        verd > 0.25 ? COSMOS.emerald : COSMOS.amber,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(heroAura(0, 20, 520, '#5ce1e61a', '#ffd16614'), cinemaRails(), title, v1, v2, v3);

  onCue(s, c, 'sd-paired-service-b0', (d) => showPaired.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sd-paired-service-b1', (d) => crossPhase(p1, p2, d), { desired: 0.45 });
  onCue(s, c, 'sd-service-gaps', (d) => showGaps.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sd-service-average', (d) => showAvg.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-paired-service-b2', (d) => crossPhase(p2, p3, d), { desired: 0.45 });
  onCue(s, c, 'sd-paired-service-b2', (d) => showTrials.to(1, { duration: d }), { desired: 0.6 });
  onCue(s, c, 'sd-service-verdict', (d) => showVerdict.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-service-capacity', (d) => showCap.to(1, { duration: d }), { desired: 0.55 });
}

/**
 * Scene 27: diagnose ("Isolate the sampler before blaming model kernels")
 * Two-stage diagnostic pipeline: Stage 1 fixed-table sampler tests -> Stage 2 serial vs verify logit diff.
 */
export function diagnose(s, c) {
  const stage1 = s.value(0);
  const stage2 = s.value(0);

  const title = heroTitle(['Debugging drift:', 'isolate sampler first'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.amber,
    eyebrow: 'TWO-STAGE DIAGNOSTIC PROTOCOL',
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const s1 = stage1.value;
      const s2 = stage2.value;
      const nodes = [];

      // Stage 1 (left column): Fixed-table sampler tests
      const lx = -450;
      nodes.push(
        txt('STAGE 1: ISOLATE SAMPLER', lx, -215, 30, COSMOS.cyan, 'mono'),
        tokenPill('Fixed Probability Tables', lx, -110, {
          w: 660,
          h: 82,
          color: COSMOS.cyan,
          wordSize: 30,
          opacity: Math.max(0.3, s1),
        }),
        tokenPill('p = q  |  disjoint  |  forced reject', lx, 15, {
          w: 660,
          h: 78,
          color: COSMOS.blue,
          wordSize: 27,
          opacity: Math.max(0.3, s1),
        }),
        tokenPill('2-token joints & EOS stopping', lx, 130, {
          w: 660,
          h: 78,
          color: COSMOS.emerald,
          wordSize: 27,
          opacity: Math.max(0.3, s1),
        }),
      );

      // Bridge arrow
      nodes.push(
        line([-100, -5], [100, -5], { stroke: COSMOS.gold, width: 4.5 })
          .glow(10, COSMOS.gold)
          .opacity(Math.max(0.2, s2)),
        txt('PASS ->', 0, -45, 26, COSMOS.gold, 'mono').opacity(Math.max(0.2, s2)),
      );

      // Stage 2 (right column): Serial vs Verification Logits
      const rx = 450;
      nodes.push(
        txt('STAGE 2: COMPARE LOGITS', rx, -215, 30, COSMOS.amber, 'mono').opacity(
          Math.max(0.25, s2),
        ),
        tokenPill('Serial vs Verify on Same Inputs', rx, -110, {
          w: 660,
          h: 82,
          color: COSMOS.amber,
          wordSize: 30,
          opacity: Math.max(0.25, s2),
        }),
        tokenPill('Trace 1st diff: prefix, mask, pos, KV', rx, 15, {
          w: 660,
          h: 78,
          color: COSMOS.rose,
          wordSize: 27,
          opacity: Math.max(0.25, s2),
        }),
        tokenPill('Quantization & batch reduction order', rx, 130, {
          w: 660,
          h: 78,
          color: COSMOS.violet,
          wordSize: 27,
          opacity: Math.max(0.25, s2),
        }),
      );

      nodes.push(
        txt(
          'Greedy or few-seed checks miss rare stochastic drift: test exact tables before model kernels',
          0,
          415,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes);
    },
  );

  s.add(heroAura(0, 20, 520, '#5ce1e61a', '#fb923c16'), cinemaRails(), title, view);

  onCue(s, c, 'sd-diagnose-b0', (d) => stage1.to(1, { duration: d }), { desired: 0.65 });
  onCue(s, c, 'sd-diagnose-b1', (d) => stage2.to(1, { duration: d }), { desired: 0.65 });
}

/**
 * Scene 28: transfer ("The space after 'sang'")
 * Complete worked transfer exercise on CHAIN[1] (softly/nearby/today):
 *   Beat 0: Shows prefix "The bird sang", softly p=0.30, q=0.60, u=0.80 -> prediction withheld!
 *   Beat 1: Reveals ratio 0.50 -> reject softly & drop today -> deficit [0, 0.30, 0] -> residual -> nearby!
 *   Beat 2: Trims provisional KV [sang, softly, today] -> retains [sang] -> forwards nearby -> caches [sang, nearby]!
 */
export function transfer(s, c) {
  const row = CHAIN[1]; // words:['softly','nearby','today'], p:[0.3,0.5,0.2], q:[0.6,0.2,0.2], u=0.8
  const dec = decomposition(row.p, row.q);
  const tx = transferSnapshot(1, 0.9);

  const p1 = s.value(1);
  const p2 = s.value(0);

  const showPrefix = s.value(0);
  const showDist = s.value(0);
  const showDraw = s.value(0);
  const showAsk = s.value(0);
  const showRatioFormula = s.value(0);
  const showRatioAnswer = s.value(0);
  const showDiscard = s.value(0);
  const showDeficit = s.value(0);
  const showResidual = s.value(0);
  const showCorrection = s.value(0);

  const trimKV = s.value(0);
  const keepSang = s.value(0);
  const fwdNearby = s.value(0);
  const cacheNearby = s.value(0);

  const title = heroTitle(['Worked transfer:', 'the space after "sang"'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.emerald,
    eyebrow: 'END-TO-END MECHANISM CHECK',
  });

  // Beats 0 & 1: Probability test + residual sampling
  const v1 = guardedDynamic(p1, (a) => {
    const nodes = [];

    // Prefix & draft proposal strip
    nodes.push(
      txt(
        'ACCEPTED PREFIX: "The bird sang"',
        -855,
        -216,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(Math.max(0.3, showPrefix.value) * a),
      tokenPill('softly', 240, -216, {
        w: 220,
        h: 72,
        color: showDiscard.value > 0.3 ? COSMOS.rose : COSMOS.cyan,
        wordSize: 28,
        opacity: a,
      }),
      tokenPill('today', 530, -216, {
        w: 220,
        h: 72,
        color: showDiscard.value > 0.3 ? COSMOS.rose : COSMOS.cyan,
        wordSize: 28,
        dash: showDiscard.value > 0.3 ? [7, 6] : null,
        opacity: a * (showDiscard.value > 0.3 ? 0.42 : 1),
      }),
    );

    // Three candidate word rows: softly, nearby, today
    const ys = [-95, 55, 205];
    const barLeft = -550;
    const barW = 460;
    for (let i = 0; i < 3; i++) {
      const y = ys[i];
      const isSoftly = i === 0;
      const isNearby = i === 1;
      nodes.push(
        txt(
          row.words[i],
          -835,
          y,
          36,
          isNearby && showCorrection.value > 0.3 ? COSMOS.emerald : COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
        probBarH(barLeft, y - 16, barW, 20, row.p[i] * Math.max(0.25, showDist.value), 0.7, {
          color: COSMOS.gold,
          glow: 5,
          opacity: a,
        }),
        txt(
          `p=${row.p[i].toFixed(2)}`,
          barLeft + barW + 18,
          y - 16,
          26,
          COSMOS.gold,
          'mono',
          'left',
        ).opacity(a),
        probBarH(barLeft, y + 16, barW, 20, row.q[i] * Math.max(0.25, showDist.value), 0.7, {
          color: COSMOS.cyan,
          glow: 5,
          opacity: a,
        }),
        txt(
          `q=${row.q[i].toFixed(2)}`,
          barLeft + barW + 18,
          y + 16,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(a),
      );

      // Deficit & Residual readout on right
      if (showDeficit.value > 0.05) {
        nodes.push(
          txt(
            `def +${dec.deficit[i].toFixed(2)}`,
            210,
            y,
            28,
            dec.deficit[i] > 0 ? COSMOS.violet : COSMOS.dim,
            'mono',
            'left',
          ).opacity(showDeficit.value * a),
        );
      }
      if (showResidual.value > 0.05) {
        nodes.push(
          txt(
            `r = ${dec.residual[i].toFixed(2)}`,
            510,
            y,
            30,
            dec.residual[i] > 0 ? COSMOS.emerald : COSMOS.dim,
            'mono',
            'left',
          )
            .glow(dec.residual[i] > 0 ? 10 : 0, COSMOS.emerald)
            .opacity(showResidual.value * a),
        );
      }
      if (isSoftly && showRatioAnswer.value > 0.25 && showDeficit.value < 0.1) {
        nodes.push(
          txt(
            `alpha = ${tx.acceptance.toFixed(2)} < 0.80 -> REJECT`,
            210,
            y,
            28,
            COSMOS.rose,
            'mono',
            'left',
          ).opacity(showRatioAnswer.value * a),
        );
      }
    }

    // Acceptance draw readout & prediction prompt
    const drawStr =
      showCorrection.value > 0.25
        ? `Correction sampled: "${tx.correction}"   |   Committed: The bird sang ${tx.correction}`
        : showRatioAnswer.value > 0.25
          ? `alpha(softly) = min(1, 0.30/0.60) = 0.50 < u (0.80) -> reject softly, discard today`
          : showRatioFormula.value > 0.25
            ? `alpha(softly) = min(1, 0.30 / 0.60) = ...`
            : showAsk.value > 0.25
              ? `Draw u = ${row.uniform.toFixed(2)}: Is softly committed? Which word holds positive (p - q)+?`
              : `Acceptance draw u = ${row.uniform.toFixed(2)}`;
    const drawCol =
      showCorrection.value > 0.25
        ? COSMOS.emerald
        : showRatioAnswer.value > 0.25
          ? COSMOS.rose
          : COSMOS.amber;
    nodes.push(
      txt(drawStr, 0, 415, 28, drawCol, 'mono').opacity(Math.max(0.25, showDraw.value) * a),
    );
    return group(...nodes);
  });

  // Beat 2: KV trim & forward pass for nearby
  const v2 = guardedDynamic(p2, (a) => {
    const tr = trimKV.value;
    const kp = keepSang.value;
    const fw = fwdNearby.value;
    const ca = cacheNearby.value;
    const nodes = [
      txt('TARGET KV CACHE CLEANUP & CORRECTION FORWARD', 0, -220, 28, COSMOS.cyan, 'mono').opacity(
        a,
      ),
    ];

    const prov = [
      { w: 'sang', x: -440, keep: true },
      { w: 'softly', x: 0, keep: false },
      { w: 'today', x: 440, keep: false },
    ];
    prov.forEach((p) => {
      const drop = !p.keep && tr > 0.3;
      const col = p.keep && kp > 0.3 ? COSMOS.emerald : drop ? COSMOS.rose : COSMOS.blue;
      nodes.push(
        tokenPill(drop ? `removed: ${p.w}` : `KV: ${p.w}`, p.x, -75, {
          w: 320,
          h: 88,
          color: col,
          wordSize: 28,
          dash: drop ? [8, 6] : null,
          opacity: a * (drop ? 0.4 : 1),
        }),
      );
    });

    // Final clean cache row: [sang] + forward(nearby) -> [sang, nearby]
    if (fw > 0.05) {
      nodes.push(
        tokenPill('Retained KV: sang', -340, 165, {
          w: 420,
          h: 92,
          color: COSMOS.emerald,
          wordSize: 30,
          opacity: a,
        }),
        line([-120, 165], [120, 165], { stroke: COSMOS.gold, width: 4.0 })
          .glow(10, COSMOS.gold)
          .opacity(fw * a),
        tokenPill(ca > 0.35 ? 'Cached KV: nearby' : 'Forward: nearby', 380, 165, {
          w: 440,
          h: 92,
          color: ca > 0.35 ? COSMOS.emerald : COSMOS.amber,
          wordColor: ca > 0.35 ? COSMOS.emerald : COSMOS.gold,
          wordSize: 30,
          glow: 14,
          opacity: fw * a,
        }),
      );
    }

    nodes.push(
      txt(
        ca > 0.35
          ? 'Clean KV cache now holds [sang, nearby]: ready for the next decode step'
          : 'Remove provisional KV for softly and today before forwarding nearby',
        0,
        415,
        29,
        COSMOS.emerald,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(heroAura(0, 20, 520, '#6ee7b71a', '#a78bfa16'), cinemaRails(), title, v1, v2);

  onCue(s, c, 'same-prefix', (d) => showPrefix.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'candidate-distribution', (d) => showDist.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'transfer-draw', (d) => showDraw.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'candidate-prediction', (d) => showAsk.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'rejection-ratio', (d) => showRatioFormula.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'ratio-answer', (d) => showRatioAnswer.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'discard-dependent', (d) => showDiscard.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'positive-deficit', (d) => showDeficit.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'normalize-residual', (d) => showResidual.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sample-correction', (d) => showCorrection.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'retain-accepted-kv', (d) => crossPhase(p1, p2, d), { desired: 0.45 });
  onCue(s, c, 'retain-accepted-kv', (d) => keepSang.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'trim-provisional-kv', (d) => trimKV.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'forward-nearby', (d) => fwdNearby.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'cache-nearby', (d) => cacheNearby.to(1, { duration: d }), { desired: 0.55 });
}

/**
 * Scene 29: fresh-state ("The last two guesses")
 * Finale: Same word "today" appears on two DIFFERENT histories!
 *   - Beat 0: New probabilities p=[0.15, 0.25, 0.60], q=[0.45, 0.35, 0.20], u=0.80 -> prediction withheld!
 *   - Beat 1: Softly alpha=5/7 < 0.80 -> reject softly & today -> correction is "today"! Can we reuse today's cache?
 *   - Beat 2: Decimal cache trace: 8 -> 82 -> 823 (includes rejected "softly"=2!) -> Rollback to 8 -> forward 3 -> 83!
 *   - Beat 3: Bridge to long-context KV cache management.
 */
export function freshState(s, c) {
  const f = freshStateFrame({ beat: 0, beatP: 0 }); // p=[0.15,0.25,0.60], q=[0.45,0.35,0.20], alpha=5/7, 8->82->823 vs 8->83

  const p1 = s.value(1);
  const p2 = s.value(0);

  const showInputs = s.value(0);
  const showDraw = s.value(0);
  const showQ = s.value(0);
  const showRej = s.value(0);
  const showCorr = s.value(0);
  const askReuse = s.value(0);

  const show82 = s.value(0);
  const show823 = s.value(0);
  const showRoll = s.value(0);
  const showPend = s.value(0);
  const show83 = s.value(0);
  const showNext = s.value(0);

  const title = heroTitle(['Same token,', 'different history'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.gold,
    eyebrow: 'FRESH ROUND & CACHE IDENTITY',
  });

  // Beats 0 & 1: New probabilities + rejection + correction "today"
  const v1 = guardedDynamic(p1, (a) => {
    const nodes = [
      txt(
        'PREFIX: "The bird sang"   |   DRAFT: softly -> today',
        -855,
        -238,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      tokenPill('softly', 410, -238, {
        w: 205,
        h: 68,
        color: showRej.value > 0.25 ? COSMOS.rose : COSMOS.cyan,
        wordSize: 28,
        opacity: a,
      }),
      tokenPill('today', 680, -238, {
        w: 205,
        h: 68,
        color: showCorr.value > 0.25 ? COSMOS.gold : COSMOS.cyan,
        wordSize: 28,
        opacity: a,
      }),
    ];
    if (showRej.value < 0.2) {
      nodes.push(
        tokenPill(showDraw.value > 0.2 ? 'Draw u = 0.80' : 'Fresh Round', 545, 45, {
          w: 380,
          h: 92,
          color: showDraw.value > 0.2 ? COSMOS.amber : COSMOS.cyan,
          wordColor: showDraw.value > 0.2 ? COSMOS.gold : COSMOS.ink,
          wordSize: 32,
          topTag: showDraw.value > 0.2 ? 'ACCEPTANCE TEST' : 'NEW PROBABILITIES',
          topColor: showDraw.value > 0.2 ? COSMOS.amber : COSMOS.cyan,
          opacity: a,
        }),
      );
    }
    const ys = [-100, 45, 190];
    const barLeft = -540;
    const barW = 540;
    for (let i = 0; i < 3; i++) {
      const y = ys[i];
      const isToday = i === 2;
      const isSoftly = i === 1;
      nodes.push(
        txt(
          f.words[i],
          -835,
          y,
          36,
          isToday && showCorr.value > 0.3 ? COSMOS.gold : COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
        probBarH(barLeft, y - 16, barW, 22, f.p[i] * Math.max(0.25, showInputs.value), 0.65, {
          color: COSMOS.gold,
          glow: 5,
          opacity: a,
        }),
        txt(
          `p=${f.p[i].toFixed(2)}`,
          barLeft + barW + 24,
          y - 16,
          26,
          COSMOS.gold,
          'mono',
          'left',
        ).opacity(a),
        probBarH(barLeft, y + 16, barW, 22, f.q[i] * Math.max(0.25, showInputs.value), 0.65, {
          color: COSMOS.cyan,
          glow: 5,
          opacity: a,
        }),
        txt(
          `q=${f.q[i].toFixed(2)}`,
          barLeft + barW + 24,
          y + 16,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(a),
      );
      if (isSoftly && showRej.value > 0.25) {
        nodes.push(
          txt('alpha=5/7 (~0.71) < 0.80 -> DROP', 240, y, 28, COSMOS.rose, 'mono', 'left').opacity(
            showRej.value * a,
          ),
        );
      }
      if (isToday && showCorr.value > 0.25) {
        nodes.push(
          txt('ONLY SHORTFALL (+0.40) -> "today"', 240, y, 28, COSMOS.emerald, 'mono', 'left')
            .glow(8, COSMOS.emerald)
            .opacity(showCorr.value * a),
        );
      }
    }

    let foot = 'Acceptance draw for softly: u = 0.80';
    let fCol = COSMOS.muted;
    if (askReuse.value > 0.25) {
      foot = 'We already cached "today" after "softly": can we reuse that entry after "sang"?';
      fCol = COSMOS.amber;
    } else if (showCorr.value > 0.25) {
      foot = 'Correction is "today": exact same word, brand-new position!';
      fCol = COSMOS.gold;
    } else if (showQ.value > 0.25) {
      foot = 'u = 0.80 on softly: which word goes in the space immediately after "sang"?';
      fCol = COSMOS.amber;
    }
    nodes.push(txt(foot, 0, 415, 29, fCol, 'sans').opacity(Math.max(0.3, showDraw.value) * a));
    return group(...nodes);
  });

  // Beats 2 & 3: Decimal cache branching 8 -> 82 -> 823 vs rollback 8 -> 83
  const v2 = guardedDynamic(p2, (a) => {
    const s82 = show82.value;
    const s823 = show823.value;
    const roll = showRoll.value;
    const pend = showPend.value;
    const s83 = show83.value;
    const nxt = showNext.value;

    const topY = -115;
    const botY = 145;
    const nodes = [
      txt(
        'HISTORY DIGIT ENCODING:  sang = 8   |   softly = 2   |   today = 3',
        0,
        -238,
        27,
        COSMOS.muted,
        'mono',
      ).opacity(a),
      // Root 8
      tokenPill('state = 8', -610, 15, {
        w: 270,
        h: 96,
        color: roll > 0.25 ? COSMOS.emerald : COSMOS.blue,
        wordSize: 34,
        topTag: 'The bird sang',
        topColor: COSMOS.emerald,
        glow: roll > 0.25 ? 14 : 8,
        opacity: a,
      }),
    ];

    // Rejected upper branch: 8 -> 82 -> 823
    if (s82 > 0.05) {
      nodes.push(
        line([-470, -10], [-235, topY], { stroke: COSMOS.rose, width: 3.2 }).opacity(
          s82 * a * (roll > 0.3 ? 0.45 : 1),
        ),
        tokenPill('state = 82', -90, topY, {
          w: 280,
          h: 88,
          color: COSMOS.rose,
          wordSize: 32,
          topTag: '+ softly (2)',
          topColor: COSMOS.rose,
          opacity: s82 * a * (roll > 0.3 ? 0.45 : 1),
        }),
      );
    }
    if (s823 > 0.05) {
      nodes.push(
        line([55, topY], [250, topY], { stroke: COSMOS.rose, width: 3.2 }).opacity(
          s823 * a * (roll > 0.3 ? 0.45 : 1),
        ),
        tokenPill('state = 823', 420, topY, {
          w: 320,
          h: 88,
          color: COSMOS.rose,
          wordSize: 34,
          topTag: '+ today (3) AFTER softly',
          topColor: COSMOS.rose,
          sub: 'CONTAINS REJECTED "2"!',
          subColor: COSMOS.rose,
          opacity: s823 * a * (roll > 0.3 ? 0.45 : 1),
        }),
      );
    }

    // Clean lower branch: rollback to 8 -> pending today -> process 3 -> state 83!
    if (pend > 0.05 || s83 > 0.05) {
      nodes.push(
        glowingArc(-470, 42, 240, botY, 45, {
          gradientColors: [COSMOS.emerald, COSMOS.gold],
          width: 4.2,
          opacity: Math.max(pend, s83) * a,
          glow: 12,
        }),
        tokenPill(s83 > 0.35 ? 'state = 83' : 'today (pending)', 420, botY, {
          w: 360,
          h: 96,
          color: s83 > 0.35 ? COSMOS.emerald : COSMOS.amber,
          wordColor: s83 > 0.35 ? COSMOS.gold : COSMOS.amber,
          wordSize: 38,
          topTag: s83 > 0.35 ? 'PROCESSED 3 ON 8' : 'COMMITTED ON 8',
          topColor: COSMOS.emerald,
          sub: s83 > 0.35 ? 'EXACT READER HISTORY' : 'KV PENDING',
          subColor: s83 > 0.35 ? COSMOS.emerald : COSMOS.amber,
          glow: 16,
          opacity: Math.max(pend, s83) * a,
        }),
      );
    }

    nodes.push(
      txt(
        nxt > 0.25
          ? 'Next up: fitting those saved keys and values into long-context memory budgets'
          : s83 > 0.25
            ? '823 != 83: never reuse a KV entry built from a rejected prefix'
            : 'Trace the exact cached prefix history before reusing any key-value entry',
        0,
        415,
        29,
        nxt > 0.25 ? COSMOS.cyan : COSMOS.gold,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(heroAura(0, 20, 520, '#ffd16618', '#6ee7b716'), cinemaRails(), title, v1, v2);

  onCue(s, c, 'sd-fresh-inputs', (d) => showInputs.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sd-fresh-draw', (d) => showDraw.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-fresh-question', (d) => showQ.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-fresh-reject', (d) => showRej.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-fresh-correction', (d) => showCorr.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-fresh-reuse', (d) => askReuse.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-fresh-82', (d) => crossPhase(p1, p2, d), { desired: 0.45 });
  onCue(s, c, 'sd-fresh-82', (d) => show82.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sd-fresh-provisional', (d) => show823.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sd-fresh-rollback', (d) => showRoll.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-fresh-pending', (d) => showPend.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-fresh-process', (d) => show83.to(1, { duration: d }), { desired: 0.6 });
  onCue(s, c, 'sd-fresh-next', (d) => showNext.to(1, { duration: d }), { desired: 0.5 });
}
