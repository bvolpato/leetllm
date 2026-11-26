// Scene 21 (gates): "Check quality and operational limits together"
// 2D quality-vs-latency feasible region + orbiting 3D multi-axis gate manifold + schema & cost telemetry.
import {
  COSMOS,
  RELEASES,
  ROLE,
  aura,
  buildGateManifold3d,
  fadeIn,
  fadeOut,
  glowDot,
  glowRing,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  makePlot,
  orbitScene,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function gates(s, c) {
  const phase = s.value(0);
  const showQualGate = s.value(0);
  const showLatGate = s.value(0);
  const showCostRow = s.value(0);
  const showEligible = s.value(0);

  const bgAura = aura(460, 20, 560, '#133a3a38', '#2a1c4f20');
  const { view: gate3d } = buildGateManifold3d({
    x: 470,
    y: 15,
    theta: -0.72,
    phi: 1.05,
    distance: 15.4,
    unit: 96,
  });

  const title = heroTitle(['Intersect Quality and', 'Operational Release Gates'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.pass,
    eyebrow: 'MULTI-AXIS GATES · QUALITY, LATENCY, COST, SCHEMA',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const qg = showQualGate.value;
    const lg = showLatGate.value;
    const cg = showCostRow.value;
    const el = showEligible.value;
    const nodes = [];

    // Left 2D Quality vs Latency plane
    const plot = makePlot(-795, -205, 750, 395, { x: [0.85, 1.02], y: [0, 2200] });
    nodes.push(...plot.axesNodes(0.9));

    // Shaded feasible corner box (quality >= 0.98 and latency <= 900ms)
    if (qg > 0.3 && lg > 0.3) {
      const x1 = plot.px(0.98);
      const x2 = plot.px(1.02);
      const yTop = plot.py(900);
      const yBot = plot.bottom;
      nodes.push(
        lumBar((x1 + x2) * 0.5, (yTop + yBot) * 0.5, x2 - x1, yBot - yTop, {
          color: ROLE.pass,
          fillOpacity: 0.2,
          strokeWidth: 0,
          glow: 6,
          radius: 4,
          opacity: lg,
        }),
      );
    }

    // Quality >= 0.98 vertical laser
    if (qg > 0.02) {
      const qx = plot.px(0.98);
      nodes.push(
        glowingTrail(
          [
            [qx, plot.top],
            [qx, plot.bottom],
          ],
          { color: ROLE.focus, width: 3.4, glow: 9, opacity: qg, core: false },
        ),
        txt('Quality ≥ 0.98', qx - 18, plot.top + 16, 26, ROLE.focus, 'mono', 'right').opacity(qg),
      );
    }

    // Latency <= 900 ms horizontal laser
    if (lg > 0.02) {
      const ly = plot.py(900);
      nodes.push(
        glowingTrail(
          [
            [plot.left, ly],
            [plot.right, ly],
          ],
          { color: ROLE.focus, width: 3.4, glow: 9, opacity: lg, core: false },
        ),
        txt('p95 ≤ 900 ms', plot.left + 16, ly - 24, 26, ROLE.focus, 'mono', 'left').opacity(lg),
      );
    }

    [0.85, 0.9, 0.95, 1.0].forEach((tk) => {
      nodes.push(txt(tk.toFixed(2), plot.px(tk), plot.bottom + 34, 26, COSMOS.muted, 'mono'));
    });
    [0, 1000, 2000].forEach((lv) => {
      nodes.push(txt(`${lv}ms`, plot.left - 16, plot.py(lv), 26, COSMOS.muted, 'mono', 'right'));
    });
    nodes.push(
      txt(
        'Quality pass rate',
        plot.left + plot.w * 0.5,
        plot.bottom + 72,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    // Three candidate points: Fast, Balanced, Specialist
    RELEASES.forEach((cand, i) => {
      const [cx, cy] = plot.pt([cand.quality, cand.ms]);
      const failQ = qg > 0.4 && cand.quality < 0.98;
      const failL = lg > 0.4 && cand.ms > 900;
      const isWinner = i === 1 && (lg > 0.4 || el > 0.4);
      const col = failQ || failL ? ROLE.fail : isWinner ? ROLE.pass : ROLE.A;

      const lblX = i === 1 ? cx - 64 : i === 2 ? cx - 44 : cx;
      const lblY = i === 1 ? cy + 8 : i === 2 ? cy + 38 : cy + 36;
      const lblAnchor = i === 1 ? 'right' : i === 2 ? 'left' : 'center';

      nodes.push(
        glowDot(cx, cy, { radius: isWinner ? 11 : 9, color: col, glow: isWinner ? 14 : 9 }),
        txt(cand.id, lblX, lblY, 28, col, 'mono', lblAnchor),
      );
      if (isWinner) {
        nodes.push(
          glowRing(cx, cy, 18 + 3 * pulse, ROLE.pass, { width: 2.6, glow: 9, opacity: 0.8 }),
        );
      }
    });

    // Bottom telemetry strip (schema & cost + final eligibility verdict)
    const specOp = fadeOut(el);
    const elOp = fadeIn(el);

    if (cg > 0.02) {
      const xs = [-705, -420, -120];
      RELEASES.forEach((cand, i) => {
        const okCost = cand.cost <= 0.015;
        const col = i === 1 ? ROLE.pass : okCost ? COSMOS.muted : ROLE.fail;
        nodes.push(
          txt(
            `${['F', 'B', 'S'][i]}: $${cand.cost.toFixed(3)} · sch ${cand.schema}`,
            xs[i],
            312,
            26,
            col,
            'mono',
          ).opacity(cg),
        );
      });
    }

    if (specOp > 0.02) {
      nodes.push(
        txt(
          'Gates: Qual ≥ 0.98 · p95 ≤ 900ms · Cost ≤ $0.015 · Schema = 1',
          -855,
          376,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(specOp),
      );
    }
    if (elOp > 0.02) {
      nodes.push(
        txt(
          'Only Balanced clears all four point-estimate gates (keep slice CIs)',
          -855,
          376,
          26,
          ROLE.pass,
          'sans',
          'left',
        )
          .glow(7, ROLE.pass)
          .opacity(elOp),
      );
    }

    // 3D surface floating labels
    nodes.push(
      txt('3D FEASIBILITY CORNER MANIFOLD', 470, -345, 26, ROLE.pass, 'mono').glow(5, ROLE.pass),
      txt('Green peak marks high quality + low latency', 470, 365, 26, COSMOS.muted, 'sans'),
    );

    return nodes;
  });

  s.add(bgAura, gate3d, title, live);
  runAmbientPhase(s, c, phase, 2.2);
  orbitScene(s, c, gate3d, { theta: 0.36, phi: 0.96 });

  tweenCue(s, c, 'gates-beat-1-focus-2', showQualGate, 0, { duration: 0.1 });
  tweenCue(s, c, 'quality-boundary', showQualGate, 1, { duration: 0.5 });
  tweenCue(s, c, 'gates-beat-1-focus-1', showQualGate, 1, { duration: 0.25 });
  tweenCue(s, c, 'gates-beat-2-focus-2', showLatGate, 1, { duration: 0.5 });
  tweenCue(s, c, 'gates-beat-2-focus-1', showLatGate, 1, { duration: 0.25 });
  tweenCue(s, c, 'gates-beat-3-focus-2', showCostRow, 1, { duration: 0.45 });
  tweenCue(s, c, 'ba-gates-cost', showCostRow, 1, { duration: 0.25 });
  tweenCue(s, c, 'gates-beat-3-focus-1', showEligible, 1, { duration: 0.45, after: true });
}
