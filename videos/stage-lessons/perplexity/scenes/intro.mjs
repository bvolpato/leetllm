// Scene 2: intro: "How much probability reached the word that appeared?"
// Uncovers "on" (50%), follows its mass down to -ln(0.50) = 0.693 nats, then advances
// through "the" (10%, 2.303 nats) and "mat" (80%, 0.223 nats), keeping all three
// conditional probabilities in floating surprise stations.
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  INTRO_CANDIDATES,
  INTRO_PREFIX,
  INTRO_TARGETS,
  ROLE,
  arcPts,
  cinemaAtmosphere,
  fmt,
  lumBar,
  nll,
  pct,
  playCue,
  probStrip,
  probabilities,
} from '../parts.mjs';

export default function intro(s, c) {
  const title = heroTitle(['How much probability', 'reached the real word?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.prob,
  });

  const activeStep = s.value(0); // 0 ("on"), 1 ("the"), 2 ("mat")
  const revealedCount = s.value(0); // 0 -> 1 -> 2 -> 3
  const arcFlow = s.value(0); // 0 -> 1 traces share down to loss station
  const lossReveal = s.value(0); // 0 -> 1 converts all 3 stations to -ln(p) nats
  const roadmapPulse = s.value(0); // beat 2 preview pulse

  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const step = Math.round(Math.max(0, Math.min(2, activeStep.value)));
    const count = Math.round(Math.max(0, Math.min(3, revealedCount.value)));
    const af = arcFlow.value;
    const lr = lossReveal.value;
    const rp = roadmapPulse.value;

    // Top sentence constellation: "The cat sat [on] [the] [mat]"
    const fullWords = [...INTRO_PREFIX, ...INTRO_TARGETS];
    const wordXs = [-680, -455, -245, -25, 200, 445];
    const wordY = -205;
    const trackY = wordY + 48;

    nodes.push(
      glowingTrail(
        [
          [-800, trackY],
          [600, trackY],
        ],
        { color: '#2b3c66', width: 2.2, glow: 4, core: false, opacity: 0.72 * alpha },
      ),
    );

    const activeWordX = wordXs[3 + step];
    nodes.push(
      glowingTrail(
        [
          [-780, trackY],
          [activeWordX, trackY],
        ],
        {
          gradientColors: [ROLE.context, ROLE.prob, ROLE.observed],
          width: 4.2,
          glow: 10,
          opacity: alpha,
        },
      ),
      glowDot(activeWordX, trackY, { radius: 8, color: ROLE.observed, glow: 14, opacity: alpha }),
    );

    fullWords.forEach((word, i) => {
      const isPrefix = i < 3;
      const tIdx = i - 3;
      const isObserved = tIdx >= 0 && tIdx < count;
      const isCurrent = tIdx === step;
      const col = isPrefix
        ? ROLE.context
        : isCurrent && isObserved
          ? ROLE.observed
          : isObserved
            ? ROLE.good
            : COSMOS.dim;
      const display = isPrefix || isObserved ? word : '?';
      const wNode = txt(
        display,
        wordXs[i],
        wordY,
        isCurrent ? 54 : 46,
        col,
        'serif',
        'center',
      ).opacity(alpha);
      if (isCurrent && isObserved) wNode.glow(8, ROLE.observed);
      nodes.push(wNode);
    });

    // Step indicator on far right
    nodes.push(
      txt(`Step ${step + 1} of 3`, 735, wordY - 12, 28, ROLE.prob, 'mono', 'center').opacity(alpha),
      txt(`Scored: ${count}`, 735, wordY + 34, 28, ROLE.observed, 'mono', 'center').opacity(alpha),
    );

    // Middle: Live next-token probability strip for the active step
    const stripLeft = -780;
    const stripW = 1560;
    const stripY = -20;
    const cands = INTRO_CANDIDATES[step];
    const observedHere = step < count;

    nodes.push(
      probStrip({
        left: stripLeft,
        y: stripY,
        width: stripW,
        height: 68,
        unroll: 1,
        highlightIndex: observedHere ? 0 : -1,
        highlightColor: ROLE.observed,
        segments: cands.map(([word, share], i) => ({
          word,
          share,
          color: i === 0 ? ROLE.context : i === 1 ? ROLE.prob : i === 2 ? ROLE.masked : COSMOS.dim,
          fillOpacity: i === 0 ? 0.34 : 0.18,
        })),
        labelOffsetAbove: 72,
        labelOffsetBelow: 64,
        opacity: alpha,
      }),
    );

    // Extraction arc carrying observed slice mass down to its surprise station
    const stationXs = [-545, 0, 545];
    const stationY = 275;
    const sliceCenterX = stripLeft + (stripW * probabilities[step]) / 2;

    if (observedHere && af > 0.05) {
      const pts = arcPts([sliceCenterX, stripY + 96], [stationXs[step], stationY - 94], 26, 30);
      const nPts = Math.max(2, Math.round(pts.length * af));
      const partial = pts.slice(0, nPts);
      nodes.push(
        glowingTrail(partial, {
          gradientColors: [ROLE.observed, ROLE.prob],
          width: 4,
          glow: 10,
          opacity: alpha,
        }),
        glowDot(partial[partial.length - 1][0], partial[partial.length - 1][1], {
          radius: 7,
          color: ROLE.observed,
          glow: 12,
          opacity: alpha,
        }),
      );
    }

    // Bottom: Three floating conditional-probability -> surprise stations (no prose boxes!)
    const stColors = [ROLE.context, ROLE.warn, ROLE.good];
    INTRO_TARGETS.forEach((tok, i) => {
      const sx = stationXs[i];
      const unlocked = i < count;
      const col = unlocked ? stColors[i] : COSMOS.dim;
      const showNll = (i === 0 && af >= 0.85) || lr > 0.35;
      const prefixStr = [...INTRO_PREFIX, ...INTRO_TARGETS.slice(0, i)].join(' ');

      // Glowing horizontal gauge meter showing either probability or surprise bar
      const meterW = unlocked
        ? showNll
          ? Math.min(360, nll[i] * 145)
          : probabilities[i] * 360
        : 60;
      nodes.push(
        lumBar(sx, stationY, 390, 52, {
          color: col,
          fillOpacity: unlocked ? 0.14 : 0.06,
          strokeWidth: unlocked ? 2.2 : 1.4,
          glow: unlocked ? 6 : 2,
          radius: 8,
          opacity: alpha,
        }),
      );
      if (unlocked) {
        nodes.push(
          lumBar(sx - 195 + meterW / 2, stationY, meterW, 44, {
            color: col,
            fillOpacity: 0.45,
            strokeWidth: 2,
            glow: 9,
            radius: 6,
            opacity: alpha,
          }),
          txt(
            showNll
              ? `-ln(${fmt(probabilities[i])}) = ${fmt(nll[i], 3)} nats`
              : `"${tok}"   p = ${pct(probabilities[i])}`,
            sx,
            stationY - 56,
            30,
            col,
            'mono',
            'center',
          )
            .glow(6, col)
            .opacity(alpha),
          txt(
            `P(${tok} | ${prefixStr}) = ${fmt(probabilities[i])}`,
            sx,
            stationY + 60,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ).opacity(alpha),
        );
      } else {
        nodes.push(
          txt(
            `Target ${i + 1}: awaiting text`,
            sx,
            stationY,
            26,
            COSMOS.dim,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }
    });

    // Beat 2 bottom lens: targets, context, units
    if (rp > 0.08) {
      nodes.push(
        txt(
          'Score fixed text (never sample)  ·  track targets, context, and units',
          0,
          410,
          30,
          ROLE.observed,
          'serif',
          'center',
        )
          .glow(7, ROLE.observed)
          .opacity(rp * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.prob, ROLE.observed), title, mainLayer);

  // Beat 0: sentence -> uncover "on" -> trace probability to surprise
  playCue(s, c, 'intro-beat-1-focus-1', (d) => s.play(activeStep.to(0, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'intro-observed-on', (d) => s.play(revealedCount.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'intro-follow-share', (d) => s.play(arcFlow.to(1, { duration: d })), {
    dur: 0.9,
  });

  // Beat 1: step through "the" and "mat" conditioned on real prefixes
  playCue(
    s,
    c,
    'intro-observed-the',
    (d) => s.play(activeStep.to(1, { duration: d }), revealedCount.to(2, { duration: d })),
    { dur: 0.6 },
  );
  playCue(
    s,
    c,
    'intro-observed-mat',
    (d) => s.play(activeStep.to(2, { duration: d }), revealedCount.to(3, { duration: d })),
    { dur: 0.6 },
  );
  playCue(s, c, 'intro-beat-2-focus-1', (d) => s.play(revealedCount.to(3, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'intro-beat-2-focus-2', (d) => s.play(arcFlow.to(1, { duration: d })), {
    dur: 0.5,
  });

  // Beat 2: convert all 3 to surprise nats & highlight bookkeeping
  playCue(
    s,
    c,
    'intro-beat-3-focus-1',
    (d) => s.play(lossReveal.to(1, { duration: d }), roadmapPulse.to(1, { duration: d })),
    { dur: 0.8 },
  );
}
