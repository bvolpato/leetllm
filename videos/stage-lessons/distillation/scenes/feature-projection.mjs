// Scene 08: Which projection rows need to move? (Feature distillation bridge + 3D projection slab)
import {
  COSMOS,
  aura,
  buildProjectionBridge3d,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  projectionFixture,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function featureProjection(s, c) {
  const phase = s.value(0);
  const sGaps = s.value(0);
  const sError = s.value(0);
  const sGrad = s.value(0);
  const sUpdate = s.value(0);
  const sOutput = s.value(0);
  const sFresh = s.value(0);
  const sCheck = s.value(0);

  const bgAura = aura(490, 40, 560, '#13375e2a', '#2e1c5414');
  const bridge3d = buildProjectionBridge3d(phase, sOutput, sFresh, { x: 520, y: 35 });

  const title = heroTitle(['Which Projection Rows', 'Need to Move?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.violet,
    eyebrow: 'FEATURE DISTILLATION · 2D STUDENT -> 3D TEACHER PROJECTION',
  });

  const eqFeat = glowTex('\\mathcal{L}_{\\mathrm{feat}} = \\| f^t - A\\, f^s \\|^2', {
    x: 520,
    y: -365,
    size: 38,
    color: COSMOS.violet,
    glow: 7,
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const err = sError.value;
    const grd = sGrad.value;
    const upd = sUpdate.value;
    const out = sOutput.value;
    const fr = sFresh.value;
    const chk = sCheck.value;

    const isFresh = fr > 0.5;
    const showOut = !isFresh || chk > 0.5;
    const matFix = projectionFixture(upd, isFresh);
    const outFix = projectionFixture(out, isFresh);
    const rowNames = ['Top', 'Mid', 'Bot'];
    const fmt = (v) => String(Number(v.toFixed(2)));

    const nodes = [
      txt(
        isFresh ? 'FRESH TOKEN:  h = [2, 1]' : 'HELD TOKEN:  h = [1, 2]',
        -855,
        -208,
        30,
        isFresh ? COSMOS.gold : COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        upd > 0.5 ? 'UPDATED MATRIX A' : 'PROJECTION MATRIX A',
        -855,
        -138,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
      txt('x h1', -665, -92, 26, COSMOS.muted, 'mono'),
      txt('x h2', -515, -92, 26, COSMOS.muted, 'mono'),
    ];

    // 3x2 projection matrix cells
    matFix.A.forEach((row, i) => {
      const y = -26 + i * 86;
      const moved = upd > 0.5 && i > 0;
      nodes.push(
        txt(rowNames[i], -855, y, 28, COSMOS.ink, 'mono', 'left'),
        glassCell(-665, y, 126, 62, moved ? COSMOS.gold : COSMOS.rule, {
          fill: moved ? '#221c0e' : '#10182b',
          glow: moved ? 6 : 0,
        }),
        txt(row[0].toFixed(2), -665, y + 2, 28, moved ? COSMOS.gold : COSMOS.ink, 'mono'),
        glassCell(-515, y, 126, 62, moved ? COSMOS.gold : COSMOS.rule, {
          fill: moved ? '#221c0e' : '#10182b',
          glow: moved ? 6 : 0,
        }),
        txt(row[1].toFixed(2), -515, y + 2, 28, moved ? COSMOS.gold : COSMOS.ink, 'mono'),
      );
    });

    // Center ruler bars (output vs teacher ticks 0..3)
    const baseY = 172;
    const unit = 82;
    const yVal = (v) => baseY - v * unit;
    nodes.push(
      txt('OUTPUT vs TEACHER TICK', -170, -138, 26, COSMOS.blue, 'mono'),
      line([-375, baseY], [60, baseY], { stroke: COSMOS.rule, width: 2.2 }),
      line([-375, baseY], [-375, yVal(3.15)], { stroke: COSMOS.rule, width: 2.2 }),
    );
    [0, 1, 2, 3].forEach((tick) => {
      nodes.push(txt(String(tick), -392, yVal(tick), 26, COSMOS.muted, 'mono', 'right'));
    });

    rowNames.forEach((name, i) => {
      const cx = -295 + i * 135;
      const val = outFix.output[i];
      const tgt = matFix.target[i];
      const hit = Math.abs(val - tgt) < 0.05;

      if (showOut) {
        const h = Math.max(10, val * unit);
        const col = hit ? COSMOS.emerald : COSMOS.cyan;
        nodes.push(
          rect(74, h, {
            fill: hit ? '#103b33' : '#0f3a4f',
            stroke: col,
            width: 2.4,
            radius: 6,
          })
            .at(cx, baseY - h * 0.5)
            .glow(hit ? 7 : 4, col),
          txt(fmt(val), cx, baseY + 66, 26, col, 'mono'),
        );
      } else {
        nodes.push(txt('?', cx, baseY + 66, 30, COSMOS.gold, 'mono'));
      }

      // Teacher target tick bar
      nodes.push(
        line([cx - 48, yVal(tgt)], [cx + 48, yVal(tgt)], { stroke: COSMOS.blue, width: 5.5 }).glow(
          7,
          COSMOS.blue,
        ),
        txt(name, cx, baseY + 32, 26, COSMOS.muted, 'mono'),
      );
    });

    // Bottom formula / prediction strip (strictly withheld at both prediction beats!)
    let statusText = 'Which row stays? What is the sum of squared gaps?';
    let statusCol = COSMOS.gold;
    if (isFresh && chk < 0.5) {
      statusText = 'Mid on h=[2,1]: 0.2(2) + 1.4(1) = ? (target 3)';
      statusCol = COSMOS.gold;
    } else if (isFresh && chk >= 0.5) {
      statusText = 'Mid = 1.8 (-1.2 short) · Fresh SSE = 1.48';
      statusCol = COSMOS.rose;
    } else if (out > 0.85) {
      statusText = 'Output [1, 3, 2] hits all ticks (SSE = 0.00)';
      statusCol = COSMOS.emerald;
    } else if (upd > 0.5) {
      statusText = 'lr=0.1 -> Mid [0.2, 1.4], Bot [0.8, 0.6]';
      statusCol = COSMOS.gold;
    } else if (grd > 0.4) {
      statusText = 'Mid grad = [-2, -4]   ·   Bot grad = [+2, +4]';
      statusCol = COSMOS.cyan;
    } else if (err > 0.4) {
      statusText = 'Top hits 1 (err 0) · Mid + Bot -> SSE = 2.00';
      statusCol = COSMOS.emerald;
    }

    nodes.push(
      glassCell(-340, 322, 1030, 90, statusCol, {
        fill: '#101a2e',
        dash: (!isFresh && err < 0.4) || (isFresh && chk < 0.5) ? [8, 6] : undefined,
        glow: 7 * pulse,
      }),
      txt(statusText, -340, 324, 26, statusCol, 'mono'),
      txt('3D HIDDEN-STATE PROJECTION BRIDGE', 520, -296, 26, COSMOS.cyan, 'mono'),
      txt('Rose segment shows residual ||f^t - A f^s|| gap', 520, 408, 26, COSMOS.muted, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, bridge3d, title, eqFeat, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, bridge3d, { theta: -0.18, phi: 0.92 });

  c.on('projection-gaps', () => s.play(sGaps.to(1, { duration: 0.5 })));
  c.after('projection-error', () =>
    s.play(sError.to(1, { duration: remainAfterDuration(c, 'projection-error', 0.45) })),
  );
  c.on('projection-gradient', () => s.play(sGrad.to(1, { duration: 0.45 })));
  c.on('projection-update', () => s.play(sUpdate.to(1, { duration: 0.7 })));
  c.on('projection-output', () => s.play(sOutput.to(1, { duration: 0.7 })));
  c.on('projection-fresh', () => s.play(sFresh.to(1, { duration: 0.45 })));
  c.after('projection-check', () =>
    s.play(sCheck.to(1, { duration: remainAfterDuration(c, 'projection-check', 0.45) })),
  );
}
