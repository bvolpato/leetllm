// Scene 3: Where does a six-word window end? (Fixed window size 6, overlap 2, stride 4)
import {
  COSMOS,
  RUNBOOK_WORDS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function fixedWindows(s, c) {
  const phase = s.value(0);
  const showSix = s.value(0);
  const showSlide = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2a1c5216');
  const title = heroTitle(['Where Does a', '6-Word Window End?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'FIXED-WIDTH WINDOWS · SIZE = 6 · OVERLAP = 2 · STRIDE = 6 - 2 = 4',
  });

  const firstTen = RUNBOOK_WORDS.slice(0, 10);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const s6 = showSix.value;
    const s4 = showSlide.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      txt(
        'FIRST 10 WORDS OF THE 17-WORD PAGE (INDEXED 1..10)',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    // 10 word tiles in one crisp horizontal ribbon
    firstTen.forEach((word, i) => {
      const cx = -765 + i * 170;
      const inW1 = i < 6;
      const inW2 = i >= 4 && i < 10;
      const inBoth = inW1 && inW2;
      const col =
        s4 > 0.4
          ? inBoth
            ? COSMOS.gold
            : inW2
              ? COSMOS.emerald
              : COSMOS.cyan
          : inW1
            ? COSMOS.cyan
            : COSMOS.muted;
      nodes.push(
        rect(158, 78, {
          fill: inBoth && s4 > 0.4 ? '#261e10' : inW1 ? '#10213b' : '#12182b',
          stroke: col,
          width: inBoth && s4 > 0.4 ? 3 : 2,
          radius: 10,
        })
          .at(cx, -110)
          .opacity(0.95),
        txt(`${i + 1}`, cx, -130, 26, COSMOS.muted, 'mono'),
        txt(word.replace('.', ''), cx, -94, 26, col, 'mono'),
      );
    });

    // Window 1 bracket [1..6] & Window 2 bracket [5..10]
    nodes.push(
      glassCell(-440, 80, 820, 178, s6 > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: s6 > 0.3 ? 8 : 3,
      }),
      txt('WINDOW 1: WORDS 1..6 (SIZE = 6)', -820, 22, 26, COSMOS.cyan, 'mono', 'left'),
      txt('"Rollback failure page on-call within 15"', -820, 68, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        s4 > 0.4
          ? 'Has "15" only -> "minutes" sits at word 7 (cut off!)'
          : 'Which unit of time can this 6-word hit cite?  ?',
        -820,
        118,
        26,
        s4 > 0.4 ? COSMOS.rose : COSMOS.gold,
        'sans',
        'left',
      ),

      glassCell(455, 80, 820, 178, s4 > 0.4 ? COSMOS.emerald : COSMOS.muted, {
        fill: s4 > 0.4 ? '#0e2824' : '#12182b',
        glow: s4 > 0.4 ? 9 * pulse : 2,
      }),
      txt(
        'WINDOW 2: WORDS 5..10 (STRIDE = 4, OVERLAP = 2)',
        75,
        22,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        s4 > 0.4
          ? '"within 15 minutes with deploy ID"'
          : 'Slide forward by stride = 6 - 2 = 4 words',
        75,
        68,
        26,
        s4 > 0.4 ? COSMOS.emerald : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        s4 > 0.4
          ? 'Overlap [5..6] = "within 15" | Trigger left in Hit 1!'
          : 'Real indexes measure width with embedding tokenizer',
        75,
        118,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),

      glowDot(-840, 355, { radius: 6, color: COSMOS.gold }),
      txt(
        'Stride = width - overlap (6 - 2 = 4): sliding by 4 moves start from word 1 to word 5',
        -812,
        357,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('six-places', () => s.play(showSix.to(1, { duration: 0.45 })));
  c.after('slide-four', () =>
    s.play(showSlide.to(1, { duration: remainDuration(c, 'slide-four', 0.45) })),
  );
}
