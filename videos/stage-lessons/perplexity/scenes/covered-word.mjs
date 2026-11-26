// Scene 1: covered-word: "Which word is under the cover?"
// Full-bleed glowing sentence constellation with a shrouded 4th token slot + unrolling
// probability distribution strip ("on" 50%, "under" 30%, "near" 15%, "other" 5%).
// Strictly withholds the covered word through the end of the scene.
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
  INTRO_CANDIDATES,
  INTRO_PREFIX,
  ROLE,
  cinemaAtmosphere,
  lumBar,
  playCue,
  probStrip,
} from '../parts.mjs';

export default function coveredWord(s, c) {
  const title = heroTitle(['Which word is', 'under the cover?'], {
    x: -845,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.observed,
  });

  const readPos = s.value(0); // 0 -> 2.8 sweeping under prefix
  const unroll = s.value(0.18); // 0.18 -> 1.0 unrolling probability strip
  const underlineOn = s.value(0); // 0 -> 1 highlighting "on" (50%)
  const underlineUnder = s.value(0); // 0 -> 1 highlighting "under" (30%)
  const askPulse = s.value(0); // 0 -> 1 pulsing mystery cover

  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const rp = readPos.value;
    const ur = unroll.value;
    const uOn = underlineOn.value;
    const uUn = underlineUnder.value;
    const ap = askPulse.value;

    // Upper sentence constellation: "The"  "cat"  "sat"  [covered]
    const wordXs = [-590, -290, 10, 355];
    const wordY = -165;
    const trackY = wordY + 58;

    nodes.push(
      txt('Held-out prefix', -845, wordY - 82, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      glowingTrail(
        [
          [-750, trackY],
          [530, trackY],
        ],
        { color: '#2b3c66', width: 2.5, glow: 4, core: false, opacity: 0.72 * alpha },
      ),
    );

    // Sweeping reading photon across "The cat sat"
    const clampedRp = Math.max(0, Math.min(2, rp));
    const idx0 = Math.floor(clampedRp);
    const idx1 = Math.min(2, idx0 + 1);
    const frac = clampedRp - idx0;
    const beamX = wordXs[idx0] + (wordXs[idx1] - wordXs[idx0]) * frac;

    nodes.push(
      glowingTrail(
        [
          [-720, trackY],
          [beamX, trackY],
        ],
        {
          gradientColors: [ROLE.context, ROLE.prob, ROLE.observed],
          width: 4.5,
          glow: 10,
          opacity: alpha,
        },
      ),
      glowDot(beamX, trackY, { radius: 8, color: ROLE.prob, glow: 14, opacity: alpha }),
    );

    INTRO_PREFIX.forEach((word, i) => {
      const lit = rp >= i - 0.15;
      nodes.push(
        txt(word, wordXs[i], wordY, 56, lit ? COSMOS.ink : COSMOS.muted, 'serif', 'center').opacity(
          alpha,
        ),
      );
    });

    // Shrouded 4th word cover (stays mysterious throughout!)
    const coverX = wordXs[3];
    const coverCol = ap > 0.2 ? ROLE.observed : ROLE.prob;
    nodes.push(
      lumBar(coverX, wordY, 240, 88, {
        color: coverCol,
        fillOpacity: 0.18 + 0.14 * ap,
        strokeWidth: 2.8 + ap,
        glow: 10 + 6 * ap,
        radius: 12,
        opacity: alpha,
      }),
    );
    // Subtle diagonal veil hatch lines inside the cover (strictly away from center ?)
    for (let k = -2; k <= 2; k++) {
      if (k === 0) continue;
      const ox = coverX + k * 42;
      nodes.push(
        line([ox - 12, wordY + 28], [ox + 12, wordY - 28], {
          stroke: coverCol,
          width: 2.2,
        }).opacity(0.35 * alpha),
      );
    }
    nodes.push(
      txt('?', coverX, wordY, 52, coverCol, 'serif', 'center')
        .glow(8 + 6 * ap, coverCol)
        .opacity(alpha),
      txt(
        ap > 0.35 ? 'Which word appeared?' : 'next word hidden',
        coverX,
        trackY + 34,
        26,
        coverCol,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Lower full-bleed unrolling probability strip
    const stripLeft = -780;
    const stripW = 1560;
    const stripY = 175;
    const cands = INTRO_CANDIDATES[0];
    const segColors = [ROLE.context, ROLE.prob, ROLE.masked, COSMOS.dim];
    const activeHi = uUn > 0.15 ? 1 : uOn > 0.15 ? 0 : -1;

    nodes.push(
      txt(
        'Model probability distribution before seeing the word',
        stripLeft,
        stripY - 135,
        28,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      probStrip({
        left: stripLeft,
        y: stripY,
        width: stripW,
        height: 76,
        unroll: ur,
        highlightIndex: activeHi,
        highlightColor: activeHi === 1 ? ROLE.prob : ROLE.context,
        segments: cands.map(([word, share], i) => ({
          word,
          share,
          color: segColors[i],
          fillOpacity: i < 2 ? 0.3 : 0.16,
        })),
        opacity: alpha,
      }),
    );

    // Glowing spoken choice underline beneath "on" (50%) or "under" (30%)
    const halfW = stripW * cands[0][1];
    const underW = stripW * cands[1][1];
    const underY = stripY + 114;

    if (uOn > 0.02 && uUn < 0.05) {
      nodes.push(
        glowingTrail(
          [
            [stripLeft, underY],
            [stripLeft + halfW * uOn, underY],
          ],
          { color: ROLE.context, width: 5.5, glow: 12, opacity: alpha },
        ),
        txt(
          'If page says "on" -> score 50% share',
          stripLeft + halfW / 2,
          underY + 48,
          28,
          ROLE.context,
          'sans',
          'center',
        ).opacity(uOn * alpha),
      );
    }
    if (uUn > 0.02) {
      nodes.push(
        glowingTrail(
          [
            [stripLeft + halfW, underY],
            [stripLeft + halfW + underW * uUn, underY],
          ],
          { color: ROLE.prob, width: 5.5, glow: 12, opacity: alpha },
        ),
        txt(
          'If page says "under" -> score 30% share',
          stripLeft + halfW + underW / 2,
          underY + 48,
          28,
          ROLE.prob,
          'sans',
          'center',
        ).opacity(uUn * alpha),
      );
    }

    if (ap > 0.1) {
      nodes.push(
        txt(
          'Evaluation waits for the real observed word, then scores its slice.',
          0,
          410,
          30,
          ROLE.observed,
          'serif',
          'center',
        )
          .glow(7, ROLE.observed)
          .opacity(ap * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.context, ROLE.observed), title, mainLayer);

  playCue(
    s,
    c,
    'read-prefix',
    (d) => s.play(readPos.to(2, { duration: d }), unroll.to(0.62, { duration: d })),
    { dur: 0.9 },
  );
  playCue(
    s,
    c,
    'deal-half',
    (d) => s.play(unroll.to(1, { duration: d }), underlineOn.to(1, { duration: d })),
    { dur: 0.85 },
  );
  playCue(s, c, 'deal-under', (d) => s.play(underlineUnder.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'ask-word', (d) => s.play(askPulse.to(1, { duration: d })), { dur: 0.75 });
}
