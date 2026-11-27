// Scene 4: affine: "Change one feature at a time"
// Interactive luminous coordinate equalizer: starts from standardized x_hat (gamma=1, beta=0),
// doubles first gain (0.45 -> 0.89), adds +0.7 shift to last feature, and updates output mean
// and variance live against the pinned standardized ghost spectrum.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  featureSpectrum,
  fmt,
  lumBar,
  mean,
  normal,
  playCue,
  signed,
  variance,
} from '../parts.mjs';

export default function affine(s, c) {
  const title = heroTitle(['Change one feature', 'at a time'], {
    x: -850,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.rms,
  });

  const ruleGlow = s.value(0);
  const gain1 = s.value(1); // 1.0 -> 2.0
  const bias4 = s.value(0); // 0.0 -> 0.7
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const g1 = gain1.value;
    const b4 = bias4.value;

    const gamma = [g1, 1, 1, 1];
    const beta = [0, 0, 0, b4];
    const vals = normal.map((v, i) => v * gamma[i] + beta[i]);
    const outMean = mean(vals);
    const outVar = variance(vals);

    // Left: Glowing feature spectrum with pinned standardized ghost behind it
    const spec = featureSpectrum({
      cx: -355,
      cy: -10,
      width: 820,
      height: 360,
      yMin: -2.5,
      yMax: 2.8,
      values: vals,
      ghostValues: normal,
      color: ROLE.rms,
      highlightIndex: b4 > 0.05 ? 3 : 0,
      highlightColor: ROLE.gold,
      yTicks: [-2, -1, 0, 1, 2],
      opacity: alpha,
    });
    nodes.push(spec.node);

    // Subtle animated energy beacon on f1 when gain is active or f4 when bias is active
    const focusIdx = b4 > 0.05 ? 3 : 0;
    const fx = spec.toX(focusIdx);
    const fy = spec.toY(vals[focusIdx]);
    nodes.push(
      glowDot(fx, fy, {
        radius: 13,
        color: ROLE.gold,
        glow: 18,
        opacity: 0.7 * alpha,
      }),
    );

    // Right panel: Luminous parameter sliders for gamma_1 and beta_4 (zero card chrome!)
    const rx = 490;
    const barW = 460;
    const barLeft = rx - barW / 2;

    // Slider 1: First feature gain gamma_1 (1.0 -> 2.0)
    const y1 = -55;
    const gFrac = (g1 - 0.5) / 2.0; // maps 1.0->0.25, 2.0->0.75
    const gCol = g1 > 1.05 ? ROLE.gold : ROLE.write;
    nodes.push(
      txt(`First gain  γ₁ = ${fmt(g1, 2)}`, barLeft, y1 - 48, 32, gCol, 'mono', 'left')
        .glow(g1 > 1.05 ? 7 : 0, gCol)
        .opacity(alpha),
      line([barLeft, y1], [barLeft + barW, y1], { stroke: '#2c3c66', width: 6 }).opacity(alpha),
      glowingTrail(
        [
          [barLeft, y1],
          [barLeft + barW * gFrac, y1],
        ],
        { color: gCol, width: 6, glow: 10, opacity: alpha },
      ),
      glowDot(barLeft + barW * gFrac, y1, { radius: 10, color: gCol, glow: 14, opacity: alpha }),
      txt(
        `f₁: ${fmt(normal[0], 2)} -> ${fmt(vals[0], 2)}`,
        barLeft,
        y1 + 42,
        28,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    );

    // Slider 2: Last feature shift beta_4 (0.0 -> +0.7)
    const y2 = 125;
    const bFrac = Math.max(0.05, b4 / 1.0);
    const bCol = b4 > 0.05 ? ROLE.gold : ROLE.write;
    nodes.push(
      txt(`Last shift  β₄ = ${signed(b4, 2)}`, barLeft, y2 - 48, 32, bCol, 'mono', 'left')
        .glow(b4 > 0.05 ? 7 : 0, bCol)
        .opacity(alpha),
      line([barLeft, y2], [barLeft + barW, y2], { stroke: '#2c3c66', width: 6 }).opacity(alpha),
      glowingTrail(
        [
          [barLeft, y2],
          [barLeft + barW * bFrac, y2],
        ],
        { color: bCol, width: 6, glow: 10, opacity: alpha },
      ),
      glowDot(barLeft + barW * bFrac, y2, { radius: 10, color: bCol, glow: 14, opacity: alpha }),
      txt(
        `f₄: ${fmt(normal[3], 2)} -> ${fmt(vals[3], 2)}`,
        barLeft,
        y2 + 42,
        28,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    );

    // Live output statistics bar at lower-right
    const statY = 305;
    nodes.push(
      lumBar(rx - 135, statY, 240, 88, {
        color: Math.abs(outMean) > 0.02 ? ROLE.amber : ROLE.norm,
        fillOpacity: 0.16,
        strokeWidth: 2.2,
        glow: 7,
        opacity: alpha,
      }),
      txt('Output mean', rx - 135, statY - 22, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(
        fmt(outMean, 3),
        rx - 135,
        statY + 18,
        34,
        Math.abs(outMean) > 0.02 ? ROLE.amber : ROLE.norm,
        'mono',
        'center',
      ).opacity(alpha),
      lumBar(rx + 145, statY, 240, 88, {
        color: Math.abs(outVar - 1) > 0.02 ? ROLE.amber : ROLE.norm,
        fillOpacity: 0.16,
        strokeWidth: 2.2,
        glow: 7,
        opacity: alpha,
      }),
      txt('Output var', rx + 145, statY - 22, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(
        fmt(outVar, 3),
        rx + 145,
        statY + 18,
        34,
        Math.abs(outVar - 1) > 0.02 ? ROLE.amber : ROLE.norm,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Bottom takeaway
    nodes.push(
      txt(
        g1 > 1.2 || b4 > 0.1
          ? 'Learned γ and β can move both output mean and variance'
          : 'Initial γ = 1, β = 0 preserves zero mean and unit variance',
        -355,
        395,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    void ruleGlow.value;
    return nodes;
  });

  const affineEq = glowTex('y = \\gamma \\odot \\hat{x} + \\beta', {
    x: 490,
    y: -255,
    size: 48,
    color: ROLE.rms,
  });

  s.add(cinemaAtmosphere(ROLE.rms, ROLE.gold), title, mainLayer);

  // Beat 0: Reveal learned affine equation on cue
  c.show('affine-learned-affine-rule-b1-1', affineEq);
  playCue(s, c, 'affine-learned-affine-rule-b1-1', (d) => s.play(ruleGlow.to(1, { duration: d })), {
    dur: 0.5,
  });

  // Beat 1: Double first gain (1 -> 2), then add +0.7 shift to last feature
  playCue(s, c, 'affine-first-feature-gain-b2-1', (d) => s.play(gain1.to(2, { duration: d })), {
    dur: 0.8,
  });
  playCue(s, c, 'affine-last-feature-bias-b2-2', (d) => s.play(bias4.to(0.7, { duration: d })), {
    dur: 0.8,
  });
}
