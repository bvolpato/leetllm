// Scene 1: hook: "What comes back to sing?"
// Full-bleed glowing sentence stream -> causal look-back arc to Birds (4 positions back)
// -> common value ruler comparing Birds (2, 42%) and sing (1, 58%) -> tip-to-tail sum 1.42.
import { dot, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  OUTPUT,
  ROLE,
  SENTENCE,
  V,
  WEIGHTS,
  arcPts,
  cinemaAtmosphere,
  fmt,
  lumBar,
  pct,
  playCue,
} from '../parts.mjs';

export default function hook(s, c) {
  const bShare = WEIGHTS[1][0]; // ~0.421
  const sShare = WEIGHTS[1][1]; // ~0.579
  const bPiece = bShare * V[0][0]; // ~0.842
  const sPiece = sShare * V[1][0]; // ~0.579
  const total0 = OUTPUT[1][0]; // ~1.421

  // Top hero phrase & atmospheric glow spanning full 1920x1080
  const title = heroTitle(['What comes back', 'to sing?'], {
    x: -850,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.sing,
  });

  // Sentence constellation coordinates across full width
  const wordXs = [-760, -565, -425, -245, -25, 195, 395, 625];
  const wordY = -125;

  // Dynamic state driving the reading beam, subject arc, step counter, and ruler phase
  const readIdx = s.value(0); // 0 -> 4 (sing) -> 7 (dawn)
  const focusSing = s.value(0); // widens halo around sing
  const showSubjectArc = s.value(0); // glowing arc from sing back to Birds
  const showSteps = s.value(0); // 4-step hop counter
  const focusTwo = s.value(0); // fades intermediate words when focusing on Birds + sing

  const sentenceVis = s.value(1);

  const sentenceLayer = guardedDynamic(sentenceVis, (alpha) => {
    const ri = readIdx.value;
    const f2 = focusTwo.value;
    const fs = focusSing.value;
    const arcT = showSubjectArc.value;
    const stepT = showSteps.value;
    const nodes = [];

    // Continuous luminous baseline track under the sentence (well below word text)
    const trackY = wordY + 56;
    nodes.push(
      glowingTrail(
        [
          [-840, trackY],
          [840, trackY],
        ],
        { color: '#2b3b64', width: 2.2, glow: 4, core: false, opacity: 0.7 * alpha },
      ),
    );

    // Reading photon sliding under the words
    const clampedIdx = Math.max(0, Math.min(SENTENCE.length - 1, ri));
    const lo = Math.floor(clampedIdx);
    const hi = Math.min(SENTENCE.length - 1, lo + 1);
    const frac = clampedIdx - lo;
    const beamX = wordXs[lo] + (wordXs[hi] - wordXs[lo]) * frac;

    nodes.push(
      glowingTrail(
        [
          [-820, trackY],
          [beamX, trackY],
        ],
        {
          gradientColors: [ROLE.birds, ROLE.sing, ROLE.query],
          width: 4.5,
          glow: 10,
          opacity: 0.9 * alpha * (1 - f2 * 0.5),
        },
      ),
      glowDot(beamX, trackY, {
        radius: 8 + fs * 3,
        color: ROLE.query,
        glow: 14,
        opacity: alpha * (1 - f2 * 0.7),
      }),
    );

    // Words rendered with semantic color roles
    SENTENCE.forEach((word, i) => {
      const isBirds = i === 0;
      const isSing = i === 4;
      const isKeyWord = isBirds || isSing;
      const wAlpha = alpha * (isKeyWord ? 1 : 1 - f2 * 0.76);
      const col = isBirds
        ? arcT > 0.2 || f2 > 0.2
          ? ROLE.birds
          : COSMOS.ink
        : isSing && fs > 0.1
          ? ROLE.sing
          : COSMOS.ink;
      const sz = isSing ? 50 + fs * 8 : isBirds && arcT > 0.2 ? 54 : 46;
      const tNode = txt(word, wordXs[i], wordY, sz, col, 'serif', 'center').opacity(wAlpha);
      if (isSing && fs > 0.3) tNode.glow(8, ROLE.sing);
      if (isBirds && arcT > 0.3) tNode.glow(8, ROLE.birds);
      nodes.push(tNode);

      // Subtle index pips under words when counting back
      if (stepT > 0.05 && i <= 4) {
        const dist = 4 - i;
        const lbl = dist === 0 ? '0' : `-${dist}`;
        const pCol = dist === 4 ? ROLE.query : dist === 0 ? ROLE.sing : COSMOS.muted;
        nodes.push(
          txt(lbl, wordXs[i], trackY + 34, 26, pCol, 'mono', 'center').opacity(
            stepT * alpha * (isKeyWord ? 1 : 1 - f2 * 0.65),
          ),
        );
      }
    });

    // Glowing look-back arc from sing -> Birds (only AFTER subject reveal!)
    if (arcT > 0.02) {
      const fullPts = arcPts([wordXs[4], wordY - 48], [wordXs[0], wordY - 48], -145, 36);
      const count = Math.max(2, Math.round(fullPts.length * arcT));
      const slice = fullPts.slice(0, count);
      nodes.push(
        glowingTrail(slice, {
          gradientColors: [ROLE.sing, ROLE.query, ROLE.birds],
          width: 5,
          glow: 12,
          opacity: alpha,
        }),
        glowDot(slice[slice.length - 1][0], slice[slice.length - 1][1], {
          radius: 7,
          color: ROLE.birds,
          glow: 14,
          opacity: alpha,
        }),
      );
    }

    return nodes;
  });

  // Question prompt (withheld answer!) and 4-position readout
  const whoPrompt = txt('Who sings?', 520, -355, 42, ROLE.query, 'serif', 'center').glow(
    8,
    ROLE.query,
  );
  const fourBadge = txt('4 positions back', -390, -295, 32, ROLE.query, 'mono', 'center').glow(
    6,
    ROLE.query,
  );

  // Lower common value ruler (visible as quiet skeleton from start, comes alive on beat 2!)
  const rulerLeft = -560;
  const rulerUnit = 420; // 1.0 unit = 420 px -> 0..2.0 spans -560..+280
  const rulerBaseY = 395;

  const birdsValBar = s.value(0); // 0 -> 2.0
  const singValBar = s.value(0); // 0 -> 1.0
  const birdsShareVis = s.value(0);
  const singShareVis = s.value(0);
  const birdsPieceGrow = s.value(0); // 0 -> 1 (reveals 0.84)
  const singPieceGrow = s.value(0); // 0 -> 1 (reveals 0.58)
  const stackSum = s.value(0); // 0 -> 1 (slides sing piece tip-to-tail onto birds piece -> 1.42)
  const totalReveal = s.value(0);

  const rulerLayer = guardedDynamic(sentenceVis, (alpha) => {
    const nodes = [];
    const rx0 = rulerLeft;
    const rx2 = rulerLeft + 2.2 * rulerUnit;

    // Luminous common ruler axis across lower canvas (always visible as subtle anchor)
    nodes.push(
      glowingTrail(
        [
          [rx0, rulerBaseY],
          [rx2, rulerBaseY],
        ],
        { color: '#455885', width: 2.5, glow: 5, core: false, opacity: 0.85 * alpha },
      ),
    );
    [0, 0.5, 1.0, 1.5, 2.0].forEach((tick) => {
      const tx = rx0 + tick * rulerUnit;
      nodes.push(
        line([tx, rulerBaseY - 8], [tx, rulerBaseY + 10], { stroke: '#6e82b4', width: 2 }).opacity(
          0.8 * alpha,
        ),
        txt(fmt(tick, 1), tx, rulerBaseY + 38, 26, COSMOS.muted, 'mono', 'center').opacity(
          0.85 * alpha,
        ),
      );
    });

    // Subtle left caption for the ruler
    nodes.push(
      txt('1st value coord', rx0 - 38, 185, 28, COSMOS.muted, 'mono', 'right').opacity(
        0.85 * alpha,
      ),
    );

    // Row 1: Birds value bar (y = 135)
    const by = 135;
    const bv = birdsValBar.value;
    if (bv > 0.02) {
      const bw = bv * rulerUnit;
      nodes.push(
        lumBar(rx0 + bw / 2, by, bw, 46, {
          color: ROLE.birds,
          fillOpacity: 0.2,
          strokeWidth: 2.4,
          glow: 6,
          opacity: alpha,
        }),
        txt('Birds: 2.0', rx0 - 38, by, 30, ROLE.birds, 'mono', 'right').opacity(alpha),
      );
      if (birdsShareVis.value > 0.05) {
        nodes.push(
          txt(`share ${pct(bShare)}`, rx0 + bw + 28, by, 28, ROLE.birds, 'mono', 'left').opacity(
            birdsShareVis.value * alpha,
          ),
        );
      }
      // Birds contribution piece (only AFTER birds-piece cue!)
      const bp = birdsPieceGrow.value;
      if (bp > 0.02) {
        const pw = bp * bPiece * rulerUnit;
        nodes.push(
          lumBar(rx0 + pw / 2, by, pw, 46, {
            color: ROLE.birds,
            fillOpacity: 0.65,
            strokeWidth: 3,
            glow: 12,
            opacity: alpha,
          }),
        );
        if (bp > 0.85) {
          nodes.push(
            txt(
              `+ ${fmt(bPiece)}`,
              rx0 + pw / 2,
              by - 46,
              28,
              ROLE.birds,
              'mono',
              'center',
            ).opacity(alpha),
          );
        }
      }
    }

    // Row 2: sing value bar (y = 245)
    const sy = 245;
    const sv = singValBar.value;
    if (sv > 0.02) {
      const sw = sv * rulerUnit;
      nodes.push(
        lumBar(rx0 + sw / 2, sy, sw, 46, {
          color: ROLE.sing,
          fillOpacity: 0.2,
          strokeWidth: 2.4,
          glow: 6,
          opacity: alpha,
        }),
        txt('sing: 1.0', rx0 - 38, sy, 30, ROLE.sing, 'mono', 'right').opacity(alpha),
      );
      if (singShareVis.value > 0.05) {
        nodes.push(
          txt(`share ${pct(sShare)}`, rx0 + sw + 28, sy, 28, ROLE.sing, 'mono', 'left').opacity(
            singShareVis.value * alpha,
          ),
        );
      }
      // Sing contribution piece (only AFTER sing-piece cue!)
      const sp = singPieceGrow.value;
      if (sp > 0.02) {
        const pw = sp * sPiece * rulerUnit;
        nodes.push(
          lumBar(rx0 + pw / 2, sy, pw, 46, {
            color: ROLE.sing,
            fillOpacity: 0.65,
            strokeWidth: 3,
            glow: 12,
            opacity: alpha,
          }),
        );
        if (sp > 0.85) {
          nodes.push(
            txt(`+ ${fmt(sPiece)}`, rx0 + pw / 2, sy - 46, 28, ROLE.sing, 'mono', 'center').opacity(
              alpha,
            ),
          );
        }
      }
    }

    // Row 3: Combined tip-to-tail output strip (y = 338)
    const st = stackSum.value;
    if (st > 0.02) {
      const ySum = 338;
      const bw = bPiece * rulerUnit;
      const sw = sPiece * rulerUnit;
      const slideX = rx0 + bw * st;
      nodes.push(
        lumBar(rx0 + bw / 2, ySum, bw, 40, {
          color: ROLE.birds,
          fillOpacity: 0.55,
          strokeWidth: 2.4,
          glow: 8,
          opacity: st * alpha,
        }),
        lumBar(slideX + sw / 2, ySum, sw, 40, {
          color: ROLE.sing,
          fillOpacity: 0.55,
          strokeWidth: 2.4,
          glow: 8,
          opacity: st * alpha,
        }),
      );
      if (totalReveal.value > 0.1) {
        const endX = rx0 + total0 * rulerUnit;
        nodes.push(
          glowDot(endX, rulerBaseY, {
            radius: 9,
            color: ROLE.query,
            glow: 14,
            opacity: totalReveal.value * alpha,
          }),
          txt(`output = ${fmt(total0)}`, endX + 26, ySum, 34, ROLE.query, 'mono', 'left')
            .glow(8, ROLE.query)
            .opacity(totalReveal.value * alpha),
        );
      }
    }

    return nodes;
  });

  const contribQ = txt(
    'Which word supplies more?',
    585,
    185,
    34,
    ROLE.query,
    'serif',
    'center',
  ).glow(7, ROLE.query);

  // Subtle decorative orbit glow on right side to balance early frames
  const rightGlow = aura(580, -240, 360, '#5ce1e626', '#07091000').zIndex(-60);

  s.add(cinemaAtmosphere(ROLE.sing, ROLE.query), rightGlow, title, sentenceLayer, rulerLayer);

  // Beat 0: reading stream across sentence
  playCue(s, c, 'sentence', (d) => s.play(readIdx.to(3, { duration: d })), { dur: 1.0 });
  playCue(
    s,
    c,
    'reaches-sing',
    (d) => s.play(readIdx.to(4, { duration: d }), focusSing.to(1, { duration: d })),
    { dur: 0.6 },
  );
  playCue(s, c, 'after-verb', (d) => s.play(readIdx.to(7, { duration: d })), { dur: 0.9 });
  c.show('subject-question', whoPrompt);

  // Beat 1: reveal subject Birds, count 4 positions back, isolate two tokens
  c.hide('subject', whoPrompt);
  playCue(s, c, 'subject', (d) => s.play(showSubjectArc.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'count-back', (d) => s.play(showSteps.to(1, { duration: d })), { dur: 0.6 });
  c.show('four-back', fourBadge);
  playCue(s, c, 'two-tokens', (d) => s.play(focusTwo.to(1, { duration: d })), { dur: 0.7 });

  // Beat 2: common ruler inputs & shares (withhold piece totals!)
  playCue(s, c, 'first-number', (d) => s.play(birdsValBar.to(0.15, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'birds-input', (d) => s.play(birdsValBar.to(V[0][0], { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'sing-input', (d) => s.play(singValBar.to(V[1][0], { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'birds-share', (d) => s.play(birdsShareVis.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'sing-share', (d) => s.play(singShareVis.to(1, { duration: d })), { dur: 0.45 });
  c.show('contribution-question', contribQ);

  // Beat 3: spoken reveals AFTER each result clause!
  c.hide('birds-piece', contribQ);
  playCue(s, c, 'birds-piece', (d) => s.play(birdsPieceGrow.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'sing-piece', (d) => s.play(singPieceGrow.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'add-pieces', (d) => s.play(stackSum.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });
  playCue(s, c, 'first-total', (d) => s.play(totalReveal.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
}
