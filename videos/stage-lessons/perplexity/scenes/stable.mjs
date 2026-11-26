// Scene 7: stable: "Work in log space before probabilities become tiny"
// View 1 (Beat 0): Logits [1000, 998, 997] shift together by -1000 -> [0, -2, -3] while
//   keeping pairwise gaps (2 and 3) fixed, yielding exact softmax [0.844, 0.114, 0.042]
//   and observed target NLL = 0.170 nats.
// View 2 (Beat 1): Scaling to 5,000 targets via logSpaceSnapshot: direct product p^N
//   plummets to 0.000 underflow while summed -ln(p) climbs linearly to 849.2 nats.
import { arrow, line } from 'vizmatic/stage';
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
  fmt,
  logSpaceSnapshot,
  logits,
  lumBar,
  playCue,
  stable,
  swapVis,
} from '../parts.mjs';

export default function stableScene(s, c) {
  const title = heroTitle(['Work in log space', 'before numbers vanish'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.prob,
  });

  const vShift = s.value(1);
  const vUnderflow = s.value(0);

  // View 1 state
  const shiftT = s.value(0); // 0 -> 1 subtracts 1000 from [1000, 998, 997]
  const normT = s.value(0); // 0 -> 1 illuminates exp & softmax distribution + NLL
  const gapPulse = s.value(0);

  // View 2 state (logSpaceSnapshot progress 0.08 -> 0.99)
  const scaleProg = s.value(0.08);
  const overflowNote = s.value(0);

  // VIEW 1: Shift-invariance of softmax & stable log-softmax
  const shiftLayer = guardedDynamic(vShift, (alpha) => {
    const nodes = [];
    const st = shiftT.value;
    const nt = normT.value;
    const shiftVal = 1000 * st;
    const vals = logits.map((v) => v - shiftVal);

    // Left: 3 glowing logit meters sliding down cleanly together as -1000 is subtracted
    const lx = [-680, -440, -200];
    const topY = -125;
    const dropY = 75 * st;

    nodes.push(
      txt(
        st > 0.2 ? 'Subtract max = 1000 (gaps stay 2 & 3)' : 'Raw logits: exp(1000) overflows!',
        -440,
        -255,
        30,
        st > 0.2 ? ROLE.observed : ROLE.warn,
        'mono',
        'center',
      )
        .glow(7, st > 0.2 ? ROLE.observed : ROLE.warn)
        .opacity(alpha),
    );

    vals.forEach((v, i) => {
      const col = i === 0 ? ROLE.observed : ROLE.context;
      const cy = topY + dropY + i * 24;
      nodes.push(
        lumBar(lx[i], cy, 196, 86, {
          color: col,
          fillOpacity: i === 0 ? 0.34 : 0.22,
          strokeWidth: i === 0 ? 3 : 2.2,
          glow: i === 0 ? 11 : 6,
          radius: 10,
          opacity: alpha,
        }),
        txt(`ID ${i}`, lx[i], cy - 68, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(fmt(v, 0), lx[i], cy, 38, col, 'mono', 'center').opacity(alpha),
      );
    });

    // Horizontal pairwise gap readout below logits
    nodes.push(
      txt(
        `Max after shift: ${fmt(Math.max(...vals), 1)}   ·   diffs: 0, -2, -3`,
        -440,
        155,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity((0.6 + 0.4 * gapPulse.value) * alpha),
    );

    if (nt > 0.08) {
      nodes.push(
        txt(
          'exp(z - max):  1.000,  0.135,  0.050',
          -440,
          225,
          28,
          ROLE.prob,
          'mono',
          'center',
        ).opacity(nt * alpha),
        txt(
          `Sum Z = 1.185   ·   NLL(ID 0) = -ln(0.844) = ${fmt(-Math.log(stable[0]), 3)} nats`,
          -440,
          295,
          28,
          ROLE.observed,
          'mono',
          'center',
        )
          .glow(7, ROLE.observed)
          .opacity(nt * alpha),
      );
    }

    // Right: Exact softmax distribution bars (unchanged throughout the shift!)
    const rx = [285, 495, 705];
    const barBase = 210;
    const maxBarH = 340;

    nodes.push(
      txt(
        'Normalized probabilities (invariant)',
        495,
        -255,
        30,
        ROLE.good,
        'mono',
        'center',
      ).opacity(alpha),
      line([170, barBase], [820, barBase], { stroke: '#4d6191', width: 2.4 }).opacity(alpha),
    );

    stable.forEach((p, i) => {
      const h = Math.max(14, p * maxBarH);
      const col = i === 0 ? ROLE.good : ROLE.prob;
      nodes.push(
        lumBar(rx[i], barBase - h / 2, 130, h, {
          color: col,
          fillOpacity: 0.35 + 0.25 * nt,
          strokeWidth: 2.6,
          glow: 8 + 4 * nt,
          radius: 8,
          opacity: alpha,
        }),
        txt(`ID ${i}`, rx[i], barBase + 42, 26, col, 'mono', 'center').opacity(alpha),
        txt(fmt(p, 3), rx[i], barBase - h - 30, 30, col, 'mono', 'center').opacity(alpha),
      );
    });

    nodes.push(
      txt(
        'Shifting every logit by -max keeps the softmax distribution identical.',
        0,
        395,
        30,
        COSMOS.ink,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // VIEW 2: Direct probability product underflow vs linear log-loss sum over 5,000 tokens
  const underflowLayer = guardedDynamic(vUnderflow, (alpha) => {
    const nodes = [];
    const prog = scaleProg.value;
    const snap = logSpaceSnapshot(prog);
    const ov = overflowNote.value;

    nodes.push(
      txt(
        `N = ${snap.count.toLocaleString('en-US')} targets   ·   each p = ${fmt(snap.probability, 4)}`,
        0,
        -255,
        36,
        ROLE.observed,
        'mono',
        'center',
      )
        .glow(8, ROLE.observed)
        .opacity(alpha),
    );

    // Left: Probability product plunge curve (collapses to 0.000!)
    const lx0 = -780;
    const ly0 = 155;
    const lw = 640;
    const lh = 260;
    const prodPts = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const nVal = 1 + f * (snap.count - 1);
      const pVal = Math.exp(-nVal * 0.169846);
      prodPts.push([lx0 + f * lw, ly0 - Math.min(1, pVal) * lh]);
    }
    const underflowed = snap.product === 0;
    const pCol = underflowed ? ROLE.warn : ROLE.context;

    nodes.push(
      txt('Multiply probabilities:  Π p_i', lx0 + lw / 2, -165, 32, pCol, 'mono', 'center').opacity(
        alpha,
      ),
      arrow([lx0, ly0], [lx0 + lw + 18, ly0], { stroke: '#506496', width: 2.2, tip: 10 }).opacity(
        alpha,
      ),
      arrow([lx0, ly0], [lx0, ly0 - lh - 18], { stroke: '#506496', width: 2.2, tip: 10 }).opacity(
        alpha,
      ),
      glowingTrail(prodPts, { color: pCol, width: 4.5, glow: 10, opacity: alpha }),
      glowDot(prodPts[prodPts.length - 1][0], prodPts[prodPts.length - 1][1], {
        radius: 8,
        color: pCol,
        glow: 14,
        opacity: alpha,
      }),
      txt(
        underflowed
          ? 'product = 0.0  (FLOAT UNDERFLOW!)'
          : `product = ${snap.product.toExponential(2)}`,
        lx0 + lw / 2,
        ly0 + 62,
        32,
        pCol,
        'mono',
        'center',
      )
        .glow(8, pCol)
        .opacity(alpha),
    );

    // Right: Linear summed log-loss climb (clean, finite, exact)
    const rx0 = 140;
    const ry0 = 155;
    const rw = 640;
    const rh = 260;
    const fracSum = Math.min(1, snap.sum / 900);
    const sumEnd = [rx0 + fracSum * rw, ry0 - fracSum * rh];

    nodes.push(
      txt(
        'Add log losses:  Σ -ln(p_i)',
        rx0 + rw / 2,
        -165,
        32,
        ROLE.good,
        'mono',
        'center',
      ).opacity(alpha),
      arrow([rx0, ry0], [rx0 + rw + 18, ry0], { stroke: '#506496', width: 2.2, tip: 10 }).opacity(
        alpha,
      ),
      arrow([rx0, ry0], [rx0, ry0 - rh - 18], { stroke: '#506496', width: 2.2, tip: 10 }).opacity(
        alpha,
      ),
      glowingTrail([[rx0, ry0], sumEnd], {
        color: ROLE.good,
        width: 4.8,
        glow: 12,
        opacity: alpha,
      }),
      glowDot(sumEnd[0], sumEnd[1], { radius: 8, color: ROLE.good, glow: 14, opacity: alpha }),
      txt(
        `sum = ${fmt(snap.sum, 1)} nats   ·   mean = ${fmt(snap.mean, 3)}`,
        rx0 + rw / 2,
        ry0 + 62,
        32,
        ROLE.good,
        'mono',
        'center',
      )
        .glow(8, ROLE.good)
        .opacity(alpha),
    );

    nodes.push(
      txt(
        `Exact PPL = exp(${fmt(snap.mean, 3)}) = ${fmt(snap.perplexity, 3)}`,
        0,
        310,
        36,
        ROLE.prob,
        'mono',
        'center',
      )
        .glow(8, ROLE.prob)
        .opacity(alpha),
      txt(
        'Even a finite loss can overflow exp(L); keep the loss itself.',
        0,
        395,
        28,
        ROLE.amber,
        'serif',
        'center',
      ).opacity((0.35 + 0.65 * ov) * alpha),
    );

    return nodes;
  });

  const lseEq = glowTex('\\text{NLL}_y = \\ln\\sum_j e^{z_j - m} - (z_y - m)', {
    x: 340,
    y: -380,
    size: 34,
    color: ROLE.observed,
  });

  s.add(cinemaAtmosphere(ROLE.prob, ROLE.good), title, lseEq, shiftLayer, underflowLayer);

  // Beat 0: subtract max -> shift all together -> normalize & recover NLL
  playCue(s, c, 'stable-subtract', (d) => s.play(shiftT.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'stable-beat-1-focus-2', (d) => s.play(gapPulse.to(0.6, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'stable-beat-1-focus-1', (d) => s.play(gapPulse.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'stable-normalize', (d) => s.play(normT.to(1, { duration: d })), { dur: 0.75 });

  // Beat 1: swap cleanly to underflow vs log-sum scaling
  c.hide(1, lseEq);
  c.onBeat(1, () => s.play(swapVis(vShift, vUnderflow, 0.55)));
  playCue(s, c, 'stable-beat-2-focus-1', (d) => s.play(scaleProg.to(0.99, { duration: d })), {
    dur: 2.2,
  });
  playCue(s, c, 'stable-beat-2-focus-2', (d) => s.play(overflowNote.to(1, { duration: d })), {
    dur: 0.6,
  });
}
