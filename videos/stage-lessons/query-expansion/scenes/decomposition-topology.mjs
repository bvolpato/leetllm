// Scene 6: When can the next search start? (Parallel scatter-gather vs sequential hops)
import {
  COSMOS,
  DECOMPOSITION_FACTS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function decompositionTopology(s, c) {
  const phase = s.value(0);
  const showParallel = s.value(0);
  const showGap = s.value(0);
  const showEndpoint = s.value(0);
  const showRetry = s.value(0);

  const bgAura = aura(0, 10, 720, '#10335c26', '#261a5216');
  const title = heroTitle(['When Can the Next', 'Search Start?'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.cyan,
    eyebrow: 'QUERY DECOMPOSITION · PARALLEL FAN-OUT VS SEQUENTIAL HOPS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sp = showParallel.value;
    const sg = showGap.value;
    const se = showEndpoint.value;
    const sr = showRetry.value;
    const pulse = 0.74 + 0.26 * Math.sin(p * 3.8);

    const arrivedCount = Math.round(sp * 5);
    const gapOpen = sg > 0.4;
    const hop1Done = se > 0.5;
    const hop2Done = sr > 0.5;

    const nodes = [
      // Left side: Parallel scatter-gather (6 known lookups)
      txt('PARALLEL · ALL ENTITIES KNOWN (6 LOOKUPS)', -855, -210, 26, COSMOS.blue, 'mono', 'left'),
      txt('SYNC', -430, -162, 26, COSMOS.cyan, 'mono'),
      txt('BATCH', -135, -162, 26, COSMOS.cyan, 'mono'),
    ];

    DECOMPOSITION_FACTS.forEach((row, rIdx) => {
      const y = -82 + rIdx * 136;
      nodes.push(txt(row.name, -855, y + 2, 28, COSMOS.ink, 'sans', 'left'));

      // Sync cell
      const syncArrived = rIdx * 2 < arrivedCount;
      nodes.push(
        glassCell(-430, y, 270, 106, syncArrived ? COSMOS.cyan : COSMOS.dim, {
          fill: '#101d35',
          glow: syncArrived ? 6 : 2,
        }),
        txt(syncArrived ? row.sync : '...', -430, y - 16, 26, COSMOS.ink, 'sans'),
        txt(
          syncArrived ? `Source ${row.syncId}` : 'pending',
          -430,
          y + 26,
          26,
          COSMOS.cyan,
          'mono',
        ),
      );

      // Batch cell
      const isMissing = row.batch === null;
      const batchArrived = !isMissing && rIdx * 2 + 1 < arrivedCount;
      const batchCol = isMissing
        ? gapOpen
          ? COSMOS.rose
          : COSMOS.amber
        : batchArrived
          ? COSMOS.cyan
          : COSMOS.dim;
      nodes.push(
        glassCell(-135, y, 270, 106, batchCol, {
          fill: isMissing && gapOpen ? '#29121a' : '#101d35',
          glow: isMissing && gapOpen ? 9 * pulse : batchArrived ? 6 : 2,
        }),
        txt(
          batchArrived ? row.batch : isMissing && gapOpen ? 'No source' : '...',
          -135,
          y - 16,
          26,
          isMissing && gapOpen ? COSMOS.rose : COSMOS.ink,
          'sans',
        ),
        txt(
          batchArrived ? `Source ${row.batchId}` : isMissing && gapOpen ? 'leave open' : 'pending',
          -135,
          y + 26,
          26,
          batchCol,
          'mono',
        ),
      );
    });

    // Right side: Sequential 2-hop chain
    (txt('SEQUENTIAL · DEPENDENT CHAIN (HOP LIMIT)', 80, -210, 26, COSMOS.gold, 'mono', 'left'),
      nodes.push(
        // Hop 1
        glassCell(465, -72, 770, 162, hop1Done ? COSMOS.cyan : COSMOS.gold, {
          fill: hop1Done ? '#0f2338' : '#141b30',
          glow: hop1Done ? 8 : 4,
        }),
        txt('HOP 1 · READ ERROR REPORT FIRST', 108, -118, 26, COSMOS.gold, 'mono', 'left'),
        txt('Which endpoint had the most errors?', 108, -72, 27, COSMOS.ink, 'sans', 'left'),
        txt(
          hop1Done ? 'E1 -> batch endpoint (unlocked)' : 'Waiting for error report...',
          108,
          -24,
          28,
          hop1Done ? COSMOS.cyan : COSMOS.muted,
          'mono',
          'left',
        ),

        // Dependency conduit arrow from Hop 1 to Hop 2
        glowingArc([465, 10], [465, 96], 0, {
          color: hop1Done ? COSMOS.emerald : COSMOS.dim,
          width: 4,
          opacity: hop1Done ? 0.95 : 0.4,
          glow: 9,
        }),
        txt(
          hop1Done ? 'supplies entity ->' : 'blocked until hop 1',
          490,
          54,
          26,
          hop1Done ? COSMOS.emerald : COSMOS.dim,
          'mono',
          'left',
        ),

        // Hop 2
        glassCell(
          465,
          186,
          770,
          174,
          hop2Done ? COSMOS.emerald : hop1Done ? COSMOS.blue : COSMOS.dim,
          {
            fill: hop2Done ? '#0d2723' : '#11182c',
            glow: hop2Done ? 10 * pulse : 3,
          },
        ),
        txt(
          'HOP 2 · SEARCH RETRY POLICY',
          108,
          134,
          26,
          hop2Done ? COSMOS.emerald : COSMOS.blue,
          'mono',
          'left',
        ),
        txt(
          hop1Done
            ? 'Query: "batch endpoint retry policy"'
            : 'Query: "[ endpoint ? ] retry policy"',
          108,
          184,
          27,
          hop1Done ? COSMOS.ink : COSMOS.muted,
          'mono',
          'left',
        ),
        txt(
          hop2Done ? 'B3 -> retry failed items only' : 'Enforce hop limit; surface uncertainty',
          108,
          234,
          28,
          hop2Done ? COSMOS.emerald : COSMOS.muted,
          'sans',
          'left',
        ),

        glowDot(-840, 368, { radius: 6, color: hop2Done ? COSMOS.emerald : COSMOS.gold }),
        txt(
          hop2Done
            ? 'Parallelize known lookups; chain dependent hops with an explicit hop cap'
            : gapOpen
              ? 'Leave unsourced cells open; never borrow another endpoint rule'
              : 'Start independent lookups together when every entity is known',
          -812,
          370,
          28,
          hop2Done ? COSMOS.emerald : COSMOS.gold,
          'sans',
          'left',
        ),
      ));

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 12);

  c.on('fact-search', () => s.play(showParallel.to(1, { duration: 0.8 })));
  c.on('fact-gap', () => s.play(showGap.to(1, { duration: 0.45 })));
  c.on('fact-endpoint', () => s.play(showEndpoint.to(1, { duration: 0.45 })));
  c.on('fact-retry', () =>
    s.play(showRetry.to(1, { duration: remainDuration(c, 'fact-retry', 0.45) })),
  );
}
