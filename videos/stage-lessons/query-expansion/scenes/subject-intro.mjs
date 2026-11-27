// Scene 1: Which page will this search find? (Missing conversational subject trap)
import {
  COSMOS,
  FOLLOW_UP,
  SUPPORT_PAGES,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  makeQueryConstellation3D,
  remainDuration,
  runPhase,
  search,
  txt,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const phase = s.value(0);
  const showFollowUp = s.value(0);
  const showSearch = s.value(0);
  const showResult = s.value(0);

  const bgAura = aura(-120, 20, 680, '#12365c28', '#2a1c5216');
  const title = heroTitle(['Which Page Will', 'This Search Find?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'MISSING SUBJECT · FOLLOW-UP SENT ALONE',
  });

  const { view: stage3d, orbit: orbit3d } = makeQueryConstellation3D(555, 20, phase, {
    targetProgress: () => 0,
  });

  const scoreOverview = search(FOLLOW_UP, [SUPPORT_PAGES[0]])[0]?.score ?? 0;
  const scoreRecovery = search(FOLLOW_UP, [SUPPORT_PAGES[1]])[0]?.score ?? 0;

  const live = guardedDynamic(s.value(1), () => {
    const sf = showFollowUp.value;
    const ss = showSearch.value;
    const sr = showResult.value;
    const revealed = sr > 0.5;

    const nodes = [
      // Right 3D stage caption
      txt('3D QUERY NEIGHBORHOOD', 555, -345, 26, COSMOS.cyan, 'mono'),
      txt(
        revealed ? 'Raw query pulls into Account overview' : 'Two doc neighborhoods in index',
        555,
        360,
        26,
        revealed ? COSMOS.amber : COSMOS.muted,
        'sans',
      ),

      // Support chat turns (left column)
      txt('SUPPORT CHAT (LEFT BEHIND)', -855, -215, 26, COSMOS.muted, 'mono', 'left'),
      glassCell(-635, -138, 440, 82, revealed ? COSMOS.gold : COSMOS.dim, {
        fill: '#12192d',
        glow: revealed ? 8 : 2,
      }),
      txt(
        'Turn 1: "My API key leaked."',
        -835,
        -136,
        26,
        revealed ? COSMOS.gold : COSMOS.ink,
        'sans',
        'left',
      ),

      glassCell(-635, -36, 440, 82, sf > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#102138',
        glow: sf > 0.3 ? 8 : 3,
      }),
      txt(`Turn 2: "${FOLLOW_UP}"`, -835, -34, 26, COSMOS.cyan, 'sans', 'left'),

      // Search input box (middle-left)
      glowingArc([-415, -36], [-325, -88], -26, {
        color: COSMOS.cyan,
        width: 3.4,
        opacity: Math.max(0.45, ss),
        glow: 9,
      }),
      txt('SEARCH BOX INPUT', -325, -215, 26, COSMOS.cyan, 'mono', 'left'),
      glassCell(-105, -88, 440, 134, ss > 0.3 ? COSMOS.cyan : COSMOS.blue, {
        fill: '#0f2036',
        glow: ss > 0.3 ? 9 : 4,
      }),
      txt(`"${FOLLOW_UP}"`, -300, -104, 30, COSMOS.ink, 'sans', 'left'),
      txt('Count each shared word once', -300, -56, 26, COSMOS.muted, 'sans', 'left'),

      // Two indexed support pages
      txt('INDEXED SUPPORT PAGES', -855, 44, 26, COSMOS.muted, 'mono', 'left'),

      // Page 1: Account overview
      glassCell(-370, 128, 970, 106, revealed ? COSMOS.amber : COSMOS.muted, {
        fill: revealed ? '#261b10' : '#11182c',
        glow: revealed ? 9 : 3,
      }),
      txt(
        SUPPORT_PAGES[0].id.toUpperCase(),
        -832,
        102,
        26,
        revealed ? COSMOS.amber : COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(SUPPORT_PAGES[0].text, -832, 148, 28, COSMOS.ink, 'sans', 'left'),
      txt(
        revealed ? `${scoreOverview} matches (WINS)` : 'matches: ?',
        92,
        128,
        28,
        revealed ? COSMOS.amber : COSMOS.gold,
        'mono',
        'right',
      ),

      // Page 2: Recovery guide
      glassCell(-370, 256, 970, 106, revealed ? COSMOS.rose : COSMOS.muted, {
        fill: revealed ? '#26121c' : '#11182c',
        glow: revealed ? 7 : 3,
      }),
      txt(SUPPORT_PAGES[1].id.toUpperCase(), -832, 230, 26, COSMOS.emerald, 'mono', 'left'),
      txt(SUPPORT_PAGES[1].text, -832, 276, 28, COSMOS.ink, 'sans', 'left'),
      txt(
        revealed ? `${scoreRecovery} matches` : 'matches: ?',
        92,
        256,
        28,
        revealed ? COSMOS.rose : COSMOS.gold,
        'mono',
        'right',
      ),

      // Stable bottom status line
      glowDot(-840, 368, { radius: 6, color: revealed ? COSMOS.amber : COSMOS.gold }),
      txt(
        revealed
          ? 'Matches "what", "I", "do" -> "API key" stayed behind in chat'
          : 'Count each shared word once: which page wins?',
        -812,
        370,
        28,
        revealed ? COSMOS.amber : COSMOS.gold,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, stage3d, live);
  runPhase(s, c, phase, 12);
  orbit3d(s, c);

  c.on('intro-follow-up', () => s.play(showFollowUp.to(1, { duration: 0.45 })));
  c.on('intro-search', () => s.play(showSearch.to(1, { duration: 0.45 })));
  c.after('intro-result', () =>
    s.play(showResult.to(1, { duration: remainDuration(c, 'intro-result', 0.45) })),
  );
}
