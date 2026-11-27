// Scene 2: Search the same two pages again (Conversational query rewriting)
import {
  COSMOS,
  FOLLOW_UP,
  RECOVERY_QUERY,
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

export default function rewriteForContext(s, c) {
  const phase = s.value(0);
  const showHistory = s.value(0);
  const showCarry = s.value(0);
  const showInput = s.value(0);
  const showResult = s.value(0);

  const bgAura = aura(-100, 20, 680, '#10364c28', '#1f2b5216');
  const title = heroTitle(['Search the Same', 'Two Pages Again'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.emerald,
    eyebrow: 'QUERY REWRITING · RESTORE SUBJECT WITHOUT COPYING SECRETS',
  });

  const { view: stage3d, orbit: orbit3d } = makeQueryConstellation3D(555, 20, phase, {
    targetProgress: () => showInput.value,
  });

  const scoreOverview = search(RECOVERY_QUERY, [SUPPORT_PAGES[0]])[0]?.score ?? 0;
  const scoreRecovery = search(RECOVERY_QUERY, [SUPPORT_PAGES[1]])[0]?.score ?? 0;

  const live = guardedDynamic(s.value(1), () => {
    const sh = showHistory.value;
    const sc = showCarry.value;
    const si = showInput.value;
    const sr = showResult.value;
    const rewritten = si > 0.4;
    const revealed = sr > 0.5;

    const nodes = [
      txt('3D QUERY RE-AIMING', 555, -345, 26, COSMOS.emerald, 'mono'),
      txt(
        revealed
          ? 'Rewritten query lands in Recovery guide'
          : 'Rewriting aims query at the right cluster',
        555,
        360,
        26,
        revealed ? COSMOS.emerald : COSMOS.muted,
        'sans',
      ),

      // Prior chat stays visible
      txt('CONVERSATION HISTORY', -855, -215, 26, COSMOS.gold, 'mono', 'left'),
      glassCell(-635, -138, 440, 82, sh > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: sh > 0.3 ? '#262010' : '#12192d',
        glow: sh > 0.3 ? 9 : 3,
      }),
      txt('Turn 1: "My API key leaked."', -835, -136, 26, COSMOS.gold, 'sans', 'left'),

      glassCell(-635, -36, 440, 82, COSMOS.dim, {
        fill: '#11182c',
        glow: 2,
      }),
      txt(`Turn 2: "${FOLLOW_UP}"`, -835, -34, 26, COSMOS.muted, 'sans', 'left'),

      // Golden carry arc from Turn 1 to Search Box
      glowingArc([-415, -138], [-325, -92], -36, {
        color: COSMOS.gold,
        width: 3.6,
        opacity: Math.max(0.38, sc),
        glow: 10,
      }),

      txt('STANDALONE SEARCH QUERY', -325, -215, 26, COSMOS.emerald, 'mono', 'left'),
      glassCell(-105, -88, 440, 134, rewritten ? COSMOS.emerald : COSMOS.gold, {
        fill: rewritten ? '#0d2624' : '#141d34',
        glow: rewritten ? 9 : 4,
      }),
      txt(
        rewritten ? '"How do I revoke and rotate' : 'Carry task, strip secret:',
        -300,
        -112,
        27,
        rewritten ? COSMOS.ink : COSMOS.gold,
        'sans',
        'left',
      ),
      txt(
        rewritten ? 'a leaked API key?"' : 'subject = leaked API key',
        -300,
        -62,
        27,
        rewritten ? COSMOS.emerald : COSMOS.cyan,
        'sans',
        'left',
      ),

      // Same two indexed pages
      txt('SAME TWO PAGES · SAME PERMISSIONS', -855, 44, 26, COSMOS.muted, 'mono', 'left'),

      glassCell(-370, 128, 970, 106, COSMOS.muted, {
        fill: '#11182c',
        glow: 2,
      }),
      txt(SUPPORT_PAGES[0].id.toUpperCase(), -832, 102, 26, COSMOS.muted, 'mono', 'left'),
      txt(SUPPORT_PAGES[0].text, -832, 148, 28, COSMOS.ink, 'sans', 'left'),
      txt(
        revealed ? `${scoreOverview} matches` : 'matches: ?',
        92,
        128,
        28,
        revealed ? COSMOS.muted : COSMOS.gold,
        'mono',
        'right',
      ),

      glassCell(-370, 256, 970, 106, revealed ? COSMOS.emerald : COSMOS.cyan, {
        fill: revealed ? '#0d2723' : '#11182c',
        glow: revealed ? 10 : 3,
      }),
      txt(SUPPORT_PAGES[1].id.toUpperCase(), -832, 230, 26, COSMOS.emerald, 'mono', 'left'),
      txt(SUPPORT_PAGES[1].text, -832, 276, 28, COSMOS.ink, 'sans', 'left'),
      txt(
        revealed ? `${scoreRecovery} matches (WINS)` : 'matches: ?',
        92,
        256,
        28,
        revealed ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'right',
      ),

      glowDot(-840, 368, { radius: 6, color: revealed ? COSMOS.emerald : COSMOS.gold }),
      txt(
        revealed
          ? 'Recovery guide wins (6 matches) · answer model keeps original chat'
          : rewritten
            ? 'With the standalone rewrite, which page comes first now?'
            : 'Carry the missing subject from Turn 1 without copying the secret',
        -812,
        370,
        28,
        revealed ? COSMOS.emerald : COSMOS.gold,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, stage3d, live);
  runPhase(s, c, phase, 12);
  orbit3d(s, c);

  c.on('rewrite-history', () => s.play(showHistory.to(1, { duration: 0.4 })));
  c.on('rewrite-carry', () => s.play(showCarry.to(1, { duration: 0.45 })));
  c.on('rewrite-input', () => s.play(showInput.to(1, { duration: 0.55 })));
  c.after('rewrite-result', () =>
    s.play(showResult.to(1, { duration: remainDuration(c, 'rewrite-result', 0.45) })),
  );
}
