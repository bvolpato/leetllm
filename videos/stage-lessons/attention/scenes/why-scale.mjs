// Scene 8: why-scale: "Why divide by the square root?"
// Signature live Gaussian distribution morph widening from d=2 (σ=1.41) -> d=64 (σ=8) -> d=512 (σ=22.6),
// softmax gap saturation (e^10 ≈ 22,026×) & gradient slope collapse (0.22 -> 4e-9),
// then snapping cleanly back to σ=1 via 1/sqrt(d_k) vs 1/d_k over-compression.
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
  GAP_SHARES,
  LEAD_SLOPE,
  ROLE,
  TIED_SLOPE,
  UNSCALED_WEIGHTS,
  bellPts,
  cinemaAtmosphere,
  fmt,
  lumBar,
  pct,
  playCue,
  shareRibbon,
  softmax,
} from '../parts.mjs';

export default function whyScale(s, c) {
  const title = heroTitle(['Why divide by', 'the square root?'], {
    x: -850,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.query,
  });

  // Reactive parameters for the live bell curve & softmax saturation panel
  const sigma = s.value(Math.sqrt(2)); // 1.41 -> 8 -> 22.63 -> 1.0 -> 0.25 (if /d) -> 1.0
  const dimLabel = s.value(2); // 2, 64, 512
  const scaledFlag = s.value(0); // 0 = raw, 1 = divided by sqrt(d), 2 = divided by d
  const gapShift = s.value(0); // 0 = tied [0,0,0], 10 = gap of 10, 20 = lead of 20
  const showShiftInv = s.value(0); // +1000 invariance highlight
  const showGrad = s.value(0); // slope comparison (0.22 vs 4.1e-9)
  const showCaveat = s.value(0); // correlated trained coordinates caveat

  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const sig = Math.max(0.45, sigma.value);
    const sf = scaledFlag.value;
    const gap = gapShift.value;

    // LEFT/CENTER: Live Gaussian distribution of q·k scores
    const cx = -310;
    const baseY = 120;
    const halfW = 500;
    const maxH = 290;
    // Normalize peak height visually so wide curves flatten dramatically while unit variance stands crisp
    const peakH = Math.max(46, Math.min(maxH, maxH * (1.8 / Math.pow(sig, 0.52))));
    const curveCol =
      sf >= 1.5 ? ROLE.mask : sf >= 0.5 ? ROLE.value : sig > 5 ? ROLE.mask : ROLE.sing;

    // Horizontal axis for score distribution
    nodes.push(
      line([cx - halfW - 20, baseY], [cx + halfW + 20, baseY], {
        stroke: '#556894',
        width: 2.4,
      }).opacity(alpha),
      line([cx, baseY - maxH - 25], [cx, baseY + 14], {
        stroke: '#3a4a73',
        width: 1.8,
        dash: [6, 6],
      }).opacity(0.75 * alpha),
      txt('0', cx, baseY + 38, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('-25', cx - halfW * 0.85, baseY + 38, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      txt('+25', cx + halfW * 0.85, baseY + 38, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
    );

    // Reference unit-variance ghost curve (σ = 1) when widening or shrinking
    if (Math.abs(sig - 1) > 0.35) {
      const refPts = bellPts(cx, baseY, halfW, maxH * 0.92, 1.0, 28, 72);
      nodes.push(
        glowingTrail(refPts, {
          color: ROLE.value,
          width: 2.2,
          glow: 4,
          core: false,
          opacity: 0.35 * alpha,
        }),
      );
    }

    // Active glowing Gaussian curve
    const pts = bellPts(cx, baseY, halfW, peakH, sig, 28, 96);
    nodes.push(
      glowingTrail(pts, {
        color: curveCol,
        width: 5,
        glow: 12,
        opacity: alpha,
      }),
    );

    // Live ±1σ span indicator below axis
    const spanPx = Math.min(halfW * 0.95, (sig / 28) * halfW);
    nodes.push(
      glowingTrail(
        [
          [cx - spanPx, baseY + 86],
          [cx + spanPx, baseY + 86],
        ],
        { color: curveCol, width: 4.5, glow: 8, opacity: alpha },
      ),
      glowDot(cx - spanPx, baseY + 86, { radius: 6, color: curveCol, glow: 8, opacity: alpha }),
      glowDot(cx + spanPx, baseY + 86, { radius: 6, color: curveCol, glow: 8, opacity: alpha }),
      txt(
        `d_k = ${Math.round(dimLabel.value)}   ·   σ = ${fmt(sig, 1)}`,
        cx,
        baseY + 144,
        34,
        curveCol,
        'mono',
        'center',
      )
        .glow(7, curveCol)
        .opacity(alpha),
    );

    const statusLine =
      sf >= 1.5
        ? 'Dividing by d_k over-shrinks (σ = 1/√d_k → 0)'
        : sf >= 0.5
          ? 'Dividing by √d_k restores Var = 1, σ = 1'
          : 'Raw dot product: Var(q·k) = d_k,  σ = √d_k';
    nodes.push(
      txt(
        statusLine,
        cx,
        baseY + 206,
        28,
        sf >= 0.5 && sf < 1.5 ? ROLE.value : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    // RIGHT: Live 3-key Softmax Saturation & Gradient Slope Panel
    const rx = 560;
    const scores3 = [gap, 0, 0];
    const shares3 = softmax(scores3);
    const slope = shares3[0] * (1 - shares3[0]);

    nodes.push(
      txt('3-key softmax response', rx, -255, 32, ROLE.query, 'mono', 'center').opacity(alpha),
      txt(
        `logits = [${fmt(gap, 0)}, 0, 0]`,
        rx,
        -195,
        30,
        gap > 5 ? ROLE.mask : ROLE.sing,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // 3 live vertical share bars
    const bx = [rx - 190, rx, rx + 190];
    const bCols = [gap > 5 ? ROLE.mask : ROLE.query, ROLE.birds, ROLE.sing];
    const bNames = ['key 1', 'key 2', 'key 3'];
    const barBase = 70;
    const barMax = 195;

    nodes.push(
      line([rx - 280, barBase], [rx + 280, barBase], { stroke: '#556894', width: 2.2 }).opacity(
        alpha,
      ),
    );
    shares3.forEach((w, i) => {
      const h = Math.max(8, w * barMax);
      nodes.push(
        lumBar(bx[i], barBase - h / 2, 104, h, {
          color: bCols[i],
          fillOpacity: 0.45,
          strokeWidth: 2.5,
          glow: 9,
          opacity: alpha,
        }),
        txt(bNames[i], bx[i], barBase + 36, 26, bCols[i], 'mono', 'center').opacity(alpha),
        txt(pct(w), bx[i], barBase - h - 28, 28, bCols[i], 'mono', 'center').opacity(alpha),
      );
    });

    // Shift-invariance & gap-of-10 readout
    if (showShiftInv.value > 0.05) {
      nodes.push(
        txt(
          gap >= 9.5 ? 'e¹⁰ ≈ 22,026× ratio!' : '+1000 to all scores → identical shares',
          rx,
          170,
          28,
          gap >= 9.5 ? ROLE.mask : ROLE.value,
          'mono',
          'center',
        )
          .glow(6, gap >= 9.5 ? ROLE.mask : ROLE.value)
          .opacity(showShiftInv.value * alpha),
      );
    }

    // Gradient slope readout
    if (showGrad.value > 0.05) {
      const slopeStr =
        slope < 0.001 ? `${slope.toExponential(1)} (vanishing!)` : `${fmt(slope, 2)} (healthy)`;
      const slopeCol = slope < 0.001 ? ROLE.mask : ROLE.value;
      nodes.push(
        txt(`∂α₁/∂z₁ = ${slopeStr}`, rx, 240, 30, slopeCol, 'mono', 'center')
          .glow(6, slopeCol)
          .opacity(showGrad.value * alpha),
        txt('Value v₁ can still learn', rx, 298, 28, COSMOS.muted, 'sans', 'center').opacity(
          showGrad.value * alpha,
        ),
      );
    }

    // Correlated coordinates caveat at bottom
    if (showCaveat.value > 0.05) {
      nodes.push(
        txt(
          'Trained heads have correlated coordinates: measure actual score spread.',
          0,
          425,
          28,
          ROLE.amber,
          'sans',
          'center',
        ).opacity(showCaveat.value * alpha),
      );
    }

    return nodes;
  });

  const varEq = glowTex(
    '\\operatorname{Var}(q \\cdot k) = d_k \\;\\Rightarrow\\; \\sigma = \\sqrt{d_k}',
    {
      x: -140,
      y: -365,
      size: 40,
      color: ROLE.sing,
    },
  );

  s.add(cinemaAtmosphere(ROLE.query, ROLE.mask), title, mainLayer);

  // Beat 0: Toy example barely changes
  playCue(s, c, 'barely', (d) => s.play(sigma.to(Math.sqrt(2), { duration: d })), { dur: 0.4 });

  // Beat 1: Independent random coordinates -> Var(sum) = d_k, std = sqrt(d_k)
  c.show('simple-model', varEq);
  playCue(s, c, 'each-product', (d) => s.play(sigma.to(1.8, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'add-up', (d) => s.play(sigma.to(3.0, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'root-d', (d) => s.play(sigma.to(4.0, { duration: d })), { dur: 0.55 });

  // Beat 2: d=64 (σ=8) -> d=512 (σ=22.63)
  playCue(
    s,
    c,
    'w64',
    (d) => s.play(dimLabel.to(64, { duration: d }), sigma.to(8, { duration: d })),
    { dur: 0.85 },
  );
  playCue(
    s,
    c,
    'w512',
    (d) => s.play(dimLabel.to(512, { duration: d }), sigma.to(Math.sqrt(512), { duration: d })),
    { dur: 0.9 },
  );

  // Beat 3: Gaps matter, +1000 invariance, gap of 10 -> 22,026x, winner takes all
  playCue(s, c, 'gaps', (d) => s.play(showShiftInv.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'add-thousand', (d) => s.play(gapShift.to(0, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'gap-ten', (d) => s.play(gapShift.to(10, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'leader', (d) => s.play(gapShift.to(12, { duration: d })), { dur: 0.55 });

  // Beat 4: Gradient collapse: tied (0.22) vs lead 20 (4.1e-9), value still learns
  playCue(s, c, 'hurt', (d) => s.play(showGrad.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'tied', (d) => s.play(gapShift.to(0, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'lead', (d) => s.play(gapShift.to(20, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'gradient', (d) => s.play(gapShift.to(20, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'value-learns', (d) => s.play(showGrad.to(1, { duration: d })), { dur: 0.3 });

  // Beat 5: Divide by sqrt(d_k) snaps bell curve back to σ=1! vs /d_k over-shrinks
  playCue(
    s,
    c,
    'divide-back',
    (d) =>
      s.play(
        scaledFlag.to(1, { duration: Math.min(0.25, d) }),
        sigma.to(1.0, { duration: d }),
        gapShift.to(1.2, { duration: d }),
      ),
    { dur: 0.9 },
  );
  playCue(
    s,
    c,
    'eight',
    (d) => s.play(dimLabel.to(64, { duration: d }), sigma.to(1.0, { duration: d })),
    {
      dur: 0.55,
    },
  );
  playCue(
    s,
    c,
    'not-d',
    (d) =>
      s.play(scaledFlag.to(2, { duration: Math.min(0.25, d) }), sigma.to(0.45, { duration: d })),
    { dur: 0.7 },
  );

  // Beat 6: Correlated coordinates caveat
  playCue(
    s,
    c,
    'limits',
    (d) =>
      s.play(
        scaledFlag.to(1, { duration: Math.min(0.25, d) }),
        sigma.to(1.0, { duration: d }),
        showCaveat.to(1, { duration: d }),
      ),
    { dur: 0.65 },
  );
  playCue(s, c, 'shared', (d) => s.play(showCaveat.to(1, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'measure', (d) => s.play(showCaveat.to(1, { duration: d })), { dur: 0.3 });

  void UNSCALED_WEIGHTS;
  void GAP_SHARES;
  void TIED_SLOPE;
  void LEAD_SLOPE;
  void shareRibbon;
}
