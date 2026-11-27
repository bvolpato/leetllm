// Act 3 (Scenes 11-14): Layer Modes vs Autograd Controls, Validation & Checkpoint Aliasing,
// Optimizer Resumption Momentum Fork, and POSIX Atomic Checkpoint Safety.
import { arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  DROPOUT_FIXTURE,
  ROLE,
  checkpointSnapshot,
  cinemaGrid,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  glowBar,
  glowDot,
  guardedDynamic,
  heroTitle,
  loopMomentum,
  measuredValidation,
  mix,
  rule,
  scaleTrack,
  tensorCell,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 11. layer-modes: Layer behavior and graph recording are separate controls
// Cues: layer-modes-beat-0, loop-dropout-train, loop-dropout-eval,
//       layer-modes-beat-1, layer-modes-beat-2
// ---------------------------------------------------------------------------
export function layerModes(s, c) {
  const b0P = s.value(0);
  const dropTrainP = s.value(0);
  const dropEvalP = s.value(0);
  const b1P = s.value(0);
  const b2P = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.momentum, seed: 11 }));
  s.add(decorAura(-420, 0, 480, '#ff6b8b1a', '#07091000'));
  s.add(decorAura(420, 20, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Layer Mode &', 'Autograd Are Orthogonal'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.forward,
    eyebrow: 'MODEL.TRAIN() / EVAL()  vs  TORCH.NO_GRAD()',
  });

  // View 1 (Beat 0): Living 4-channel Dropout activation bars [1,2,3,4] -> [2,0,6,0] -> [1,2,3,4]
  const view1 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const b0 = b0P.value;
      const dt = dropTrainP.value;
      const de = dropEvalP.value;
      const nodes = [];

      const isEval = de > 0.5;
      const outCol = isEval ? ROLE.escalate : ROLE.stale;

      nodes.push(
        txt(
          isEval
            ? 'DROPOUT(p = 0.5) IN EVAL MODE:  IDENTITY (NO MASK, NO RESCALE)'
            : 'DROPOUT(p = 0.5) IN TRAIN MODE:  MASK [1, 0, 1, 0]  ·  SURVIVORS x 2',
          -855,
          -205,
          28,
          outCol,
          'mono',
          'left',
        ),
        txt('INPUT ACTIVATIONS', -525, -125, 26, ROLE.standard, 'mono'),
        txt(isEval ? 'EVAL OUTPUT' : 'TRAIN OUTPUT', 395, -125, 26, outCol, 'mono'),
      );

      // Left bars: input [1, 2, 3, 4]
      const baseY = 175;
      const unitH = 42;
      DROPOUT_FIXTURE.input.forEach((v, i) => {
        const cx = -730 + i * 135;
        const h = v * unitH;
        nodes.push(
          rect(76, h, { fill: '#11213d', stroke: ROLE.standard, width: 2.5, radius: 10 })
            .at(cx, baseY - h / 2)
            .glow(6, ROLE.standard),
          txt(String(v), cx, baseY - h - 28, 28, ROLE.standard, 'mono'),
          txt(`c${i}`, cx, baseY + 36, 26, COSMOS.muted, 'mono'),
        );
      });

      // Center transformation gate
      nodes.push(
        arrow([-200, 15], [35, 15], { stroke: outCol, width: 4 }).glow(8, outCol),
        txt(isEval ? 'eval()' : 'train()', -82, -32, 30, outCol, 'mono'),
        txt(
          isEval ? 'x -> x' : dt > 0.2 ? '1 / (1 - 0.5) = 2x' : 'p = 0.5',
          -82,
          62,
          26,
          COSMOS.muted,
          'mono',
        ),
      );

      // Right bars: morph smoothly from input -> trainOut -> evalOut
      DROPOUT_FIXTURE.input.forEach((inV, i) => {
        const trV = DROPOUT_FIXTURE.trainOut[i];
        const evV = DROPOUT_FIXTURE.evalOut[i];
        const curV = de > 0.02 ? mix(trV, evV, de) : mix(inV, trV, Math.max(b0 * 0.65, dt));
        const cx = 190 + i * 135;
        const h = Math.max(8, curV * unitH);
        const zeroed = !isEval && trV === 0;
        const barCol = zeroed ? COSMOS.dim : outCol;
        const pulse = !zeroed ? 9 : 0;
        nodes.push(
          rect(76, h, {
            fill: zeroed ? '#111626' : '#181e36',
            stroke: barCol,
            width: 2.6,
            radius: 10,
          })
            .at(cx, baseY - h / 2)
            .glow(pulse, barCol),
          txt(curV.toFixed(0), cx, baseY - h - 28, 28, barCol, 'mono'),
          txt(`m=${DROPOUT_FIXTURE.mask[i]}`, cx, baseY + 36, 26, COSMOS.muted, 'mono'),
        );
      });

      nodes.push(
        txt(
          'Linear & ReLU compute identically in train and eval; check training flags explicitly',
          0,
          345,
          28,
          COSMOS.muted,
          'serif',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beats 1-2): Orthogonal Layer Mode vs Autograd Matrix
  const view2 = guardedDynamic(
    () => fadeIn(b1P.value),
    (vis) => {
      const b2 = b2P.value;
      const nodes = [
        txt('LAYER MODE  (train vs eval)', -855, -210, 28, ROLE.forward, 'mono', 'left'),
        txt('train() behavior', -255, -140, 26, ROLE.stale, 'mono'),
        txt('eval() behavior', 445, -140, 26, ROLE.escalate, 'mono'),
      ];

      const rows = [
        ['Dropout', 'sample mask + rescale', 'identity (pass through)'],
        ['BatchNorm', 'batch stats + update buffers', 'frozen running buffers'],
        ['LayerNorm', 'same trailing-dim norm', 'same trailing-dim norm'],
      ];

      rows.forEach(([name, tr, ev], i) => {
        const y = -55 + i * 105;
        nodes.push(
          txt(name, -855, y, 30, COSMOS.ink, 'mono', 'left'),
          tensorCell(-255, y, 560, 74, tr, ROLE.stale, { size: 27, glow: i === 1 ? 8 : 4 }),
          tensorCell(445, y, 560, 74, ev, ROLE.escalate, { size: 27, glow: i === 1 ? 8 : 4 }),
        );
      });

      nodes.push(
        rule(-855, 225, 845, 225, '#2b3a60', 2),
        txt(
          b2 > 0.2
            ? 'HELD-OUT EVAL:  eval() + torch.no_grad()  |  INPUT ATTRIBUTION:  eval() + grad ON'
            : 'BatchNorm in train() updates running stats EVEN INSIDE torch.no_grad()!',
          0,
          292,
          28,
          b2 > 0.2 ? ROLE.escalate : ROLE.grad,
          'mono',
        ),
        txt(
          b2 > 0.2
            ? 'Choose checkpoint on validation split; keep a separate test set untouched'
            : 'Disable track_running_stats to use batch statistics in both modes',
          0,
          362,
          28,
          COSMOS.muted,
          'serif',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  cueTo(s, c, 'layer-modes-beat-0', b0P, 1, { dur: 0.7 });
  cueTo(s, c, 'loop-dropout-train', dropTrainP, 1, { dur: 0.7 });
  cueTo(s, c, 'loop-dropout-eval', dropEvalP, 1, { dur: 0.75 });
  cueTo(s, c, 'layer-modes-beat-1', b1P, 1, { dur: 0.85 });
  cueTo(s, c, 'layer-modes-beat-2', b2P, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 12. validation: Validation reads weights without updating them
// Cues: validation-beat-1-focus-2, validation-beat-1-focus-1,
//       validation-beat-2-focus-1, validation-beat-2-focus-2, validation-live-view
// ---------------------------------------------------------------------------
export function validation(s, c) {
  const modesP = s.value(0);
  const measureP = s.value(0);
  const bestEpochP = s.value(0);
  const copyP = s.value(0);
  const aliasP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.escalate, seed: 12 }));
  s.add(decorAura(-440, -10, 480, '#5ce1e61a', '#07091000'));
  s.add(decorAura(450, 40, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Validation Reads', 'Without Mutating Weights'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.escalate,
    eyebrow: 'SEPARATE LANES · DEEP COPY BEST CHECKPOINT',
  });

  const live = dynamic(() => {
    const md = modesP.value;
    const ms = measureP.value;
    const ep = bestEpochP.value;
    const cp = copyP.value;
    const al = aliasP.value;
    const nodes = [];

    // Top two separated lanes: Training lane vs Validation lane
    const lx = -855;
    nodes.push(
      txt('TRAINING LANE', lx, -210, 26, ROLE.forward, 'mono', 'left'),
      tensorCell(-610, -140, 480, 68, 'model.train() + grad', ROLE.forward, {
        size: 27,
        glow: md > 0.2 ? 9 : 4,
      }),
      arrow([-355, -140], [-235, -140], { stroke: ROLE.forward, width: 3.5 }),
      tensorCell(75, -140, 580, 68, 'forward -> backward -> step()', ROLE.grad, {
        size: 27,
        glow: 6,
      }),
      txt('mutates W', 405, -140, 28, ROLE.grad, 'mono', 'left'),

      txt('VALIDATION LANE', lx, -40, 26, ROLE.escalate, 'mono', 'left'),
      tensorCell(-610, 30, 480, 68, 'model.eval() + no_grad()', ROLE.escalate, {
        size: 27,
        glow: ms > 0.2 ? 10 : 5,
      }),
      arrow([-355, 30], [-235, 30], { stroke: ROLE.escalate, width: 3.5 }),
      tensorCell(75, 30, 580, 68, 'forward -> loss & acc ONLY', ROLE.escalate, {
        size: 27,
        glow: ms > 0.2 ? 10 : 5,
      }),
      txt('read-only', 405, 30, 28, ROLE.escalate, 'mono', 'left'),
    );

    // Bottom section: Best epoch 60 snapshot & state_dict aliasing demo (from checkpointSnapshot!)
    const snap = checkpointSnapshot(mix(0.45, 1.0, al));
    const liveVal = snap.live[0][0].toFixed(2);
    const plainVal = snap.plain[0][0].toFixed(2);
    const copiedVal = snap.copied[0][0].toFixed(2);
    const snapOp = Math.max(0.45, ep);

    nodes.push(
      rule(-855, 118, 845, 118, '#2b3a60', 2),
      txt(
        `BEST CHECKPOINT: EPOCH ${measuredValidation.bestEpoch}   ·   VAL LOSS ${measuredValidation.loss.toFixed(4)}`,
        -855,
        172,
        28,
        ep > 0.2 ? ROLE.grad : COSMOS.muted,
        'mono',
        'left',
      ).opacity(snapOp),
    );

    // 3 tensor state blocks: Live W, Plain state_dict() alias, deepcopy(state_dict())
    const yMat = 290;
    const pulseBad = al > 0.2 ? 12 : 4;
    nodes.push(
      txt('Live model.weight', -615, yMat - 64, 26, ROLE.forward, 'mono'),
      tensorCell(-615, yMat, 330, 74, `[${liveVal}, ${liveVal}]`, ROLE.forward, {
        size: 30,
        glow: 7,
        opacity: snapOp,
      }),

      // Aliasing tether line between live and plain view!
      line([-445, yMat], [-170, yMat], {
        stroke: al > 0.2 ? ROLE.stale : COSMOS.dim,
        width: 3.5,
        dash: [8, 6],
      }).opacity(snapOp),
      txt('aliases live!', -308, yMat - 28, 26, al > 0.2 ? ROLE.stale : COSMOS.dim, 'mono').opacity(
        snapOp,
      ),

      txt('Plain state_dict()', 0, yMat - 64, 26, al > 0.2 ? ROLE.stale : COSMOS.muted, 'mono'),
      tensorCell(
        0,
        yMat,
        330,
        74,
        `[${plainVal}, ${plainVal}]`,
        al > 0.2 ? ROLE.stale : COSMOS.muted,
        {
          size: 30,
          glow: pulseBad,
          opacity: snapOp,
        },
      ),

      txt('deepcopy(state_dict())', 615, yMat - 64, 26, ROLE.escalate, 'mono'),
      tensorCell(615, yMat, 330, 74, `[${copiedVal}, ${copiedVal}]`, ROLE.escalate, {
        size: 30,
        glow: cp > 0.2 ? 12 : 5,
        opacity: snapOp,
      }),
      txt(
        al > 0.2
          ? 'Later in-place updates overwrite plain views; deepcopy freezes the snapshot'
          : 'Always deep-copy state_dict() when saving best weights in memory',
        0,
        385,
        28,
        al > 0.2 ? ROLE.stale : COSMOS.muted,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'validation-beat-1-focus-2', modesP, 1, { dur: 0.7 });
  cueTo(s, c, 'validation-beat-1-focus-1', measureP, 1, { dur: 0.7 });
  cueTo(s, c, 'validation-beat-2-focus-1', bestEpochP, 1, { dur: 0.65 });
  cueTo(s, c, 'validation-beat-2-focus-2', copyP, 1, { dur: 0.7 });
  cueTo(s, c, 'validation-live-view', aliasP, 1, { dur: 0.9 });
}

// ---------------------------------------------------------------------------
// 13. resumption-state: Can the optimizer pick up where it left off?
// Cues: resume-model*, resume-window*, resume-fork*, resume-small*, resume-large*,
//       resume-logits*, resume-ref*, resume-other*
// ---------------------------------------------------------------------------
export function resumptionState(s, c) {
  const modelP = s.value(0);
  const windowP = s.value(0);
  const forkP = s.value(0);
  const smallP = s.value(0);
  const largeP = s.value(0);
  const logitsP = s.value(0);
  const refP = s.value(0);
  const otherP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.forward, seed: 13 }));
  s.add(decorAura(-420, 0, 500, '#5ce1e61a', '#07091000'));
  s.add(decorAura(450, 40, 480, '#ff6b8b1a', '#07091000'));

  const headline = heroTitle(['Resuming Training', 'Needs Optimizer State'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.forward,
    eyebrow: 'MODEL DICT · OPTIMIZER + RNG · MOMENTUM FORK',
  });

  const restoredRes = loopMomentum(1, -1, 0.9, 0.1, 0.9); // buffer -0.1, weight 0.91
  const freshRes = loopMomentum(0, -1, 0.9, 0.1, 0.9); // buffer -1.0, weight 1.00

  // View 1 (Beats 0-1): Checkpoint Bundle Anatomy
  const view1 = guardedDynamic(
    () => fadeOut(forkP.value),
    (vis) => {
      const md = modelP.value;
      const wn = windowP.value;
      const nodes = [
        txt('MODEL STATE DICTIONARY', -835, -205, 28, ROLE.forward, 'mono', 'left'),
        tensorCell(-465, -110, 740, 74, 'Named parameters + persistent buffers', ROLE.forward, {
          size: 28,
          glow: md > 0.2 ? 10 : 5,
        }),
        tensorCell(-465, -15, 740, 74, 'Architecture + feature order + label map', ROLE.standard, {
          size: 28,
          glow: 5,
        }),
        txt(
          'Gradients & Python attrs sit outside model.state_dict()',
          -835,
          65,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),

        txt('FULL RESUMPTION BUNDLE', 85, -205, 28, ROLE.grad, 'mono', 'left'),
        tensorCell(455, -110, 740, 74, 'optimizer + scheduler + loss scaler', ROLE.grad, {
          size: 28,
          glow: wn > 0.2 ? 10 : 5,
          opacity: Math.max(0.45, wn),
        }),
        tensorCell(455, -15, 740, 74, 'Python / NumPy / CPU / GPU RNG states', ROLE.momentum, {
          size: 28,
          glow: wn > 0.2 ? 9 : 4,
          opacity: Math.max(0.45, wn),
        }),
        tensorCell(455, 80, 740, 74, 'step + split ID + sampler / accum window', ROLE.escalate, {
          size: 28,
          glow: wn > 0.2 ? 10 : 4,
          opacity: Math.max(0.45, wn),
        }),

        rule(-835, 195, 825, 195, '#2b3a60', 2),
        txt(
          wn > 0.2
            ? 'A seed restarts a sequence; save current RNG state to resume mid-run'
            : 'Saving weights alone is only part of a resumable checkpoint',
          0,
          285,
          30,
          wn > 0.2 ? ROLE.grad : COSMOS.ink,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beats 2-3): Twin Momentum Step Rulers (Restored v=1 vs Fresh v=0)
  const view2 = guardedDynamic(
    () => Math.min(fadeIn(forkP.value), fadeOut(logitsP.value)),
    (vis) => {
      const sm = smallP.value;
      const lg = largeP.value;
      const nodes = [];

      const rx0 = -430;
      const rx1 = 760;
      const xOf = (w) => mix(rx0, rx1, (w - 0.9) / 0.1);

      nodes.push(
        txt(
          'START w = 0.90   ·   NEXT g = \u22121.0   ·   beta = 0.9   ·   lr = 0.1',
          0,
          -205,
          30,
          COSMOS.ink,
          'mono',
        ),
      );

      // Top rail: Restored optimizer (old v = 1 -> new v = -0.1 -> w = 0.91)
      const y1 = -40;
      const w1 = mix(0.9, restoredRes.weight, sm);
      nodes.push(
        txt('Restored optimizer', -845, y1 - 22, 30, ROLE.forward, 'sans', 'left'),
        txt('old v = 1.0', -845, y1 + 22, 26, ROLE.momentum, 'mono', 'left'),
        line([rx0, y1], [rx1, y1], { stroke: '#344772', width: 4 }),
        line([rx0, y1], [xOf(w1), y1], { stroke: ROLE.forward, width: 8 }).glow(10, ROLE.forward),
        glowDot(xOf(w1), y1, { radius: 13, color: ROLE.forward, glow: 14 }),
        txt(
          sm > 0.1
            ? `v = 0.9(1) \u2212 1 = \u22120.1   ->   w = ${restoredRes.weight.toFixed(2)}  (+0.01)`
            : 'v = 0.9(1) \u2212 1 = ?   ->   next w = ?',
          rx0,
          y1 - 54,
          28,
          sm > 0.1 ? ROLE.forward : COSMOS.muted,
          'mono',
          'left',
        ),
      );

      // Bottom rail: Fresh optimizer (old v = 0 -> new v = -1.0 -> w = 1.00)
      const y2 = 175;
      const w2 = mix(0.9, freshRes.weight, lg);
      nodes.push(
        txt('Fresh optimizer', -845, y2 - 22, 30, ROLE.stale, 'sans', 'left'),
        txt('old v = 0.0', -845, y2 + 22, 26, COSMOS.dim, 'mono', 'left'),
        line([rx0, y2], [rx1, y2], { stroke: '#344772', width: 4 }),
        line([rx0, y2], [xOf(w2), y2], { stroke: ROLE.stale, width: 8 }).glow(10, ROLE.stale),
        glowDot(xOf(w2), y2, { radius: 13, color: ROLE.stale, glow: 14 }),
        txt(
          lg > 0.1
            ? `v = 0.9(0) \u2212 1 = \u22121.0   ->   w = ${freshRes.weight.toFixed(2)}  (+0.10)`
            : 'v = 0.9(0) \u2212 1 = ?   ->   next w = ?',
          rx0,
          y2 - 54,
          28,
          lg > 0.1 ? ROLE.stale : COSMOS.muted,
          'mono',
          'left',
        ),
      );

      for (const tick of [0.9, 0.95, 1.0]) {
        const tx = xOf(tick);
        nodes.push(
          line([tx, y1 + 8], [tx, y1 + 22], { stroke: COSMOS.dim, width: 2 }),
          txt(tick.toFixed(2), tx, y1 + 48, 26, COSMOS.muted, 'mono'),
          line([tx, y2 + 8], [tx, y2 + 22], { stroke: COSMOS.dim, width: 2 }),
          txt(tick.toFixed(2), tx, y2 + 48, 26, COSMOS.muted, 'mono'),
        );
      }

      nodes.push(
        txt(
          lg > 0.2
            ? 'Fresh momentum takes a 10x larger step because old momentum is gone!'
            : 'Prediction: which copy takes the larger step?',
          0,
          345,
          32,
          lg > 0.2 ? ROLE.stale : ROLE.grad,
          'serif',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 3 (Beat 4): 80-Update Router Reload Verification Matrix
  const view3 = guardedDynamic(
    () => fadeIn(logitsP.value),
    (vis) => {
      const rf = refP.value;
      const ot = otherP.value;
      const nodes = [
        txt(
          'TICKET ROUTER · CHECKPOINT AFTER 80 SGD UPDATES',
          -835,
          -205,
          28,
          ROLE.forward,
          'mono',
          'left',
        ),
        txt('Weights + Optimizer', 160, -110, 32, ROLE.escalate, 'mono'),
        txt('Weights Only', 605, -110, 32, ROLE.stale, 'mono'),

        rule(-835, -55, 825, -55, '#2b3a60', 2),
        txt('Scores right after reload', -835, 35, 32, COSMOS.ink, 'sans', 'left'),
        tensorCell(160, 35, 260, 72, 'Match', ROLE.escalate, { size: 32, glow: 9 }),
        tensorCell(605, 35, 260, 72, 'Match', ROLE.forward, { size: 32, glow: 7 }),

        rule(-835, 125, 825, 125, '#2b3a60', 2),
        txt('Weights after same next batch', -835, 215, 32, COSMOS.ink, 'sans', 'left'),
        tensorCell(
          160,
          215,
          260,
          72,
          rf > 0.2 ? 'Match' : '?',
          rf > 0.2 ? ROLE.escalate : COSMOS.dim,
          {
            size: 32,
            glow: rf > 0.2 ? 12 : 2,
          },
        ),
        tensorCell(
          605,
          215,
          260,
          72,
          ot > 0.2 ? 'Differ' : '?',
          ot > 0.2 ? ROLE.stale : COSMOS.dim,
          {
            size: 32,
            glow: ot > 0.2 ? 12 : 2,
          },
        ),

        txt(
          'Exact replay also requires matching data order, RNG state, and deterministic ops',
          0,
          360,
          28,
          COSMOS.muted,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2, view3);
  cueTo(s, c, 'resume-model', modelP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'resume-window', windowP, 1, { after: true, dur: 0.7 });
  cueTo(s, c, 'resume-fork', forkP, 1, { after: true, dur: 0.85 });
  cueTo(s, c, 'resume-small', smallP, 1, { after: true, dur: 0.7 });
  cueTo(s, c, 'resume-large', largeP, 1, { after: true, dur: 0.75 });
  cueTo(s, c, 'resume-logits', logitsP, 1, { after: true, dur: 0.85 });
  cueTo(s, c, 'resume-ref', refP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'resume-other', otherP, 1, { after: true, dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 14. atomic-checkpoint: Which checkpoint can a reader open?
// Cues: atomic-checkpoint-beat-0, loop-file-replace, atomic-checkpoint-beat-1,
//       loop-directory-sync, loop-stage-failure, atomic-checkpoint-beat-2
// ---------------------------------------------------------------------------
export function atomicCheckpoint(s, c) {
  const stageP = s.value(0);
  const replaceP = s.value(0);
  const b1P = s.value(0);
  const dirSyncP = s.value(0);
  const failP = s.value(0);
  const intactP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.forward, seed: 14 }));
  s.add(decorAura(-400, 0, 500, '#5ce1e61a', '#07091000'));
  s.add(decorAura(420, 40, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Atomic Staging &', 'Checkpoint Durability'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.forward,
    eyebrow: 'WRITE TEMP -> FSYNC FILE -> OS.REPLACE -> FSYNC DIR',
  });

  const live = dynamic(() => {
    const st = stageP.value;
    const rp = replaceP.value;
    const b1 = b1P.value;
    const ds = dirSyncP.value;
    const fl = failP.value;
    const ok = intactP.value;
    const nodes = [];

    const isFailPhase = fl > 0.2;
    const liveIsNew = rp > 0.5 && !isFailPhase;

    // Top Track: Live file (model-ckpt.pt)
    const bx0 = -475;
    const bw = 176;
    const stride = 204;
    const yLive = -115;
    const yStage = 95;

    nodes.push(
      txt(
        'LIVE PATH',
        -855,
        yLive - 20,
        28,
        liveIsNew ? ROLE.escalate : ROLE.standard,
        'mono',
        'left',
      ),
      txt('model-ckpt.pt', -855, yLive + 22, 26, COSMOS.muted, 'mono', 'left'),
    );

    for (let i = 0; i < 4; i++) {
      const cx = bx0 + i * stride;
      const col = isFailPhase ? ROLE.escalate : liveIsNew ? ROLE.escalate : ROLE.standard;
      const lbl = isFailPhase ? `v1.${i + 1}` : liveIsNew ? `v2.${i + 1}` : `v1.${i + 1}`;
      nodes.push(
        tensorCell(cx, yLive, bw, 76, lbl, col, {
          size: 30,
          glow: ok > 0.2 || liveIsNew ? 10 : 5,
        }),
      );
    }
    nodes.push(
      txt(
        isFailPhase
          ? '4/4 old bytes intact!'
          : liveIsNew
            ? '4/4 complete new bytes'
            : '4/4 complete old bytes',
        265,
        yLive,
        28,
        isFailPhase || liveIsNew ? ROLE.escalate : ROLE.standard,
        'mono',
        'left',
      ),
    );

    // Bottom Track: Staging file (model-ckpt.pt.tmp)
    nodes.push(
      txt(
        'STAGING PATH',
        -855,
        yStage - 20,
        28,
        isFailPhase ? ROLE.stale : ROLE.grad,
        'mono',
        'left',
      ),
      txt('model-ckpt.pt.tmp', -855, yStage + 22, 26, COSMOS.muted, 'mono', 'left'),
    );

    const stagedCount = isFailPhase ? 2 : liveIsNew ? 0 : Math.min(4, Math.ceil(st * 4));
    for (let i = 0; i < 4; i++) {
      const cx = bx0 + i * stride;
      const filled = i < stagedCount;
      const failedCell = isFailPhase && i >= 2;
      const col = failedCell ? ROLE.stale : filled ? ROLE.grad : COSMOS.dim;
      const lbl = failedCell
        ? 'FAIL'
        : filled
          ? isFailPhase
            ? `v3.${i + 1}`
            : `v2.${i + 1}`
          : '\u00b7';
      nodes.push(
        tensorCell(cx, yStage, bw, 76, lbl, col, {
          size: 28,
          glow: failedCell ? 11 : filled ? 7 : 1,
          opacity: liveIsNew && !isFailPhase ? 0.35 : 1,
        }),
      );
    }

    nodes.push(
      txt(
        isFailPhase
          ? 'Crash 2/4: replace skipped'
          : liveIsNew
            ? 'Renamed atomically'
            : stagedCount === 4
              ? 'Flushed + fsync(file)'
              : 'Staging temp blocks',
        265,
        yStage,
        28,
        isFailPhase ? ROLE.stale : ROLE.grad,
        'mono',
        'left',
      ),
    );

    // Bottom pipeline checklist (4 properties clearly separated)
    const yPipe = 275;
    const pills = [
      { x: -640, label: '1. fsync(file)', on: st > 0.5 && !isFailPhase, col: ROLE.forward },
      { x: -215, label: '2. os.replace()', on: rp > 0.3 && !isFailPhase, col: ROLE.escalate },
      { x: 215, label: '3. fsync(dir)', on: ds > 0.2 || b1 > 0.4, col: ROLE.grad },
      { x: 645, label: '4. weights_only=True', on: ok > 0.2, col: ROLE.momentum },
    ];
    for (const p of pills) {
      nodes.push(
        tensorCell(p.x, yPipe, 360, 70, p.label, p.on ? p.col : COSMOS.dim, {
          size: 26,
          glow: p.on ? 10 : 2,
          opacity: p.on ? 1 : 0.55,
        }),
      );
    }

    nodes.push(
      txt(
        ok > 0.2
          ? 'Reader opens complete old checkpoint; load trusted files with weights_only=True'
          : ds > 0.2
            ? 'Atomic visibility (POSIX replace) and power-loss durability (dir fsync) are separate'
            : 'Never overwrite the live checkpoint file directly in place',
        0,
        385,
        28,
        ok > 0.2 ? ROLE.escalate : ds > 0.2 ? ROLE.grad : COSMOS.muted,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'atomic-checkpoint-beat-0', stageP, 1, { dur: 0.9 });
  cueTo(s, c, 'loop-file-replace', replaceP, 1, { dur: 0.7 });
  cueTo(s, c, 'atomic-checkpoint-beat-1', b1P, 1, { dur: 0.7 });
  cueTo(s, c, 'loop-directory-sync', dirSyncP, 1, { dur: 0.7 });
  cueTo(s, c, 'loop-stage-failure', failP, 1, { dur: 0.7 });
  cueTo(s, c, 'atomic-checkpoint-beat-2', intactP, 1, { dur: 0.7 });
}
