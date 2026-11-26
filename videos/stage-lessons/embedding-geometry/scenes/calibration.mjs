// Scene 11: calibration: "An outlier spends the available buckets"
// Luminous dual quantization-staircase plots (bound=25 coarse vs bound=1 fine) with MAE gauges,
// morphing left panel to an outlier saturation rail (25 -> 1, err=24) and right panel to an
// enlarged angular direction cone ([1, 0.05] vs [1, 0.04]).
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  calibrationRanking,
  calibrationResult,
  cinemaAtmosphere,
  glowDot,
  glowVector,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rule,
  runPhase,
  swapVis,
  txt,
} from '../parts.mjs';

export default function calibration(s, c) {
  const resWide = calibrationResult(25);
  const resFine = calibrationResult(1);
  const ranking = calibrationRanking();

  const phase = s.value(0);
  const fineBound = s.value(25);
  const litWide = s.value(0);
  const showErrors = s.value(0);
  const vLeftStair = s.value(1);
  const vLeftClip = s.value(0);
  const clipPos = s.value(25);
  const showClipErr = s.value(0);

  const vRightStair = s.value(1);
  const vRightDir = s.value(0);
  const dirStage = s.value(0); // 0=original, 1=coarse, 2=fine
  const showOrigWin = s.value(0);
  const showCoarseWin = s.value(0);
  const showFineWin = s.value(0);

  const title = heroTitle(['An outlier spends', 'the available buckets'], {
    x: -855,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.warn,
    eyebrow: 'CALIBRATION & CLIPPING',
  });

  // Helper to build a glowing staircase inside box centered at [cx, cy] with half-size h
  const buildStairPlot = (cx, cy, half, boundVal, color, headingText, alpha) => {
    const mapX = (vx) => cx + vx * half;
    const mapY = (vy) => cy - vy * half;
    const cal = calibrationResult(boundVal);
    const pts = [];
    for (let i = 0; i < cal.input.length; i++) {
      if (i > 0) pts.push([mapX(cal.input[i]), mapY(cal.output[i - 1])]);
      pts.push([mapX(cal.input[i]), mapY(cal.output[i])]);
    }
    return group(
      txt(headingText, cx, cy - half - 40, 28, color, 'mono').opacity(alpha),
      // Axes + diagonal reference y = x
      line([mapX(-1), mapY(0)], [mapX(1), mapY(0)], { stroke: '#3a4c74', width: 2 }).opacity(alpha),
      line([mapX(0), mapY(-1)], [mapX(0), mapY(1)], { stroke: '#3a4c74', width: 2 }).opacity(alpha),
      line([mapX(-1), mapY(-1)], [mapX(1), mapY(1)], {
        stroke: '#51648f',
        width: 1.8,
        dash: [6, 6],
      }).opacity(0.65 * alpha),
      glowingTrail(pts, { color, width: 4.0, glow: 8, opacity: alpha }),
      txt('-1', mapX(-1), mapY(0) + 34, 26, COSMOS.dim, 'mono').opacity(alpha),
      txt('+1', mapX(1), mapY(0) + 34, 26, COSMOS.dim, 'mono').opacity(alpha),
      txt('input x ∈ [-1, 1]', cx, cy + half + 36, 26, COSMOS.muted, 'sans').opacity(alpha),
    );
  };

  // Upper-Left View 1: Wide bound 25 staircase
  const leftStairLayer = guardedDynamic(vLeftStair, (a) =>
    buildStairPlot(
      -445,
      -55,
      195,
      25,
      litWide.value > 0.3 ? ROLE.warn : ROLE.query,
      'bound 25  (step = 0.197)',
      a,
    ),
  );

  // Upper-Left View 2: Outlier clipping rail (25 -> clipped at 1)
  const leftClipLayer = guardedDynamic(vLeftClip, (a) => {
    const rL = -785;
    const rR = -115;
    const ry = -45;
    const pos = (val) => rL + (val / 25) * (rR - rL);
    const curX = pos(clipPos.value);
    const capX = pos(1);
    return group(
      txt('OUTLIER SATURATION', -450, -210, 28, ROLE.danger, 'mono')
        .glow(6, ROLE.danger)
        .opacity(a),
      txt('bound 1 clips 25 down to 1', -450, -160, 28, COSMOS.muted, 'sans').opacity(a),
      line([rL, ry], [rR, ry], { stroke: '#4c608e', width: 4.5 }).opacity(a),
      line([capX, ry - 26], [capX, ry + 26], { stroke: ROLE.A, width: 4 })
        .glow(7, ROLE.A)
        .opacity(a),
      txt('0', rL, ry + 48, 26, COSMOS.dim, 'mono').opacity(a),
      txt('1', capX + 18, ry + 48, 26, ROLE.A, 'mono').opacity(a),
      txt('25', rR, ry + 48, 28, ROLE.danger, 'mono').opacity(a),
      line([curX, ry], [rR, ry], { stroke: ROLE.danger, width: 5, dash: [8, 6] })
        .glow(7, ROLE.danger)
        .opacity(a),
      glowDot(curX, ry, { radius: 11, color: ROLE.danger, glow: 13, opacity: a }),
      txt(clipPos.value.toFixed(1), curX, ry - 58, 32, ROLE.danger, 'mono').opacity(a),
    );
  });

  // Upper-Right View 1: Dynamic fine staircase (25 -> 1)
  const rightStairLayer = guardedDynamic(vRightStair, (a) => {
    const b = fineBound.value;
    const stepStr = (b / 127).toFixed(4);
    return buildStairPlot(
      445,
      -55,
      195,
      b,
      ROLE.A,
      `bound ${b.toFixed(0)}  (step = ${stepStr})`,
      a,
    );
  });

  // Upper-Right View 2: Enlarged angular direction test ([1, 0.05] vs [1, 0.04])
  const rightDirLayer = guardedDynamic(vRightDir, (a) => {
    const st = dirStage.value;
    const startRows = st <= 1 ? ranking.original : ranking.coarse;
    const endRows = st <= 1 ? ranking.coarse : ranking.fine;
    const mix = st <= 1 ? st : st - 1;
    const rows = startRows.map((v, i) => v.map((val, j) => val + (endRows[i][j] - val) * mix));

    // Magnified plane: x in [0.94, 1.015], y in [-0.01, 0.065]
    const ox = 250;
    const oy = 95;
    const w = 520;
    const h = 300;
    const mapX = (vx) => ox + ((vx - 0.94) / 0.075) * w;
    const mapY = (vy) => oy - ((vy + 0.01) / 0.075) * h;

    const nodes = [
      txt('DIRECTION SEPARATION TEST  (q = [1, 0])', 495, -265, 26, ROLE.code, 'mono').opacity(a),
      txt('first [1, .05]', 155, -210, 26, ROLE.A, 'mono', 'left').opacity(a),
      txt('second [1, .04]', 515, -210, 26, ROLE.B, 'mono', 'left').opacity(a),
      line([mapX(0.94), mapY(0)], [mapX(1.01), mapY(0)], { stroke: ROLE.query, width: 3.5 })
        .glow(6, ROLE.query)
        .opacity(a),
      txt('q', mapX(1.01) + 18, mapY(0), 28, ROLE.query, 'mono', 'left').opacity(a),
    ];

    rows.forEach((v, i) => {
      const col = i === 0 ? ROLE.A : ROLE.B;
      const yStart = (0.94 * v[1]) / v[0];
      const p0 = [mapX(0.94), mapY(yStart)];
      const p1 = [mapX(v[0]), mapY(v[1])];
      nodes.push(
        line(p0, p1, { stroke: col, width: i === 0 ? 5.5 : 3.5 })
          .glow(7, col)
          .opacity(a),
        glowDot(p1[0], p1[1], { radius: i === 0 ? 11 : 7, color: col, glow: 10, opacity: a }),
      );
    });

    return group(...nodes);
  });

  // Lower telemetry strip: MAE bars + outlier clip error + 3 direction verdicts (no boxy tables!)
  const lowerLayer = dynamic(() => {
    const eOp = showErrors.value;
    const cOp = showClipErr.value;
    const oOp = showOrigWin.value;
    const coOp = showCoarseWin.value;
    const fiOp = showFineWin.value;

    const nodes = [
      rule(-855, 200, 855, 200, COSMOS.rule, 1.8).opacity(0.6),
      rule(0, 225, 0, 425, COSMOS.rule, 1.8).opacity(0.6),
      txt('ORDINARY RECONSTRUCTION MAE', -845, 245, 26, COSMOS.muted, 'mono', 'left'),
      txt('DIRECTION RANKING VERDICT', 45, 245, 26, COSMOS.muted, 'mono', 'left'),
    ];

    if (eOp > 0.02) {
      nodes.push(
        txt('bound 25', -845, 305, 28, ROLE.query, 'mono', 'left').opacity(eOp),
        lumBar(-680 + 185, 305, 370, 26, {
          color: ROLE.warn,
          fillAlpha: 0.36,
          glow: 7,
          opacity: eOp,
        }),
        txt(resWide.mae.toFixed(4), -290, 305, 30, ROLE.warn, 'mono', 'left').opacity(eOp),
        txt('bound 1', -845, 365, 28, ROLE.A, 'mono', 'left').opacity(eOp),
        lumBar(-680 + 12, 365, 24, 26, { color: ROLE.A, fillAlpha: 0.5, glow: 8, opacity: eOp }),
        txt(`${resFine.mae.toFixed(4)}  (25× finer)`, -640, 365, 30, ROLE.A, 'mono', 'left')
          .glow(6, ROLE.A)
          .opacity(eOp),
      );
    }

    if (cOp > 0.02) {
      nodes.push(
        txt('outlier clip error = 24', -845, 420, 28, ROLE.danger, 'mono', 'left')
          .glow(6, ROLE.danger)
          .opacity(cOp),
      );
    }

    const verdicts = [
      { label: 'Full precision', val: 'second', col: ROLE.B, op: oOp, y: 302 },
      { label: 'Wide bound 25', val: 'first  (tie flip!)', col: ROLE.warn, op: coOp, y: 356 },
      { label: 'Fine bound 1', val: 'second  (preserved)', col: ROLE.A, op: fiOp, y: 410 },
    ];
    verdicts.forEach((v) => {
      nodes.push(txt(v.label, 45, v.y, 28, COSMOS.muted, 'sans', 'left'));
      if (v.op > 0.02) {
        nodes.push(
          txt(`→  ${v.val}`, 335, v.y, 30, v.col, 'mono', 'left').glow(6, v.col).opacity(v.op),
        );
      }
    });

    return group(...nodes);
  });

  s.add(
    cinemaAtmosphere(ROLE.warn, ROLE.A),
    title,
    leftStairLayer,
    leftClipLayer,
    rightStairLayer,
    rightDirLayer,
    lowerLayer,
  );

  runPhase(s, c, phase, 8);

  playCue(s, c, 'wide', (d) => s.play(litWide.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'fine', (d) => s.play(fineBound.to(1, { duration: d })), { dur: 2.6 });
  playCue(s, c, 'errors', (d) => s.play(showErrors.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'outlier', (d) => s.play(swapVis(vLeftStair, vLeftClip, d)), { dur: 0.65 });
  playCue(s, c, 'outlier', (d) => s.play(clipPos.to(1, { duration: d })), {
    offset: 0.65,
    dur: 1.4,
  });
  playCue(s, c, 'clip', (d) => s.play(showClipErr.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'directions', (d) => s.play(swapVis(vRightStair, vRightDir, d)), { dur: 0.65 });
  playCue(s, c, 'original', (d) => s.play(showOrigWin.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'coarse', (d) => s.play(dirStage.to(1, { duration: d })), { dur: 1.1 });
  playCue(s, c, 'coarse', (d) => s.play(showCoarseWin.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'precise', (d) => s.play(dirStage.to(2, { duration: d })), { dur: 1.1 });
  playCue(s, c, 'precise', (d) => s.play(showFineWin.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
}
