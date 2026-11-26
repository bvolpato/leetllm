// Scene 6: loss-numerics - "One score row, worked both ways"
// Pure Cinema: 5-stage luminous InfoNCE computation table with magnitude bars for [0.9, 0.2] -> [0.2, 0.9],
// stable max-subtraction under 1e308 tied logits (loss = ln 2), and analytic score-gradient diagram.
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  comparisonRow,
  glowMatrix,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  playAfter,
  playOn,
  rule,
  txt,
  verifyApprox,
} from '../parts.mjs';

function fmtNum(v) {
  if (Math.abs(v) >= 1e10) return v.toExponential(0);
  if (Math.abs(v) > 0 && Math.abs(v) < 1e-3) return v.toExponential(2);
  return Number(v.toPrecision(6)).toString();
}

export default function lossNumerics(s, c) {
  const scores = [0.9, 0.2];
  const tau = 0.05;
  const rEasy = comparisonRow(scores, tau);
  const rSwap = comparisonRow([0.2, 0.9], tau);
  const big = 1e308;
  const rTied = comparisonRow([big, big], 1);
  verifyApprox(rTied.loss, Math.log(2), 1e-12, 'tied huge logits equal ln 2');
  verifyApprox(rSwap.loss, 14.0, 0.01, 'swapped row loss ~14 nats');

  const stage = s.value(0); // 0=easy, 1=swapped, 2=tied huge, 3=gradient
  const rowReveal = s.value(1); // 1..5 rows revealed in stage 0
  const showLossEasy = s.value(0);
  const showLossSwap = s.value(0);
  const hiRow = s.value(-1);
  const hiTiny = s.value(0);

  const title = heroTitle(['One score row,', 'worked both ways'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.anchor,
  });

  const eqGrad = glowTex(
    '\\frac{\\partial \\mathcal{L}}{\\partial s_i} = \\frac{p_i - \\mathbf{1}[i = \\text{target}]}{\\tau}',
    {
      x: 420,
      y: -415,
      size: 32,
      color: ROLE.focus,
      glow: 6,
    },
  );

  const sceneLayer = guardedDynamic(s.value(1), () => {
    const st = stage.value;
    const rr = rowReveal.value;
    const hr = Math.round(hiRow.value);
    const nodes = [];

    if (st < 2.5) {
      const isEasy = st < 0.5;
      const isSwap = st >= 0.5 && st < 1.5;
      const isTied = st >= 1.5;

      const curRow = isEasy ? rEasy : isSwap ? rSwap : rTied;
      const curScores = isEasy ? scores : isSwap ? [0.2, 0.9] : [big, big];
      const curTau = isTied ? 1 : tau;

      const fullMatrix = [curScores, curRow.logits, curRow.centered, curRow.masses, curRow.probs];

      const visibleRows = isEasy ? Math.round(rr) : 5;
      const displayVals = fullMatrix.map((row, rIdx) =>
        rIdx < visibleRows ? row.map(fmtNum) : ['·', '·'],
      );

      nodes.push(
        txt(
          `Target: column A     ·     τ = ${curTau}`,
          -140,
          -295,
          30,
          ROLE.positive,
          'mono',
          'center',
        ).glow(5, ROLE.positive),
        glowMatrix({
          cx: -140,
          cy: 10,
          rows: 5,
          cols: 2,
          cellW: 290,
          cellH: 74,
          gap: 14,
          values: displayVals,
          rowLabels: ['score', 'score / τ', 'logit − max', 'exp(centered)', 'probability'],
          colLabels: ['A: positive target', 'B: negative'],
          colors: fullMatrix.map((_, rIdx) => [
            rIdx === hr ? ROLE.focus : ROLE.positive,
            rIdx === hr ? ROLE.focus : ROLE.competitor,
          ]),
          highlight: (rIdx) => rIdx === hr || (isEasy && rIdx === visibleRows - 1),
          dim: (rIdx) => rIdx >= visibleRows,
          fontSize: 30,
        }),
      );

      // Right-hand visual probability & stability telemetry
      const rx = 560;
      nodes.push(
        rule(285, -280, 285, 310, COSMOS.rule, 1.8).opacity(0.55),
        txt('ROW PROBABILITY', rx, -230, 26, COSMOS.muted, 'mono', 'center'),
      );
      const showProbVis = !isEasy || visibleRows >= 5;
      if (showProbVis) {
        const pA = curRow.probs[0];
        const pB = curRow.probs[1];
        const barMax = 400;
        nodes.push(
          txt('P(A)', rx - 210, -140, 28, ROLE.positive, 'mono', 'left'),
          lumBar(rx - 125 + Math.max(8, pA * barMax) / 2, -140, Math.max(8, pA * barMax), 32, {
            color: ROLE.positive,
            fillAlpha: 0.45,
            glow: 9,
            radius: 6,
          }),
          txt('P(B)', rx - 210, -76, 28, ROLE.competitor, 'mono', 'left'),
          lumBar(rx - 125 + Math.max(8, pB * barMax) / 2, -76, Math.max(8, pB * barMax), 32, {
            color: ROLE.competitor,
            fillAlpha: 0.45,
            glow: 9,
            radius: 6,
          }),
        );
      } else {
        nodes.push(txt('stepping through softmax...', rx, -110, 26, COSMOS.dim, 'mono', 'center'));
      }

      // Loss readout on right
      if (isEasy && showLossEasy.value > 0.05) {
        nodes.push(
          txt('INFONCE LOSS', rx, 60, 26, COSMOS.muted, 'mono', 'center').opacity(
            showLossEasy.value,
          ),
          txt(rEasy.loss.toExponential(2), rx, 122, 46, ROLE.focus, 'mono', 'center')
            .glow(10, ROLE.focus)
            .opacity(showLossEasy.value),
          txt('nats (< 1 millionth)', rx, 178, 26, ROLE.positive, 'sans', 'center').opacity(
            showLossEasy.value,
          ),
        );
      } else if (isSwap && showLossSwap.value > 0.05) {
        nodes.push(
          txt('SWAPPED LOSS', rx, 60, 26, COSMOS.muted, 'mono', 'center').opacity(
            showLossSwap.value,
          ),
          txt(`${rSwap.loss.toFixed(2)} nats`, rx, 122, 46, ROLE.competitor, 'mono', 'center')
            .glow(10, ROLE.competitor)
            .opacity(showLossSwap.value),
          txt('max − positive gap = 14', rx, 178, 26, ROLE.focus, 'mono', 'center').opacity(
            showLossSwap.value,
          ),
        );
      } else if (isTied) {
        nodes.push(
          txt('STABLE LOG-SUM-EXP', rx, 55, 26, ROLE.anchor, 'mono', 'center'),
          txt('loss = ln 2 ≈ 0.693', rx, 118, 38, ROLE.focus, 'mono', 'center').glow(9, ROLE.focus),
          txt('No 1e308 − 1e308 cancellation', rx, 176, 26, ROLE.positive, 'sans', 'center'),
        );
      }

      // Footer note
      const footTxt = isTied
        ? hiTiny.value > 0.3
          ? 'Scale by max |x| first -> tiny 1e-300 vectors still normalize; zero vectors stay invalid'
          : 'Reject nonfinite logits, τ ≤ 0, and mismatched widths before exponentiating'
        : isSwap
          ? 'Separate max − positive gap avoids subtracting huge nearly equal log-sum-exp terms'
          : 'Subtracting row maximum keeps exp(centered) strictly inside (0, 1]';
      nodes.push(
        txt(
          footTxt,
          0,
          390,
          28,
          hiTiny.value > 0.3 ? ROLE.focus : COSMOS.muted,
          'sans',
          'center',
        ).glow(hiTiny.value > 0.3 ? 6 : 0, ROLE.focus),
      );
    } else {
      // Stage 3: Analytic score-gradient matrix for tied row (tau = 1)
      const gMat = [
        rTied.probs,
        [1, 0],
        rTied.probs.map((p, i) => p - (i === 0 ? 1 : 0)),
        rTied.gradients,
      ];
      nodes.push(
        txt('ONE-TARGET SCORE DERIVATIVE   (τ = 1)', 0, -275, 30, ROLE.focus, 'mono', 'center'),
        glowMatrix({
          cx: 0,
          cy: 25,
          rows: 4,
          cols: 2,
          cellW: 320,
          cellH: 82,
          gap: 16,
          values: gMat.map((r) => r.map((v) => v.toFixed(2))),
          rowLabels: ['row prob pᵢ', 'indicator 1[i=target]', 'pᵢ − indicator', 'score gradient'],
          colLabels: ['A: positive target', 'B: negative'],
          colors: [
            [ROLE.positive, ROLE.competitor],
            [ROLE.positive, COSMOS.dim],
            [ROLE.anchor, ROLE.competitor],
            [ROLE.positive, ROLE.competitor],
          ],
          highlight: (rIdx) => rIdx === 3,
          fontSize: 32,
        }),
        txt(
          'Descent moves opposite the gradient: raises A (+0.50), lowers B (−0.50)',
          0,
          380,
          30,
          ROLE.positive,
          'sans',
          'center',
        ).glow(5, ROLE.positive),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.focus), title, eqGrad, sceneLayer);

  playOn(s, c, 'cl-loss-numerics-scores', (d) => hiRow.to(0, { duration: d }), 0.35);
  playAfter(s, c, 'cl-loss-numerics-logits', (d) => rowReveal.to(2, { duration: d }), 0.35);
  playAfter(s, c, 'cl-loss-numerics-center', (d) => rowReveal.to(3, { duration: d }), 0.35);
  playAfter(s, c, 'cl-loss-numerics-mass', (d) => rowReveal.to(4, { duration: d }), 0.35);
  playAfter(s, c, 'cl-loss-numerics-prob', (d) => rowReveal.to(5, { duration: d }), 0.35);
  playAfter(s, c, 'cl-loss-numerics-loss', (d) => showLossEasy.to(1, { duration: d }), 0.45);

  playOn(
    s,
    c,
    'numerics-swap-input',
    (d) => [stage.to(1, { duration: d }), hiRow.to(-1, { duration: d })],
    0.35,
  );
  playAfter(s, c, 'cl-loss-numerics-swap', (d) => showLossSwap.to(1, { duration: d }), 0.45);
  playOn(s, c, 'cl-loss-numerics-finite', (d) => hiRow.to(1, { duration: d }), 0.35);
  playOn(s, c, 'cl-loss-numerics-gap', (d) => hiRow.to(2, { duration: d }), 0.35);
  playAfter(
    s,
    c,
    'cl-loss-numerics-tied',
    (d) => [stage.to(2, { duration: d }), hiRow.to(-1, { duration: d })],
    0.4,
  );
  playOn(s, c, 'cl-loss-numerics-tiny', (d) => hiTiny.to(1, { duration: d }), 0.45);
  playAfter(s, c, 'cl-loss-numerics-gradient', (d) => stage.to(3, { duration: d }), 0.45);
}
