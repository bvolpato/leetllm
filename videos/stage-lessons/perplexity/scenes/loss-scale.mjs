// Scene 5: loss-scale: "Equal loss steps multiply perplexity"
// View 1 (Beat 0): Luminous choice wheel splitting 4 -> 8 -> 16 paired with a 3D orbiting
//   exponential doubling staircase (cinematic3d + wireframeSlab3d). Strict withholding on K=8, 16.
// View 2 (Beat 1): Fair 3-way guess (33.3%) vs geometric mean share (34.2% AFTER equivalent-share)
//   and reciprocal PPL 2.92 (AFTER effective-count).
// View 3 (Beat 2): 2-token vocabulary confident miss (p = 0.01) -> PPL = 100 > 2 AFTER wrong-ppl.
import { circle, gridPlane3d, line } from 'vizmatic/stage';
import {
  COSMOS,
  cinematic3d,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
  wireframeSlab3d,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playCue,
  ppl,
  probabilities,
  swapVis,
  total,
} from '../parts.mjs';

export default function lossScale(s, c) {
  const equivP = Math.exp(-total / probabilities.length); // ~0.342

  const title = heroTitle(['Equal loss steps', 'multiply perplexity'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.prob,
  });

  const vWheel = s.value(1);
  const vEquiv = s.value(0);
  const vMiss = s.value(0);

  // View 1 state
  const sliceStage = s.value(0); // 0 = 4 slices, 1 = 8 slices, 2 = 16 slices
  const showK8 = s.value(0);
  const showK16 = s.value(0);

  // 3D exponential doubling towers (4 -> 8 -> 16) visible ONLY during View 1
  const view3d = cinematic3d({
    theta: -0.35,
    phi: 1.06,
    distance: 16.4,
    unit: 80,
    focus: [0, 0, 0.7],
  }).at(435, -55);

  const floor3d = gridPlane3d({
    x: [-3.4, 3.4],
    y: [-2.0, 2.0],
    z: -1.0,
    step: 1,
    color: '#2b3d69',
    opacity: 0.42,
  });
  const tower4 = wireframeSlab3d([-2.2, 0, -0.5], 0.5, 0.5, 0.5, {
    color: ROLE.context,
    width: 2.8,
    glow: 8,
  });
  const tower8 = wireframeSlab3d(() => [0, 0, -1.0 + 0.5 + 0.5 * showK8.value], 0.5, 0.5, 0.95, {
    color: ROLE.prob,
    width: 2.8,
    glow: 9,
  });
  const tower16 = wireframeSlab3d(
    () => [2.2, 0, -1.0 + 0.5 + 1.45 * showK16.value],
    0.5,
    0.5,
    1.85,
    {
      color: ROLE.observed,
      width: 3,
      glow: 11,
    },
  );
  view3d.add(floor3d, ...tower4, ...tower8, ...tower16);

  // View 2 state (withheld until cues)
  const revealShare = s.value(0);
  const revealPpl = s.value(0);

  // View 3 state (withheld until wrong-ppl)
  const revealHundred = s.value(0);

  // VIEW 1: Glowing radial choice dial + doubling ladder
  const wheelLayer = guardedDynamic(vWheel, (alpha) => {
    const nodes = [];
    const st = sliceStage.value;
    const k8 = showK8.value;
    const k16 = showK16.value;

    const k = st >= 1.5 ? 16 : st >= 0.5 ? 8 : 4;
    const cx = -425;
    const cy = 55;
    const rad = 225;
    const dialCol = k === 16 ? ROLE.observed : k === 8 ? ROLE.prob : ROLE.context;

    // Outer luminous wheel
    nodes.push(
      circle(rad, { fill: dialCol, stroke: null })
        .at(cx, cy)
        .opacity(0.1 * alpha),
      circle(rad, { fill: null, stroke: dialCol, width: 3.4 })
        .at(cx, cy)
        .glow(10, dialCol)
        .opacity(alpha),
    );

    // Spokes
    for (let i = 0; i < k; i++) {
      const ang = (i / k) * Math.PI * 2 - Math.PI / 2;
      nodes.push(
        line([cx, cy], [cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad], {
          stroke: dialCol,
          width: k === 16 ? 2 : 2.6,
        }).opacity(0.85 * alpha),
      );
    }

    // Highlight one chosen slice arc
    const slicePts = [];
    const endAng = (1 / k) * Math.PI * 2 - Math.PI / 2;
    for (let j = 0; j <= 16; j++) {
      const a = -Math.PI / 2 + (j / 16) * (endAng + Math.PI / 2);
      slicePts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
    nodes.push(
      glowingTrail(slicePts, { color: ROLE.observed, width: 6.5, glow: 14, opacity: alpha }),
      glowDot(cx, cy, { radius: 7, color: COSMOS.ink, glow: 10, opacity: alpha }),
    );

    // Readouts cleanly above & below wheel
    const displayK = k === 4 || (k === 8 && k8 > 0.5) || (k === 16 && k16 > 0.5) ? String(k) : '?';
    nodes.push(
      txt('Uniform choice wheel', cx, -240, 30, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(`K = ${displayK}`, cx, 325, 40, dialCol, 'mono', 'center')
        .glow(7, dialCol)
        .opacity(alpha),
      txt(
        `p = 1/${k}  ·  -ln(p) = ${fmt(Math.log(k), 3)} nats`,
        cx,
        378,
        28,
        ROLE.observed,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'Each +ln(2) ≈ +0.693 nats doubles perplexity',
        435,
        420,
        28,
        COSMOS.ink,
        'serif',
        'center',
      ).opacity(alpha),
      txt('Exponential doubling: 4 → 8 → 16', 435, -350, 30, ROLE.prob, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        `4${k8 > 0.5 ? '  →  8' : '  →  ?'}${k16 > 0.5 ? '  →  16' : k >= 16 ? '  →  ?' : ''}`,
        435,
        355,
        38,
        ROLE.observed,
        'mono',
        'center',
      )
        .glow(8, ROLE.observed)
        .opacity(alpha),
    );

    return nodes;
  });

  // VIEW 2: Fair 3-way guess vs equivalent geometric mean probability of (on, the, mat)
  const equivLayer = guardedDynamic(vEquiv, (alpha) => {
    const nodes = [];
    const rs = revealShare.value;
    const rp = revealPpl.value;
    const left = -760;
    const fullW = 1140;

    // Row 1: Fair 3-way guess (33.3%)
    const y1 = -130;
    nodes.push(
      txt('Fair 3-way uniform guess', left, y1 - 74, 32, ROLE.context, 'serif', 'left').opacity(
        alpha,
      ),
      lumBar(left + fullW / 2, y1, fullW, 64, {
        color: '#344775',
        fillOpacity: 0.14,
        strokeWidth: 2,
        glow: 3,
        opacity: alpha,
      }),
      lumBar(left + (fullW * (1 / 3)) / 2, y1, fullW / 3, 58, {
        color: ROLE.context,
        fillOpacity: 0.48,
        strokeWidth: 2.6,
        glow: 10,
        opacity: alpha,
      }),
      line([left + (fullW * 2) / 3, y1 - 32], [left + (fullW * 2) / 3, y1 + 32], {
        stroke: COSMOS.dim,
        width: 2,
      }).opacity(alpha),
      txt('33.3%', left + fullW + 42, y1, 44, ROLE.context, 'mono', 'left')
        .glow(8, ROLE.context)
        .opacity(alpha),
    );

    // Row 2: Sentence geometric mean (withheld until revealShare!)
    const y2 = 75;
    const fillFrac = equivP * rs;
    nodes.push(
      txt(
        'Same average surprise as "on", "the", "mat"',
        left,
        y2 - 74,
        32,
        ROLE.prob,
        'serif',
        'left',
      ).opacity(alpha),
      lumBar(left + fullW / 2, y2, fullW, 64, {
        color: '#344775',
        fillOpacity: 0.14,
        strokeWidth: 2,
        glow: 3,
        opacity: alpha,
      }),
    );
    if (rs > 0.05) {
      nodes.push(
        lumBar(left + (fullW * fillFrac) / 2, y2, Math.max(8, fullW * fillFrac), 58, {
          color: ROLE.prob,
          fillOpacity: 0.54,
          strokeWidth: 2.8,
          glow: 12,
          opacity: alpha,
        }),
        txt(`${(equivP * 100).toFixed(1)}%`, left + fullW + 42, y2, 44, ROLE.prob, 'mono', 'left')
          .glow(8, ROLE.prob)
          .opacity(rs * alpha),
      );
    } else {
      nodes.push(
        txt('? %', left + fullW + 42, y2, 44, ROLE.observed, 'mono', 'left').opacity(alpha),
      );
    }

    // Inputs line + geometric mean calculation
    nodes.push(
      txt(
        'on: 50%   ·   the: 10%   ·   mat: 80%',
        left,
        215,
        30,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    );
    if (rs > 0.2) {
      nodes.push(
        txt(`∛(0.50 × 0.10 × 0.80) ≈ ${fmt(equivP, 3)}`, 135, 215, 32, ROLE.prob, 'mono', 'left')
          .glow(6, ROLE.prob)
          .opacity(rs * alpha),
      );
    }

    // Bottom prompt / answer (withheld until effective-count!)
    nodes.push(
      txt(
        rp > 0.5 ? `PPL ≈ ${fmt(ppl, 2)}` : 'Which single probability matches the mean surprise?',
        0,
        355,
        rp > 0.5 ? 48 : 34,
        rp > 0.5 ? ROLE.good : ROLE.observed,
        rp > 0.5 ? 'mono' : 'serif',
        'center',
      )
        .glow(8, rp > 0.5 ? ROLE.good : ROLE.observed)
        .opacity(alpha),
    );

    return nodes;
  });

  // VIEW 3: 2-token vocabulary confident miss (p = 0.01 -> PPL = 100 > vocab 2)
  const missLayer = guardedDynamic(vMiss, (alpha) => {
    const nodes = [];
    const rh = revealHundred.value;
    const left = -460;
    const stripW = 1180;

    nodes.push(
      txt(
        'Vocabulary size = 2 tokens  ·  model confident, wrong twice',
        0,
        -245,
        32,
        ROLE.warn,
        'mono',
        'center',
      ).opacity(alpha),
    );

    [
      { label: 'Step 1 · obs A', y: -90, col: ROLE.context },
      { label: 'Step 2 · obs B', y: 115, col: ROLE.masked },
    ].forEach((row) => {
      const sliver = Math.max(16, stripW * 0.01);
      nodes.push(
        txt(row.label, left - 36, row.y, 32, row.col, 'mono', 'right').opacity(alpha),
        lumBar(left + sliver / 2, row.y, sliver, 70, {
          color: ROLE.warn,
          fillOpacity: 0.85,
          strokeWidth: 3,
          glow: 14,
          radius: 4,
          opacity: alpha,
        }),
        lumBar(left + sliver + (stripW - sliver) / 2, row.y, stripW - sliver - 6, 70, {
          color: '#344775',
          fillOpacity: 0.16,
          strokeWidth: 2,
          glow: 3,
          radius: 7,
          opacity: alpha,
        }),
        txt('0.01', left + 8, row.y + 62, 28, ROLE.observed, 'mono', 'center').opacity(alpha),
        txt(
          'other token: 0.99 (unobserved)',
          left + stripW * 0.52,
          row.y,
          30,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    nodes.push(
      txt(
        rh > 0.5
          ? 'PPL = exp(-ln 0.01) = 100   >>   vocabulary size 2'
          : 'How much did the observed 1% words cost?',
        0,
        335,
        rh > 0.5 ? 40 : 36,
        rh > 0.5 ? ROLE.warn : ROLE.observed,
        rh > 0.5 ? 'mono' : 'serif',
        'center',
      )
        .glow(9, rh > 0.5 ? ROLE.warn : ROLE.observed)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.prob, ROLE.warn), title, view3d, wheelLayer, equivLayer, missLayer);

  // Bounded 3D orbit strictly during Beat 0 before switching to Beat 1
  const beat1Start = c.beats[1].start;
  const orbitDur = Math.max(0.8, beat1Start - c.start - 0.6);
  c.at(0.2, () => {
    s.play(view3d.orbit({ theta: -0.22, phi: 0.96, distance: 14.4 }, { duration: orbitDur }));
  });

  // Beat 0: 4 -> split -> 8 (AFTER double-choice) -> split -> 16 (AFTER double-again)
  playCue(s, c, 'uniform-four', (d) => s.play(sliceStage.to(0, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'split-four', (d) => s.play(sliceStage.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'double-choice', (d) => s.play(showK8.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'split-eight', (d) => s.play(sliceStage.to(2, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'double-again', (d) => s.play(showK16.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  // Beat 1: Hide 3D view & swap to equivalent geometric mean comparison
  c.hide(1, view3d);
  c.onBeat(1, () => s.play(swapVis(vWheel, vEquiv, 0.55)));
  playCue(s, c, 'equivalent-share', (d) => s.play(revealShare.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'effective-count', (d) => s.play(revealPpl.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });

  // Beat 2: Swap to 2-token vocabulary confident miss (PPL = 100 AFTER wrong-ppl)
  c.onBeat(2, () => s.play(swapVis(vEquiv, vMiss, 0.55)));
  playCue(s, c, 'wrong-ppl', (d) => s.play(revealHundred.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });

  void glowTex;
}
