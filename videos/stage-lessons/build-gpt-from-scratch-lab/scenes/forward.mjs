// Scene 09: Follow the comma through one head (Value average -> hidden [1,2] -> tied logits)
import {
  COSMOS,
  MINI_CAUSAL,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function forward(s, c) {
  const phase = s.value(0);
  const showValues = s.value(0);
  const showHidden = s.value(0);
  const showScores = s.value(0);

  const bgAura = aura(300, 0, 560, '#1e326828', '#3e216016');
  const title = heroTitle(['Follow the Comma', 'Through One Head'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: '4-PIECE MINIATURE · FORWARD PASS AT POS 2',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sv = showValues.value;
    const sh = showHidden.value;
    const sc = showScores.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: Token embedding + position addition for comma
      txt('COMMA INPUT VECTOR (POS 2)', -855, -182, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        'emb(",") [0, 1]  +  pos(2) [2, 2]  =  [2, 3]',
        -855,
        -124,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ),
    ];

    // Three readable values (keys 0, 1, 2) + excluded key 3
    if (sv > 0.05) {
      const y0 = -28;
      const items = [
        { tok: 'Good (0)', vec: MINI_CAUSAL.inputs[0], col: COSMOS.cyan },
        { tok: '·sir (1)', vec: MINI_CAUSAL.inputs[1], col: COSMOS.cyan },
        { tok: ',    (2)', vec: MINI_CAUSAL.inputs[2], col: COSMOS.gold },
      ];
      nodes.push(
        txt('READABLE VALUES (KEYS 0..2)', -855, y0 - 44, 26, COSMOS.cyan, 'mono', 'left').opacity(
          sv,
        ),
      );
      items.forEach((it, idx) => {
        const y = y0 + idx * 78 + 20;
        nodes.push(
          glassCell(-660, y, 390, 62, it.col, { fill: '#101d35', glow: 5, opacity: sv }),
          txt(
            `${it.tok}   v = [${it.vec[0]}, ${it.vec[1]}]`,
            -660,
            y + 2,
            28,
            it.col,
            'mono',
          ).opacity(sv),
        );
      });
      nodes.push(
        txt(
          'key 3 (↵) masked outside causal bracket',
          -855,
          y0 + 258,
          26,
          COSMOS.dim,
          'mono',
          'left',
        ).opacity(sv),
      );
    }

    // Center: 2D vector space showing the 3 readable vectors averaging to h = [1, 2]
    const ox = 80;
    const oy = 180;
    const scale = 96;
    const pt = (v) => [ox + v[0] * scale, oy - v[1] * scale];

    nodes.push(
      // Axes
      line([ox - 120, oy], [ox + 225, oy], { stroke: COSMOS.rule, width: 2 }),
      line([ox, oy + 70], [ox, oy - 340], { stroke: COSMOS.rule, width: 2 }),
      txt('x_0', ox + 245, oy + 2, 26, COSMOS.muted, 'mono'),
      txt('x_1', ox, oy - 365, 26, COSMOS.muted, 'mono'),
    );

    if (sv > 0.05) {
      MINI_CAUSAL.inputs.slice(0, 3).forEach((v, idx) => {
        const [px, py] = pt(v);
        const col = idx === 2 ? COSMOS.gold : COSMOS.cyan;
        nodes.push(
          line([ox, oy], [px, py], { stroke: col, width: 3.2 }).opacity(0.7 * sv),
          glowDot(px, py, { radius: 7, color: col, opacity: sv }),
        );
        if (idx === 0) {
          nodes.push(txt('[0,1]', px - 22, py, 26, col, 'mono', 'right').opacity(sv));
        } else if (idx === 1 && sh < 0.25) {
          nodes.push(
            txt('[1,2]', px, py - 38, 26, col, 'mono', 'center').opacity(sv * (1 - sh * 4)),
          );
        } else if (idx === 2) {
          nodes.push(txt('[2,3]', px + 24, py - 10, 26, col, 'mono', 'left').opacity(sv));
        }
      });
    }

    if (sh > 0.55) {
      const shOp = (sh - 0.55) / 0.45;
      const [hx, hy] = pt(MINI_CAUSAL.hidden);
      nodes.push(
        line([ox, oy], [hx, hy], { stroke: COSMOS.emerald, width: 5.5 })
          .glow(10 * pulse, COSMOS.emerald)
          .opacity(shOp),
        glowDot(hx, hy, { radius: 9, color: COSMOS.emerald, opacity: shOp }),
        txt('h = [1, 2]', hx - 24, hy - 28, 30, COSMOS.emerald, 'mono', 'right')
          .glow(7, COSMOS.emerald)
          .opacity(shOp),
        glowingArc([-460, 124], [ox - 12, oy + 46], 62, {
          color: COSMOS.emerald,
          width: 3.4,
          opacity: shOp,
        }),
      );
    }

    // Right column: Tied output dot-product scores
    if (sc > 0.05) {
      const rx = 645;
      nodes.push(
        txt('TIED OUTPUT SCORES (W_e · h)', rx, -245, 26, COSMOS.gold, 'mono').opacity(sc),
      );
      MINI_CAUSAL.outputPieces.forEach((piece, idx) => {
        const row = MINI_CAUSAL.outputRows[idx];
        const logit = MINI_CAUSAL.logits[idx];
        const y = -150 + idx * 108;
        const isTarget = piece === '↵';
        const isTop = piece === ',';
        const col = isTarget ? COSMOS.gold : isTop ? COSMOS.rose : COSMOS.cyan;
        nodes.push(
          glassCell(rx, y, 490, 82, col, {
            fill: isTarget ? '#251e0e' : isTop ? '#261119' : '#0f1b30',
            glow: isTarget || isTop ? 8 * pulse : 3,
            opacity: sc,
          }),
          txt(
            `${piece.padEnd(4)} [${row[0]}, ${row[1]}]  ->  z = ${logit}`,
            rx,
            y + 2,
            28,
            col,
            'mono',
          ).opacity(sc),
        );
      });
      nodes.push(
        txt('Top logit: "," (2) · True target: "↵" (1)', rx, 272, 26, COSMOS.gold, 'sans').opacity(
          sc,
        ),
        txt('What probability does ↵ get?', rx, 324, 30, COSMOS.amber, 'serif')
          .glow(6, COSMOS.amber)
          .opacity(sc),
      );
    }

    return group(...nodes);
  });

  const eqMean = glowTex('h = \\frac{[0,1] + [1,2] + [2,3]}{3} = [1, 2]', {
    x: -540,
    y: 350,
    size: 36,
    color: COSMOS.emerald,
    glow: 6,
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('collect-values', () => s.play(showValues.to(1, { duration: 0.55 })));
  c.on('mean-vector', () => s.play(showHidden.to(1, { duration: 0.55 })));
  c.show('mean-vector', eqMean, { fade: 0.4 });
  c.on('score-rows', () =>
    s.play(showScores.to(1, { duration: remainDuration(c, 'score-rows', 0.65) })),
  );
}
