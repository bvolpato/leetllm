// Act 3: Forward Computation Graph, Reverse-Mode Chain Rule Photon Cascade,
// ReLU Gate, ReLU Corner, and Shared-Weight Path Accumulation.
import { Node, arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  batchGradientState,
  cinemaGrid,
  compNode,
  cueTo,
  fadeIn,
  fadeOut,
  fmt,
  glassPlate,
  glowTex,
  guardedDynamic,
  livingDrift,
  makePlot2d,
  photonWire,
  polyPath,
  pulseCue,
  reluBranchState,
  reluCornerDifference,
  txt,
} from '../shared.mjs';

// Shared geometry for the two-branch linear computation graph (scenes 11 & 12)
const LIN_NODES = {
  wp: { x: -720, y: -255, label: 'w_p', val: '2', col: COSMOS.blue },
  xp: { x: -720, y: -55, label: 'x_p', val: '2', col: COSMOS.cyan },
  wq: { x: -720, y: 120, label: 'w_q', val: '2', col: COSMOS.blue },
  xq: { x: -720, y: 310, label: 'x_q', val: '1', col: COSMOS.cyan },
  prodP: { x: -340, y: -155, label: 'prompt ×', val: '4', col: COSMOS.blue },
  prodQ: { x: -340, y: 215, label: 'queue ×', val: '2', col: COSMOS.cyan },
  pred: { x: 25, y: 25, label: 'pred ŷ', val: '6', col: COSMOS.emerald },
  target: { x: 25, y: 265, label: 'target y', val: '5', col: COSMOS.gold },
  err: { x: 390, y: 25, label: 'error e', val: '1', col: COSMOS.gold },
  loss: { x: 740, y: 25, label: 'loss e²', val: '1', col: COSMOS.rose },
};

// ---------------------------------------------------------------------------
// 11. forward-graph: Break the calculation into small jobs
// Cues: graph-node-6-b1-1, graph-node-4-b2-1, graph-queue-cue, graph-node-6-b2-2,
//       graph-target-cue, graph-error-cue, graph-node-8-b2-3, graph-node-4-b3-1
// ---------------------------------------------------------------------------
export function forwardGraph(s, c) {
  const stage = s.value(0); // 0=skeleton, 1=prodP, 2=prodQ, 3=pred, 4=target, 5=err, 6=loss
  const saveHighlight = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 83 }));
  s.add(aura(-420, 0, 480, '#2a588a24', '#151e3d12'));
  s.add(aura(460, 20, 460, '#ff6b8b1e', '#18142a10'));

  const edges = [
    { from: LIN_NODES.wp, to: LIN_NODES.prodP, min: 0.8, col: COSMOS.blue },
    { from: LIN_NODES.xp, to: LIN_NODES.prodP, min: 0.8, col: COSMOS.cyan },
    { from: LIN_NODES.wq, to: LIN_NODES.prodQ, min: 1.8, col: COSMOS.blue },
    { from: LIN_NODES.xq, to: LIN_NODES.prodQ, min: 1.8, col: COSMOS.cyan },
    { from: LIN_NODES.prodP, to: LIN_NODES.pred, min: 2.8, col: COSMOS.emerald },
    { from: LIN_NODES.prodQ, to: LIN_NODES.pred, min: 2.8, col: COSMOS.emerald },
    { from: LIN_NODES.pred, to: LIN_NODES.err, min: 4.8, col: COSMOS.gold },
    { from: LIN_NODES.target, to: LIN_NODES.err, min: 4.8, col: COSMOS.gold },
    { from: LIN_NODES.err, to: LIN_NODES.loss, min: 5.8, col: COSMOS.rose },
  ];

  const liveScene = dynamic(() => {
    const st = stage.value;
    const sv = saveHighlight.value;
    const dr = drift.value;
    const nodes = [
      txt('FORWARD COMPUTATION GRAPH', -820, -430, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        sv > 0.3
          ? 'Saved for backward: error e = 1, features x_p = 2, x_q = 1'
          : 'Compute left-to-right in dependency order',
        -820,
        -384,
        30,
        sv > 0.3 ? COSMOS.gold : COSMOS.ink,
        'serif',
        'left',
      ).glow(sv > 0.3 ? 8 : 0, COSMOS.gold),
    ];

    for (const e of edges) {
      const dx = e.to.x - e.from.x;
      const dy = e.to.y - e.from.y;
      const len = Math.hypot(dx, dy);
      const x1 = e.from.x + (dx / len) * 56;
      const y1 = e.from.y + (dy / len) * 56;
      const x2 = e.to.x - (dx / len) * 56;
      const y2 = e.to.y - (dy / len) * 56;
      if (st >= e.min) {
        nodes.push(
          photonWire(
            [
              [x1, y1],
              [x2, y2],
            ],
            dr * 2.4 + e.min * 0.17,
            { color: e.col, width: 3.4, glow: 8 },
          ),
        );
      } else {
        nodes.push(line([x1, y1], [x2, y2], { stroke: '#2c3d66', width: 2.2 }));
      }
    }

    const activeMap = {
      wp: true,
      xp: true,
      wq: true,
      xq: true,
      prodP: st >= 0.8,
      prodQ: st >= 1.8,
      pred: st >= 2.8,
      target: st >= 3.8,
      err: st >= 4.8,
      loss: st >= 5.8,
    };

    for (const [key, n] of Object.entries(LIN_NODES)) {
      const isSaved = sv > 0.3 && (key === 'err' || key === 'xp' || key === 'xq');
      const isReady = activeMap[key];
      nodes.push(
        compNode(n.x, n.y, {
          radius: 44,
          label: n.label,
          value: isReady ? n.val : '?',
          color: isSaved ? COSMOS.gold : n.col,
          active: isReady,
          glow: isSaved ? 16 : 9,
          labelYOffset: -84,
          valueSize: 30,
        }),
      );
      if (isSaved) {
        nodes.push(
          circle(54, { fill: null, stroke: COSMOS.gold, width: 2.6, dash: [6, 5] })
            .at(n.x, n.y)
            .glow(10, COSMOS.gold),
        );
      }
    }

    nodes.push(
      txt(
        'Forward receipts supply every local slope on the return trip',
        0,
        402,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(liveScene);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'graph-node-6-b1-1', stage, 0.3, { dur: 0.35 });
  cueTo(s, c, 'graph-node-4-b2-1', stage, 1.2, { dur: 0.35 });
  cueTo(s, c, 'graph-queue-cue', stage, 2.2, { dur: 0.35 });
  cueTo(s, c, 'graph-node-6-b2-2', stage, 3.2, { dur: 0.35 });
  cueTo(s, c, 'graph-target-cue', stage, 4.2, { dur: 0.35 });
  cueTo(s, c, 'graph-error-cue', stage, 5.2, { dur: 0.35 });
  cueTo(s, c, 'graph-node-8-b2-3', stage, 6.2, { dur: 0.35 });
  cueTo(s, c, 'graph-node-4-b3-1', saveHighlight, 1, { dur: 0.55 });
}

// ---------------------------------------------------------------------------
// 12. chain-rule: Pass the sensitivity backward (SIGNATURE BACKPROP CASCADE!)
// Cues: graph-node-8-b1-1, graph-node-7-b1-2, backward-subtraction,
//       graph-node-6-b2-1, graph-node-1-b2-2, queue-backward,
//       graph-node-0-b3-1, replay-loss, replay-square, replay-subtraction,
//       replay-feature, replay-result
// ---------------------------------------------------------------------------
export function chainRule(s, c) {
  const backStep = s.value(0); // 1=loss(1), 2=err(2), 3=pred(2), 4=branches(2,2), 5=wp(4), 6=wq(2)
  const replayStep = s.value(0); // 1..5 lights up exact chain product 1 * 2 * 1 * 2 = 4
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.rose, opacity: 0.44, seed: 89 }));
  s.add(aura(480, 20, 480, '#ff6b8b28', '#1c102612'));
  s.add(aura(-480, -80, 480, '#ffd16622', '#1c182410'));

  const chainEq = glowTex(
    String.raw`\frac{\partial L}{\partial w_p} = 1 \times \underbrace{2}_{\text{square}} \times \underbrace{1}_{\text{sub}} \times \underbrace{2}_{x_p} = 4`,
    { x: 140, y: 375, size: 38, color: COSMOS.gold, glow: 9 },
  );

  const liveScene = dynamic(() => {
    const bs = backStep.value;
    const rs = replayStep.value;
    const dr = drift.value;

    const nodes = [
      txt('REVERSE-MODE BACKPROPAGATION', -820, -430, 26, COSMOS.rose, 'mono', 'left'),
      txt(
        rs > 0.5
          ? 'Chain rule multiplies local slopes along the prompt route'
          : 'Send sensitivity right-to-left, multiplying by each local slope',
        -820,
        -384,
        30,
        COSMOS.ink,
        'serif',
        'left',
      ),
    ];

    // Dim forward graph rails
    const rails = [
      [LIN_NODES.wp, LIN_NODES.prodP],
      [LIN_NODES.xp, LIN_NODES.prodP],
      [LIN_NODES.wq, LIN_NODES.prodQ],
      [LIN_NODES.xq, LIN_NODES.prodQ],
      [LIN_NODES.prodP, LIN_NODES.pred],
      [LIN_NODES.prodQ, LIN_NODES.pred],
      [LIN_NODES.pred, LIN_NODES.err],
      [LIN_NODES.err, LIN_NODES.loss],
    ];
    for (const [a, b] of rails) {
      nodes.push(line([a.x, a.y], [b.x, b.y], { stroke: '#2c3d66', width: 2.2 }));
    }

    // Reverse glowing photon cascade edges
    const revEdges = [
      { from: LIN_NODES.loss, to: LIN_NODES.err, min: 1.8, factor: '× 2e = ×2', replay: 2 },
      { from: LIN_NODES.err, to: LIN_NODES.pred, min: 2.8, factor: '× 1', replay: 3 },
      { from: LIN_NODES.pred, to: LIN_NODES.prodP, min: 3.8, factor: '× 1', replay: 3.5 },
      { from: LIN_NODES.pred, to: LIN_NODES.prodQ, min: 3.8, factor: '× 1', replay: 0 },
      { from: LIN_NODES.prodP, to: LIN_NODES.wp, min: 4.8, factor: '× x_p (=2)', replay: 4 },
      { from: LIN_NODES.prodQ, to: LIN_NODES.wq, min: 5.8, factor: '× x_q (=1)', replay: 0 },
    ];

    for (const re of revEdges) {
      if (bs >= re.min) {
        const isReplayLit = rs > 0.5 && re.replay > 0 && rs >= re.replay;
        const col = isReplayLit ? COSMOS.gold : COSMOS.rose;
        const dx = re.to.x - re.from.x;
        const dy = re.to.y - re.from.y;
        const len = Math.hypot(dx, dy);
        const x1 = re.from.x + (dx / len) * 56;
        const y1 = re.from.y + (dy / len) * 56;
        const x2 = re.to.x - (dx / len) * 56;
        const y2 = re.to.y - (dy / len) * 56;
        nodes.push(
          photonWire(
            [
              [x1, y1],
              [x2, y2],
            ],
            dr * 2.8 + re.min * 0.19,
            { color: col, width: isReplayLit ? 5.2 : 3.8, glow: isReplayLit ? 14 : 10 },
          ),
          txt(re.factor, (x1 + x2) / 2, (y1 + y2) / 2 - 44, 26, col, 'mono').glow(
            isReplayLit ? 8 : 4,
            col,
          ),
        );
      }
    }

    // Nodes + returning adjoint badges underneath
    const adjointMap = {
      loss: bs >= 0.8 ? 'dL = 1' : '',
      err: bs >= 1.8 ? '∂e = 2' : '',
      pred: bs >= 2.8 ? '∂ŷ = 2' : '',
      prodP: bs >= 3.8 ? '∂ = 2' : '',
      prodQ: bs >= 3.8 ? '∂ = 2' : '',
      wp: bs >= 4.8 ? '∂L/∂w_p = 4' : '',
      wq: bs >= 5.8 ? '∂L/∂w_q = 2' : '',
    };

    for (const [key, n] of Object.entries(LIN_NODES)) {
      if (key === 'target') continue;
      const adj = adjointMap[key] ?? '';
      const isResultLit =
        (key === 'wp' && rs >= 4.8) ||
        (key === 'loss' && rs >= 0.8 && rs < 2) ||
        (key === 'err' && rs >= 1.8 && rs < 3);
      nodes.push(
        compNode(n.x, n.y, {
          radius: 42,
          label: n.label,
          value: n.val,
          sub: adj,
          color: isResultLit ? COSMOS.gold : adj ? COSMOS.rose : n.col,
          active: true,
          glow: isResultLit ? 16 : 9,
          labelYOffset: -72,
          subYOffset: 72,
          valueSize: 28,
        }),
      );
    }

    return group(...nodes);
  });

  s.add(liveScene);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'graph-node-8-b1-1', backStep, 1.0, { dur: 0.35 });
  cueTo(s, c, 'graph-node-7-b1-2', backStep, 2.0, { dur: 0.45 });
  cueTo(s, c, 'backward-subtraction', backStep, 3.0, { dur: 0.45 });

  cueTo(s, c, 'graph-node-6-b2-1', backStep, 4.0, { dur: 0.45 });
  cueTo(s, c, 'graph-node-1-b2-2', backStep, 5.0, { dur: 0.45 });
  cueTo(s, c, 'queue-backward', backStep, 6.0, { dur: 0.45 });

  cueTo(s, c, 'replay-loss', replayStep, 1.0, { dur: 0.25 });
  cueTo(s, c, 'replay-square', replayStep, 2.0, { dur: 0.25 });
  cueTo(s, c, 'replay-subtraction', replayStep, 3.0, { dur: 0.25 });
  cueTo(s, c, 'replay-feature', replayStep, 4.0, { dur: 0.25 });
  cueTo(s, c, 'graph-node-0-b3-1', replayStep, 4.5, { dur: 0.25 });
  cueTo(s, c, 'replay-result', replayStep, 5.0, { dur: 0.35 });
  c.show('replay-result', chainEq);
}

// ---------------------------------------------------------------------------
// 13. relu-gate: A forward sign controls the returning derivative
// Cues: relu-gate-b1, relu-gate-b2, relu-gate-b3, relu-negative-state
// ---------------------------------------------------------------------------
export function reluGate(s, c) {
  const showBack = s.value(0);
  const negMode = s.value(0); // 0 => w_p = 2 (open), 1 => w_p = -0.5 (blocked)
  const introPulse = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.emerald, opacity: 0.44, seed: 97 }));
  s.add(aura(0, -40, 520, '#6ee7b71c', '#15243010'));

  const liveScene = dynamic(() => {
    const isNeg = negMode.value > 0.5;
    const sb = showBack.value;
    const dr = drift.value;
    const st = reluBranchState(isNeg ? -0.5 : 2.0);
    const gateCol = st.gate ? COSMOS.emerald : COSMOS.rose;

    // Top branch (prompt with ReLU gate): w_p -> h -> ReLU -> z -> sum -> loss
    const wpPos = { x: -730, y: -155 };
    const hPos = { x: -410, y: -155 };
    const zPos = { x: -70, y: -155 };
    const sumPos = { x: 290, y: 10 };
    const lossPos = { x: 670, y: 10 };
    const wqPos = { x: -410, y: 175 };

    const nodes = [
      txt('RELU GATE IN THE PROMPT BRANCH', -820, -400, 26, gateCol, 'mono', 'left'),
      txt(
        isNeg
          ? 'w_p = −0.5  →  h = −1 < 0  →  Gate CLOSED (derivative 0)'
          : 'w_p = +2.0  →  h = +4 > 0  →  Gate OPEN (derivative 1)',
        -820,
        -344,
        34,
        gateCol,
        'serif',
        'left',
      ).glow(8, gateCol),
      // Forward wires
      photonWire(
        [
          [wpPos.x + 56, wpPos.y],
          [hPos.x - 56, hPos.y],
        ],
        dr * 2.4,
        { color: COSMOS.blue, width: 3.4 },
      ),
      photonWire(
        [
          [hPos.x + 56, hPos.y],
          [zPos.x - 56, zPos.y],
        ],
        dr * 2.4 + 0.25,
        { color: gateCol, width: 3.8 },
      ),
      photonWire(
        [
          [zPos.x + 56, zPos.y],
          [sumPos.x - 56, sumPos.y - 16],
        ],
        dr * 2.4 + 0.5,
        { color: gateCol, width: 3.4 },
      ),
      photonWire(
        [
          [wqPos.x + 56, wqPos.y],
          [sumPos.x - 56, sumPos.y + 18],
        ],
        dr * 2.4 + 0.35,
        { color: COSMOS.cyan, width: 3.4 },
      ),
      photonWire(
        [
          [sumPos.x + 56, sumPos.y],
          [lossPos.x - 56, lossPos.y],
        ],
        dr * 2.4 + 0.75,
        { color: COSMOS.gold, width: 3.8 },
      ),
      // Nodes
      compNode(wpPos.x, wpPos.y, {
        radius: 50,
        label: 'w_p (×2)',
        value: fmt(st.weight, 1),
        color: COSMOS.blue,
        labelYOffset: -76,
      }),
      compNode(hPos.x, hPos.y, {
        radius: 50,
        label: 'h = 2w_p',
        value: fmt(st.h, 1),
        color: COSMOS.cyan,
        labelYOffset: -76,
      }),
      compNode(zPos.x, zPos.y, {
        radius: 56,
        label: 'z = ReLU(h)',
        value: fmt(st.z, 1),
        color: gateCol,
        glow: 14,
        labelYOffset: -82,
      }),
      compNode(wqPos.x, wqPos.y, {
        radius: 50,
        label: 'queue w_q (×1)',
        value: '2',
        color: COSMOS.cyan,
        labelYOffset: -76,
      }),
      compNode(sumPos.x, sumPos.y, {
        radius: 54,
        label: 'pred ŷ = z + 2',
        value: fmt(st.prediction, 1),
        color: COSMOS.gold,
        labelYOffset: -80,
      }),
      compNode(lossPos.x, lossPos.y, {
        radius: 56,
        label: 'loss (ŷ − 5)²',
        value: fmt(st.loss, 1),
        color: COSMOS.rose,
        labelYOffset: -82,
      }),
    ];

    if (sb > 0.1) {
      // Backward signal from loss -> sum -> queue (always active) & ReLU (open or blocked)
      nodes.push(
        txt(`upstream 2(ŷ − 5) = ${fmt(st.signal, 1)}`, 480, -96, 28, COSMOS.rose, 'mono').glow(
          6,
          COSMOS.rose,
        ),
        // Queue branch always receives upstream signal
        txt(
          `∂L/∂w_q = ${fmt(st.queueGradient, 1)}  (active path!)`,
          -410,
          285,
          30,
          COSMOS.cyan,
          'mono',
        ).glow(8, COSMOS.cyan),
        // Gate derivative badge
        txt(
          st.gate ? 'ReLU′(h) = 1  (passes signal)' : 'ReLU′(h) = 0  (BLOCKS signal!)',
          -240,
          28,
          28,
          gateCol,
          'mono',
        ).glow(10, gateCol),
        txt(
          `∂L/∂w_p = ${fmt(st.promptGradient, 1)}`,
          -730,
          28,
          34,
          st.gate ? COSMOS.emerald : COSMOS.rose,
          'mono',
        ).glow(10, st.gate ? COSMOS.emerald : COSMOS.rose),
      );
    }

    nodes.push(
      txt(
        isNeg
          ? 'Large loss (9), yet prompt gradient is 0 because h < 0: keep sign(h) for backward'
          : 'Positive pre-activation h opens the gate so gradient flows back to w_p',
        0,
        396,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(liveScene);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'relu-gate-b1', introPulse, 1, { dur: 0.4 });
  cueTo(s, c, 'relu-gate-b2', showBack, 1, { dur: 0.6 });
  cueTo(s, c, 'relu-gate-b3', negMode, 1, { dur: 0.45 });
  pulseCue(s, c, 'relu-negative-state', showBack, 1, { dur: 0.4 });
}

// ---------------------------------------------------------------------------
// 14. relu-corner: A centered ratio can cross a corner
// Cues: relu-corner-b1, corner-right, relu-corner-b2, corner-centered-probe, relu-corner-b3
// ---------------------------------------------------------------------------
export function reluCorner(s, c) {
  const mode = s.value(0); // 0=one-sided sweep, 1=centered secant, 2=step to 0.25
  const probeW = s.value(-0.5);
  const centerH = s.value(0.32);
  const rightStep = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44, seed: 103 }));
  s.add(aura(-200, 0, 520, '#2a588a24', '#151e3d12'));

  const plot = makePlot2d({
    left: -800,
    right: 260,
    top: -275,
    bottom: 245,
    xDomain: [-1, 1],
    yDomain: [0, 16],
    xTicks: [-1, -0.5, 0, 0.5, 1],
    yTicks: [0, 4, 9, 16],
    xLabel: 'prompt weight w',
    yLabel: 'loss L(w)',
    showZeroX: true,
  });

  const eqCorner = glowTex(String.raw`L(w) = (\operatorname{ReLU}(2w) - 3)^2`, {
    x: 560,
    y: -310,
    size: 36,
    color: COSMOS.gold,
    glow: 7,
  });

  const liveScene = dynamic(() => {
    const md = mode.value;
    const pts = plot.sampleCurve((w) => (Math.max(0, 2 * w) - 3) ** 2, {
      from: -1,
      to: 1,
      samples: 160,
    });
    const cx0 = plot.X(0);
    const cy0 = plot.Y(9);

    const nodes = [
      txt('NON-DIFFERENTIABLE KINK AT w = 0', -800, -372, 26, COSMOS.gold, 'mono', 'left'),
      plot.axes,
      new Node(polyPath(pts)).stroke(COSMOS.cyan, 4.8, 0.95).glow(10, COSMOS.cyan),
      dot(10, COSMOS.gold).at(cx0, cy0).glow(14, COSMOS.gold),
      txt('corner (0, 9)', cx0 + 18, cy0 - 30, 26, COSMOS.gold, 'mono', 'left'),
    ];

    const rx = 560;
    nodes.push(glassPlate(rx, 40, 530, 520, { stroke: '#3c5080', glow: 6 }));

    if (md < 0.5) {
      const w = probeW.value;
      const st = reluBranchState(w);
      nodes.push(
        dot(11, COSMOS.rose).at(plot.X(w), plot.Y(st.loss)).glow(14, COSMOS.rose),
        txt('ONE-SIDED APPROACH', rx, -165, 26, COSMOS.cyan, 'mono'),
        txt(`w = ${fmt(w, 2)}`, rx, -92, 48, COSMOS.gold, 'mono').glow(8, COSMOS.gold),
        txt(`prediction ŷ = ${fmt(st.prediction, 2)} s`, rx, -12, 30, COSMOS.ink, 'mono'),
        txt(`loss L = ${fmt(st.loss, 2)} s²`, rx, 48, 32, COSMOS.rose, 'mono'),
        line([rx - 210, 100], [rx + 210, 100], { stroke: '#2c3d66', width: 1.6 }),
        txt('Left slope (w < 0): 0', rx, 156, 30, COSMOS.cyan, 'mono'),
        txt('Right limit (w → 0⁺): −12', rx, 218, 30, COSMOS.rose, 'mono'),
      );
    } else if (md < 1.5) {
      const h = Math.max(0.015, centerH.value);
      const diff = reluCornerDifference(h);
      const ax = plot.X(-h);
      const ay = plot.Y(9);
      const bx = plot.X(h);
      const by = plot.Y((2 * h - 3) ** 2);
      nodes.push(
        line([ax, ay], [bx, by], { stroke: COSMOS.rose, width: 4.5 }).glow(10, COSMOS.rose),
        dot(9, COSMOS.rose).at(ax, ay).glow(10, COSMOS.rose),
        dot(9, COSMOS.rose).at(bx, by).glow(10, COSMOS.rose),
        txt('CENTERED PROBE CROSSES KINK', rx, -165, 26, COSMOS.rose, 'mono'),
        txt(`h = ${h.toFixed(3)}`, rx, -98, 36, COSMOS.gold, 'mono'),
        txt(`centered ≈ ${fmt(diff.center, 2)} → −6`, rx, -24, 34, COSMOS.rose, 'mono').glow(
          8,
          COSMOS.rose,
        ),
        line([rx - 210, 32], [rx + 210, 32], { stroke: '#2c3d66', width: 1.6 }),
        txt('Left 0 ≠ Right −12', rx, 92, 30, COSMOS.ink, 'mono'),
        txt('PyTorch ReLU backward at 0:', rx, 162, 26, COSMOS.muted, 'sans'),
        txt('convention = 0', rx, 222, 36, COSMOS.emerald, 'mono').glow(8, COSMOS.emerald),
      );
    } else {
      const w = 0.25 * rightStep.value;
      const st = reluBranchState(w);
      nodes.push(
        arrow([cx0, cy0], [plot.X(w), plot.Y(st.loss)], {
          stroke: COSMOS.emerald,
          width: 4.8,
          tip: 14,
        }).glow(10, COSMOS.emerald),
        dot(11, COSMOS.emerald).at(plot.X(w), plot.Y(st.loss)).glow(14, COSMOS.emerald),
        txt('LOWER LOSS SITS RIGHT BESIDE', rx, -165, 26, COSMOS.emerald, 'mono'),
        txt('At w = 0:  L = 9.00', rx, -90, 32, COSMOS.gold, 'mono'),
        txt(
          `At w = ${w.toFixed(2)}:  L = ${st.loss.toFixed(2)}`,
          rx,
          -22,
          34,
          COSMOS.emerald,
          'mono',
        ).glow(8, COSMOS.emerald),
        line([rx - 210, 34], [rx + 210, 34], { stroke: '#2c3d66', width: 1.6 }),
        txt('Backward returned 0 at w = 0', rx, 98, 28, COSMOS.rose, 'sans'),
        txt('Gradcheck smooth points on', rx, 168, 26, COSMOS.muted, 'sans'),
        txt('each side; use convention at 0', rx, 212, 26, COSMOS.muted, 'sans'),
      );
    }

    return group(...nodes);
  });

  s.add(liveScene, eqCorner);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'relu-corner-b1', probeW, -0.35, { dur: 0.45 });
  cueTo(s, c, 'corner-right', probeW, 0.45, { dur: 1.0 });

  cueTo(s, c, 'relu-corner-b2', mode, 1, { dur: 0.35 });
  cueTo(s, c, 'corner-centered-probe', centerH, 0.015, { dur: 1.4 });

  cueTo(s, c, 'relu-corner-b3', mode, 2, { dur: 0.3 });
  c.on('relu-corner-b3', () => s.play(rightStep.to(1, { duration: 0.85 })));
}

// ---------------------------------------------------------------------------
// 15. path-accumulation: What happens when paths meet?
// Cues: shared-node-0-b1-1, prompt-path-contribution-b2-1, shared-gradient-sum-b2-2,
//       row-gradient-sum-arrives, row-gradient-mean-b3-1
// ---------------------------------------------------------------------------
export function pathAccumulation(s, c) {
  const modeBatch = s.value(0); // 0=shared weight w=2, 1=4-request mean reduction
  const showBranches = s.value(0);
  const showSum6 = s.value(0);
  const batchSumVis = s.value(0);
  const batchMeanVis = s.value(0);
  const sharedPulse = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.44, seed: 109 }));
  s.add(aura(-420, 0, 480, '#ffd16620', '#18142a10'));
  s.add(aura(400, 0, 480, '#ff6b8b1e', '#1a122610'));

  // Phase 0 & 1: Shared weight diamond fan-in (w=2 feeds prompt ×2 and queue ×1)
  const sharedView = guardedDynamic(
    () => fadeOut(modeBatch.value),
    (vis) => {
      const sb = showBranches.value;
      const s6 = showSum6.value;
      const dr = drift.value;

      const wPos = { x: -680, y: 0 };
      const pPos = { x: -250, y: -175 };
      const qPos = { x: -250, y: 175 };
      const predPos = { x: 185, y: 0 };
      const lossPos = { x: 590, y: 0 };

      const trimLine = (a, b, rA, rB) => {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        return line(
          [a.x + (dx / len) * rA, a.y + (dy / len) * rA],
          [b.x - (dx / len) * rB, b.y - (dy / len) * rB],
          { stroke: '#334670', width: 2.6 },
        );
      };

      const nodes = [
        txt('SHARED WEIGHT FAN-IN', -820, -395, 26, COSMOS.gold, 'mono', 'left'),
        txt(
          s6 > 0.3
            ? 'Multiply along a route. Add where routes meet.'
            : 'One weight w = 2 feeds both branches. Multiply or add returning gradients?',
          -820,
          -342,
          32,
          s6 > 0.3 ? COSMOS.emerald : COSMOS.ink,
          'serif',
          'left',
        ),
        // Forward dim rails (trimmed strictly outside circle rims so fadeOut never crosses node values)
        trimLine(wPos, pPos, 60, 52),
        trimLine(wPos, qPos, 60, 52),
        trimLine(pPos, predPos, 52, 56),
        trimLine(qPos, predPos, 52, 56),
        trimLine(predPos, lossPos, 56, 56),
      ];

      // Returning glowing photon wires when branches revealed
      if (sb > 0.1) {
        nodes.push(
          photonWire(
            [
              [lossPos.x - 58, lossPos.y],
              [predPos.x + 58, predPos.y],
            ],
            dr * 2.6,
            { color: COSMOS.rose, width: 4 },
          ),
          photonWire(
            [
              [predPos.x - 52, predPos.y - 16],
              [pPos.x + 56, pPos.y + 12],
            ],
            dr * 2.6 + 0.25,
            { color: COSMOS.blue, width: 4 },
          ),
          photonWire(
            [
              [pPos.x - 52, pPos.y + 16],
              [wPos.x + 56, wPos.y - 18],
            ],
            dr * 2.6 + 0.5,
            { color: COSMOS.blue, width: 4.5 },
          ),
          photonWire(
            [
              [predPos.x - 52, predPos.y + 16],
              [qPos.x + 56, qPos.y - 12],
            ],
            dr * 2.6 + 0.25,
            { color: COSMOS.cyan, width: 4 },
          ),
          photonWire(
            [
              [qPos.x - 52, qPos.y - 16],
              [wPos.x + 56, wPos.y + 18],
            ],
            dr * 2.6 + 0.5,
            { color: COSMOS.cyan, width: 4.5 },
          ),
          txt('prompt route: +4', -525, -210, 30, COSMOS.blue, 'mono').glow(8, COSMOS.blue),
          txt('queue route: +2', -525, 210, 30, COSMOS.cyan, 'mono').glow(8, COSMOS.cyan),
        );
      }

      nodes.push(
        compNode(wPos.x, wPos.y, {
          radius: 58,
          label: 'shared w',
          value: '2',
          color: COSMOS.gold,
          glow: 12 + 6 * sharedPulse.value,
          labelYOffset: -86,
        }),
        compNode(pPos.x, pPos.y, {
          radius: 50,
          label: '2w (prompt)',
          value: '4',
          color: COSMOS.blue,
          labelYOffset: -76,
        }),
        compNode(qPos.x, qPos.y, {
          radius: 50,
          label: '1w (queue)',
          value: '2',
          color: COSMOS.cyan,
          labelYOffset: -76,
        }),
        compNode(predPos.x, predPos.y, {
          radius: 54,
          label: 'ŷ = 6',
          value: '6',
          color: COSMOS.emerald,
          labelYOffset: -80,
        }),
        compNode(lossPos.x, lossPos.y, {
          radius: 54,
          label: 'loss (6−5)²',
          value: '1',
          color: COSMOS.rose,
          labelYOffset: -80,
        }),
      );

      if (s6 > 0.3) {
        nodes.push(
          txt('dL / dw = 4 + 2 = 6', 0, 360, 48, COSMOS.gold, 'mono')
            .glow(12, COSMOS.gold)
            .opacity(s6),
        );
      } else {
        nodes.push(txt('4 × 2 = 8   or   4 + 2 = 6 ?', 0, 360, 40, COSMOS.muted, 'mono'));
      }

      return group(...nodes).opacity(vis);
    },
  );

  // Phase 2: 4-request batch mean reduction for prompt weight
  const batchBase = batchGradientState([0, 0]);
  const batchView = guardedDynamic(
    () => fadeIn(modeBatch.value),
    (vis) => {
      const bSum = batchSumVis.value;
      const bMean = batchMeanVis.value;
      const dr = drift.value;
      const nodes = [
        txt('BATCH MEAN REDUCTION  (w = [0, 0])', -820, -395, 26, COSMOS.cyan, 'mono', 'left'),
        txt(
          'Four independent requests sum their prompt gradients, then divide by 4',
          -820,
          -342,
          32,
          COSMOS.ink,
          'serif',
          'left',
        ),
      ];

      batchBase.rows.forEach((r, idx) => {
        const y = -200 + idx * 145;
        nodes.push(
          glassPlate(-490, y, 560, 96, { stroke: COSMOS.blue, glow: 5 }),
          txt(
            `${r.id}:  x = [${r.features.join(', ')}]   y = ${r.target}`,
            -735,
            y,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ),
          photonWire(
            [
              [-205, y],
              [70, y],
            ],
            dr * 2.5 + idx * 0.2,
            { color: COSMOS.rose, width: 3.4 },
          ),
          txt(`g_p = ${fmt(r.gradient[0], 0)}`, 155, y, 34, COSMOS.rose, 'mono', 'left').glow(
            6,
            COSMOS.rose,
          ),
        );
      });

      const rx = 615;
      nodes.push(
        glassPlate(rx, 15, 470, 440, { stroke: COSMOS.gold, glow: 8 }),
        txt('SUM OF 4 ROWS', rx, -142, 26, COSMOS.muted, 'mono'),
        txt(bSum > 0.3 ? '−144' : '?', rx, -66, 58, COSMOS.emerald, 'mono').glow(
          bSum > 0.3 ? 10 : 0,
          COSMOS.emerald,
        ),
        line([rx - 180, -4], [rx + 180, -4], { stroke: '#2c3d66', width: 1.8 }),
        txt('DIVIDE BY N = 4', rx, 56, 26, COSMOS.muted, 'mono'),
        txt(bMean > 0.3 ? '−36' : '?', rx, 138, 66, COSMOS.gold, 'mono').glow(
          bMean > 0.3 ? 12 : 0,
          COSMOS.gold,
        ),
      );

      nodes.push(
        txt(
          'Negative gradient means raising w_p lowers the batch loss',
          0,
          395,
          28,
          COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(sharedView, batchView);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'shared-node-0-b1-1', sharedPulse, 1, { dur: 0.5 });

  // Beat 1: answer revealed strictly on beat 1 cues
  cueTo(s, c, 'prompt-path-contribution-b2-1', showBranches, 1, { dur: 0.6 });
  cueTo(s, c, 'shared-gradient-sum-b2-2', showSum6, 1, { dur: 0.5 });

  // Beat 2: switch to 4-request mean reduction
  c.onBeat(2, () => s.play(modeBatch.to(1, { duration: 0.55 })));
  cueTo(s, c, 'row-gradient-sum-arrives', batchSumVis, 1, { dur: 0.5 });
  cueTo(s, c, 'row-gradient-mean-b3-1', batchMeanVis, 1, { dur: 0.5 });
}
