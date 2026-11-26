// Scene 13: temperature-tail: "How much goes to the rare words?"
// 12-token status row rescaled at T = 1.0 -> 0.30 -> 1.50 alongside 8 individual glowing tail
// cells, proving tail mass jumps from 8% to 21.07% (revealed AFTER dec-tail-total) vs the
// wrong merged-first 12.02% bucket (revealed AFTER dec-tail-wrong), plus 12-token entropy.
import { line } from 'vizmatic/stage';
import { COSMOS, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ROLE,
  STATUS_IDS,
  STATUS_ROW,
  cinemaAtmosphere,
  decodeSoftmax,
  fmt,
  lumBar,
  playCue,
  shannonEntropyBits,
} from '../parts.mjs';

export default function temperatureTail(s, c) {
  const title = heroTitle(['How much goes to', 'the rare words?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.heat,
  });

  const baseLogits = STATUS_ROW.map(Math.log);
  const groupedFirst = [...STATUS_ROW.slice(0, 4), STATUS_ROW.slice(4).reduce((a, b) => a + b, 0)];
  const fmtP = (p) => `${(p * 100).toFixed(p < 0.001 ? 3 : 1)}%`;

  const tempVal = s.value(1.0); // 1.0 -> 0.3 -> 1.5
  const hiTail = s.value(0);
  const inHeatPhase = s.value(0);
  const showTotal = s.value(0);
  const showCompare = s.value(0);
  const showWrong = s.value(0);
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const T = Math.max(0.28, Math.min(1.6, tempVal.value));
    const row = decodeSoftmax(baseLogits, T);
    const tailSum = row.slice(4).reduce((a, b) => a + b, 0);
    const pooled = showTotal.value > 0.4;
    const compare = showCompare.value > 0.4;
    const wrongDone = showWrong.value > 0.4;
    const hideSumNow = inHeatPhase.value > 0.4 && !pooled && !compare;

    // Temperature badge top-right
    const tCol = T < 0.7 ? ROLE.active : T > 1.2 ? ROLE.heat : ROLE.base;
    nodes.push(
      txt(`T = ${fmt(T, 2)}`, 845, -400, 44, tCol, 'mono', 'right')
        .glow(9, tCol)
        .opacity(alpha),
    );

    // Left: 5 grouped display bars (4 named + 8-token tail)
    const names = [...STATUS_IDS.slice(0, 4), '8 rare IDs'];
    const barL = -595;
    const barMaxW = 540;
    const vals = [...row.slice(0, 4), tailSum];

    vals.forEach((p, i) => {
      const y = -200 + i * 106;
      const isTail = i === 4;
      const col = isTail ? ROLE.heat : i === 0 ? ROLE.base : ROLE.active;
      const canShow = !isTail || !hideSumNow;
      const w = Math.max(8, (p / 0.85) * barMaxW);

      nodes.push(
        txt(names[i], barL - 24, y, 30, col, 'mono', 'right').opacity(alpha),
        lumBar(barL + barMaxW / 2, y, barMaxW, 44, {
          color: '#2b395e',
          fillOpacity: 0.14,
          strokeWidth: 1.5,
          glow: 2,
          radius: 7,
          opacity: alpha,
        }),
      );
      if (canShow) {
        nodes.push(
          lumBar(barL + w / 2, y, w, 38, {
            color: col,
            fillOpacity: isTail ? 0.54 : 0.42,
            strokeWidth: isTail ? 2.8 : 2.2,
            glow: isTail ? 11 : 7,
            radius: 6,
            opacity: alpha,
          }),
        );
        // Subdivide the combined 8-tail bar into 8 visible ticks when wide enough
        if (isTail && w >= 48) {
          for (let k = 1; k < 8; k++) {
            const sx = barL + (w * k) / 8;
            nodes.push(
              line([sx, y - 19], [sx, y + 19], { stroke: COSMOS.bg, width: 2.5 }).opacity(alpha),
            );
          }
        }
      }
      nodes.push(
        txt(
          canShow ? fmtP(p) : 'sum ?',
          barL + barMaxW + 24,
          y,
          30,
          isTail ? ROLE.winner : COSMOS.ink,
          'mono',
          'left',
        ).opacity(alpha),
      );
    });

    // Right panel: either the 8 individual tail IDs (Beats 0-1) or the wrong-grouping comparison (Beat 2)
    if (!compare) {
      nodes.push(
        txt(
          '8 individual tail IDs (scaled separately)',
          485,
          -245,
          28,
          ROLE.heat,
          'mono',
          'center',
        ).opacity(alpha),
      );
      row.slice(4).forEach((p, idx) => {
        const cx = 245 + (idx % 4) * 165;
        const cy = -125 + Math.floor(idx / 4) * 155;
        const glowAmt = 6 + 6 * hiTail.value;
        nodes.push(
          lumBar(cx, cy, 144, 118, {
            color: ROLE.heat,
            fillOpacity: 0.18 + 0.14 * hiTail.value,
            strokeWidth: 2.2,
            glow: glowAmt,
            radius: 10,
            opacity: alpha,
          }),
          txt(`ID ${idx + 4}`, cx, cy - 26, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          txt(fmtP(p), cx, cy + 24, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
        );
      });

      nodes.push(
        txt(
          pooled
            ? `8 × ${fmtP(row[4])} = ${fmtP(tailSum)}  (beats "on"!)`
            : 'Raise each of 12 tokens to 1/T, then normalize.',
          485,
          200,
          30,
          pooled ? ROLE.winner : ROLE.active,
          'mono',
          'center',
        )
          .glow(pooled ? 7 : 0, ROLE.winner)
          .opacity(alpha),
      );
    } else {
      const wrong = decodeSoftmax(groupedFirst.map(Math.log), 1.5).at(-1);
      nodes.push(
        txt(
          'Scale first vs group first (at T = 1.50)',
          485,
          -245,
          28,
          ROLE.winner,
          'mono',
          'center',
        ).opacity(alpha),
        lumBar(485, -105, 620, 108, {
          color: ROLE.active,
          fillOpacity: 0.24,
          strokeWidth: 2.6,
          glow: 10,
          radius: 12,
          opacity: alpha,
        }),
        txt(`Actual 8-token tail: ${fmtP(tailSum)}`, 485, -105, 34, ROLE.active, 'mono', 'center')
          .glow(7, ROLE.active)
          .opacity(alpha),
        lumBar(485, 65, 620, 108, {
          color: wrongDone ? ROLE.pruned : COSMOS.dim,
          fillOpacity: wrongDone ? 0.22 : 0.08,
          strokeWidth: 2.4,
          glow: wrongDone ? 9 : 2,
          radius: 12,
          opacity: alpha,
        }),
        txt(
          wrongDone ? `Wrong merged 8% bucket: ${fmtP(wrong)}` : 'Merged 8% bucket -> ?',
          485,
          65,
          32,
          wrongDone ? ROLE.pruned : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          'Grouping first erases 7 of the 8 draws.',
          485,
          195,
          28,
          COSMOS.muted,
          'serif',
          'center',
        ).opacity(alpha),
      );
    }

    // Bottom 12-token entropy strip
    const entY = 385;
    const entItems = [
      { t: 0.3, x: -500, col: ROLE.active },
      { t: 1.0, x: 0, col: ROLE.base },
      { t: 1.5, x: 500, col: ROLE.heat },
    ];
    entItems.forEach((item) => {
      const h = shannonEntropyBits(decodeSoftmax(baseLogits, item.t));
      nodes.push(
        txt(
          `T = ${item.t}  ->  H = ${fmt(h, 2)} bits`,
          item.x,
          entY,
          28,
          item.col,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    return nodes;
  });

  const powEq = glowTex('w_i \\propto p_i^{1/T}', {
    x: 420,
    y: -400,
    size: 38,
    color: ROLE.active,
  });

  s.add(cinemaAtmosphere(ROLE.heat, ROLE.active), title, powEq, mainLayer);

  playCue(s, c, 'dec-tail-inputs', (d) => s.play(hiTail.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'dec-tail-cold', (d) => s.play(tempVal.to(0.3, { duration: d })), { dur: 0.9 });
  playCue(
    s,
    c,
    'dec-tail-hot',
    (d) =>
      s.play(inHeatPhase.to(1, { duration: Math.min(0.25, d) }), tempVal.to(1.5, { duration: d })),
    { dur: 1.0 },
  );
  playCue(s, c, 'dec-tail-total', (d) => s.play(showTotal.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  c.onBeat(2, () => s.play(showCompare.to(1, { duration: 0.5 })));
  playCue(s, c, 'dec-tail-wrong', (d) => s.play(showWrong.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
}
