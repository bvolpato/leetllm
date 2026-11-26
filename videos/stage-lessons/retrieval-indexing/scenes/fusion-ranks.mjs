// Scene 13: How the two searches vote (Reciprocal Rank Fusion k=60 vs k=0 & cutoff depth)
import {
  COSMOS,
  CRED_DENSE,
  CRED_PASSAGE_NAMES,
  CRED_SPARSE,
  aura,
  credFused,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function fusionRanks(s, c) {
  const phase = s.value(0);
  const showLists = s.value(0);
  const showVotes = s.value(0);
  const showPredict = s.value(0);
  const showCut = s.value(0);
  const showDepth3 = s.value(0);
  const showK0 = s.value(0);
  const showEngine = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2a1a5216');
  const title = heroTitle(['How the Two', 'Searches Vote'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'RECIPROCAL RANK FUSION · RRF(d) = SUM 1 / (k + rank)',
  });

  const fused60 = credFused(60);
  const fused0 = credFused(0);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sl = showLists.value;
    const sv = showVotes.value;
    const sp = showPredict.value;
    const sc = showCut.value;
    const sd3 = showDepth3.value;
    const sk0 = showK0.value;
    const se = showEngine.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const useZero = sk0 > 0.5;
    const active = useZero ? fused0 : fused60;
    const maxScore = useZero ? 1.6 : 0.04;
    const kVal = useZero ? 0 : 60;
    const cutDepth = sd3 > 0.5 && !useZero ? 3 : 2;
    const revealed = sc > 0.4 || useZero;

    const nodes = [
      // Left: Sparse & Dense ranked inputs
      txt('TWO INPUT LANES (ONE VOTE PER LIST)', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
      glassCell(-465, -108, 760, 118, sl > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10213b',
        glow: sl > 0.3 ? 7 : 2,
      }),
      txt('SPARSE (BM25):', -820, -134, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        `#1 ${CRED_SPARSE[0]}   #2 ${CRED_SPARSE[1]}   (d2 missing = 0)`,
        -820,
        -88,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),

      glassCell(-465, 42, 760, 118, sl > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2824',
        glow: sl > 0.3 ? 7 : 2,
      }),
      txt('DENSE (COSINE):', -820, 16, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        `#1 ${CRED_DENSE[0]}   #2 ${CRED_DENSE[1]}   #3 ${CRED_DENSE[2]}`,
        -820,
        62,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),

      glassCell(-465, 206, 760, 134, se > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#11182c',
        glow: se > 0.3 ? 7 : 2,
      }),
      txt(
        `ACTIVE CONSTANT:  k = ${kVal}   |   CUTOFF = TOP ${cutDepth}`,
        -820,
        174,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        useZero
          ? 'k=0 comparison: #1 gets 1.00 -> d2 passes d4'
          : 'k=60 pilot default: two modest votes beat one #1',
        -820,
        216,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Elasticsearch requires k >= 1; tune k & cutoff separately',
        -820,
        252,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right: Live RRF totals + cutoff line
      txt(`FUSED RRF SCORES (k = ${kVal})`, 110, -205, 26, COSMOS.gold, 'mono', 'left'),
    ];

    active.forEach(([id, score], i) => {
      const y = -105 + i * 130;
      const survives = i < cutDepth;
      const isD2 = id === 'd2';
      const col = !revealed
        ? COSMOS.cyan
        : survives
          ? isD2
            ? COSMOS.emerald
            : COSMOS.cyan
          : COSMOS.rose;
      nodes.push(
        glassCell(495, y, 750, 102, col, {
          fill: revealed && !survives ? '#29111a' : '#10182d',
          glow: isD2 && revealed ? 9 * pulse : 3,
        }),
        txt(`#${i + 1} ${id} (${CRED_PASSAGE_NAMES[id]})`, 150, y - 22, 26, col, 'mono', 'left'),
        meterBar(150, y + 20, 440, 24, (score / maxScore) * Math.max(0.25, sv), col),
        txt(
          revealed ? score.toFixed(4) : 'vote: ?',
          840,
          y + 20,
          26,
          revealed ? col : COSMOS.gold,
          'mono',
          'right',
        ),
      );
    });

    const bottomCol = useZero
      ? COSMOS.emerald
      : sd3 > 0.4
        ? COSMOS.emerald
        : sc > 0.4
          ? COSMOS.rose
          : COSMOS.gold;
    const bottomMsg = useZero
      ? 'With k = 0, single #1 (1.0) outweighs #2 + #3 (0.833) -> d2 enters top-2'
      : sd3 > 0.4
        ? 'Widening the fused shortlist to 3 lets d2 reach the reranker without changing votes'
        : sc > 0.4
          ? 'At cutoff 2 with k = 60, d2 falls below d4 (1 vote vs 2 modest votes)!'
          : sp > 0.3
            ? 'With only 2 shortlist slots at k = 60, which passage gets left behind?'
            : 'RRF sums 1 / (k + rank) per list; missing entries contribute 0';

    nodes.push(
      glowDot(-840, 358, { radius: 6, color: bottomCol }),
      txt(bottomMsg, -812, 360, 28, bottomCol, 'sans', 'left'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('fusion-lists', () => s.play(showLists.to(0.5, { duration: 0.35 })));
  c.on('fusion-rule', () => s.play(showLists.to(0.8, { duration: 0.35 })));
  c.on('fusion-missing', () => s.play(showLists.to(1, { duration: 0.35 })));
  c.on('fusion-d1', () => s.play(showVotes.to(0.4, { duration: 0.35 })));
  c.on('fusion-d4', () => s.play(showVotes.to(0.7, { duration: 0.35 })));
  c.on('fusion-d2', () => s.play(showVotes.to(1, { duration: 0.35 })));
  c.on('fusion-predict', () => s.play(showPredict.to(1, { duration: 0.4 })));
  c.after('fusion-cut', () => s.play(showCut.to(1, { duration: 0.45 })));
  c.on('fusion-depth', () => s.play(showDepth3.to(1, { duration: 0.45 })));
  c.on('fusion-reset', () => s.play(showDepth3.to(0, { duration: 0.35 })));
  c.on('fusion-zero', () => s.play(showK0.to(1, { duration: 0.45 })));
  c.on('fusion-compare', () => s.play(showEngine.to(0.5, { duration: 0.35 })));
  c.on('fusion-engine', () =>
    s.play(showEngine.to(1, { duration: remainDuration(c, 'fusion-engine', 0.45) })),
  );
}
