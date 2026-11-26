// Scene 16: causal-training: "Align the target before checking the whole path"
// View 1 (Beat 0): Shifted next-token targets (function->returns->the->result) paired with 4x4 causal mask.
// View 2 (Beat 1): 2-key mask bug workshop: 0 -> [0.50, 0.50] leak, -inf -> [1.00, 0.00] fixed,
//         [-inf, -inf] -> [NaN, NaN] all-masked failure.
// View 3 (Beat 2): Whole-block future-input invariance test (fixed weights, dropout off).
import { arrow } from 'vizmatic/stage';
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  INPUT,
  MODEL,
  ROLE,
  cinemaAtmosphere,
  compute,
  fmt,
  glowMatrix,
  lumBar,
  playCue,
  sum,
  swapVis,
  vectorRow,
} from '../parts.mjs';

export default function causalTraining(s, c) {
  const title = heroTitle(['Causal training:', 'targets, masks & leaks'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.mask,
  });

  const vShift = s.value(1);
  const vBug = s.value(0);
  const vTest = s.value(0);

  const shiftProg = s.value(0);
  const shiftHi = s.value(0);

  const bugStage = s.value(0); // 0=init, 1=wrong-mask(0->0.5), 2=fixed(-inf->0), 3=all-masked(NaN)

  const perturbProg = s.value(0); // 0 -> 4
  const invReveal = s.value(0);

  const words4 = ['function', 'returns', 'the', 'result'];

  // VIEW 1: Shifted targets vs causal mask separation
  const shiftLayer = guardedDynamic(vShift, (alpha) => {
    const sp = shiftProg.value;
    const hi = shiftHi.value > 0.35;
    const nodes = [
      txt(
        'Training puts all 4 tokens in memory at once',
        -120,
        -255,
        30,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
      txt('Inputs:', -660, -135, 28, ROLE.stream, 'mono', 'right').opacity(alpha),
      txt('Shifted targets:', -660, 85, 28, ROLE.valid, 'mono', 'right').opacity(alpha),
    ];

    words4.forEach((word, i) => {
      const cx = -490 + i * 265;
      const isLastPair = hi && i === 2;
      nodes.push(
        lumBar(cx, -135, 220, 76, {
          color: isLastPair ? ROLE.query : ROLE.stream,
          fillOpacity: isLastPair ? 0.36 : 0.2,
          strokeWidth: isLastPair ? 2.8 : 1.8,
          glow: isLastPair ? 10 : 4,
          opacity: alpha,
        }),
        txt(word, cx, -135, 28, isLastPair ? COSMOS.ink : ROLE.stream, 'mono', 'center').opacity(
          alpha,
        ),
      );
      if (i < 3 && sp > (i + 0.15) / 3) {
        nodes.push(
          arrow([cx, -85], [cx, 32], {
            stroke: isLastPair ? ROLE.query : ROLE.valid,
            width: 3.5,
            tip: 14,
          })
            .glow(isLastPair ? 9 : 5, isLastPair ? ROLE.query : ROLE.valid)
            .opacity(alpha),
          lumBar(cx, 85, 220, 76, {
            color: isLastPair ? ROLE.query : ROLE.valid,
            fillOpacity: isLastPair ? 0.34 : 0.2,
            strokeWidth: isLastPair ? 2.8 : 1.8,
            glow: isLastPair ? 10 : 4,
            opacity: alpha,
          }),
          txt(
            words4[i + 1],
            cx,
            85,
            28,
            isLastPair ? COSMOS.ink : ROLE.valid,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }
    });

    // Right 4x4 causal visibility matrix
    const maskVals = Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 4 }, (_, k) => (k <= r ? '1' : '0')),
    );
    const maskCols = Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 4 }, (_, k) => (k <= r ? ROLE.attn : ROLE.rule)),
    );
    nodes.push(
      txt('4x4 causal mask', 610, -220, 28, ROLE.attn, 'mono', 'center').opacity(alpha),
      glowMatrix({
        cx: 610,
        cy: -25,
        rows: 4,
        cols: 4,
        cellW: 68,
        cellH: 64,
        gap: 8,
        values: maskVals,
        colors: maskCols,
        dim: (r, k) => k > r,
        fontSize: 26,
        opacity: alpha,
      }),
      txt(
        hi
          ? '"the" predicts "result" while the causal mask blocks "result" from its query'
          : 'Shifted labels choose targets  ·  causal mask enforces visibility',
        0,
        355,
        28,
        hi ? ROLE.query : COSMOS.muted,
        'sans',
        'center',
      )
        .glow(hi ? 6 : 0, ROLE.query)
        .opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: 2-key mask worksheet (0 -> 0.5 leak, -inf -> 0 fixed, all -inf -> NaN)
  const bugLayer = guardedDynamic(vBug, (alpha) => {
    const st = bugStage.value;
    const isAll = st >= 2.6;
    const isFixed = !isAll && st >= 1.6;
    const isWrong = !isAll && !isFixed && st >= 0.6;

    const scoresRow = isAll ? ['-inf', '-inf'] : isFixed ? [0, '-inf'] : [0, 0];
    const weightRow = isAll
      ? ['NaN', 'NaN']
      : isFixed
        ? [1.0, 0.0]
        : isWrong
          ? [0.5, 0.5]
          : ['?', '?'];
    const rowCol = isAll ? ROLE.mask : isFixed ? ROLE.valid : isWrong ? ROLE.mask : ROLE.query;

    const caption = isAll
      ? 'All-masked row:  -inf - (-inf) = NaN  (handle padded queries explicitly!)'
      : isFixed
        ? 'Masked with -inf:  e^(-inf) = 0  ->  legal key receives 100% weight'
        : isWrong
          ? 'Bug: setting future score to 0 leaves e^0 = 1  ->  50% future leak!'
          : 'Two equal keys: one legal, one forbidden future key';

    return [
      txt('2-key softmax mask stress test', 0, -245, 32, COSMOS.ink, 'mono', 'center').opacity(
        alpha,
      ),
      txt('legal key', -180, -155, 28, ROLE.stream, 'mono', 'center').opacity(alpha),
      txt('future key', 180, -155, 28, ROLE.mask, 'mono', 'center').opacity(alpha),
      vectorRow({
        cx: 0,
        cy: -65,
        values: scoresRow,
        cellW: 320,
        cellH: 88,
        gap: 36,
        color: isFixed ? [ROLE.stream, ROLE.valid] : ROLE.mask,
        digits: 0,
        fontSize: 34,
        label: 'scores',
        opacity: alpha,
      }),
      arrow([0, 4], [0, 74], { stroke: rowCol, width: 4, tip: 15 }).glow(8, rowCol).opacity(alpha),
      txt('softmax', 110, 38, 26, rowCol, 'mono', 'left').opacity(alpha),
      vectorRow({
        cx: 0,
        cy: 150,
        values: weightRow,
        cellW: 320,
        cellH: 88,
        gap: 36,
        color: rowCol,
        digits: 2,
        fontSize: 34,
        label: 'weights',
        opacity: alpha,
      }),
      txt(caption, 0, 330, 30, rowCol, 'mono', 'center').glow(7, rowCol).opacity(alpha),
    ];
  });

  // VIEW 3: Whole-block invariance test
  const testLayer = guardedDynamic(vTest, (alpha) => {
    const dp = perturbProg.value;
    const rev = invReveal.value > 0.4;
    const changed = INPUT.map((r) => [...r]);
    changed[2][0] += dp;
    const other = compute(changed);
    const deltas = [0, 1, 2].map((i) =>
      Math.sqrt(sum(other.Z[i].map((v, j) => (v - MODEL.Z[i][j]) ** 2))),
    );

    const nodes = [
      txt(
        'Whole-path test: fixed weights · dropout off · perturb row 2 only',
        0,
        -255,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'Perturbed input (+4 on row 2, col 1)',
        -390,
        -185,
        28,
        ROLE.stream,
        'mono',
        'center',
      ).opacity(alpha),
      glowMatrix({
        cx: -390,
        cy: 15,
        rows: 3,
        cols: 4,
        cellW: 132,
        cellH: 78,
        gap: 10,
        values: changed.map((r) => r.map((v) => fmt(v, 2))),
        rowLabels: ['row 0', 'row 1', 'row 2'],
        highlight: (r, k) => r === 2 && k === 0,
        colors: changed.map((r, ri) =>
          r.map((_, ki) => (ri === 2 && ki === 0 ? ROLE.mask : ROLE.stream)),
        ),
        fontSize: 28,
        opacity: alpha,
      }),
      arrow([-35, 15], [130, 15], { stroke: ROLE.attn, width: 4, tip: 15 })
        .glow(8, ROLE.attn)
        .opacity(alpha),
      txt('full block', 48, -28, 26, ROLE.attn, 'mono', 'center').opacity(alpha),
      txt("Output row delta  ||Z' - Z||", 475, -185, 28, ROLE.valid, 'mono', 'center').opacity(
        alpha,
      ),
    ];

    [0, 1, 2].forEach((i) => {
      const y = -75 + i * 90;
      const isClean = i < 2;
      const col = isClean ? ROLE.valid : ROLE.attn;
      nodes.push(
        txt(`output row ${i}`, 295, y, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
        txt(rev ? fmt(deltas[i], 3) : '?', 690, y, 34, rev ? col : ROLE.query, 'mono', 'right')
          .glow(rev ? 7 : 0, col)
          .opacity(alpha),
      );
    });

    nodes.push(
      txt(
        rev
          ? 'Rows 0 & 1 stay 0.000  ·  Row 2 responds (> 0 confirms block uses its input)'
          : 'Catches leaks hidden in earlier residual layers or cross-position ops',
        0,
        365,
        28,
        rev ? ROLE.valid : COSMOS.muted,
        'sans',
        'center',
      )
        .glow(rev ? 6 : 0, ROLE.valid)
        .opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.mask, ROLE.attn), title, shiftLayer, bugLayer, testLayer);

  // Beat 0: shifted targets + mask
  playCue(s, c, 'tr-causal-training-voice-0', (d) => s.play(shiftProg.to(1, { duration: d })), {
    dur: 1.5,
  });
  playCue(s, c, 'tr-causal-training-shift', (d) => s.play(shiftHi.to(1, { duration: d })), {
    dur: 0.55,
  });

  // Beat 1: 2-key mask bugs
  playCue(
    s,
    c,
    'tr-causal-training-voice-1',
    (d) => s.play(swapVis(vShift, vBug, Math.min(0.65, d * 0.35))),
    { dur: 0.7 },
  );
  playCue(s, c, 'tr-causal-training-wrong-mask', (d) => s.play(bugStage.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'tr-causal-training-fixed-mask', (d) => s.play(bugStage.to(2, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'tr-causal-training-all-masked', (d) => s.play(bugStage.to(3, { duration: d })), {
    dur: 0.5,
  });

  // Beat 2: whole-block invariance test
  playCue(
    s,
    c,
    'tr-causal-training-voice-2',
    (d) => s.play(swapVis(vBug, vTest, Math.min(0.65, d * 0.35))),
    { dur: 0.7 },
  );
  playCue(s, c, 'tr-causal-training-voice-2', (d) => s.play(perturbProg.to(4, { duration: d })), {
    dur: 1.5,
    offset: 0.7,
  });
  playCue(s, c, 'tr-causal-training-invariance', (d) => s.play(invReveal.to(1, { duration: d })), {
    dur: 0.65,
  });
}
