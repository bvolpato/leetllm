// Scene 11: Which guide points toward the query? (Bi-encoder cosine angle geometry)
import {
  COSMOS,
  CRED_DENSE_SCORES,
  CRED_QUERY_VEC,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function denseEncoding(s, c) {
  const showEncoders = s.value(0);
  const showQuery = s.value(0);
  const showSources = s.value(0);
  const showAngles = s.value(0);
  const showWinner = s.value(0);
  const showScores = s.value(0);
  const showVersion = s.value(0);

  const bgAura = aura(0, 10, 680, '#12366028', '#2a1c5216');
  const title = heroTitle(['Which Guide Points', 'Toward the Query?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'BI-ENCODER DENSE RETRIEVAL · DIRECTIONAL SIMILARITY IN THE (x, y) PLANE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const se = showEncoders.value;
    const sq = showQuery.value;
    const ss = showSources.value;
    const sa = showAngles.value;
    const sw = showWinner.value;
    const sc = showScores.value;
    const sv = showVersion.value;

    // Left: Living 2D vector plane (z = 0 slice) showing Query, d1 (Rotation), d2 (Credential)
    const ox = -740;
    const oy = 235;
    const scale = 390;
    const pt = (v) => [ox + v[0] * scale, oy - v[1] * scale];

    const qPt = pt(CRED_QUERY_VEC);
    const d1Pt = pt(CRED_DENSE_SCORES[0].v);
    const d2Pt = pt(CRED_DENSE_SCORES[1].v);

    const nodes = [
      txt('VECTOR DIRECTION PLANE (z = 0)', ox + 24, -225, 26, COSMOS.cyan, 'mono', 'left'),
      // Axes
      line([ox, oy], [ox + 560, oy], { stroke: COSMOS.muted, width: 2.2 }),
      line([ox, oy], [ox, oy - 395], { stroke: COSMOS.muted, width: 2.2 }),
      txt('x', ox + 575, oy + 6, 26, COSMOS.muted, 'mono', 'left'),
      txt('y', ox - 24, oy - 385, 26, COSMOS.muted, 'mono', 'right'),

      // Query vector (gold)
      line([ox, oy], qPt, { stroke: COSMOS.gold, width: 5.2 }).glow(sq > 0.3 ? 10 : 5, COSMOS.gold),
      glowDot(qPt[0], qPt[1], { radius: 9, color: COSMOS.gold }),
      txt('Query [1.0, 0.8, 0]', qPt[0] + 18, qPt[1] - 8, 26, COSMOS.gold, 'mono', 'left'),

      // d2 Credential guide (emerald - closer angle!)
      line([ox, oy], d2Pt, { stroke: COSMOS.emerald, width: sw > 0.4 ? 5.6 : 4.0 })
        .glow(sw > 0.4 ? 12 : 5, COSMOS.emerald)
        .opacity(Math.max(0.7, ss)),
      glowDot(d2Pt[0], d2Pt[1], { radius: 9, color: COSMOS.emerald, opacity: Math.max(0.7, ss) }),
      txt(
        sw > 0.4 ? 'd2 Credential (WINNER!)' : 'd2 Credential [0.9, 0.9, 0]',
        d2Pt[0] - 12,
        d2Pt[1] - 32,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),

      // d1 Rotation guide (cyan - wider turn)
      line([ox, oy], d1Pt, { stroke: COSMOS.cyan, width: 4.0 })
        .glow(sa > 0.3 ? 8 : 4, COSMOS.cyan)
        .opacity(Math.max(0.7, ss)),
      glowDot(d1Pt[0], d1Pt[1], { radius: 8, color: COSMOS.cyan, opacity: Math.max(0.7, ss) }),
      txt('d1 Rotation [1.0, 0.4, 0]', d1Pt[0] + 18, d1Pt[1] + 24, 26, COSMOS.cyan, 'mono', 'left'),

      // Right side: Bi-encoder architecture + Cosine readout (strictly withheld until sw/sc!)
      txt('ALL 4 PASSAGES (3D COSINE TABLE)', 120, -210, 26, COSMOS.cyan, 'mono', 'left'),
      glassCell(495, -120, 750, 96, se > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: se > 0.3 ? 7 : 2,
      }),
      txt(
        'Bi-encoder: encode passages offline, query live',
        150,
        -134,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Separate query/doc encoders allowed (e.g., DPR)',
        150,
        -96,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    const sortedDense = [...CRED_DENSE_SCORES].sort((a, b) => b.cosine - a.cosine);
    sortedDense.forEach((row, i) => {
      const y = -12 + i * 76;
      const reveal = sc > 0.4 || (sw > 0.4 && row.id === 'd2');
      const col = row.id === 'd2' ? COSMOS.emerald : row.id === 'd1' ? COSMOS.cyan : COSMOS.muted;
      nodes.push(
        glassCell(495, y, 750, 62, reveal ? col : COSMOS.muted, {
          fill: reveal && row.id === 'd2' ? '#0e2824' : '#11182c',
          glow: reveal && row.id === 'd2' ? 9 : 2,
        }),
        txt(`${row.id}  v=[${row.v.join(', ')}]`, 150, y + 2, 26, col, 'mono', 'left'),
        txt(
          reveal ? `cos = ${row.cosine.toFixed(3)}` : 'cos = ?',
          840,
          y + 2,
          28,
          reveal ? col : COSMOS.gold,
          'mono',
          'right',
        ),
      );
    });

    nodes.push(
      glowDot(-840, 355, {
        radius: 6,
        color: sv > 0.3 ? COSMOS.amber : sw > 0.4 ? COSMOS.emerald : COSMOS.gold,
      }),
      txt(
        sv > 0.3
          ? 'Changing encoder, tokenizer, or normalization requires verifying or rebuilding stored vectors'
          : sw > 0.4
            ? 'Credential guide (d2) needs the smaller turn -> cosine 0.994 beats d1 (0.957)'
            : 'Compare the angles from yellow: which guide should come first?',
        -812,
        357,
        28,
        sv > 0.3 ? COSMOS.amber : sw > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('two-encoders', () => s.play(showEncoders.to(0.6, { duration: 0.4 })));
  c.on('encoder-parameters', () => s.play(showEncoders.to(1, { duration: 0.4 })));
  c.on('query-coordinates', () => s.play(showQuery.to(1, { duration: 0.4 })));
  c.on('source-coordinates', () => s.play(showSources.to(1, { duration: 0.45 })));
  c.on('dense-angles', () => s.play(showAngles.to(1, { duration: 0.45 })));
  c.after('dense-winner', () => s.play(showWinner.to(1, { duration: 0.45 })));
  c.after('cosine-scores', () => s.play(showScores.to(1, { duration: 0.45 })));
  c.on('embedding-version', () =>
    s.play(showVersion.to(1, { duration: remainDuration(c, 'embedding-version', 0.45) })),
  );
}
