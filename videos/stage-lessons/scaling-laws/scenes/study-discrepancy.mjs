// Scene 11: study-discrepancy: "What makes a fair comparison between runs?"
// Act 1 (Beat 0): Three glowing 10x10 exponent proportion grids for Hoffmann's three methods
//   (0.50/0.50, 0.49/0.51, 0.46/0.54 across >400 runs, 70M-16B).
// Act 2 (Beats 1-2): Vertical shift invariance of fixed-compute loss curves: lowering loss
//   uniformly by 0.30 preserves the optimal model size N*!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playCue,
  plotPlane,
  sampleCurve,
  scenePulse,
  swapVis,
} from '../parts.mjs';

const METHODS = [
  { name: 'Lower envelope', a: 0.5, b: 0.5 },
  { name: 'IsoFLOP minima', a: 0.49, b: 0.51 },
  { name: 'Surface fit', a: 0.46, b: 0.54 },
];

export default function studyDiscrepancy(s, c) {
  const title = heroTitle(['What makes a fair', 'comparison between runs?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.tokens,
  });

  const act1Vis = s.value(1);
  const act2Vis = s.value(0);
  const gridFill = s.value(0); // sl-study-discrepancy-0
  const shiftT = s.value(0); // sl-study-discrepancy-2: lowers whole loss curve by 0.30
  const beat2Mode = s.value(0);
  const pulse = s.value(0);

  // Act 1: Three 10x10 glowing exponent proportion mosaics
  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const filled = Math.round(gridFill.value * 100);

    nodes.push(
      txt(
        'Hoffmann et al. (>400 models, 70M to 16B)  ·  blue = N growth, cyan = D growth',
        -840,
        -255,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
    );

    METHODS.forEach((m, idx) => {
      const cx = -560 + idx * 560;
      const cell = 27;
      const startX = cx - 4.5 * cell;
      const startY = -145;
      const splitCount = Math.round(m.a * 100);

      nodes.push(txt(m.name, cx, -200, 32, COSMOS.ink, 'sans', 'center').opacity(alpha));

      for (let j = 0; j < 100; j++) {
        const colIdx = j % 10;
        const rowIdx = Math.floor(j / 10);
        const isLit = j < filled;
        const col = j < splitCount ? ROLE.params : ROLE.tokens;
        nodes.push(
          lumBar(startX + colIdx * cell, startY + rowIdx * cell, cell - 4, cell - 4, {
            color: isLit ? col : COSMOS.dim,
            fillOpacity: isLit ? 0.5 : 0.08,
            strokeWidth: 1.2,
            glow: isLit ? 4 : 0,
            radius: 3,
            opacity: (isLit ? 1 : 0.45) * alpha,
          }),
        );
      }

      nodes.push(
        txt(`${fmt(m.a, 2)} / ${fmt(m.b, 2)}`, cx, 185, 42, ROLE.compute, 'mono', 'center')
          .glow(8, ROLE.compute)
          .opacity((0.25 + 0.75 * gridFill.value) * alpha),
      );
    });

    nodes.push(
      txt(
        'All three independent methods put ~half the growth into N and ~half into D',
        0,
        345,
        30,
        ROLE.optimal,
        'sans',
        'center',
      )
        .glow(6, ROLE.optimal)
        .opacity(alpha),
    );

    return nodes;
  });

  // Act 2: Matched cosine horizons + vertical shift invariance
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const sh = shiftT.value;
    const isShift = beat2Mode.value > 0.4;

    const plane = plotPlane({
      left: -680,
      right: 680,
      top: -175,
      bottom: 245,
      xDomain: [0, 4],
      yDomain: [1.6, 3.25],
      xTicks: [0, 1, 2, 3, 4],
      yTicks: [1.8, 2.2, 2.6, 3.0],
      xLabel: 'Model size N (fixed compute)',
      yLabel: 'Held-out loss',
      opacity: alpha,
    });
    nodes.push(plane.node);

    const baseFn = (x) => 2.18 + 0.19 * (x - 2) * (x - 2);
    const shiftedFn = (x) => baseFn(x) - 0.34 * sh;

    const oldPts = sampleCurve(plane, baseFn, 0.1, 3.9, 72);
    const newPts = sampleCurve(plane, shiftedFn, 0.1, 3.9, 72);

    const [optX, optYOld] = plane.toScreen(2, baseFn(2));
    const [, optYNew] = plane.toScreen(2, shiftedFn(2));

    nodes.push(
      // Vertical gold optimum line locked at N*
      line([optX, plane.bounds.top], [optX, plane.bounds.bottom], {
        stroke: ROLE.compute,
        width: 2.6,
      }).opacity(0.8 * alpha),
      glowingTrail(oldPts, {
        color: COSMOS.muted,
        width: 3.2,
        glow: 5,
        core: false,
        opacity: 0.6 * alpha,
      }),
      glowingTrail(newPts, { color: ROLE.tokens, width: 4.8, glow: 12, opacity: alpha }),
      glowDot(optX, optYOld, { radius: 7, color: COSMOS.muted, glow: 4, opacity: 0.7 * alpha }),
      glowDot(optX, optYNew, { radius: 11, color: ROLE.compute, glow: 16, opacity: alpha }),
      txt('Same optimal N*', optX, plane.bounds.top - 32, 28, ROLE.compute, 'mono', 'center')
        .glow(7, ROLE.compute)
        .opacity(alpha),
      txt(
        isShift
          ? 'A uniform vertical shift lowers loss without moving N*'
          : 'Compare finished runs at matched cosine horizons',
        0,
        -265,
        32,
        COSMOS.ink,
        'sans',
        'center',
      ).opacity(alpha),
      txt(
        isShift
          ? 'Porian et al.: tuned constant-LR runs also recovered near-balanced growth'
          : 'Porian et al.: count output head, scale LR, batch size, warmup & Adam β₂',
        0,
        375,
        28,
        ROLE.optimal,
        'sans',
        'center',
      )
        .glow(5, ROLE.optimal)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.params, ROLE.tokens), title, act1Layer, act2Layer);
  scenePulse(s, c, pulse);

  playCue(s, c, 'sl-study-discrepancy-0', (d) => s.play(gridFill.to(1, { duration: d })), {
    dur: 1.5,
  });
  playCue(
    s,
    c,
    'sl-study-discrepancy-1',
    (d) => s.play(swapVis(act1Vis, act2Vis, Math.min(0.65, d))),
    { dur: 0.7 },
  );
  playCue(
    s,
    c,
    'sl-study-discrepancy-2',
    (d) => s.play(beat2Mode.to(1, { duration: Math.min(0.3, d) }), shiftT.to(1, { duration: d })),
    { dur: 1.5 },
  );
}
