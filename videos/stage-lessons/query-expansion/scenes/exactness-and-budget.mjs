// Scene 18: What should the assistant search next? (4-call fan-out budget + exact incident ID guard + GraphRAG bridge)
import {
  COSMOS,
  INCIDENTS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  lookupIncident,
  meterBar,
  remainDuration,
  requestBudget,
  retrievalRun,
  txt,
} from '../parts.mjs';

export default function exactnessAndBudget(s, c) {
  const act = s.value(0); // 0 = 4-call budget, 1 = exact incident ID lookup
  const sentCount = s.value(0); // 0 .. 4
  const showStop = s.value(0);
  const showProposal = s.value(0);
  const showOther = s.value(0);
  const showRestore = s.value(0);
  const showCite = s.value(0);
  const showNext = s.value(0);

  const bgAura = aura(0, 10, 720, '#10345c26', '#2a1a4e18');
  const title = heroTitle(['What Should the Assistant', 'Search Next?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'HARD BUDGETS & EXACT IDENTIFIERS · PROTECTING PRECISION',
  });

  const run = retrievalRun();
  const wantedId = 'INC-48291';
  const swappedId = 'INC-48219';

  const live = guardedDynamic(s.value(1), () => {
    const inIncident = act.value > 0.5;
    const calls = Math.round(sentCount.value);
    const stopped = showStop.value > 0.5;
    const proposed = showProposal.value > 0.4;
    const sawOther = showOther.value > 0.5;
    const restored = showRestore.value > 0.5;
    const cited = showCite.value > 0.5;
    const nextReady = showNext.value > 0.4;

    const nodes = [];

    if (!inIncident) {
      // ACT 1: 4-call retrieval budget (4 calls, 12 possible, 4 returned, 3 distinct)
      const budget = requestBudget(calls);
      const returned = run.allRankings.slice(0, calls).flat();
      const distinct = new Set(returned).size;

      nodes.push(
        txt(
          'QUERY: "How should we handle peak demand?"  ·  CAP: 4 CALLS x 3 RESULTS',
          -855,
          -214,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ),
        txt('CALL', -835, -148, 26, COSMOS.muted, 'mono', 'left'),
        txt('SEARCH WORDING', -710, -148, 26, COSMOS.muted, 'mono', 'left'),
        txt('RETURNED SOURCE IDS', -100, -148, 26, COSMOS.muted, 'mono', 'left'),
      );

      run.queries.forEach((q, idx) => {
        const y = -78 + idx * 88;
        const done = idx < calls;
        const hits = run.allRankings[idx];
        nodes.push(
          glassCell(-150, y, 1410, 72, done ? COSMOS.cyan : COSMOS.dim, {
            fill: done ? '#10203a' : '#101729',
            glow: done ? 6 : 2,
            radius: 10,
          }),
          txt(`#${idx + 1}`, -835, y + 2, 28, done ? COSMOS.gold : COSMOS.dim, 'mono', 'left'),
          txt(q, -710, y + 2, 28, done ? COSMOS.ink : COSMOS.muted, 'sans', 'left'),
          txt(
            done ? hits.join('  ·  ') || 'No matches' : 'pending',
            -100,
            y + 2,
            28,
            done ? (hits.length ? COSMOS.emerald : COSMOS.amber) : COSMOS.dim,
            'mono',
            'left',
          ),
        );
      });

      // Right budget gauge panel
      nodes.push(
        glassCell(715, 54, 280, 336, stopped ? COSMOS.rose : COSMOS.gold, {
          fill: stopped ? '#2a121c' : '#10182d',
          glow: stopped ? 10 : 4,
        }),
        txt('BUDGET', 715, -72, 26, COSMOS.gold, 'mono'),
        txt(
          `${budget.retrievalCalls} / 4`,
          715,
          -18,
          48,
          stopped ? COSMOS.rose : COSMOS.gold,
          'mono',
        ),
        txt('calls used', 715, 32, 26, COSMOS.muted, 'sans'),
        meterBar(605, 76, 220, 22, budget.retrievalCalls / 4, stopped ? COSMOS.rose : COSMOS.gold),
        txt(`${returned.length} / ${budget.candidateCap} hits`, 715, 128, 26, COSMOS.cyan, 'mono'),
        txt(`${distinct} distinct`, 715, 170, 26, COSMOS.emerald, 'mono'),

        glowDot(-840, 368, { radius: 6, color: stopped ? COSMOS.rose : COSMOS.gold }),
        txt(
          stopped
            ? '5th search stopped before dispatch · also log encoding calls, rewrite tokens & latency'
            : 'Four searches could return 12 entries; here 4 came back across 3 distinct pages',
          -812,
          370,
          28,
          stopped ? COSMOS.rose : COSMOS.gold,
          'sans',
          'left',
        ),
      );
      return group(...nodes);
    }

    // ACT 2: Exact incident ID lookup (INC-48291 vs swapped INC-48219)
    const activeRecord = cited
      ? lookupIncident(wantedId)
      : sawOther && !restored
        ? lookupIncident(swappedId)
        : null;

    nodes.push(
      // Chat context row
      glassCell(-440, -172, 830, 108, COSMOS.cyan, { fill: '#10203a', glow: 6 }),
      txt('EARLIER MESSAGE (SOURCE OF TRUTH)', -825, -198, 26, COSMOS.cyan, 'mono', 'left'),
      txt(`"We logged this as ${wantedId}."`, -825, -148, 30, COSMOS.ink, 'sans', 'left'),

      glassCell(440, -172, 830, 108, COSMOS.blue, { fill: '#101d35', glow: 4 }),
      txt('FOLLOW-UP QUESTION', 55, -198, 26, COSMOS.blue, 'mono', 'left'),
      txt('"When did it close?"', 55, -148, 30, COSMOS.ink, 'sans', 'left'),

      // Active lookup query strip
      glassCell(
        0,
        -34,
        1710,
        104,
        restored ? COSMOS.emerald : proposed ? COSMOS.amber : COSMOS.dim,
        {
          fill: restored ? '#0d2723' : proposed ? '#261b10' : '#10182d',
          glow: restored ? 10 : 5,
        },
      ),
      txt(
        restored ? 'EXACT ID CARRIED FORWARD:' : 'PROPOSED REWRITE LOOKUP:',
        -832,
        -32,
        26,
        restored ? COSMOS.emerald : COSMOS.amber,
        'mono',
        'left',
      ),
      txt(
        proposed ? (restored ? wantedId : `${swappedId}  (last two digits swapped!)`) : '...',
        -330,
        -32,
        36,
        restored ? COSMOS.emerald : COSMOS.amber,
        'mono',
        'left',
      ),

      // Support incident register
      txt('SUPPORT INCIDENT REGISTER', -835, 62, 26, COSMOS.muted, 'mono', 'left'),
      txt('CLOSED AT', 240, 62, 26, COSMOS.muted, 'mono', 'left'),
      txt('STATUS', 832, 62, 26, COSMOS.muted, 'mono', 'right'),
    );

    INCIDENTS.forEach((row, idx) => {
      const y = 136 + idx * 116;
      const isSelected = activeRecord?.id === row.id;
      const isTrueRow = row.id === wantedId;
      const border = isSelected ? (isTrueRow && cited ? COSMOS.emerald : COSMOS.rose) : COSMOS.dim;

      nodes.push(
        glassCell(0, y, 1710, 92, border, {
          fill: isSelected ? (isTrueRow && cited ? '#0d2723' : '#2a121c') : '#10182d',
          glow: isSelected ? 10 : 2,
          radius: 10,
        }),
        txt(row.id, -832, y + 2, 34, isSelected ? border : COSMOS.ink, 'mono', 'left'),
        txt(row.closed, 240, y + 2, 34, isSelected ? border : COSMOS.ink, 'mono', 'left'),
        txt(
          isSelected ? (isTrueRow && cited ? 'CITE THIS ROW' : 'WRONG INCIDENT!') : 'registered',
          832,
          y + 2,
          28,
          isSelected ? border : COSMOS.muted,
          'mono',
          'right',
        ),
      );
    });

    const bottomCol = nextReady
      ? COSMOS.cyan
      : cited
        ? COSMOS.emerald
        : sawOther
          ? COSMOS.rose
          : COSMOS.gold;
    const bottomMsg = nextReady
      ? 'Next lesson: GraphRAG indexes connections across many records for global questions'
      : cited
        ? '14:32 UTC (INC-48291) · a real lookup can still answer the wrong question if an ID drifts'
        : sawOther
          ? '09:18 UTC belongs to INC-48219 · carry the exact ID INC-48291 from chat'
          : 'Both incident IDs exist in the register: which closing time can you cite?';

    nodes.push(
      glowDot(-840, 368, { radius: 6, color: bottomCol }),
      txt(bottomMsg, -812, 370, 28, bottomCol, 'sans', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('budget-raw', () => s.play(sentCount.to(1, { duration: 0.35 })));
  c.on('budget-quota', () => s.play(sentCount.to(2, { duration: 0.35 })));
  c.on('budget-queue', () => s.play(sentCount.to(3, { duration: 0.35 })));
  c.on('budget-capacity', () => s.play(sentCount.to(4, { duration: 0.35 })));
  c.on('budget-stop', () => s.play(showStop.to(1, { duration: 0.4 })));
  c.onBeat(2, () => s.play(act.to(1, { duration: 0.3 })));
  c.on('incident-proposal', () => s.play(showProposal.to(1, { duration: 0.4 })));
  c.after('incident-other', () => s.play(showOther.to(1, { duration: 0.4 })));
  c.on('incident-restore', () => s.play(showRestore.to(1, { duration: 0.4 })));
  c.after('incident-cite', () => s.play(showCite.to(1, { duration: 0.45 })));
  c.onBeat(4, () => s.play(showNext.to(1, { duration: remainDuration(c, 'incident-cite', 0.45) })));
}
