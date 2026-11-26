// Scene 3: score: "A match is a dot product"
// Rotating glowing query needle with live orthogonal projection drop-line,
// length-vs-angle demonstration, then fixed q_sing against k_Birds (0.60) and k_sing (? -> 1.05).
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
  K,
  LONG_KEY,
  Q,
  ROLE,
  SCORES,
  SHORT_KEY,
  cinemaAtmosphere,
  dotProd,
  fmt,
  glowVector,
  lumBar,
  playCue,
  vecTrim,
  vectorPlane,
} from '../parts.mjs';

export default function score(s, c) {
  const title = heroTitle(['A match is', 'a dot product'], {
    x: -850,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.query,
  });

  // Right full-bleed vector plane
  const plane = vectorPlane({
    originX: 160,
    originY: 255,
    scale: 380,
    xMin: -0.45,
    xMax: 1.35,
    yMin: -0.35,
    yMax: 1.25,
    step: 0.5,
    xLabel: 'd₁',
    yLabel: 'd₂',
  });

  // Reactive geometric state
  // mode: 0 = rotating query needle vs unit key, 1 = short vs long key, 2 = q_sing vs k_Birds, 3 = q_sing vs k_sing
  const qx = s.value(Q[1][0]);
  const qy = s.value(Q[1][1]);
  const kx = s.value(K[0][0]);
  const ky = s.value(K[0][1]);
  const showShortLong = s.value(0); // 0 -> 1 reveals short/long comparison
  const keyRoleMix = s.value(0); // 0 = birds blue, 1 = sing cyan
  const showLiveMeter = s.value(1); // 1 during beat 0-1, 0 when holding open prediction for sing!
  const revealSingAns = s.value(0); // 0 until sing-result AFTER!

  const stageVis = s.value(1);

  const geoLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const o = plane.origin;
    const q = [qx.value, qy.value];
    const k = [kx.value, ky.value];
    const sl = showShortLong.value;
    const kCol = keyRoleMix.value > 0.5 ? ROLE.sing : ROLE.birds;

    // Draw short & long keys during Beat 1
    if (sl > 0.05) {
      const shortTip = plane.toScreen(SHORT_KEY[0], SHORT_KEY[1]);
      const longTip = plane.toScreen(LONG_KEY[0], LONG_KEY[1]);
      nodes.push(
        glowVector(o, shortTip, { color: ROLE.sing, width: 4.5, glow: 8, opacity: sl * alpha }),
        txt(
          `short: ${fmt(dotProd(Q[1], SHORT_KEY))}`,
          505,
          -245,
          28,
          ROLE.sing,
          'mono',
          'left',
        ).opacity(sl * alpha),
        glowVector(o, longTip, { color: ROLE.amber, width: 5.5, glow: 12, opacity: sl * alpha }),
        txt(
          `long: ${fmt(dotProd(Q[1], LONG_KEY))}`,
          505,
          -190,
          28,
          ROLE.amber,
          'mono',
          'left',
        ).opacity(sl * alpha),
      );
    } else {
      // Active key vector
      const kTip = plane.toScreen(k[0], k[1]);
      nodes.push(
        glowVector(o, kTip, { color: kCol, width: 5.5, tipSize: 18, glow: 11, opacity: alpha }),
      );

      // Live orthogonal projection drop-line from query onto key direction
      const kNorm2 = k[0] * k[0] + k[1] * k[1];
      if (kNorm2 > 1e-4) {
        const projScale = dotProd(q, k) / kNorm2;
        const projPt = plane.toScreen(k[0] * projScale, k[1] * projScale);
        const qTip = plane.toScreen(q[0], q[1]);
        nodes.push(
          line(qTip, projPt, { stroke: COSMOS.muted, width: 2.2, dash: [8, 7] }).opacity(
            0.78 * alpha,
          ),
          glowingTrail([o, projPt], {
            color: ROLE.query,
            width: 5,
            glow: 9,
            opacity: 0.72 * alpha,
          }),
          glowDot(projPt[0], projPt[1], { radius: 6, color: ROLE.query, glow: 10, opacity: alpha }),
        );
      }

      // Key coordinate label cleanly offset away from axes and ticks
      const kLabel =
        keyRoleMix.value > 0.5 ? `k_sing ${vecTrim(K[1])}` : `k_Birds ${vecTrim(K[0])}`;
      if (keyRoleMix.value > 0.5) {
        nodes.push(txt(kLabel, 505, -245, 28, kCol, 'mono', 'left').opacity(alpha));
      } else {
        nodes.push(
          txt(kLabel, kTip[0] + 26, kTip[1] + 28, 28, kCol, 'mono', 'left').opacity(alpha),
        );
      }
    }

    // Glowing query needle (always on top); label parked cleanly in top-right legend away from sweep
    const qTip = plane.toScreen(q[0], q[1]);
    nodes.push(
      glowVector(o, qTip, { color: ROLE.query, width: 6, tipSize: 20, glow: 13, opacity: alpha }),
      txt(`q  [${fmt(q[0], 2)}, ${fmt(q[1], 2)}]`, 505, -310, 30, ROLE.query, 'mono', 'left')
        .glow(6, ROLE.query)
        .opacity(alpha),
    );

    // Live vertical score meter on left-center (hidden during open prediction!)
    const meterVis = showLiveMeter.value;
    if (meterVis > 0.05) {
      const liveVal = dotProd(q, k);
      const barX = -210;
      const zeroY = 180;
      const pxPerUnit = 190;
      const barH = Math.abs(liveVal) * pxPerUnit;
      const barY = liveVal >= 0 ? zeroY - barH / 2 : zeroY + barH / 2;
      const barCol = liveVal >= 0 ? ROLE.query : ROLE.mask;

      nodes.push(
        line([barX - 58, zeroY], [barX + 58, zeroY], { stroke: '#5a6e9b', width: 2 }).opacity(
          meterVis * alpha,
        ),
        lumBar(barX, barY, 74, Math.max(6, barH), {
          color: barCol,
          fillOpacity: 0.45,
          strokeWidth: 2.6,
          glow: 10,
          opacity: meterVis * alpha,
        }),
        txt('q · k', barX, -210, 30, COSMOS.muted, 'mono', 'center').opacity(meterVis * alpha),
        txt(fmt(liveVal, 2), barX, 345, 42, barCol, 'mono', 'center')
          .glow(8, barCol)
          .opacity(meterVis * alpha),
      );
    }

    return nodes;
  });

  // Left-side progressive equations (kept well away from meter & plane)
  const dotEq = glowTex('q \\cdot k = q_1 k_1 + q_2 k_2', {
    x: -600,
    y: -175,
    size: 40,
    color: ROLE.query,
  });
  const lenNote = txt('|q| |k| cos θ', -600, -75, 34, ROLE.amber, 'mono', 'center').glow(
    6,
    ROLE.amber,
  );
  const birdsEq = txt(
    `Birds: 0.5·0.8 + 1.0·0.2 = ${fmt(SCORES[1][0], 2)}`,
    -850,
    130,
    30,
    ROLE.birds,
    'mono',
    'left',
  );
  const singPrompt = txt('sing:  0.5·0.3 + 1.0·0.9', -850, 225, 30, ROLE.sing, 'mono', 'left');
  const singOpen = txt('= ?', -455, 295, 42, ROLE.query, 'mono', 'left').glow(8, ROLE.query);
  const singAns = txt(`= ${fmt(SCORES[1][1], 2)}`, -455, 295, 44, ROLE.sing, 'mono', 'left').glow(
    10,
    ROLE.sing,
  );
  const notZero = txt('Birds (0.60) is not zero', -850, 395, 30, ROLE.query, 'sans', 'left').glow(
    6,
    ROLE.query,
  );

  s.add(cinemaAtmosphere(ROLE.query, ROLE.sing), title, plane.node, geoLayer);

  // Beat 0: Dot product formula & rotating query needle
  c.show('multiply', dotEq);
  playCue(
    s,
    c,
    'turns',
    (d) => s.play(qx.to(0.95, { duration: d }), qy.to(0.25, { duration: d })),
    { dur: 0.7 },
  );
  playCue(
    s,
    c,
    'same-way',
    (d) => s.play(qx.to(1.05, { duration: d }), qy.to(0.26, { duration: d })),
    { dur: 0.6 },
  );
  playCue(
    s,
    c,
    'apart',
    (d) => s.play(qx.to(-0.32, { duration: d }), qy.to(1.02, { duration: d })),
    { dur: 0.75 },
  );
  playCue(
    s,
    c,
    'falls',
    (d) => s.play(qx.to(-0.38, { duration: d }), qy.to(0.75, { duration: d })),
    { dur: 0.45 },
  );

  // Beat 1: Length counts too (short aligned key vs longer angled key)
  playCue(
    s,
    c,
    'length',
    (d) =>
      s.play(
        qx.to(Q[1][0], { duration: d }),
        qy.to(Q[1][1], { duration: d }),
        showShortLong.to(1, { duration: d }),
      ),
    { dur: 0.6 },
  );
  c.show('longer', lenNote);
  playCue(s, c, 'length-angle', (d) => s.play(showShortLong.to(1, { duration: d })), { dur: 0.3 });

  // Beat 2: Hold q_sing still, score Birds (0.60), then open prediction for sing (?)
  playCue(
    s,
    c,
    'real-ones',
    (d) =>
      s.play(
        showShortLong.to(0, { duration: d }),
        kx.to(K[0][0], { duration: d }),
        ky.to(K[0][1], { duration: d }),
      ),
    { dur: 0.55 },
  );
  c.show('birds-score', birdsEq, { after: true });
  playCue(
    s,
    c,
    'try-sing',
    (d) =>
      s.play(
        showLiveMeter.to(0, { duration: Math.min(0.25, d) }),
        keyRoleMix.to(1, { duration: d }),
        kx.to(K[1][0], { duration: d }),
        ky.to(K[1][1], { duration: d }),
      ),
    { dur: 0.6 },
  );
  c.show('try-sing', [singPrompt, singOpen]);

  // Beat 3: Spoken reveal of 1.05 AFTER sing-result!
  c.swap('sing-result', singOpen, singAns, { after: true });
  playCue(s, c, 'sing-score', (d) => s.play(revealSingAns.to(1, { duration: d })), { dur: 0.25 });
  c.show('not-zero', notZero);
}
