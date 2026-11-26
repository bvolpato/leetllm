// Scene 11: paper-reference: "Read the paper through the mechanism"
// Vaswani et al. (2017) "Attention Is All You Need" Equation 1 + computed Birds/sing row,
// then glowing full-bleed Figure 2 dataflow architecture (Scaled Dot-Product Attention on left,
// Multi-Head Attention with per-head Linear projections, Concat, and W_O on right).
import { arrow } from 'vizmatic/stage';
import {
  COSMOS,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  HEAD2_OUTPUT,
  OUTPUT,
  ROLE,
  SCALED,
  SCORES,
  WEIGHTS,
  arcPts,
  cinemaAtmosphere,
  lumBar,
  playCue,
  swapVis,
  vecStr,
} from '../parts.mjs';

export default function paperReference(s, c) {
  const title = heroTitle(['Vaswani et al. (2017)', 'Attention Is All You Need'], {
    x: -850,
    y: -440,
    size: 46,
    lineHeight: 54,
    accent: ROLE.sing,
  });

  // Two spacious full-bleed views: Equation 1 + our computed row -> Figure 2 glowing dataflow
  const vEq = s.value(1);
  const vFig = s.value(0);

  // Equation 1 term highlight index: 0=none, 1=QK^T, 2=/sqrt(d_k), 3=softmax, 4=*V, 5=toy row
  const eqHi = s.value(0);
  // Figure 2 active stage:
  // 1=left matmul, 2=scale, 3=mask, 4=softmax, 5=mix*V, 6=route/content
  // 7=linear projections, 8=own params, 9=head notation, 10=h heads, 11=concat, 12=W_O, 13=scope, 14=payoff
  const figStage = s.value(0);

  const eqFormula = glowTex(
    '\\operatorname{Attention}(Q,K,V) = \\operatorname{softmax}\\!\\left(\\frac{Q K^{\\top}}{\\sqrt{d_k}}\\right) V',
    { x: 0, y: -155, size: 54, color: ROLE.query },
  );

  // View 1: Equation 1 breakdown + computed sing row
  const eqLayer = guardedDynamic(vEq, (alpha) => {
    const st = eqHi.value;
    const nodes = [];

    nodes.push(
      txt(
        'Equation 1  ·  Section 3.2.1  (arXiv:1706.03762)',
        410,
        -370,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    const stages = [
      {
        x: -630,
        name: 'Q Kᵀ',
        sub: 'dot products',
        val: vecStr(SCORES[1], 2),
        col: ROLE.query,
        idx: 1,
      },
      {
        x: -210,
        name: '÷ √d_k',
        sub: 'scale by √2',
        val: vecStr(SCALED[1], 2),
        col: ROLE.amber,
        idx: 2,
      },
      {
        x: 210,
        name: 'softmax',
        sub: 'row shares',
        val: vecStr(WEIGHTS[1], 2),
        col: ROLE.sing,
        idx: 3,
      },
      {
        x: 630,
        name: '× V',
        sub: 'value blend',
        val: vecStr(OUTPUT[1], 2),
        col: ROLE.value,
        idx: 4,
      },
    ];

    stages.forEach((p, i) => {
      const lit = st >= p.idx - 0.2;
      const active = Math.abs(st - p.idx) < 0.6 || st >= 4.8;
      const op = (lit ? 1 : 0.35) * alpha;
      nodes.push(
        lumBar(p.x, 125, 340, 190, {
          color: p.col,
          fillOpacity: active ? 0.28 : 0.12,
          strokeWidth: active ? 3 : 1.6,
          glow: active ? 10 : 4,
          opacity: op,
        }),
        txt(p.name, p.x, 68, 34, p.col, 'mono', 'center').opacity(op),
        txt(p.sub, p.x, 118, 26, COSMOS.muted, 'sans', 'center').opacity(op),
        txt(p.val, p.x, 174, 34, COSMOS.ink, 'mono', 'center').opacity(op),
      );
      if (i < 3) {
        nodes.push(
          arrow([p.x + 178, 125], [p.x + 242, 125], {
            stroke: COSMOS.muted,
            width: 3.5,
            tip: 14,
          }).opacity(alpha),
        );
      }
    });

    nodes.push(
      txt(
        'Our computed "sing" row is one row of Equation 1',
        0,
        325,
        32,
        st >= 4.5 ? ROLE.sing : COSMOS.muted,
        'sans',
        'center',
      )
        .glow(st >= 4.5 ? 7 : 0, ROLE.sing)
        .opacity(alpha),
    );
    return nodes;
  });

  // View 2: Full-bleed Glowing Figure 2 Dataflow (Left: Scaled Dot-Product, Right: Multi-Head)
  const figLayer = guardedDynamic(vFig, (alpha) => {
    const fs = figStage.value;
    const nodes = [];

    // LEFT COLUMN: Scaled Dot-Product Attention (bottom-up dataflow)
    const lx = -470;
    nodes.push(
      txt(
        'Figure 2 (left): Scaled Dot-Product',
        lx,
        -275,
        30,
        ROLE.query,
        'serif',
        'center',
      ).opacity(alpha),
    );

    const leftBlocks = [
      { y: 245, label: 'MatMul  (Q Kᵀ)', col: ROLE.query, step: 1 },
      { y: 145, label: 'Scale  (÷ √d_k)', col: ROLE.amber, step: 2 },
      { y: 45, label: 'Mask (opt.)', col: ROLE.mask, step: 3 },
      { y: -55, label: 'SoftMax', col: ROLE.value, step: 4 },
      { y: -155, label: 'MatMul  (× V)', col: ROLE.birds, step: 5 },
    ];

    leftBlocks.forEach((b, idx) => {
      const active = Math.abs(fs - b.step) < 0.65 || (fs >= 5.5 && fs < 6.8) || fs >= 13.5;
      const op = (fs >= b.step - 0.5 ? 1 : 0.4) * alpha;
      nodes.push(
        lumBar(lx, b.y, 330, 68, {
          color: b.col,
          fillOpacity: active ? 0.34 : 0.14,
          strokeWidth: active ? 3 : 1.6,
          glow: active ? 10 : 4,
          opacity: op,
        }),
        txt(b.label, lx, b.y, 28, active ? COSMOS.ink : b.col, 'mono', 'center').opacity(op),
      );
      if (idx < leftBlocks.length - 1) {
        nodes.push(
          arrow([lx, b.y - 36], [lx, leftBlocks[idx + 1].y + 36], {
            stroke: b.col,
            width: 3,
            tip: 12,
          }).opacity(op),
        );
      }
    });

    // Inputs Q, K at bottom, V sweeping up right side of left column
    nodes.push(
      txt('Q', lx - 100, 345, 32, ROLE.query, 'mono', 'center').opacity(alpha),
      txt('K', lx, 345, 32, ROLE.birds, 'mono', 'center').opacity(alpha),
      txt('V', lx + 225, 345, 32, ROLE.value, 'mono', 'center').opacity(alpha),
      glowingTrail(arcPts([lx + 225, 315], [lx + 175, -155], 55, 26), {
        color: ROLE.value,
        width: 3.5,
        glow: 8,
        opacity: (fs >= 4.5 ? 1 : 0.35) * alpha,
      }),
    );

    // RIGHT COLUMN: Multi-Head Attention (bottom-up)
    const rx = 355;
    nodes.push(
      txt(
        'Figure 2 (right): Multi-Head (h heads)',
        rx,
        -275,
        30,
        ROLE.head,
        'serif',
        'center',
      ).opacity(alpha),
    );

    const linActive = fs >= 6.8 && fs < 10.5;
    const headCoreActive = fs >= 9.2 && fs < 11.2;
    const concatActive = fs >= 10.8 && fs < 12.2;
    const woActive = fs >= 11.8;

    // 3 stacked Linear blocks for V, K, Q
    const linXs = [rx - 220, rx, rx + 220];
    const linNames = ['Wᵢᵛ', 'Wᵢᴷ', 'Wᵢᵠ'];
    const inNames = ['V', 'K', 'Q'];
    const linCols = [ROLE.value, ROLE.birds, ROLE.query];
    linXs.forEach((x, i) => {
      const op = (fs >= 6.5 ? 1 : 0.32) * alpha;
      nodes.push(
        txt(inNames[i], x, 345, 32, linCols[i], 'mono', 'center').opacity(op),
        arrow([x, 315], [x, 275], { stroke: linCols[i], width: 2.8, tip: 12 }).opacity(op),
        lumBar(x, 232, 168, 72, {
          color: linCols[i],
          fillOpacity: linActive ? 0.32 : 0.14,
          strokeWidth: linActive ? 2.8 : 1.6,
          glow: linActive ? 9 : 3,
          opacity: op,
        }),
        txt(`Linear ${linNames[i]}`, x, 232, 26, linCols[i], 'mono', 'center').opacity(op),
        arrow([x, 192], [x, 146], { stroke: linCols[i], width: 2.8, tip: 12 }).opacity(op),
      );
    });

    // Scaled Dot-Product Attention (× h)
    nodes.push(
      lumBar(rx, 96, 620, 82, {
        color: ROLE.head,
        fillOpacity: headCoreActive ? 0.34 : 0.15,
        strokeWidth: headCoreActive ? 3 : 1.6,
        glow: headCoreActive ? 10 : 4,
        opacity: (fs >= 8.5 ? 1 : 0.32) * alpha,
      }),
      txt('h × Scaled Dot-Product (h = 2)', rx, 96, 26, COSMOS.ink, 'mono', 'center').opacity(
        (fs >= 8.5 ? 1 : 0.32) * alpha,
      ),
      arrow([rx, 52], [rx, 10], { stroke: ROLE.head, width: 3.2, tip: 13 }).opacity(
        (fs >= 10.5 ? 1 : 0.3) * alpha,
      ),

      // Concat
      lumBar(rx, -35, 480, 74, {
        color: ROLE.query,
        fillOpacity: concatActive ? 0.34 : 0.14,
        strokeWidth: concatActive ? 3 : 1.6,
        glow: concatActive ? 10 : 4,
        opacity: (fs >= 10.5 ? 1 : 0.3) * alpha,
      }),
      txt('Concat(head₁, …, head_h)', rx, -35, 26, ROLE.query, 'mono', 'center').opacity(
        (fs >= 10.5 ? 1 : 0.3) * alpha,
      ),
      arrow([rx, -74], [rx, -114], { stroke: ROLE.value, width: 3.2, tip: 13 }).opacity(
        (fs >= 11.5 ? 1 : 0.3) * alpha,
      ),

      // Output Linear W_O
      lumBar(rx, -155, 360, 74, {
        color: ROLE.value,
        fillOpacity: woActive ? 0.36 : 0.14,
        strokeWidth: woActive ? 3 : 1.6,
        glow: woActive ? 10 : 4,
        opacity: (fs >= 11.5 ? 1 : 0.3) * alpha,
      }),
      txt('Linear  W_O', rx, -155, 30, ROLE.value, 'mono', 'center').opacity(
        (fs >= 11.5 ? 1 : 0.3) * alpha,
      ),
    );

    // Bottom contextual banner synced to active figure cue
    let banner = 'Weights choose the route  ·  Values carry what moves along it';
    let bCol = ROLE.sing;
    if (fs >= 8.5 && fs < 11) {
      banner = `head_i = Attention(Q W_i^Q, K W_i^K, V W_i^V)   ·   h₁=${vecStr(OUTPUT[1], 2)}, h₂=${vecStr(HEAD2_OUTPUT, 2)}`;
      bCol = ROLE.query;
    } else if (fs >= 12.5 && fs < 13.5) {
      banner =
        'Scope: Figure 2 ends at W_O  ·  residual (+ x) lives in the outer Transformer block';
      bCol = ROLE.mask;
    } else if (fs >= 13.5) {
      banner = 'Score → Share → Mix: Equation 1, Figure 2, and our vectors are the same mechanism';
      bCol = ROLE.value;
    }
    nodes.push(txt(banner, 0, 425, 26, bCol, 'mono', 'center').glow(5, bCol).opacity(alpha));

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.sing, ROLE.head), title, eqFormula, eqLayer, figLayer);

  // Beat 0: Paper title & Equation 1
  playCue(s, c, 'paper-title', (d) => s.play(eqHi.to(0.2, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'paper-equation', (d) => s.play(eqHi.to(0.6, { duration: d })), { dur: 0.4 });

  // Beat 1: Walk Equation 1 terms -> connect to computed sing row
  playCue(s, c, 'equation-query-key', (d) => s.play(eqHi.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'equation-scale', (d) => s.play(eqHi.to(2, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'equation-softmax', (d) => s.play(eqHi.to(3, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'equation-values', (d) => s.play(eqHi.to(4, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'equation-toy-row', (d) => s.play(eqHi.to(5, { duration: d })), { dur: 0.45 });

  // Beat 2: Switch to Figure 2 glowing dataflow (left half)
  c.hide('figure-left', eqFormula);
  playCue(
    s,
    c,
    'figure-left',
    (d) => s.play(swapVis(vEq, vFig, d), figStage.to(1, { duration: d })),
    { dur: 0.65 },
  );
  playCue(s, c, 'figure-scores', (d) => s.play(figStage.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'figure-scale', (d) => s.play(figStage.to(2, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'figure-mask', (d) => s.play(figStage.to(3, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'figure-softmax', (d) => s.play(figStage.to(4, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'figure-mix', (d) => s.play(figStage.to(5, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'figure-route-content', (d) => s.play(figStage.to(6, { duration: d })), {
    dur: 0.35,
  });

  // Beat 3: Figure 2 right half (Multi-Head per-head projections)
  playCue(s, c, 'figure-projections', (d) => s.play(figStage.to(7, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'figure-own-parameters', (d) => s.play(figStage.to(8, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'figure-head-notation', (d) => s.play(figStage.to(9, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'figure-input-notation', (d) => s.play(figStage.to(9.5, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'figure-head-core', (d) => s.play(figStage.to(10, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'figure-head-count', (d) => s.play(figStage.to(10.4, { duration: d })), {
    dur: 0.35,
  });

  // Beat 4: Concat, W_O, scope, payoff
  playCue(s, c, 'figure-concat', (d) => s.play(figStage.to(11, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'figure-output', (d) => s.play(figStage.to(12, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'figure-scope', (d) => s.play(figStage.to(13, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'paper-payoff', (d) => s.play(figStage.to(14, { duration: d })), { dur: 0.4 });
}
