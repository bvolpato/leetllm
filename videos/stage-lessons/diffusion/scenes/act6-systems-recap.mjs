// Act 6: Controls & Acceleration, Compute Prediction Matrix, Product Lanes & Sizing,
// Reproducibility, Publication Fencing, Strict Release Evidence, Fresh Release Study,
// and Final Shadow-Pixel Tabletop Recap.
import { Node, arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  SCALAR_TRACE,
  SHADOW_JUMP,
  SHADOW_PIXEL,
  aura,
  blend,
  brightnessRuler,
  cinemaGrid,
  cueTo,
  decimal,
  fadeIn,
  fadeOut,
  glassPlate,
  glowTex,
  guardedDynamic,
  livingDrift,
  photonWire,
  pixelGrid,
  polyPath,
  pulseCue,
  releaseJob,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 26. controls-fast: Different controls and accelerators change different work
// Cues: df-controls-fast-0, df-controls-fast-1, df-controls-fast-2
// ---------------------------------------------------------------------------
export function controlsFast(s, c) {
  const mode = s.value(0); // 0 = controls, 1 = distillation/solvers, 2 = ADD & compatibility
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44 }));
  s.add(aura(0, 0, 560, '#5ce1e620', '#17203d12'));

  const liveCtrl = dynamic(() => {
    const m = mode.value;
    const ph = drift.value;

    if (m < 0.5) {
      const items = [
        {
          title: 'LoRA Adapter',
          desc: 'Updates selected low-rank weights for style or domain specialization',
          col: COSMOS.cyan,
          y: -175,
        },
        {
          title: 'ControlNet',
          desc: 'Adds trainable spatial branch (depth / edges) via zero-initialized connectors',
          col: COSMOS.violet,
          y: 0,
        },
        {
          title: 'Inpainting Route',
          desc: 'Combines edit mask with preserved surrounding context',
          col: COSMOS.gold,
          y: 175,
        },
      ];
      return group(
        txt('MATCH THE CONDITIONING MECHANISM TO THE CONTROL', 0, -365, 30, COSMOS.cyan, 'mono'),
        ...items.flatMap((it, i) => [
          glassPlate(-530, it.y, 440, 125, { stroke: it.col, glow: 8 }),
          txt(it.title, -530, it.y, 34, it.col, 'serif'),
          photonWire(
            [
              [-305, it.y],
              [-205, it.y],
            ],
            ph * 3 + i * 0.3,
            { color: it.col, width: 3.4 },
          ),
          glassPlate(315, it.y, 1020, 125, { stroke: '#3a4f7c', glow: 4 }),
          txt(it.desc, 315, it.y, 28, COSMOS.ink, 'sans'),
        ]),
        txt(
          'Controls do not guarantee exact pose, readable text, or permitted marks: verify outputs',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    if (m < 1.5) {
      // Beat 1: Progressive distillation 2 teacher steps -> 1 student step + DPM-Solver / LCM-LoRA
      return group(
        txt('NUMERICAL SOLVERS  vs  TRAINED ACCELERATION', 0, -365, 30, COSMOS.gold, 'mono'),
        glassPlate(-520, -155, 440, 130, { stroke: COSMOS.blue, glow: 8 }),
        txt('Teacher Step 1', -520, -155, 34, COSMOS.blue, 'serif'),
        photonWire(
          [
            [-295, -155],
            [-145, -155],
          ],
          ph * 3,
          { color: COSMOS.blue, width: 3.6 },
        ),
        glassPlate(85, -155, 440, 130, { stroke: COSMOS.blue, glow: 8 }),
        txt('Teacher Step 2', 85, -155, 34, COSMOS.blue, 'serif'),
        photonWire(
          [
            [85, -85],
            [85, 10],
            [470, 10],
            [470, 65],
          ],
          ph * 2.8,
          { color: COSMOS.gold, width: 4 },
        ),
        glassPlate(470, 145, 520, 145, { stroke: COSMOS.gold, glow: 11 }),
        txt('1 Student Step', 470, 122, 38, COSMOS.gold, 'serif').glow(8, COSMOS.gold),
        txt('progressive halving (2 → 1)', 470, 174, 26, COSMOS.muted, 'mono'),

        glassPlate(-350, 145, 860, 145, { stroke: COSMOS.cyan, glow: 7 }),
        txt('DPM-Solver: faster ODE math, zero retraining', -350, 118, 28, COSMOS.cyan, 'sans'),
        txt('LCM / SDXL: match SDXL LCM-LoRA + LCM scheduler', -350, 174, 26, COSMOS.ink, 'sans'),

        txt(
          'Solvers and distilled students carry separate compatibility contracts',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    // Beat 2: ADD + Guidance distillation + full route compatibility
    const rows = [
      {
        k: 'Adversarial Distillation',
        v: 'Diffusion teacher + adversarial loss · 1–4 steps reported',
        col: COSMOS.rose,
        y: -175,
      },
      {
        k: 'Guidance Distillation',
        v: 'Folds 2 CFG branches into 1 trained single-branch pass',
        col: COSMOS.gold,
        y: 0,
      },
      {
        k: 'Route Verification',
        v: 'Pin model, adapter, scheduler, target, and guidance together',
        col: COSMOS.emerald,
        y: 175,
      },
    ];
    return group(
      txt('DISTILLATION RECIPES  &  ROUTE COMPATIBILITY', 0, -365, 30, COSMOS.emerald, 'mono'),
      ...rows.flatMap((r, i) => [
        glassPlate(-510, r.y, 490, 125, { stroke: r.col, glow: 8 }),
        txt(r.k, -510, r.y, 32, r.col, 'serif'),
        photonWire(
          [
            [-260, r.y],
            [-175, r.y],
          ],
          ph * 3 + i * 0.3,
          { color: r.col, width: 3.4 },
        ),
        glassPlate(325, r.y, 980, 125, { stroke: '#3a4f7c', glow: 4 }),
        txt(r.v, 325, r.y, 28, COSMOS.ink, 'sans'),
      ]),
      txt(
        'Original DDPM noise regression still needs no discriminator · measure complete route',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
  });

  s.add(liveCtrl);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'df-controls-fast-0', mode, 0.1, { dur: 0.3 });
  cueTo(s, c, 'df-controls-fast-1', mode, 1, { dur: 0.45 });
  cueTo(s, c, 'df-controls-fast-2', mode, 2, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 27. compute: How much work does one preview take?
// Cues: work-single, work-pairs, work-double*, work-student, work-steps-test, work-guidance-test
// ---------------------------------------------------------------------------
export function compute(s, c) {
  const row1P = s.value(0);
  const row2P = s.value(0);
  const doubleRev = s.value(0);
  const row3P = s.value(0);
  const trialMode = s.value(0);
  const stepsTrialVis = s.value(0);
  const guidTrialVis = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44 }));
  s.add(aura(0, 0, 560, '#5ce1e61f', '#17203d12'));

  const dotTrack = (
    y,
    label,
    steps,
    progA,
    progB,
    countText,
    colA = COSMOS.cyan,
    colB = COSMOS.gold,
  ) => {
    const filledA = Math.round(steps * progA);
    const filledB = progB !== null ? Math.round(steps * progB) : 0;
    const isWord = countText === 'pending';
    const nodes = [
      txt(label, -810, y - 58, 32, COSMOS.ink, 'serif', 'left'),
      txt(
        countText,
        810,
        y + 6,
        isWord ? 34 : 56,
        isWord ? COSMOS.muted : COSMOS.gold,
        'mono',
        'right',
      ).glow(isWord ? 0 : 8, COSMOS.gold),
    ];
    for (let st = 0; st < steps; st++) {
      const dx = -792 + st * 27.5;
      const doneA = st < filledA;
      nodes.push(
        circle(7.8, {
          fill: doneA ? colA : '#131d36',
          stroke: doneA ? colA : '#3a4f7c',
          width: 1.6,
        }).at(dx, y),
      );
      if (progB !== null) {
        const doneB = st < filledB;
        nodes.push(
          circle(7.8, {
            fill: doneB ? colB : '#131d36',
            stroke: doneB ? colB : '#3a4f7c',
            width: 1.6,
          }).at(dx, y + 26),
        );
      }
    }
    return group(...nodes);
  };

  // Beats 0 & 1: 50 single vs 100 paired CFG vs 6 guidance-distilled student
  const matrixView = guardedDynamic(
    () => fadeOut(trialMode.value),
    (vis) => {
      const p1 = row1P.value;
      const p2 = row2P.value;
      const dR = doubleRev.value > 0.5;
      const p3 = row3P.value;
      const c1 = Math.round(50 * p1);
      const c2 = dR ? 100 : 50 + Math.round(50 * p2);
      const c3 = Math.round(6 * p3);

      const nodes = [
        txt('DENOISER PREDICTIONS PER IMAGE', 810, -372, 28, COSMOS.muted, 'mono', 'right'),
        txt('EACH DOT = 1 DENOISER PREDICTION', -810, -372, 28, COSMOS.cyan, 'mono', 'left'),
        dotTrack(-205, '50 steps · prompt branch only', 50, p1, null, String(c1)),
        dotTrack(
          18,
          '50 steps · ordinary CFG (prompt + comparison)',
          50,
          p1 > 0.85 || p2 > 0.01 ? p1 : 0,
          p2,
          p2 > 0.02 ? (dR ? '100' : String(c2)) : p1 > 0.85 ? '50 + ?' : 'pending',
        ),
        dotTrack(
          245,
          '6 steps · guidance-distilled student (single branch)',
          6,
          p3,
          null,
          p3 > 0.01 ? String(c3) : 'pending',
          COSMOS.emerald,
        ),
        txt(
          'Same scale across all three recipes · each column is one selected noise level',
          0,
          368,
          28,
          COSMOS.muted,
          'sans',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  // Beat 2: Controlled matched trials (baseline vs half steps vs double guidance)
  const trialView = guardedDynamic(
    () => fadeIn(trialMode.value),
    (vis) => {
      const sVis = stepsTrialVis.value > 0.3;
      const gVis = guidTrialVis.value > 0.3;
      const trials = [
        {
          label: 'Baseline',
          steps: 50,
          scale: '7.5',
          pred: '50 × 2 = 100',
          col: COSMOS.cyan,
          show: true,
          y: -155,
        },
        {
          label: 'Halve steps',
          steps: 25,
          scale: '7.5',
          pred: '25 × 2 = 50',
          col: COSMOS.emerald,
          show: sVis,
          y: 15,
        },
        {
          label: 'Double CFG',
          steps: 50,
          scale: '15.0',
          pred: '50 × 2 = 100',
          col: COSMOS.gold,
          show: gVis,
          y: 185,
        },
      ];
      return group(
        txt('ISOLATE ONE VARIABLE PER TRIAL', 0, -372, 32, COSMOS.gold, 'mono'),
        txt('Trial', -760, -270, 26, COSMOS.muted, 'mono', 'left'),
        txt('Steps', -200, -270, 26, COSMOS.muted, 'mono'),
        txt('CFG Scale', 150, -270, 26, COSMOS.muted, 'mono'),
        txt('Predictions / Image', 580, -270, 26, COSMOS.muted, 'mono'),
        ...trials.flatMap((tr) =>
          tr.show
            ? [
                glassPlate(0, tr.y, 1620, 122, { stroke: tr.col, glow: 8 }),
                txt(tr.label, -760, tr.y, 36, COSMOS.ink, 'serif', 'left'),
                txt(
                  String(tr.steps),
                  -200,
                  tr.y,
                  44,
                  tr.steps < 50 ? COSMOS.emerald : COSMOS.ink,
                  'mono',
                ),
                txt(
                  tr.scale,
                  150,
                  tr.y,
                  44,
                  tr.scale === '15.0' ? COSMOS.gold : COSMOS.ink,
                  'mono',
                ),
                txt(tr.pred, 580, tr.y, 40, tr.col, 'mono').glow(6, tr.col),
              ]
            : [],
        ),
        txt(
          'Time the full user path: queue + generation + VAE decode + release checks',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
        ),
      ).opacity(vis);
    },
  );

  s.add(matrixView, trialView);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'work-single', row1P, 1, { dur: 1.5 });
  cueTo(s, c, 'work-pairs', row2P, 1, { dur: 1.3 });
  cueTo(s, c, 'work-double', doubleRev, 1, { after: true, dur: 0.25 });
  cueTo(s, c, 'work-student', row3P, 1, { dur: 1.1 });

  c.onBeat(2, () => s.play(trialMode.to(1, { duration: 0.4 })));
  cueTo(s, c, 'work-steps-test', stepsTrialVis, 1, { dur: 0.45 });
  cueTo(s, c, 'work-guidance-test', guidTrialVis, 1, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 28. product-lanes: Count predictions before sizing the two routes
// Cues: df-product-lanes-0, df-product-lanes-1, df-preview-count, df-quality-count,
//       df-product-lanes-2, df-preview-workers
// ---------------------------------------------------------------------------
export function productLanes(s, c) {
  const mode = s.value(0); // 0 = request lifecycle, 1 = 480 / 800, 2 = 6 workers
  const prevRev = s.value(0);
  const qualRev = s.value(0);
  const workRev = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.blue, opacity: 0.44 }));
  s.add(aura(0, 0, 560, '#5ce1e61f', '#17203d12'));

  const liveLanes = dynamic(() => {
    const m = mode.value;
    const ph = drift.value;

    if (m < 0.5) {
      const stages = ['Admit', 'Queue + Reserve', 'Generate', 'Check', 'Release'];
      return group(
        txt('TENANT JOB LIFECYCLE  &  ROUTE DEADLINES', 0, -365, 30, COSMOS.cyan, 'mono'),
        glassPlate(0, -175, 1620, 145, { stroke: COSMOS.blue, glow: 7 }),
        txt(
          'Request:  Tenant + Idempotency Key  ·  Prompt / Negative  ·  Shape  ·  Variants  ·  Seed  ·  Route',
          0,
          -202,
          28,
          COSMOS.ink,
          'sans',
        ),
        txt(
          'Status and asset reads each require tenant authorization',
          0,
          -144,
          26,
          COSMOS.cyan,
          'mono',
        ),

        ...stages.flatMap((st, i) => {
          const sx = -640 + i * 320;
          const active = i <= Math.floor(((ph * 2) % 1) * 5);
          return [
            glassPlate(sx, 75, 265, 118, {
              stroke: active ? COSMOS.cyan : '#3a4f7c',
              glow: active ? 9 : 3,
            }),
            txt(st, sx, 75, 28, active ? COSMOS.cyan : COSMOS.muted, 'serif'),
            i < 4
              ? photonWire(
                  [
                    [sx + 136, 75],
                    [sx + 184, 75],
                  ],
                  ph * 3.5 + i * 0.25,
                  { color: COSMOS.gold, width: 3 },
                )
              : group(),
          ];
        }),

        txt(
          'Preview p95 < 2 s (incl. queue & checks)   ·   Quality complete / review / failed ≤ 30 s',
          0,
          315,
          28,
          COSMOS.gold,
          'sans',
        ),
      );
    }

    if (m < 1.5) {
      const pR = prevRev.value > 0.5;
      const qR = qualRev.value > 0.5;
      return group(
        txt(
          'OFFERED WORK = JOBS/S × VARIANTS × STEPS × BRANCHES',
          0,
          -365,
          30,
          COSMOS.gold,
          'mono',
        ),

        glassPlate(-430, -45, 760, 390, { stroke: COSMOS.cyan, glow: 9 }),
        txt('PREVIEW ROUTE', -430, -182, 32, COSMOS.cyan, 'mono'),
        txt('20 jobs/s  ×  4 variants', -430, -112, 30, COSMOS.ink, 'mono'),
        txt('×  6 steps  ×  1 branch', -430, -56, 30, COSMOS.ink, 'mono'),
        txt(
          pR ? '480 predictions / s' : '? predictions / s',
          -430,
          56,
          46,
          COSMOS.cyan,
          'mono',
        ).glow(pR ? 10 : 0, COSMOS.cyan),

        glassPlate(430, -45, 760, 390, { stroke: COSMOS.violet, glow: 9 }),
        txt('QUALITY ROUTE', 430, -182, 32, COSMOS.violet, 'mono'),
        txt('2 jobs/s  ×  4 variants', 430, -112, 30, COSMOS.ink, 'mono'),
        txt('×  50 steps  ×  2 CFG branches', 430, -56, 30, COSMOS.ink, 'mono'),
        txt(
          qR ? '800 predictions / s' : '? predictions / s',
          430,
          56,
          46,
          COSMOS.violet,
          'mono',
        ).glow(qR ? 10 : 0, COSMOS.violet),

        txt(
          'Batching changes call count, not per-image prediction work',
          0,
          325,
          30,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    // Beat 2: Worker sizing ceil(480 / (120 * 0.75)) = 6 preview workers
    const wR = workRev.value > 0.5;
    const workerDots = Array.from({ length: 6 }, (_, i) => {
      const wx = -450 + i * 180;
      return group(
        glassPlate(wx, 185, 145, 110, {
          stroke: wR ? COSMOS.emerald : '#3a4f7c',
          glow: wR ? 9 : 2,
        }),
        txt(`W${i + 1}`, wx, 170, 30, wR ? COSMOS.emerald : COSMOS.muted, 'mono'),
        txt('90/s', wx, 212, 26, COSMOS.muted, 'mono'),
      );
    });
    return group(
      txt('CAPACITY SIZING  ≠  MEASURED 2-SECOND TAIL', 0, -365, 30, COSMOS.gold, 'mono'),
      glassPlate(-430, -175, 740, 145, { stroke: COSMOS.cyan, glow: 7 }),
      txt('Matched worker capacity', -430, -202, 26, COSMOS.muted, 'mono'),
      txt('120 predictions / s', -430, -148, 36, COSMOS.cyan, 'mono'),

      glassPlate(430, -175, 740, 145, { stroke: COSMOS.gold, glow: 7 }),
      txt('75% planning ceiling', 430, -202, 26, COSMOS.muted, 'mono'),
      txt('0.75 × 120  =  90 / s', 430, -148, 36, COSMOS.gold, 'mono'),

      txt(
        wR ? '⌈ 480 / 90 ⌉  =  6 preview workers' : '⌈ 480 / 90 ⌉  =  ?',
        0,
        15,
        54,
        wR ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).glow(10, wR ? COSMOS.emerald : COSMOS.gold),

      ...workerDots,
      txt(
        'Reserve real preview workers, bound queues, reject impossible deadlines',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
  });

  s.add(liveLanes);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'df-product-lanes-0', mode, 0.1, { dur: 0.3 });
  cueTo(s, c, 'df-product-lanes-1', mode, 1, { dur: 0.4 });
  cueTo(s, c, 'df-preview-count', prevRev, 1, { after: true, dur: 0.25 });
  cueTo(s, c, 'df-quality-count', qualRev, 1, { after: true, dur: 0.25 });
  cueTo(s, c, 'df-product-lanes-2', mode, 2, { dur: 0.45 });
  cueTo(s, c, 'df-preview-workers', workRev, 1, { after: true, dur: 0.3 });
}

// ---------------------------------------------------------------------------
// 29. reproducibility: Save the recipe and the result
// Cues: reproducibility-beat-1-focus-1, df-reproducibility-0,
//       reproducibility-resume, df-reproducibility-1,
//       reproducibility-review, df-reproducibility-2
// ---------------------------------------------------------------------------
export function reproducibility(s, c) {
  const recipeVis = s.value(0.2);
  const resumeVis = s.value(0);
  const reviewVis = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44 }));
  s.add(aura(0, 40, 560, '#5ce1e620', '#17203d12'));

  const fields = ['Seed', 'Model + VAE', 'Sampler + Steps', 'CFG Scale', 'Hardware / Env'];

  const liveRep = dynamic(() => {
    const resV = resumeVis.value;
    const revV = reviewVis.value;
    const ph = drift.value;

    const nodes = [
      txt('COMPLETE REPRODUCIBILITY RECIPE', 0, -372, 28, COSMOS.cyan, 'mono'),
      ...fields.flatMap((f, i) => {
        const fx = -640 + i * 320;
        return [
          glassPlate(fx, -268, 285, 92, { stroke: COSMOS.cyan, glow: 6 + 4 * recipeVis.value }),
          txt(f, fx, -268, 28, COSMOS.ink, 'mono'),
        ];
      }),
      txt(
        'Kernel or hardware changes can still alter bytes: store exact final bytes when identity matters',
        0,
        -172,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    const oldOp = fadeOut(resV);
    if (oldOp > 0.02) {
      const aPts = Array.from({ length: 28 }, (_, i) => {
        const u = i / 27;
        return [-740 + u * 600, 120 - Math.sin(u * Math.PI * 1.4) * 95 - u * 45];
      });
      const bPts = Array.from({ length: 28 }, (_, i) => {
        const u = i / 27;
        return [140 + u * 600, 120 - Math.sin(u * Math.PI * 1.4) * 95 - u * 45];
      });
      const dotI = Math.min(27, Math.floor(((ph * 1.6) % 1) * 28));
      nodes.push(
        group(
          glassPlate(-440, 85, 740, 320, { stroke: COSMOS.cyan, glow: 7 }),
          txt('RUN A  ·  SAME SEED & RECIPE', -440, -30, 26, COSMOS.cyan, 'mono'),
          new Node(polyPath(aPts)).stroke(COSMOS.cyan, 4, 0.9).glow(8, COSMOS.cyan),
          dot(9, COSMOS.gold).at(aPts[dotI][0], aPts[dotI][1]).glow(12, COSMOS.gold),
          txt('deterministic trajectory on matched hardware', -440, 200, 26, COSMOS.muted, 'sans'),

          glassPlate(440, 85, 740, 320, { stroke: COSMOS.emerald, glow: 7 }),
          txt('RUN B  ·  IDENTICAL REPLAY', 440, -30, 26, COSMOS.emerald, 'mono'),
          new Node(polyPath(bPts)).stroke(COSMOS.emerald, 4, 0.9).glow(8, COSMOS.emerald),
          dot(9, COSMOS.gold).at(bPts[dotI][0], bPts[dotI][1]).glow(12, COSMOS.gold),
          txt('store final bytes when exact identity matters', 440, 200, 26, COSMOS.muted, 'sans'),
        ).opacity(oldOp),
      );
    }

    const newOp = fadeIn(resV);
    if (newOp > 0.02) {
      nodes.push(
        group(
          glassPlate(0, -52, 1480, 96, { stroke: COSMOS.gold, glow: 8 }),
          txt(
            `Saved latent  x = ${SCALAR_TRACE.saved.toFixed(6)}   ·   next step = 1   ·   RNG + solver history`,
            0,
            -52,
            28,
            COSMOS.gold,
            'mono',
          ),
          // Restored vs Reset diverging cards
          photonWire(
            [
              [-360, 0],
              [-440, 68],
            ],
            ph * 3,
            { color: COSMOS.emerald, width: 3.6 },
          ),
          glassPlate(-440, 148, 740, 145, { stroke: COSMOS.emerald, glow: 9 }),
          txt('RESTORE RNG STATE', -440, 110, 28, COSMOS.emerald, 'mono'),
          txt(
            `draw 2: +${SCALAR_TRACE.rows[1].draw.toFixed(6)}  →  ${SCALAR_TRACE.restoredNext.toFixed(6)}`,
            -440,
            168,
            28,
            COSMOS.ink,
            'mono',
          ),

          photonWire(
            [
              [360, 0],
              [440, 68],
            ],
            ph * 3 + 0.5,
            { color: COSMOS.rose, width: 3.6 },
          ),
          glassPlate(440, 148, 740, 145, { stroke: COSMOS.rose, glow: 9 }),
          txt('RESET ORIGINAL SEED', 440, 110, 28, COSMOS.rose, 'mono'),
          txt(
            `repeats draw 1: ${decimal(SCALAR_TRACE.rows[0].draw, 6)}  →  ${SCALAR_TRACE.resetNext.toFixed(6)}`,
            440,
            168,
            28,
            COSMOS.ink,
            'mono',
          ),
        ).opacity(newOp),
      );
    }

    if (revV > 0.04) {
      nodes.push(
        group(
          glassPlate(0, 342, 1480, 98, { stroke: COSMOS.emerald, glow: 9 }),
          txt(
            'Review exact distributed bytes · attach synthetic-content label & provenance',
            0,
            342,
            30,
            COSMOS.emerald,
            'sans',
          ),
        ).opacity(revV),
      );
    }

    return group(...nodes);
  });

  s.add(liveRep);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'reproducibility-beat-1-focus-1', recipeVis, 1, { dur: 0.6 });
  pulseCue(s, c, 'df-reproducibility-0', recipeVis, 1, { dur: 0.3 });
  cueTo(s, c, 'reproducibility-resume', resumeVis, 1, { dur: 0.6 });
  pulseCue(s, c, 'df-reproducibility-1', resumeVis, 1, { dur: 0.3 });
  cueTo(s, c, 'reproducibility-review', reviewVis, 1, { dur: 0.6 });
  pulseCue(s, c, 'df-reproducibility-2', reviewVis, 1, { dur: 0.3 });
}

// ---------------------------------------------------------------------------
// 30. publication: Publish the final checked derivative under the current attempt
// Cues: df-publication-0, df-publication-1, df-publication-2
// ---------------------------------------------------------------------------
export function publication(s, c) {
  const mode = s.value(0); // 0 = idempotency/lease, 1 = resize invalidates digest, 2 = atomic commit
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44 }));
  s.add(aura(0, 0, 560, '#5ce1e61f', '#17203d12'));

  const livePub = dynamic(() => {
    const m = mode.value;
    const ph = drift.value;

    if (m < 0.5) {
      const rows = [
        {
          k: 'T1 · K17 · hash H',
          v: 'New job · attempt 5 (lease active)',
          col: COSMOS.cyan,
          y: -155,
        },
        { k: 'T1 retry · K17 · same H', v: 'Returns same durable job', col: COSMOS.emerald, y: 0 },
        {
          k: 'T1 conflict · K17 · new H',
          v: 'Rejects reused key (different prompt / route)',
          col: COSMOS.rose,
          y: 155,
        },
      ];
      return group(
        txt('IDEMPOTENCY BINDING  &  ATTEMPT LEASE FENCING', 0, -365, 30, COSMOS.cyan, 'mono'),
        ...rows.flatMap((r, i) => [
          glassPlate(-450, r.y, 680, 112, { stroke: r.col, glow: 7 }),
          txt(r.k, -450, r.y, 28, r.col, 'mono'),
          photonWire(
            [
              [-105, r.y],
              [-25, r.y],
            ],
            ph * 3 + i * 0.3,
            { color: r.col, width: 3.4 },
          ),
          glassPlate(385, r.y, 800, 112, { stroke: '#3a4f7c', glow: 4 }),
          txt(r.v, 385, r.y, 28, COSMOS.ink, 'sans'),
        ]),
        txt(
          'Increasing attempt fence blocks expired workers · authorize status & asset reads separately',
          0,
          355,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    if (m < 1.5) {
      return group(
        txt(
          'RESIZING CHANGES THE BYTES: CHECK THE FINAL DERIVATIVE',
          0,
          -365,
          30,
          COSMOS.rose,
          'mono',
        ),
        glassPlate(-510, -145, 560, 170, { stroke: COSMOS.blue, glow: 8 }),
        txt('Checked Source  (digest H0)', -510, -172, 32, COSMOS.blue, 'serif'),
        txt('passed policy + watermark', -510, -118, 26, COSMOS.muted, 'sans'),

        photonWire(
          [
            [-220, -145],
            [220, -145],
          ],
          ph * 3.2,
          { color: COSMOS.rose, width: 4 },
        ),
        txt('resize transform', 0, -184, 28, COSMOS.rose, 'mono'),

        glassPlate(510, -145, 560, 170, { stroke: COSMOS.rose, glow: 9 }),
        txt('Resized File  (digest H1 ≠ H0)', 510, -172, 32, COSMOS.rose, 'serif'),
        txt('old check no longer matches!', 510, -118, 26, COSMOS.rose, 'sans'),

        photonWire(
          [
            [510, -52],
            [510, 62],
          ],
          ph * 3 + 0.5,
          { color: COSMOS.gold, width: 3.8 },
        ),
        glassPlate(0, 155, 1340, 155, { stroke: COSMOS.gold, glow: 10 }),
        txt(
          'Prepare final size privately → apply watermark (e.g. SynthID) → check H1 itself',
          0,
          130,
          30,
          COSMOS.gold,
          'sans',
        ),
        txt(
          'Missing / uncertain watermark leaves origin unresolved · deliver checked bytes intact',
          0,
          188,
          26,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    // Beat 2: Atomic transaction pipeline
    const gates = [
      { t: '1. Attempt current?', col: COSMOS.cyan },
      { t: '2. Digest == checked?', col: COSMOS.violet },
      { t: '3. Commit manifest', col: COSMOS.gold },
      { t: '4. Immutable URL', col: COSMOS.emerald },
    ];
    return group(
      txt('SINGLE ATOMIC TRANSACTION BEFORE EXPOSURE', 0, -365, 30, COSMOS.emerald, 'mono'),
      ...gates.flatMap((g, i) => {
        const gx = -615 + i * 410;
        const lit = i <= Math.floor(((ph * 2.2) % 1) * 4);
        return [
          glassPlate(gx, -15, 355, 175, { stroke: lit ? g.col : '#3a4f7c', glow: lit ? 10 : 3 }),
          txt(g.t, gx, -15, 30, lit ? g.col : COSMOS.muted, 'serif'),
          i < 3
            ? photonWire(
                [
                  [gx + 182, -15],
                  [gx + 228, -15],
                ],
                ph * 3.5 + i * 0.25,
                { color: g.col, width: 3.4 },
              )
            : group(),
        ];
      }),
      txt(
        'If the transaction fails, the file stays private · retries return the same committed bytes',
        0,
        295,
        30,
        COSMOS.ink,
        'sans',
      ),
    );
  });

  s.add(livePub);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'df-publication-0', mode, 0.1, { dur: 0.3 });
  cueTo(s, c, 'df-publication-1', mode, 1, { dur: 0.45 });
  cueTo(s, c, 'df-publication-2', mode, 2, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 31. release-evidence: Which field holds up the release?
// Cues: df-release-evidence-0, df-release-evidence-1, df-release-evidence-2
// ---------------------------------------------------------------------------
export function releaseEvidence(s, c) {
  const mode = s.value(0); // 0 = strict predicate, 1 = type failures, 2 = rollout scorecard
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44 }));
  s.add(aura(0, 0, 560, '#5ce1e61f', '#17203d12'));

  const liveRel = dynamic(() => {
    const m = mode.value;
    const ph = drift.value;

    if (m < 0.5) {
      const gates = [
        {
          f: 'attempt',
          req: 'positive integer == trusted current',
          fail: 'stale',
          col: COSMOS.cyan,
          y: -205,
        },
        {
          f: 'policy / review',
          req: 'pass  &  human_review === false',
          fail: 'review',
          col: COSMOS.violet,
          y: -70,
        },
        {
          f: 'watermark / manifest',
          req: 'detected  &  manifest === true',
          fail: 'hold',
          col: COSMOS.gold,
          y: 65,
        },
        {
          f: 'file / checked digest',
          req: 'matching nonempty strings',
          fail: 'hold',
          col: COSMOS.emerald,
          y: 200,
        },
      ];
      return group(
        txt('STRICT RELEASE PREDICATE  (ALL GATES REQUIRED)', 0, -365, 30, COSMOS.cyan, 'mono'),
        ...gates.flatMap((g, i) => [
          glassPlate(0, g.y, 1620, 102, { stroke: g.col, glow: 6 }),
          txt(g.f, -770, g.y, 28, g.col, 'mono', 'left'),
          txt(g.req, -110, g.y, 28, COSMOS.ink, 'sans'),
          txt(`else → ${g.fail}`, 770, g.y, 28, COSMOS.rose, 'mono', 'right'),
          i < 3
            ? photonWire(
                [
                  [-650, g.y + 52],
                  [-650, gates[i + 1].y - 52],
                ],
                ph * 3 + i * 0.25,
                { color: g.col, width: 3 },
              )
            : group(),
        ]),
        txt(
          'Backend supplies trusted attempt, digest, detector, and commit',
          0,
          355,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    if (m < 1.5) {
      const bugs = [
        {
          f: 'manifest_committed',
          v: '"false"  (text string)',
          d: 'FAIL → HOLD  (requires bool true)',
          y: -155,
        },
        { f: 'attempt', v: '2.0  (float decimal)', d: 'FAIL → STALE  (requires integer)', y: 0 },
        {
          f: 'digest pair',
          v: '["a"] == ["a"]  (lists)',
          d: 'FAIL → HOLD  (requires strings)',
          y: 155,
        },
      ];
      return group(
        txt('STRICT TYPE CHECKS CATCH SILENT BUGS', 0, -365, 30, COSMOS.rose, 'mono'),
        ...bugs.flatMap((b, i) => [
          glassPlate(-470, b.y, 650, 112, { stroke: COSMOS.rose, glow: 8 }),
          txt(b.f, -760, b.y - 20, 26, COSMOS.muted, 'mono', 'left'),
          txt(b.v, -760, b.y + 22, 30, COSMOS.gold, 'mono', 'left'),
          photonWire(
            [
              [-140, b.y],
              [-45, b.y],
            ],
            ph * 3 + i * 0.3,
            { color: COSMOS.rose, width: 3.4 },
          ),
          glassPlate(375, b.y, 820, 112, { stroke: COSMOS.rose, glow: 6 }),
          txt(b.d, 375, b.y, 28, COSMOS.rose, 'mono'),
        ]),
        txt(
          'Never coerce truthy strings or non-string digests into a public release',
          0,
          355,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    // Beat 2: Matched release scorecard & progressive canary ramp
    const steps = ['Shadow', '1% Canary', '10% Canary', 'Route Ramp'];
    return group(
      txt('MATCHED PROMPT-SUITE SCORECARD  &  CANARY RAMP', 0, -365, 30, COSMOS.emerald, 'mono'),
      glassPlate(0, -185, 1620, 145, { stroke: COSMOS.cyan, glow: 7 }),
      txt(
        'Pin:  Model · VAE · Scheduler · Seed · Prompt · Negative · Steps · Guidance',
        0,
        -212,
        28,
        COSMOS.cyan,
        'mono',
      ),
      txt(
        'Track:  Alignment · Preference · Diversity · Text/Layout · Safety · Memorization · Tail p95 · Cost',
        0,
        -152,
        26,
        COSMOS.ink,
        'sans',
      ),

      ...steps.flatMap((st, i) => {
        const sx = -570 + i * 380;
        const lit = i <= Math.floor(((ph * 2) % 1) * 4);
        return [
          glassPlate(sx, 75, 310, 125, {
            stroke: lit ? COSMOS.emerald : '#3a4f7c',
            glow: lit ? 9 : 3,
          }),
          txt(st, sx, 75, 32, lit ? COSMOS.emerald : COSMOS.muted, 'serif'),
          i < 3
            ? photonWire(
                [
                  [sx + 160, 75],
                  [sx + 220, 75],
                ],
                ph * 3 + i * 0.25,
                { color: COSMOS.emerald, width: 3.4 },
              )
            : group(),
        ];
      }),

      txt(
        'A reviewer can approve a labeled illustration, but generated charts are never incident evidence',
        0,
        325,
        28,
        COSMOS.gold,
        'sans',
      ),
    );
  });

  s.add(liveRel);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'df-release-evidence-0', mode, 0.1, { dur: 0.3 });
  cueTo(s, c, 'df-release-evidence-1', mode, 1, { dur: 0.45 });
  cueTo(s, c, 'df-release-evidence-2', mode, 2, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 32. fresh-release: Which table file can leave the worker?
// Cues: df-fresh-setup, df-fresh-pair, df-fresh-work*, df-fresh-old*,
//       df-fresh-current*, df-fresh-recheck*, df-fresh-commit*
// ---------------------------------------------------------------------------
export function freshRelease(s, c) {
  const setupP = s.value(0);
  const pairPulse = s.value(0);
  const workRev = s.value(0);
  const oldRev = s.value(0);
  const curRev = s.value(0);
  const recheckRev = s.value(0);
  const commitRev = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44 }));
  s.add(aura(-450, 0, 440, '#2a588a22', '#151e3d12'));
  s.add(aura(450, 0, 440, '#ffd1661f', '#18244a12'));

  const { variants, steps, branches, candidates, currentAttempt } = releaseJob;

  const liveStudy = dynamic(() => {
    const p = setupP.value;
    const wR = workRev.value > 0.5;
    const oR = oldRev.value > 0.5;
    const cR = curRev.value > 0.5;
    const rR = recheckRev.value > 0.5;
    const cmR = commitRev.value > 0.5;

    const nodes = [
      // Left side: 3 variants x 8 steps x 2 branches prediction matrix
      txt('DENOISER PREDICTIONS', -810, -372, 32, COSMOS.cyan, 'mono', 'left'),
      txt('base + prompt branch per step', -810, -324, 26, COSMOS.muted, 'sans', 'left'),
    ];

    for (let row = 0; row < variants; row++) {
      const y = -195 + row * 126;
      nodes.push(txt(`Variant ${row + 1}`, -810, y + 6, 30, COSMOS.ink, 'mono', 'left'));
      for (let st = 0; st < steps; st++) {
        for (let br = 0; br < branches; br++) {
          const shown = (st + 1) / steps <= Math.max(0.12, p);
          const col = br === 0 ? COSMOS.blue : COSMOS.gold;
          nodes.push(
            circle(9.5, {
              fill: shown ? col : '#141e38',
              stroke: col,
              width: 2,
            }).at(-580 + st * 66, y - 14 + br * 28),
          );
        }
      }
    }

    nodes.push(
      glassPlate(-460, 240, 680, 128, { stroke: wR ? COSMOS.gold : '#3a4f7c', glow: wR ? 9 : 3 }),
      txt(
        `${variants} × ${steps} × ${branches}  =  ${wR ? variants * steps * branches : '?'}`,
        -460,
        220,
        52,
        COSMOS.gold,
        'mono',
      ).glow(wR ? 10 : 0, COSMOS.gold),
      txt('total predictions for this job', -460, 276, 26, COSMOS.muted, 'sans'),

      // Vertical separator
      line([-40, -385], [-40, 395], { stroke: '#2c3d66', width: 2, dash: [8, 10] }),

      // Right side: Two actual grayscale tabletop files & exact SHA-256 prefixes
      txt(`CURRENT ATTEMPT = ${currentAttempt}`, 40, -372, 32, COSMOS.gold, 'mono', 'left'),
      txt('SHA-256 prefixes of grayscale table files', 40, -324, 26, COSMOS.muted, 'sans', 'left'),
    );

    candidates.forEach((cand, idx) => {
      const cy = -125 + idx * 285;
      const checked = idx === 1 && rR ? cand.file : cand.checked;
      const digestMatch = cand.file.digest === checked.digest;
      const status =
        idx === 0
          ? oR
            ? 'EXPIRED ATTEMPT · KEEP PRIVATE'
            : 'Decision pending'
          : cmR
            ? 'COMMITTED · PUBLIC'
            : rR
              ? 'RECHECKED · AWAITING COMMIT'
              : cR
                ? 'HOLD · CHECK RESIZED FILE'
                : 'Decision pending';
      const statusCol =
        idx === 0
          ? oR
            ? COSMOS.rose
            : COSMOS.muted
          : cmR
            ? COSMOS.emerald
            : rR
              ? COSMOS.cyan
              : cR
                ? COSMOS.rose
                : COSMOS.muted;

      nodes.push(
        glassPlate(440, cy, 800, 232, {
          stroke:
            idx === 1 && cmR ? COSMOS.emerald : statusCol === COSMOS.rose ? COSMOS.rose : '#3a4f7c',
          glow: idx === 1 && cmR ? 11 : 4,
        }),
        pixelGrid(cand.file.samples, {
          cx: 155,
          cy,
          size: 168,
          selected: null,
          frameColor: idx === 0 ? COSMOS.muted : COSMOS.gold,
          grayscale: true,
        }),
        txt(
          `Attempt ${cand.attempt}  ·  ${cand.file.side}×${cand.file.side}`,
          275,
          cy - 72,
          32,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          `File     ${cand.file.digest.slice(0, 8)}`,
          275,
          cy - 18,
          28,
          COSMOS.gold,
          'mono',
          'left',
        ),
        txt(
          `Checked  ${checked.digest.slice(0, 8)}`,
          275,
          cy + 26,
          28,
          digestMatch ? COSMOS.cyan : COSMOS.rose,
          'mono',
          'left',
        ),
        txt(status, 275, cy + 78, 26, statusCol, 'mono', 'left').glow(
          cmR && idx === 1 ? 8 : 0,
          COSMOS.emerald,
        ),
      );
    });

    nodes.push(
      txt(
        cmR
          ? `Immutable URL → …/${candidates[1].file.digest.slice(0, 8)}`
          : 'Public URL pending commit on attempt 5',
        440,
        355,
        32,
        cmR ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).glow(cmR ? 10 : 0, COSMOS.emerald),
    );

    return group(...nodes);
  });

  s.add(liveStudy);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'df-fresh-setup', setupP, 1, { dur: 1.4 });
  pulseCue(s, c, 'df-fresh-pair', pairPulse, 1, { dur: 0.4 });
  // Strict prediction withholding: ALL answers reveal AFTER their spoken clauses!
  cueTo(s, c, 'df-fresh-work', workRev, 1, { after: true, dur: 0.25 });
  cueTo(s, c, 'df-fresh-old', oldRev, 1, { after: true, dur: 0.25 });
  cueTo(s, c, 'df-fresh-current', curRev, 1, { after: true, dur: 0.25 });
  cueTo(s, c, 'df-fresh-recheck', recheckRev, 1, { after: true, dur: 0.25 });
  cueTo(s, c, 'df-fresh-commit', commitRev, 1, { after: true, dur: 0.3 });
}

// ---------------------------------------------------------------------------
// 33. recap: Try the jump on the shadow between the legs
// Cues: shadow-input, shadow-scaled*, shadow-question, shadow-add*, shadow-result*, shadow-uncover
// ---------------------------------------------------------------------------
export function recap(s, c) {
  const inputPulse = s.value(0);
  const scaledRev = s.value(0);
  const askP = s.value(0);
  const addRev = s.value(0);
  const resultRev = s.value(0);
  const travelP = s.value(0);
  const uncoverRev = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.46 }));
  s.add(aura(-500, -30, 440, '#2a588a24', '#151e3d12'));
  s.add(aura(500, -30, 440, '#ffd16622', '#18244a12'));

  const liveRecap = dynamic(() => {
    const sc = scaledRev.value > 0.5;
    const ask = askP.value > 0.5;
    const add = addRev.value > 0.5;
    const res = resultRev.value > 0.5;
    const tr = travelP.value;
    const unc = uncoverRev.value > 0.5;

    const leftPixels = unc ? SHADOW_JUMP.reference : SHADOW_JUMP.input;
    const leftTitle = unc ? 'Forward exposure (0.64)' : 'Input at 0.36';
    const rightPixels = sc ? blend(SHADOW_JUMP.scaled, SHADOW_JUMP.destination, tr) : null;
    const rightTitle =
      res || tr > 0.02
        ? 'Completed jump (0.64)'
        : sc
          ? 'Clean contribution only'
          : 'Destination at 0.64';

    const midNotes = !sc
      ? [
          txt('SHADOW PIXEL', 0, -145, 26, COSMOS.cyan, 'mono'),
          txt('Known ε = +0.60', 0, -78, 36, COSMOS.gold, 'mono'),
          txt('ᾱ: 0.36 → 0.64 · η = 0', 0, -14, 28, COSMOS.muted, 'mono'),
          txt('Input reads  0.000', 0, 50, 30, COSMOS.ink, 'mono'),
        ]
      : !add && !res
        ? [
            txt('DESTINATION  ᾱ = 0.64', 0, -145, 26, COSMOS.cyan, 'mono'),
            txt('clean:  −0.640', 0, -78, 34, COSMOS.ink, 'mono'),
            txt('+ 0.6 × (+0.6)  =  ?', 0, -12, 34, COSMOS.gold, 'mono').glow(
              ask ? 10 : 0,
              COSMOS.gold,
            ),
            txt(ask ? 'Where does it land?' : 'Scaled clean only', 0, 56, 30, COSMOS.gold, 'serif'),
          ]
        : [
            txt('DESTINATION  ᾱ = 0.64', 0, -145, 26, COSMOS.emerald, 'mono'),
            txt('−0.640 + 0.360', 0, -78, 34, COSMOS.ink, 'mono'),
            txt(
              res ? `= ${decimal(SHADOW_JUMP.destination[SHADOW_PIXEL])}` : '= ?',
              0,
              -8,
              46,
              res ? COSMOS.emerald : COSMOS.gold,
              'mono',
            ).glow(res ? 10 : 0, COSMOS.emerald),
            txt(
              unc ? 'Forward exposure agrees!' : 'Carried direction lifts shadow',
              0,
              64,
              28,
              unc ? COSMOS.emerald : COSMOS.cyan,
              'sans',
            ),
          ];

    return group(
      // Left exposure
      txt(leftTitle, -545, -356, 36, COSMOS.cyan, 'serif'),
      pixelGrid(leftPixels, {
        cx: -545,
        cy: -64,
        size: 420,
        selected: SHADOW_PIXEL,
        frameColor: COSMOS.cyan,
      }),
      txt(
        `Marked pixel   ${decimal(leftPixels[SHADOW_PIXEL])}`,
        -545,
        192,
        32,
        COSMOS.cyan,
        'mono',
      ),

      // Right exposure
      txt(rightTitle, 545, -356, 36, unc ? COSMOS.emerald : COSMOS.gold, 'serif'),
      rightPixels
        ? pixelGrid(rightPixels, {
            cx: 545,
            cy: -64,
            size: 420,
            selected: SHADOW_PIXEL,
            frameColor: unc ? COSMOS.emerald : COSMOS.gold,
          })
        : group(
            glassPlate(545, -64, 420, 420, { stroke: COSMOS.gold, glow: 6 }),
            txt('?', 545, -64, 120, COSMOS.muted, 'mono'),
          ),
      txt(
        rightPixels ? `Marked pixel   ${decimal(rightPixels[SHADOW_PIXEL])}` : 'Marked pixel   ?',
        545,
        192,
        32,
        COSMOS.gold,
        'mono',
      ),

      ...midNotes,
      photonWire(
        [
          [-315, 130],
          [-215, 130],
        ],
        drift.value * 2.6,
        { color: COSMOS.cyan, width: 2.5 },
      ),
      photonWire(
        [
          [215, 130],
          [315, 130],
        ],
        drift.value * 2.6 + 0.5,
        { color: COSMOS.gold, width: 2.5 },
      ),

      brightnessRuler({
        cx: 0,
        cy: 342,
        width: 1460,
        left: -1.0,
        right: 0.2,
        ticks: [-1.0, -0.8, -0.6, -0.4, -0.2, 0.0],
        reference: leftPixels[SHADOW_PIXEL],
        current: rightPixels ? rightPixels[SHADOW_PIXEL] : null,
      }),
    );
  });

  s.add(liveRecap);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'shadow-input', inputPulse, 1, { dur: 0.5 });
  cueTo(s, c, 'shadow-scaled', scaledRev, 1, { after: true, dur: 0.3 });
  pulseCue(s, c, 'shadow-question', askP, 1, { dur: 0.35 });
  cueTo(s, c, 'shadow-add', addRev, 1, { after: true, dur: 0.25 });
  cueTo(s, c, 'shadow-result', resultRev, 1, { after: true, dur: 0.25 });
  cueTo(s, c, 'shadow-result', travelP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'shadow-uncover', uncoverRev, 1, { after: true, dur: 0.3 });
}
