// Scene 23: fresh-decoder: "What did the last query actually read?"
// View 1 (Beats 0-2): Fresh 2-key value plane ([4, 0] blue & [0, 2] emerald, query [2, -1]):
//         Beat 0 strictly WITHHOLDS scores, shares, vectors, and read.
//         Beat 1 computes scores, 89% blue share, head-to-tail vectors -> [3.572, 0.214].
//         Beat 2 blocks green via upper-left mask -> blue stretches to [4, 0], then repairs back!
// View 2 (Beats 3-4): Opening prompt "function returns the [?]" replayed with cached query:
//         Beat 3 crops history to "function" only & reveals 6 shifted scores (WITHHOLDING winner!).
//         Beat 4 reveals "None" (after cache-choice), restores all 3 keys (restore-prefix),
//         verifies max |delta| = 0.000 (compare-scores), and puts "result" back in the blank!
import { COSMOS, glowingTrail, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  CACHE_RUNS,
  FRESH,
  ROLE,
  VOCAB,
  WORDS,
  cinemaAtmosphere,
  clamp,
  fmt,
  glowRing,
  glowVector,
  lumBar,
  pct,
  playCue,
  swapVis,
  vectorPlane,
} from '../parts.mjs';

export default function freshDecoder(s, c) {
  const title = heroTitle(['Verify the read:', 'transfer & cache repair'], {
    x: -850,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.valid,
  });

  const vFresh = s.value(1);
  const vReplay = s.value(0);

  // View 1 channels (Beat 0 withholds scores/shares/arrows/read!)
  const showBlueKey = s.value(0);
  const showGreenKey = s.value(0);
  const showPts = s.value(0);
  const showScores = s.value(0);
  const showShares = s.value(0);
  const accumProg = s.value(0); // 0 -> 1 blue arrow, 1 -> 2 green upward step
  const readShow = s.value(0);
  const cropBug = s.value(0); // 0 = aligned, 1 = green blocked (Beat 2)
  const cropStretch = s.value(0); // 0 -> 1 blue stretches to [4, 0]

  // View 2 channels (Beat 3 withholds winner until Beat 4 cache-choice!)
  const cropSpan = s.value(0); // 0 = all 3, 1 = cropped to "function" only
  const scoresVis = s.value(0); // 0 -> 6 cached logits revealed
  const wrongChoice = s.value(0); // STRICTLY AFTER cache-choice!
  const restoreSpan = s.value(0); // 0 -> 1 restores bracket to all 3 keys
  const diffMatch = s.value(0); // compare-scores -> 0.000
  const finalRestore = s.value(0); // STRICTLY AFTER restored-choice!

  // VIEW 1: Equal-unit 2D value plane + key/value/score/weight panel
  const plane1 = vectorPlane({
    originX: -720,
    originY: 235,
    scaleX: 155,
    scaleY: 155,
    xMin: 0,
    xMax: 4.4,
    yMin: 0,
    yMax: 2.5,
    xTicks: [0, 1, 2, 3, 4],
    yTicks: [0, 1, 2],
    xLabel: 'v1',
    yLabel: 'v2',
  });

  const freshLayer = guardedDynamic(vFresh, (alpha) => {
    const bk = showBlueKey.value > 0.3;
    const gk = showGreenKey.value > 0.3;
    const ptsOn = showPts.value > 0.3;
    const scOn = showScores.value > 0.3;
    const shOn = showShares.value > 0.3;
    const acc = accumProg.value;
    const rdOn = readShow.value > 0.3;
    const bug = cropBug.value > 0.5;
    const st = cropStretch.value;

    const curWeights = bug ? [1, 0] : FRESH.weights;
    const curRead = bug
      ? [FRESH.read[0] + (FRESH.wrong[0] - FRESH.read[0]) * st, FRESH.read[1] * (1 - st)]
      : FRESH.read;

    const pOrigin = plane1.toScreen(0, 0);
    const pBlue = plane1.toScreen(...FRESH.values[0]);
    const pGreen = plane1.toScreen(...FRESH.values[1]);
    const nodes = [plane1.node.opacity(alpha)];

    if (ptsOn) {
      if (!bug) {
        nodes.push(
          glowingTrail([pBlue, pGreen], {
            color: '#5c70a0',
            width: 2.4,
            glow: 4,
            core: false,
            opacity: 0.75 * alpha,
          }),
        );
      }
      nodes.push(
        glowRing(pBlue[0], pBlue[1], 13, ROLE.stream, { width: 3.2, glow: 10, opacity: alpha }),
        txt('[4, 0]', pBlue[0] + 32, pBlue[1] - 48, 26, ROLE.stream, 'mono', 'center').opacity(
          alpha,
        ),
        glowRing(pGreen[0], pGreen[1], 13, bug ? COSMOS.dim : ROLE.valid, {
          width: 3.2,
          glow: bug ? 0 : 10,
          opacity: (bug ? 0.35 : 1) * alpha,
        }),
        txt(
          '[0, 2]',
          pGreen[0] + 38,
          pGreen[1] - 32,
          26,
          bug ? COSMOS.dim : ROLE.valid,
          'mono',
          'left',
        ).opacity((bug ? 0.35 : 1) * alpha),
      );
    }

    // Head-to-tail weighted read arrows
    if (acc > 0.02) {
      const bx = curRead[0] * clamp(acc);
      const gy = curRead[1] * clamp(acc - 1);
      const midPt = plane1.toScreen(bx, 0);
      const endPt = plane1.toScreen(bx, gy);
      nodes.push(
        glowVector(pOrigin, midPt, { color: ROLE.stream, width: 6, glow: 12, opacity: alpha }),
      );
      if (gy > 0.01) {
        nodes.push(
          glowVector(midPt, endPt, { color: ROLE.valid, width: 6, glow: 12, opacity: alpha }),
        );
      }
    }

    // Read coordinates banner under plot (concise so never brief!)
    const readTxt =
      rdOn && (!bug || st > 0.7)
        ? bug
          ? 'Read = [4.000, 0.000]'
          : `Read = [${fmt(FRESH.read[0], 3)}, ${fmt(FRESH.read[1], 3)}]`
        : 'Read = [?, ?]';
    nodes.push(
      txt(readTxt, -365, 345, 32, bug ? ROLE.mask : ROLE.query, 'mono', 'center')
        .glow(rdOn ? 7 : 4, bug ? ROLE.mask : ROLE.query)
        .opacity(alpha),
    );

    // RIGHT PANEL: Query, keys, values, scaled scores, weights
    const rx = 475;
    const colXs = [420, 710];
    const kCols = [ROLE.stream, bug ? COSMOS.dim : ROLE.valid];
    nodes.push(
      txt('Query q = [2, -1]   ·   pos 1', rx, -270, 34, ROLE.query, 'mono', 'center')
        .glow(7, ROLE.query)
        .opacity(alpha),
      txt('Key', 85, -110, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('Value', 85, -25, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('Score / √2', 85, 60, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('Weight', 85, 145, 28, COSMOS.muted, 'mono', 'left').opacity(alpha),
    );

    [0, 1].forEach((i) => {
      const cx = colXs[i];
      const col = kCols[i];
      const keyVis = i === 0 ? bk : gk;
      nodes.push(
        txt(i === 0 ? 'blue key' : 'green key', cx, -195, 28, col, 'mono', 'center').opacity(alpha),
        txt(
          keyVis ? (i === 0 ? '[1, 0]' : '[0, 1]') : '·',
          cx,
          -110,
          30,
          col,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          ptsOn ? (i === 0 ? '[4, 0]' : '[0, 2]') : '·',
          cx,
          -25,
          30,
          col,
          'mono',
          'center',
        ).opacity(alpha),
        txt(scOn ? fmt(FRESH.scores[i], 3) : '?', cx, 60, 30, COSMOS.ink, 'mono', 'center').opacity(
          alpha,
        ),
        txt(
          shOn && (!bug || st > 0.4) ? `${fmt(curWeights[i], 3)} (${pct(curWeights[i])})` : '?',
          cx,
          145,
          28,
          col,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          bug && i === 1 ? 'BLOCKED' : 'allowed',
          cx,
          225,
          26,
          bug && i === 1 ? ROLE.mask : ROLE.valid,
          'mono',
          'center',
        ).opacity((bug || rdOn ? 1 : 0) * alpha),
      );
    });

    if (bug) {
      nodes.push(
        txt('Upper-left row 0 blocks green', rx, 345, 28, ROLE.mask, 'mono', 'center')
          .glow(6, ROLE.mask)
          .opacity(alpha),
      );
    }

    return nodes;
  });

  // VIEW 2: Opening prompt cached replay (None -> repair -> result!)
  const { full, upperLeft, aligned } = CACHE_RUNS[0];

  const replayLayer = guardedDynamic(vReplay, (alpha) => {
    const cr = cropSpan.value;
    const sv = scoresVis.value;
    const wc = wrongChoice.value > 0.45;
    const rs = restoreSpan.value;
    const dm = diffMatch.value > 0.45;
    const fr = finalRestore.value > 0.45;

    const isRestored = rs > 0.9;
    const run = isRestored ? aligned : upperLeft;
    const shownWinner = fr ? aligned.choice : wc && !isRestored ? upperLeft.choice : null;
    const scoreCnt = Math.min(6, Math.ceil(sv * 6));

    // Top 4-slot prompt: function returns the [?]
    const slots = [...WORDS, shownWinner !== null ? VOCAB[shownWinner] : '?'];
    const slotXs = [-540, -180, 180, 540];
    const slotY = -230;
    const nodes = [];

    slots.forEach((word, i) => {
      const isBlank = i === 3;
      const isThe = i === 2;
      const col = isBlank
        ? shownWinner !== null
          ? isRestored
            ? ROLE.valid
            : ROLE.mask
          : ROLE.query
        : isThe
          ? ROLE.query
          : ROLE.stream;
      nodes.push(
        lumBar(slotXs[i], slotY, 290, 84, {
          color: col,
          fillOpacity: isBlank && shownWinner !== null ? 0.4 : isThe ? 0.28 : 0.16,
          strokeWidth: isBlank && shownWinner !== null ? 3 : 2,
          glow: isBlank && shownWinner !== null ? 12 : isThe ? 8 : 4,
          opacity: alpha,
        }),
        txt(
          word,
          slotXs[i],
          slotY,
          34,
          isBlank && shownWinner !== null ? COSMOS.ink : col,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    // Animated causal read span bracket under the 3 prefix tokens
    const rightPos = 2 * (1 - cr + rs); // 2 -> 0 (cropped) -> 2 (restored)
    const spanLeft = slotXs[0] - 135;
    const spanRight = slotXs[0] + rightPos * 360 + 135;
    const spanCol = isRestored ? ROLE.valid : cr > 0.5 && rs < 0.5 ? ROLE.mask : ROLE.attn;
    const spanLbl = isRestored
      ? 'all 3 keys restored'
      : cr > 0.65 && rs < 0.2
        ? 'only "function"'
        : '';
    nodes.push(
      glowingTrail(
        [
          [spanLeft, -165],
          [spanLeft, -145],
          [spanRight, -145],
          [spanRight, -165],
        ],
        { color: spanCol, width: 4.5, glow: 10, opacity: alpha },
      ),
    );
    if (spanLbl) {
      nodes.push(
        txt(spanLbl, (spanLeft + spanRight) / 2, -102, 28, spanCol, 'mono', 'center')
          .glow(6, spanCol)
          .opacity(alpha),
      );
    }

    // Lower 2-row x 6-word logit comparison table (Full prefix vs Cached query)
    const colStart = -440;
    const colStep = 230;
    const yFull = 65;
    const yCache = 185;
    nodes.push(
      txt('Full prefix', -625, yFull, 28, ROLE.stream, 'mono', 'right').opacity(alpha),
      txt('Cached query', -625, yCache, 28, ROLE.query, 'mono', 'right').opacity(alpha),
    );

    VOCAB.forEach((word, i) => {
      const cx = colStart + i * colStep;
      const showC = i < scoreCnt;
      const isFullBest = i === full.choice;
      const isCacheBest = showC && shownWinner === i;
      nodes.push(
        txt(word, cx, -15, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
        lumBar(cx, yFull, 206, 76, {
          color: isFullBest ? ROLE.valid : ROLE.stream,
          fillOpacity: isFullBest ? 0.34 : 0.16,
          strokeWidth: isFullBest ? 2.8 : 1.6,
          glow: isFullBest ? 10 : 3,
          opacity: alpha,
        }),
        txt(
          fmt(full.logits[i], 3),
          cx,
          yFull,
          30,
          isFullBest ? COSMOS.ink : ROLE.stream,
          'mono',
          'center',
        ).opacity(alpha),
        lumBar(cx, yCache, 206, 76, {
          color: isCacheBest ? (isRestored ? ROLE.valid : ROLE.mask) : ROLE.query,
          fillOpacity: isCacheBest ? 0.4 : showC ? 0.18 : 0.08,
          strokeWidth: isCacheBest ? 3 : 1.6,
          glow: isCacheBest ? 12 : showC ? 5 : 0,
          opacity: alpha,
        }),
        txt(
          showC ? fmt(run.logits[i], 3) : '·',
          cx,
          yCache,
          30,
          isCacheBest ? COSMOS.ink : showC ? ROLE.query : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    // Bottom status / prediction / verification readout (concise so never brief!)
    const footer = fr
      ? 'Choice: "result"  (delta 0.000)'
      : dm
        ? `max |delta| = ${fmt(aligned.maxLogitDifference, 3)}  (exact match!)`
        : isRestored
          ? 'Restoring all 3 cached keys...'
          : wc
            ? `Wrong winner: "None"  (delta ${fmt(upperLeft.maxLogitDifference, 3)})`
            : 'Which word wins greedy decoding now?';
    const footCol = fr || dm ? ROLE.valid : wc && !isRestored ? ROLE.mask : ROLE.query;
    nodes.push(txt(footer, 0, 345, 32, footCol, 'mono', 'center').glow(8, footCol).opacity(alpha));

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.valid, ROLE.stream), title, freshLayer, replayLayer);

  // Beat 0: set up keys & values (WITHHOLD scores, shares, vectors, and read!)
  playCue(s, c, 'fresh-blue-key', (d) => s.play(showBlueKey.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'fresh-green-key', (d) => s.play(showGreenKey.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'fresh-inputs', (d) => s.play(showPts.to(1, { duration: d })), { dur: 0.6 });

  // Beat 1: compute scores, shares, head-to-tail vectors, and [3.572, 0.214]
  playCue(s, c, 'tr-fresh-decoder-scores', (d) => s.play(showScores.to(1, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'tr-fresh-decoder-shares', (d) => s.play(showShares.to(1, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'tr-fresh-decoder-accumulate', (d) => s.play(accumProg.to(2, { duration: d })), {
    dur: 1.2,
  });
  playCue(s, c, 'tr-fresh-decoder-read', (d) => s.play(readShow.to(1, { duration: d })), {
    dur: 0.55,
  });

  // Beat 2: upper-left mask drops green -> stretches to [4, 0] -> repair restores green!
  playCue(s, c, 'tr-fresh-decoder-wrong', (d) => s.play(cropBug.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'fresh-cropped-read', (d) => s.play(cropStretch.to(1, { duration: d })), {
    dur: 0.75,
  });
  playCue(
    s,
    c,
    'tr-fresh-decoder-repair',
    (d) =>
      s.play(cropBug.to(0, { duration: Math.min(0.25, d) }), cropStretch.to(0, { duration: d })),
    { dur: 0.75 },
  );

  // Beat 3: swap cleanly right after beat-2-end (WITHHOLD winner during Beat 3!)
  const b3Swap = c.cue('crop-history').start - 11.5;
  c.at(Math.max(0.2, b3Swap - c.start), () => {
    s.play(swapVis(vFresh, vReplay, 0.65));
  });
  playCue(s, c, 'crop-history', (d) => s.play(cropSpan.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'cache-scores', (d) => s.play(scoresVis.to(1, { duration: d })), { dur: 0.85 });

  // Beat 4: reveal "None" AFTER cache-choice -> restore prefix -> compare 0.000 -> restore "result" AFTER restored-choice!
  playCue(s, c, 'cache-choice', (d) => s.play(wrongChoice.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'restore-prefix', (d) => s.play(restoreSpan.to(1, { duration: d })), { dur: 0.8 });
  playCue(s, c, 'compare-scores', (d) => s.play(diffMatch.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'restored-choice', (d) => s.play(finalRestore.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
}
