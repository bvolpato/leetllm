// Act 1 (Scenes 1-5): Intro Route Ruler & Loop Ring, Aligned Batch Tensors,
// CrossEntropyLoss Contract & Stability, Raw Logits to Softmax Loss, and Two-Ticket Step + 3D Basin.
import {
  arrow,
  circle,
  curve3d,
  dot,
  dynamic,
  gridPlane3d,
  group,
  line,
  point3d,
  rect,
  surface,
} from 'vizmatic/stage';
import {
  COSMOS,
  FEATURES,
  LABELS,
  ROLE,
  SCORE_FIXTURE,
  STEP_ONE,
  TENSOR_ROWS,
  cinemaGrid,
  clamp01,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  glowBar,
  glowTex,
  guardedDynamic,
  heroTitle,
  mix,
  orbitScene,
  routeRulerNodes,
  rule,
  scaleTrack,
  scoreTicket,
  signed,
  stableSoftmax,
  tensorCell,
  txt,
  cinematic3d,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. intro: Which call fixes this ticket's route?
// Cues: intro-score-tie, intro-pin, intro-choose, intro-gradient, intro-still*,
//       intro-result*, intro-read-scores*, intro-gap*
// ---------------------------------------------------------------------------
export function intro(s, c) {
  const tieP = s.value(0);
  const pinP = s.value(0);
  const chooseP = s.value(0);
  const gradP = s.value(0);
  const stillP = s.value(0);
  const resultP = s.value(0);
  const readScoresP = s.value(0);
  const gapP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.forward, seed: 1 }));
  s.add(decorAura(-460, -60, 480, '#60a5fa20', '#07091000'));
  s.add(decorAura(480, -40, 480, '#6ee7b71e', '#07091000'));

  const headline = heroTitle(['Which Call Moves', 'the Ticket Route?'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.grad,
    eyebrow: 'TICKET A · CHECKOUT IS DOWN · LABEL: ESCALATE',
  });

  const live = dynamic(() => {
    const ti = tieP.value;
    const pn = pinP.value;
    const ch = chooseP.value;
    const gr = gradP.value;
    const st = stillP.value;
    const rs = resultP.value;
    const rd = readScoresP.value;
    const gp = gapP.value;

    const nodes = [];

    // Left: Ticket A score meters (Standard vs Escalate)
    const lx = -855;
    const curStd = mix(0, -0.2, rd);
    const curEsc = mix(0, 0.2, rd);
    const curGap = mix(0, 0.4, gp);

    nodes.push(
      txt('TICKET A  [urgency +1, severity +1]', lx, -195, 26, ROLE.forward, 'mono', 'left'),
      txt('Standard score', lx, -130, 28, ROLE.standard, 'sans', 'left'),
      scaleTrack(lx + 240, -130, 360, 42, { stroke: '#324872', fill: '#0d1528', radius: 10 }),
      glowBar(
        lx + 420 + (curStd < 0 ? curStd * 450 : 0),
        -130,
        Math.max(8, Math.abs(curStd) * 450),
        34,
        ROLE.standard,
        {
          glow: ti > 0.2 ? 9 : 5,
        },
      ),
      txt(signed(curStd, 2), lx + 635, -130, 32, ROLE.standard, 'mono', 'left'),

      txt('Escalate score', lx, -62, 28, ROLE.escalate, 'sans', 'left'),
      scaleTrack(lx + 240, -62, 360, 42, { stroke: '#2c544b', fill: '#0d1924', radius: 10 }),
      glowBar(lx + 420, -62, Math.max(8, Math.abs(curEsc) * 450), 34, ROLE.escalate, {
        glow: rs > 0.2 ? 12 : 5,
      }),
      txt(signed(curEsc, 2), lx + 635, -62, 32, ROLE.escalate, 'mono', 'left'),
    );

    // Status line below score meters (strictly non-overlapping phases)
    const statusPhase =
      rs > 0.05
        ? { text: 'optimizer.step() updated W: Escalation wins', color: ROLE.escalate, op: rs }
        : st > 0.05
          ? { text: 'After backward(): W unchanged, still a tie', color: ROLE.forward, op: st }
          : ch > 0.05
            ? { text: 'Prediction: backward() or optimizer.step()?', color: ROLE.grad, op: ch }
            : { text: 'Both scores start at 0.00 (tie -> standard)', color: COSMOS.muted, op: 1 };

    nodes.push(
      txt(statusPhase.text, lx, 16, 28, statusPhase.color, 'serif', 'left').opacity(statusPhase.op),
    );

    // Right: Living Training Loop Orbital Ring (backward vs optimizer.step)
    const rx = 470;
    const ry = -130;
    const rad = 165;
    nodes.push(
      circle(rad, { fill: null, stroke: '#2c3d66', width: 3.5, dash: [10, 10] }).at(rx, ry),
    );

    const ringNodes = [
      { label: 'forward()', ang: -Math.PI / 2, color: ROLE.forward, active: 0.45 },
      {
        label: 'loss.backward()',
        ang: 0.22,
        color: ROLE.grad,
        active: Math.max(ch * 0.55, gr),
      },
      {
        label: 'optimizer.step()',
        ang: Math.PI - 0.22,
        color: ROLE.escalate,
        active: Math.max(ch * 0.55, rs),
      },
    ];
    for (const item of ringNodes) {
      const nx = rx + Math.cos(item.ang) * rad;
      const ny = ry + Math.sin(item.ang) * rad;
      nodes.push(
        circle(26, { fill: '#10182d', stroke: item.color, width: 3 })
          .at(nx, ny)
          .glow(item.active > 0.3 ? 12 : 4, item.color),
      );
    }
    nodes.push(
      txt('forward()', rx, ry - rad - 62, 26, ROLE.forward, 'mono'),
      txt('loss.backward()', rx + rad + 36, ry + 34, 28, ROLE.grad, 'mono', 'left').glow(
        gr > 0.3 ? 8 : 0,
        ROLE.grad,
      ),
      txt('optimizer.step()', rx - rad - 36, ry + 34, 28, ROLE.escalate, 'mono', 'right').glow(
        rs > 0.3 ? 10 : 0,
        ROLE.escalate,
      ),
    );

    // Center of ring: live W and W.grad state
    nodes.push(
      txt(
        gr > 0.2 ? 'W.grad: filled' : 'W.grad: empty',
        rx,
        ry - 22,
        26,
        gr > 0.2 ? ROLE.grad : COSMOS.dim,
        'mono',
      ),
      txt(
        rs > 0.2 ? 'W: updated' : 'W: all zeros',
        rx,
        ry + 24,
        26,
        rs > 0.2 ? ROLE.escalate : COSMOS.muted,
        'mono',
      ),
    );

    // Bottom: Shared Route Ruler (-0.6 to +0.6)
    const marks = [];
    if (gp > 0.05) {
      marks.push({ gap: 0, label: 'Start 0.00', color: COSMOS.dim, hollow: true, labelY: 226 });
      marks.push({
        gap: curGap,
        label: gp > 0.72 ? `After step ${signed(curGap, 2)}` : '',
        color: ROLE.escalate,
        labelY: 226,
      });
    } else if (pn > 0.05 || ti > 0.05 || st > 0.05) {
      marks.push({
        gap: 0,
        label: st > 0.2 ? 'Still tied (0.00)' : 'Tie -> standard (0.00)',
        color: st > 0.2 ? ROLE.forward : ROLE.standard,
        labelY: 222,
      });
    } else {
      marks.push({ gap: 0, label: '0.00', color: ROLE.standard, labelY: 222 });
    }
    nodes.push(routeRulerNodes(280, marks, { xCenter: 0, halfSpan: 680 }));

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'intro-score-tie', tieP, 1, { dur: 0.6 });
  cueTo(s, c, 'intro-pin', pinP, 1, { dur: 0.55 });
  cueTo(s, c, 'intro-choose', chooseP, 1, { dur: 0.65 });
  cueTo(s, c, 'intro-gradient', gradP, 1, { dur: 0.7 });
  cueTo(s, c, 'intro-still', stillP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'intro-result', resultP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'intro-read-scores', readScoresP, 1, { after: true, dur: 0.38 });
  cueTo(s, c, 'intro-gap', gapP, 1, { after: true, dur: 0.38 });
}

// ---------------------------------------------------------------------------
// 2. tensors: A batch is a pair of aligned tensors
// Cues: tensors-beat-1-focus-2, tensors-beat-1-focus-1, tensors-beat-2-focus-1
// ---------------------------------------------------------------------------
export function tensors(s, c) {
  const rowIntroP = s.value(0);
  const stackP = s.value(0);
  const splitP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.forward, seed: 2 }));
  s.add(decorAura(-360, 0, 480, '#5ce1e61c', '#07091000'));
  s.add(decorAura(480, 40, 440, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Aligned Feature &', 'Target Tensors'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.forward,
    eyebrow: '6 TICKETS · BATCH SIZE 4 -> [4] + [2]',
  });

  const shapeEq = glowTex(String.raw`X \in \mathbb{R}^{6 \times 2}, \qquad y \in \{0, 1\}^{6}`, {
    x: 420,
    y: -365,
    size: 40,
    color: ROLE.grad,
    glow: 6,
  });

  const live = dynamic(() => {
    const ri = rowIntroP.value;
    const st = stackP.value;
    const sp = splitP.value;
    const nodes = [];

    // Left: Full 6x2 feature matrix X and 6-vector y with ID tether
    const xId = -800;
    const xU = -610;
    const xS = -395;
    const xY = -155;
    const y0 = -165;
    const rowStep = 94;

    nodes.push(
      txt('ID', xId, y0 - 62, 26, COSMOS.muted, 'mono'),
      txt('Urgency', xU, y0 - 62, 26, ROLE.forward, 'mono'),
      txt('Severity', xS, y0 - 62, 26, ROLE.forward, 'mono'),
      txt('Target y', xY, y0 - 62, 26, ROLE.grad, 'mono'),
    );

    const activeIndices = sp > 0.5 ? [4, 5] : [0, 1, 2, 3];

    TENSOR_ROWS.forEach((row, i) => {
      const cy = y0 + i * rowStep;
      const inBatch = activeIndices.includes(i);
      const isEsc = row.label === 1;
      const col = isEsc ? ROLE.escalate : ROLE.standard;
      const op = inBatch ? 1 : 0.34;
      const pulse = inBatch ? 7 : 0;
      const segOpts = {
        stroke: inBatch ? col : '#2a3758',
        width: inBatch ? 2.6 : 1.4,
        dash: inBatch ? undefined : [6, 8],
      };

      // Alignment luminous tether segments strictly between cells (never crossing text)
      nodes.push(
        line([xId + 58, cy], [xU - 78, cy], segOpts).opacity(op),
        line([xU + 78, cy], [xS - 78, cy], segOpts).opacity(op),
        line([xS + 78, cy], [xY - 86, cy], segOpts).opacity(op),
        tensorCell(xId, cy, 110, 62, `${row.id}`, inBatch ? COSMOS.ink : COSMOS.dim, {
          size: 28,
          glow: pulse * 0.5,
          opacity: op,
        }),
        tensorCell(xU, cy, 150, 62, row.urgency.toFixed(1), ROLE.forward, {
          size: 28,
          glow: st > 0.2 && inBatch ? 7 : 2,
          opacity: op,
        }),
        tensorCell(xS, cy, 150, 62, row.severity.toFixed(1), ROLE.forward, {
          size: 28,
          glow: st > 0.2 && inBatch ? 7 : 2,
          opacity: op,
        }),
        tensorCell(xY, cy, 165, 62, `${row.label} (${row.route.slice(0, 3)})`, col, {
          size: 26,
          glow: ri > 0.2 && inBatch ? 8 : 3,
          opacity: op,
        }),
      );
    });

    // Right: Active DataLoader batch emitted slice
    const bx = 250;
    const isFinal = sp > 0.5;
    const batchColor = isFinal ? ROLE.escalate : ROLE.forward;
    const batchTitle = isFinal ? 'FINAL BATCH  (2 ROWS)' : 'BATCH 1  (4 ROWS)';
    const batchShape = isFinal ? 'X_b: [2, 2]   ·   y_b: [2]' : 'X_b: [4, 2]   ·   y_b: [4]';

    nodes.push(
      arrow([-35, isFinal ? 255 : -20], [150, -35], {
        stroke: batchColor,
        width: 4,
      }).glow(8, batchColor),
      txt(batchTitle, bx, -205, 30, batchColor, 'mono', 'left').glow(6, batchColor),
      txt(batchShape, bx, -155, 28, ROLE.grad, 'mono', 'left'),
    );

    activeIndices.forEach((idx, pos) => {
      const row = TENSOR_ROWS[idx];
      const cy = -65 + pos * 94;
      const col = row.label === 1 ? ROLE.escalate : ROLE.standard;
      nodes.push(
        tensorCell(bx + 65, cy, 115, 62, `#${row.id}`, COSMOS.ink, { size: 28, glow: 4 }),
        tensorCell(
          bx + 290,
          cy,
          265,
          62,
          `[${row.urgency.toFixed(1)}, ${row.severity.toFixed(1)}]`,
          ROLE.forward,
          { size: 28, glow: 7 },
        ),
        tensorCell(bx + 515, cy, 125, 62, `y = ${row.label}`, col, { size: 28, glow: 8 }),
      );
    });

    nodes.push(
      txt(
        'Row identity stays locked across X and y through loading',
        bx,
        365,
        26,
        COSMOS.muted,
        'serif',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, shapeEq, live);
  cueTo(s, c, 'tensors-beat-1-focus-2', rowIntroP, 1, { dur: 0.7 });
  cueTo(s, c, 'tensors-beat-1-focus-1', stackP, 1, { dur: 0.7 });
  cueTo(s, c, 'tensors-beat-2-focus-1', splitP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 3. loss-contract: A shape match does not validate the objective
// Cues: loss-contract-beat-0, loss-contract-beat-1, loss-contract-beat-2, loop-shuffle
// ---------------------------------------------------------------------------
export function lossContract(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const b2P = s.value(0);
  const shufP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.grad, seed: 3 }));
  s.add(decorAura(0, 40, 560, '#ffd16618', '#5ce1e614'));

  const headline = heroTitle(['CrossEntropyLoss', 'Contract & Stability'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.grad,
    eyebrow: 'SHAPES · RAW LOGITS · SHARED SHUFFLE',
  });

  // View 1 (Beat 0): Hard-label [B] long vs Soft-target [B, C] float
  const view1 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const b0 = b0P.value;
      const pulse = 7;
      const nodes = [
        txt('HARD-LABEL ROUTER CONTRACT', -855, -200, 28, ROLE.forward, 'mono', 'left'),
        // Features [B, 2]
        txt('Features X', -640, -120, 28, ROLE.standard, 'sans'),
        tensorCell(-715, -35, 130, 64, '1.2', ROLE.standard, { glow: pulse * 0.5 }),
        tensorCell(-565, -35, 130, 64, '0.8', ROLE.standard, { glow: pulse * 0.5 }),
        tensorCell(-715, 45, 130, 64, '\u22121.0', ROLE.standard, { glow: pulse * 0.5 }),
        tensorCell(-565, 45, 130, 64, '\u22120.7', ROLE.standard, { glow: pulse * 0.5 }),
        txt('float32  [B, 2]', -640, 128, 28, ROLE.standard, 'mono'),

        arrow([-460, 5], [-320, 5], { stroke: ROLE.forward, width: 4 }).glow(8, ROLE.forward),

        // Raw Logits [B, 2]
        txt('Raw Logits z', -110, -120, 28, ROLE.forward, 'sans'),
        tensorCell(-185, -35, 130, 64, '0.2', ROLE.forward, { glow: pulse }),
        tensorCell(-35, -35, 130, 64, '\u22120.1', ROLE.forward, { glow: pulse }),
        tensorCell(-185, 45, 130, 64, '\u22120.4', ROLE.forward, { glow: pulse }),
        tensorCell(-35, 45, 130, 64, '0.3', ROLE.forward, { glow: pulse }),
        txt('float32  [B, 2]', -110, 128, 28, ROLE.forward, 'mono'),

        arrow([70, 5], [200, 5], { stroke: ROLE.grad, width: 4 }).glow(8, ROLE.grad),

        // Long targets [B]
        txt('Class Index y', 350, -120, 28, ROLE.grad, 'sans'),
        tensorCell(350, -35, 140, 64, '1', ROLE.grad, { glow: pulse }),
        tensorCell(350, 45, 140, 64, '0', ROLE.grad, { glow: pulse }),
        txt('int64 (long)  [B]', 350, 128, 28, ROLE.grad, 'mono'),

        // Invalid vs soft contrast below
        rule(-855, 215, 845, 215, '#2b3a60', 2),
        txt('WRONG FOR HARD LABELS:', -855, 275, 26, ROLE.stale, 'mono', 'left'),
        txt(
          'y shaped [B, 1] or float index vector -> contract error',
          -425,
          275,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ),
        txt('SOFT-TARGET CONTRACT:', -855, 345, 26, ROLE.momentum, 'mono', 'left'),
        txt(
          'Full float distribution [B, C] (PyTorch does not validate row sums)',
          -425,
          345,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ),
      ];
      if (b0 > 0.1) {
        nodes.push(
          txt('1D long vector matches [B, C] logits', 350, 174, 26, ROLE.escalate, 'sans').opacity(
            b0,
          ),
        );
      }
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 1): Log-sum-exp numerical stability vs double softmax
  const view2 = guardedDynamic(
    () => Math.min(fadeIn(b1P.value), fadeOut(b2P.value)),
    (vis) => {
      const exactLoss = Math.log(1 + Math.exp(-3));
      const nodes = [
        txt('PASS RAW LOGITS TO CROSS ENTROPY', -855, -205, 28, ROLE.grad, 'mono', 'left'),
        // Raw logits -> max subtraction -> stable loss
        tensorCell(-615, -90, 470, 74, 'logits [2, -1]  y=0', ROLE.forward, { size: 27 }),
        arrow([-368, -90], [-282, -90], { stroke: ROLE.forward, width: 4 }).glow(8, ROLE.forward),
        tensorCell(-15, -90, 510, 74, 'max-shift: [0, -3]', ROLE.grad, { size: 27 }),
        arrow([252, -90], [338, -90], { stroke: ROLE.escalate, width: 4 }).glow(8, ROLE.escalate),
        tensorCell(595, -90, 480, 74, `loss = ${exactLoss.toFixed(6)}`, ROLE.escalate, {
          size: 28,
          glow: 10,
        }),

        glowTex(
          String.raw`\mathcal{L}(z, y) = -z_y + m + \ln\!\sum_{k} e^{z_k - m}, \qquad m = \max_k z_k`,
          { x: 0, y: 55, size: 42, color: ROLE.grad, glow: 6 },
        ),

        rule(-855, 165, 845, 165, '#2b3a60', 2),
        txt('TWO SILENT TRAPS', -855, 225, 26, ROLE.stale, 'mono', 'left'),
        txt(
          '1. log(softmax(z)) separately -> underflowed probability turns into -Inf',
          -855,
          285,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ),
        txt(
          '2. CrossEntropyLoss(softmax(z), y) -> applies log-softmax TWICE, changing the objective',
          -855,
          345,
          28,
          ROLE.stale,
          'sans',
          'left',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  // View 3 (Beat 2): Non-overlapping crossfaded synchronized shared shuffle
  const view3 = guardedDynamic(
    () => fadeIn(b2P.value),
    (vis) => {
      const sh = shufP.value;
      const perm = [3, 0, 5, 1, 4, 2];
      const beforeAlpha = fadeOut(sh);
      const afterAlpha = fadeIn(sh);
      const showAfter = afterAlpha > 0.02;
      const rowAlpha = showAfter ? afterAlpha : beforeAlpha;
      const order = showAfter ? perm : [0, 1, 2, 3, 4, 5];

      const nodes = [
        txt(
          showAfter
            ? 'SHARED SHUFFLE APPLIED (ROWS STAY PAIRED)'
            : 'ONE SHARED SHUFFLE OWNS X AND y',
          -855,
          -215,
          28,
          showAfter ? ROLE.escalate : ROLE.forward,
          'mono',
          'left',
        ),
      ];

      if (rowAlpha > 0.02) {
        order.forEach((origIdx, slot) => {
          const row = TENSOR_ROWS[origIdx];
          const cy = -125 + slot * 84;
          const col = row.label === 1 ? ROLE.escalate : ROLE.standard;
          nodes.push(
            group(
              line([-665, cy], [-495, cy], { stroke: col, width: 2.2 }).opacity(0.7),
              line([-145, cy], [65, cy], { stroke: col, width: 2.2 }).opacity(0.7),
              tensorCell(-745, cy, 150, 58, `ID ${row.id}`, COSMOS.ink, { size: 26, glow: 4 }),
              tensorCell(
                -320,
                cy,
                340,
                58,
                `[${row.urgency.toFixed(1)}, ${row.severity.toFixed(1)}]`,
                ROLE.forward,
                { size: 28, glow: 6 },
              ),
              tensorCell(240, cy, 340, 58, `target ${row.label} (${row.route})`, col, {
                size: 26,
                glow: 7,
              }),
            ).opacity(rowAlpha),
          );
        });
      }

      nodes.push(
        txt(
          'Print & decode one batch first: a falling loss cannot detect mismatched targets',
          -855,
          395,
          28,
          ROLE.grad,
          'serif',
          'left',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2, view3);
  cueTo(s, c, 'loss-contract-beat-0', b0P, 1, { dur: 0.7 });
  cueTo(s, c, 'loss-contract-beat-1', b1P, 1, { dur: 0.8 });
  cueTo(s, c, 'loss-contract-beat-2', b2P, 1, { dur: 0.8 });
  cueTo(s, c, 'loop-shuffle', shufP, 1, { dur: 1.05 });
}

// ---------------------------------------------------------------------------
// 4. scores: Raw scores become a classification loss
// Cues: scores-beat-1-focus-1, scores-beat-1-focus-2, scores-beat-2-focus-1, scores-beat-2-focus-2
// ---------------------------------------------------------------------------
export function scores(s, c) {
  const headP = s.value(0);
  const selectP = s.value(0);
  const ticket1P = s.value(0);
  const meanP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.forward, seed: 4 }));
  s.add(decorAura(-440, 20, 460, '#60a5fa1e', '#07091000'));
  s.add(decorAura(440, 20, 460, '#6ee7b71e', '#07091000'));

  const headline = heroTitle(['From Raw Logits', 'to Batch Loss'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.forward,
    eyebrow: 'SOFTMAX PROBABILITIES -> NEGATIVE LOG-LIKELIHOOD',
  });

  const live = dynamic(() => {
    const hd = headP.value;
    const sl = selectP.value;
    const t1 = ticket1P.value;
    const mn = meanP.value;
    const nodes = [];

    const tickets = [
      {
        name: 'TICKET A · TARGET: STANDARD (0)',
        x0: -835,
        logits: SCORE_FIXTURE.raw[0],
        probs: SCORE_FIXTURE.probs[0],
        target: 0,
        loss: SCORE_FIXTURE.losses[0],
        accent: ROLE.standard,
        fillP: Math.max(0.25, hd),
      },
      {
        name: 'TICKET B · TARGET: ESCALATE (1)',
        x0: 85,
        logits: SCORE_FIXTURE.raw[1],
        probs: SCORE_FIXTURE.probs[1],
        target: 1,
        loss: SCORE_FIXTURE.losses[1],
        accent: ROLE.escalate,
        fillP: Math.max(0.25, t1),
      },
    ];

    for (const tk of tickets) {
      const cx = tk.x0 + 365;
      nodes.push(
        txt(tk.name, tk.x0, -210, 26, tk.accent, 'mono', 'left'),
        txt(
          `raw logits:  [${signed(tk.logits[0], 1)},  ${signed(tk.logits[1], 1)}]`,
          tk.x0,
          -155,
          30,
          COSMOS.ink,
          'mono',
          'left',
        ),
      );

      // Two probability bars: Standard and Escalate
      const barLabels = ['Standard (0)', 'Escalate (1)'];
      const barColors = [ROLE.standard, ROLE.escalate];
      for (let k = 0; k < 2; k++) {
        const by = -60 + k * 92;
        const isTarget = k === tk.target;
        const barW = tk.probs[k] * 470 * tk.fillP;
        const pulse = isTarget && sl > 0.2 ? 12 : 6;
        nodes.push(
          txt(barLabels[k], tk.x0, by, 26, isTarget ? barColors[k] : COSMOS.muted, 'sans', 'left'),
          scaleTrack(tk.x0 + 185, by, 470, 44, {
            stroke: isTarget ? barColors[k] : '#2b3c60',
            fill: '#0d1427',
            radius: 10,
          }),
          glowBar(tk.x0 + 185, by, barW, 36, barColors[k], {
            glow: pulse,
            opacity: isTarget ? 1 : 0.55,
          }),
          txt(
            `p = ${(tk.probs[k] * tk.fillP).toFixed(3)}`,
            tk.x0 + 675,
            by,
            26,
            isTarget ? barColors[k] : COSMOS.muted,
            'mono',
            'left',
          ),
        );
      }

      // Target loss bar
      const lossVal = tk.loss;
      const lossBarW = (lossVal / 0.16) * 440 * Math.max(0.2, sl);
      nodes.push(
        txt(
          `Target loss:  -ln(${tk.probs[tk.target].toFixed(3)}) = ${lossVal.toFixed(4)}`,
          cx,
          140,
          28,
          ROLE.grad,
          'mono',
        ),
        scaleTrack(tk.x0 + 145, 200, 440, 32, { stroke: '#4d4124', fill: '#121523', radius: 8 }),
        glowBar(tk.x0 + 145, 200, lossBarW, 24, ROLE.grad, { glow: 9 }),
      );
    }

    // Bottom batch mean equation
    if (mn > 0.05) {
      nodes.push(
        group(
          rule(-835, 275, 835, 275, '#2b3a60', 2),
          glowTex(
            String.raw`\overline{L} = \frac{${SCORE_FIXTURE.losses[0].toFixed(4)} + ${SCORE_FIXTURE.losses[1].toFixed(4)}}{2} \approx ${SCORE_FIXTURE.meanLoss.toFixed(4)}`,
            { x: 0, y: 360, size: 46, color: ROLE.escalate, glow: 8 },
          ),
        ).opacity(mn),
      );
    } else {
      nodes.push(
        txt(
          'Closer logits -> lower target probability -> larger cross-entropy loss',
          0,
          355,
          30,
          COSMOS.muted,
          'serif',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'scores-beat-1-focus-1', headP, 1, { dur: 0.85 });
  cueTo(s, c, 'scores-beat-1-focus-2', selectP, 1, { dur: 0.7 });
  cueTo(s, c, 'scores-beat-2-focus-1', ticket1P, 1, { dur: 0.85 });
  cueTo(s, c, 'scores-beat-2-focus-2', meanP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 5. phases: Two tickets, one weight update (Signature 2x2 Matrix + 3D Loss Basin!)
// Cues: phases-inputs, phases-loss, phases-contrib-a, phases-contrib-b,
//       phases-written, phases-weights-still-zero, phases-beat-3-focus-1, phases-rescore
// ---------------------------------------------------------------------------
export function phases(s, c) {
  const inputsP = s.value(0);
  const lossP = s.value(0);
  const contribAP = s.value(0);
  const contribBP = s.value(0);
  const writtenP = s.value(0);
  const stillZeroP = s.value(0);
  const stepP = s.value(0);
  const rescoreP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.escalate, seed: 5 }));
  s.add(decorAura(-420, 40, 460, '#ffd16618', '#07091000'));
  s.add(decorAura(500, 20, 460, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Two Tickets,', 'One Weight Update'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.escalate,
    eyebrow: 'W STAYS ZERO DURING BACKWARD · ONLY SGD MOVES IT',
  });

  // Right-side orbiting 3D Cross-Entropy loss surface L(w_urg, w_sev) for escalation weight
  const view3d = cinematic3d({
    theta: -0.76,
    phi: 1.06,
    distance: 15.6,
    unit: 92,
    focus: [0, 0, 0.95],
  }).at(525, 25);

  const floor = gridPlane3d({
    x: [-2.4, 2.4],
    y: [-2.4, 2.4],
    z: 0,
    step: 0.8,
    color: '#25355c',
    opacity: 0.45,
  });

  const lossVal3d = (u, v) => {
    const wu = u * 0.28;
    const wv = v * 0.28;
    const margin = 2 * (wu + wv);
    const ce = Math.log(1 + Math.exp(-margin));
    return Math.min(2.8, 0.35 + ce * 1.15);
  };

  const lossSurf = surface(lossVal3d, {
    x: [-2.4, 2.4],
    y: [-2.4, 2.4],
    resolution: [18, 18],
    colors: [ROLE.escalate, ROLE.forward, ROLE.grad, ROLE.stale],
    mesh: '#6d88c4',
    opacity: 0.74,
  });

  // Descent curve along the diagonal from (0, 0) down to (w1, w1)
  const descentPath = curve3d(
    (t) => {
      const u = t * 1.45;
      return [u, u, lossVal3d(u, u) + 0.08];
    },
    0,
    1,
    { samples: 36, color: ROLE.escalate, width: 4.5, glow: 10, blend: 'screen' },
  );

  // Moving parameter marker: pinned at (0, 0) through backward, glides downhill on SGD step
  const paramBead = point3d(
    () => {
      const u = stepP.value * 0.95;
      return [u, u, lossVal3d(u, u) + 0.14];
    },
    { color: ROLE.grad, radius: 8.5, glow: 16, blend: 'screen' },
  );

  view3d.add(floor, lossSurf, descentPath, paramBead);

  const leftPanel = dynamic(() => {
    const inp = inputsP.value;
    const ls = lossP.value;
    const ca = contribAP.value;
    const cb = contribBP.value;
    const wr = writtenP.value;
    const sz = stillZeroP.value;
    const st = stepP.value;
    const rs = rescoreP.value;
    const nodes = [];

    // Top-left ticket pair and derivative contributions
    nodes.push(
      txt('A: [+1, +1] -> escalate', -855, -225, 28, ROLE.escalate, 'mono', 'left').opacity(
        Math.max(0.65, inp),
      ),
      txt(
        'B: [\u22121, \u22121] -> standard',
        -365,
        -225,
        28,
        ROLE.standard,
        'mono',
        'left',
      ).opacity(Math.max(0.65, inp)),
    );

    if (ca > 0.05) {
      nodes.push(
        txt('A: (0.5 \u2212 1)(+1) = \u22120.5', -855, -172, 26, ROLE.grad, 'mono', 'left').opacity(
          ca,
        ),
      );
    }
    if (cb > 0.05) {
      nodes.push(
        txt(
          'B: (0.5 \u2212 0)(\u22121) = \u22120.5',
          -365,
          -172,
          26,
          ROLE.grad,
          'mono',
          'left',
        ).opacity(cb),
      );
    }

    // Side-by-side 2x2 matrices: W and W.grad
    const wCur = STEP_ONE.updated.map((row) => row.map((v) => v * st));
    const gCur = STEP_ONE.gradient;
    const drawMat = (title, xLeft, yTop, vals, col, highlightEscUrg, filled) => {
      nodes.push(
        txt(title, xLeft + 155, yTop - 78, 30, col, 'mono'),
        txt('Urg', xLeft + 75, yTop - 38, 26, COSMOS.muted, 'mono'),
        txt('Sev', xLeft + 235, yTop - 38, 26, COSMOS.muted, 'mono'),
        txt('Std', xLeft - 45, yTop + 34, 26, ROLE.standard, 'mono', 'right'),
        txt('Esc', xLeft - 45, yTop + 122, 26, ROLE.escalate, 'mono', 'right'),
      );
      for (let r = 0; r < 2; r++) {
        for (let k = 0; k < 2; k++) {
          const isHi = highlightEscUrg && r === 1 && k === 0;
          const cellCol = isHi ? ROLE.grad : col;
          const str = filled ? signed(vals[r][k], 2) : '\u00b7';
          const pulse = isHi ? 12 : filled ? 6 : 2;
          nodes.push(
            tensorCell(xLeft + 75 + k * 160, yTop + 34 + r * 88, 146, 74, str, cellCol, {
              size: 32,
              glow: pulse,
            }),
          );
        }
      }
    };

    drawMat(
      sz > 0.2 && st < 0.05 ? 'Weights W (still 0!)' : 'Weights W',
      -745,
      -20,
      wCur,
      st > 0.1 ? ROLE.escalate : ROLE.forward,
      false,
      true,
    );
    drawMat(
      'Buffer W.grad',
      -235,
      -20,
      gCur,
      wr > 0.2 ? ROLE.grad : COSMOS.dim,
      wr > 0.2,
      wr > 0.2,
    );

    // Live loss and ticket A rescore readout
    const scoredA = scoreTicket(wCur, FEATURES[0]);
    const scoredB = scoreTicket(wCur, FEATURES[1]);
    const liveLoss =
      (-Math.log(stableSoftmax(scoredA.logits)[LABELS[0]]) -
        Math.log(stableSoftmax(scoredB.logits)[LABELS[1]])) /
      2;

    nodes.push(
      rule(-855, 220, 120, 220, '#2b3a60', 2),
      txt(
        `Mean loss: ${liveLoss.toFixed(4)} nats`,
        -855,
        275,
        30,
        ls > 0.2 ? ROLE.forward : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        `A logits: [${signed(scoredA.logits[0], 2)}, ${signed(scoredA.logits[1], 2)}]   gap ${signed(scoredA.gap, 2)}`,
        -855,
        335,
        30,
        rs > 0.2 ? ROLE.escalate : COSMOS.ink,
        'mono',
        'left',
      ).glow(rs > 0.2 ? 8 : 0, ROLE.escalate),
      txt(
        st > 0.2
          ? 'W1 = W0 - 0.2 * W.grad'
          : wr > 0.2
            ? 'loss.backward() wrote mean -0.5'
            : 'forward() at W = 0',
        -855,
        395,
        28,
        ROLE.grad,
        'mono',
        'left',
      ),
      txt('3D LOSS SURFACE L(w_urg, w_sev)', 525, 365, 26, COSMOS.muted, 'mono'),
    );

    return group(...nodes);
  });

  s.add(headline, view3d, leftPanel);
  orbitScene(s, c, view3d, { theta: -0.34, phi: 0.96 });
  cueTo(s, c, 'phases-inputs', inputsP, 1, { dur: 0.65 });
  cueTo(s, c, 'phases-loss', lossP, 1, { dur: 0.65 });
  cueTo(s, c, 'phases-contrib-a', contribAP, 1, { dur: 0.6 });
  cueTo(s, c, 'phases-contrib-b', contribBP, 1, { dur: 0.6 });
  cueTo(s, c, 'phases-written', writtenP, 1, { dur: 0.65 });
  cueTo(s, c, 'phases-weights-still-zero', stillZeroP, 1, { dur: 0.55 });
  cueTo(s, c, 'phases-beat-3-focus-1', stepP, 1, { dur: 0.9 });
  cueTo(s, c, 'phases-rescore', rescoreP, 1, { dur: 0.65 });
}
