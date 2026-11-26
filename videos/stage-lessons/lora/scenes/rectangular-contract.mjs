// Scene 18: What changes when two weights move?: Rectangular 3x4 example prediction (middle row stays -0.875) + 4096 FLOP comparison.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  PARAM_4096,
  RECT_EDITED,
  aura,
  fmtNum,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  matrixGrid,
  rect,
  rectangularExample,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function rectangularContract(s, c) {
  const phase = s.value(0);
  const showRect = s.value(1);
  const showStep1 = s.value(0);
  const showStep2 = s.value(0);
  const showBaseVals = s.value(0);
  const editProgress = s.value(0);
  const revealMiddle = s.value(0); // withheld until after rectangular-middle!
  const revealOthers = s.value(0); // withheld until after rectangular-output!
  const showFlops = s.value(0);
  const showAdapterFlop = s.value(0);
  const showBaseFlop = s.value(0);
  const showFlopRatio = s.value(0);

  const bgAura = aura(100, 10, 620, '#5ce1e620', '#ffd16618');
  const title = heroTitle(['What Changes When', 'Two Weights Move?'], {
    x: -855,
    y: -420,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'RECTANGULAR 3×4 LAYER · FLOP BUDGET',
  });

  // Part 1: 3x4 rectangular layer prediction
  const partRect = guardedDynamic(showRect, (a) => {
    const ch = editProgress.value;
    const f = rectangularExample(ch);
    const sb = showBaseVals.value > 0.5;
    const rm = revealMiddle.value > 0.5;
    const ro = revealOthers.value > 0.5;

    const nodes = [
      txt(
        'x = [1, −0.5, 0.25, 2]   ·   scale s = 2   ·   4 -> 2 -> 3',
        855,
        -375,
        26,
        COSMOS.cyan,
        'mono',
        'right',
      ).opacity(a),

      // W_0 (3x4)
      txt('W_0 : 3 × 4 (frozen)', -555, -215, 26, COSMOS.blue, 'mono').opacity(a),
      matrixGrid(f.W, -555, -45, {
        cellW: 96,
        cellH: 72,
        color: COSMOS.blue,
        opacity: a,
        fontSize: 26,
      }),

      // A (2x4)
      txt('A : 2 × 4 (r = 2)', 55, -215, 26, COSMOS.gold, 'mono').opacity(a),
      matrixGrid(f.A, 55, -85, {
        cellW: 96,
        cellH: 72,
        color: COSMOS.gold,
        opacity: a,
        fontSize: 26,
      }),

      // B (3x2) with edited entries [0,0] and [2,1] highlighted, middle row [1,*] = [0,0]
      txt('B : 3 × 2 (edit row 1 & 3)', 585, -215, 26, COSMOS.cyan, 'mono').opacity(a),
      matrixGrid(f.B, 585, -45, {
        cellW: 112,
        cellH: 72,
        color: ch > 0.2 ? COSMOS.emerald : COSMOS.cyan,
        highlightRow: rm ? 1 : -1,
        opacity: a,
        fontSize: 26,
      }),
    ];

    // Output comparison table across bottom (withholds which row stays put until revealMiddle!)
    nodes.push(
      glassCell(0, 268, 1660, 240, rm ? COSMOS.emerald : ch > 0.2 ? COSMOS.gold : COSMOS.blue, {
        fill: '#10192e',
        glow: 8,
        opacity: a,
      }),
      txt('FROZEN BASE W_0 x', -630, 222, 26, COSMOS.blue, 'mono').opacity(a),
      txt('ADAPTED OUTPUT', -630, 314, 26, COSMOS.emerald, 'mono').opacity(a),
    );

    for (let i = 0; i < 3; i++) {
      const cx = -210 + i * 380;
      const isMid = i === 1;
      const adaptedVisible = isMid ? rm : ro;
      const baseText = sb || showStep2.value > 0.3 ? fmtNum(f.base[i], 3) : '?';
      const adaptedText = adaptedVisible
        ? fmtNum(RECT_EDITED.output[i], 3)
        : ch > 0.3
          ? '?'
          : sb
            ? fmtNum(f.base[i], 3)
            : '?';
      const col = adaptedVisible ? (isMid ? COSMOS.gold : COSMOS.emerald) : COSMOS.muted;
      nodes.push(
        txt(`Output ${i + 1}`, cx, 174, 26, COSMOS.muted, 'mono').opacity(a),
        txt(baseText, cx, 222, 36, COSMOS.blue, 'mono').opacity(a),
        txt(adaptedText, cx, 314, 38, col, 'mono')
          .glow(adaptedVisible ? 7 : 0, col)
          .opacity(a),
      );
    }

    const promptMsg = rm
      ? 'Row 2 of B is [0, 0] -> Output 2 stays −0.875 · Outputs 1 & 3 move (matches merged W)'
      : ch > 0.3
        ? 'Top and bottom rows of B moved: which output will stay put?'
        : 'Shape check: d_in = 4 -> rank r = 2 -> d_out = 3';
    nodes.push(
      txt(
        promptMsg,
        0,
        424,
        28,
        rm ? COSMOS.emerald : showStep1.value > 0.2 ? COSMOS.gold : COSMOS.cyan,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Part 2: 4096x4096 r=16 FLOP comparison
  const partFlops = guardedDynamic(showFlops, (a) => {
    const af = showAdapterFlop.value;
    const bf = showBaseFlop.value;
    const rf = showFlopRatio.value;
    const maxW = 1400;
    const x0 = -700;
    const adapterW = Math.max(16, (PARAM_4096.adapterFlops / PARAM_4096.baseFlops) * maxW);

    const nodes = [
      txt(
        '4096 × 4096 PROJECTION · r = 16 · MAC = 2 FLOPs',
        855,
        -375,
        26,
        COSMOS.cyan,
        'mono',
        'right',
      ).opacity(a),

      // Base matvec bar
      txt('BASE MATVEC  W_0 x  (2 · d²)', x0, -145, 30, COSMOS.blue, 'mono', 'left').opacity(a),
      rect(maxW, 74, { fill: '#142342', stroke: COSMOS.blue, width: 2.2, radius: 8 })
        .at(0, -70)
        .opacity(a),
      rect(maxW * Math.max(0.05, bf), 74, { fill: COSMOS.blue, stroke: null, radius: 8 })
        .at(x0 + maxW * Math.max(0.05, bf) * 0.5, -70)
        .glow(10, COSMOS.blue)
        .opacity(bf * a),
      txt(
        bf > 0.4
          ? `${PARAM_4096.baseFlops.toLocaleString('en-US')} FLOPs (~33.55M / token)`
          : 'Computing base FLOPs...',
        x0,
        10,
        32,
        COSMOS.blue,
        'mono',
        'left',
      ).opacity(a),

      // Thin adapter matvecs bar
      txt('TWO THIN MATVECS  B(Ax)  (4 · d · r)', x0, 120, 30, COSMOS.gold, 'mono', 'left').opacity(
        a,
      ),
      rect(maxW, 52, { fill: '#1a1a28', stroke: '#3a4c78', width: 2, radius: 8 })
        .at(0, 182)
        .opacity(a),
      rect(adapterW, 52, { fill: COSMOS.gold, stroke: '#ffffff', width: 1.2, radius: 6 })
        .at(x0 + adapterW * 0.5, 182)
        .glow(12, COSMOS.gold)
        .opacity(Math.max(0.25, af) * a),
      txt(
        af > 0.4
          ? `${PARAM_4096.adapterFlops.toLocaleString('en-US')} FLOPs (~262K / token)`
          : 'Computing adapter FLOPs...',
        x0,
        250,
        32,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(a),

      // Ratio verdict box
      glassCell(0, 368, 1520, 118, rf > 0.4 ? COSMOS.emerald : '#334268', {
        fill: '#0f2328',
        glow: rf > 0.4 ? 10 : 3,
        opacity: a,
      }),
      txt(
        rf > 0.4
          ? 'Thin matvecs add 0.78125% FLOPs/token · dense BA (2 d² r) is computed once at merge'
          : 'Compare thin forward work against dense merge work',
        0,
        368,
        28,
        rf > 0.4 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, partRect, partFlops);
  runPhase(s, c, phase, 14);

  c.on('rectangular-contract-1', () => s.play(showStep1.to(1, { duration: 0.4 })));
  c.on('rectangular-contract-2', () => s.play(showStep2.to(1, { duration: 0.35 })));
  c.on('rectangular-base', () => s.play(showBaseVals.to(1, { duration: 0.35 })));
  c.on('rectangular-change', () => s.play(editProgress.to(1, { duration: 0.6 })));
  c.after('rectangular-middle', () => s.play(revealMiddle.to(1, { duration: 0.35 })));
  c.after('rectangular-output', () => s.play(revealOthers.to(1, { duration: 0.35 })));
  c.on('rectangular-contract-3', () => {
    s.play(
      par(showRect.to(0, { duration: 0.16 }), delay(showFlops.to(1, { duration: 0.2 }), 0.16)),
    );
  });
  c.on('rectangular-flops-adapter', () => s.play(showAdapterFlop.to(1, { duration: 0.45 })));
  c.on('rectangular-flops-base', () => s.play(showBaseFlop.to(1, { duration: 0.45 })));
  c.on('rectangular-flops-ratio', () =>
    s.play(showFlopRatio.to(1, { duration: remainDuration(c, 'rectangular-flops-ratio', 0.45) })),
  );
}
