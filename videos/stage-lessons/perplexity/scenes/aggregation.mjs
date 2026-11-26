// Scene 8: aggregation: "How much should each window count?"
// Two window summary columns (2 targets @ 0.5 nats vs 8 targets @ 2.0 nats) physically
// expand into 10 individual target columns across a common floor. Strictly withholds
// 1.70 nats/target until AFTER aggregation-mean and PPL 5.47 until AFTER aggregation-ppl.
import { arrow } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  AGG_WINDOWS,
  ROLE,
  cinemaAtmosphere,
  corpusLoss,
  fmt,
  lumBar,
  playCue,
} from '../parts.mjs';

export default function aggregation(s, c) {
  const corpus = corpusLoss(AGG_WINDOWS); // sum=17, count=10, mean=1.7, ppl=5.474
  const naivePpl = AGG_WINDOWS.reduce((acc, w) => acc + Math.exp(w.loss), 0) / AGG_WINDOWS.length; // 4.52

  const title = heroTitle(['How much should', 'each window count?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.observed,
  });

  const showWin = s.value(0.2); // introduces window summaries
  const expandT = s.value(0); // 0 -> 1 shatters 2 window bars into 10 individual target columns
  const showMean = s.value(0); // AFTER aggregation-mean: 17/10 = 1.70
  const showPpl = s.value(0); // AFTER aggregation-ppl: PPL = 5.47 vs naive 4.52
  const showWorker = s.value(0); // worker telemetry (sum, count)
  const showEmpty = s.value(0); // zero targets -> no mean

  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const ex = expandT.value;
    const sm = showMean.value;
    const sp = showPpl.value;
    const sw = showWorker.value;
    const se = showEmpty.value;

    const floorY = 175;
    const pxPerNat = 135;

    // Top summary headers for Window A & Window B (transform into worker pairs on aggregation-worker!)
    const winXs = [-430, 430];
    const winCols = [ROLE.context, ROLE.warn];
    AGG_WINDOWS.forEach((w, i) => {
      const col = winCols[i];
      const subNats = w.count * w.loss;
      const topLabel =
        sw > 0.4
          ? `Worker ${i + 1} sends:  (${fmt(subNats, 0)} nats, ${w.count} targets)`
          : `${w.name}:  ${w.count} targets  ·  ${fmt(w.loss, 1)} nats each`;
      nodes.push(
        txt(topLabel, winXs[i], -225, 30, col, 'mono', 'center')
          .glow(6, col)
          .opacity((0.45 + 0.55 * showWin.value) * alpha),
      );
      if (sw > 0.4) {
        nodes.push(
          arrow([winXs[i], -192], [i === 0 ? -325 : 325, -152], {
            stroke: col,
            width: 3,
            tip: 12,
          }).opacity(sw * alpha),
        );
      }
    });

    if (sw > 0.4) {
      nodes.push(
        txt('Global sum: 17 nats / 10 targets', 0, -148, 28, ROLE.good, 'mono', 'center')
          .glow(6, ROLE.good)
          .opacity(sw * alpha),
      );
    }

    // Luminous baseline floor
    nodes.push(
      glowingTrail(
        [
          [-815, floorY],
          [815, floorY],
        ],
        { color: '#506496', width: 2.5, glow: 4, core: false, opacity: alpha },
      ),
    );

    // 10 target columns: clustered into 2 compact window blocks at ex=0, evenly spread at ex=1
    let idx = 0;
    AGG_WINDOWS.forEach((w, g) => {
      const col = winCols[g];
      const clusterW = 240;
      const sliceW = clusterW / w.count;
      const h = w.loss * pxPerNat;

      for (let k = 0; k < w.count; k++, idx++) {
        const homeX = winXs[g] - clusterW / 2 + (k + 0.5) * sliceW;
        const spreadX = -715 + idx * 159;
        const cx = homeX + (spreadX - homeX) * ex;
        const bw = sliceW + (114 - sliceW) * ex;

        nodes.push(
          lumBar(cx, floorY - h / 2, Math.max(12, bw), h, {
            color: col,
            fillOpacity: 0.42,
            strokeWidth: ex > 0.5 ? 2.4 : 1.6,
            glow: ex > 0.5 ? 8 : 5,
            radius: 6,
            opacity: alpha,
          }),
        );

        if (ex > 0.72) {
          nodes.push(
            txt(
              `${g === 0 ? 'A' : 'B'}${k + 1}`,
              cx,
              floorY + 38,
              26,
              col,
              'mono',
              'center',
            ).opacity(((ex - 0.72) / 0.28) * alpha),
          );
        }
      }
    });

    // Mean loss horizon line (strictly AFTER aggregation-mean!)
    if (sm > 0.08) {
      const meanY = floorY - corpus.mean * pxPerNat;
      nodes.push(
        glowingTrail(
          [
            [-805, meanY],
            [805, meanY],
          ],
          { color: ROLE.observed, width: 3.6, glow: 11, opacity: sm * alpha },
        ),
        glowDot(805, meanY, { radius: 7, color: ROLE.observed, glow: 12, opacity: sm * alpha }),
        txt('1.70 nats/target', -635, meanY - 36, 28, ROLE.observed, 'mono', 'center')
          .glow(6, ROLE.observed)
          .opacity(sm * alpha),
      );
    }

    // Primary readout line below the floor (strictly gated on cues!)
    let mainLine = 'Average the two window heights? How much say does each target get?';
    let mainCol = COSMOS.ink;
    if (sp > 0.5) {
      mainLine = `17 / 10 = ${fmt(corpus.mean, 2)} nats   →   Corpus PPL = exp(1.70) ≈ ${fmt(corpus.perplexity, 2)}`;
      mainCol = ROLE.good;
    } else if (sm > 0.5) {
      mainLine = `17 nats / 10 targets = ${fmt(corpus.mean, 2)} nats per target`;
      mainCol = ROLE.observed;
    } else if (ex > 0.75) {
      mainLine = '2 × 0.5 + 8 × 2.0 = 1 + 16 = 17 nats across 10 targets';
      mainCol = ROLE.prob;
    }

    nodes.push(
      txt(
        mainLine,
        0,
        290,
        sp > 0.5 || sm > 0.5 ? 36 : 30,
        mainCol,
        sp > 0.5 || sm > 0.5 ? 'mono' : 'serif',
        'center',
      )
        .glow(sp > 0.5 || sm > 0.5 ? 8 : 0, mainCol)
        .opacity(alpha),
    );

    // Secondary note: naive window average vs empty evaluation rule
    if (se > 0.35) {
      nodes.push(
        txt('0 targets → no mean', 0, 380, 32, ROLE.warn, 'mono', 'center')
          .glow(7, ROLE.warn)
          .opacity(se * alpha),
      );
    } else if (sp > 0.5) {
      nodes.push(
        txt(
          `Naive mean of window PPLs = (e^0.5 + e^2.0)/2 ≈ ${fmt(naivePpl, 2)} (misweights the 2-target window!)`,
          0,
          380,
          28,
          ROLE.warn,
          'sans',
          'center',
        ).opacity(sp * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.context, ROLE.warn), title, mainLayer);

  playCue(s, c, 'aggregation-windows', (d) => s.play(showWin.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'aggregation-expand', (d) => s.play(expandT.to(1, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'aggregation-mean', (d) => s.play(showMean.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'aggregation-ppl', (d) => s.play(showPpl.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'aggregation-worker', (d) => s.play(showWorker.to(1, { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'aggregation-empty', (d) => s.play(showEmpty.to(1, { duration: d })), {
    dur: 0.45,
  });
}
