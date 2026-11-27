// Scene 13: precision: "Where did the numbers first change?"
// 2-act swapVis mixed-precision microscope:
//   Act 1 (Beat 0): [300, -300] squaring in FP16 hits the 65,504 ceiling -> inf vs upcasting
//     to FP32 first -> 90,000 -> RMS = 300.
//   Act 2 (Beats 1-2): Zoomed FP16 quantization grid near 10,000 (ticks 9992, 10000, 10008).
//     Strictly withholds snapping until AFTER store-half, and [0,0,0,0] until AFTER rounded-reference!
import { arrow, line } from 'vizmatic/stage';
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
  glowRing,
  ln,
  lumBar,
  playBeat,
  playCue,
  swapVis,
} from '../parts.mjs';

export default function precision(s, c) {
  const original = [10000, 10001, 9999, 10002];
  const stored = [10000, 10000, 10000, 10000];
  const origLN = ln(original); // [-0.447, 0.447, -1.342, 1.342]
  const halfMax = 65504;

  const title = heroTitle(['Where did the numbers', 'first change?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.alert,
  });

  const act1Vis = s.value(1);
  const act2Vis = s.value(0);

  // Act 1
  const narrowDone = s.value(0); // overflows on narrow-square
  const wideSqDone = s.value(0); // fits in FP32 on wide-square
  const wideRmsDone = s.value(0); // returns 300 on wide-rms

  // Act 2
  const snapT = s.value(0); // 0 -> 1 snaps all 4 onto 10000 strictly AFTER store-half!
  const refReveal = s.value(0); // 0 -> 1 reveals [0,0,0,0] strictly AFTER rounded-reference!

  // ACT 1: FP16 squaring overflow vs FP32 upcast before squaring
  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const nd = narrowDone.value;
    const ws = wideSqDone.value;
    const wr = wideRmsDone.value;

    nodes.push(
      txt('Stored FP16 input:  [ 300,  -300 ]', 0, -245, 36, COSMOS.ink, 'mono', 'center').opacity(
        alpha,
      ),
      txt(
        `FP16 finite ceiling = ${halfMax.toLocaleString('en-US')}`,
        835,
        -395,
        28,
        ROLE.alert,
        'mono',
        'right',
      )
        .glow(6, ROLE.alert)
        .opacity(alpha),
    );

    const rows = [
      {
        label: 'Square in FP16, then cast',
        tag: 'FP16 x²',
        y: -65,
        col: ROLE.alert,
        sqReady: nd,
        rmsReady: nd,
        sqVal: '∞  (90,000 > 65,504)',
        rmsVal: '∞',
      },
      {
        label: 'Cast to FP32, then square',
        tag: 'FP32 x²',
        y: 145,
        col: ROLE.norm,
        sqReady: ws,
        rmsReady: wr,
        sqVal: '90,000',
        rmsVal: '300.0',
      },
    ];

    rows.forEach((row) => {
      const y = row.y;
      nodes.push(
        txt(row.label, -835, y, 32, row.col, 'sans', 'left')
          .glow(row.sqReady > 0.3 ? 6 : 0, row.col)
          .opacity(alpha),
        txt(row.tag, -10, y - 64, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        lumBar(-10, y, 380, 82, {
          color: row.sqReady > 0.3 ? row.col : COSMOS.dim,
          fillOpacity: row.sqReady > 0.3 ? 0.28 : 0.1,
          strokeWidth: row.sqReady > 0.3 ? 2.8 : 1.8,
          glow: row.sqReady > 0.3 ? 11 : 3,
          opacity: alpha,
        }),
        txt(
          row.sqReady > 0.3 ? row.sqVal : '?',
          -10,
          y,
          row.sqVal.length > 8 && row.sqReady > 0.3 ? 28 : 38,
          row.sqReady > 0.3 ? COSMOS.ink : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
        arrow([205, y], [385, y], {
          stroke: row.rmsReady > 0.3 ? row.col : '#566b9e',
          width: 3.6,
          tip: 13,
        }).opacity(alpha),
        txt('RMS', 585, y - 64, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        lumBar(585, y, 310, 82, {
          color: row.rmsReady > 0.3 ? row.col : COSMOS.dim,
          fillOpacity: row.rmsReady > 0.3 ? 0.34 : 0.1,
          strokeWidth: row.rmsReady > 0.3 ? 3 : 1.8,
          glow: row.rmsReady > 0.3 ? 12 : 3,
          opacity: alpha,
        }),
        txt(
          row.rmsReady > 0.3 ? row.rmsVal : '?',
          585,
          y,
          44,
          row.rmsReady > 0.3 ? COSMOS.ink : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    nodes.push(
      txt(
        'Always upcast FP16 inputs to FP32 before squaring inside norm reductions',
        0,
        375,
        30,
        ROLE.gold,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // ACT 2: FP16 storage rounding near 10,000 (ticks 9992, 10000, 10008)
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const snap = snapT.value;
    const refR = refReveal.value;

    const toX = (v) => 170 + (v - 10000) * 68; // 9992 -> -374, 10000 -> +170, 10008 -> +714
    const ticks = [9992, 10000, 10008];
    const fCols = [ROLE.write, ROLE.gold, ROLE.rms, ROLE.norm];

    nodes.push(
      txt('Source', -690, -255, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(
        'FP16 representable ticks near 10,000  (spacing = 8)',
        170,
        -255,
        30,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // 3 tall glowing FP16 tick walls
    ticks.forEach((tick) => {
      const tx = toX(tick);
      const isCenter = tick === 10000;
      nodes.push(
        glowingTrail(
          [
            [tx, -175],
            [tx, 165],
          ],
          {
            color: isCenter && snap > 0.3 ? ROLE.gold : '#5c73ab',
            width: isCenter && snap > 0.3 ? 4.2 : 2.6,
            glow: isCenter && snap > 0.3 ? 12 : 4,
            core: false,
            opacity: alpha,
          },
        ),
        txt(
          String(tick),
          tx,
          -202,
          30,
          isCenter && snap > 0.3 ? ROLE.gold : COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    // 4 feature tracks snapping onto 10000 strictly AFTER store-half!
    original.forEach((val, i) => {
      const ry = -120 + i * 82;
      const col = fCols[i];
      const curVal = val + snap * (stored[i] - val);
      const origX = toX(val);
      const curX = toX(curVal);

      nodes.push(
        txt(`f${i + 1}`, -815, ry, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
        txt(String(val), -690, ry, 34, col, 'mono', 'center').opacity(alpha),
        line([toX(9992), ry], [toX(10008), ry], { stroke: '#253356', width: 1.8 }).opacity(alpha),
      );
      if (snap > 0.03 && val !== stored[i]) {
        nodes.push(
          glowRing(origX, ry, 9, col, {
            width: 2,
            glow: 4,
            fillOpacity: 0.1,
            opacity: 0.65 * alpha,
          }),
          glowingTrail(
            [
              [origX, ry],
              [curX, ry],
            ],
            { color: col, width: 3.6, glow: 8, opacity: alpha },
          ),
        );
      }
      nodes.push(
        glowDot(curX, ry, {
          radius: 10,
          color: col,
          glow: 13,
          opacity: alpha,
        }),
      );
    });

    // Bottom prediction prompt -> wide-reference comparison (strictly withheld!)
    if (snap < 0.05) {
      nodes.push(
        txt(
          'If stored in FP16, which tick takes each feature?',
          0,
          315,
          38,
          ROLE.gold,
          'serif',
          'center',
        )
          .glow(8, ROLE.gold)
          .opacity(alpha),
      );
    } else {
      nodes.push(
        txt(
          'Wide FP32 LayerNorm on original:',
          -830,
          275,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(alpha),
        txt(
          `[${origLN.map((v) => fmt(v, 3)).join(', ')}]`,
          -200,
          275,
          30,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(alpha),
        txt('Wide FP32 LayerNorm on stored:', -830, 355, 28, ROLE.norm, 'mono', 'left').opacity(
          alpha,
        ),
        txt(
          refR > 0.3
            ? '[0.000, 0.000, 0.000, 0.000]   (storage erased differences!)'
            : 'LN([10000, 10000, 10000, 10000]) = ?',
          -200,
          355,
          30,
          refR > 0.3 ? ROLE.norm : ROLE.gold,
          'mono',
          'left',
        )
          .glow(refR > 0.3 ? 7 : 0, ROLE.norm)
          .opacity(alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.alert, ROLE.norm), title, act1Layer, act2Layer);

  // Beat 0: Overflow in FP16 vs safe cast-then-square in FP32
  playCue(s, c, 'narrow-square', (d) => s.play(narrowDone.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'wide-square', (d) => s.play(wideSqDone.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'wide-rms', (d) => s.play(wideRmsDone.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });

  // Beat 1: Swap cleanly to FP16 quantization grid near 10,000 (withholds snapping!)
  playBeat(s, c, 1, (d) => s.play(swapVis(act1Vis, act2Vis, d)), { dur: 0.6 });

  // Beat 2: Strictly AFTER store-half snap all 4 onto 10000; AFTER rounded-reference reveal zeros
  playCue(s, c, 'store-half', (d) => s.play(snapT.to(1, { duration: d })), {
    after: true,
    dur: 0.65,
  });
  playCue(s, c, 'rounded-reference', (d) => s.play(refReveal.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
}
