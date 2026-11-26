// Scene 1: intro: "Who chased whom?"
// Neon vector dog & cat portraits bridged by a luminous animated chase trajectory,
// paired with floating word-order sentences and a shared bag-of-words tally.
import { dot, group, line, linear, svgPath } from 'vizmatic/stage';
import {
  CAT_TRACE,
  COSMOS,
  DOG_TRACE,
  ROLE,
  aura,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  playCue,
  runPhase,
  tokenPill,
  txt,
} from '../parts.mjs';

function portrait(animal) {
  const color = animal === 'dog' ? ROLE.dog : ROLE.cat;
  const face = (d) => svgPath(d, { fill: color, stroke: color, width: 3 }).opacity(0.92);
  const detail = (d) => svgPath(d, { fill: null, stroke: COSMOS.bg, width: 7 });
  const eyes = [-42, 42].map((x) => dot(9, COSMOS.bg).at(x, -16));
  const nose = svgPath('M -19 14 Q 0 6 19 14 Q 15 29 0 34 Q -15 29 -19 14 Z', {
    fill: COSMOS.bg,
    stroke: null,
  });
  const mouth = detail('M 0 30 L 0 43 Q -14 57 -27 44 M 0 43 Q 14 57 27 44');
  if (animal === 'dog') {
    const head = face(
      'M -77 -73 Q -42 -118 19 -103 Q 65 -108 89 -61 Q 112 -23 87 46 Q 79 91 36 98 Q 0 124 -36 98 Q -87 94 -95 40 Q -110 -22 -77 -73 Z',
    ).glow(10, color);
    const ears = [-1, 1].map((side) =>
      svgPath(
        'M 64 -77 Q 96 -105 124 -70 Q 157 -33 140 24 Q 130 62 102 44 Q 80 26 81 -9 Q 81 -54 64 -77 Z',
        { fill: color, stroke: COSMOS.bg, width: 6 },
      ).scale([side, 1], [0, 0]),
    );
    return group(head, ...ears, ...eyes, nose, mouth);
  }
  const head = face(
    'M -92 -38 L -102 -113 Q -103 -124 -92 -117 L -38 -82 Q 0 -96 41 -82 L 92 -117 Q 105 -124 102 -108 L 94 -34 Q 123 8 91 57 Q 67 95 11 107 Q 0 113 -11 107 Q -66 95 -92 58 Q -120 22 -92 -38 Z',
  ).glow(10, color);
  const ears = detail('M -82 -90 L -74 -61 L -52 -72 M 82 -90 L 74 -61 L 52 -72');
  const whiskers = [-1, 1].flatMap((side) =>
    [14, 37].map((y, i) =>
      line([side * 51, y], [side * 131, y + (i ? 17 : -13)], { stroke: color, width: 6 }),
    ),
  );
  return group(head, ...whiskers, ears, ...eyes, nose, mouth);
}

function sentenceStrip(words, y, highlightActor) {
  const xs = [-370, -185, 0, 185, 360];
  return words.map((word, i) => {
    const isDog = word === 'dog';
    const isCat = word === 'cat';
    const col = isDog ? ROLE.dog : isCat ? ROLE.cat : COSMOS.ink;
    const label = word + (i === words.length - 1 ? '.' : '');
    const node = txt(label, xs[i], y, 52, col, 'serif', 'center');
    if (highlightActor && i === 1) {
      node.glow(10, col);
    }
    return node;
  });
}

export default function intro(s, c) {
  const title = heroTitle(['Who chased', 'whom?'], {
    x: -850,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: ROLE.dog,
  });

  const dogX = -500;
  const catX = 500;
  const heroY = -125;

  const dogAura = aura(dogX, heroY, 260, `${ROLE.dog}32`, '#07091000');
  const catAura = aura(catX, heroY, 260, `${ROLE.cat}32`, '#07091000');
  const dogNode = portrait('dog').scale(1.18).at(dogX, heroY);
  const catNode = portrait('cat').scale(1.18).at(catX, heroY);
  const verbLabel = txt('chased', 0, heroY - 90, 50, COSMOS.ink, 'serif', 'center');

  // Dynamic chase trajectory: dir = 1 (dog -> cat), dir = -1 (cat -> dog)
  const dir = s.value(1);
  const progress = s.value(0.12);
  const phase = s.value(0);
  const showSecond = s.value(0);
  const showTally = s.value(0);
  const actorFocus = s.value(0); // 0 = none, 1 = dog actor, 2 = cat actor

  const chaseBeam = guardedDynamic(
    () => 1,
    () => {
      const d = dir.value >= 0 ? 1 : -1;
      const p = Math.max(0.06, Math.min(1, progress.value));
      const col = d > 0 ? ROLE.dog : ROLE.cat;
      const xStart = d > 0 ? -310 : 310;
      const xEnd = d > 0 ? 310 : -310;
      const lift = d > 0 ? -36 : 36;
      const pts = [];
      const steps = 28;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * p;
        const u = 1 - t;
        const mx = 0;
        const my = heroY + lift;
        const x = u * u * xStart + 2 * u * t * mx + t * t * xEnd;
        const y = u * u * heroY + 2 * u * t * my + t * t * heroY;
        pts.push([x, y]);
      }
      const head = pts.at(-1);
      const prev = pts[Math.max(0, pts.length - 3)];
      const ang = Math.atan2(head[1] - prev[1], head[0] - prev[0]);
      const tipLen = 28;
      const wingA = [
        head[0] - tipLen * Math.cos(ang - 0.45),
        head[1] - tipLen * Math.sin(ang - 0.45),
      ];
      const wingB = [
        head[0] - tipLen * Math.cos(ang + 0.45),
        head[1] - tipLen * Math.sin(ang + 0.45),
      ];
      const pulseT = (phase.value * 0.45) % 1;
      const pu = 1 - pulseT * p;
      const pt = pulseT * p;
      const px = pu * pu * xStart + 2 * pu * pt * 0 + pt * pt * xEnd;
      const py = pu * pu * heroY + 2 * pu * pt * (heroY + lift) + pt * pt * heroY;
      return [
        glowRing(d > 0 ? dogX : catX, heroY, 152, col, {
          width: 3,
          glow: 10,
          fillOpacity: 0.04,
          opacity: 0.72,
        }),
        glowingTrail(pts, { color: col, width: 6.5, glow: 14 }),
        glowingTrail([wingA, head, wingB], { color: col, width: 5.5, glow: 12 }),
        glowDot(px, py, { radius: 7, color: COSMOS.ink, glow: 14 }),
      ];
    },
  );

  // Sentences and actor underlines
  const firstSentence = group(...sentenceStrip(DOG_TRACE.words, 100, false));
  const secondSentenceLayer = guardedDynamic(showSecond, (alpha) =>
    sentenceStrip(CAT_TRACE.words, 212, false).map((n) => n.opacity(alpha)),
  );

  const actorHighlightLayer = guardedDynamic(actorFocus, (v) => {
    const isDog = v < 1.5;
    const col = isDog ? ROLE.dog : ROLE.cat;
    const lineY = isDog ? 156 : 268;
    const labelY = isDog ? 46 : 302;
    const op = isDog ? Math.min(1, v) : Math.min(1, v - 1);
    return [
      glowingTrail(
        [
          [-250, lineY],
          [-120, lineY],
        ],
        { color: col, width: 5, glow: 12, opacity: op },
      ),
      txt('actor before verb', -185, labelY, 26, col, 'mono', 'center').opacity(op),
    ];
  });

  // Bag-of-words tally (count-question)
  const counts = new Map();
  for (const w of DOG_TRACE.words.map((x) => x.toLowerCase())) {
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  const entries = Array.from(counts.entries());
  const tallyLayer = guardedDynamic(showTally, (alpha) => {
    const nodes = [
      txt('Word counts (same):', -845, 365, 28, COSMOS.muted, 'sans', 'left').opacity(alpha),
    ];
    entries.forEach(([word, count], i) => {
      const col = word === 'dog' ? ROLE.dog : word === 'cat' ? ROLE.cat : ROLE.input;
      nodes.push(
        tokenPill(`${word} × ${count}`, -235 + i * 265, 365, col, {
          w: 210,
          h: 54,
          size: 28,
          opacity: alpha,
          font: 'mono',
        }),
      );
    });
    return nodes;
  });

  s.add(
    cinemaAtmosphere(ROLE.dog, ROLE.cat),
    dogAura,
    catAura,
    title,
    dogNode,
    catNode,
    verbLabel,
    chaseBeam,
    firstSentence,
    secondSentenceLayer,
    actorHighlightLayer,
    tallyLayer,
  );

  runPhase(s, c, phase, 8, 0.05);
  c.at(0.05, () => s.play(progress.to(1, { duration: 1.25, ease: linear })));

  playCue(
    s,
    c,
    'reversed-sentence',
    (d) => {
      dir.set(-1);
      progress.set(0.08);
      s.play(showSecond.to(1, { duration: Math.min(0.45, d) }), progress.to(1, { duration: d }));
    },
    { dur: 0.85 },
  );

  playCue(s, c, 'count-question', (d) => s.play(showTally.to(1, { duration: d })), { dur: 0.55 });

  playCue(
    s,
    c,
    'actor-position',
    (d) => {
      dir.set(1);
      progress.set(0.1);
      s.play(actorFocus.to(1, { duration: Math.min(0.35, d) }), progress.to(1, { duration: d }));
    },
    { dur: 0.65 },
  );

  playCue(
    s,
    c,
    'actor-role-reverses',
    (d) => {
      dir.set(-1);
      progress.set(0.1);
      s.play(actorFocus.to(2, { duration: Math.min(0.35, d) }), progress.to(1, { duration: d }));
    },
    { dur: 0.65 },
  );
}
