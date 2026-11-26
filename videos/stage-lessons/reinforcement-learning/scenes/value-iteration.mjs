// Scene 5: value-iteration - "How many sweeps reach the desk?" (SIGNATURE 3D SCENE!)
// View 1: Orbiting 3D Value-Iteration Terrain (`buildValueTerrain3d`, `surface`, `orbitScene`)
//         sculpted live as synchronous Bellman sweeps lift Evidence (70), Review (80), and New (-4 -> 59),
//         paired with floating sweep status, luminous Q-bars, and MathJax contraction bound.
// View 2: Policy Iteration two-step cycle (Evaluate Review=54 -> Greedy improve Ask=59) over MDP constellation.
import {
  COSMOS,
  REWARD,
  ROLE,
  buildValueTerrain3d,
  cinemaAtmosphere,
  drawMdpConstellation,
  gamma,
  glowArcArrow,
  glowRing,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  playCue,
  returns,
  rule,
  swapVis,
  txt,
  valueIteration,
} from '../parts.mjs';

export default function valueIterationScene(s, c) {
  const sweeps = valueIteration(3);

  const title = heroTitle(['How many sweeps', 'reach the desk?'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.gold,
  });

  // 3D Terrain reactive state values
  const vNew = s.value(0);
  const vEvid = s.value(0);
  const vRev = s.value(0);
  const wave3d = s.value(0);

  const { view: terrain3d } = buildValueTerrain3d(vNew, vEvid, vRev, wave3d, { x: -350, y: 0 });

  // View 1 vs View 2 visibility
  const vVI = s.value(1);
  const vPI = s.value(0);

  // Value-iteration sweep & Q-bar stages
  const sweepNum = s.value(0); // 0, 1, 2, 3
  const showImm = s.value(0);
  const showSecFormula = s.value(0);
  const showUpdEvid = s.value(0);
  const showUpdRev = s.value(0);
  const showBest = s.value(0);
  const showContract = s.value(0);

  // Policy-iteration stages
  const piStage = s.value(0); // 0: review rule (?), 1: evaluated 54, 2: improved ask 59

  const eqContract = glowTex(
    '\\lVert TV - TW \\rVert_\\infty \\le \\gamma \\lVert V - W \\rVert_\\infty',
    {
      x: 495,
      y: 325,
      size: 32,
      color: ROLE.gold,
      glow: 7,
    },
  );

  // View 1 right-side dashboard & 3D terrain state tags (zero bullet boxes!)
  const viLayer = guardedDynamic(vVI, (alpha) => {
    const sn = Math.round(sweepNum.value);
    const nodes = [
      // State value readouts anchored cleanly beneath the 3D value terrain (zero overlap!)
      txt(`New: ${Math.round(vNew.value)}`, -675, 435, 28, ROLE.gold, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        `Evidence: ${Math.round(vEvid.value)}`,
        -365,
        435,
        28,
        ROLE.evidence,
        'mono',
        'center',
      ).opacity(alpha),
      txt(`Review: ${Math.round(vRev.value)}`, -55, 435, 28, ROLE.review, 'mono', 'center').opacity(
        alpha,
      ),
      rule(145, -280, 145, 420, COSMOS.rule, 1.8).opacity(0.6 * alpha),

      // Right side: Sweep header
      txt(`Synchronous Value Iteration`, 500, -345, 28, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
      txt(`Sweep ${sn}`, 500, -280, 48, ROLE.gold, 'serif', 'center')
        .glow(8, ROLE.gold)
        .opacity(alpha),
    ];

    // Three action backup rows for New request (luminous bars + formulas)
    const sec = showSecFormula.value > 0.5;
    const rows = [
      {
        y: -140,
        name: 'Approve',
        expr: `${REWARD.approve}`,
        val: showImm.value > 0.5 ? String(REWARD.approve) : '?',
        col: ROLE.approve,
        bar: showImm.value > 0.5 ? 110 : 0,
      },
      {
        y: -10,
        name: 'Ask proof',
        expr: sec ? `-4 + ${gamma} × 70` : '-4 + 0.9 × 0',
        val:
          showUpdEvid.value > 0.5
            ? String(returns.evidence)
            : sec
              ? '?'
              : showImm.value > 0.5
                ? String(REWARD.ask)
                : '?',
        col: ROLE.evidence,
        bar: showUpdEvid.value > 0.5 ? 215 : showImm.value > 0.5 && !sec ? 22 : 0,
        win: showBest.value > 0.5,
      },
      {
        y: 120,
        name: 'Review',
        expr: sec ? `-18 + ${gamma} × 80` : '-18 + 0.9 × 0',
        val:
          showUpdRev.value > 0.5
            ? String(returns.review)
            : sec
              ? '?'
              : showImm.value > 0.5
                ? String(REWARD.reviewCost)
                : '?',
        col: ROLE.review,
        bar: showUpdRev.value > 0.5 ? 195 : showImm.value > 0.5 && !sec ? 42 : 0,
      },
    ];

    rows.forEach((r) => {
      nodes.push(
        txt(r.name, 195, r.y - 16, 30, r.col, 'sans', 'left').opacity(alpha),
        txt(r.expr, 195, r.y + 24, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      );
      if (r.bar > 0) {
        nodes.push(
          lumBar(495 + r.bar / 2, r.y, r.bar, 32, {
            color: r.col,
            fillOpacity: r.win ? 0.5 : 0.3,
            strokeWidth: r.win ? 3.2 : 2,
            glow: r.win ? 12 : 6,
            opacity: alpha,
          }),
        );
      }
      nodes.push(
        txt(r.val, 765, r.y, 38, r.win ? ROLE.gold : r.col, 'mono', 'center')
          .glow(r.win ? 9 : 4, r.win ? ROLE.gold : r.col)
          .opacity(alpha),
      );
    });

    if (showContract.value > 0.5) {
      nodes.push(
        txt(
          'Unique V* · optimal actions can tie',
          500,
          405,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(showContract.value * alpha),
      );
    } else if (sn >= 3) {
      nodes.push(
        txt(
          'Fixed point reached: values stay identical',
          500,
          240,
          28,
          ROLE.evidence,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }

    return nodes;
  });

  // View 2: Policy Iteration (Evaluate fixed rule -> Greedy improve)
  const piLayer = guardedDynamic(vPI, (alpha) => {
    const st = piStage.value;
    const isImp = st >= 1.5;
    const isEval = st >= 0.5;
    const valNew = isImp ? String(returns.evidence) : isEval ? String(returns.review) : '?';

    const mdpG = drawMdpConstellation({
      cx: -350,
      cy: 65,
      rx: 325,
      ry: 215,
      nodeR: 62,
      values: { new: valNew, evidence: '70', review: '80', closed: '0' },
      activeNode: 'new',
      highlightNode: isImp ? 'evidence' : isEval ? 'review' : null,
      pulseEdge: isImp ? 'new->evidence' : isEval ? 'new->review' : null,
      pulseT: 0.55,
      alpha,
    });

    const nodes = [
      ...mdpG.nodes,
      rule(145, -260, 145, 420, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      txt('Policy Iteration', 500, -340, 42, ROLE.state, 'serif', 'center').opacity(alpha),
    ];

    // Circular Evaluate <-> Improve orbital loop (zero boxes!)
    const ex = 345;
    const ix = 665;
    const cy = -115;
    nodes.push(
      glowRing(ex, cy, 98, isEval && !isImp ? ROLE.review : COSMOS.dim, {
        width: isEval && !isImp ? 4.2 : 2.6,
        glow: isEval && !isImp ? 12 : 4,
      }).opacity(alpha),
      txt(
        '1. Eval',
        ex,
        cy - 16,
        28,
        isEval && !isImp ? ROLE.review : COSMOS.ink,
        'sans',
        'center',
      ).opacity(alpha),
      txt('fixed', ex, cy + 24, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),

      glowRing(ix, cy, 98, isImp ? ROLE.evidence : COSMOS.dim, {
        width: isImp ? 4.2 : 2.6,
        glow: isImp ? 12 : 4,
      }).opacity(alpha),
      txt('2. Max', ix, cy - 16, 28, isImp ? ROLE.evidence : COSMOS.ink, 'sans', 'center').opacity(
        alpha,
      ),
      txt('greedy', ix, cy + 24, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),

      glowArcArrow([ex + 96, cy - 38], [ix - 96, cy - 38], -45, {
        color: isImp ? ROLE.evidence : COSMOS.muted,
        width: 3,
        glow: isImp ? 10 : 4,
        opacity: alpha,
      }),
      glowArcArrow([ix - 96, cy + 38], [ex + 96, cy + 38], 45, {
        color: ROLE.review,
        width: 3,
        glow: 6,
        opacity: alpha,
      }),
    );

    // Current policy readout below the cycle
    const polCol = isImp ? ROLE.evidence : ROLE.review;
    const polText = isImp ? 'New → Ask for proof' : 'New → Human review';
    const valText = isImp
      ? `V(New) = ${returns.evidence}  (switch!)`
      : isEval
        ? `V(New) = ${returns.review}`
        : 'V(New) = ?';

    nodes.push(
      txt(polText, 500, 120, 38, polCol, 'serif', 'center').glow(8, polCol).opacity(alpha),
      txt(valText, 500, 195, 36, isImp ? ROLE.gold : polCol, 'mono', 'center')
        .glow(7, isImp ? ROLE.gold : polCol)
        .opacity(alpha),
      txt('Approve verified · finish queued', 500, 290, 26, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.state), title, terrain3d, viLayer, piLayer);

  // Orbit the 3D terrain smoothly until policy-iteration hides it
  const piCue = c.cue('policy-iteration');
  const orbitDur = Math.max(1.0, piCue.start - c.start - 0.5);
  c.at(0.1, () => {
    s.play(terrain3d.orbit({ theta: -0.22, phi: 0.96 }, { duration: orbitDur }));
  });

  playCue(s, c, 'zero', (d) => s.play(vNew.to(0, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'first', (d) => s.play(sweepNum.to(1, { duration: d })), { dur: 0.3 });
  playCue(
    s,
    c,
    'immediate',
    (d) => s.play(showImm.to(1, { duration: d }), vNew.to(sweeps[0].new_request, { duration: d })),
    { after: true, dur: 0.45 },
  );
  playCue(
    s,
    c,
    'successors',
    (d) =>
      s.play(
        vEvid.to(sweeps[0].evidence_ready, { duration: d }),
        vRev.to(sweeps[0].review_queue, { duration: d }),
      ),
    { after: true, dur: 0.7 },
  );
  playCue(
    s,
    c,
    'second',
    (d) => s.play(sweepNum.to(2, { duration: d }), showSecFormula.to(1, { duration: d })),
    { dur: 0.35 },
  );
  playCue(s, c, 'backward', (d) => s.play(wave3d.to(1, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'updated', (d) => s.play(showUpdEvid.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'review-result', (d) => s.play(showUpdRev.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(
    s,
    c,
    'best',
    (d) => s.play(showBest.to(1, { duration: d }), vNew.to(sweeps[1].new_request, { duration: d })),
    { after: true, dur: 0.65 },
  );
  playCue(s, c, 'stable', (d) => s.play(sweepNum.to(3, { duration: d })), { dur: 0.3 });
  c.show('converges', eqContract);
  playCue(s, c, 'contract', (d) => s.play(showContract.to(1, { duration: d })), { dur: 0.4 });

  // Switch cleanly to Policy Iteration view
  c.hide('policy-iteration', [terrain3d, eqContract]);
  playCue(s, c, 'policy-iteration', (d) => s.play(swapVis(vVI, vPI, d)), { dur: 0.65 });
  playCue(s, c, 'evaluate', (d) => s.play(piStage.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'improve', (d) => s.play(piStage.to(2, { duration: d })), {
    after: true,
    dur: 0.5,
  });
}
