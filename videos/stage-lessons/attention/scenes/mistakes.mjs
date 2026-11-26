// Scene 17: mistakes: "Reading the symptoms"
// Formula-anchored visual diagnostic anatomy (zero boxed bullet cards!):
// View 1: Glowing Attention(Q,K,V) formula with luminous connector stems dropping from QK^T, ÷ sqrt(d_k),
//         and softmax + M to floating symptoms + a 4-node orbital NaN triage pipeline.
// View 2: Visual 1x5 local-vs-absolute decode mask + [PAD] leak diagram above 3 visual cost geometries
//         (T^2 score grid, shrinking KV cache ribbon, O(T^2 d) FLOPs curve).
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  rule,
  txt,
} from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, glowRing, lumBar, playCue, swapVis } from '../parts.mjs';

export default function mistakes(s, c) {
  const title = heroTitle(['Reading the symptoms:', 'diagnostic anatomy'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.amber,
  });

  // Two clean sequential views: 1) Formula-anchored anatomy + orbital NaN triage, 2) Visual decode/pad bugs + 3 cost geometries
  const vDiag = s.value(1);
  const vCosts = s.value(0);

  // View 1 state (formula bugs + NaN order)
  const sShape = s.value(0.25);
  const sAxis = s.value(0.25);
  const sScale = s.value(0.25);
  const nanStep = s.value(0);

  // View 2 state (decode bugs + 3 separate costs)
  const bugForgets = s.value(0.3);
  const bugPad = s.value(0.3);
  const costScore = s.value(0.3);
  const costCache = s.value(0.3);
  const costWork = s.value(0.3);

  // VIEW 1: Formula-Anchored Diagnostic Stems + 4-Node Orbital NaN Triage (ZERO prose cards!)
  const formula = glowTex(
    '\\operatorname{softmax}\\!\\left(\\frac{Q K^{\\top}}{\\sqrt{d_k}} + M\\right)V',
    { x: -340, y: -195, size: 48, color: ROLE.sing, glow: 8 },
  );

  const diagLayer = guardedDynamic(vDiag, (alpha) => {
    const ns = nanStep.value;
    const nodes = [];

    // Three glowing diagnostic stems cleanly separated horizontally below formula (zero crossings!)
    const anchors = [
      {
        ax: -580,
        ay: -92,
        tx: -715,
        ty: 45,
        term: 'softmax + M',
        symptom: 'Row sum ≠ 1.00',
        cause: 'wrong axis / mask late',
        col: ROLE.mask,
        lit: sAxis.value,
      },
      {
        ax: -345,
        ay: -92,
        tx: -375,
        ty: 205,
        term: 'Q Kᵀ',
        symptom: 'Shape crash / silent bug',
        cause: 'missing K transpose',
        col: ROLE.query,
        lit: sShape.value,
      },
      {
        ax: -140,
        ay: -92,
        tx: -25,
        ty: 315,
        term: '÷ √d_k',
        symptom: 'Weights spike on 1 key',
        cause: 'missing 1/√d_k scale',
        col: ROLE.amber,
        lit: sScale.value,
      },
    ];

    anchors.forEach((a) => {
      const op = (0.38 + 0.62 * a.lit) * alpha;
      nodes.push(
        glowDot(a.ax, a.ay, { radius: 6, color: a.col, glow: 10 }).opacity(op),
        glowingTrail(
          [
            [a.ax, a.ay],
            [a.ax, a.ty - 32],
            [a.tx, a.ty - 32],
          ],
          { color: a.col, width: a.lit > 0.7 ? 3.5 : 2.0, glow: a.lit > 0.7 ? 8 : 3, opacity: op },
        ),
        glowDot(a.tx, a.ty - 32, { radius: 5.5, color: a.col, glow: 8 }).opacity(op),
        txt(a.term, a.tx, a.ty + 6, 28, a.col, 'mono', 'center')
          .glow(a.lit > 0.7 ? 7 : 0, a.col)
          .opacity(op),
        txt(a.symptom, a.tx, a.ty + 46, 26, COSMOS.ink, 'sans', 'center').opacity(op),
        txt(a.cause, a.tx, a.ty + 84, 26, a.col, 'mono', 'center').opacity(op),
      );
    });

    // Subtle hairline divider separating formula anatomy from orbital NaN triage
    nodes.push(rule(205, -280, 205, 400, COSMOS.rule, 1.8).opacity(0.6 * alpha));

    // Right: 4-Node Orbital NaN Triage Pipeline (numbered glowing rings + arrows, zero boxes!)
    const nx = 305;
    nodes.push(
      txt('NaN Triage Order', 540, -265, 34, ROLE.mask, 'serif', 'center')
        .glow(ns > 0.2 ? 7 : 0, ROLE.mask)
        .opacity((0.45 + 0.55 * Math.min(1, ns)) * alpha),
    );
    const steps = [
      { y: -150, n: '1', label: 'Inputs Q, K, V finite?', idx: 1 },
      { y: -5, n: '2', label: 'Scores overflow (FP16)?', idx: 2 },
      { y: 140, n: '3', label: 'Legal key in every row?', idx: 3 },
      { y: 285, n: '4', label: 'Only then check softmax', idx: 4 },
    ];
    steps.forEach((st, idx) => {
      const on = ns >= st.idx - 0.15;
      const col = st.idx === 4 ? ROLE.value : ROLE.mask;
      const op = (on ? 1 : 0.3) * alpha;
      nodes.push(
        glowRing(nx, st.y, 32, col, { width: on ? 3.5 : 2, glow: on ? 10 : 3 }).opacity(op),
        txt(st.n, nx, st.y, 28, col, 'mono', 'center').opacity(op),
        txt(st.label, nx + 54, st.y, 28, on ? COSMOS.ink : COSMOS.muted, 'sans', 'left').opacity(
          op,
        ),
      );
      if (idx < steps.length - 1) {
        nodes.push(
          arrow([nx, st.y + 42], [nx, steps[idx + 1].y - 42], {
            stroke: col,
            width: 2.8,
            tip: 11,
          }).opacity(op),
        );
      }
    });

    return nodes;
  });

  // VIEW 2: Visual Decode/Padding Mask Bugs + 3 Distinct Visual Cost Geometries (ZERO prose cards!)
  const costLayer = guardedDynamic(vCosts, (alpha) => {
    const nodes = [];
    const bf = bugForgets.value;
    const bp = bugPad.value;
    const bfOp = (0.4 + 0.6 * bf) * alpha;
    const bpOp = (0.4 + 0.6 * bp) * alpha;

    // Top-left visual: 1x5 cached decode mask bug (local pos 0 forgets history!)
    nodes.push(
      txt(
        'Cached decode mask bug (pos 4 treated as row 0)',
        -445,
        -245,
        26,
        ROLE.mask,
        'mono',
        'center',
      ).opacity(bfOp),
    );
    for (let k = 0; k < 5; k++) {
      const cx = -645 + k * 100;
      const ok = k === 0;
      nodes.push(
        lumBar(cx, -165, 84, 62, {
          color: ok ? ROLE.value : ROLE.mask,
          fillOpacity: ok ? 0.34 : 0.22,
          strokeWidth: 2.2,
          glow: ok ? 7 : 6,
          opacity: bfOp,
        }),
        txt(ok ? 'k0' : '×', cx, -165, 26, ok ? ROLE.value : ROLE.mask, 'mono', 'center').opacity(
          bfOp,
        ),
      );
    }
    nodes.push(
      txt(
        'Use absolute positions (j ≤ 4), not local row 0',
        -445,
        -95,
        26,
        ROLE.query,
        'sans',
        'center',
      ).opacity(bfOp),
    );

    // Top-right visual: Missing padding mask lets decoder read [PAD] tokens
    nodes.push(
      txt(
        'Missing padding mask (decoder reads fake [PAD])',
        445,
        -245,
        26,
        ROLE.amber,
        'mono',
        'center',
      ).opacity(bpOp),
    );
    const padCols = ['[PAD]', '[PAD]', 'Birds', 'in', 'sing'];
    padCols.forEach((lbl, k) => {
      const cx = 205 + k * 120;
      const isPad = k < 2;
      const col = isPad ? ROLE.amber : ROLE.sing;
      nodes.push(
        lumBar(cx, -165, 104, 62, {
          color: col,
          fillOpacity: isPad ? 0.3 : 0.2,
          strokeWidth: isPad ? 2.8 : 1.8,
          glow: isPad ? 9 : 4,
          opacity: bpOp,
        }),
        txt(lbl, cx, -165, 26, col, 'mono', 'center').opacity(bpOp),
      );
    });
    nodes.push(
      txt(
        'Always apply key-padding mask before softmax',
        445,
        -95,
        26,
        ROLE.query,
        'sans',
        'center',
      ).opacity(bpOp),
    );

    // Hairline horizontal rule separating bugs from 3 visual cost geometries
    nodes.push(
      rule(-840, -32, 840, -32, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      txt(
        'Keep the three long-context costs separate:',
        0,
        14,
        32,
        COSMOS.ink,
        'serif',
        'center',
      ).opacity(alpha),
    );

    // 1. Score Memory: visual 4x4 T^2 grid
    const sOp = (0.38 + 0.62 * costScore.value) * alpha;
    const gx = -575;
    const gy = 175;
    for (let r = 0; r < 4; r++) {
      for (let k = 0; k < 4; k++) {
        nodes.push(
          lumBar(gx + (k - 1.5) * 34, gy + (r - 1.5) * 34, 28, 28, {
            color: ROLE.mask,
            fillOpacity: 0.34,
            strokeWidth: 1.6,
            glow: costScore.value > 0.7 ? 7 : 2,
            radius: 4,
            opacity: sOp,
          }),
        );
      }
    }
    nodes.push(
      txt('1. Score memory', gx, 80, 30, ROLE.mask, 'mono', 'center').opacity(sOp),
      txt('Temporary T² grid', gx, 282, 26, COSMOS.ink, 'sans', 'center').opacity(sOp),
      txt('Fix: FlashAttention', gx, 330, 26, ROLE.value, 'mono', 'center').opacity(sOp),
    );

    // 2. KV Cache Memory: visual persistent horizontal KV bars (MHA -> GQA -> MQA)
    const cOp = (0.38 + 0.62 * costCache.value) * alpha;
    const cx0 = -150;
    nodes.push(
      txt('2. KV cache memory', 0, 80, 30, ROLE.sing, 'mono', 'center').opacity(cOp),
      lumBar(cx0 + 150, 138, 300, 26, { color: ROLE.mask, fillOpacity: 0.35, opacity: cOp }),
      lumBar(cx0 + 70, 180, 140, 26, { color: ROLE.sing, fillOpacity: 0.4, opacity: cOp }),
      lumBar(cx0 + 28, 222, 56, 26, { color: ROLE.value, fillOpacity: 0.45, opacity: cOp }),
      txt('Persistent O(T) state', 0, 282, 26, COSMOS.ink, 'sans', 'center').opacity(cOp),
      txt('Fix: GQA / MQA', 0, 330, 26, ROLE.sing, 'mono', 'center').opacity(cOp),
    );

    // 3. Arithmetic Work: visual glowing quadratic FLOPs curve O(T^2 d)
    const wOp = (0.38 + 0.62 * costWork.value) * alpha;
    const wx0 = 435;
    const wy0 = 235;
    const curvePts = [];
    for (let i = 0; i <= 20; i++) {
      const u = i / 20;
      curvePts.push([wx0 + u * 280, wy0 - u * u * 115]);
    }
    nodes.push(
      txt('3. Arithmetic work', 575, 80, 30, ROLE.value, 'mono', 'center').opacity(wOp),
      line([wx0, wy0], [wx0 + 285, wy0], { stroke: '#4d608e', width: 2 }).opacity(wOp),
      line([wx0, wy0], [wx0, wy0 - 125], { stroke: '#4d608e', width: 2 }).opacity(wOp),
      glowingTrail(curvePts, { color: ROLE.value, width: 4.2, glow: 9, opacity: wOp }),
      txt('O(T² d) FLOPs', 575, 282, 26, COSMOS.ink, 'mono', 'center').opacity(wOp),
      txt('Still visits legal pairs', 575, 330, 26, ROLE.query, 'sans', 'center').opacity(wOp),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.amber, ROLE.mask), title, formula, diagLayer, costLayer);

  // Beat 0: Formula step symptoms
  playCue(s, c, 'shape', (d) => s.play(sShape.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'wrong-axis', (d) => s.play(sAxis.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'after-softmax', (d) => s.play(sAxis.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'scaling', (d) => s.play(sScale.to(1, { duration: d })), { dur: 0.45 });

  // Beat 1: NaN checklist in order
  playCue(s, c, 'nan', (d) => s.play(nanStep.to(0.4, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'finite', (d) => s.play(nanStep.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'overflowed', (d) => s.play(nanStep.to(2, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'row-key', (d) => s.play(nanStep.to(3, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'only-then', (d) => s.play(nanStep.to(4, { duration: d })), { dur: 0.4 });

  // Beat 2: Hide formula cleanly & switch to visual decode/padding mask bugs + 3 visual cost geometries
  c.hide('forgets', formula);
  playCue(
    s,
    c,
    'forgets',
    (d) => s.play(swapVis(vDiag, vCosts, d), bugForgets.to(1, { duration: d })),
    { dur: 0.65 },
  );
  playCue(s, c, 'fake-tokens', (d) => s.play(bugPad.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'estimate', (d) => s.play(costScore.to(0.5, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'c-score', (d) => s.play(costScore.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'c-cache', (d) => s.play(costCache.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'c-work', (d) => s.play(costWork.to(1, { duration: d })), { dur: 0.45 });
}
