// Scene 11: temperature: "Where does the same draw land?"
// Signature orbiting 3D probability-vs-temperature surface (cinematic3d + parametricSurface
// + orbitScene) + MathJax softmax-with-T equation paired with the 5-word probability strip
// ("ran, slept, played, barked, waited") and a fixed u = 0.40 golden draw needle.
// Strict withholding: "ran" appears AFTER temperature-first, "slept" AFTER temperature-second.
import {
  COSMOS,
  glowTex,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
} from '../../cinematic-kit.mjs';
import {
  BASE,
  ROLE,
  WORDS,
  buildTempLandscape3d,
  cinemaAtmosphere,
  decodeSoftmax,
  fmt,
  playCue,
  probStrip,
} from '../parts.mjs';

export default function temperature(s, c) {
  const title = heroTitle(['Where does the', 'same draw land?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.heat,
  });

  const tempVal = s.value(1.0); // 1.0 -> 0.5 -> 2.0
  const markerVis = s.value(0);
  const firstAns = s.value(0);
  const warmPhase = s.value(0);
  const secondAns = s.value(0);
  const stageVis = s.value(1);

  const baseLogits = BASE.map(Math.log);
  const drawU = 0.4;

  // Upper-right orbiting 3D temperature landscape
  const view3d = buildTempLandscape3d({
    x: 490,
    y: -195,
    unit: 62,
    activeTempVal: tempVal,
  });

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const T = Math.max(0.45, Math.min(2.1, tempVal.value));
    const row = decodeSoftmax(baseLogits, T);
    const hasMark = markerVis.value > 0.35;
    const isWarm = warmPhase.value > 0.4;
    const revealHere = isWarm ? secondAns.value > 0.4 : firstAns.value > 0.4;

    let cum = 0;
    const winIdx = row.findIndex((p) => {
      cum += p;
      return cum > drawU;
    });
    const winWord = WORDS[Math.max(0, winIdx)];

    // Upper-left live readout: sentence + temperature meter
    nodes.push(
      txt(
        revealHere ? `The dog ${winWord}` : 'The dog ___',
        -845,
        -245,
        54,
        revealHere ? ROLE.winner : COSMOS.ink,
        'serif',
        'left',
      )
        .glow(revealHere ? 8 : 0, ROLE.winner)
        .opacity(alpha),
      txt(
        `T = ${fmt(T, 2)}`,
        -845,
        -155,
        42,
        T < 0.8 ? ROLE.active : T > 1.3 ? ROLE.heat : ROLE.base,
        'mono',
        'left',
      )
        .glow(8, T < 0.8 ? ROLE.active : T > 1.3 ? ROLE.heat : ROLE.base)
        .opacity(alpha),
      txt(
        '3D P_T(w) landscape (T = 0.4..2.2)',
        490,
        -395,
        26,
        ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Lower full-bleed 5-word probability strip with fixed u = 0.40 needle
    nodes.push(
      probStrip({
        left: -760,
        y: 120,
        width: 1520,
        height: 76,
        values: row,
        names: WORDS,
        kept: revealHere ? [winIdx] : null,
        markerU: hasMark ? drawU : null,
        markerLabel: hasMark ? 'Draw u = 0.40' : '',
        markerColor: ROLE.winner,
        labelOffsetY: 112,
        pctOffsetY: 152,
        opacity: alpha,
      }),
    );

    // Bottom bounds / prompt caption
    const ranEnd = row[0];
    const sleptEnd = row[0] + row[1];
    let caption = 'Five next-word shares spanning [0, 1].';
    let capCol = COSMOS.muted;
    if (revealHere) {
      caption = isWarm
        ? `At T = 2.00, ran ends at ${fmt(ranEnd, 3)} <= 0.40 < ${fmt(sleptEnd, 3)} -> "slept" wins`
        : `At T = ${fmt(T, 2)}, ran covers [0, ${fmt(ranEnd, 3)}) -> "ran" contains 0.40`;
      capCol = ROLE.winner;
    } else if (hasMark) {
      caption = isWarm
        ? 'Same draw u = 0.40, warmed to T = 2.00. Which word contains 0.40 now?'
        : 'Draw fixed at u = 0.40. At T = 1.00, which word contains it?';
      capCol = ROLE.active;
    }

    nodes.push(
      txt(caption, 0, 395, 32, capCol, 'serif', 'center')
        .glow(revealHere ? 6 : 0, capCol)
        .opacity(alpha),
    );

    return nodes;
  });

  const tempEq = glowTex('P_T(w_i) = \\frac{\\exp(z_i / T)}{\\sum_j \\exp(z_j / T)}', {
    x: -320,
    y: -155,
    size: 36,
    color: ROLE.winner,
  });

  s.add(cinemaAtmosphere(ROLE.heat, ROLE.active), title, view3d, mainLayer, tempEq);

  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.22, phi: 0.94, distance: 14.8 },
    { startOffset: 0.2, endMargin: 0.65 },
  );

  // Beat 0: drop marker at 0.40 (withhold answer)
  playCue(s, c, 'temperature-marker', (d) => s.play(markerVis.to(1, { duration: d })), {
    dur: 0.65,
  });

  // Beat 1: reveal "ran" AFTER temperature-first, then cool T -> 0.50
  playCue(s, c, 'temperature-first', (d) => s.play(firstAns.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'temperature-cool', (d) => s.play(tempVal.to(0.5, { duration: d })), { dur: 1.0 });

  // Beat 2: warm T -> 2.00 (withhold "slept"!)
  playCue(
    s,
    c,
    'temperature-warm',
    (d) =>
      s.play(warmPhase.to(1, { duration: Math.min(0.25, d) }), tempVal.to(2.0, { duration: d })),
    { dur: 1.1 },
  );

  // Beat 3: reveal "slept" AFTER temperature-second
  playCue(s, c, 'temperature-second', (d) => s.play(secondAns.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
}
