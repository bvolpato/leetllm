// Scene 32: transfer: "Try one change at a time"
// View 1 (Beats 0-1): All 5 two-word dog products on one luminous probability ruler. Beat 0 proposes
//   splitting slept 50/50 (withholding result); Beat 1 smoothly shifts slept soundly 0.36 -> 0.20 and
//   slept outside 0.04 -> 0.20 so Beam 1 and Beam 2 both return "ran home" (0.210).
// View 2 (Beats 2-3): 5-word dog strip with top-p marker moving 0.70 -> 0.90, strictly withholding
//   "barked" (0.95 cumulative) until AFTER transfer-crossing.
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  BASE,
  ROLE,
  WORDS,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playCue,
  probStrip,
  swapVis,
  transferExperiment,
} from '../parts.mjs';

export default function transfer(s, c) {
  const title = heroTitle(['Try one change', 'at a time'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.active,
  });

  const vRuler = s.value(1);
  const vStrip = s.value(0);

  const proposed = s.value(0);
  const edgeShift = s.value(0); // 0 -> 1 moves slept split 0.9/0.1 -> 0.5/0.5
  const askThresh = s.value(0);
  const threshMove = s.value(0); // 0 -> 1 moves top-p 0.70 -> 0.90
  const crossDone = s.value(0);

  // VIEW 1: 5 two-word paths on one shared probability ruler
  const rulerLayer = guardedDynamic(vRuler, (alpha) => {
    const nodes = [];
    const exp = transferExperiment(1, 0, {
      'transfer-edge-change': { progress: edgeShift.value },
      'transfer-nucleus-experiment': { progress: 0 },
    });
    const isShifted = edgeShift.value >= 0.98;
    const isProp = proposed.value > 0.4;

    nodes.push(
      txt(
        isProp && !isShifted
          ? 'Proposal: split slept 0.50 / 0.50 (keep ran unchanged)'
          : 'First word: ran (0.60)  vs  slept (0.40)',
        -845,
        -255,
        30,
        isProp ? ROLE.winner : COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha),
      txt('Two-word probability', 480, -255, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );

    const barL = 135;
    const barMaxW = 660;
    exp.paths.forEach((row, i) => {
      const y = -155 + i * 96;
      const isRan = row.prefix === 'ran';
      const isBest = isShifted && row.text === exp.best.text;
      const col = isBest ? ROLE.winner : isRan ? ROLE.base : ROLE.valid;
      const w = Math.max(10, (row.score / 0.4) * barMaxW);

      nodes.push(
        txt(row.text, -845, y, 32, col, 'serif', 'left').opacity(alpha),
        txt(
          `${fmt(row.first, 2)} × ${fmt(row.conditional, 2)} = ${fmt(row.score, 3)}`,
          -455,
          y,
          30,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(alpha),
        lumBar(barL + barMaxW / 2, y, barMaxW, 42, {
          color: '#2b395e',
          fillOpacity: 0.14,
          strokeWidth: 1.4,
          glow: 2,
          radius: 7,
          opacity: alpha,
        }),
        lumBar(barL + w / 2, y, w, 36, {
          color: col,
          fillOpacity: isBest ? 0.6 : 0.4,
          strokeWidth: isBest ? 3 : 2,
          glow: isBest ? 12 : 7,
          radius: 6,
          opacity: alpha,
        }),
      );
    });

    if (isShifted) {
      nodes.push(
        txt(
          `Beam 1 -> ${exp.beam1.text} (${fmt(exp.beam1.score, 3)})   |   Beam 2 -> ${exp.best.text} (${fmt(exp.best.score, 3)})`,
          0,
          345,
          32,
          ROLE.winner,
          'mono',
          'center',
        )
          .glow(7, ROLE.winner)
          .opacity(alpha),
        txt(
          'Both widths now return the exact same text; measure task quality vs latency.',
          0,
          408,
          26,
          COSMOS.muted,
          'serif',
          'center',
        ).opacity(alpha),
      );
    } else {
      nodes.push(
        txt(
          isProp
            ? 'Would keeping slept still improve the best two-word score?'
            : 'Width 1 expands ran; Width 2 also expands slept.',
          0,
          365,
          34,
          isProp ? ROLE.winner : COSMOS.muted,
          'serif',
          'center',
        ).opacity(alpha),
      );
    }
    return nodes;
  });

  // VIEW 2: 5-word sampling strip with top-p moving 0.70 -> 0.90
  const stripLayer = guardedDynamic(vStrip, (alpha) => {
    const nodes = [];
    const th = 0.7 + 0.2 * threshMove.value;
    const exp = transferExperiment(1, 0, {
      'transfer-edge-change': { progress: 1 },
      'transfer-nucleus-experiment': { progress: threshMove.value },
    });
    const settled = crossDone.value > 0.4;
    const ask = askThresh.value > 0.4;
    const keptNow = settled ? exp.ids : threshMove.value < 0.08 ? [0, 1] : null;
    const lastId = exp.ids.at(-1);

    nodes.push(
      txt('Next word after "The dog"', -760, -245, 36, COSMOS.ink, 'serif', 'left').opacity(alpha),
      txt(`Top-p = ${fmt(th, 2)}`, 760, -245, 36, ROLE.winner, 'mono', 'right')
        .glow(7, ROLE.winner)
        .opacity(alpha),
      probStrip({
        left: -760,
        y: 25,
        width: 1520,
        height: 80,
        values: BASE,
        names: WORDS,
        kept: keptNow,
        markerU: th,
        markerLabel: `Top-p ${fmt(th, 2)}`,
        markerColor: ROLE.winner,
        labelOffsetY: 116,
        pctOffsetY: 156,
        opacity: alpha,
      }),
      txt(
        settled
          ? `Keep through "${WORDS[lastId]}"  (cumulative mass = ${fmt(exp.cumulative[lastId], 2)} -> divide by 0.95)`
          : ask
            ? 'Raise top-p from 0.70 to 0.90. Which word crosses the mark?'
            : 'At 0.70, ran + slept reach the mark exactly (0.45 + 0.25 = 0.70).',
        0,
        355,
        32,
        settled ? ROLE.valid : ROLE.winner,
        'serif',
        'center',
      )
        .glow(settled ? 7 : 0, ROLE.valid)
        .opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.valid), title, rulerLayer, stripLayer);

  playCue(s, c, 'transfer-proposal', (d) => s.play(proposed.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'transfer-edge-change', (d) => s.play(edgeShift.to(1, { duration: d })), {
    dur: 1.05,
  });

  c.onBeat(2, () => s.play(swapVis(vRuler, vStrip, 0.55)));
  playCue(s, c, 'transfer-threshold-question', (d) => s.play(askThresh.to(1, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'transfer-nucleus-experiment', (d) => s.play(threshMove.to(1, { duration: d })), {
    dur: 0.95,
  });
  playCue(s, c, 'transfer-crossing', (d) => s.play(crossDone.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
}
