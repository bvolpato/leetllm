// Scene 4: Three searches, one shortlist (Reciprocal Rank Fusion k = 60)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  remainDuration,
  retrievalRun,
  txt,
} from '../parts.mjs';

export default function mergeRankedLists(s, c) {
  const showRanks = s.value(0);
  const showFirst = s.value(0);
  const showSecond = s.value(0);
  const showWinner = s.value(0);

  const bgAura = aura(0, 0, 720, '#11305828', '#251a5216');
  const title = heroTitle(['Three Searches,', 'One Shortlist'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'RECIPROCAL RANK FUSION · k = 60 · SCALE-FREE RANK MERGE',
  });

  const formula = glowTex('\\text{RRF}(d) = \\sum_{r} \\frac{1}{60 + \\text{rank}_r(d)}', {
    x: 470,
    y: -365,
    size: 40,
    color: COSMOS.gold,
    glow: 8,
  });

  const run = retrievalRun();
  const ranks = run.rankings;
  const ids = run.permittedIds;
  const winnerId = run.fused[0].id;
  const colColors = [COSMOS.blue, COSMOS.cyan, COSMOS.gold];
  const colLabels = ['Burst quota', 'Queue overload', 'Capacity & backpr.'];

  const live = guardedDynamic(s.value(1), () => {
    const sr = showRanks.value;
    const sf = showFirst.value;
    const ss = showSecond.value;
    const sw = showWinner.value;
    const revealed = sw > 0.5;

    const colXs = [-275, -15, 245];
    const nodes = [
      txt('SOURCE PAGE', -835, -210, 26, COSMOS.muted, 'mono', 'left'),
      ...colLabels.map((lbl, i) => txt(lbl, colXs[i], -210, 26, colColors[i], 'mono')),
      txt('RRF SCORE (k = 60)', 420, -210, 26, COSMOS.gold, 'mono', 'left'),
    ];

    ids.forEach((id, rowIdx) => {
      const y = -110 + rowIdx * 142;
      const isWin = revealed && id === winnerId;
      const rowColor = isWin ? COSMOS.emerald : COSMOS.cyan;
      const fullScore = run.fused.find((item) => item.id === id).score;

      let activeScore = 0;
      ranks.forEach((list) => {
        const rank = list.indexOf(id) + 1;
        if (rank === 1) activeScore += (1 / 61) * sf;
        if (rank === 2) activeScore += (1 / 62) * ss;
      });

      nodes.push(
        glassCell(0, y, 1710, 114, isWin ? COSMOS.emerald : COSMOS.dim, {
          fill: isWin ? '#0d2723' : '#10182d',
          glow: isWin ? 10 : 3,
        }),
        txt(id, -832, y + 2, 32, isWin ? COSMOS.emerald : COSMOS.ink, 'mono', 'left'),
      );

      ranks.forEach((list, cIdx) => {
        const rank = list.indexOf(id) + 1;
        const activeCell =
          (rank === 1 && sf > 0.3) || (rank === 2 && ss > 0.3) || (rank > 0 && sr > 0.3);
        nodes.push(
          txt(
            rank ? `#${rank}` : '-',
            colXs[cIdx],
            y + 2,
            34,
            rank ? (activeCell ? colColors[cIdx] : COSMOS.ink) : COSMOS.dim,
            'mono',
          ),
        );
      });

      // Meter bar showing live accumulated RRF vote share
      nodes.push(
        meterBar(420, y - 16, 175, 28, activeScore / 0.036, rowColor, {
          glow: isWin ? 10 : 6,
        }),
        txt(
          revealed
            ? `${fullScore.toFixed(4)}${isWin ? ' (#1)' : ''}`
            : ss > 0.4
              ? id === winnerId
                ? '1/61 + 1/62'
                : '1/61'
              : sf > 0.5
                ? '1/61 (tie)'
                : 'pending',
          835,
          y + 2,
          28,
          isWin ? COSMOS.emerald : COSMOS.gold,
          'mono',
          'right',
        ),
        txt(
          id === 'queue-guide'
            ? ss > 0.4
              ? 'rank #1 + rank #2'
              : 'rank #1 (plus #2 waiting)'
            : 'single #1 vote',
          420,
          y + 28,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    });

    const bottomCol = revealed ? COSMOS.emerald : COSMOS.gold;
    const bottomMsg = revealed
      ? 'queue-guide leads (1/61 + 1/62 = 0.0325) · duplicate queries distort votes'
      : sf > 0.5
        ? 'All three tie at 1/61: which page takes the lead when 2nd place counts?'
        : 'RRF adds 1 / (60 + rank) per list; absent pages contribute 0';

    nodes.push(
      glowDot(-840, 368, { radius: 6, color: bottomCol }),
      txt(bottomMsg, -812, 370, 28, bottomCol, 'sans', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, formula, live);

  c.on('fusion-ranks', () => s.play(showRanks.to(1, { duration: 0.4 })));
  c.on('fusion-first', () => s.play(showFirst.to(1, { duration: 0.5 })));
  c.on('fusion-second', () => s.play(showSecond.to(1, { duration: 0.5 })));
  c.after('fusion-result', () =>
    s.play(showWinner.to(1, { duration: remainDuration(c, 'fusion-result', 0.45) })),
  );
}
