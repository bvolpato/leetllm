// Scene 14: Which replies enter the training set? (Seed-Expand-Filter, dedup & family split)
import {
  COSMOS,
  POLICY_ROWS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function datasetGates(s, c) {
  const phase = s.value(0);
  const viewMode = s.value(0); // 0=policy ledger (b0-b1), 1=family split (b2), 2=governance (b3)
  const sKeep = s.value(0);
  const sSkip = s.value(0);
  const sReject = s.value(0);
  const sFamily = s.value(0);

  const bgAura = aura(0, 30, 620, '#12365626', '#2c1c5214');
  const title = heroTitle(['Which Replies Enter', 'the Training Set?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.emerald,
    eyebrow: 'SEED-EXPAND-FILTER · DEDUPLICATION · FAMILY SPLIT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const mode = Math.round(viewMode.value);

    if (mode === 0) {
      // Beats 0 & 1: 3 candidate prompts filtered against trusted policy rules
      const reveals = [sKeep.value > 0.5, sSkip.value > 0.5, sReject.value > 0.5];
      const colX = [-835, -180, 185, 585];
      const nodes = [
        txt('REQUEST', colX[0], -186, 26, COSMOS.muted, 'mono', 'left'),
        txt('TEACHER REPLY', colX[1], -186, 26, COSMOS.blue, 'mono'),
        txt('TRUSTED RULE', colX[2], -186, 26, COSMOS.ink, 'mono'),
        txt('DECISION', colX[3], -186, 26, COSMOS.gold, 'mono'),
        line([-855, -154], [845, -154], { stroke: COSMOS.rule, width: 2.2 }),
      ];

      POLICY_ROWS.forEach((row, i) => {
        const y = -74 + i * 136;
        const rev = reveals[i];
        const col = !rev
          ? COSMOS.gold
          : row.outcome === 'keep'
            ? COSMOS.emerald
            : row.outcome === 'reject'
              ? COSMOS.rose
              : COSMOS.amber;
        const badgeText = !rev
          ? '?'
          : row.outcome === 'keep'
            ? 'KEEP'
            : row.outcome === 'skip'
              ? 'SKIP DUP'
              : 'REJECT ERROR';

        nodes.push(
          glassCell(0, y, 1700, 108, rev ? col : COSMOS.rule, {
            fill:
              rev && row.outcome === 'reject'
                ? '#28121c'
                : rev && row.outcome === 'keep'
                  ? '#0f2924'
                  : '#10182b',
            glow: rev ? 6 : 1,
          }),
          txt(row.raw.trim(), colX[0], i === 1 && rev ? y - 16 : y, 28, COSMOS.ink, 'mono', 'left'),
          txt(
            row.reply ?? (rev ? 'skipped call' : '...'),
            colX[1],
            y,
            28,
            row.reply ? COSMOS.blue : COSMOS.dim,
            'mono',
          ),
          txt(row.rule ?? '...', colX[2], y, 28, row.rule ? COSMOS.ink : COSMOS.dim, 'mono'),
          txt(badgeText, colX[3], y, 30, col, 'mono').glow(rev ? 6 : 2, col),
        );
        if (i === 1 && rev) {
          nodes.push(
            txt(
              '= normalized duplicate of row 1',
              colX[0],
              y + 26,
              26,
              COSMOS.amber,
              'sans',
              'left',
            ),
          );
        }
      });

      const allDone = reveals[2];
      nodes.push(
        glassCell(0, 338, 1620, 88, allDone ? COSMOS.emerald : COSMOS.gold, {
          fill: allDone ? '#0f2c27' : '#201b0d',
          dash: allDone ? undefined : [8, 6],
          glow: 7 * pulse,
        }),
        txt(
          allDone
            ? '2 teacher calls -> 1 verified training target (caution: case-folding can alter code!)'
            : 'Compare each teacher reply against its trusted rule: keep, skip, or reject?',
          0,
          340,
          27,
          allDone ? COSMOS.emerald : COSMOS.gold,
          'mono',
        ),
      );
      return group(...nodes);
    }

    if (mode === 1) {
      // Beat 2: Split whole seed families BEFORE paraphrasing / expanding
      const fam = sFamily.value;
      const nodes = [
        txt('TRAINING SPLIT (EXPAND HERE)', -470, -192, 28, COSMOS.blue, 'mono'),
        txt('INDEPENDENT TEST SPLIT', 540, -192, 28, COSMOS.emerald, 'mono'),
        // Glowing isolation firewall
        line([170, -210], [170, 240], { stroke: COSMOS.rose, width: 4, dash: [12, 8] }).glow(
          8,
          COSMOS.rose,
        ),
        txt('NO LEAKAGE', 170, 272, 26, COSMOS.rose, 'mono'),

        // Training seed + paraphrases
        glassCell(-660, 20, 340, 114, COSMOS.blue, { fill: '#132445', glow: 8 * pulse }),
        txt('SEED PROMPT', -660, -8, 26, COSMOS.blue, 'mono'),
        txt('Disabled key', -660, 38, 32, COSMOS.ink, 'sans'),

        // Held-out test family
        glassCell(540, 20, 560, 210, COSMOS.emerald, { fill: '#0f2824', glow: 6 }),
        txt('UNSEEN SEED FAMILIES', 540, -34, 28, COSMOS.emerald, 'mono'),
        txt('Refusals · New constraints', 540, 22, 28, COSMOS.ink, 'sans'),
        txt('Long contexts · Policy edges', 540, 72, 28, COSMOS.muted, 'sans'),
      ];

      ['Restore window?', 'How long to restore?'].forEach((para, i) => {
        const py = -84 + i * 208;
        nodes.push(
          glowingArc([-485, 20], [-285, py], i === 0 ? -24 : 24, {
            color: COSMOS.cyan,
            width: 3.4,
            opacity: Math.max(0.3, fam),
          }),
          glowDot(-285, py, { radius: 7, color: COSMOS.cyan, opacity: Math.max(0.3, fam) }),
          glassCell(-95, py, 370, 96, COSMOS.cyan, {
            fill: '#0e3044',
            glow: fam > 0.5 ? 7 : 1,
            opacity: Math.max(0.3, fam),
          }),
          txt(para, -95, py + 2, 28, COSMOS.cyan, 'sans').opacity(Math.max(0.3, fam)),
        );
      });

      nodes.push(
        glassCell(0, 356, 1620, 86, COSMOS.gold, { fill: '#201b0d', glow: 6 }),
        txt(
          'Split seed families BEFORE expansion so paraphrases never leak into the test set',
          0,
          358,
          28,
          COSMOS.gold,
          'sans',
        ),
      );
      return group(...nodes);
    }

    // Beat 3: Governance, verifier audit, independent eval
    const stages = [
      {
        tag: '1. BEFORE COLLECTION',
        body: 'Check teacher access terms, base license, and generated-data rights',
        col: COSMOS.blue,
        y: -110,
      },
      {
        tag: '2. DURING FILTERING',
        body: 'Audit verifier false positives against a trusted human reviewer',
        col: COSMOS.cyan,
        y: 66,
      },
      {
        tag: '3. AFTER TRAINING',
        body: 'Evaluate teacher and student on their OWN fresh outputs (check regressions)',
        col: COSMOS.gold,
        y: 242,
      },
    ];
    return group(
      ...stages.flatMap(({ tag, body, col, y }) => [
        glassCell(0, y, 1620, 128, col, { fill: '#101a2f', glow: 6 }),
        txt(tag, -765, y - 24, 26, col, 'mono', 'left'),
        txt(body, -765, y + 26, 30, COSMOS.ink, 'sans', 'left'),
      ]),
    );
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.after('dataset-keep', () =>
    s.play(sKeep.to(1, { duration: remainAfterDuration(c, 'dataset-keep', 0.4) })),
  );
  c.after('dataset-skip', () =>
    s.play(sSkip.to(1, { duration: remainAfterDuration(c, 'dataset-skip', 0.4) })),
  );
  c.after('dataset-reject', () =>
    s.play(sReject.to(1, { duration: remainAfterDuration(c, 'dataset-reject', 0.4) })),
  );
  c.onBeat(2, () => s.play(viewMode.to(1, { duration: 0.25 })));
  c.on('dataset-family', () =>
    s.play(sFamily.to(1, { duration: remainDuration(c, 'dataset-family', 0.9) })),
  );
  c.onBeat(3, () => s.play(viewMode.to(2, { duration: 0.25 })));
}
