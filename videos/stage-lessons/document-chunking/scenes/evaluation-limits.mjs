// Scene 15: What did the retrieval study measure? (Two separate rulers: chunk size vs retrieved context budget + metrics)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  meterBar,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function evaluationLimits(s, c) {
  const showStudy = s.value(0);
  const showRulers = s.value(0);
  const showFiveK = s.value(0);
  const showMetrics = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['What Did the Retrieval', 'Study Measure?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'EMPIRICAL LIMITS · CHUNK SIZE RULER VS CONTEXT BUDGET RULER',
  });

  const live = guardedDynamic(s.value(1), () => {
    const ss = showStudy.value;
    const sr = showRulers.value;
    const s5 = showFiveK.value;
    const sm = showMetrics.value;

    const nodes = [
      // Top context banner (frameless eyebrow note)
      txt(
        'BENNANI & MOSLONKA: WIKIPEDIA · SPLADE RETRIEVAL · MINISTRAL-8B',
        -855,
        -228,
        26,
        ss > 0.3 ? COSMOS.cyan : COSMOS.muted,
        'mono',
        'left',
      ),

      // Upper Ruler: Individual Chunk Size (50 to 500 tokens)
      glassCell(-20, -138, 1670, 118, sr > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#101d35',
        glow: sr > 0.3 ? 7 : 2,
      }),
      txt(
        'UPPER RULER: CHUNK SIZE (50 to 500 tokens)',
        -825,
        -166,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      meterBar(-825, -116, 620, 22, 1.0, COSMOS.cyan),
      txt(
        '0% vs 20% overlap: more index work, no quality gain',
        -160,
        -118,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),

      // Lower Ruler: Retrieved Context Budget (500 to 10,000 tokens) with 5,000 crossover
      glassCell(-20, 16, 1670, 140, s5 > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231c10',
        glow: s5 > 0.3 ? 9 : 2,
      }),
      txt(
        'LOWER RULER: RETRIEVED CONTEXT BUDGET (500 to 10,000 tokens)',
        -825,
        -20,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      meterBar(-825, 30, 1590, 26, 0.5, COSMOS.emerald),
      line([-30, 6], [-30, 56], { stroke: COSMOS.gold, width: 4 }).glow(8, COSMOS.gold),
      txt(
        '~5,000 tok: sentence-preserving matched semantic splits',
        -825,
        64,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt('10,000 tok cap', 560, 64, 26, COSMOS.muted, 'mono', 'left'),

      // Bottom 3 metric lenses: Exact Match, Semantic Sim, Abstention
      glassCell(-575, 212, 540, 146, sm > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2624',
        glow: sm > 0.3 ? 8 : 2,
      }),
      txt('EXACT MATCH', -815, 174, 26, COSMOS.emerald, 'mono', 'left'),
      txt('Ref "Maya" vs "MAYA."', -815, 214, 26, COSMOS.ink, 'mono', 'left'),
      txt('Case & punct norm -> 1.0', -815, 250, 26, COSMOS.muted, 'sans', 'left'),

      glassCell(0, 212, 540, 146, sm > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sm > 0.3 ? 8 : 2,
      }),
      txt('SEMANTIC SIMILARITY', -240, 174, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Depends on scoring model', -240, 214, 26, COSMOS.ink, 'sans', 'left'),
      txt('May favor other budgets', -240, 250, 26, COSMOS.muted, 'sans', 'left'),

      glassCell(575, 212, 540, 146, sm > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#231c10',
        glow: sm > 0.3 ? 8 : 2,
      }),
      txt('ABSTENTION & CITATIONS', 335, 174, 26, COSMOS.amber, 'mono', 'left'),
      txt('Did it answer or hold back?', 335, 214, 26, COSMOS.ink, 'sans', 'left'),
      txt('Evaluate on YOUR runbook', 335, 250, 26, COSMOS.gold, 'sans', 'left'),

      glowDot(-840, 358, { radius: 6, color: COSMOS.gold }),
      txt(
        'Never confuse chunk size with total context budget; measure citations and uncertainty on your corpus',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('evaluation-limits-0', () => s.play(showStudy.to(1, { duration: 0.4 })));
  c.on('evaluation-limits-1', () => s.play(showRulers.to(1, { duration: 0.4 })));
  c.on('study-context-five', () => s.play(showFiveK.to(1, { duration: 0.4 })));
  c.on('evaluation-limits-2', () =>
    s.play(showMetrics.to(1, { duration: remainDuration(c, 'evaluation-limits-2', 0.45) })),
  );
}
