// Act 3 (Scenes 13 to 18): Prefix causality in expert choice, rich-get-richer training skew,
// Switch load-balancing loss, exact balance arithmetic, dead-expert counterexample, and z-loss.
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
} from '../../cinematic-kit.mjs';
import {
  EXP_COLORS,
  ROLE,
  SKEW_COUNTS,
  arcPts,
  buildBalanceBowl3d,
  cinemaAtmosphere,
  clamp,
  fmt,
  glowMatrix,
  glowRing,
  lerp,
  lumBar,
  moeBalance,
  moeZ,
  pct,
  playCue,
  shareRibbon,
} from '../parts.mjs';

// ---------------------------------------------------------------------------
// Scene 13: prefix-consistency: "Let a future token challenge the same prefix"
// STRICT PREDICTION WITHHOLDING: Beat 0 asks if earlier token keeps slot; Beat 1 reveals displacement!
// ---------------------------------------------------------------------------
export function prefixConsistency(s, c) {
  const title = heroTitle(['Let a future token', 'challenge the same prefix'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.overflow,
  });

  const pSetup = s.value(0.5);
  const pEarly = s.value(0);
  const pFuture = s.value(0);
  const pB1 = s.value(0);
  const pFutureWins = s.value(0); // WITHHELD until Beat 1 mo-future-wins!
  const pEarlyLoses = s.value(0); // WITHHELD until Beat 1 mo-prefix-loses!
  const pB2 = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const su = pSetup.value;
    const ea = pEarly.value;
    const fu = pFuture.value;
    const b1 = pB1.value;
    const fw = pFutureWins.value;
    const el = pEarlyLoses.value;
    const b2 = pB2.value;
    const nodes = [];

    // Left: Prefix-only run (earlier token 0.6 wins the 1-slot bucket)
    const lx = -435;
    nodes.push(
      txt(
        'Step 1: Prefix only (1-slot expert)',
        lx,
        -235,
        30,
        ROLE.token,
        'mono',
        'center',
      ).opacity(alpha),
      lumBar(lx, -100, 680, 128, {
        color: ROLE.token,
        fillOpacity: 0.22 + 0.16 * ea,
        strokeWidth: 2.6,
        glow: 6 + 6 * ea,
        opacity: alpha,
      }),
      txt('t_early   ·   score = 0.60', lx, -118, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('causal mask & hidden state fixed', lx, -68, 26, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
      arrow([lx, -25], [lx, 62], { stroke: ROLE.active, width: 3.6, tip: 14 }).opacity(alpha),
      lumBar(lx, 145, 520, 118, {
        color: ROLE.active,
        fillOpacity: 0.3,
        strokeWidth: 2.8,
        glow: 10,
        opacity: alpha,
      }),
      txt('Expert 1-slot bucket', lx, 120, 26, ROLE.active, 'mono', 'center').opacity(alpha),
      txt('WINS:  t_early (0.60)', lx, 168, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),
    );

    // Right: Extended sequence with future token 0.9 joining
    const rx = 435;
    nodes.push(
      txt('Step 2: Future token joins group', rx, -235, 30, ROLE.router, 'mono', 'center').opacity(
        (0.5 + 0.5 * su) * alpha,
      ),
      // Earlier token stays unchanged
      lumBar(rx - 155, -100, 295, 128, {
        color: el > 0.25 ? ROLE.overflow : ROLE.token,
        fillOpacity: el > 0.25 ? 0.14 : 0.24,
        strokeWidth: 2.4,
        glow: el > 0.25 ? 3 : 6,
        opacity: alpha,
      }),
      txt(
        't_early',
        rx - 155,
        -122,
        28,
        el > 0.25 ? COSMOS.muted : COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'score = 0.60',
        rx - 155,
        -74,
        28,
        el > 0.25 ? ROLE.overflow : ROLE.router,
        'mono',
        'center',
      ).opacity(alpha),

      // Future token arrives with score 0.90
      lumBar(rx + 165, -100, 295, 128, {
        color: fw > 0.25 ? ROLE.overflow : fu > 0.2 ? ROLE.router : '#4e608e',
        fillOpacity: fu > 0.2 ? 0.32 : 0.14,
        strokeWidth: fu > 0.2 ? 2.8 : 1.8,
        glow: fu > 0.2 ? 10 : 3,
        opacity: (0.45 + 0.55 * fu) * alpha,
      }),
      txt('t_future', rx + 165, -122, 28, COSMOS.ink, 'mono', 'center').opacity(
        (0.45 + 0.55 * fu) * alpha,
      ),
      txt('score = 0.90', rx + 165, -74, 28, ROLE.router, 'mono', 'center').opacity(
        (0.45 + 0.55 * fu) * alpha,
      ),

      arrow([rx, -25], [rx, 62], {
        stroke: fw > 0.25 ? ROLE.overflow : '#5b6f9d',
        width: 3.6,
        tip: 14,
      }).opacity(alpha),

      // Extended 1-slot bucket (WITHHELD until mo-future-wins!)
      lumBar(rx, 145, 680, 118, {
        color: fw > 0.25 ? ROLE.overflow : '#526592',
        fillOpacity: fw > 0.25 ? 0.34 : 0.16,
        strokeWidth: fw > 0.25 ? 3 : 2,
        glow: fw > 0.25 ? 12 : 4,
        opacity: alpha,
      }),
      txt(
        'Expert 1-slot bucket (extended)',
        rx,
        120,
        26,
        fw > 0.25 ? ROLE.overflow : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        fw > 0.25 ? 'WINS: t_future (0.9) · t_early out' : 'Who wins the 1 slot now?  ?',
        rx,
        168,
        fw > 0.25 ? 28 : 30,
        fw > 0.25 ? COSMOS.ink : ROLE.router,
        'mono',
        'center',
      )
        .glow(fw > 0.25 ? 8 : 0, ROLE.overflow)
        .opacity(alpha),
    );

    // Bottom footer (mutually exclusive)
    if (b2 > 0.25) {
      nodes.push(
        txt(
          'Autoregressive decoders require prefix-consistent routing  ·  test incremental execution',
          0,
          365,
          28,
          ROLE.token,
          'mono',
          'center',
        )
          .glow(6, ROLE.token)
          .opacity(clamp((b2 - 0.25) / 0.75) * alpha),
      );
    } else if (b1 > 0.25 || el > 0.25) {
      nodes.push(
        txt(
          'Causal attention mask stays intact, yet batch-wide expert choice leaks future scores',
          0,
          365,
          28,
          ROLE.overflow,
          'sans',
          'center',
        )
          .glow(6, ROLE.overflow)
          .opacity(alpha),
      );
    } else {
      nodes.push(
        txt(
          't_early keeps its hidden state and 0.60 score. Does its expert assignment stay fixed?',
          0,
          365,
          30,
          ROLE.router,
          'serif',
          'center',
        )
          .glow(7, ROLE.router)
          .opacity(alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.overflow, ROLE.token), title, layer);

  playCue(s, c, 'mo-prefix-consistency-op-0', (d) => s.play(pSetup.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'mo-prefix-score', (d) => s.play(pEarly.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'mo-future-score', (d) => s.play(pFuture.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'mo-prefix-consistency-op-1', (d) => s.play(pB1.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'mo-future-wins', (d) => s.play(pFutureWins.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'mo-prefix-loses', (d) => s.play(pEarlyLoses.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'mo-prefix-consistency-op-2', (d) => s.play(pB2.to(1, { duration: d })), {
    dur: 0.65,
  });
}

// ---------------------------------------------------------------------------
// Scene 14: training-skew: "A popular route can reinforce itself"
// ---------------------------------------------------------------------------
export function trainingSkew(s, c) {
  const title = heroTitle(['A popular route can', 'reinforce itself'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.overflow,
  });

  const pSkew = s.value(0.25);
  const pUnequal = s.value(0);
  const pCollect = s.value(0);
  const pUpdate = s.value(0);
  const pLoop = s.value(0);
  const pTrend = s.value(0);
  const pQual = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const sk = pSkew.value;
    const un = pUnequal.value;
    const cl = pCollect.value;
    const up = pUpdate.value;
    const lp = pLoop.value;
    const tr = pTrend.value;
    const ql = pQual.value;
    const nodes = [];

    // Left: 20 top-1 assignments bar chart (12 / 4 / 3 / 1)
    const baseY = 215;
    const barXs = [-680, -490, -300, -110];
    const maxH = 310;
    nodes.push(
      txt(
        '20 top-1 batch assignments (task-gradient terms)',
        -395,
        -210,
        28,
        ROLE.expert,
        'mono',
        'center',
      ).opacity(alpha),
      line([-780, baseY], [-10, baseY], { stroke: '#556894', width: 2.4 }).opacity(alpha),
    );

    SKEW_COUNTS.forEach((cnt, i) => {
      const bx = barXs[i];
      const h = Math.max(18, (cnt / 12) * maxH * (0.25 + 0.75 * sk));
      const isHot = i === 0;
      const col = isHot ? ROLE.overflow : EXP_COLORS[i];
      nodes.push(
        lumBar(bx, baseY - h / 2, 118, h, {
          color: col,
          fillOpacity: isHot ? 0.44 : 0.24,
          strokeWidth: isHot ? 3 : 2,
          glow: isHot ? 11 : 4,
          opacity: alpha,
        }),
        txt(`E${i + 1}`, bx, baseY + 38, 30, col, 'mono', 'center').opacity(alpha),
        txt(
          `${cnt} / 20`,
          bx,
          baseY - h - 28,
          28,
          isHot ? COSMOS.ink : col,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          un > 0.25 ? `${cnt} grads` : `${pct(cnt / 20)}`,
          bx,
          baseY + 76,
          26,
          isHot ? ROLE.overflow : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    // Right: Schematic feedback cycle (Collect -> Update -> Possible future router pull)
    const rx = 435;
    const steps = [
      {
        y: -155,
        label: '1. Collect gradients',
        sub: 'E1 gets 12 terms  ·  E4 gets 1',
        on: cl > 0.2,
        col: ROLE.expert,
      },
      {
        y: 25,
        label: '2. Update selected experts',
        sub:
          ql > 0.2
            ? 'Experts need data to learn useful functions'
            : 'Popular expert improves faster',
        on: up > 0.2,
        col: ql > 0.2 ? ROLE.active : ROLE.router,
      },
      {
        y: 205,
        label: '3. Possible future router pull',
        sub: 'Conditional on data & joint learning',
        on: lp > 0.2,
        col: ROLE.overflow,
      },
    ];

    steps.forEach((st, i) => {
      nodes.push(
        lumBar(rx, st.y, 680, 118, {
          color: st.on ? st.col : '#4b5d8a',
          fillOpacity: st.on ? 0.26 : 0.14,
          strokeWidth: st.on ? 2.8 : 1.8,
          glow: st.on ? 10 : 3,
          opacity: alpha,
        }),
        txt(
          st.label,
          rx,
          st.y - 18,
          30,
          st.on ? COSMOS.ink : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
        txt(st.sub, rx, st.y + 26, 26, st.on ? st.col : COSMOS.dim, 'sans', 'center').opacity(
          alpha,
        ),
      );
      if (i < 2) {
        nodes.push(
          arrow([rx, st.y + 64], [rx, steps[i + 1].y - 64], {
            stroke: st.on ? st.col : '#4d608e',
            width: 3.4,
            tip: 13,
          }).opacity(alpha),
        );
      }
    });

    // Feedback return arc from Step 3 back to Step 1
    if (lp > 0.1) {
      const loopPts = arcPts([rx + 350, 205], [rx + 350, -155], 0, 24).map(([x, y], idx, arr) => {
        const u = Math.sin((idx / (arr.length - 1)) * Math.PI);
        return [x + u * 72, y];
      });
      const cut = Math.max(2, Math.round(loopPts.length * clamp(lp)));
      nodes.push(
        glowingTrail(loopPts.slice(0, cut), {
          gradientColors: [ROLE.overflow, ROLE.router],
          width: 4,
          glow: 10,
          opacity: 0.92 * alpha,
        }),
      );
    }

    nodes.push(
      txt(
        tr > 0.25 || ql > 0.25
          ? 'Monitor assignment trends across batches alongside held-out quality'
          : 'Rich-get-richer loop can starve quieter experts of training signal',
        0,
        395,
        28,
        tr > 0.25 ? ROLE.active : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.overflow, ROLE.router), title, layer);

  playCue(s, c, 'assignment-skew', (d) => s.play(pSkew.to(1, { duration: d })), { dur: 0.8 });
  playCue(s, c, 'unequal-gradients', (d) => s.play(pUnequal.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'collect-gradients', (d) => s.play(pCollect.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'update-experts', (d) => s.play(pUpdate.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'feedback-loop', (d) => s.play(pLoop.to(1, { duration: d })), { dur: 0.8 });
  playCue(s, c, 'later-batches', (d) => s.play(pTrend.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'expert-quality', (d) => s.play(pQual.to(1, { duration: d })), { dur: 0.6 });
}

// ---------------------------------------------------------------------------
// Scene 15: balance-pressure: "Give the router a balancing signal"
// ---------------------------------------------------------------------------
export function balancePressure(s, c) {
  const title = heroTitle(['Give the router a', 'balancing signal'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.router,
  });

  const view3d = buildBalanceBowl3d({ x: 605, y: -305, unit: 52 });
  const bal = moeBalance(); // f=[0.6,0.2,0.15,0.05], p=[0.55,0.22,0.15,0.08]

  const pFP = s.value(0.35);
  const pRect = s.value(0);
  const pGrad = s.value(0);
  const pConc = s.value(0);
  const pTask = s.value(0);
  const pUnif = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const fp = pFP.value;
    const rc = pRect.value;
    const gr = pGrad.value;
    const cn = pConc.value;
    const tk = pTask.value;
    const un = pUnif.value;
    const nodes = [];

    // 4 product rectangles f_i x p_i on a common horizontal baseline
    const baseY = 145;
    const scaleX = 540;
    const scaleY = 440;
    const starts = [-790, -340, -110, 95];

    nodes.push(
      txt(
        'Area = f_i (assign share) x p_i (mean prob)',
        -290,
        -220,
        28,
        ROLE.router,
        'mono',
        'center',
      ).opacity(alpha),
      line([-810, baseY], [250, baseY], { stroke: '#556894', width: 2.4 }).opacity(alpha),
    );

    bal.f.forEach((fi, i) => {
      const pi = bal.p[i];
      const rw = Math.max(26, fi * scaleX);
      const rh = Math.max(26, pi * scaleY * (0.3 + 0.7 * fp));
      const x0 = starts[i];
      const cx = x0 + rw / 2;
      const cy = baseY - rh / 2;
      const isHot = i === 0;
      const col = isHot && cn > 0.25 ? ROLE.overflow : EXP_COLORS[i];

      nodes.push(
        lumBar(cx, cy, rw, rh, {
          color: col,
          fillOpacity: rc > 0.2 ? (isHot ? 0.42 : 0.28) : 0.2,
          strokeWidth: isHot ? 3 : 2.2,
          glow: isHot ? 11 : 5,
          radius: 6,
          opacity: alpha,
        }),
        txt(`E${i + 1}`, cx, baseY + 38, 28, col, 'mono', 'center').opacity(alpha),
        txt(
          `${fmt(fi, 2)} x ${fmt(pi, 2)}`,
          cx,
          baseY - rh - 28,
          26,
          isHot ? COSMOS.ink : col,
          'mono',
          'center',
        ).opacity(alpha),
      );

      // Gradient push-down arrow through p_i (strongest on busy E1)
      if (gr > 0.15 && i <= 1) {
        const len = isHot ? 115 : 46;
        const ax = cx;
        nodes.push(
          arrow([ax, baseY - rh + 14], [ax, baseY - rh + 14 + len * clamp(gr)], {
            stroke: ROLE.overflow,
            width: isHot ? 5.2 : 3.2,
            tip: isHot ? 16 : 11,
          })
            .glow(9, ROLE.overflow)
            .opacity(gr * alpha),
        );
      }
    });

    // Right panel: Combined objective + uniform reference
    const rx = 550;
    nodes.push(
      lumBar(rx, -40, 640, 140, {
        color: tk > 0.25 ? ROLE.token : '#4c5f8d',
        fillOpacity: tk > 0.25 ? 0.26 : 0.14,
        strokeWidth: 2.5,
        glow: tk > 0.25 ? 9 : 3,
        opacity: alpha,
      }),
      txt('Total training objective', rx, -74, 28, ROLE.token, 'mono', 'center').opacity(alpha),
      txt('L = L_LM + alpha · L_bal', rx, -18, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),

      lumBar(rx, 145, 640, 140, {
        color: un > 0.25 ? ROLE.router : '#4c5f8d',
        fillOpacity: un > 0.25 ? 0.24 : 0.14,
        strokeWidth: 2.4,
        glow: un > 0.25 ? 9 : 3,
        opacity: alpha,
      }),
      txt('Uniform ref (orientation)', rx, 112, 26, ROLE.router, 'mono', 'center').opacity(alpha),
      txt('f = p = 1/N  ->  score = 1.0', rx, 166, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),

      txt(
        un > 0.25
          ? 'Check actual coverage, overflow, and held-out quality alongside balance loss'
          : gr > 0.25
            ? 'Gradient flows through p_i -> larger penalty coefficient pushes down busy E1'
            : 'Large f_i · p_i rectangle signals an expert that is both heavily assigned and favored',
        0,
        365,
        28,
        gr > 0.25 && un < 0.25 ? ROLE.overflow : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.router, ROLE.overflow), title, view3d, layer);
  orbitScene(s, c, view3d, { theta: -0.24, phi: 0.94, distance: 14.0 });

  playCue(s, c, 'frequency-probability', (d) => s.play(pFP.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'rectangle-products', (d) => s.play(pRect.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'probability-gradient', (d) => s.play(pGrad.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'concentration-pressure', (d) => s.play(pConc.to(1, { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'task-objective', (d) => s.play(pTask.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'uniform-reference', (d) => s.play(pUnif.to(1, { duration: d })), { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// Scene 16: balance-value: "Compute the balancing pressure"
// ---------------------------------------------------------------------------
export function balanceValue(s, c) {
  const title = heroTitle(['Compute the', 'balancing pressure'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.router,
  });

  const eq = glowTex('\\mathcal{L}_{\\text{bal}} = \\alpha \\cdot N \\sum_{i=1}^{N} f_i\\,p_i', {
    x: 470,
    y: -380,
    size: 42,
    color: ROLE.router,
  });

  const bal = moeBalance(); // products: [0.33, 0.044, 0.0225, 0.004], sum: 0.4005, score: 1.602

  const pB0 = s.value(0.5);
  const pProd = s.value(0);
  const pB1 = s.value(0);
  const pSum = s.value(0);
  const pScore = s.value(0);
  const pB2 = s.value(0);
  const pCoeff = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const pr = pProd.value;
    const sm = pSum.value;
    const sc = pScore.value;
    const b2 = pB2.value;
    const cf = pCoeff.value;
    const nodes = [];

    const colXs = [-660, -220, 220, 660];
    const prodStrs = ['0.3300', '0.0440', '0.0225', '0.0040'];

    bal.f.forEach((fi, i) => {
      const pi = bal.p[i];
      const cx = colXs[i];
      const col = EXP_COLORS[i];
      nodes.push(
        lumBar(cx, -85, 390, 240, {
          color: col,
          fillOpacity: 0.16 + 0.16 * pr,
          strokeWidth: i === 0 ? 2.8 : 2,
          glow: i === 0 ? 10 : 4,
          opacity: alpha,
        }),
        txt(`Expert ${i + 1}`, cx, -168, 30, col, 'mono', 'center').opacity(alpha),
        txt(
          `f${i + 1}=${fmt(fi, 2)} (no grad)`,
          cx,
          -112,
          26,
          b2 > 0.25 ? COSMOS.dim : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          `p${i + 1}=${fmt(pi, 2)} (grad)`,
          cx,
          -62,
          26,
          b2 > 0.25 ? ROLE.active : COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          pr > 0.25 ? `f·p = ${prodStrs[i]}` : 'f·p = ?',
          cx,
          -4,
          30,
          pr > 0.25 ? ROLE.router : COSMOS.dim,
          'mono',
          'center',
        )
          .glow(pr > 0.25 ? 6 : 0, ROLE.router)
          .opacity(alpha),
      );
    });

    // Lower arithmetic pipeline: Sum -> x4 -> Score vs Uniform + Gradient coeff
    nodes.push(
      lumBar(-555, 180, 440, 128, {
        color: sm > 0.25 ? ROLE.token : '#4b5e8b',
        fillOpacity: sm > 0.25 ? 0.26 : 0.14,
        strokeWidth: 2.5,
        glow: sm > 0.25 ? 9 : 3,
        opacity: alpha,
      }),
      txt('Sum of 4 products', -555, 148, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(
        sm > 0.25 ? '0.4005' : '?',
        -555,
        202,
        42,
        sm > 0.25 ? ROLE.token : COSMOS.dim,
        'mono',
        'center',
      )
        .glow(sm > 0.25 ? 8 : 0, ROLE.token)
        .opacity(alpha),

      arrow([-320, 180], [-145, 180], { stroke: ROLE.router, width: 3.6, tip: 14 }).opacity(alpha),
      txt('x 4', -232, 140, 26, ROLE.router, 'mono', 'center').opacity(alpha),

      lumBar(115, 180, 490, 128, {
        color: sc > 0.25 ? ROLE.router : '#4b5e8b',
        fillOpacity: sc > 0.25 ? 0.3 : 0.14,
        strokeWidth: 2.8,
        glow: sc > 0.25 ? 11 : 3,
        opacity: alpha,
      }),
      txt('Score (vs uniform 1.0)', 115, 148, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(
        sc > 0.25 ? '1.602' : '?',
        115,
        202,
        42,
        sc > 0.25 ? ROLE.router : COSMOS.dim,
        'mono',
        'center',
      )
        .glow(sc > 0.25 ? 9 : 0, ROLE.router)
        .opacity(alpha),

      lumBar(630, 180, 460, 128, {
        color: cf > 0.25 ? ROLE.overflow : '#4b5e8b',
        fillOpacity: cf > 0.25 ? 0.26 : 0.14,
        strokeWidth: 2.5,
        glow: cf > 0.25 ? 9 : 3,
        opacity: alpha,
      }),
      txt('Grad coeff on p_i', 630, 148, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(
        cf > 0.25 ? 'alpha · N · f_i' : 'stop-grad on f_i',
        630,
        202,
        32,
        cf > 0.25 ? ROLE.overflow : COSMOS.dim,
        'mono',
        'center',
      )
        .glow(cf > 0.25 ? 7 : 0, ROLE.overflow)
        .opacity(alpha),

      txt(
        cf > 0.25
          ? 'Busy E1 (f1 = 0.60) gets 12x the penalty coefficient of quiet E4 (f4 = 0.05)'
          : 'Hard counts stop gradients; mean router probabilities carry the balancing update',
        0,
        365,
        28,
        cf > 0.25 ? ROLE.overflow : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    void pB0.value;
    void pB1.value;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.router, ROLE.token), title, eq, layer);

  playCue(s, c, 'mo-balance-value-op-0', (d) => s.play(pB0.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'mo-balance-products', (d) => s.play(pProd.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'mo-balance-value-op-1', (d) => s.play(pB1.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'mo-balance-sum', (d) => s.play(pSum.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-balance-score', (d) => s.play(pScore.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-balance-value-op-2', (d) => s.play(pB2.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'mo-balance-coefficient', (d) => s.play(pCoeff.to(1, { duration: d })), {
    dur: 0.65,
  });
}

// ---------------------------------------------------------------------------
// Scene 17: balance-counterexample: "A smaller score can leave an expert unused"
// ---------------------------------------------------------------------------
export function balanceCounterexample(s, c) {
  const title = heroTitle(['A smaller score can', 'leave an expert unused'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.overflow,
  });

  const counter = moeBalance([0.5, 0.5, 0], [0.3, 0.3, 0.4]); // score = 0.90

  const pB0 = s.value(0.5);
  const pRoutes = s.value(0);
  const pB1 = s.value(0);
  const pFrac = s.value(0);
  const pMean = s.value(0);
  const pScore = s.value(0);
  const pUnused = s.value(0);
  const pB2 = s.value(0);
  const vis = s.value(1);

  const probRows = [
    ['0.51', '0.09', '0.40'],
    ['0.09', '0.51', '0.40'],
  ];

  const layer = guardedDynamic(vis, (alpha) => {
    const rt = pRoutes.value;
    const fr = pFrac.value;
    const mn = pMean.value;
    const sc = pScore.value;
    const un = pUnused.value;
    const b2 = pB2.value;

    const colors = [
      [rt > 0.25 ? ROLE.token : '#5b6f9d', '#5b6f9d', ROLE.router],
      ['#5b6f9d', rt > 0.25 ? ROLE.active : '#5b6f9d', ROLE.router],
    ];

    const nodes = [
      txt(
        'Two tokens, three experts (top-1 routing)',
        -360,
        -255,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      glowMatrix({
        cx: -360,
        cy: -45,
        rows: 2,
        cols: 3,
        cellW: 210,
        cellH: 98,
        gap: 18,
        values: probRows,
        colors,
        rowLabels: ['tok 0', 'tok 1'],
        colLabels: ['E0', 'E1', 'E2 (40%)'],
        highlight: (r, k) =>
          (rt > 0.25 && ((r === 0 && k === 0) || (r === 1 && k === 1))) || k === 2,
        dim: (r, k) => rt > 0.25 && ((r === 0 && k === 1) || (r === 1 && k === 0)),
        fontSize: 32,
        opacity: alpha,
      }),
      // Summary rows under matrix: f_i and p_i
      txt(
        fr > 0.25 ? 'hard fractions f = [0.50,  0.50,  0.00]' : 'hard fractions f = [?,  ?,  ?]',
        -360,
        155,
        28,
        fr > 0.25 ? ROLE.token : COSMOS.dim,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        mn > 0.25 ? 'mean probs     p = [0.30,  0.30,  0.40]' : 'mean probs     p = [?,  ?,  ?]',
        -360,
        215,
        28,
        mn > 0.25 ? ROLE.router : COSMOS.dim,
        'mono',
        'center',
      ).opacity(alpha),

      // Right side: Score readout + Executed Coverage indicator
      lumBar(480, -95, 700, 175, {
        color: sc > 0.25 ? ROLE.router : '#4c5e8a',
        fillOpacity: sc > 0.25 ? 0.26 : 0.14,
        strokeWidth: 2.6,
        glow: sc > 0.25 ? 10 : 3,
        opacity: alpha,
      }),
      txt('Balance score  3 · (f · p)', 480, -145, 28, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        sc > 0.25
          ? `3 x (0.15 + 0.15 + 0)  =  ${fmt(counter.score, 2)}`
          : 'computing dot product...',
        480,
        -88,
        32,
        sc > 0.25 ? ROLE.router : COSMOS.dim,
        'mono',
        'center',
      )
        .glow(sc > 0.25 ? 8 : 0, ROLE.router)
        .opacity(alpha),
      txt(
        sc > 0.25
          ? 'Below uniform 1.00, yet E2 is completely dead!'
          : 'E2 mass (0.40) multiplied by f2 = 0',
        480,
        -34,
        26,
        sc > 0.25 ? ROLE.overflow : COSMOS.dim,
        'sans',
        'center',
      ).opacity(alpha),

      // Separate coverage gauge
      lumBar(480, 145, 700, 175, {
        color: un > 0.25 ? ROLE.overflow : '#4c5e8a',
        fillOpacity: un > 0.25 ? 0.26 : 0.14,
        strokeWidth: 2.6,
        glow: un > 0.25 ? 11 : 3,
        opacity: alpha,
      }),
      txt('Executed assignment coverage', 480, 96, 28, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        un > 0.25 ? 'E0: 1  ·  E1: 1  ·  E2: 0 calls' : 'E0: ?  ·  E1: ?  ·  E2: ?',
        480,
        152,
        28,
        un > 0.25 ? COSMOS.ink : COSMOS.dim,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        b2 > 0.25
          ? 'Ablate on held-out tasks to verify utility'
          : 'Track call histograms alongside scalar loss',
        480,
        204,
        26,
        b2 > 0.25 ? ROLE.active : ROLE.overflow,
        'sans',
        'center',
      ).opacity(alpha),

      txt(
        b2 > 0.25
          ? 'Count executed calls and run held-out ablations instead of trusting one scalar'
          : 'Score 0.90 < 1.00 proves scalar balance loss alone cannot guarantee full expert coverage',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    void pB0.value;
    void pB1.value;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.overflow, ROLE.router), title, layer);

  playCue(s, c, 'mo-balance-counterexample-op-0', (d) => s.play(pB0.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'mo-counter-routes', (d) => s.play(pRoutes.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-balance-counterexample-op-1', (d) => s.play(pB1.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'mo-counter-fractions', (d) => s.play(pFrac.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'mo-counter-means', (d) => s.play(pMean.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'mo-counter-score', (d) => s.play(pScore.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-counter-unused', (d) => s.play(pUnused.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-balance-counterexample-op-2', (d) => s.play(pB2.to(1, { duration: d })), {
    dur: 0.65,
  });
}

// ---------------------------------------------------------------------------
// Scene 18: z-partition: "Slide both router scores by three"
// ---------------------------------------------------------------------------
export function zPartition(s, c) {
  const title = heroTitle(['Slide both router', 'scores by three'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.router,
  });

  const eq = glowTex('L_z = \\left(\\log \\sum_i e^{z_i}\\right)^2', {
    x: 495,
    y: -380,
    size: 42,
    color: ROLE.router,
  });

  const pB0 = s.value(0.5);
  const pBaseSum = s.value(0);
  const pBaseZ = s.value(0);
  const pB1 = s.value(0);
  const pShift = s.value(0); // 0 -> 3 continuous slide!
  const pShiftSum = s.value(0);
  const pShiftZ = s.value(0);
  const pB2 = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const sh = pShift.value * 3;
    const state = moeZ(sh);
    const bSum = pBaseSum.value;
    const bZ = pBaseZ.value;
    const sSum = pShiftSum.value;
    const sZ = pShiftZ.value;
    const b2 = pB2.value;
    const nodes = [];

    // Number line for logits from -2.0 to +3.5
    const lineLeft = -760;
    const lineRight = 760;
    const lineY = -120;
    const toX = (val) => lineLeft + ((val + 2) / 5.5) * (lineRight - lineLeft);

    nodes.push(
      txt(
        sh > 0.1
          ? `Common logit shift:  +${fmt(sh, 2)}   (gap stays constant at 1.099)`
          : 'Initial logits:  ln(0.75) = -0.29  and  ln(0.25) = -1.39',
        0,
        -225,
        28,
        sh > 0.1 ? ROLE.router : ROLE.token,
        'mono',
        'center',
      ).opacity(alpha),
      line([lineLeft, lineY], [lineRight, lineY], { stroke: '#6074a6', width: 3 }).opacity(alpha),
    );

    [-2, -1, 0, 1, 2, 3].forEach((tick) => {
      const tx = toX(tick);
      nodes.push(
        line([tx, lineY - 12], [tx, lineY + 12], { stroke: '#6074a6', width: 2.2 }).opacity(alpha),
        txt(String(tick), tx, lineY + 38, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      );
    });

    const xBlue = toX(state.logits[0]);
    const xPink = toX(state.logits[1]);
    // Gap bracket between the two logits
    nodes.push(
      glowingTrail(
        [
          [xPink, lineY],
          [xBlue, lineY],
        ],
        { gradientColors: [ROLE.overflow, ROLE.token], width: 5, glow: 10, opacity: alpha },
      ),
      glowRing(xPink, lineY, 13, ROLE.overflow, { width: 3.4, glow: 11, opacity: alpha }),
      txt(fmt(state.logits[1], 2), xPink, lineY - 40, 28, ROLE.overflow, 'mono', 'center').opacity(
        alpha,
      ),
      glowRing(xBlue, lineY, 13, ROLE.token, { width: 3.4, glow: 11, opacity: alpha }),
      txt(fmt(state.logits[0], 2), xBlue, lineY - 40, 28, ROLE.token, 'mono', 'center').opacity(
        alpha,
      ),
    );

    // Conserved softmax probability strip below (never changes!)
    nodes.push(
      shareRibbon({
        x: 0,
        y: 35,
        width: 1180,
        height: 54,
        shares: [state.p[0], state.p[1]],
        colors: [ROLE.token, ROLE.overflow],
        labels: ['Blue share (unchanged)', 'Pink share (unchanged)'],
        opacity: alpha,
      }),
    );

    // Three metric readouts: exp sum, log-partition, z-loss
    const sumLabel =
      sSum > 0.35
        ? `e^3  (${fmt(Math.exp(state.partition), 2)})`
        : bSum > 0.25 || sh > 0.05
          ? fmt(Math.exp(state.partition), 2)
          : '1.00';
    const logLabel = fmt(state.partition, 2);
    const lossLabel = sZ > 0.35 ? '9.00' : bZ > 0.25 || sh > 0.05 ? fmt(state.loss, 2) : '0.00';

    const boxes = [
      { x: -510, cap: 'Exponential sum', val: sumLabel, col: ROLE.expert },
      { x: 0, cap: 'Log-partition (LSE)', val: logLabel, col: ROLE.router },
      {
        x: 510,
        cap: 'Squared z-loss',
        val: lossLabel,
        col: sh > 1.5 ? ROLE.overflow : ROLE.active,
      },
    ];
    boxes.forEach((b) => {
      nodes.push(
        lumBar(b.x, 225, 440, 128, {
          color: b.col,
          fillOpacity: 0.22,
          strokeWidth: 2.6,
          glow: 9,
          opacity: alpha,
        }),
        txt(b.cap, b.x, 192, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(b.val, b.x, 246, 38, b.col, 'mono', 'center').glow(8, b.col).opacity(alpha),
      );
    });

    nodes.push(
      txt(
        b2 > 0.25
          ? 'ST-MoE z-loss bounds drifting logit magnitudes without distorting softmax ratios'
          : 'Shifting both logits by +3 leaves softmax at 75% / 25% while raising z-loss from 0 to 9',
        0,
        378,
        28,
        b2 > 0.25 ? ROLE.active : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    void pB0.value;
    void pB1.value;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.router, ROLE.token), title, eq, layer);

  playCue(s, c, 'mo-z-partition-op-0', (d) => s.play(pB0.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'mo-z-base-sum', (d) => s.play(pBaseSum.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'mo-z-base', (d) => s.play(pBaseZ.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'mo-z-partition-op-1', (d) => s.play(pB1.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'mo-z-shift', (d) => s.play(pShift.to(1, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'mo-z-shift-sum', (d) => s.play(pShiftSum.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'mo-z-result', (d) => s.play(pShiftZ.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'mo-z-partition-op-2', (d) => s.play(pB2.to(1, { duration: d })), { dur: 0.65 });
}
