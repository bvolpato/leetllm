// Scene 5: mix: "The answer is a mixture"
// Value vectors v_Birds = [2,1] and v_sing = [1,2] scale by 42% and 58%, add tip-to-tail,
// land on the convex segment at [1.42, 1.58], then demonstrate attention dropout leaving the segment.
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
  DROPPED_OUTPUT,
  DROPPED_SHARE,
  OUTPUT,
  ROLE,
  V,
  WEIGHTS,
  cinemaAtmosphere,
  fmt,
  glowRing,
  glowVector,
  pct,
  playCue,
  vecStr,
  vecTrim,
  vectorPlane,
} from '../parts.mjs';

export default function mix(s, c) {
  const wB = WEIGHTS[1][0];
  const wS = WEIGHTS[1][1];
  const scaledB = [wB * V[0][0], wB * V[0][1]]; // [0.842, 0.421]
  const scaledS = [wS * V[1][0], wS * V[1][1]]; // [0.579, 1.158]

  const title = heroTitle(['The answer is', 'a weighted mixture'], {
    x: -850,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.value,
  });

  // Large full-bleed vector plane on right
  const plane = vectorPlane({
    originX: 85,
    originY: 365,
    scale: 300,
    xMin: -0.15,
    xMax: 2.55,
    yMin: -0.15,
    yMax: 2.55,
    step: 0.5,
    xLabel: 'v₁',
    yLabel: 'v₂',
  });

  // Reactive construction state
  const showV = s.value(0.2); // raw value arrows fade in
  const showBirdsV = s.value(0);
  const showSingV = s.value(0);
  const scaleT = s.value(0); // 0 = full values, 1 = scaled by 42% / 58%
  const slideT = s.value(0); // 0 = both at origin, 1 = tip-to-tail sum
  const showResult = s.value(0);
  const showSegment = s.value(0); // convex line segment between v_Birds and v_sing
  const dropoutT = s.value(0); // 0 -> 1 shows dropout jumping off the segment to DROPPED_OUTPUT

  const stageVis = s.value(1);

  const geoLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const o = plane.origin;
    const bv = showBirdsV.value;
    const sv = showSingV.value;
    const sc = scaleT.value;
    const sl = slideT.value;
    const sr = showResult.value;
    const seg = showSegment.value;
    const dr = dropoutT.value;

    const pVB = plane.toScreen(V[0][0], V[0][1]);
    const pVS = plane.toScreen(V[1][0], V[1][1]);
    const pOut = plane.toScreen(OUTPUT[1][0], OUTPUT[1][1]);

    // Convex line segment between v_Birds and v_sing
    if (seg > 0.05) {
      nodes.push(
        glowingTrail([pVB, pVS], {
          gradientColors: [ROLE.birds, ROLE.query, ROLE.sing],
          width: 4,
          glow: 9,
          opacity: seg * 0.9 * alpha,
        }),
      );
    }

    // Ghost full-value endpoints & rings
    if (bv > 0.05) {
      nodes.push(
        glowRing(pVB[0], pVB[1], 13, ROLE.birds, { width: 3, glow: 8 }),
        txt(
          `v_Birds ${vecTrim(V[0])}`,
          pVB[0] + 22,
          pVB[1] + 6,
          28,
          ROLE.birds,
          'mono',
          'left',
        ).opacity(bv * alpha),
      );
      const curB = [V[0][0] * (1 - sc + sc * wB), V[0][1] * (1 - sc + sc * wB)];
      nodes.push(
        glowVector(o, plane.toScreen(curB[0], curB[1]), {
          color: ROLE.birds,
          width: 5.5,
          glow: 11,
          opacity: bv * alpha,
        }),
      );
    }

    if (sv > 0.05) {
      nodes.push(
        glowRing(pVS[0], pVS[1], 13, ROLE.sing, { width: 3, glow: 8 }),
        txt(
          `v_sing ${vecTrim(V[1])}`,
          pVS[0] - 28,
          pVS[1] - 42,
          28,
          ROLE.sing,
          'mono',
          'right',
        ).opacity(sv * alpha),
      );
      const curS = [V[1][0] * (1 - sc + sc * wS), V[1][1] * (1 - sc + sc * wS)];
      const tailS = [scaledB[0] * sl, scaledB[1] * sl];
      const tipS = [tailS[0] + curS[0], tailS[1] + curS[1]];
      nodes.push(
        glowVector(plane.toScreen(tailS[0], tailS[1]), plane.toScreen(tipS[0], tipS[1]), {
          color: ROLE.sing,
          width: 5.5,
          glow: 11,
          opacity: sv * alpha,
        }),
      );
    }

    // Resulting blended output arrow & coordinates
    if (sr > 0.05) {
      nodes.push(
        glowVector(o, pOut, {
          color: ROLE.query,
          width: 6,
          tipSize: 20,
          glow: 14,
          opacity: sr * alpha,
        }),
        glowDot(pOut[0], pOut[1], { radius: 10, color: ROLE.query, glow: 16, opacity: sr * alpha }),
        txt(
          `out ${vecStr(OUTPUT[1], 2)}`,
          pOut[0] + 34,
          pOut[1] - 42,
          32,
          ROLE.query,
          'mono',
          'left',
        )
          .glow(8, ROLE.query)
          .opacity(sr * alpha),
      );
    }

    // Dropout point jumping OFF the convex line segment!
    if (dr > 0.05) {
      const dropPt = plane.toScreen(
        OUTPUT[1][0] + (DROPPED_OUTPUT[0] - OUTPUT[1][0]) * dr,
        OUTPUT[1][1] + (DROPPED_OUTPUT[1] - OUTPUT[1][1]) * dr,
      );
      nodes.push(
        line(pOut, dropPt, { stroke: ROLE.mask, width: 3, dash: [8, 6] }).opacity(dr * alpha),
        glowDot(dropPt[0], dropPt[1], {
          radius: 10,
          color: ROLE.mask,
          glow: 16,
          opacity: dr * alpha,
        }),
      );
      if (dr > 0.78) {
        nodes.push(
          txt(
            `dropout: ${vecStr(DROPPED_OUTPUT, 2)}`,
            dropPt[0] + 28,
            dropPt[1] - 20,
            28,
            ROLE.mask,
            'mono',
            'left',
          )
            .glow(6, ROLE.mask)
            .opacity(alpha),
        );
      }
    }

    return nodes;
  });

  // Left-side progressive math breakdown
  const blendEq = glowTex('o = \\alpha_1 v_1 + \\alpha_2 v_2', {
    x: -540,
    y: -170,
    size: 44,
    color: ROLE.value,
  });
  const lineB = txt(
    `${pct(wB)} × [2, 1] = ${vecStr(scaledB, 2)}`,
    -850,
    -50,
    30,
    ROLE.birds,
    'mono',
    'left',
  );
  const lineS = txt(
    `${pct(wS)} × [1, 2] = ${vecStr(scaledS, 2)}`,
    -850,
    25,
    30,
    ROLE.sing,
    'mono',
    'left',
  );
  const lineSum = txt(
    `output = ${vecStr(OUTPUT[1], 2)}`,
    -850,
    120,
    36,
    ROLE.query,
    'mono',
    'left',
  ).glow(8, ROLE.query);
  const blendNote = txt(
    'Birds leads x₁  ·  sing leads x₂',
    -850,
    210,
    28,
    COSMOS.muted,
    'sans',
    'left',
  );
  const convexNote = txt(
    'shares ≥ 0, sum = 1 → on segment',
    -850,
    290,
    28,
    ROLE.value,
    'mono',
    'left',
  );
  const dropNote = txt(
    `dropout (p=0.5) → ${fmt(DROPPED_SHARE, 2)}×v_sing`,
    -850,
    365,
    28,
    ROLE.mask,
    'mono',
    'left',
  );
  const laterNote = txt(
    'W_O & residual move it further',
    -850,
    430,
    28,
    COSMOS.muted,
    'sans',
    'left',
  );

  s.add(cinemaAtmosphere(ROLE.value, ROLE.query), title, plane.node, geoLayer, blendEq);

  // Beat 0: Bring in the two values
  playCue(
    s,
    c,
    'values-appear',
    (d) =>
      s.play(
        showV.to(1, { duration: d }),
        showBirdsV.to(0.45, { duration: d }),
        showSingV.to(0.45, { duration: d }),
      ),
    { dur: 0.6 },
  );

  // Beat 1: Birds value [2,1], sing value [1,2], scale by shares, add tip-to-tail
  playCue(s, c, 'birds-value', (d) => s.play(showBirdsV.to(1, { duration: d })), { dur: 0.5 });
  c.show('birds-value', lineB);
  playCue(s, c, 'sing-value', (d) => s.play(showSingV.to(1, { duration: d })), { dur: 0.5 });
  c.show('sing-value', lineS);
  playCue(s, c, 'scale-values', (d) => s.play(scaleT.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'tip-to-tail', (d) => s.play(slideT.to(1, { duration: d })), { dur: 0.75 });

  // Beat 2: Output [1.42, 1.58] revealed
  playCue(s, c, 'result', (d) => s.play(showResult.to(1, { duration: d })), { dur: 0.55 });
  c.show('new-meaning', lineSum);
  c.show('blended', blendNote);

  // Beat 3: Convex line segment, attention dropout exception, later layers
  playCue(s, c, 'on-line', (d) => s.play(showSegment.to(1, { duration: d })), { dur: 0.65 });
  c.show('on-line', convexNote);
  playCue(s, c, 'dropout', (d) => s.play(dropoutT.to(1, { duration: d })), { dur: 0.75 });
  c.show('dropout', dropNote);
  c.show('later', laterNote);
}
