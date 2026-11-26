// Scene 09: What can the student learn from a saved sentence? (Response distillation SFT tape)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function sequences(s, c) {
  const phase = s.value(0);
  const savedProg = s.value(0);
  const cursorStep = s.value(-1); // -1 = none, 0=bird, 1=in, 2=the, 3=garden
  const sMulti = s.value(0);

  const bgAura = aura(0, 30, 620, '#13325b26', '#2b1c5014');
  const title = heroTitle(['What Can a Student Learn', 'From a Saved Sentence?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.blue,
    eyebrow: 'RESPONSE DISTILLATION · TEXT-ONLY TEACHER SFT',
  });

  const words = ['bird', 'in', 'the', 'garden'];

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sv = Math.max(0.25, savedProg.value);
    const idx = Math.round(cursorStep.value);
    const multi = sMulti.value;

    const nodes = [
      txt('PROMPT', -835, -182, 26, COSMOS.muted, 'mono', 'left'),
      txt('REVIEWED TEACHER CONTINUATION', -160, -182, 26, COSMOS.blue, 'mono', 'left'),
      glassCell(-555, -102, 560, 96, COSMOS.cyan, { fill: '#102038', glow: 6 }),
      txt('The child saw a', -555, -100, 42, COSMOS.ink, 'serif'),
    ];

    words.forEach((word, i) => {
      const cx = -65 + i * 255;
      const isCur = i === idx;
      const isPast = idx >= 0 && i < idx;
      const vis =
        savedProg.value > 0.05 ? Math.min(1, Math.max(0.2, savedProg.value * 4 - i)) : 0.28;
      const col = isCur ? COSMOS.gold : isPast ? COSMOS.emerald : COSMOS.blue;
      nodes.push(
        glassCell(cx, -102, 218, 96, col, {
          fill: isCur ? '#241d0c' : isPast ? '#0e2b25' : '#132445',
          glow: isCur ? 10 * pulse : 4,
          opacity: vis,
        }),
        txt(word, cx, -100, 38, col, 'mono').opacity(vis),
      );
      if (isCur) {
        nodes.push(
          line([cx - 88, -36], [cx + 88, -36], { stroke: COSMOS.gold, width: 5 }).glow(
            8,
            COSMOS.gold,
          ),
        );
      }
    });

    // Autoregressive teacher-forcing window below
    const activeIdx = Math.max(0, Math.min(3, idx < 0 ? 0 : idx));
    const ctxText = ['The child saw a', ...words.slice(0, activeIdx)].join(' ');
    const targetWord = words[activeIdx];
    const showStep = idx >= 0;

    nodes.push(
      txt('CONTEXT GIVEN TO STUDENT', -835, 36, 26, COSMOS.muted, 'mono', 'left'),
      glassCell(-310, 128, 1050, 112, showStep ? COSMOS.cyan : COSMOS.rule, {
        fill: '#0f1b30',
        glow: showStep ? 6 : 2,
      }),
      txt(
        showStep ? ctxText : 'Waiting for step cursor...',
        -805,
        130,
        showStep ? 38 : 30,
        showStep ? COSMOS.ink : COSMOS.dim,
        'serif',
        'left',
      ),

      glowingArc([225, 128], [415, 128], -34, {
        color: COSMOS.gold,
        width: 3.6,
        opacity: showStep ? 1 : 0.35,
      }),
      glowDot(415, 128, { radius: 7, color: COSMOS.gold, opacity: showStep ? 1 : 0.35 }),

      txt('NEXT TARGET', 625, 36, 26, COSMOS.gold, 'mono'),
      glassCell(625, 128, 380, 112, showStep ? COSMOS.gold : COSMOS.rule, {
        fill: showStep ? '#241d0c' : '#12182b',
        glow: showStep ? 10 * pulse : 2,
      }),
      txt(showStep ? targetWord : '?', 625, 130, 44, showStep ? COSMOS.gold : COSMOS.dim, 'mono'),

      // Lost dark-knowledge & multiple-path callout
      glassCell(-430, 316, 820, 96, COSMOS.rose, {
        fill: '#26121b',
        glow: 4,
        opacity: Math.max(0.72, sv),
      }),
      txt('UNOBSERVED:  how likely was "dog" or "cat"?', -430, 318, 28, COSMOS.rose, 'mono'),

      glassCell(445, 316, 800, 96, multi > 0.3 ? COSMOS.emerald : COSMOS.blue, {
        fill: multi > 0.3 ? '#0f2c27' : '#122240',
        glow: multi > 0.3 ? 8 * pulse : 4,
      }),
      txt(
        multi > 0.3
          ? 'Verify every trace: wrong answers become SFT targets too!'
          : 'Student tokenizes text itself (tokenizers can differ)',
        445,
        318,
        26,
        multi > 0.3 ? COSMOS.emerald : COSMOS.cyan,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('sequence-saved', () => s.play(savedProg.to(1, { duration: 0.9 })));
  c.on('sequence-first', () => s.play(cursorStep.to(0, { duration: 0.35 })));
  c.on('sequence-next', () => s.play(cursorStep.to(1, { duration: 0.45 })));
  c.on('sequence-rest', () =>
    s.play(cursorStep.to(3, { duration: remainDuration(c, 'sequence-rest', 1.4) })),
  );
  c.onBeat(2, () => s.play(sMulti.to(1, { duration: 0.5 })));
}
