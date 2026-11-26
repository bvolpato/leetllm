// Scene 25: Can a word count pick the better answer? (3/3 length shortcut vs 1/2 controlled length-matched audit)
import {
  CONTROLLED_CASES,
  COSMOS,
  SHORTCUT_PAIRS,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
  wordCount,
} from '../parts.mjs';

export default function evaluation(s, c) {
  const phase = s.value(0);
  const sRule = s.value(0);
  const sCounts = s.value(0);
  const sRoute = s.value(0);
  const sFirst = s.value(0);
  const sNext = s.value(0);
  const sSecond = s.value(0);
  const sScore = s.value(0);

  const bgAura = aura(0, 20, 620, '#3c1b2a24', '#14385c24');
  const title = heroTitle(['Can a Word Count Pick', 'the Better Answer?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'PROXY SHORTCUT AUDIT · LENGTH-MATCHED CONTROLLED EVALUATIONS',
  });

  const trainCounts = SHORTCUT_PAIRS.map((r) => [wordCount(r.chosen), wordCount(r.other)]);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const rl = Math.max(0.75, sRule.value);
    const ct = sCounts.value;
    const rt = sRoute.value;
    const f1 = sFirst.value;
    const nx = sNext.value;
    const f2 = sSecond.value;
    const sc = sScore.value;

    const nodes = [
      // LEFT COLUMN: 3 stored training pairs -> "pick shorter" gets 3/3
      glassCell(-465, -20, 770, 390, COSMOS.amber, { fill: '#171522', glow: 5, opacity: rl }),
      txt('SHORTCUT RULE: "PICK SHORTER"', -465, -172, 28, COSMOS.amber, 'mono'),
      txt('3 STORED PAIRS  ->  3 / 3 MATCHES (0 WORDS READ)', -465, -124, 26, COSMOS.muted, 'mono'),
    ];

    SHORTCUT_PAIRS.forEach((row, i) => {
      const cy = -44 + i * 82;
      const [wC, wO] = trainCounts[i];
      nodes.push(
        glassCell(-465, cy, 690, 66, ct > 0.2 ? COSMOS.emerald : COSMOS.dim, {
          fill: '#101d32',
          glow: 3,
        }),
        txt(
          `${row.id}:  ${wC} words  vs  ${wO} words`,
          -780,
          cy + 2,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt('MATCH', -150, cy + 2, 26, COSMOS.emerald, 'mono', 'right'),
      );
    });

    // RIGHT COLUMN: Controlled 8-word vs 8-word pairs (tie-break picks X)
    const h1 = CONTROLLED_CASES[0]; // preferred=1 (Y left)
    const h2 = CONTROLLED_CASES[1]; // preferred=0 (X five)

    nodes.push(
      glassCell(430, -110, 820, 210, f1 > 0.4 ? COSMOS.rose : COSMOS.cyan, {
        fill: f1 > 0.4 ? '#28101a' : '#0f2138',
        glow: rt > 0.2 ? 8 * pulse : 4,
      }),
      txt(
        'CONTROL H1: STATION (BOTH 8 WORDS · TIE -> X)',
        55,
        -180,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(`X: "${h1.bad}"`, 55, -128, 26, f1 > 0.4 ? COSMOS.rose : COSMOS.ink, 'sans', 'left'),
      txt(`Y: "${h1.good}"`, 55, -80, 26, f1 > 0.4 ? COSMOS.emerald : COSMOS.ink, 'sans', 'left'),
      txt(
        f1 > 0.4
          ? 'ANSWER: Y GOES LEFT · RULE PICKS X -> MISS!'
          : 'Facing north: X or Y toward cafe? [ ? ]',
        55,
        -30,
        26,
        f1 > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(430, 128, 820, 210, f2 > 0.4 ? COSMOS.emerald : COSMOS.dim, {
        fill: f2 > 0.4 ? '#0e2624' : '#12182b',
        glow: nx > 0.2 ? 8 * pulse : 3,
        opacity: Math.max(0.75, nx),
      }),
      txt('CONTROL H2: "2 + 3" (BOTH 8 WORDS · TIE -> X)', 55, 58, 26, COSMOS.cyan, 'mono', 'left'),
      txt(`X: "${h2.good}"`, 55, 110, 26, f2 > 0.4 ? COSMOS.emerald : COSMOS.ink, 'sans', 'left'),
      txt(`Y: "${h2.bad}"`, 55, 158, 26, f2 > 0.4 ? COSMOS.rose : COSMOS.ink, 'sans', 'left'),
      txt(
        f2 > 0.4
          ? 'ANSWER: X GIVES FIVE  ·  RULE PICKS X BY POSITION'
          : 'Which 8-word reply earns the vote?  [ ? ]',
        55,
        208,
        26,
        f2 > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),

      // Bottom scorecard
      glassCell(0, 346, 1680, 110, sc > 0.3 ? COSMOS.gold : COSMOS.dim, {
        fill: sc > 0.3 ? '#221c0e' : '#12182b',
        glow: sc > 0.3 ? 9 * pulse : 3,
      }),
      txt(
        sc > 0.3
          ? 'CONTROLLED SCORE:  SHORTCUT 1 / 2 (BY POSITION)   vs   CONTENT REVIEWER 2 / 2  ·  ALWAYS BLIND ORDER'
          : 'A length shortcut fits training votes 3/3 without understanding a single turn or sum',
        0,
        348,
        26,
        sc > 0.3 ? COSMOS.gold : COSMOS.muted,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('length-rule', () =>
    s.play(sRule.to(1, { duration: remainDuration(c, 'length-rule', 0.45) })),
  );
  c.on('length-counts', () =>
    s.play(sCounts.to(1, { duration: remainDuration(c, 'length-counts', 0.5) })),
  );
  c.on('audit-route', () =>
    s.play(sRoute.to(1, { duration: remainDuration(c, 'audit-route', 0.5) })),
  );
  c.after('audit-first', () =>
    s.play(sFirst.to(1, { duration: remainAfterDuration(c, 'audit-first', 0.45) })),
  );
  c.on('audit-next', () => s.play(sNext.to(1, { duration: remainDuration(c, 'audit-next', 0.5) })));
  c.after('audit-second', () =>
    s.play(sSecond.to(1, { duration: remainAfterDuration(c, 'audit-second', 0.45) })),
  );
  c.on('audit-score', () =>
    s.play(sScore.to(1, { duration: remainDuration(c, 'audit-score', 0.5) })),
  );
}
