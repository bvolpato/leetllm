// Scene 18: executable-contracts: "What can the output tell us about the block?"
// View 1 (Beat 0): Width-8 state expands to FFN width 24 and projects back to width 8 (stackable loop).
// View 2 (Beat 1): Fixed film decoder (1 head, ReLU) vs seeded PyTorch decoder (2 heads, GELU) on same prompt.
// View 3 (Beat 2): Seeded PyTorch vs standard-library 2-block decoder both hit 35.3% for "result",
//         yet their pre-final-norm residual rows diverge sharply (opposite signs on coord 1!).
import { arrow } from 'vizmatic/stage';
import { COSMOS, glowingTrail, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ARTICLE_RUNS,
  MODEL,
  ROLE,
  arcPts,
  cinemaAtmosphere,
  fmt,
  lumBar,
  pct,
  playCue,
  swapVis,
  vectorRow,
} from '../parts.mjs';

export default function executableContracts(s, c) {
  const title = heroTitle(['Output vs state:', 'what can a probability prove?'], {
    x: -850,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.attn,
  });

  const vShape = s.value(1);
  const vTwo = s.value(0);
  const vDistinct = s.value(0);

  const widenProg = s.value(0);
  const stackLoop = s.value(0);
  const seededReveal = s.value(0);
  const probShow = s.value(0);
  const rowsReveal = s.value(0);

  // VIEW 1: [2, 4, 8] -> FFN width 24 -> [2, 4, 8] stackable contract
  const shapeLayer = guardedDynamic(vShape, (alpha) => {
    const wp = widenProg.value;
    const sl = stackLoop.value;
    const nodes = [
      txt(
        'PyTorch DecoderBlock:  B = 2 · T = 4',
        440,
        -380,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    const stages = [
      { y: -175, n: 8, label: 'Input state  [2, 4, 8]', col: ROLE.stream, w: 500 },
      { y: 10, n: 24, label: 'FFN hidden expansion  (width 24)', col: ROLE.amber, w: 1020 },
      { y: 195, n: 8, label: 'Output state  [2, 4, 8]', col: ROLE.valid, w: 500 },
    ];

    stages.forEach((st, idx) => {
      const vis =
        idx === 0 ? 1 : idx === 1 ? Math.min(1, wp * 1.6) : Math.max(0, (wp - 0.45) / 0.55);
      const barW = Math.max(240, st.w * Math.max(0.15, vis));
      nodes.push(
        txt(st.label, 0, st.y - 62, 28, st.col, 'mono', 'center').opacity(
          (0.3 + 0.7 * vis) * alpha,
        ),
        lumBar(0, st.y, barW, 66, {
          color: st.col,
          fillOpacity: 0.3,
          strokeWidth: 2.6,
          glow: 9 * vis,
          opacity: (0.25 + 0.75 * vis) * alpha,
        }),
        txt(`width = ${st.n}`, 0, st.y, 28, COSMOS.ink, 'mono', 'center').opacity(
          (0.25 + 0.75 * vis) * alpha,
        ),
      );
      if (idx < 2) {
        nodes.push(
          arrow([0, st.y + 42], [0, stages[idx + 1].y - 84], {
            stroke: st.col,
            width: 3.5,
            tip: 13,
          }).opacity((0.3 + 0.7 * vis) * alpha),
        );
      }
    });

    if (sl > 0.05) {
      const loopArc = arcPts([270, 195], [270, -175], 0, 26).map(([x, y], i) => {
        const u = i / 26;
        return [x + Math.sin(u * Math.PI) * 320, y];
      });
      const cnt = Math.max(2, Math.round(loopArc.length * sl));
      nodes.push(
        glowingTrail(loopArc.slice(0, cnt), {
          gradientColors: [ROLE.valid, ROLE.query, ROLE.stream],
          width: 4.2,
          glow: 10,
          opacity: alpha,
        }),
        txt('Stackable!', 725, -95, 32, ROLE.query, 'mono', 'center')
          .glow(8, ROLE.query)
          .opacity(sl * alpha),
      );
    }

    nodes.push(
      txt(
        'Zero future mass + finite input gradients verified on this shape',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: Fixed film decoder vs Seeded PyTorch decoder on "function returns the"
  const twoLayer = guardedDynamic(vTwo, (alpha) => {
    const sr = seededReveal.value > 0.35;
    const cols = [ROLE.stream, ROLE.mask];
    const items = [
      {
        cx: -430,
        name: 'Fixed film decoder',
        spec: '1 head  ·  ReLU  ·  d = 4',
        vals: [MODEL.logits[3], MODEL.probs[3]],
      },
      {
        cx: 430,
        name: 'Seeded PyTorch decoder',
        spec: '2 heads  ·  GELU  ·  d = 4',
        vals: sr ? [ARTICLE_RUNS[0].resultLogit, ARTICLE_RUNS[0].resultProbability] : ['?', '?'],
      },
    ];
    const nodes = [
      txt(
        'Prompt:  "function returns the"   ->   scoring "result"',
        0,
        -245,
        30,
        ROLE.query,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    items.forEach((it, i) => {
      const col = cols[i];
      nodes.push(
        txt(it.name, it.cx, -145, 36, col, 'serif', 'center').glow(6, col).opacity(alpha),
        txt(it.spec, it.cx, -80, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt('result logit', it.cx - 170, 25, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt('P(result)', it.cx + 170, 25, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        vectorRow({
          cx: it.cx,
          cy: 110,
          values: it.vals,
          cellW: 280,
          cellH: 88,
          gap: 32,
          color: col,
          digits: 3,
          fontSize: 34,
          opacity: alpha,
        }),
      );
    });

    nodes.push(
      txt(
        sr
          ? 'Both choose "result", via completely different heads, activations & weights'
          : 'Same input prompt, independent decoder implementations',
        0,
        325,
        28,
        sr ? ROLE.valid : COSMOS.muted,
        'sans',
        'center',
      )
        .glow(sr ? 6 : 0, ROLE.valid)
        .opacity(alpha),
    );
    return nodes;
  });

  // VIEW 3: Matching 35.3% probabilities vs opposite-sign residual rows
  const distinctLayer = guardedDynamic(vDistinct, (alpha) => {
    const ps = probShow.value;
    const rr = rowsReveal.value;
    const specs = [
      { name: 'Seeded PyTorch', sub: '1 block · 2 heads', col: ROLE.stream },
      { name: 'Standard library', sub: '2 blocks · 1 head', col: ROLE.mask },
    ];
    const nodes = [
      txt(
        'Two article decoders on "function returns the"',
        0,
        -255,
        32,
        ROLE.query,
        'mono',
        'center',
      ).opacity(alpha),
      txt('P("result")', -260, -175, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(
        rr > 0.35
          ? 'Last residual row (before final LayerNorm)'
          : 'Hidden state before final norm?',
        350,
        -175,
        28,
        rr > 0.35 ? ROLE.query : COSMOS.dim,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    ARTICLE_RUNS.forEach((run, i) => {
      const y = -55 + i * 215;
      const sp = specs[i];
      nodes.push(
        txt(sp.name, -795, y - 22, 34, sp.col, 'serif', 'left').opacity(alpha),
        txt(sp.sub, -795, y + 32, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
        txt(pct(run.resultProbability, 1), -260, y, 54, sp.col, 'mono', 'center')
          .glow(9, sp.col)
          .opacity((0.4 + 0.6 * ps) * alpha),
      );
      if (rr > 0.1) {
        nodes.push(
          vectorRow({
            cx: 350,
            cy: y,
            values: run.row,
            cellW: 195,
            cellH: 82,
            gap: 14,
            color: sp.col,
            digits: 3,
            fontSize: 28,
            highlightIdx: 0,
            opacity: rr * alpha,
          }),
        );
      }
    });

    nodes.push(
      txt(
        rr > 0.4
          ? 'Identical 35.3% output, yet coord 1 has opposite signs (+0.037 vs -1.969)!'
          : 'Matching output probabilities do not imply matching internal states',
        0,
        355,
        28,
        rr > 0.4 ? ROLE.amber : COSMOS.muted,
        'sans',
        'center',
      )
        .glow(rr > 0.4 ? 6 : 0, ROLE.amber)
        .opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.attn, ROLE.amber), title, shapeLayer, twoLayer, distinctLayer);

  // Beat 0: shape expansion & stackable contract
  playCue(
    s,
    c,
    'tr-executable-contracts-voice-0',
    (d) => s.play(widenProg.to(1, { duration: d })),
    {
      dur: 1.3,
    },
  );
  playCue(
    s,
    c,
    'tr-executable-contracts-decoder',
    (d) => s.play(stackLoop.to(1, { duration: d })),
    {
      dur: 0.75,
    },
  );

  // Beat 1: Film vs seeded PyTorch
  playCue(
    s,
    c,
    'tr-executable-contracts-voice-1',
    (d) => s.play(swapVis(vShape, vTwo, Math.min(0.65, d * 0.45))),
    { dur: 0.7, offset: -0.65 },
  );
  playCue(
    s,
    c,
    'tr-executable-contracts-seeded',
    (d) => s.play(seededReveal.to(1, { duration: d })),
    {
      dur: 0.65,
    },
  );

  // Beat 2: Both 35.3%, distinct residual rows
  playCue(
    s,
    c,
    'tr-executable-contracts-voice-2',
    (d) => s.play(swapVis(vTwo, vDistinct, Math.min(0.65, d * 0.45))),
    { dur: 0.7, offset: -0.65 },
  );
  playCue(s, c, 'tr-executable-contracts-voice-2', (d) => s.play(probShow.to(1, { duration: d })), {
    dur: 0.8,
  });
  playCue(
    s,
    c,
    'tr-executable-contracts-distinct',
    (d) => s.play(rowsReveal.to(1, { duration: d })),
    { dur: 0.8 },
  );
}
