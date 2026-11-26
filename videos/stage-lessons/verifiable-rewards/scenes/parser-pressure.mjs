// Scene 27: Replay the two submissions (First-box vs strict single-box scan on same text)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function parserPressure(s, c) {
  const phase = s.value(0);
  const sWeak = s.value(0);
  const scanX = s.value(0);
  const sCount = s.value(0);
  const revealStrict = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#3c1b4a14');
  const title = heroTitle(['Replay the Two', 'Submissions'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'PARSER VERSION CHANGE · SAME TEXT, DIFFERENT REWARD',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sw = Math.max(0.65, sWeak.value);
    const sc = scanX.value;
    const cnt = sCount.value;
    const rs = revealStrict.value;

    const headX = -680 + sc * 520;
    const isStrictMode = sc > 0.1;

    const nodes = [
      txt(
        isStrictMode
          ? 'STRICT PARSER: REQUIRE EXACTLY 1 \\boxed{} IN ENTIRE RESPONSE'
          : 'WEAK FIRST-BOX PARSER: READ FIRST \\boxed{} == 168',
        -830,
        -192,
        26,
        isStrictMode ? COSMOS.emerald : COSMOS.amber,
        'mono',
        'left',
      ),

      // Upper row: Submission A (1 box)
      glassCell(-330, -70, 980, 124, COSMOS.emerald, { fill: '#0e2524', glow: 6, opacity: sw }),
      txt('SUBMISSION A:  \\boxed{168}', -790, -68, 30, COSMOS.emerald, 'mono', 'left').opacity(sw),
      txt(cnt > 0.3 ? '1 box' : '', 130, -68, 28, COSMOS.emerald, 'mono', 'right').opacity(cnt),

      // Lower row: Submission B (2 boxes: 168 then 148)
      glassCell(-330, 118, 980, 124, cnt > 0.3 ? COSMOS.rose : COSMOS.amber, {
        fill: cnt > 0.3 ? '#291018' : '#221a0f',
        glow: cnt > 0.3 ? 9 * pulse : 5,
        opacity: sw,
      }),
      txt(
        'SUBMISSION B:  \\boxed{168} then \\boxed{148}',
        -790,
        120,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(sw),
      txt(cnt > 0.3 ? '2 boxes!' : '', 135, 120, 28, COSMOS.rose, 'mono', 'right').opacity(cnt),

      // Right reward column (strictly withhold new scores until replay-strict!)
      glassCell(510, -70, 360, 124, rs > 0.5 || !isStrictMode ? COSMOS.emerald : COSMOS.gold, {
        fill: '#102138',
        dash: isStrictMode && rs < 0.5 ? [8, 6] : undefined,
        glow: 7,
      }),
      txt(
        !isStrictMode ? 'r = 1.0' : rs > 0.5 ? 'r = 1.0' : 'r = ?',
        510,
        -68,
        40,
        !isStrictMode || rs > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ),

      glassCell(
        510,
        118,
        360,
        124,
        rs > 0.5 ? COSMOS.rose : !isStrictMode ? COSMOS.emerald : COSMOS.gold,
        {
          fill: rs > 0.5 ? '#291018' : '#102138',
          dash: isStrictMode && rs < 0.5 ? [8, 6] : undefined,
          glow: rs > 0.5 ? 10 * pulse : 6,
        },
      ),
      txt(
        !isStrictMode ? 'r = 1.0' : rs > 0.5 ? 'r = 0.0' : 'r = ?',
        510,
        120,
        40,
        rs > 0.5 ? COSMOS.rose : !isStrictMode ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ),
    ];

    if (sc > 0.05) {
      // Top & bottom glowing scanner cursor ticks (never cross row text!)
      nodes.push(
        line([headX, -158], [headX, -138], { stroke: COSMOS.gold, width: 4.2 }).glow(
          8,
          COSMOS.gold,
        ),
        line([headX, 186], [headX, 214], { stroke: COSMOS.gold, width: 4.2 }).glow(8, COSMOS.gold),
        glowDot(headX, 218, { radius: 8, color: cnt > 0.5 ? COSMOS.rose : COSMOS.gold }),
      );
    }

    nodes.push(
      txt(
        rs > 0.5
          ? 'Checker changed while model stood still -> version verifiers & rescore groups before updating!'
          : isStrictMode
            ? 'Scanner hits 2nd box on row B -> what reward belongs on each row now?'
            : 'Weak first-box parser pays both 1.0 despite the self-contradiction',
        0,
        328,
        28,
        rs > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('replay-first', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('replay-weak', () => s.play(sWeak.to(1, { duration: 0.45 })));
  c.on('replay-scan', () => s.play(scanX.to(1, { duration: 0.9 })));
  c.on('replay-count', () => s.play(sCount.to(1, { duration: 0.45 })));
  c.after('replay-strict', () =>
    s.play(revealStrict.to(1, { duration: remainDuration(c, 'replay-strict', 0.45) })),
  );
}
