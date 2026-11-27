// Scene 8: Was this request over its burst limit? (Step-back prompting onto a shared ruler)
import {
  COSMOS,
  STEP_BACK_POLICY,
  STEP_BACK_REQUEST,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function stepBack(s, c) {
  const showQuestion = s.value(0);
  const showPolicy = s.value(0);
  const showJoin = s.value(0);

  const bgAura = aura(0, 20, 720, '#12325c28', '#2a1e4618');
  const title = heroTitle(['Was This Request Over', 'Its Burst Limit?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'STEP-BACK PROMPTING · PAIR SPECIFIC TRACE WITH GOVERNING POLICY',
  });

  const excess = STEP_BACK_REQUEST.perWindow - STEP_BACK_POLICY.limit;

  const live = guardedDynamic(s.value(1), () => {
    const sq = showQuestion.value;
    const sp = showPolicy.value;
    const sj = showJoin.value;
    const hasPolicy = sp > 0.5;
    const joined = sj > 0.5;

    // Ruler coordinate mapping: 0 .. 140 req -> x from -780 to +780
    const rx = (val) => -780 + (val / 140) * 1560;
    const ry = 148;
    const x100 = rx(STEP_BACK_POLICY.limit);
    const x120 = rx(STEP_BACK_REQUEST.perWindow);

    const nodes = [
      // Left card: Concrete incident trace
      glassCell(-440, -138, 830, 168, COSMOS.blue, { fill: '#10203a', glow: 6 }),
      txt(
        `SPECIFIC TRACE · REQUEST ${STEP_BACK_REQUEST.id} (HTTP ${STEP_BACK_REQUEST.code})`,
        -825,
        -188,
        26,
        COSMOS.blue,
        'mono',
        'left',
      ),
      txt(
        `Endpoint ${STEP_BACK_REQUEST.endpoint}  ·  Tier ${STEP_BACK_REQUEST.tier}  ·  60-second window`,
        -825,
        -136,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        `Observed: ${STEP_BACK_REQUEST.perWindow} requests from this client`,
        -825,
        -86,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      // Right card: Step-back policy query & result
      glassCell(
        440,
        -138,
        830,
        168,
        hasPolicy ? COSMOS.gold : sq > 0.3 ? COSMOS.amber : COSMOS.muted,
        {
          fill: hasPolicy ? '#262010' : '#12182b',
          glow: hasPolicy ? 9 : 3,
        },
      ),
      txt(
        hasPolicy ? `STEP-BACK POLICY · ${STEP_BACK_POLICY.id}` : 'STEP-BACK QUESTION',
        55,
        -188,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        hasPolicy
          ? `Endpoint ${STEP_BACK_POLICY.endpoint}  ·  Tier ${STEP_BACK_POLICY.tier}  ·  60-second window`
          : 'What burst rule governs E2 on Tier 2?',
        55,
        -136,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        hasPolicy
          ? `Limit: ${STEP_BACK_POLICY.limit} req / client / 60 s`
          : 'Search broader rule alongside trace',
        55,
        -86,
        28,
        hasPolicy ? COSMOS.gold : COSMOS.muted,
        'mono',
        'left',
      ),

      // Shared 60-second ruler stage
      txt(
        'SHARED RULER: REQUESTS PER CLIENT IN SAME 60-SECOND WINDOW (E2 · TIER 2)',
        -855,
        16,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
      line([rx(0), ry], [rx(140), ry], { stroke: COSMOS.dim, width: 4 }),

      // Observed 120 bar
      rect(x120 - rx(0), 42, { fill: COSMOS.blue, radius: 8 })
        .glow(8, COSMOS.blue)
        .at((rx(0) + x120) / 2, ry),
      txt('0', rx(0), ry + 58, 26, COSMOS.muted, 'mono'),
      txt('140', rx(140), ry + 58, 26, COSMOS.muted, 'mono'),
      txt(`${STEP_BACK_REQUEST.perWindow} req`, x120, ry + 62, 30, COSMOS.cyan, 'mono'),
    ];

    if (hasPolicy) {
      nodes.push(
        line([x100, ry - 56], [x100, ry + 42], { stroke: COSMOS.gold, width: 6 }).glow(
          10,
          COSMOS.gold,
        ),
        txt(
          `Limit ${STEP_BACK_POLICY.limit}`,
          x100 - 18,
          ry - 78,
          28,
          COSMOS.gold,
          'mono',
          'right',
        ),
      );
    }

    if (joined) {
      nodes.push(
        rect(x120 - x100, 42, { fill: COSMOS.rose, radius: 6 })
          .glow(12, COSMOS.rose)
          .at((x100 + x120) / 2, ry),
        txt(`+${excess} OVER`, x100 + 18, ry - 78, 30, COSMOS.rose, 'mono', 'left'),
      );
    }

    const bottomCol = joined ? COSMOS.emerald : COSMOS.gold;
    const bottomMsg = joined
      ? `${excess} requests above limit (120 vs 100) · verify limiter log for R17`
      : hasPolicy
        ? 'Both sources match E2, Tier 2, 60 s: compare 120 against limit 100'
        : 'Keep the exact trace and retrieve its governing policy alongside it';

    nodes.push(
      glowDot(-840, 368, { radius: 6, color: bottomCol }),
      txt(bottomMsg, -812, 370, 28, bottomCol, 'sans', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('stepback-question', () => s.play(showQuestion.to(1, { duration: 0.45 })));
  c.on('stepback-policy', () => s.play(showPolicy.to(1, { duration: 0.5 })));
  c.after('stepback-join', () =>
    s.play(showJoin.to(1, { duration: remainDuration(c, 'stepback-join', 0.45) })),
  );
}
