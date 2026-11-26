// Scene 12: off-policy-evaluation - "What can the routing log support?"
// View 1: Simulator scorecard (2 new -> Review 54 + 2 verified -> Approve 70 => mean 62).
// View 2: Logged trajectory (New -> Verified -> Closed) + paired importance-ratio gauges
//         (0.8/0.5 = 1.6, 0.6/0.5 = 1.2) with strict prediction withholding before 1.92!
// View 3: 50,000 Review vs 0 Ask support contrast, shortage vs zero support, and confounding fork.
import {
  COSMOS,
  REWARD,
  ROLE,
  cinemaAtmosphere,
  glowArcArrow,
  glowDot,
  glowRing,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  returns,
  rule,
  swapVis,
  txt,
} from '../parts.mjs';

export default function offPolicyEvaluation(s, c) {
  const title = heroTitle(['What can the routing', 'log support?'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.state,
  });

  const v1 = s.value(1); // Simulator scorecard
  const v2 = s.value(0); // Importance sampling trajectory
  const v3 = s.value(0); // 50,000 log support & confounding

  // View 1 state
  const showStarts = s.value(0);
  const showKnown = s.value(0);
  const showOracle = s.value(0);

  // View 2 state
  const step1T = s.value(0);
  const step2T = s.value(0);
  const s1Log = s.value(0);
  const s1New = s.value(0);
  const s1Rat = s.value(0);
  const s2Log = s.value(0);
  const s2New = s.value(0);
  const s2Rat = s.value(0);
  const showPredW = s.value(0);
  const showProd = s.value(0);
  const showPrefix = s.value(0);

  // View 3 state
  const showSupport = s.value(0);
  const showShort = s.value(0);
  const showEmpty = s.value(0);
  const showConfound = s.value(0);

  const eqIS = glowTex(
    '\\rho_{0:T} = \\prod_{t} \\frac{\\pi(a_t \\mid s_t)}{\\mu(a_t \\mid s_t)}',
    {
      x: 525,
      y: -380,
      size: 34,
      color: ROLE.gold,
      glow: 6,
    },
  );

  // VIEW 1: Simulator Scorecard (4 constructed starts -> mean 62)
  const layer1 = guardedDynamic(v1, (alpha) => {
    const opL = (0.28 + 0.72 * showStarts.value) * alpha;
    const opR = (0.28 + 0.72 * showKnown.value) * alpha;
    const nodes = [
      txt(
        'Simulator evaluation: 4 constructed starting tickets',
        0,
        -245,
        32,
        COSMOS.ink,
        'serif',
        'center',
      ).opacity(alpha),

      // Left cluster: 2 new tickets -> Review (54) (visible dim placeholder from t=0 to fill space!)
      glowRing(-445, -35, 98, ROLE.review, {
        width: showStarts.value > 0.5 ? 4 : 2.4,
        glow: showStarts.value > 0.5 ? 11 : 4,
        dash: showStarts.value > 0.5 ? undefined : [8, 6],
      }).opacity(opL),
      txt('2 New', -445, -52, 32, ROLE.review, 'serif', 'center').opacity(opL),
      txt(
        showStarts.value > 0.5 ? '54 pts' : '?',
        -445,
        -2,
        32,
        ROLE.review,
        'mono',
        'center',
      ).opacity(opL),
      txt(
        showStarts.value > 0.5 ? 'Review · 2 × 54 = 108' : 'New-ticket pair',
        -445,
        106,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(opL),

      // Right cluster: 2 verified tickets -> Approve (70)
      glowRing(445, -35, 98, ROLE.evidence, {
        width: showKnown.value > 0.5 ? 4 : 2.4,
        glow: showKnown.value > 0.5 ? 11 : 4,
        dash: showKnown.value > 0.5 ? undefined : [8, 6],
      }).opacity(opR),
      txt('2 Verified', 445, -52, 30, ROLE.evidence, 'serif', 'center').opacity(opR),
      txt(
        showKnown.value > 0.5 ? '70 pts' : '?',
        445,
        -2,
        32,
        ROLE.evidence,
        'mono',
        'center',
      ).opacity(opR),
      txt(
        showKnown.value > 0.5 ? 'Approve · 2 × 70 = 140' : 'Verified-ticket pair',
        445,
        106,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(opR),

      // Converging arrows stopping well above the y=288 mean readout (zero crowding!)
      glowArcArrow([-415, 145], [-270, 210], 8, {
        color: ROLE.review,
        width: 3.2,
        glow: 8,
        opacity: (0.25 + 0.75 * showOracle.value) * alpha,
      }),
      glowArcArrow([415, 145], [270, 210], 8, {
        color: ROLE.evidence,
        width: 3.2,
        glow: 8,
        opacity: (0.25 + 0.75 * showOracle.value) * alpha,
      }),
    ];

    if (showOracle.value > 0.5) {
      const op = showOracle.value * alpha;
      nodes.push(
        txt('(2 × 54 + 2 × 70) / 4 = 62', 0, 290, 44, ROLE.gold, 'mono', 'center')
          .glow(9, ROLE.gold)
          .opacity(op),
        txt(
          'Traffic estimates still require the true starting distribution.',
          0,
          375,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(op),
      );
    } else {
      nodes.push(
        txt('Constructed mixture mean = ?', 0, 290, 34, COSMOS.dim, 'mono', 'center').opacity(
          alpha,
        ),
      );
    }

    return nodes;
  });

  // VIEW 2: Logged Trajectory & Importance Sampling Ratios
  const layer2 = guardedDynamic(v2, (alpha) => {
    const pNew = [-615, -155];
    const pVer = [0, -155];
    const pCls = [615, -155];
    const nodes = [
      // 3-node horizontal logged trajectory
      glowArcArrow([pNew[0] + 74, pNew[1]], [pVer[0] - 78, pVer[1]], -45, {
        color: ROLE.evidence,
        width: 3.8,
        glow: 9,
        opacity: alpha,
        photonT: step1T.value > 0.02 && step1T.value < 0.99 ? step1T.value : null,
      }),
      glowArcArrow([pVer[0] + 78, pVer[1]], [pCls[0] - 74, pCls[1]], -45, {
        color: ROLE.state,
        width: 3.8,
        glow: 9,
        opacity: alpha,
        photonT: step2T.value > 0.02 && step2T.value < 0.99 ? step2T.value : null,
      }),
      txt('Ask for proof', -308, -225, 28, ROLE.evidence, 'sans', 'center').opacity(alpha),
      txt('Approve with proof', 308, -225, 28, ROLE.state, 'sans', 'center').opacity(alpha),

      glowRing(pNew[0], pNew[1], 68, ROLE.state, { width: 3.4, glow: 9 }).opacity(alpha),
      txt('New', pNew[0], pNew[1], 30, ROLE.state, 'sans', 'center').opacity(alpha),

      glowRing(pVer[0], pVer[1], 72, step1T.value > 0.5 ? ROLE.evidence : COSMOS.dim, {
        width: step1T.value > 0.5 ? 4 : 2.8,
        glow: step1T.value > 0.5 ? 12 : 4,
      }).opacity(alpha),
      txt(
        'Verified',
        pVer[0],
        pVer[1],
        30,
        step1T.value > 0.5 ? ROLE.evidence : COSMOS.ink,
        'sans',
        'center',
      ).opacity(alpha),

      glowRing(pCls[0], pCls[1], 68, step2T.value > 0.5 ? ROLE.gold : COSMOS.dim, {
        width: step2T.value > 0.5 ? 4 : 2.8,
        glow: step2T.value > 0.5 ? 12 : 4,
      }).opacity(alpha),
      txt(
        'Closed',
        pCls[0],
        pCls[1],
        30,
        step2T.value > 0.5 ? ROLE.gold : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),

      rule(-840, -35, 840, -35, COSMOS.rule, 1.6).opacity(0.6 * alpha),
    ];

    // Step 1 and Step 2 ratio gauges side-by-side (zero boxes!)
    const steps = [
      {
        cx: -410,
        title: 'Step 1: Ask for proof',
        logP: 0.5,
        newP: 0.8,
        ratio: 1.6,
        vLog: s1Log.value,
        vNew: s1New.value,
        vRat: s1Rat.value,
        col: ROLE.evidence,
      },
      {
        cx: 410,
        title: 'Step 2: Approve with proof',
        logP: 0.5,
        newP: 0.6,
        ratio: 1.2,
        vLog: s2Log.value,
        vNew: s2New.value,
        vRat: s2Rat.value,
        col: ROLE.state,
      },
    ];

    steps.forEach((st) => {
      nodes.push(txt(st.title, st.cx, 18, 30, st.col, 'serif', 'center').opacity(alpha));
      // Logger probability bar
      nodes.push(txt('Logger μ', st.cx - 245, 84, 26, COSMOS.muted, 'mono', 'left').opacity(alpha));
      if (st.vLog > 0.05) {
        const w = st.logP * 240 * st.vLog;
        nodes.push(
          lumBar(st.cx - 65 + w / 2, 84, w, 28, {
            color: COSMOS.muted,
            fillOpacity: 0.35,
            opacity: st.vLog * alpha,
          }),
          txt(String(st.logP), st.cx - 65 + w + 46, 84, 28, COSMOS.ink, 'mono', 'center').opacity(
            st.vLog * alpha,
          ),
        );
      }
      // New policy probability bar
      nodes.push(txt('Target π', st.cx - 245, 146, 26, st.col, 'mono', 'left').opacity(alpha));
      if (st.vNew > 0.05) {
        const w = st.newP * 240 * st.vNew;
        nodes.push(
          lumBar(st.cx - 65 + w / 2, 146, w, 28, {
            color: st.col,
            fillOpacity: 0.42,
            glow: 8,
            opacity: st.vNew * alpha,
          }),
          txt(String(st.newP), st.cx - 65 + w + 46, 146, 28, st.col, 'mono', 'center').opacity(
            st.vNew * alpha,
          ),
        );
      }
      // Ratio readout
      if (st.vRat > 0.05) {
        nodes.push(
          txt(
            `Ratio = ${st.newP} / ${st.logP} = ${st.ratio}`,
            st.cx,
            218,
            32,
            ROLE.gold,
            'mono',
            'center',
          )
            .glow(7, ROLE.gold)
            .opacity(st.vRat * alpha),
        );
      }
    });

    // Bottom prediction / product / per-reward weighting (strictly withholds 1.92 until 'product'!)
    if (showPrefix.value > 0.5) {
      nodes.push(
        txt(
          'Step-1 reward × 1.6    ·    Full-path reward × 1.92',
          0,
          355,
          34,
          ROLE.gold,
          'mono',
          'center',
        )
          .glow(8, ROLE.gold)
          .opacity(showPrefix.value * alpha),
      );
    } else if (showProd.value > 0.5) {
      nodes.push(
        txt('Trajectory weight = 1.6 × 1.2 = 1.92', 0, 355, 42, ROLE.gold, 'mono', 'center')
          .glow(10, ROLE.gold)
          .opacity(showProd.value * alpha),
      );
    } else if (showPredW.value > 0.5) {
      nodes.push(
        txt(
          '1.6  and  1.2  →  How many times as likely is the whole path?',
          0,
          355,
          34,
          ROLE.gold,
          'serif',
          'center',
        )
          .glow(8, ROLE.gold)
          .opacity(showPredW.value * alpha),
      );
    } else {
      nodes.push(
        txt(
          'REQ-10234 · One logged trajectory',
          0,
          355,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  // VIEW 3: 50,000 Review vs 0 Ask (Support vs Shortage vs Confounding)
  const layer3 = guardedDynamic(v3, (alpha) => {
    const nodes = [
      txt(
        'Historical log: 50,000 routing decisions',
        0,
        -285,
        34,
        COSMOS.ink,
        'serif',
        'center',
      ).opacity(alpha),

      // Top visual comparison: massive Review bar vs empty Ask slot
      txt('Sent to review', -615, -170, 30, ROLE.review, 'sans', 'left').opacity(alpha),
      lumBar(60, -170, 740, 46, {
        color: ROLE.review,
        fillOpacity: 0.44,
        glow: 10,
        opacity: alpha,
      }),
      txt('50,000', 540, -170, 42, ROLE.review, 'mono', 'center')
        .glow(7, ROLE.review)
        .opacity(alpha),

      txt('Asked for proof', -615, -85, 30, ROLE.evidence, 'sans', 'left').opacity(alpha),
      lumBar(-305, -85, 10, 46, { color: ROLE.approve, fillOpacity: 0.4, glow: 8, opacity: alpha }),
      txt('0 observed', -180, -85, 34, ROLE.approve, 'mono', 'left')
        .glow(6, ROLE.approve)
        .opacity(alpha),

      rule(-840, -12, 840, -12, COSMOS.rule, 1.6).opacity(0.6 * alpha),
    ];

    // Two support regimes cleanly side-by-side (visible dim at View 3 entry to prevent empty lower canvas!)
    const opSup = (0.32 + 0.68 * showSupport.value) * alpha;
    const opSh = (0.28 + 0.72 * showShort.value) * alpha;
    nodes.push(
      glowRing(-445, 115, 62, ROLE.approve, {
        width: 3.4,
        glow: showSupport.value > 0.5 ? 10 : 4,
      }).opacity(opSup),
      txt('P = 0', -445, 115, 28, ROLE.approve, 'mono', 'center').opacity(opSup),
      txt('Prohibited by logger', -445, 210, 32, ROLE.approve, 'serif', 'center').opacity(opSup),
      txt(
        'No support: IS cannot evaluate asking',
        -445,
        260,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(opSup),

      glowRing(445, 115, 62, ROLE.amber, {
        width: 3.4,
        glow: showShort.value > 0.5 ? 10 : 4,
        dash: [8, 6],
      }).opacity(opSh),
      txt('P > 0', 445, 115, 28, ROLE.amber, 'mono', 'center').opacity(opSh),
      txt('Rarely allowed (0 observed)', 445, 210, 32, ROLE.amber, 'serif', 'center').opacity(opSh),
      txt(
        showEmpty.value > 0.5
          ? 'Zero samples: need new data or a model'
          : 'Support in principle only',
        445,
        260,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(opSh),
    );

    // Confounding fork at bottom
    if (showConfound.value > 0.05) {
      const op = showConfound.value * alpha;
      nodes.push(
        txt('Unrecorded confounding:', -460, 385, 30, ROLE.gold, 'serif', 'center')
          .glow(7, ROLE.gold)
          .opacity(op),
        glowDot(-220, 385, { radius: 8, color: ROLE.gold, glow: 12, opacity: op }),
        txt(
          'Private warning  →  both routing choice & eventual outcome',
          250,
          385,
          30,
          ROLE.gold,
          'sans',
          'center',
        )
          .glow(6, ROLE.gold)
          .opacity(op),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.state, ROLE.amber), title, layer1, layer2, layer3);

  playCue(s, c, 'starts', (d) => s.play(showStarts.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'known', (d) => s.play(showKnown.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'oracle', (d) => s.play(showOracle.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });

  // Switch to View 2 (Importance Sampling)
  c.show('logs', eqIS);
  playCue(s, c, 'logs', (d) => s.play(swapVis(v1, v2, d)), { dur: 0.65 });
  playCue(s, c, 'logged-ask', (d) => s.play(step1T.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'path', (d) => s.play(step2T.to(1, { duration: d })), { after: true, dur: 0.6 });
  playCue(s, c, 'behavior', (d) => s.play(s1Log.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'target', (d) => s.play(s1New.to(1, { duration: d })), { after: true, dur: 0.35 });
  playCue(s, c, 'first-ratio', (d) => s.play(s1Rat.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'behavior-next', (d) => s.play(s2Log.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'target-next', (d) => s.play(s2New.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'second-ratio', (d) => s.play(s2Rat.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'predict-weight', (d) => s.play(showPredW.to(1, { duration: d })), { dur: 0.35 });

  // Strict prediction reveal AFTER 'product'
  playCue(s, c, 'product', (d) => s.play(showProd.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'prefix', (d) => s.play(showPrefix.to(1, { duration: d })), { dur: 0.4 });

  // Switch to View 3 (50,000 log support & confounding)
  c.hide('other-log', eqIS);
  playCue(s, c, 'other-log', (d) => s.play(swapVis(v2, v3, d)), { dur: 0.65 });
  playCue(s, c, 'support', (d) => s.play(showSupport.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'shortage', (d) => s.play(showShort.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'empty-log', (d) => s.play(showEmpty.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'confounding', (d) => s.play(showConfound.to(1, { duration: d })), { dur: 0.45 });
}
