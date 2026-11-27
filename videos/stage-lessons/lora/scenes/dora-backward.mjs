// Scene 31: What does the row length contribute to the gradient?: Stretch [3,4]->[6,8] prediction (output stays 3) + detached [1,0] vs full [0.64,-0.48] + radial check + VL-BART.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  DORA_BASE,
  DORA_BASE_V,
  DORA_M,
  DORA_X,
  arrow,
  aura,
  circle,
  doraRow,
  fmtNum,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function doraBackward(s, c) {
  const showFwd = s.value(1);
  const showStartOut = s.value(0);
  const stretchProg = s.value(0);
  const revealSame = s.value(0); // strictly withheld until after dora-same!
  const showBwd = s.value(0);
  const revealDirect = s.value(0);
  const subProg = s.value(0);
  const revealFull = s.value(0);
  const revealRadial = s.value(0);
  const showStudy = s.value(0);

  const bgAura = aura(0, 10, 620, '#ffd1661c', '#ff6b8b1a');
  const title = heroTitle(['Row Length and', 'Detached Gradients'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'DORA BACKWARD · FULL VS DETACHED NORM',
  });

  // Part 1: Forward stretch [3,4] -> [6,8] prediction
  const ox1 = -730;
  const oy1 = 355;
  const u1 = 68;
  const p1 = (vx, vy) => [ox1 + vx * u1, oy1 - vy * u1];

  const partFwd = guardedDynamic(showFwd, (a) => {
    const st = stretchProg.value;
    const so = showStartOut.value > 0.4;
    const rs = revealSame.value > 0.5;
    const curV = [DORA_BASE_V[0] * (1 + st), DORA_BASE_V[1] * (1 + st)];
    const curRow = doraRow(curV, DORA_M, DORA_X);
    const isStretched = st > 0.3;
    const canShowAnswer = (!isStretched && so) || rs;

    const nodes = [
      line(p1(-0.5, 0), p1(7.6, 0), { stroke: '#3a4c78', width: 2.5 }).opacity(a),
      line(p1(0, -0.5), p1(0, 8.8), { stroke: '#3a4c78', width: 2.5 }).opacity(a),
      txt('3', p1(3, 0)[0], p1(3, 0)[1] + 34, 26, COSMOS.muted, 'mono').opacity(a),
      txt('6', p1(6, 0)[0], p1(6, 0)[1] + 34, 26, COSMOS.muted, 'mono').opacity(a),
      arrow(p1(0, 0), p1(curV[0], curV[1]), { stroke: COSMOS.gold, width: 6, tip: 16 })
        .glow(10, COSMOS.gold)
        .opacity(a),
      circle(9, COSMOS.cyan).at(p1(3, 4)[0], p1(3, 4)[1]).glow(9, COSMOS.cyan).opacity(a),
      txt('V₀ = [3, 4]', p1(3, 4)[0] + 135, p1(3, 4)[1] + 18, 26, COSMOS.cyan, 'mono').opacity(a),
      txt(
        `V = [${fmtNum(curV[0], 1)}, ${fmtNum(curV[1], 1)}]`,
        p1(curV[0], curV[1])[0] + 125,
        p1(curV[0], curV[1])[1] - 26,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),

      // Right readout panel
      glassCell(405, -135, 810, 140, COSMOS.cyan, { fill: '#101d35', glow: 7, opacity: a }),
      txt('FIXED PARAMETERS', 35, -172, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('Magnitude m = 5 · Input x = [1, 0]', 35, -114, 30, COSMOS.cyan, 'mono', 'left').opacity(
        a,
      ),

      glassCell(405, 45, 810, 168, isStretched && !rs ? COSMOS.gold : COSMOS.emerald, {
        fill: '#121a30',
        glow: 9,
        opacity: a,
      }),
      txt(
        'FORWARD OUTPUT  y = m · (V·x) / ||V||',
        35,
        -4,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
      txt(
        `${fmtNum(curV[0], 1)} × 5 / ${fmtNum(curRow.norm, 1)} = ${canShowAnswer ? fmtNum(curRow.output, 1) : '?'}`,
        35,
        68,
        46,
        canShowAnswer ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      )
        .glow(8, canShowAnswer ? COSMOS.emerald : COSMOS.gold)
        .opacity(a),

      glassCell(405, 255, 810, 148, rs ? COSMOS.emerald : COSMOS.gold, {
        fill: '#11182c',
        glow: 6,
        opacity: a,
      }),
      txt(
        rs
          ? 'Output stays 3! Doubling V also doubles ||V|| (norm cancels)'
          : isStretched
            ? 'V doubled to [6, 8] (||V|| = 10): what output will x = [1, 0] see?'
            : 'Start at V = [3, 4], length 5, magnitude 5',
        405,
        255,
        26,
        rs ? COSMOS.emerald : COSMOS.gold,
        'sans',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  // Part 2: Backward gradient vector subtraction + radial dot check + VL-BART study
  const ox2 = -685;
  const oy2 = -20;
  const u2 = 445;
  const p2 = (vx, vy) => [ox2 + vx * u2, oy2 - vy * u2];

  const partBwd = guardedDynamic(showBwd, (a) => {
    const rd = revealDirect.value > 0.4;
    const sp = subProg.value;
    const rf = revealFull.value > 0.4;
    const rr = revealRadial.value > 0.4;
    const st = showStudy.value > 0.4;

    const dir = DORA_BASE.detached; // [1, 0]
    const full = DORA_BASE.full; // [0.64, -0.48]
    const curSub = [dir[0] + sp * (full[0] - dir[0]), dir[1] + sp * (full[1] - dir[1])];

    const nodes = [
      // Vector diagram on left
      line(p2(-0.1, 0), p2(1.22, 0), { stroke: '#3a4c78', width: 2.5 }).opacity(a),
      line(p2(0, 0.25), p2(0, -0.68), { stroke: '#3a4c78', width: 2.5 }).opacity(a),
      txt('GRADIENT VECTORS AT V = [3, 4]', -435, -185, 26, COSMOS.cyan, 'mono').opacity(a),

      arrow(p2(0, 0), p2(dir[0], dir[1]), { stroke: COSMOS.cyan, width: 6, tip: 15 })
        .glow(10, COSMOS.cyan)
        .opacity(a),
      txt(
        rd ? 'detached [1, 0]' : 'direct',
        p2(1, 0)[0] - 40,
        p2(1, 0)[1] - 34,
        26,
        COSMOS.cyan,
        'mono',
      ).opacity(a),

      // Subtract radial projection vector [-0.36, -0.48]
      arrow(p2(dir[0], dir[1]), p2(curSub[0], curSub[1]), {
        stroke: COSMOS.rose,
        width: 5,
        tip: 14,
      })
        .glow(9, COSMOS.rose)
        .opacity(sp * a),
      txt(
        '−[0.36, 0.48]',
        p2(0.84, -0.22)[0] + 130,
        p2(0.84, -0.22)[1] + 24,
        26,
        COSMOS.rose,
        'mono',
      ).opacity(sp * a),

      // Full gradient [0.64, -0.48]
      arrow(p2(0, 0), p2(full[0], full[1]), { stroke: COSMOS.gold, width: 6, tip: 15 })
        .glow(11, COSMOS.gold)
        .opacity((rf ? 1 : 0) * a),
      glowDot(p2(full[0], full[1])[0], p2(full[0], full[1])[1], {
        radius: 8,
        color: COSMOS.gold,
        opacity: (rf ? 1 : 0) * a,
      }),
      txt(
        'full [0.64, −0.48]',
        p2(full[0], full[1])[0] - 90,
        p2(full[0], full[1])[1] + 38,
        26,
        COSMOS.gold,
        'mono',
      ).opacity((rf ? 1 : 0) * a),

      // Right formulas & comparison
      glassCell(410, -110, 810, 128, COSMOS.cyan, {
        fill: '#102135',
        glow: rd ? 9 : 4,
        opacity: a,
      }),
      txt(
        'DETACHED DENOMINATOR (PEFT / DoRA PAPER)',
        40,
        -144,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
      txt(
        rd ? 'mx / ||V||  =  [1, 0]' : 'mx / ||V||  =  ?',
        40,
        -86,
        36,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),

      glassCell(410, 48, 810, 148, rf ? COSMOS.gold : COSMOS.rose, {
        fill: '#221818',
        glow: rf ? 10 : 5,
        opacity: a,
      }),
      txt(
        'FULL DIFFERENTIATION  (SUBTRACT RADIAL PART)',
        40,
        2,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ).opacity(a),
      txt(
        rf ? 'full grad  =  [0.64, −0.48]' : 'Subtract m(V·x)V / ||V||³',
        40,
        66,
        36,
        rf ? COSMOS.gold : COSMOS.rose,
        'mono',
        'left',
      ).opacity(a),

      // Bottom strip: Radial dot-product check -> VL-BART study correlations
      glassCell(0, 342, 1680, 144, st ? COSMOS.violet : rr ? COSMOS.emerald : '#334268', {
        fill: '#10182d',
        glow: rr || st ? 9 : 3,
        opacity: a,
      }),
      txt(
        st
          ? 'VL-BART STUDY CORRELATIONS (MAGNITUDE VS DIRECTION CHANGE)'
          : 'RADIAL DOT-PRODUCT TEST ALONG STRETCH [3, 4]',
        0,
        304,
        26,
        st ? COSMOS.violet : COSMOS.muted,
        'mono',
      ).opacity(a),
      txt(
        st
          ? 'Full fine-tuning: −0.62     ·     LoRA: +0.83     ·     DoRA: −0.31'
          : rr
            ? 'Detached [1, 0] · [3, 4] = 3     ·     Full [0.64, −0.48] · [3, 4] = 0 (orthogonal!)'
            : 'Test both gradients along the stretch direction [3, 4]',
        0,
        362,
        30,
        st ? COSMOS.ink : rr ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, partFwd, partBwd);

  c.on('dora-start', () => s.play(showStartOut.to(1, { duration: 0.35 })));
  c.on('dora-stretch', () => s.play(stretchProg.to(1, { duration: 0.7 })));
  c.after('dora-same', () => s.play(revealSame.to(1, { duration: 0.35 })));
  c.on('dora-rewind', () => s.play(stretchProg.to(0, { duration: 0.5 })));
  c.on('dora-direct', () => {
    s.play(
      par(
        showFwd.to(0, { duration: 0.16 }),
        delay(showBwd.to(1, { duration: 0.2 }), 0.16),
        revealDirect.to(1, { duration: 0.25 }),
      ),
    );
  });
  c.on('dora-subtract', () => s.play(subProg.to(1, { duration: 0.6 })));
  c.after('dora-full', () => s.play(revealFull.to(1, { duration: 0.35 })));
  c.after('dora-radial-check', () => s.play(revealRadial.to(1, { duration: 0.35 })));
  c.on('dora-study', () =>
    s.play(showStudy.to(1, { duration: remainDuration(c, 'dora-study', 0.45) })),
  );
}
