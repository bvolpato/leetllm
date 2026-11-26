// Scene 19: minp-relative: "Min-p follows the peak and the temperature scale"
// View 1 (Beat 0): Peak 0.80 -> 0.080 vs Peak 0.05 -> 0.005 (rho = 0.1) + MathJax rule.
// View 2 (Beat 1): Logit number line [0, -2, -4] with equivalent cutoff z_max + T ln(0.1)
//   sliding from -2.303 (T = 1, keeps 2) to -4.605 (T = 2, keeps all 3).
// View 3 (Beat 2): Uniform 8-token counterexample: min-p 0.1 keeps all 8 vs top-p 0.75 keeps 6.
import { line } from 'vizmatic/stage';
import { COSMOS, glowDot, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  decodeSupport,
  fmt,
  glowVector,
  lumBar,
  playCue,
  swapVis,
} from '../parts.mjs';

export default function minpRelative(s, c) {
  const title = heroTitle(['Min-p follows the peak', '& temperature scale'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.winner,
  });

  const vPeak = s.value(1);
  const vLogit = s.value(0);
  const vUniform = s.value(0);

  const showPeakFloor = s.value(0);
  const showFlatFloor = s.value(0);
  const logitTemp = s.value(1.0); // 1.0 -> 2.0
  const showDef = s.value(0);
  const showHot = s.value(0);
  const showUnifMin = s.value(0);
  const showUnifTop = s.value(0);

  // VIEW 1: Relative floor scales with peak probability
  const peakLayer = guardedDynamic(vPeak, (alpha) => {
    const nodes = [];
    const pf = showPeakFloor.value > 0.4;
    const ff = showFlatFloor.value > 0.4;

    const cols = [
      { title: 'Confident peak', peak: 0.8, floor: 0.08, x: -430, ready: pf, col: ROLE.base },
      { title: 'Uncertain peak', peak: 0.05, floor: 0.005, x: 430, ready: ff, col: ROLE.active },
    ];

    cols.forEach((item) => {
      nodes.push(
        txt(item.title, item.x, -210, 32, item.col, 'serif', 'center').opacity(alpha),
        lumBar(item.x, -110, 500, 84, {
          color: item.col,
          fillOpacity: 0.24,
          strokeWidth: 2.4,
          glow: 9,
          radius: 12,
          opacity: alpha,
        }),
        txt(`p_max = ${item.peak}`, item.x, -110, 34, COSMOS.ink, 'mono', 'center').opacity(alpha),
        glowVector([item.x, -52], [item.x, 38], {
          color: ROLE.winner,
          width: 4,
          glow: 9,
          opacity: alpha,
        }),
        txt('× ρ = 0.1', item.x + 125, -8, 28, ROLE.winner, 'mono', 'left').opacity(alpha),
        lumBar(item.x, 125, 500, 98, {
          color: item.ready ? ROLE.winner : COSMOS.dim,
          fillOpacity: item.ready ? 0.28 : 0.08,
          strokeWidth: item.ready ? 2.8 : 1.8,
          glow: item.ready ? 11 : 2,
          radius: 14,
          opacity: alpha,
        }),
        txt(
          item.ready ? `floor = ${fmt(item.floor, 3)}` : 'floor = ?',
          item.x,
          125,
          item.ready ? 40 : 30,
          item.ready ? ROLE.winner : COSMOS.muted,
          'mono',
          'center',
        )
          .glow(item.ready ? 8 : 0, ROLE.winner)
          .opacity(alpha),
      );
    });

    nodes.push(
      txt(
        'A flatter peak automatically lowers the min-p probability floor.',
        0,
        365,
        30,
        COSMOS.muted,
        'serif',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: Equivalent logit floor z_max + T ln(rho) on [0, -2, -4]
  const logitLayer = guardedDynamic(vLogit, (alpha) => {
    const nodes = [];
    const T = Math.max(1.0, Math.min(2.0, logitTemp.value));
    const floor = T * Math.log(0.1);
    const rev = showDef.value > 0.4 || showHot.value > 0.4;

    const xL = -680;
    const xR = 680;
    const mapX = (z) => xL + ((z - -5.2) / (0.6 - -5.2)) * (xR - xL);
    const axisY = 65;

    nodes.push(
      txt(
        `T = ${fmt(T, 2)}   ·   logit floor = 0 + ${fmt(T, 2)} × ln(0.1) = ${fmt(floor, 3)}`,
        0,
        -210,
        32,
        T > 1.4 ? ROLE.heat : ROLE.winner,
        'mono',
        'center',
      )
        .glow(7, T > 1.4 ? ROLE.heat : ROLE.winner)
        .opacity(alpha),
      line([xL, axisY], [xR, axisY], { stroke: '#556894', width: 3.2 }).opacity(alpha),
    );

    // Moving luminous cutoff curtain (strictly between axisY - 105 and axisY + 26 so it NEVER crosses labels!)
    const fx = mapX(floor);
    nodes.push(
      line([fx, axisY - 105], [fx, axisY + 26], {
        stroke: ROLE.pruned,
        width: 4.5,
        dash: [9, 6],
      })
        .glow(12, ROLE.pruned)
        .opacity(alpha),
      txt('cutoff', fx, axisY - 134, 28, ROLE.pruned, 'mono', 'center')
        .glow(6, ROLE.pruned)
        .opacity(alpha),
    );

    // Logit markers at 0, -2, -4 (IDs placed cleanly ABOVE curtain top, values cleanly BELOW curtain bottom)
    const zs = [0, -2, -4];
    zs.forEach((z, i) => {
      const zx = mapX(z);
      const kept = z >= floor;
      const col = rev ? (kept ? ROLE.valid : ROLE.pruned) : ROLE.active;
      nodes.push(
        glowDot(zx, axisY, { radius: 14, color: col, glow: 14, opacity: alpha }),
        txt(`ID ${i}`, zx, axisY - 182, 30, col, 'mono', 'center').opacity(alpha),
        txt(`z = ${z}`, zx, axisY + 72, 30, COSMOS.ink, 'mono', 'center').opacity(alpha),
        rev
          ? txt(kept ? 'keep' : 'drop', zx, axisY + 122, 26, col, 'mono', 'center').opacity(alpha)
          : txt('', zx, axisY + 122, 26, col, 'mono', 'center').opacity(0),
      );
    });

    nodes.push(
      txt(
        showHot.value > 0.4
          ? 'T = 2 -> all 3 survive'
          : showDef.value > 0.4
            ? 'T = 1 -> keeps 2'
            : 'Temperature widens the logit floor.',
        0,
        365,
        32,
        showHot.value > 0.4 ? ROLE.winner : COSMOS.muted,
        'mono',
        'center',
      )
        .glow(showHot.value > 0.4 ? 6 : 0, ROLE.winner)
        .opacity(alpha),
    );
    return nodes;
  });

  // VIEW 3: Uniform 8-token counterexample (min-p 0.1 keeps 8 vs top-p 0.75 keeps 6)
  const uniformLayer = guardedDynamic(vUniform, (alpha) => {
    const nodes = [];
    const uMin = showUnifMin.value > 0.4;
    const uTop = showUnifTop.value > 0.4;
    const topRes = decodeSupport(Array(8).fill(1), 'p', 0.75);

    nodes.push(
      txt(
        '8 equal eligible logits (12.5% each)',
        0,
        -265,
        32,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        uMin ? 'Min-p = 0.10 -> keeps all 8 tokens' : 'Min-p = 0.10 -> ?',
        -760,
        -165,
        30,
        ROLE.valid,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        uTop ? 'Top-p = 0.75 -> keeps 6 tokens' : 'Top-p = 0.75 -> ?',
        -760,
        105,
        30,
        ROLE.active,
        'mono',
        'left',
      ).opacity(alpha),
    );

    for (let i = 0; i < 8; i++) {
      const cx = -672 + i * 192;
      nodes.push(
        lumBar(cx, -70, 164, 92, {
          color: uMin ? ROLE.valid : COSMOS.dim,
          fillOpacity: uMin ? 0.36 : 0.12,
          strokeWidth: uMin ? 2.6 : 1.6,
          glow: uMin ? 10 : 2,
          radius: 10,
          opacity: alpha,
        }),
        txt(`ID ${i}`, cx, -70, 28, uMin ? COSMOS.ink : COSMOS.muted, 'mono', 'center').opacity(
          alpha,
        ),
      );

      const keptTop = uTop && topRes.ids.includes(i);
      nodes.push(
        lumBar(cx, 200, 164, 92, {
          color: keptTop ? ROLE.active : COSMOS.dim,
          fillOpacity: keptTop ? 0.36 : 0.1,
          strokeWidth: keptTop ? 2.6 : 1.5,
          glow: keptTop ? 10 : 2,
          radius: 10,
          opacity: (uTop && !keptTop ? 0.36 : 1) * alpha,
        }),
        txt(`ID ${i}`, cx, 200, 28, keptTop ? COSMOS.ink : COSMOS.dim, 'mono', 'center').opacity(
          alpha,
        ),
      );
    }

    nodes.push(
      txt(
        'Min-p does not always shrink the pool; order relative to T still matters.',
        0,
        375,
        30,
        ROLE.winner,
        'serif',
        'center',
      )
        .glow(6, ROLE.winner)
        .opacity(alpha),
    );
    return nodes;
  });

  const minpEq = glowTex('P(w_i) \\ge \\rho \\cdot P_{\\max}', {
    x: 465,
    y: -385,
    size: 38,
    color: ROLE.winner,
  });
  const logitEq = glowTex('z_i \\ge z_{\\max} + T \\ln \\rho', {
    x: 465,
    y: -385,
    size: 38,
    color: ROLE.heat,
  });

  s.add(
    cinemaAtmosphere(ROLE.winner, ROLE.active),
    title,
    minpEq,
    peakLayer,
    logitLayer,
    uniformLayer,
  );

  playCue(s, c, 'dec-minp-relative-1', (d) => s.play(showPeakFloor.to(0.1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'dec-minp-peak-floor', (d) => s.play(showPeakFloor.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'dec-minp-flat-floor', (d) => s.play(showFlatFloor.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });

  c.hide(1, minpEq);
  const b1Offset = c.beats[1].start - c.start + 0.45;
  c.at(b1Offset, () => s.add(logitEq));
  c.onBeat(1, () => s.play(swapVis(vPeak, vLogit, 0.55)));
  playCue(s, c, 'dec-minp-relative-2', (d) => s.play(showDef.to(0.1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'dec-minp-default', (d) => s.play(showDef.to(1, { duration: d })), {
    after: false,
    offset: 0.5,
    dur: 0.45,
  });
  playCue(
    s,
    c,
    'dec-minp-hot',
    (d) => s.play(logitTemp.to(2.0, { duration: d }), showHot.to(1, { duration: d })),
    { after: false, offset: 0.3, dur: 0.75 },
  );

  c.hide(2, logitEq);
  c.onBeat(2, () => s.play(swapVis(vLogit, vUniform, 0.55)));
  playCue(s, c, 'dec-minp-relative-3', (d) => s.play(showUnifMin.to(0.1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'dec-minp-uniform', (d) => s.play(showUnifMin.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'dec-minp-top-p-six', (d) => s.play(showUnifTop.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
}
