// Scene 12: temperature-odds: "A scaled logit gap determines the relative odds"
// View 1 (Beat 0): Logit gap Delta z = 2 across T = 1.0, 0.5, 1.5 with MathJax exp(Delta z / T);
//   odds (7.39:1, 54.60:1, 3.79:1) reveal AFTER dec-temperature-odds.
// View 2 (Beat 1): Tied maxima [2, 2, 0] under T -> 0+ ([0.5, 0.5, 0] vs argmax [1, 0, 0]) and
//   T -> inf ([1/3, 1/3, 1/3]) AFTER their spoken cues.
// View 3 (Beat 2): Live temperature sweep on [2, 2, 0, -inf] proving hard mask stays 0 while
//   Shannon entropy H(P_T) rises monotonically in bits.
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
  decodeSoftmax,
  fmt,
  glowVector,
  lumBar,
  playCue,
  shannonEntropyBits,
  swapVis,
} from '../parts.mjs';

export default function temperatureOdds(s, c) {
  const title = heroTitle(['Scaled logit gap', 'sets the relative odds'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.winner,
  });

  const vOdds = s.value(1);
  const vLimits = s.value(0);
  const vEntropy = s.value(0);

  const showOddsVals = s.value(0);
  const limitCool = s.value(1.0); // 1.0 -> 0.08
  const tiedDone = s.value(0);
  const highDone = s.value(0);
  const sweepT = s.value(0.3); // 0.3 -> 3.0

  // VIEW 1: Gap = 2 across three temperatures
  const oddsLayer = guardedDynamic(vOdds, (alpha) => {
    const nodes = [];
    const ready = showOddsVals.value > 0.4;
    const specs = [
      { T: 1.0, x: -530, col: ROLE.base, label: 'T = 1.0' },
      { T: 0.5, x: 0, col: ROLE.active, label: 'T = 0.5  (cold)' },
      { T: 1.5, x: 530, col: ROLE.heat, label: 'T = 1.5  (warm)' },
    ];

    specs.forEach((sp) => {
      const ratio = Math.exp(2 / sp.T);
      const scaled = 2 / sp.T;
      nodes.push(
        txt(sp.label, sp.x, -175, 32, sp.col, 'mono', 'center').opacity(alpha),
        lumBar(sp.x, -75, 450, 78, {
          color: sp.col,
          fillOpacity: 0.22,
          strokeWidth: 2.3,
          glow: 8,
          radius: 12,
          opacity: alpha,
        }),
        txt(
          `Δz/T = 2/${sp.T} = ${fmt(scaled, 2)}`,
          sp.x,
          -75,
          28,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
        glowVector([sp.x, -25], [sp.x, 45], { color: sp.col, width: 3.8, glow: 8, opacity: alpha }),
        lumBar(sp.x, 125, 390, 96, {
          color: ready ? ROLE.winner : COSMOS.dim,
          fillOpacity: ready ? 0.28 : 0.08,
          strokeWidth: ready ? 2.8 : 1.8,
          glow: ready ? 11 : 2,
          radius: 14,
          opacity: alpha,
        }),
        txt(
          ready ? `${fmt(ratio, 2)} : 1` : 'exp(Δz / T) = ?',
          sp.x,
          125,
          ready ? 40 : 28,
          ready ? ROLE.winner : COSMOS.muted,
          'mono',
          'center',
        )
          .glow(ready ? 8 : 0, ROLE.winner)
          .opacity(alpha),
      );
    });

    nodes.push(
      txt(
        'Same logit gap Δz = 2.0  |  halving T squares the odds ratio',
        0,
        355,
        30,
        COSMOS.muted,
        'serif',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: Tied maxima [2, 2, 0] limits T -> 0+ vs T -> inf
  const limitsLayer = guardedDynamic(vLimits, (alpha) => {
    const nodes = [];
    const T = Math.max(0.08, limitCool.value);
    const tDone = tiedDone.value > 0.4;
    const hDone = highDone.value > 0.4;
    const probs = hDone
      ? [1 / 3, 1 / 3, 1 / 3]
      : tDone
        ? [0.5, 0.5, 0]
        : decodeSoftmax([2, 2, 0], T);

    const names = ['tied max A (z=2)', 'tied max B (z=2)', 'lower C (z=0)'];
    const cols = [ROLE.active, ROLE.valid, ROLE.base];
    const barBaseY = 95;
    const barMaxH = 265;

    nodes.push(
      txt('Tied maxima [2, 2, 0]  |  T -> 0+ vs T -> ∞', 0, -245, 34, ROLE.winner, 'mono', 'center')
        .glow(6, ROLE.winner)
        .opacity(alpha),
    );

    probs.forEach((p, i) => {
      const cx = -420 + i * 420;
      const h = Math.max(10, p * barMaxH);
      nodes.push(
        lumBar(cx, barBaseY - h / 2, 165, h, {
          color: cols[i],
          fillOpacity: 0.45,
          strokeWidth: 2.6,
          glow: 10,
          radius: 8,
          opacity: alpha,
        }),
        txt(fmt(p, 3), cx, barBaseY - h - 34, 34, cols[i], 'mono', 'center').opacity(alpha),
        txt(names[i], cx, barBaseY + 46, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    });

    // Bottom contrast rails: T -> 0+ vs argmax vs T -> inf
    nodes.push(
      txt(
        tDone
          ? 'T -> 0+: [0.5, 0.5, 0]   |   deterministic argmax tie rule: [1, 0, 0]'
          : 'Watch positive T shrink toward zero',
        0,
        265,
        30,
        ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        hDone ? 'T -> ∞ : [1/3, 1/3, 1/3]' : 'Hard-masked tokens never enter either limit.',
        0,
        355,
        30,
        hDone ? ROLE.valid : COSMOS.muted,
        'serif',
        'center',
      )
        .glow(hDone ? 6 : 0, ROLE.valid)
        .opacity(alpha),
    );

    return nodes;
  });

  // VIEW 3: Live entropy sweep on [2, 2, 0, -Infinity]
  const entropyLayer = guardedDynamic(vEntropy, (alpha) => {
    const nodes = [];
    const T = Math.max(0.3, Math.min(3.0, sweepT.value));
    const probs = decodeSoftmax([2, 2, 0, -Infinity], T);
    const H = shannonEntropyBits(probs);

    const labels = ['A (z = 2)', 'B (z = 2)', 'C (z = 0)', 'D (mask -∞)'];
    const cols = [ROLE.active, ROLE.valid, ROLE.base, ROLE.pruned];
    const barL = -520;
    const barW = 780;

    nodes.push(
      txt(`T = ${fmt(T, 2)}`, -845, -240, 42, ROLE.heat, 'mono', 'left')
        .glow(8, ROLE.heat)
        .opacity(alpha),
      txt(`Entropy H = ${fmt(H, 3)} bits`, 845, -240, 42, ROLE.winner, 'mono', 'right')
        .glow(8, ROLE.winner)
        .opacity(alpha),
    );

    probs.forEach((p, i) => {
      const y = -110 + i * 112;
      const w = Math.max(6, p * barW);
      nodes.push(
        txt(labels[i], barL - 28, y, 30, cols[i], 'mono', 'right').opacity(alpha),
        lumBar(barL + barW / 2, y, barW, 44, {
          color: '#2b395e',
          fillOpacity: 0.14,
          strokeWidth: 1.5,
          glow: 2,
          radius: 7,
          opacity: alpha,
        }),
        p > 0
          ? lumBar(barL + w / 2, y, w, 38, {
              color: cols[i],
              fillOpacity: 0.5,
              strokeWidth: 2.5,
              glow: 10,
              radius: 6,
              opacity: alpha,
            })
          : glowDot(barL + 8, y, { radius: 7, color: ROLE.pruned, glow: 10, opacity: alpha }),
        txt(
          i === 3 ? '0.000 (excluded)' : fmt(p, 3),
          barL + barW + 30,
          y,
          30,
          cols[i],
          'mono',
          'left',
        ).opacity(alpha),
      );
    });

    // Entropy curve strip along bottom
    const pts = [];
    for (let k = 0; k <= 30; k++) {
      const tk = 0.3 + (k / 30) * 2.7;
      const hk = shannonEntropyBits(decodeSoftmax([2, 2, 0, -Infinity], tk));
      pts.push([-650 + (k / 30) * 1300, 385 - (hk / 1.65) * 90]);
    }
    const curX = -650 + ((T - 0.3) / 2.7) * 1300;
    const curY = 385 - (H / 1.65) * 90;
    nodes.push(
      glowingTrail(pts, {
        gradientColors: [ROLE.active, ROLE.winner, ROLE.heat],
        width: 4,
        glow: 9,
        opacity: alpha,
      }),
      glowDot(curX, curY, { radius: 10, color: ROLE.winner, glow: 14, opacity: alpha }),
      txt(
        'H(P_T) is nondecreasing with T (hard masks remain excluded)',
        0,
        422,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  const oddsEq = glowTex('\\frac{P_T(A)}{P_T(B)} = \\exp\\!\\left(\\frac{z_A - z_B}{T}\\right)', {
    x: 420,
    y: -380,
    size: 40,
    color: ROLE.winner,
  });

  const entEq = glowTex('H(P_T) = -\\sum_i P_T(i)\\log_2 P_T(i)', {
    x: 380,
    y: -380,
    size: 36,
    color: ROLE.active,
  });

  s.add(
    cinemaAtmosphere(ROLE.active, ROLE.winner),
    title,
    oddsEq,
    oddsLayer,
    limitsLayer,
    entropyLayer,
  );

  playCue(s, c, 'dec-temperature-odds-1', (d) => s.play(showOddsVals.to(0.1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'dec-temperature-odds', (d) => s.play(showOddsVals.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });

  c.hide(1, oddsEq);
  c.onBeat(1, () => s.play(swapVis(vOdds, vLimits, 0.55)));
  playCue(s, c, 'dec-temperature-odds-2', (d) => s.play(limitCool.to(0.1, { duration: d })), {
    dur: 1.2,
  });
  playCue(s, c, 'dec-tied-limit', (d) => s.play(tiedDone.to(1, { duration: d })), {
    after: false,
    offset: 0.4,
    dur: 0.5,
  });
  playCue(s, c, 'dec-high-temperature-limit', (d) => s.play(highDone.to(1, { duration: d })), {
    after: false,
    offset: 0.4,
    dur: 0.5,
  });

  c.onBeat(2, () => s.play(swapVis(vLimits, vEntropy, 0.55)));
  c.show(2, entEq);
  playCue(s, c, 'dec-temperature-odds-3', (d) => s.play(sweepT.to(2.8, { duration: d })), {
    dur: 2.2,
  });
}
