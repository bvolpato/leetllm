// Scene 4: mean: "Average the surprise, then exponentiate"
// Left: Three glowing surprise pillars ("on" 0.693, "the" 2.303, "mat" 0.223) stack to
// 3.219 nats, then level into 3 equal shares at 1.073 nats/target.
// Right: Orbiting 3D probability-vs-surprise manifold (cinematic3d + surface + orbitScene)
// paired with MathJax glowTex and PPL = 2.92 reveal strictly AFTER mean-exponent.
import { gridPlane3d, line, surface } from 'vizmatic/stage';
import {
  COSMOS,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
} from '../../cinematic-kit.mjs';
import {
  INTRO_TARGETS,
  ROLE,
  cinemaAtmosphere,
  fmt,
  lumBar,
  nll,
  playCue,
  ppl,
  total,
} from '../parts.mjs';

export default function mean(s, c) {
  const meanNll = total / 3; // 1.0730...

  const title = heroTitle(['Average the surprise,', 'then exponentiate'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.good,
  });

  // Right-side 3D joint surprise manifold z(p1, p2) = (-ln(p1) - ln(p2)) / 2
  const view3d = cinematic3d({
    theta: -0.76,
    phi: 1.06,
    distance: 15.8,
    unit: 84,
    focus: [0, 0, 0.9],
  }).at(430, -90);

  const floor3d = gridPlane3d({
    x: [-2.8, 2.8],
    y: [-2.8, 2.8],
    z: 0,
    step: 1,
    color: '#2b3d69',
    opacity: 0.42,
  });

  const manifold = surface(
    (u, v) => {
      const p1 = 0.08 + ((u + 2.8) / 5.6) * 0.9;
      const p2 = 0.08 + ((v + 2.8) / 5.6) * 0.9;
      return Math.min(2.8, 0.5 * (-Math.log(p1) - Math.log(p2)));
    },
    {
      x: [-2.8, 2.8],
      y: [-2.8, 2.8],
      steps: 18,
      colors: [ROLE.good, ROLE.prob, ROLE.observed, ROLE.warn],
      opacity: 0.85,
      wireframe: true,
      wireColor: '#8fa9e0',
      wireOpacity: 0.25,
    },
  );
  view3d.add(floor3d, manifold);

  const focusThe = s.value(0); // highlights tall middle token "the"
  const gatherT = s.value(0); // 0 -> 1 shows total 3.219 stack
  const equalizeT = s.value(0); // 0 -> 1 levels bars into 3 equal shares at 1.073
  const revealPpl = s.value(0); // 0 -> 1 reveals PPL = 2.92 AFTER mean-exponent
  const showGeoNote = s.value(0); // geometric mean note
  const showEntNote = s.value(0); // separate from model's own entropy

  const stageVis = s.value(1);

  const leftLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const ft = focusThe.value;
    const gt = gatherT.value;
    const eq = equalizeT.value;
    const rp = revealPpl.value;
    const gn = showGeoNote.value;
    const en = showEntNote.value;

    const baseY = 145;
    const pxPerNat = 130;
    const barW = 148;
    const xs = [-690, -455, -220];
    const cols = [ROLE.context, ROLE.warn, ROLE.good];

    // Baseline axis
    nodes.push(
      glowingTrail(
        [
          [-810, baseY],
          [-95, baseY],
        ],
        { color: '#506496', width: 2.5, glow: 4, core: false, opacity: alpha },
      ),
    );

    // Three luminous surprise columns morphing cleanly from individual NLLs to equalized mean
    nll.forEach((val, i) => {
      const hVal = val + (meanNll - val) * eq;
      const hPx = Math.max(12, hVal * pxPerNat);
      const isHi = i === 1 && ft > 0.3 && eq < 0.3;
      const col = cols[i];
      nodes.push(
        lumBar(xs[i], baseY - hPx / 2, barW, hPx, {
          color: col,
          fillOpacity: isHi ? 0.62 : 0.38,
          strokeWidth: isHi ? 3.4 : 2.4,
          glow: isHi ? 14 : 8,
          radius: 8,
          opacity: alpha,
        }),
        txt(INTRO_TARGETS[i], xs[i], baseY + 40, 32, col, 'serif', 'center').opacity(alpha),
        txt(fmt(hVal, 3), xs[i], baseY + 86, 28, col, 'mono', 'center').opacity(alpha),
      );
    });

    // Mean horizon line cutting across all 3 equalized columns
    if (eq > 0.1) {
      const meanY = baseY - meanNll * pxPerNat;
      nodes.push(
        glowingTrail(
          [
            [-805, meanY],
            [-100, meanY],
          ],
          { color: ROLE.observed, width: 3.4, glow: 10, opacity: eq * alpha },
        ),
        glowDot(-100, meanY, { radius: 6, color: ROLE.observed, glow: 10, opacity: eq * alpha }),
      );
    }

    // Running sum & mean telemetry below bars
    if (gt > 0.08) {
      nodes.push(
        txt(
          eq > 0.5
            ? `Mean loss L = ${fmt(total, 3)} / 3 = ${fmt(meanNll, 3)} nats`
            : `Total loss = 0.693 + 2.303 + 0.223 = ${fmt(total, 3)} nats`,
          -455,
          295,
          30,
          ROLE.observed,
          'mono',
          'center',
        )
          .glow(6, ROLE.observed)
          .opacity(gt * alpha),
      );
    }

    // Revealed perplexity readout (strictly withheld until AFTER mean-exponent!)
    if (rp > 0.08) {
      nodes.push(
        txt(
          `PPL = exp(${fmt(meanNll, 3)}) ≈ ${fmt(ppl, 2)}`,
          -455,
          365,
          42,
          ROLE.good,
          'mono',
          'center',
        )
          .glow(10, ROLE.good)
          .opacity(rp * alpha),
      );
    } else if (eq > 0.4) {
      nodes.push(
        txt('PPL = exp(L) = ?', -455, 365, 36, COSMOS.muted, 'mono', 'center').opacity(eq * alpha),
      );
    }

    // Right 3D surface caption (well above and below surface)
    nodes.push(
      txt(
        'Joint surprise manifold  z = mean(-ln p)',
        430,
        -375,
        28,
        ROLE.prob,
        'mono',
        'center',
      ).opacity(alpha),
    );

    if (gn > 0.08) {
      nodes.push(
        txt(
          'Geometric mean of 1/p_i  (can exceed vocab size)',
          430,
          335,
          26,
          ROLE.observed,
          'sans',
          'center',
        ).opacity(gn * alpha),
      );
    }
    if (en > 0.08) {
      nodes.push(
        txt(
          'Held-out cross-entropy != model own entropy H(p)',
          430,
          395,
          26,
          ROLE.amber,
          'mono',
          'center',
        ).opacity(en * alpha),
      );
    }

    return nodes;
  });

  const pplEq = glowTex('\\text{PPL} = \\exp\\!\\left(-\\frac{1}{N}\\sum \\ln p_i\\right)', {
    x: 430,
    y: 252,
    size: 36,
    color: ROLE.good,
  });

  s.add(cinemaAtmosphere(ROLE.good, ROLE.observed), title, view3d, leftLayer);

  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.16, phi: 0.94, distance: 14.4 },
    { startOffset: 0.2, endMargin: 0.65 },
  );

  // Beat 0: highlight "the" -> gather sum
  playCue(s, c, 'mean-beat-1-focus-1', (d) => s.play(focusThe.to(1, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'mean-gather', (d) => s.play(gatherT.to(1, { duration: d })), { dur: 0.65 });

  // Beat 1: equalize bars -> show formula -> reveal PPL = 2.92 AFTER mean-exponent
  playCue(s, c, 'mean-equalize', (d) => s.play(equalizeT.to(1, { duration: d })), { dur: 0.8 });
  c.show('mean-beat-2-focus-1', pplEq);
  playCue(s, c, 'mean-beat-2-focus-1', (d) => s.play(equalizeT.to(1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'mean-exponent', (d) => s.play(revealPpl.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });

  // Beat 2: geometric mean + keep separate from model's own entropy
  playCue(s, c, 'mean-beat-3-focus-2', (d) => s.play(showGeoNote.to(1, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'mean-beat-3-focus-1', (d) => s.play(showEntNote.to(1, { duration: d })), {
    dur: 0.55,
  });

  void line;
}
