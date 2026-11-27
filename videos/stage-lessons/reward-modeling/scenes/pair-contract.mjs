// Scene 05: Check what actually reaches the scorer: shared context contract, identical-ID trap, lineage.
import {
  COSMOS,
  aura,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  tokenCell,
  txt,
} from '../parts.mjs';

export default function pairContract(s, c) {
  const ctxMatched = s.value(0.35);
  const tokInspected = s.value(0);
  const identicalTrap = s.value(0);
  const restored = s.value(0);
  const metaOn = s.value(0);

  const bgAura = aura(100, 0, 560, '#a78bfa1e', '#5ce1e614');
  const title = heroTitle(['Inspect the Exact', 'Scored Tokens'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.cyan,
    eyebrow: 'PAIR CONTRACT · DETERMINISTIC SCORER INPUT',
  });

  const live = guardedDynamic(1, () => {
    const cm = ctxMatched.value;
    const ti = tokInspected.value;
    const tr = identicalTrap.value;
    const rs = restored.value;
    const mt = metaOn.value;

    const isCollapsed = tr > 0.5 && rs < 0.5;
    const prefixCols = [
      { label: 'SYS', id: '[101]', x: -690 },
      { label: 'TOOLS', id: '[204]', x: -460 },
      { label: 'HIST', id: '[318]', x: -230 },
      { label: 'PROMPT', id: '[412]', x: 0 },
    ];
    const rowAY = -95;
    const rowBY = 95;
    const ansX = 270;

    const nodes = [
      txt('SHARED PREFIX (IDENTICAL CONTEXT)', -690, -210, 26, COSMOS.violet, 'mono', 'left'),
      txt('ANSWER SUFFIX', ansX, -210, 26, COSMOS.gold, 'mono'),
      txt('SCORER OUTPUT', 630, -210, 26, COSMOS.cyan, 'mono'),

      // Row labels
      txt('A', -835, rowAY, 36, COSMOS.emerald, 'mono'),
      txt('B', -835, rowBY, 36, COSMOS.rose, 'mono'),
    ];

    // Matched prefix cells for both rows
    for (const cell of prefixCols) {
      nodes.push(
        tokenCell(cell.x, rowAY, 195, 96, COSMOS.violet, {
          fill: '#15142d',
          glow: cm > 0.5 ? 7 : 2,
          opacity: Math.max(0.5, cm),
        }),
        txt(cell.label, cell.x, rowAY - 16, 26, COSMOS.violet, 'mono').opacity(Math.max(0.5, cm)),
        txt(ti > 0.4 ? cell.id : 'match', cell.x, rowAY + 24, 26, COSMOS.ink, 'mono').opacity(
          Math.max(0.5, cm),
        ),

        tokenCell(cell.x, rowBY, 195, 96, COSMOS.violet, {
          fill: '#15142d',
          glow: cm > 0.5 ? 7 : 2,
          opacity: Math.max(0.5, cm),
        }),
        txt(cell.label, cell.x, rowBY - 16, 26, COSMOS.violet, 'mono').opacity(Math.max(0.5, cm)),
        txt(ti > 0.4 ? cell.id : 'match', cell.x, rowBY + 24, 26, COSMOS.ink, 'mono').opacity(
          Math.max(0.5, cm),
        ),
        // Vertical equality lock line
        line([cell.x, rowAY + 52], [cell.x, rowBY - 52], {
          stroke: COSMOS.violet,
          width: 2.2,
          dash: [5, 5],
        }).opacity(0.65 * cm),
      );
    }

    // Distinguishing answer suffix cells
    const tokA = isCollapsed ? '[880]' : '[880 · wait]';
    const tokB = isCollapsed ? '[880]' : '[912 · grant]';
    const colA = isCollapsed ? COSMOS.amber : COSMOS.emerald;
    const colB = isCollapsed ? COSMOS.amber : COSMOS.rose;

    nodes.push(
      tokenCell(ansX, rowAY, 250, 96, colA, { fill: '#102026', glow: 8 }),
      txt(ti > 0.4 ? tokA : 'Answer A', ansX, rowAY, 28, colA, 'mono'),

      tokenCell(ansX, rowBY, 250, 96, colB, { fill: '#201222', glow: 8 }),
      txt(ti > 0.4 ? tokB : 'Answer B', ansX, rowBY, 28, colB, 'mono'),

      // Scorer outputs
      glowingTrail(
        [
          [ansX + 130, rowAY],
          [505, rowAY],
        ],
        { color: colA, width: 3.4 },
      ),
      glowingTrail(
        [
          [ansX + 130, rowBY],
          [505, rowBY],
        ],
        { color: colB, width: 3.4 },
      ),
      tokenCell(650, rowAY, 260, 96, colA, { fill: '#101b2c', glow: 8 }),
      txt(
        isCollapsed ? 'r = 1.20' : rs > 0.5 ? 'r(A) = 1.80' : 'r(A)',
        650,
        rowAY,
        32,
        colA,
        'mono',
      ),
      tokenCell(650, rowBY, 260, 96, colB, { fill: '#1a1226', glow: 8 }),
      txt(
        isCollapsed ? 'r = 1.20' : rs > 0.5 ? 'r(B) = 0.70' : 'r(B)',
        650,
        rowBY,
        32,
        colB,
        'mono',
      ),
    );

    // Status callout for identical vs distinct tokens
    if (isCollapsed) {
      nodes.push(
        txt('IDENTICAL INPUTS → r(A) = r(B) → Δ = 0', 100, 232, 32, COSMOS.amber, 'mono').glow(
          7,
          COSMOS.amber,
        ),
      );
    } else if (rs > 0.4) {
      nodes.push(
        txt('DISTINCT TOKEN IDS → Δ = +1.10 (USABLE PAIR)', 100, 232, 30, COSMOS.emerald, 'mono')
          .glow(7, COSMOS.emerald)
          .opacity(rs),
      );
    } else {
      nodes.push(
        txt('Same chat template · compare exact token IDs', 100, 232, 28, COSMOS.muted, 'sans'),
      );
    }

    // Bottom provenance strip (checkpoint, cohort, separate ties)
    const metaY = 365;
    line([-855, 305], [810, 305], { stroke: '#253355', width: 2 });
    const metaAlpha = Math.max(0.4, mt);
    const items = [
      { x: -640, k: 'CHECKPOINT', v: 'sft-v4.2', col: COSMOS.cyan },
      { x: -160, k: 'ANNOTATOR COHORT', v: 'rubric-p7', col: COSMOS.violet },
      { x: 350, k: 'TIES KEPT SEPARATE', v: 'strict wins only', col: COSMOS.gold },
    ];
    for (const it of items) {
      nodes.push(
        glowDot(it.x - 165, metaY, { radius: 6, color: it.col, opacity: metaAlpha }),
        txt(it.k, it.x - 140, metaY - 16, 26, COSMOS.muted, 'mono', 'left').opacity(metaAlpha),
        txt(it.v, it.x - 140, metaY + 24, 28, it.col, 'mono', 'left').opacity(metaAlpha),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('match-shared-context', () => s.play(ctxMatched.to(1, { duration: 0.45 })));
  c.on('inspect-scorer-input', () => s.play(tokInspected.to(1, { duration: 0.45 })));
  c.on('identical-input-scores', () => s.play(identicalTrap.to(1, { duration: 0.45 })));
  c.on('retain-answer-token', () => s.play(restored.to(1, { duration: 0.5 })));
  c.on('pair-contract-b3-1', () =>
    s.play(metaOn.to(1, { duration: remainDuration(c, 'pair-contract-b3-1', 0.55) })),
  );
}
