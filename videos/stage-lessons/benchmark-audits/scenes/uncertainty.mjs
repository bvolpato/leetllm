// Scene 18 (uncertainty): "Ask how easily a small perfect sample can occur"
// Orbiting 3D p^n decay cliff + living 2D curve animating n = 3 (0.512) -> n = 30 (0.00124) at p = 0.80.
import {
  COSMOS,
  ROLE,
  aura,
  buildUncertaintySurface3d,
  fadeIn,
  fadeOut,
  glowDot,
  glowRing,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  makePlot,
  orbitScene,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const TRUE_P = 0.8;

export default function uncertainty(s, c) {
  const phase = s.value(0);
  const nVal = s.value(3);
  const showPoint = s.value(0);
  const showThree = s.value(0);
  const showThirty = s.value(0);
  const showScope = s.value(0);

  const bgAura = aura(420, 20, 580, '#14384c38', '#2a224820');
  const { view: cliff3d } = buildUncertaintySurface3d(() => nVal.value, {
    x: 455,
    y: 25,
    theta: -0.76,
    phi: 1.04,
    distance: 15.0,
    unit: 102,
  });

  const title = heroTitle(['How Easily Can a Small', 'Perfect Sample Occur?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.A,
    eyebrow: 'SAMPLE UNCERTAINTY · BINOMIAL ALL-PASS CLIFF',
  });

  const eqTex = glowTex('P(\\mathrm{all\\ pass}) = p^n', {
    x: -445,
    y: -188,
    size: 52,
    color: ROLE.focus,
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const n = nVal.value;
    const allPass = TRUE_P ** n;
    const nodes = [];

    const plot = makePlot(-815, -90, 740, 355, { x: [0, 1], y: [0, 1] });
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const x = i / 80;
      pts.push(plot.pt([x, x ** n]));
    }

    nodes.push(
      ...plot.axesNodes(0.9),
      glowingTrail(pts, {
        gradientColors: [ROLE.A, ROLE.pass, ROLE.focus],
        width: 4.6,
        glow: 10,
      }),
      txt(`n = ${Math.round(n)} cases`, plot.px(0.28), plot.py(0.84), 34, ROLE.A, 'mono').glow(
        6,
        ROLE.A,
      ),
    );

    [0, 0.4, 0.8, 1.0].forEach((tk) => {
      nodes.push(txt(tk.toFixed(1), plot.px(tk), plot.bottom + 46, 26, COSMOS.muted, 'mono'));
    });
    [0.5, 1.0].forEach((lv) => {
      nodes.push(
        txt(lv.toFixed(1), plot.left - 18, plot.py(lv), 26, COSMOS.muted, 'mono', 'right'),
      );
    });
    nodes.push(
      txt(
        'Hypothetical true pass rate p',
        plot.left + plot.w * 0.5,
        plot.bottom + 84,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    // Operating point at p = 0.80
    if (showPoint.value > 0.02) {
      const [mx, my] = plot.pt([TRUE_P, allPass]);
      nodes.push(
        glowingTrail(
          [
            [mx, plot.bottom],
            [mx, my],
          ],
          { color: ROLE.focus, width: 2.2, glow: 5, opacity: 0.65 * showPoint.value, core: false },
        ),
        glowDot(mx, my, { radius: 9.5, color: ROLE.focus, glow: 14, opacity: showPoint.value }),
      );
      if (my < plot.bottom - 34) {
        nodes.push(
          glowRing(mx, my, 20 + 4 * pulse, ROLE.focus, {
            width: 2.6,
            glow: 9,
            opacity: showPoint.value * 0.75,
          }),
        );
      }
    }

    // Bottom readouts with strict non-overlapping crossfades
    const r3Op = showThree.value * fadeOut(showThirty.value) * fadeOut(showScope.value);
    const r30Op = fadeIn(showThirty.value) * fadeOut(showScope.value);
    const scOp = fadeIn(showScope.value);

    if (r3Op > 0.02) {
      nodes.push(
        txt(`0.8^3 = ${(TRUE_P ** 3).toFixed(3)}`, -445, 395, 38, ROLE.focus, 'mono')
          .glow(8, ROLE.focus)
          .opacity(r3Op),
      );
    }
    if (r30Op > 0.02) {
      nodes.push(
        txt(
          `0.8^30 ≈ ${(TRUE_P ** 30).toFixed(5)}  (falls sharply)`,
          -445,
          395,
          36,
          ROLE.accent,
          'mono',
        )
          .glow(8, ROLE.accent)
          .opacity(r30Op),
      );
    }
    if (scOp > 0.02) {
      nodes.push(
        txt(
          'Pre-declare Wilson intervals · check independence and scorer',
          -855,
          395,
          28,
          ROLE.pass,
          'sans',
          'left',
        )
          .glow(6, ROLE.pass)
          .opacity(scOp),
      );
    }

    nodes.push(
      txt('3D ALL-PASS PROBABILITY CLIFF  z(p, n) = p^n', 455, -345, 26, ROLE.A, 'mono').glow(
        5,
        ROLE.A,
      ),
      txt(
        'Amber ridge tracks fixed p = 0.80 from n = 3 to n = 30',
        455,
        365,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return nodes;
  });

  s.add(bgAura, cliff3d, eqTex, title, live);
  runAmbientPhase(s, c, phase, 2.2);
  orbitScene(s, c, cliff3d, { theta: 0.35, phi: 0.96 });

  tweenCue(s, c, 'uncertainty-beat-1-focus-2', showPoint, 0, { duration: 0.1 });
  tweenCue(s, c, 'uncertainty-beat-1-focus-1', showPoint, 1, { duration: 0.45 });
  tweenCue(s, c, 'more-than-half', showThree, 1, { duration: 0.4 });
  c.on('uncertainty-beat-2-focus-1', () => {
    s.play(showThree.to(0, { duration: 0.25 }));
    s.play(nVal.to(30, { duration: 2.0 }));
  });
  tweenCue(s, c, 'thirty-probability', showThirty, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'uncertainty-beat-3-focus-1', showScope, 1, { duration: 0.5 });
}
