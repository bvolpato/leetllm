// Scene 6: action-head: "Which action does the incident support?"
// View 1: Final hidden state vector fans glowing weight beams into 3 logit energy bars,
//         strictly withholding winner & softmax probabilities until reveal cues.
// View 2: Visual parameter block ledger (12 cell + 9 head = 21 shared across 3..300 events).
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  MODEL,
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowArc,
  glowDot,
  glowRing,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  swapVis,
  txt,
} from '../parts.mjs';

export default function actionHead(s, c) {
  const title = heroTitle(['Which action does', 'the incident support?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.gold,
  });

  const vHead = s.value(1);
  const vParams = s.value(0);

  // View 1 state
  const row0 = s.value(0);
  const row1 = s.value(0);
  const row2 = s.value(0);
  const showQ = s.value(0);
  const showWinner = s.value(0);
  const showSoftmax = s.value(0);
  const showProbs = s.value(0);

  // View 2 state
  const showHeadCount = s.value(0);
  const showReuse = s.value(0);

  const actionNames = ['ignore', 'rollback', 'escalate'];
  const actionCols = [ROLE.input, ROLE.gold, ROLE.gate];
  const rowYs = [-105, 60, 225];
  const rowVals = [row0, row1, row2];

  const headView = guardedDynamic(vHead, (alpha) => {
    const nodes = [];

    // Left: Glowing rounded final hidden state orb fanning 3 beams
    const hubX = -675;
    const hubY = 50;
    nodes.push(
      glowRing(hubX, hubY, 72, ROLE.state, { width: 3.4, glow: 12, opacity: alpha }),
      txt('h₃', hubX, hubY, 40, ROLE.state, 'mono', 'center').opacity(alpha),
      txt('[0.390, 0.655]', hubX, hubY + 114, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
    );

    // Top-right equation: switches cleanly to shifted softmax on head-softmax
    if (showSoftmax.value > 0.02) {
      nodes.push(
        glowTex('p_k = \\frac{e^{z_k - z_{\\max}}}{\\sum_j e^{z_j - z_{\\max}}}', {
          x: 420,
          y: -385,
          size: 38,
          color: ROLE.state,
          glow: 7,
        }).opacity(showSoftmax.value * alpha),
      );
    } else {
      nodes.push(
        txt(
          'Rounded final state  h₃ = [0.390, 0.655]',
          420,
          -390,
          30,
          ROLE.state,
          'mono',
          'center',
        ).opacity((1 - showSoftmax.value) * alpha),
      );
    }

    // Column headers (floating typography, no table chrome)
    nodes.push(
      txt('Action & Dot Product', -245, -210, 28, COSMOS.muted, 'sans', 'center').opacity(alpha),
      txt('Logit Score', 240, -210, 28, COSMOS.muted, 'sans', 'center').opacity(alpha),
    );
    if (showProbs.value > 0.02) {
      nodes.push(
        txt('Softmax Share', 665, -210, 28, ROLE.gold, 'sans', 'center').opacity(
          showProbs.value * alpha,
        ),
      );
    }

    actionNames.forEach((name, i) => {
      const y = rowYs[i];
      const [wa, wb] = MODEL.readout[i];
      const expr = `${wa.toFixed(1)}×0.390 ${wb < 0 ? '−' : '+'} ${Math.abs(wb).toFixed(1)}×0.655`;
      const isWin = i === 1 && showWinner.value > 0.5;
      const col = isWin ? ROLE.gold : actionCols[i];
      const lit = rowVals[i].value;

      // Glowing fan beam from h3 orb to action row
      nodes.push(
        glowArc([hubX + 86, hubY], [-455, y], (i - 1) * 20, {
          color: col,
          width: isWin ? 4.2 : 2.6,
          glow: isWin ? 10 : 5,
          opacity: (0.35 + 0.65 * lit) * alpha,
        }),
        txt(name, -430, y - 16, 34, col, 'serif', 'left')
          .glow(isWin ? 8 : 0, ROLE.gold)
          .opacity(alpha),
        txt(expr, -430, y + 26, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      );

      // Logit bar track
      const barLeft = 65;
      const barMax = 290;
      nodes.push(
        line([barLeft, y], [barLeft + barMax, y], { stroke: '#2c3a5c', width: 6 }).opacity(alpha),
      );
      if (lit > 0.02) {
        const w = Math.max(12, (MODEL.logits[i] / 0.4) * barMax * lit);
        nodes.push(
          lumBar(barLeft + w / 2, y, w, 34, {
            color: col,
            fillOpacity: isWin ? 0.48 : 0.32,
            glow: isWin ? 12 : 7,
            opacity: alpha,
          }),
          txt(fmt(MODEL.logits[i], 4), barLeft + barMax + 26, y, 32, col, 'mono', 'left').opacity(
            lit * alpha,
          ),
        );
      }

      // Softmax probability bar & percentage (strictly concealed until head-probabilities)
      if (showProbs.value > 0.02) {
        const pAlpha = showProbs.value * alpha;
        const pVal = MODEL.probabilities[i];
        const pW = Math.max(16, pVal * 260 * showProbs.value);
        nodes.push(
          lumBar(560 + pW / 2, y, pW, 34, {
            color: i === 1 ? ROLE.gold : ROLE.state,
            fillOpacity: i === 1 ? 0.5 : 0.3,
            glow: i === 1 ? 12 : 6,
            opacity: pAlpha,
          }),
          txt(
            `${(100 * pVal).toFixed(1)}%`,
            725,
            y,
            i === 1 ? 42 : 34,
            i === 1 ? ROLE.gold : COSMOS.ink,
            'mono',
            'left',
          )
            .glow(i === 1 ? 9 : 0, ROLE.gold)
            .opacity(pAlpha),
        );
      }
    });

    // Bottom question / winner callout (zero overlap)
    if (showQ.value > 0.02 && showWinner.value < 0.02) {
      nodes.push(
        txt(
          'Which action will get the highest probability?',
          0,
          370,
          36,
          ROLE.gold,
          'serif',
          'center',
        ).opacity(showQ.value * alpha),
      );
    }
    if (showWinner.value > 0.02) {
      nodes.push(
        txt(
          'Rollback leads (0.3680)  ->  softmax preserves the ranking',
          0,
          370,
          32,
          ROLE.gold,
          'mono',
          'center',
        ).opacity(showWinner.value * alpha),
      );
    }

    return nodes;
  });

  // View 2: Visual shared parameter count across arbitrary sequence lengths
  const paramView = guardedDynamic(vParams, (alpha) => {
    const nodes = [
      txt(
        'Shared Parameter Budget (independent of sequence length)',
        0,
        -255,
        34,
        COSMOS.ink,
        'serif',
        'center',
      ).opacity(alpha),
    ];

    // Cell block visual: 2x3 W_x + 2x2 W_h + 2x1 b = 12
    const cellY = -105;
    nodes.push(
      txt('Recurrent Cell', -835, cellY, 30, ROLE.state, 'serif', 'left').opacity(alpha),
      lumBar(-455, cellY, 240, 82, {
        color: ROLE.input,
        fillOpacity: 0.28,
        glow: 7,
        opacity: alpha,
      }),
      txt('Wₓ  2×3 = 6', -455, cellY, 26, ROLE.input, 'mono', 'center').opacity(alpha),
      txt('+', -310, cellY, 32, COSMOS.muted, 'mono', 'center').opacity(alpha),
      lumBar(-165, cellY, 240, 82, {
        color: ROLE.state,
        fillOpacity: 0.28,
        glow: 7,
        opacity: alpha,
      }),
      txt('Wₕ  2×2 = 4', -165, cellY, 26, ROLE.state, 'mono', 'center').opacity(alpha),
      txt('+', -20, cellY, 32, COSMOS.muted, 'mono', 'center').opacity(alpha),
      lumBar(100, cellY, 190, 82, { color: ROLE.gate, fillOpacity: 0.28, glow: 7, opacity: alpha }),
      txt('b  2 = 2', 100, cellY, 26, ROLE.gate, 'mono', 'center').opacity(alpha),
      txt('= 12', 240, cellY, 42, ROLE.state, 'mono', 'left').glow(8, ROLE.state).opacity(alpha),
    );

    // Head block visual: 3x2 W_out + 3x1 b_out = 9
    if (showHeadCount.value > 0.02) {
      const hA = showHeadCount.value * alpha;
      const headY = 55;
      nodes.push(
        txt('Action Head', -835, headY, 30, ROLE.gold, 'serif', 'left').opacity(hA),
        lumBar(-455, headY, 240, 82, { color: ROLE.gold, fillOpacity: 0.28, glow: 7, opacity: hA }),
        txt('Wₒ  3×2 = 6', -455, headY, 26, ROLE.gold, 'mono', 'center').opacity(hA),
        txt('+', -310, headY, 32, COSMOS.muted, 'mono', 'center').opacity(hA),
        lumBar(-165, headY, 240, 82, {
          color: ROLE.amber,
          fillOpacity: 0.28,
          glow: 7,
          opacity: hA,
        }),
        txt('bₒ  3 = 3', -165, headY, 26, ROLE.amber, 'mono', 'center').opacity(hA),
        txt('= 9', 240, headY, 42, ROLE.gold, 'mono', 'left').glow(8, ROLE.gold).opacity(hA),
        txt('Total = 21 params', 610, -25, 36, ROLE.cell, 'mono', 'center')
          .glow(10, ROLE.cell)
          .opacity(hA),
      );
    }

    // Persistent unrolled sequence-length comparison ribbon (prevents empty space & grows at head-reuse)
    const rA = (0.38 + 0.62 * showReuse.value) * alpha;
    const lens = [
      { label: '3 events', w: 120, x: -560 },
      { label: '30 events', w: 240, x: -135 },
      { label: '300 events', w: 460, x: 430 },
    ];
    lens.forEach(({ label, w, x }) => {
      nodes.push(
        lumBar(x, 235, w, 40, { color: ROLE.state, fillOpacity: 0.26, glow: 7, opacity: rA }),
        txt(label, x, 295, 28, COSMOS.ink, 'mono', 'center').opacity(rA),
        glowDot(x - w / 2 + 14, 235, { radius: 5, color: ROLE.gold, glow: 8, opacity: rA }),
        glowDot(x + w / 2 - 14, 235, { radius: 5, color: ROLE.gold, glow: 8, opacity: rA }),
      );
    });
    if (showReuse.value > 0.02) {
      nodes.push(
        txt(
          'Same 21 shared weights at every step (more steps = more saved states for BPTT)',
          0,
          378,
          28,
          ROLE.cell,
          'sans',
          'center',
        ).opacity(showReuse.value * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.state), title, headView, paramView);

  playCue(s, c, 'head-row-0', (d) => s.play(row0.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'head-row-1', (d) => s.play(row1.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'head-row-2', (d) => s.play(row2.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'head-question', (d) => s.play(showQ.to(1, { duration: d })), { dur: 0.45 });

  playCue(
    s,
    c,
    'action-head-1',
    (d) => s.play(showQ.to(0, { duration: d * 0.4 }), showWinner.to(1, { duration: d * 0.6 })),
    { dur: 0.5 },
  );
  playCue(s, c, 'head-softmax', (d) => s.play(showSoftmax.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'head-probabilities', (d) => s.play(showProbs.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });

  playCue(s, c, 'action-head-2', (d) => s.play(swapVis(vHead, vParams, d)), { dur: 0.65 });
  playCue(s, c, 'head-parameter-count', (d) => s.play(showHeadCount.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'head-reuse', (d) => s.play(showReuse.to(1, { duration: d })), { dur: 0.5 });
}
