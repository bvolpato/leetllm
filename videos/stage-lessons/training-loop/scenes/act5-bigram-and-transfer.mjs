// Act 5 (Scenes 21-26): Bigram Character Row & AdamW, Bigram Entropy Floor (3/4 & 1/4 + 108 Pairs),
// Live 1,000-Step Overfitting Curves, Run Receipt Manifest, Transfer Diagnostic Diff,
// and Held-Out Stale vs Cleared Gradient Grand Finale on the Opening Route Ruler.
import { arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  BIGRAM_TOY,
  COSMOS,
  HELD_OUT_CLEARED,
  HELD_OUT_STALE,
  LOOP_BIGRAM,
  LR,
  ROLE,
  STEP_ONE,
  cinemaGrid,
  clamp01,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  glowBar,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  mix,
  neonCurve,
  routeRulerNodes,
  rule,
  scaleTrack,
  signed,
  tensorCell,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 21. bigram-state: The same loop can learn one character's next-token row
// Cues: bigram-state-beat-0, bigram-state-beat-1, bigram-state-beat-2,
//       loop-adam-moments, loop-adam-denominator
// ---------------------------------------------------------------------------
export function bigramState(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const b2P = s.value(0);
  const adamMomP = s.value(0);
  const adamDenP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.forward, seed: 21 }));
  s.add(decorAura(-440, 0, 480, '#5ce1e61a', '#07091000'));
  s.add(decorAura(450, 20, 480, '#a78bfa1c', '#07091000'));

  const headline = heroTitle(['Same Training Loop:', 'Next-Character Bigram'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.forward,
    eyebrow: 'ONE ROW PER INPUT CHAR · V x V LOGIT TABLE · ADAMW',
  });

  // View 1 (Beats 0-1): Character pair stream -> selected logit row -> gradient = p - one_hot
  const view1 = guardedDynamic(
    () => fadeOut(b2P.value),
    (vis) => {
      const b0 = b0P.value;
      const b1 = b1P.value;
      const nodes = [];

      // Left: "the" token tiles -> adjacent pairs
      nodes.push(
        txt('ADJACENT CHARACTER PAIRS', -855, -205, 26, ROLE.standard, 'mono', 'left'),
        tensorCell(-740, -100, 120, 88, 't', ROLE.forward, { size: 42, glow: 9 }),
        tensorCell(-590, -100, 120, 88, 'h', ROLE.escalate, { size: 42, glow: 9 }),
        tensorCell(-440, -100, 120, 88, 'e', ROLE.grad, { size: 42, glow: 7 }),
        txt('t -> h     ·     h -> e', -590, -4, 30, ROLE.forward, 'mono'),
        arrow([-320, -100], [-145, -100], { stroke: ROLE.forward, width: 4.5 }).glow(
          8,
          ROLE.forward,
        ),
      );

      // Right: 3x3 slice of the V x V logit table (row 't' illuminated)
      const cols = ['t', 'h', 'e'];
      const tx0 = 110;
      const ty0 = -150;
      nodes.push(
        txt('LOGIT TABLE (V x V)', tx0 + 205, -262, 26, ROLE.forward, 'mono'),
        txt('next: t', tx0 + 45, -216, 26, COSMOS.muted, 'mono'),
        txt('next: h', tx0 + 205, -216, 26, ROLE.escalate, 'mono'),
        txt('next: e', tx0 + 365, -216, 26, COSMOS.muted, 'mono'),
      );
      cols.forEach((ch, r) => {
        const cy = ty0 + r * 92;
        const isSelected = r === 0;
        nodes.push(
          txt(`in '${ch}'`, tx0 - 85, cy, 28, isSelected ? ROLE.grad : COSMOS.dim, 'mono', 'right'),
        );
        for (let k = 0; k < 3; k++) {
          const isTarget = isSelected && k === 1;
          const cellVal = b1 > 0.3 && isSelected ? (isTarget ? '+up' : '-dn') : '0.0';
          const col = isTarget && b1 > 0.3 ? ROLE.escalate : isSelected ? ROLE.grad : COSMOS.dim;
          const pulse = isSelected ? 8 : 1;
          nodes.push(
            tensorCell(tx0 + 45 + k * 160, cy, 140, 72, cellVal, col, {
              size: 28,
              glow: pulse,
              opacity: isSelected ? 1 : 0.42,
            }),
          );
        }
      });

      // Bottom equation
      nodes.push(
        rule(-855, 165, 845, 165, '#2b3a60', 2),
        glowTex(
          b1 > 0.2
            ? String.raw`\frac{\partial \mathcal{L}}{\partial z_{\text{row}}} = p - \mathbf{1}_{\text{target}}`
            : String.raw`z_0 = 0 \implies p_k = \frac{1}{V} \;\;(\text{uniform start})`,
          { x: 0, y: 265, size: 44, color: b1 > 0.2 ? ROLE.grad : ROLE.forward, glow: 7 },
        ).opacity(Math.max(0.7, b0)),
        txt(
          b1 > 0.2
            ? 'Raises true successor logit, lowers competitors; untouched rows get zero gradient'
            : 'Conditions strictly on one current character, not earlier sentence context',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Two Vocabularies (V=21 vs V=16) + AdamW Per-Coordinate Moments
  const view2 = guardedDynamic(
    () => fadeIn(b2P.value),
    (vis) => {
      const am = adamMomP.value;
      const ad = adamDenP.value;
      const nodes = [
        txt('TWO DECLARED VOCABULARIES', -855, -205, 26, ROLE.forward, 'mono', 'left'),
        tensorCell(
          -445,
          -105,
          790,
          82,
          `Plain Python: V = 21  ->  ln(21) = ${Math.log(21).toFixed(3)}`,
          ROLE.forward,
          { size: 28, glow: 8 },
        ),
        tensorCell(
          445,
          -105,
          810,
          82,
          `PyTorch: V=16  ln(16)=${Math.log(16).toFixed(3)}  (256 params)`,
          ROLE.momentum,
          { size: 27, glow: 9 },
        ),

        rule(-855, 0, 845, 0, '#2b3a60', 2),
        txt(
          'ADAMW PER-COORDINATE ADAPTIVE STEP (WEIGHT DECAY = 0 HERE)',
          -855,
          55,
          26,
          ROLE.grad,
          'mono',
          'left',
        ),
        glowTex(
          String.raw`m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t, \qquad v_t = \beta_2 v_{t-1} + (1-\beta_2) g_t^2`,
          { x: 0, y: 145, size: 36, color: ROLE.grad, glow: am > 0.2 ? 8 : 3 },
        ).opacity(Math.max(0.45, am)),
        glowTex(
          String.raw`\Delta \theta_t = -\eta \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \varepsilon}`,
          { x: 0, y: 265, size: 44, color: ROLE.escalate, glow: ad > 0.2 ? 9 : 3 },
        ).opacity(Math.max(0.35, ad)),
        txt(
          'AdamW applies weight decay separately; coordinate correlations can still slow descent',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  cueTo(s, c, 'bigram-state-beat-0', b0P, 1, { dur: 0.7 });
  cueTo(s, c, 'bigram-state-beat-1', b1P, 1, { dur: 0.7 });
  cueTo(s, c, 'bigram-state-beat-2', b2P, 1, { dur: 0.85 });
  cueTo(s, c, 'loop-adam-moments', adamMomP, 1, { dur: 0.7 });
  cueTo(s, c, 'loop-adam-denominator', adamDenP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 22. bigram-floor: How low can this row's loss go?
// Cues: bigram-floor-beat-0, bigram-floor-beat-1, loop-entropy-floor,
//       bigram-floor-beat-2, bigram-training-losses
// ---------------------------------------------------------------------------
export function bigramFloor(s, c) {
  const obsP = s.value(0);
  const sharesP = s.value(0);
  const floorP = s.value(0);
  const pairsP = s.value(0);
  const runsP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.grad, seed: 22 }));
  s.add(decorAura(-420, 0, 480, '#5ce1e61a', '#07091000'));
  s.add(decorAura(420, 40, 480, '#ff6b8b1a', '#07091000'));

  const headline = heroTitle(['Positive Conditional', 'Entropy Floor'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.grad,
    eyebrow: 'CONFLICTING SUCCESSORS SET A HARD LOSS LIMIT',
  });

  // View 1 (Beats 0-1): [a, a, a, b] tiles fusing into 3/4 + 1/4 empirical distribution
  const view1 = guardedDynamic(
    () => fadeOut(pairsP.value),
    (vis) => {
      const ob = obsP.value;
      const sh = sharesP.value;
      const fl = floorP.value;
      const nodes = [];

      const x0 = -640;
      const totalW = 1280;
      const slotW = totalW / 4;
      const tileY = mix(-60, 0, sh);

      nodes.push(
        txt(
          'FOUR OBSERVED SUCCESSORS AFTER THE SAME INPUT CHAR',
          -855,
          -205,
          28,
          ROLE.forward,
          'mono',
          'left',
        ),
      );

      BIGRAM_TOY.obs.forEach((ch, i) => {
        const gap = mix(22, 2, sh);
        const col = ch === 'a' ? ROLE.forward : ROLE.stale;
        const cx = x0 + (i + 0.5) * slotW;
        nodes.push(
          rect(slotW - gap, 128, {
            fill: '#101d35',
            stroke: col,
            width: 3,
            radius: mix(14, 4, sh),
          })
            .at(cx, tileY)
            .glow(ob > 0.2 ? 9 : 4, col),
          txt(ch, cx, tileY, 54, col, 'mono'),
        );
      });

      if (sh > 0.1) {
        nodes.push(
          txt('P(a) = 3/4 = 0.75', x0 + 1.5 * slotW, tileY + 115, 36, ROLE.forward, 'mono').opacity(
            sh,
          ),
          txt('P(b) = 1/4 = 0.25', x0 + 3.5 * slotW, tileY + 115, 36, ROLE.stale, 'mono').opacity(
            sh,
          ),
        );
      } else {
        nodes.push(
          txt(
            'Prediction: how should this row split probability between A and B?',
            0,
            tileY + 135,
            32,
            ROLE.grad,
            'serif',
          ),
        );
      }

      if (fl > 0.1) {
        nodes.push(
          glowTex(
            String.raw`H = -\frac{3\ln(3/4) + \ln(1/4)}{4} \approx ${BIGRAM_TOY.floor.toFixed(3)}\;\text{nats}`,
            { x: 0, y: 290, size: 44, color: ROLE.grad, glow: 8 },
          ).opacity(fl),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): All 108 Training Pairs Floor (1.015) vs Plain Python (1.033) & PyTorch (1.019)
  const view2 = guardedDynamic(
    () => fadeIn(pairsP.value),
    (vis) => {
      const rn = runsP.value;
      const pyLoss = LOOP_BIGRAM.history.at(-1).train;
      const torchLoss = 1.019;
      const floorVal = LOOP_BIGRAM.floor;
      const bx = -220;
      const maxBarW = 860;
      const wOf = (v) => (v / 1.2) * maxBarW;

      const rows = [
        { label: 'Theoretical floor (108 pairs)', val: floorVal, col: ROLE.grad, show: true },
        { label: 'Plain Python (1,000 steps)', val: pyLoss, col: ROLE.forward, show: rn > 0.1 },
        { label: 'PyTorch AdamW (200 steps)', val: torchLoss, col: ROLE.stale, show: rn > 0.1 },
      ];

      const nodes = [
        txt(
          '108 TRAINING PAIRS · MEAN LOSS (NATS PER PAIR)',
          -855,
          -205,
          28,
          ROLE.grad,
          'mono',
          'left',
        ),
      ];

      rows.forEach((row, i) => {
        const cy = -60 + i * 130;
        const barW = row.show ? wOf(row.val) : 30;
        nodes.push(
          txt(row.label, -855, cy, 30, row.col, 'sans', 'left'),
          scaleTrack(bx, cy, maxBarW, 52, { stroke: '#324670', fill: '#0d1427', radius: 12 }),
          glowBar(bx, cy, barW, 42, row.col, {
            glow: row.show ? 10 : 2,
            opacity: row.show ? 1 : 0.35,
          }),
          txt(
            row.show ? row.val.toFixed(3) : '?',
            bx + maxBarW + 40,
            cy,
            34,
            row.col,
            'mono',
            'left',
          ),
        );
      });

      nodes.push(
        txt(
          'Score the FULL set at fixed weights to compare against the entropy floor',
          0,
          340,
          30,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  cueTo(s, c, 'bigram-floor-beat-0', obsP, 1, { dur: 0.7 });
  cueTo(s, c, 'bigram-floor-beat-1', sharesP, 1, { after: true, dur: 0.8 });
  cueTo(s, c, 'loop-entropy-floor', floorP, 1, { after: true, dur: 0.7 });
  cueTo(s, c, 'bigram-floor-beat-2', pairsP, 1, { after: true, dur: 0.85 });
  cueTo(s, c, 'bigram-training-losses', runsP, 1, { after: true, dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 23. bigram-selection: Which character table would you keep?
// Cues: bigram-early, bigram-late, bigram-compare, bigram-pick*, bigram-unseen, bigram-sample
// ---------------------------------------------------------------------------
export function bigramSelection(s, c) {
  const earlyP = s.value(0);
  const lateP = s.value(0);
  const compareP = s.value(0);
  const pickP = s.value(0);
  const unseenP = s.value(0);
  const sampleP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.stale, seed: 23 }));
  s.add(decorAura(-300, 0, 520, '#5ce1e61a', '#07091000'));
  s.add(decorAura(350, 20, 520, '#ff6b8b1c', '#07091000'));

  const headline = heroTitle(['Overfitting Unfolds:', 'Keep the Val Minimum'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.stale,
    eyebrow: '108 TRAIN PAIRS vs 75 HELD-OUT VALIDATION PAIRS',
  });

  const bestRow = LOOP_BIGRAM.history[LOOP_BIGRAM.bestStep]; // step 111
  const lastRow = LOOP_BIGRAM.history.at(-1); // step 1000

  const live = dynamic(() => {
    const ea = earlyP.value;
    const lt = lateP.value;
    const cm = compareP.value;
    const pk = pickP.value;
    const un = unseenP.value;
    const sp = sampleP.value;
    const nodes = [];

    const curStep = Math.round(bestRow.step * ea + (lastRow.step - bestRow.step) * lt);

    // Left live loss chart (x: 0..1000, y: 0.9..3.15)
    const gx0 = -810;
    const gx1 = 170;
    const gy0 = -195;
    const gy1 = 235;
    const xOf = (step) => mix(gx0, gx1, step / 1000);
    const yOf = (loss) => mix(gy1, gy0, clamp01((loss - 0.9) / 2.25));

    nodes.push(
      txt('MEAN LOSS (NATS / PAIR)', gx0, gy0 - 44, 26, COSMOS.muted, 'mono', 'left'),
      line([gx0, gy1], [gx1, gy1], { stroke: '#3a4e7c', width: 2.5 }),
      line([gx0, gy0], [gx0, gy1], { stroke: '#3a4e7c', width: 2.5 }),
      // Entropy floor dashed guide at 1.015
      line([gx0, yOf(LOOP_BIGRAM.floor)], [gx1, yOf(LOOP_BIGRAM.floor)], {
        stroke: ROLE.grad,
        width: 2,
        dash: [8, 8],
      }).opacity(0.65),
      txt('floor 1.015', gx1 + 18, yOf(LOOP_BIGRAM.floor), 26, ROLE.grad, 'mono', 'left'),
    );

    for (const xt of [0, 250, 500, 750, 1000]) {
      nodes.push(txt(String(xt), xOf(xt), gy1 + 36, 26, COSMOS.muted, 'mono'));
    }
    for (const yt of [1, 2, 3]) {
      nodes.push(txt(yt.toFixed(0), gx0 - 34, yOf(yt), 26, COSMOS.muted, 'mono'));
    }

    // Build train & val polylines up to curStep
    const maxK = Math.max(2, curStep);
    const trainPts = [];
    const valPts = [];
    const stride = maxK > 200 ? 8 : 2;
    for (let k = 0; k <= maxK; k += stride) {
      trainPts.push([xOf(k), yOf(LOOP_BIGRAM.history[k].train)]);
      valPts.push([xOf(k), yOf(LOOP_BIGRAM.history[k].validation)]);
    }
    if (trainPts.at(-1)[0] !== xOf(maxK)) {
      trainPts.push([xOf(maxK), yOf(LOOP_BIGRAM.history[maxK].train)]);
      valPts.push([xOf(maxK), yOf(LOOP_BIGRAM.history[maxK].validation)]);
    }

    nodes.push(
      neonCurve(trainPts, [ROLE.forward, ROLE.escalate], { width: 4.5, glow: 10 }),
      neonCurve(valPts, [ROLE.stale, ROLE.warn], { width: 4.5, glow: 10 }),
      glowDot(xOf(curStep), yOf(LOOP_BIGRAM.history[curStep].train), {
        radius: 8,
        color: ROLE.forward,
        glow: 12,
      }),
      glowDot(xOf(curStep), yOf(LOOP_BIGRAM.history[curStep].validation), {
        radius: 8,
        color: ROLE.stale,
        glow: 12,
      }),
    );

    // Candidate dots at 111 and 1000
    if (curStep >= bestRow.step) {
      const bx = xOf(bestRow.step);
      const by = yOf(bestRow.validation);
      const col = pk > 0.2 ? ROLE.grad : ROLE.stale;
      const rad = pk > 0.2 ? 14 : 11;
      nodes.push(
        glowDot(bx, by, { radius: rad, color: col, glow: 14 }),
        txt('111', bx + 28, by - 42, 28, col, 'mono', 'left'),
      );
    }
    if (curStep >= lastRow.step) {
      const lx = xOf(lastRow.step);
      const ly = yOf(lastRow.validation);
      nodes.push(
        glowDot(lx, ly, { radius: 11, color: ROLE.stale, glow: 12 }),
        txt('1000', lx - 24, ly - 30, 28, ROLE.stale, 'mono', 'right'),
      );
    }

    // Right readout column
    const rx = 385;
    nodes.push(
      txt('VALIDATION CANDIDATES', rx, -195, 26, ROLE.stale, 'mono', 'left'),
      tensorCell(
        rx + 235,
        -105,
        470,
        84,
        `Step 111:  ${curStep >= bestRow.step ? bestRow.validation.toFixed(3) : '...'}`,
        pk > 0.2 ? ROLE.grad : COSMOS.ink,
        { size: 32, glow: pk > 0.2 ? 14 : cm > 0.2 ? 8 : 4 },
      ),
      tensorCell(
        rx + 235,
        5,
        470,
        84,
        `Step 1000: ${curStep >= lastRow.step ? lastRow.validation.toFixed(3) : '...'}`,
        ROLE.stale,
        { size: 32, glow: cm > 0.2 ? 8 : 4 },
      ),
      txt('TRAINING LOSS', rx, 110, 26, ROLE.forward, 'mono', 'left'),
      txt(
        `${LOOP_BIGRAM.history[curStep].train.toFixed(3)} at update ${curStep}`,
        rx,
        158,
        30,
        ROLE.forward,
        'mono',
        'left',
      ),
    );

    if (un > 0.1) {
      nodes.push(
        txt(
          `${LOOP_BIGRAM.unseen} / ${LOOP_BIGRAM.validationPairs} unseen val pairs`,
          rx,
          230,
          26,
          ROLE.stale,
          'mono',
          'left',
        ).opacity(un),
      );
    }

    // Bottom status / sample line
    const footer =
      sp > 0.1
        ? 'Sample (step 111): "theac. ure se leusthe thesd ..."  |  Use untouched test split!'
        : pk > 0.1
          ? 'Copy step 111 (2.105 nats) before overconfidence drives val loss to 2.392'
          : cm > 0.1
            ? 'Prediction: smaller validation cost is better. Which update do you copy?'
            : 'Watch cyan (train) and rose (validation) descend together, then diverge';
    nodes.push(txt(footer, 0, 360, 28, pk > 0.1 ? ROLE.grad : COSMOS.ink, 'serif'));

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'bigram-early', earlyP, 1, { dur: 1.0 });
  cueTo(s, c, 'bigram-late', lateP, 1, { dur: 1.1 });
  cueTo(s, c, 'bigram-compare', compareP, 1, { dur: 0.65 });
  cueTo(s, c, 'bigram-pick', pickP, 1, { after: true, dur: 0.7 });
  cueTo(s, c, 'bigram-unseen', unseenP, 1, { dur: 0.65 });
  cueTo(s, c, 'bigram-sample', sampleP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 24. run-receipt: Can you reproduce the saved router's decision?
// Cues: run-receipt-beat-0, run-receipt-beat-1, run-receipt-beat-2, receipt-next
// ---------------------------------------------------------------------------
export function runReceipt(s, c) {
  const b0P = s.value(0);
  const b1P = s.value(0);
  const b2P = s.value(0);
  const nextP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.forward, seed: 24 }));
  s.add(decorAura(-420, 0, 480, '#5ce1e61a', '#07091000'));
  s.add(decorAura(420, 20, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['The Run Receipt:', 'Reproduce Every Decision'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.forward,
    eyebrow: 'SCHEMA · FROZEN CHECKPOINT EVAL · RESUME PARITY',
  });

  // View 1 (Beat 0): Checkpoint Manifest
  const view1 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const b0 = b0P.value;
      const entries = [
        ['Model & Optimizer', 'architecture + hyperparameters + state dicts', ROLE.forward],
        ['Feature order', '["urgency", "severity_language"]', ROLE.grad],
        ['Output columns', '0 = standard   |   1 = escalate', ROLE.escalate],
        ['Data & Selection', 'source + split IDs + loss curves + metric', ROLE.momentum],
      ];
      const nodes = [
        txt('MANIFEST: incident-router.pt', -835, -205, 30, COSMOS.ink, 'mono', 'left'),
      ];
      entries.forEach(([k, v, col], i) => {
        const cy = -95 + i * 112;
        nodes.push(
          rule(-835, cy - 52, 835, cy - 52, '#283659', 2),
          txt(k, -835, cy, 30, col, 'mono', 'left'),
          txt(v, -320, cy, 30, COSMOS.ink, i === 1 ? 'mono' : 'sans', 'left').opacity(
            Math.max(0.7, b0),
          ),
        );
      });
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 1): Moving Training Weights vs Frozen Checkpoint Eval
  const view2 = guardedDynamic(
    () => Math.min(fadeIn(b1P.value), fadeOut(b2P.value)),
    (vis) => {
      const xs = [-160, 220, 600];
      const nodes = [
        txt('WEIGHTS SCORING EACH BATCH', -855, -205, 28, ROLE.grad, 'mono', 'left'),

        txt('Training epoch', -835, -55, 32, ROLE.forward, 'sans', 'left'),
        txt('(weights drift)', -835, -12, 26, COSMOS.muted, 'mono', 'left'),

        txt('Checkpoint eval', -835, 155, 32, ROLE.escalate, 'sans', 'left'),
        txt('(frozen snapshot)', -835, 198, 26, COSMOS.muted, 'mono', 'left'),
      ];

      xs.forEach((x, i) => {
        nodes.push(
          txt(`batch ${i + 1}`, x, -135, 26, COSMOS.muted, 'mono'),
          tensorCell(x, -35, 250, 82, `W_${i}`, ROLE.forward, { size: 36, glow: 8 }),
          tensorCell(x, 175, 250, 82, 'saved W', ROLE.escalate, { size: 32, glow: 10 }),
        );
      });

      nodes.push(
        txt(
          'Keep duplicate documents on the SAME side of your train/val/test split',
          0,
          345,
          30,
          COSMOS.ink,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 3 (Beat 2): Reload Parity Verification
  const view3 = guardedDynamic(
    () => fadeIn(b2P.value),
    (vis) => {
      const nx = nextP.value;
      const isNext = nx > 0.4;
      const nodes = [
        txt(
          isNext
            ? 'STEP 2: RESUME BOTH ON SAME NEXT BATCH'
            : 'STEP 1: SCORE SAME TICKET AFTER RELOAD',
          -855,
          -205,
          28,
          isNext ? ROLE.escalate : ROLE.forward,
          'mono',
          'left',
        ),
        tensorCell(
          -450,
          -20,
          560,
          120,
          isNext ? 'Uninterrupted: W_next' : 'Uninterrupted: [z0, z1]',
          ROLE.forward,
          { size: 32, glow: 10 },
        ),
        txt('===', 0, -20, 44, ROLE.escalate, 'mono').glow(10, ROLE.escalate),
        tensorCell(
          450,
          -20,
          560,
          120,
          isNext ? 'Reloaded: W_next' : 'Reloaded: [z0, z1]',
          ROLE.escalate,
          { size: 32, glow: 10 },
        ),
        txt(
          isNext
            ? 'Compare EVERY updated parameter against the uninterrupted run'
            : 'Compare both route scores against saved outputs before resuming',
          0,
          205,
          32,
          COSMOS.ink,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2, view3);
  cueTo(s, c, 'run-receipt-beat-0', b0P, 1, { dur: 0.7 });
  cueTo(s, c, 'run-receipt-beat-1', b1P, 1, { dur: 0.85 });
  cueTo(s, c, 'run-receipt-beat-2', b2P, 1, { dur: 0.85 });
  cueTo(s, c, 'receipt-next', nextP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 25. transfer: Before the next backward call
// Cues: transfer-read, transfer-subtract, transfer-inspect
// ---------------------------------------------------------------------------
export function transfer(s, c) {
  const readP = s.value(0);
  const subP = s.value(0);
  const inspectP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.grad, seed: 25 }));
  s.add(decorAura(-420, 0, 480, '#5ce1e61a', '#07091000'));
  s.add(decorAura(420, 40, 480, '#ffd16618', '#07091000'));

  const headline = heroTitle(['Inspect the Buffer', 'Before Backward'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.grad,
    eyebrow: 'URGENCY COLUMN · CLEAN STEP vs DIAGNOSTIC DIFF',
  });

  const live = dynamic(() => {
    const rd = readP.value;
    const sb = subP.value;
    const ins = inspectP.value;
    const isInspect = ins > 0.45;
    const nodes = [];

    const xs = [-260, 180, 620];
    nodes.push(
      txt('Before backward (.grad)', xs[0], -185, 26, COSMOS.muted, 'mono'),
      txt('After backward (.grad)', xs[1], -185, 26, COSMOS.muted, 'mono'),
      txt('After SGD (weight)', xs[2], -185, 26, COSMOS.muted, 'mono'),
    );

    const rows = [
      {
        name: 'Standard',
        col: ROLE.standard,
        y: -55,
        g: signed(STEP_ONE.gradient[0][0], 2),
        w: signed(STEP_ONE.updated[0][0], 2),
      },
      {
        name: 'Escalate',
        col: ROLE.escalate,
        y: 115,
        g: signed(STEP_ONE.gradient[1][0], 2),
        w: signed(STEP_ONE.updated[1][0], 2),
      },
    ];

    for (const r of rows) {
      nodes.push(
        txt(r.name, -835, r.y, 38, r.col, 'sans', 'left'),
        tensorCell(
          xs[0],
          r.y,
          260,
          86,
          isInspect ? 'g_before ?' : 'empty',
          isInspect ? ROLE.grad : COSMOS.dim,
          {
            size: 30,
            glow: isInspect ? 10 : 3,
          },
        ),
        arrow([xs[0] + 150, r.y], [xs[1] - 150, r.y], { stroke: ROLE.grad, width: 3.5 }),
        tensorCell(xs[1], r.y, 260, 86, isInspect ? 'g_after ?' : r.g, ROLE.grad, {
          size: 34,
          glow: rd > 0.2 ? 9 : 4,
        }),
        arrow([xs[1] + 150, r.y], [xs[2] - 150, r.y], { stroke: ROLE.escalate, width: 3.5 }),
        tensorCell(
          xs[2],
          r.y,
          260,
          86,
          isInspect ? 'W_new ?' : sb > 0.2 ? r.w : '\u00b7',
          isInspect ? ROLE.stale : ROLE.escalate,
          { size: 34, glow: sb > 0.2 ? 11 : 4 },
        ),
      );
    }

    nodes.push(
      rule(-835, 235, 835, 235, '#2b3a60', 2),
      glowTex(
        isInspect
          ? String.raw`\Delta g_{\text{batch}} = g_{\text{after}} - g_{\text{before}}`
          : String.raw`W_1 = W_0 - 0.2 \cdot W.\text{grad}`,
        { x: 0, y: 330, size: 42, color: isInspect ? ROLE.grad : ROLE.escalate, glow: 7 },
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'transfer-read', readP, 1, { dur: 0.7 });
  cueTo(s, c, 'transfer-subtract', subP, 1, { dur: 0.75 });
  cueTo(s, c, 'transfer-inspect', inspectP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 26. fresh-stale-gradient: Route a ticket that was held out (Grand Finale!)
// Cues: fresh-input, fresh-old, fresh-ask, loop-stale-sum*, loop-stale-update*,
//       loop-bad-route*, fresh-bad-logits*, fresh-bad-gap*, fresh-bad-prob*,
//       fresh-rewind, loop-clear-stale, fresh-replay, fresh-fixed-update,
//       loop-fixed-route*, fresh-good-logits*, fresh-good-gap*, fresh-good-prob*,
//       fresh-logistic, fresh-accuracy
// ---------------------------------------------------------------------------
export function freshStaleGradient(s, c) {
  const inputP = s.value(0);
  const oldP = s.value(0);
  const askP = s.value(0);
  const staleSumP = s.value(0);
  const staleUpdP = s.value(0);
  const badRouteP = s.value(0);
  const badLogitsP = s.value(0);
  const badGapP = s.value(0);
  const badProbP = s.value(0);
  const rewindP = s.value(0);
  const clearP = s.value(0);
  const replayP = s.value(0);
  const fixedUpdP = s.value(0);
  const fixedRouteP = s.value(0);
  const goodLogitsP = s.value(0);
  const goodGapP = s.value(0);
  const goodProbP = s.value(0);
  const logisticP = s.value(0);
  const accuracyP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.escalate, seed: 26 }));
  s.add(decorAura(-460, 40, 480, '#60a5fa1e', '#07091000'));
  s.add(decorAura(460, 40, 480, '#6ee7b71e', '#07091000'));

  const headline = heroTitle(['Controlled Replay on', 'the Held-Out Ticket'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.escalate,
    eyebrow: 'HELD-OUT TICKET [1.5, 1.0] · LABEL: ESCALATE · LR = 0.2',
  });

  const fmtPair = (row) => `[${signed(row[0], 1)}, ${signed(row[1], 1)}]`;

  const live = dynamic(() => {
    const inp = inputP.value;
    const old = oldP.value;
    const ak = askP.value;
    const ss = staleSumP.value;
    const su = staleUpdP.value;
    const br = badRouteP.value;
    const bl = badLogitsP.value;
    const bg = badGapP.value;
    const bp = badProbP.value;
    const rw = rewindP.value;
    const cl = clearP.value;
    const rp = replayP.value;
    const fu = fixedUpdP.value;
    const fr = fixedRouteP.value;
    const gl = goodLogitsP.value;
    const gg = goodGapP.value;
    const gp = goodProbP.value;
    const lg = logisticP.value;
    const ac = accuracyP.value;
    const nodes = [];

    const isReplay = rw > 0.35;
    const isCleared = cl > 0.35;
    const trial = isCleared ? HELD_OUT_CLEARED : HELD_OUT_STALE;

    const showSum = isReplay ? fu > 0.05 : ss > 0.1;
    const showUpd = isReplay ? fu > 0.15 : su > 0.1;
    const showRoute = isReplay ? fr > 0.1 : br > 0.1;
    const showLogits = isReplay ? gl > 0.1 : bl > 0.1;
    const showProb = isReplay ? gp > 0.1 : bp > 0.1;

    // Top-right mode pill
    nodes.push(
      tensorCell(
        525,
        -380,
        660,
        66,
        isCleared
          ? 'zero_grad() CLEARED BEFORE BACKWARD'
          : isReplay
            ? 'REWINDING TO W = 0 + OLD BUFFER'
            : 'STALE BUFFER KEPT BEFORE BACKWARD',
        isCleared ? ROLE.escalate : ROLE.stale,
        { size: 26, glow: isCleared || old > 0.2 ? 9 : 4 },
      ),
    );

    // Calculation table (4 clean columns: Old .grad | + Fresh A,B | = Stored .grad | -> New W)
    const xs = [-370, -30, 310, 650];
    const yHead = -225;
    nodes.push(
      txt('Old .grad', xs[0], yHead, 26, ROLE.stale, 'mono'),
      txt('+ Fresh A, B', xs[1], yHead, 26, ROLE.grad, 'mono'),
      txt('= Stored .grad', xs[2], yHead, 26, ROLE.forward, 'mono'),
      txt('-> Weight W1', xs[3], yHead, 26, ROLE.escalate, 'mono'),
    );

    const rowMeta = [
      { label: 'Standard', col: ROLE.standard, y: -140, i: 0 },
      { label: 'Escalate', col: ROLE.escalate, y: -48, i: 1 },
    ];
    for (const r of rowMeta) {
      nodes.push(
        txt(r.label, -855, r.y, 34, r.col, 'sans', 'left').opacity(Math.max(0.7, inp)),
        tensorCell(
          xs[0],
          r.y,
          260,
          68,
          fmtPair(trial.old[r.i]),
          isCleared ? ROLE.escalate : ROLE.stale,
          {
            size: 28,
            glow: old > 0.2 || isCleared ? 7 : 3,
          },
        ),
        tensorCell(xs[1], r.y, 260, 68, fmtPair(trial.current[r.i]), ROLE.grad, {
          size: 28,
          glow: 5,
        }),
        tensorCell(
          xs[2],
          r.y,
          260,
          68,
          showSum ? fmtPair(trial.stored[r.i]) : '?',
          showSum ? ROLE.forward : COSMOS.dim,
          { size: 28, glow: showSum ? 8 : 2 },
        ),
        tensorCell(
          xs[3],
          r.y,
          260,
          68,
          showUpd ? fmtPair(trial.weights[r.i]) : '?',
          showUpd ? r.col : COSMOS.dim,
          { size: 28, glow: showUpd ? 9 : 2 },
        ),
      );
    }

    // Middle-bottom: Shared Route Ruler (-0.6 to +0.6) calling back to Scene 1!
    const marks = [];
    if (bg > 0.05) {
      marks.push({
        gap: HELD_OUT_STALE.gap,
        label: `Stale ${signed(HELD_OUT_STALE.gap, 2)}`,
        color: isReplay ? COSMOS.dim : ROLE.standard,
        hollow: isReplay,
        labelY: 94,
      });
    }
    if (gg > 0.05) {
      marks.push({
        gap: HELD_OUT_CLEARED.gap,
        label: `Cleared ${signed(HELD_OUT_CLEARED.gap, 2)}`,
        color: ROLE.escalate,
        labelY: 94,
      });
    }
    nodes.push(routeRulerNodes(152, marks, { xCenter: 0, halfSpan: 680 }));

    // Bottom score / logistic / accuracy footer (strictly one phase visible at a time)
    const probPct = (trial.probabilities[1] * 100).toFixed(1);
    const routeName = trial.logits[1] > trial.logits[0] ? 'Escalate wins!' : 'Standard wins';
    const verdictLine = showRoute
      ? `${routeName}   ·   logits [${signed(trial.logits[0], 2)}, ${signed(trial.logits[1], 2)}]${
          showProb ? `   ·   P(escalate) = ${probPct}%` : ''
        }`
      : isReplay && rp > 0.1
        ? 'Prediction: after clearing .grad, where will the held-out mark land?'
        : ak > 0.1
          ? 'Prediction: with stale .grad left in place, which queue gets this ticket?'
          : 'Score = (urgency weight * 1.5) + (severity weight * 1.0)';

    nodes.push(
      txt(
        verdictLine,
        0,
        325,
        30,
        showRoute ? (isCleared ? ROLE.escalate : ROLE.standard) : ROLE.grad,
        'mono',
      ),
    );

    if (ac > 0.1) {
      nodes.push(
        txt(
          'Accuracy = correctly routed tickets / total tickets  (on a separate labeled set)',
          0,
          395,
          28,
          ROLE.forward,
          'serif',
        ).opacity(ac),
      );
    } else if (lg > 0.1) {
      nodes.push(
        glowTex(
          String.raw`P(\text{escalate}) = \frac{1}{1 + e^{-\Delta}} : \; 37.8\% \;\to\; 62.2\%`,
          { x: 0, y: 398, size: 36, color: ROLE.escalate, glow: 6 },
        ).opacity(lg),
      );
    } else if (showLogits) {
      nodes.push(
        txt(
          `Standard: ${signed(trial.logits[0], 2)}   ·   Escalate: ${signed(trial.logits[1], 2)}   ·   gap = ${signed(trial.gap, 2)}`,
          0,
          395,
          28,
          COSMOS.muted,
          'mono',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'fresh-input', inputP, 1, { dur: 0.6 });
  cueTo(s, c, 'fresh-old', oldP, 1, { dur: 0.65 });
  cueTo(s, c, 'fresh-ask', askP, 1, { dur: 0.55 });
  cueTo(s, c, 'loop-stale-sum', staleSumP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'loop-stale-update', staleUpdP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'loop-bad-route', badRouteP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'fresh-bad-logits', badLogitsP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'fresh-bad-gap', badGapP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'fresh-bad-prob', badProbP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'fresh-rewind', rewindP, 1, { dur: 0.65 });
  cueTo(s, c, 'loop-clear-stale', clearP, 1, { dur: 0.65 });
  cueTo(s, c, 'fresh-replay', replayP, 1, { dur: 0.55 });
  cueTo(s, c, 'fresh-fixed-update', fixedUpdP, 1, { dur: 0.6 });
  cueTo(s, c, 'loop-fixed-route', fixedRouteP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'fresh-good-logits', goodLogitsP, 1, { after: true, dur: 0.55 });
  cueTo(s, c, 'fresh-good-gap', goodGapP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'fresh-good-prob', goodProbP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'fresh-logistic', logisticP, 1, { dur: 0.65 });
  cueTo(s, c, 'fresh-accuracy', accuracyP, 1, { dur: 0.6 });
}
