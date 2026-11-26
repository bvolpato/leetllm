// Scene 0: intro - "Find the running dog"
// Pure Cinema opening: bounding puppy, sleeping dog, and sunlit sky in dark-cosmos viewports,
// exact-word hit beams, strict prediction hold, and post-reveal contrastive match beacons.
import { circle, dot, ellipse, group, linear, rect, svgPath } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  hexAlpha,
  lumBar,
  playAfter,
  playOn,
  rule,
  safeDur,
  txt,
  verifyInvariant,
} from '../parts.mjs';
import { CAPTIONS, QUERY } from '../caption-match.mjs';

const solid = (path, color) => svgPath(path, { fill: color, stroke: null });

function runningPuppy(stride) {
  const phase = Math.cos(2 * Math.PI * stride);
  const fur = COSMOS.ink;
  const patch = ROLE.focus;
  function leg(x, reach, color) {
    const paw = x + reach;
    return solid(
      `M ${x - 15} 3 Q ${x - 20} 28 ${paw - 8} 61 Q ${paw - 5} 67 ${paw + 10} 65
       Q ${paw + 19} 62 ${paw + 8} 55 L ${x + reach * 0.55 + 8} 31 Q ${x + 20} 13 ${x + 13} 0 Z`,
      color,
    );
  }
  return group(
    leg(-59, 50 * phase, COSMOS.dim),
    leg(50, -48 * phase, COSMOS.dim),
    leg(-65, -52 * phase, fur),
    leg(50, 55 * phase, fur),
    solid('M -70 -22 Q -98 -22 -119 -50 Q -104 -47 -87 -41 Q -69 -33 -49 -33 Z', patch),
    solid(
      'M -82 -24 C -65 -48 -17 -35 15 -36 Q 42 -39 54 -64 Q 59 -87 82 -85 Q 104 -87 112 -65 L 140 -57 Q 145 -43 129 -35 Q 119 -29 104 -31 Q 93 4 67 17 Q 41 32 12 15 Q -10 4 -39 20 Q -69 33 -85 12 Q -97 -5 -82 -24 Z',
      fur,
    ),
    solid('M 63 -76 Q 45 -78 33 -66 Q 19 -56 3 -61 Q 12 -43 32 -44 Q 57 -43 71 -69 Z', patch),
    dot(4, COSMOS.bg).at(98, -68),
    ellipse(8, 6, { fill: COSMOS.bg, stroke: null }).at(137, -56),
  );
}

function sleepingDog() {
  const fur = COSMOS.ink;
  const patch = ROLE.focus;
  return group(
    ellipse(165, 27, { fill: '#223363', stroke: null }).at(0, 49),
    solid(
      'M -131 20 Q -135 -38 -77 -55 Q -31 -68 12 -43 Q 49 -25 55 9 Q 53 42 18 44 L -93 43 Q -122 43 -131 20 Z',
      fur,
    ),
    solid(
      'M -126 2 Q -127 31 -89 38 Q -65 42 -41 24 Q -59 51 -97 46 Q -133 45 -138 26 Q -142 10 -126 2 Z',
      patch,
    ),
    solid(
      'M 7 -14 Q 15 -53 57 -54 Q 95 -55 102 -22 L 130 -9 Q 146 -3 143 11 Q 139 25 109 28 L 57 32 Q 17 31 7 -14 Z',
      fur,
    ),
    solid('M 24 -44 Q -2 -24 3 6 Q 4 24 19 25 Q 46 25 50 -30 Q 48 -51 24 -44 Z', patch),
    svgPath('M 71 -17 Q 79 -10 87 -17', { stroke: COSMOS.bg, width: 4 }),
    ellipse(8, 6, { fill: COSMOS.bg, stroke: null }).at(139, 0),
    ellipse(37, 9, { fill: fur, stroke: null }).at(78, 36),
  );
}

function sunlitSky() {
  return group(
    circle(39, { fill: ROLE.focus, stroke: null }).at(74, -47).glow(14, ROLE.focus),
    solid(
      'M -130 44 Q -152 41 -147 17 Q -143 -1 -118 0 Q -116 -28 -88 -36 Q -55 -44 -36 -17 Q -14 -30 5 -9 Q 11 -1 12 7 Q 43 8 42 28 Q 41 45 22 45 Z',
      COSMOS.ink,
    ),
  );
}

export default function intro(s, c) {
  const terms = QUERY.toLowerCase()
    .split(' ')
    .filter((w) => ['dog', 'running'].includes(w));
  const hits = CAPTIONS.map(
    (cap) => terms.filter((w) => cap.toLowerCase().split(' ').includes(w)).length,
  );
  verifyInvariant(hits.join(',') === '0,1,0', 'exact-word counts must be 0,1,0');

  const stride = s.value(0);
  const showWordRule = s.value(0);
  const showHits = s.value(0);
  const showChoose = s.value(1);
  const puppyMatch = s.value(0);
  const sleeperRole = s.value(0);
  const trainGoal = s.value(0);

  const laneXs = [-585, 0, 585];
  const frameY = -40;
  const frameW = 520;
  const frameH = 330;

  // Floating query header
  const queryHeader = group(
    txt('SEARCH QUERY', 0, -430, 26, COSMOS.muted, 'mono', 'center'),
    txt(`"${QUERY}"`, 0, -365, 62, ROLE.anchor, 'serif', 'center').glow(9, ROLE.anchor),
  );

  // Three dark-cosmos film viewports with live puppy motion & reactive semantic edge glows
  const stageLayer = guardedDynamic(s.value(1), () => {
    const t = stride.value;
    const pm = puppyMatch.value;
    const sr = sleeperRole.value;
    const hw = showHits.value;
    const nodes = [];

    for (let i = 0; i < 3; i++) {
      const cx = laneXs[i];
      const strokeCol =
        i === 0 && pm > 0.3
          ? ROLE.positive
          : i === 1 && sr > 0.3
            ? ROLE.competitor
            : i === 1 && hw > 0.3 && pm < 0.3
              ? ROLE.focus
              : '#364a78';
      const glowAmt =
        (i === 0 && pm > 0.3) || (i === 1 && sr > 0.3) || (i === 1 && hw > 0.3 && pm < 0.3)
          ? 12
          : 3;

      // Film viewport backdrop
      nodes.push(
        rect(frameW, frameH, {
          fill: i === 2 ? '#16294f99' : '#0f1629cc',
          stroke: strokeCol,
          width: glowAmt > 5 ? 3.4 : 2.2,
          radius: 18,
        })
          .at(cx, frameY)
          .glow(glowAmt, strokeCol),
      );

      // Animated clip art inside each viewport
      if (i === 0) {
        const px = -42 + Math.min(t, 3) * 26;
        const py = 4 - 15 * Math.cos(2 * Math.PI * t);
        nodes.push(group(runningPuppy(t).at(px, py)).at(cx, frameY).scale(1.18, [cx, frameY]));
      } else if (i === 1) {
        nodes.push(group(sleepingDog()).at(cx, frameY).scale(1.18, [cx, frameY]));
      } else {
        nodes.push(group(sunlitSky()).at(cx, frameY).scale(1.18, [cx, frameY]));
      }

      // Floating caption below each viewport
      const capCol =
        i === 0 && pm > 0.3 ? ROLE.positive : i === 1 && sr > 0.3 ? ROLE.competitor : COSMOS.ink;
      nodes.push(txt(CAPTIONS[i], cx, 185, 40, capCol, 'serif', 'center'));

      // Status line below caption (strictly reflects current state, zero overlap)
      const statusY = 258;
      if (i === 0 && pm > 0.05) {
        nodes.push(
          txt('Match', cx, statusY, 36, ROLE.positive, 'mono', 'center')
            .glow(8, ROLE.positive)
            .opacity(pm),
        );
      } else if (i === 1 && sr > 0.05) {
        nodes.push(
          txt('Competing caption', cx, statusY, 34, ROLE.competitor, 'mono', 'center')
            .glow(7, ROLE.competitor)
            .opacity(sr),
        );
      } else if (hw > 0.05) {
        const hideThis = (i === 0 && pm > 0.05) || (i === 1 && sr > 0.05) || (i === 2 && pm > 0.05);
        if (!hideThis) {
          const hitText = hits[i] === 1 ? '1 exact hit ("dog")' : '0 exact hits';
          const hitCol = hits[i] === 1 ? ROLE.focus : COSMOS.muted;
          nodes.push(txt(hitText, cx, statusY, 30, hitCol, 'mono', 'center').opacity(hw));
        }
      }
    }

    // Floating footer prompt / rule / training goal (mutually exclusive via opacity)
    const footY = 390;
    nodes.push(rule(-780, 326, 780, 326, COSMOS.rule, 1.6).opacity(0.55));
    if (trainGoal.value > 0.05) {
      nodes.push(
        txt(
          'Contrastive goal: score "A puppy runs" higher than "A dog sleeps"',
          0,
          footY,
          36,
          ROLE.positive,
          'sans',
          'center',
        )
          .glow(7, ROLE.positive)
          .opacity(trainGoal.value),
      );
    } else if (showWordRule.value > 0.05) {
      nodes.push(
        txt('Exact words checked:  dog   ·   running', 0, footY, 36, ROLE.focus, 'mono', 'center')
          .glow(6, ROLE.focus)
          .opacity(showWordRule.value),
      );
    } else if (showChoose.value > 0.05) {
      nodes.push(
        txt('Which clip matches this search?', 0, footY, 40, COSMOS.ink, 'serif', 'center').opacity(
          showChoose.value,
        ),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.positive), queryHeader, stageLayer);

  // Initial puppy stride animation
  c.at(0.1, () => {
    s.play(stride.to(3, { duration: safeDur(c, c.start + 0.1, 2.5), ease: linear }));
  });

  // Beat 0: exact words rule & counts
  playOn(
    s,
    c,
    'intro-words',
    (d) => [showChoose.to(0, { duration: d * 0.4 }), showWordRule.to(1, { duration: d })],
    0.45,
  );
  playOn(s, c, 'intro-word-hit', (d) => showHits.to(1, { duration: d }), 0.45);

  // Beat 1: watch the clips -> prediction hold!
  playOn(
    s,
    c,
    'intro-choose',
    (d) => [
      showWordRule.to(0, { duration: Math.min(0.25, d) }),
      showChoose.to(1, { duration: Math.min(0.4, d) }),
      stride.to(5, { duration: d, ease: linear }),
    ],
    1.5,
  );

  // Beat 2: post-reveal answers (strictly AFTER cues!)
  playAfter(
    s,
    c,
    'intro-puppy',
    (d) => [showChoose.to(0, { duration: d * 0.4 }), puppyMatch.to(1, { duration: d })],
    0.45,
  );
  playAfter(s, c, 'intro-sleeper', (d) => sleeperRole.to(1, { duration: d }), 0.45);

  // Beat 3: training pair goal
  playAfter(s, c, 'intro-train', (d) => trainGoal.to(1, { duration: d }), 0.5);
}
