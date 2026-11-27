// Scene 9: Which words reach the model? (Match counts, 10-word vs 9-word packer budget, equal-budget compare)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  pagingContext,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function labeledRetrieval(s, c) {
  const showCounts = s.value(0);
  const showPack10 = s.value(0);
  const showNine = s.value(0);
  const showVerdict = s.value(0);
  const showEqual = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2e1a4e16');
  const title = heroTitle(['Which Words Reach', 'the Model?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'CONTEXT PACKING · 10-WORD vs 9-WORD ALLOWANCE · EQUAL-BUDGET EVAL',
  });

  const p10 = pagingContext(10);
  const p9 = pagingContext(9);

  const live = guardedDynamic(s.value(1), () => {
    const sc = showCounts.value;
    const s10 = showPack10.value;
    const s9 = showNine.value;
    const sv = showVerdict.value;
    const se = showEqual.value;

    const nodes = [
      // Left: Lexical overlap counts & 10-word pack (both halves fit!)
      txt('DISTINCT QUERY MATCHES & 10-WORD PACK', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-455, -102, 810, 146, sc > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sc > 0.3 ? 7 : 2,
      }),
      txt(
        'Full paging rule: 4/4 matches   |   Routine: 1/4',
        -825,
        -138,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        'Two 5-word halves: tie at 2/4 each (split)',
        -825,
        -94,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),
      txt(
        '3-query check: paging, archive, handoff + edges',
        -825,
        -52,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(-455, 86, 810, 178, s10 > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2824',
        glow: s10 > 0.3 ? 9 : 3,
      }),
      txt(
        `BUDGET = 10 WORDS  (USED ${p10.used}/10 -> COMPLETE!)`,
        -825,
        26,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        'Hit #1 (deadline, 5w) + Hit #2 (condition, 5w)',
        -825,
        72,
        26,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        'Model reads in source order -> full rule restored',
        -825,
        114,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ),
      meterBar(-825, 148, 730, 20, 1.0, COSMOS.emerald),

      // Right: 9-word budget drop (strictly withheld until sv!) + 120-token equal budget
      txt('LOWER BUDGET TO 9 WORDS (WHOLE HITS ONLY)', 110, -205, 26, COSMOS.rose, 'mono', 'left'),

      glassCell(
        495,
        -72,
        760,
        188,
        sv > 0.4 ? COSMOS.rose : s9 > 0.3 ? COSMOS.gold : COSMOS.muted,
        {
          fill: sv > 0.4 ? '#29111a' : '#181e34',
          glow: sv > 0.4 ? 10 : 3,
        },
      ),
      txt('BUDGET = 9 WORDS  |  HIT #1 USES 5 SPACES', 145, -130, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        sv > 0.4
          ? `Only 4 left -> 5w condition DROPPED (${p9.used}/9)`
          : '4 spaces left: can 2nd 5-word hit fit?  ?',
        145,
        -80,
        26,
        sv > 0.4 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),
      meterBar(145, -34, 680, 22, 5 / 9, COSMOS.amber),
      txt(
        sv > 0.4
          ? 'Same search hits, yet evidence is now MISSING!'
          : 'Label source spans (chunk IDs shift on resplit)',
        145,
        2,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(495, 152, 760, 178, se > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: se > 0.3 ? 9 : 2,
      }),
      txt('COMPARE AT EQUAL EVIDENCE BUDGET (120 TOK)', 145, 94, 26, COSMOS.cyan, 'mono', 'left'),
      txt('2 x 60-token chunks = 120 tok  (full budget)', 145, 140, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        '4 x 30-token chunks = 120 tok  (fair compare!)',
        145,
        184,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        'Track span duplication, index size & latency too',
        145,
        220,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 355, { radius: 6, color: sv > 0.4 ? COSMOS.rose : COSMOS.gold }),
      txt(
        'Compare chunking policies at equal retrieved-token budgets, not equal chunk counts',
        -812,
        357,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('count-matches', () => s.play(showCounts.to(0.5, { duration: 0.35 })));
  c.on('retrieval-suite', () => s.play(showCounts.to(1, { duration: 0.4 })));
  c.on('pack-deadline', () => s.play(showPack10.to(0.5, { duration: 0.35 })));
  c.on('pack-condition', () => s.play(showPack10.to(1, { duration: 0.4 })));
  c.on('nine-spaces', () => s.play(showNine.to(1, { duration: 0.4 })));
  c.after('packing-verdict', () => s.play(showVerdict.to(1, { duration: 0.45 })));
  c.on('equal-budget', () =>
    s.play(showEqual.to(1, { duration: remainDuration(c, 'equal-budget', 0.45) })),
  );
}
