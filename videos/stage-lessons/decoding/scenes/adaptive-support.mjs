// Scene 18: adaptive-support: "Which bars survive the cutoff?"
// Dual stacked probability bar landscapes on one shared scale: Peaked row (72%, 20%, 5%, 2%, 1%)
// vs Flatter row (40%, 20%, 15%, 11.5%, 3.5%, plus ten 1% tail bars). Contrasts fixed top-k = 3
// against adaptive top-p = 0.90 (2 vs 5 bars) and adaptive min-p = 0.10 (7.2% vs 4.0% floors -> 2 vs 4).
import { line } from 'vizmatic/stage';
import { COSMOS, glowDot, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ADAPTIVE_ROWS,
  ROLE,
  cinemaAtmosphere,
  decodeSupport,
  lumBar,
  pctTrim,
  playCue,
} from '../parts.mjs';

export default function adaptiveSupport(s, c) {
  const title = heroTitle(['Which bars survive', 'the cutoff?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.active,
  });

  const hiTail = s.value(0);
  const showK = s.value(0);
  const pMode = s.value(0);
  const showPeakP = s.value(0);
  const showFlatP = s.value(0);
  const minMode = s.value(0);
  const floorDraw = s.value(0);
  const showPeakMin = s.value(0);
  const showFlatMin = s.value(0);
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const inMin = minMode.value > 0.4;
    const inP = pMode.value > 0.4 && !inMin;
    const inK = showK.value > 0.4 && !inP && !inMin;
    const fl = floorDraw.value;

    // Mode pill top-right
    const modeLabel = inMin
      ? 'Min-p = 0.10  (relative floor)'
      : inP
        ? 'Top-p = 0.90  (cumulative mass)'
        : inK
          ? 'Top-k = 3  (fixed count)'
          : 'Aligned probability scale';
    const modeCol = inMin ? ROLE.winner : inP ? ROLE.valid : inK ? ROLE.base : ROLE.active;
    nodes.push(
      txt(modeLabel, 845, -395, 32, modeCol, 'mono', 'right').glow(6, modeCol).opacity(alpha),
    );

    const baseYs = [-35, 325];
    const barL = -595;
    const step = 92;
    const barW = 72;
    const scaleH = 290;

    ADAPTIVE_ROWS.forEach((row, r) => {
      const baseY = baseYs[r];
      const floor = 0.1 * row[0];
      const isPeak = r === 0;

      // Determine active filter result for this row (strictly honoring withholding cues)
      let rule = null;
      if (inMin) {
        if ((isPeak && showPeakMin.value > 0.4) || (!isPeak && showFlatMin.value > 0.4)) {
          rule = 'min';
        }
      } else if (inP) {
        if ((isPeak && showPeakP.value > 0.4) || (!isPeak && showFlatP.value > 0.4)) {
          rule = 'p';
        }
      } else if (inK) {
        rule = 'k';
      }

      const thresh = rule === 'k' ? 3 : rule === 'p' ? 0.9 : 0.1;
      const res = rule ? decodeSupport(row, rule, thresh) : null;

      // Row heading & baseline
      nodes.push(
        txt(
          isPeak ? 'Peaked row' : 'Flatter row',
          -845,
          baseY - 175,
          32,
          COSMOS.ink,
          'serif',
          'left',
        ).opacity(alpha),
        line([barL - 16, baseY], [barL + row.length * step, baseY], {
          stroke: '#4c6294',
          width: 2.2,
        }).opacity(alpha),
      );

      // Bars
      row.forEach((p, i) => {
        const cx = barL + i * step + barW / 2;
        const h = Math.max(8, p * scaleH);
        const kept = res ? res.ids.includes(i) : false;
        const isTail = !isPeak && i >= 5;
        const col = res
          ? kept
            ? inMin
              ? ROLE.winner
              : inP
                ? ROLE.valid
                : ROLE.active
            : COSMOS.dim
          : isTail && hiTail.value > 0.3
            ? ROLE.heat
            : ROLE.base;
        const bAlpha = res && !kept ? 0.32 * alpha : alpha;

        nodes.push(
          lumBar(cx, baseY - h / 2, barW, h, {
            color: col,
            fillOpacity: kept ? 0.56 : 0.3,
            strokeWidth: kept ? 2.6 : 1.6,
            glow: kept ? 10 : isTail && hiTail.value > 0.3 ? 8 : 4,
            radius: 5,
            opacity: bAlpha,
          }),
        );

        if (i < 5) {
          nodes.push(
            txt(
              pctTrim(p, 1),
              cx,
              baseY + 34,
              26,
              res && !kept ? COSMOS.dim : COSMOS.ink,
              'mono',
              'center',
            ).opacity(alpha),
          );
        }
      });

      // Tail bracket for the 10 × 1% bars in the flatter row
      if (!isPeak) {
        const tL = barL + 5 * step;
        const tR = barL + 15 * step - 20;
        nodes.push(
          line([tL, baseY + 24], [tR, baseY + 24], {
            stroke: hiTail.value > 0.3 ? ROLE.heat : COSMOS.dim,
            width: 2.4,
          }).opacity(alpha),
          txt(
            '10 rare tokens at 1% each',
            (tL + tR) / 2,
            baseY + 58,
            26,
            hiTail.value > 0.3 ? ROLE.heat : COSMOS.muted,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }

      // Glowing horizontal min-p floor beam
      if (inMin && fl > 0.04) {
        const fy = baseY - floor * scaleH;
        const fEnd = barL - 12 + (row.length * step + 18) * fl;
        nodes.push(
          line([barL - 12, fy], [fEnd, fy], { stroke: ROLE.winner, width: 3.6, dash: [8, 5] })
            .glow(10, ROLE.winner)
            .opacity(alpha),
          glowDot(fEnd, fy, { radius: 6, color: ROLE.winner, glow: 12, opacity: alpha }),
          txt(`${pctTrim(floor, 1)} floor`, barL - 28, fy, 26, ROLE.winner, 'mono', 'right')
            .glow(6, ROLE.winner)
            .opacity(fl * alpha),
        );
      }

      // Right-hand survivor count callout
      if (res) {
        const method = rule === 'k' ? 'Top-k 3' : rule === 'p' ? 'Top-p 90%' : 'Min-p 0.1';
        const summary =
          rule === 'p'
            ? `${method} -> ${res.ids.length} bars (${pctTrim(res.mass, 0)})`
            : `${method} -> ${res.ids.length} bars`;
        const sumCol = rule === 'min' ? ROLE.winner : rule === 'p' ? ROLE.valid : ROLE.active;
        nodes.push(
          txt(summary, 845, baseY - 175, 32, sumCol, 'mono', 'right')
            .glow(6, sumCol)
            .opacity(alpha),
        );
      }
    });

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.winner), title, mainLayer);

  playCue(s, c, 'dec-adaptive-support-1', (d) => s.play(hiTail.to(1, { duration: d })), {
    dur: 0.7,
  });
  playCue(s, c, 'dec-adaptive-k-three', (d) => s.play(showK.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'dec-adaptive-support-2', (d) => s.play(pMode.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'dec-adaptive-peak', (d) => s.play(showPeakP.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'dec-adaptive-flat', (d) => s.play(showFlatP.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  playCue(s, c, 'dec-adaptive-support-3', (d) => s.play(minMode.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'dec-adaptive-floors', (d) => s.play(floorDraw.to(1, { duration: d })), {
    dur: 0.85,
  });
  playCue(s, c, 'dec-adaptive-minp', (d) => s.play(showPeakMin.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'dec-adaptive-minp-flat', (d) => s.play(showFlatMin.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
}
