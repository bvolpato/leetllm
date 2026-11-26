// Scene 15: Same batch, different next weight (Tensor aliasing vs frozen snapshot + Adam moment fork)
import { delay, par } from 'vizmatic/stage';
import {
  ADAM_FORK,
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingArc,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function resumeFork(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const showFreeze = s.value(0);
  const showChecklist = s.value(0);

  const showPart2 = s.value(0);
  const showRestored = s.value(0);
  const showReset = s.value(0);

  const showPart3 = s.value(0);
  const showExact = s.value(0);

  const bgAura = aura(0, 20, 640, '#18336626', '#3d1e5414');

  // Beat 1: Live tensor storage aliasing vs serialized frozen checkpoint
  const part1 = guardedDynamic(showPart1, (a) => {
    const fr = showFreeze.value;
    const ch = showChecklist.value;
    const p = phase.value;
    const liveVal = (0.8 - 0.12 * Math.sin(p * 1.4)).toFixed(3);

    const nodes = [
      heroTitle(['Freeze the Checkpoint', 'Before Continuing'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.rose,
        eyebrow: 'STORAGE ALIASING · COMPLETE RESUME STATE',
      }).opacity(a),

      glassCell(-550, -90, 420, 124, COSMOS.cyan, { fill: '#102138', glow: 6, opacity: a }),
      txt('LIVE TENSOR STORAGE', -550, -120, 26, COSMOS.cyan, 'mono').opacity(a),
      txt(`w = ${liveVal} (mutating)`, -550, -68, 34, COSMOS.ink, 'mono').opacity(a),

      glowingArc([-336, -90], [-140, -90], -26, { color: COSMOS.rose, width: 3.6, opacity: a }),
      glassCell(130, -90, 520, 124, COSMOS.rose, {
        fill: '#27111a',
        dash: [8, 6],
        glow: 7,
        opacity: a,
      }),
      txt('UNCOPIED state_dict()', 130, -120, 26, COSMOS.rose, 'mono').opacity(a),
      txt(`reads w = ${liveVal} (drifts!)`, 130, -68, 30, COSMOS.rose, 'mono').opacity(a),
      // Pre-frame frozen checkpoint target below so lower canvas is balanced from Beat 1 start
      glassCell(-550, 158, 490, 124, fr > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: fr > 0.3 ? '#0e2624' : '#12182b',
        glow: fr > 0.3 ? 8 : 3,
        opacity: Math.max(0.75, fr) * a,
      }),
      txt(
        'COPIED / SERIALIZED',
        -550,
        128,
        26,
        fr > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).opacity(Math.max(0.75, fr) * a),
      txt(
        fr > 0.3 ? 'w = 0.800 (frozen)' : 'freeze snapshot',
        -550,
        180,
        30,
        fr > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      )
        .glow(fr > 0.3 ? 6 : 0, COSMOS.emerald)
        .opacity(Math.max(0.75, fr) * a),

      txt('SAVE TOGETHER IN ONE CHECKPOINT:', -180, 92, 26, COSMOS.gold, 'mono', 'left').opacity(
        Math.max(0.7, ch) * a,
      ),
      txt(
        '· Weights + AdamW moments & step count',
        -180,
        146,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(Math.max(0.7, ch) * a),
      txt(
        '· Config + tokenizer version + active row order',
        -180,
        196,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(Math.max(0.7, ch) * a),
      txt(
        '· Corpus fingerprint + split + BOTH RNG states',
        -180,
        246,
        28,
        COSMOS.gold,
        'sans',
        'left',
      ).opacity(Math.max(0.7, ch) * a),
    ];

    if (fr > 0.05) {
      nodes.push(
        glowingArc([-550, -24], [-550, 92], 0, {
          color: COSMOS.emerald,
          width: 3.8,
          opacity: fr * a,
        }),
      );
    }

    return group(...nodes);
  });

  // Beat 2: Scalar Adam fork from w = 0.800 (restored -> 0.814 vs reset -> 0.900)
  const part2 = guardedDynamic(showPart2, (a) => {
    const rs = showRestored.value;
    const rt = showReset.value;

    // Weight trajectory chart: steps 0, 1, 2, 3
    const xL = -720;
    const xR = 230;
    const yTop = -150;
    const yBot = 240;
    const sx = (step) => xL + (step / 3) * (xR - xL);
    const sy = (w) => yBot - ((w - 0.75) / 0.3) * (yBot - yTop);

    const w0 = 1.0;
    const w1 = ADAM_FORK.prefix.states[0].weight; // 0.9
    const w2 = ADAM_FORK.prefix.weight; // 0.8
    const wRestored = ADAM_FORK.restored.weight; // 0.814286
    const wReset = ADAM_FORK.reset.weight; // 0.900

    const nodes = [
      heroTitle(['Same Batch,', 'Different Next Weight'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.gold,
        eyebrow: 'SCALAR ADAM · beta1 = beta2 = 0.5 · lr = 0.1 · g = [+1, +1, -1]',
      }).opacity(a),

      line([xL, yBot], [xR + 40, yBot], { stroke: COSMOS.rule, width: 2 }).opacity(a),
      line([xL, yBot], [xL, yTop - 30], { stroke: COSMOS.rule, width: 2 }).opacity(a),
      txt('WEIGHT w', xL, yTop - 62, 26, COSMOS.muted, 'mono', 'left').opacity(a),

      // Shared prefix trajectory: (0, 1.0) -> (1, 0.9) -> (2, 0.8)
      glowingTrail(
        [
          [sx(0), sy(w0)],
          [sx(1), sy(w1)],
          [sx(2), sy(w2)],
        ],
        { color: COSMOS.cyan, width: 5, opacity: a },
      ),
      glowDot(sx(0), sy(w0), { radius: 8, color: COSMOS.cyan, opacity: a }),
      txt('w_0 = 1.00', sx(0) + 18, sy(w0) - 34, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      glowDot(sx(1), sy(w1), { radius: 8, color: COSMOS.cyan, opacity: a }),
      txt('g = +1 -> 0.90', sx(1) + 22, sy(w1) - 42, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      glowDot(sx(2), sy(w2), { radius: 10, color: COSMOS.gold, opacity: a }),
      txt('SAVE: w_2 = 0.80', sx(2), yBot + 40, 28, COSMOS.gold, 'mono')
        .glow(6, COSMOS.gold)
        .opacity(a),
      txt('next gradient: g_3 = -1', sx(2.5), yBot + 88, 28, COSMOS.gold, 'mono').opacity(a),
    ];

    if (rs > 0.05) {
      const ex = sx(2) + (sx(3) - sx(2)) * rs;
      const ey = sy(w2) + (sy(wRestored) - sy(w2)) * rs;
      nodes.push(
        glowingTrail(
          [
            [sx(2), sy(w2)],
            [ex, ey],
          ],
          { color: COSMOS.emerald, width: 5.2, opacity: rs * a },
        ),
        glowDot(ex, ey, { radius: 9, color: COSMOS.emerald, opacity: rs * a }),
        txt(
          `Restored -> w_3 = ${wRestored.toFixed(3)}`,
          sx(3) + 28,
          sy(wRestored) + 4,
          30,
          COSMOS.emerald,
          'mono',
          'left',
        )
          .glow(7, COSMOS.emerald)
          .opacity(rs * a),
      );
    }

    if (rt > 0.05) {
      const ex = sx(2) + (sx(3) - sx(2)) * rt;
      const ey = sy(w2) + (sy(wReset) - sy(w2)) * rt;
      nodes.push(
        glowingTrail(
          [
            [sx(2), sy(w2)],
            [ex, ey],
          ],
          { color: COSMOS.rose, width: 5.2, opacity: rt * a },
        ),
        glowDot(ex, ey, { radius: 9, color: COSMOS.rose, opacity: rt * a }),
        txt(
          `Reset -> w_3 = ${wReset.toFixed(3)}`,
          sx(3) + 28,
          sy(wReset) + 4,
          30,
          COSMOS.rose,
          'mono',
          'left',
        )
          .glow(7, COSMOS.rose)
          .opacity(rt * a),
        txt(
          'Pre-update loss agrees, post-update weights diverge!',
          -720,
          365,
          30,
          COSMOS.rose,
          'sans',
          'left',
        ).opacity(rt * a),
      );
    }

    return group(...nodes);
  });

  // Beat 3: Exact CPU checkpoint parity at step 321 -> 322
  const part3 = guardedDynamic(showPart3, (a) => {
    const ex = showExact.value;
    const nodes = [
      heroTitle(['Exact CPU Resume', 'at Update 321 -> 322'], {
        x: -855,
        y: -415,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.emerald,
        eyebrow: 'CONTINUOUS RUN vs RESTORED CHECKPOINT',
      }).opacity(a),

      glassCell(-520, -60, 560, 128, COSMOS.cyan, { fill: '#102138', glow: 6, opacity: a }),
      txt('CONTINUOUS RUN (STEP 321)', -520, -90, 26, COSMOS.cyan, 'mono').opacity(a),
      txt('probe logits · next batch · loss', -520, -34, 28, COSMOS.ink, 'sans').opacity(a),

      glassCell(-520, 130, 560, 128, COSMOS.gold, { fill: '#241e0e', glow: 6, opacity: a }),
      txt('RESTORED CHECKPOINT (STEP 321)', -520, 100, 26, COSMOS.gold, 'mono').opacity(a),
      txt('weights + AdamW + RNG states', -520, 156, 28, COSMOS.ink, 'sans').opacity(a),

      // Right target convergence panel framed from Beat 3 start
      glassCell(470, 35, 560, 160, ex > 0.3 ? COSMOS.emerald : COSMOS.rule, {
        fill: ex > 0.3 ? '#0e2824' : '#0e1322',
        glow: ex > 0.3 ? 10 : 0,
        opacity: Math.max(0.45, ex) * a,
      }),
      txt(
        'AFTER UPDATE 322',
        470,
        -10,
        26,
        ex > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).opacity(Math.max(0.45, ex) * a),
      txt(
        ex > 0.3 ? 'max |Δ weight| = 0.0' : 'Compare step 322 weights',
        470,
        52,
        ex > 0.3 ? 44 : 32,
        ex > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      )
        .glow(ex > 0.3 ? 8 : 0, COSMOS.emerald)
        .opacity(Math.max(0.45, ex) * a),
    ];

    if (ex > 0.05) {
      nodes.push(
        glowingArc([-234, -60], [180, 35], -30, {
          color: COSMOS.emerald,
          width: 4,
          opacity: ex * a,
        }),
        glowingArc([-234, 130], [180, 35], 30, {
          color: COSMOS.emerald,
          width: 4,
          opacity: ex * a,
        }),
        txt(
          'Also save dropout/CUDA RNG, scheduler, GradScaler · AdamW decouples weight decay',
          0,
          335,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(ex * a),
      );
    }

    return group(...nodes);
  });

  const eqAdam = glowTex('\\Delta w = -\\eta \\frac{\\hat{m}_t}{\\sqrt{\\hat{v}_t}}', {
    x: 560,
    y: -310,
    size: 42,
    color: COSMOS.gold,
    glow: 6,
  });

  s.add(bgAura, part1, part2, part3);
  runPhase(s, c, phase, 16);

  c.on('resume-fork-1', () => s.play(phase.to(1.2, { duration: 0.4 })));
  c.on('freeze-storage', () => s.play(showFreeze.to(1, { duration: 0.5 })));
  c.on('save-progress', () => s.play(showChecklist.to(1, { duration: 0.5 })));

  c.on('resume-fork-2', () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.show('resume-fork-2', eqAdam, { fade: 0.35 });
  c.on('restore-moments', () => s.play(showRestored.to(1, { duration: 0.6 })));
  c.on('reset-moments', () => s.play(showReset.to(1, { duration: 0.6 })));

  c.on('resume-fork-3', () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.hide('resume-fork-3', eqAdam, { fade: 0.2 });
  c.on('exact-resume', () =>
    s.play(showExact.to(1, { duration: remainDuration(c, 'exact-resume', 0.6) })),
  );
}
