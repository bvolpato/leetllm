// Scene 1: How do I make soup? (Opening lexical match trap vs paraphrase gap)
import {
  COSMOS,
  DOCS,
  QUERY,
  TOKENS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  makeIvfVoronoi3D,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function opening(s, c) {
  const phase = s.value(0);
  const showCount = s.value(0);
  const showAsk = s.value(0);
  const showMenuWin = s.value(0);
  const showParaphrase = s.value(0);
  const showMatchQ = s.value(0);
  const showNeither = s.value(0);
  const showJudged = s.value(0);

  const bgAura = aura(0, 10, 680, '#12365c28', '#2a1c5216');
  const title = heroTitle(['How Do I', 'Make Soup?'], {
    x: -855,
    y: -415,
    size: 62,
    lineHeight: 72,
    accent: COSMOS.gold,
    eyebrow: `RETRIEVAL & INDEXING · QUERY: "${QUERY.toUpperCase()}"`,
  });

  const { view: stage3d, orbit: orbit3d } = makeIvfVoronoi3D(555, 25, 620, 620, phase, {
    activeProbe: () => (showJudged.value > 0.5 ? 2 : 1),
    queryVal: () => 4.9,
  });

  const soupD1 = TOKENS.d1.filter((t) => t === 'soup').length;
  const soupD4 = TOKENS.d4.filter((t) => t === 'soup').length;

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sc = showCount.value;
    const sa = showAsk.value;
    const sm = showMenuWin.value;
    const sp = showParaphrase.value;
    const sq = showMatchQ.value;
    const sn = showNeither.value;
    const sj = showJudged.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const lx = -390;
    const nodes = [
      txt('3D RETRIEVAL INDEX TOPOLOGY', 555, -345, 26, COSMOS.cyan, 'mono'),
      txt(
        'Candidate generation decides what the ranker can see',
        555,
        395,
        26,
        COSMOS.muted,
        'sans',
      ),
      txt('QUERY TERMS:  "make"   "soup"', -855, -205, 28, COSMOS.cyan, 'mono', 'left'),

      // Page d1 (Recipe)
      glassCell(lx, -100, 920, 108, sj > 0.4 ? COSMOS.emerald : COSMOS.cyan, {
        fill: sj > 0.4 ? '#0d2624' : '#101d35',
        glow: sc > 0.4 || sj > 0.4 ? 8 * pulse : 3,
      }),
      txt('d1 · RECIPE', -825, -124, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        'Soup recipe. Make a pot with beans, carrots, onions...',
        -825,
        -78,
        27,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        sc > 0.3 ? `soup x${soupD1}` : 'soup: ?',
        28,
        -100,
        28,
        sc > 0.3 ? COSMOS.cyan : COSMOS.muted,
        'mono',
        'right',
      ),

      // Page d4 (Lunch menu)
      glassCell(lx, 42, 920, 108, sm > 0.4 ? COSMOS.amber : COSMOS.muted, {
        fill: sm > 0.4 ? '#281d10' : '#12182b',
        glow: sm > 0.4 ? 9 * pulse : 3,
      }),
      txt('d4 · LUNCH MENU', -825, 18, 26, COSMOS.amber, 'mono', 'left'),
      txt(
        'Soup lunch menu. Tomato soup with bread daily.',
        -825,
        64,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        sm > 0.4 ? `soup x${soupD4} (WINS!)` : sc > 0.3 ? `soup x${soupD4}` : 'soup: ?',
        46,
        18,
        26,
        sm > 0.4 ? COSMOS.amber : sc > 0.3 ? COSMOS.gold : COSMOS.muted,
        'mono',
        'right',
      ),

      // Page d2 (Paraphrase instruction)
      glassCell(
        lx,
        184,
        920,
        108,
        sj > 0.4 ? COSMOS.emerald : sn > 0.4 ? COSMOS.rose : COSMOS.muted,
        {
          fill: sj > 0.4 ? '#0d2624' : sn > 0.4 ? '#28111a' : '#12182b',
          glow: sp > 0.4 ? 8 * pulse : 2,
          opacity: Math.max(0.74, sp),
        },
      ),
      txt(
        'd2 · COOKING INSTRUCTION',
        -825,
        160,
        26,
        sj > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(DOCS.d2, -825, 206, 27, COSMOS.ink, 'sans', 'left'),
      txt(
        sn > 0.4 ? '0 matches' : sq > 0.3 ? 'matches: ?' : 'paraphrase',
        28,
        184,
        28,
        sn > 0.4 ? COSMOS.rose : sq > 0.3 ? COSMOS.gold : COSMOS.muted,
        'mono',
        'right',
      ),
    ];

    // Bottom status / prediction prompt (mutually disjoint states, zero overlap)
    let promptStr = 'Count raw word matches before inspecting relevance';
    let promptCol = COSMOS.muted;
    if (sj > 0.4) {
      promptStr = 'Both d1 and d2 help the cook -> trace which pages the index reaches';
      promptCol = COSMOS.emerald;
    } else if (sn > 0.4) {
      promptStr = 'Neither "make" nor "soup" appears in d2!';
      promptCol = COSMOS.rose;
    } else if (sq > 0.4) {
      promptStr = 'Which words from "make soup" appear in d2?';
      promptCol = COSMOS.gold;
    } else if (sm > 0.4) {
      promptStr = 'Raw match count picks the lunch menu (2) over the recipe (1)';
      promptCol = COSMOS.amber;
    } else if (sa > 0.4) {
      promptStr = 'Most matches wins: which page do you get?';
      promptCol = COSMOS.gold;
    }

    nodes.push(
      glowDot(-840, 326, { radius: 6, color: promptCol }),
      txt(promptStr, -812, 328, 28, promptCol, 'sans', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, stage3d, live);
  runPhase(s, c, phase, 14);
  orbit3d(s, c);

  c.on('open-count', () => s.play(showCount.to(1, { duration: 0.45 })));
  c.on('open-ask', () => s.play(showAsk.to(1, { duration: 0.45 })));
  c.after('open-menu', () => s.play(showMenuWin.to(1, { duration: 0.45 })));
  c.on('open-read', () => s.play(showParaphrase.to(1, { duration: 0.45 })));
  c.on('open-match', () => s.play(showMatchQ.to(1, { duration: 0.4 })));
  c.after('open-neither', () => s.play(showNeither.to(1, { duration: 0.45 })));
  c.on('open-judged', () =>
    s.play(showJudged.to(1, { duration: remainDuration(c, 'open-judged', 0.45) })),
  );
}
