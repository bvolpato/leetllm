// Scene 11: Which shingles survive a chain of matches?: Glowing LSH S-curve 1-(1-s^4)^8 + non-transitive chain A-B-C prediction.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  LSH_BANDS,
  LSH_CHAIN_SETS,
  LSH_ROWS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  lshProb,
  rect,
  remainAfterDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function lshChain(s, c) {
  const showPart1 = s.value(1);
  const formulaOn = s.value(0);
  const curveExtent = s.value(0.05);

  const showPart2 = s.value(0);
  const passEdges = s.value(0);
  const failEdge = s.value(0);
  const questionOn = s.value(0);
  const componentDrop = s.value(0);
  const recipeOn = s.value(0);

  const bgAura = aura(320, 20, 560, '#182b5a2a', '#5ce1e614');

  const eqLsh = glowTex(String.raw`P(\text{candidate}) = 1 - (1 - s^{4})^{8}`, {
    x: -440,
    y: 255,
    size: 42,
    color: COSMOS.gold,
  });

  // Part 1: 8 bands x 4 rows grid on left + glowing LSH S-curve on right
  const part1Live = guardedDynamic(showPart1, (a) => {
    const ext = curveExtent.value;
    const fm = formulaOn.value;

    const nodes = [
      heroTitle(['LSH Banding', '& the S-Curve'], {
        x: -855,
        y: -430,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.cyan,
        eyebrow: `${LSH_BANDS} BANDS x ${LSH_ROWS} ROWS · CANDIDATE PROBABILITY`,
      }).opacity(a),
    ];

    // 8 bands x 4 rows compact constellation on left
    for (let band = 0; band < LSH_BANDS; band++) {
      const bx = -755 + (band % 4) * 185;
      const by = -120 + Math.floor(band / 4) * 115;
      nodes.push(glassCell(bx, by, 160, 74, COSMOS.blue, { fill: '#0f172b', glow: 4, opacity: a }));
      for (let r = 0; r < LSH_ROWS; r++) {
        nodes.push(
          glowDot(bx - 48 + r * 32, by, {
            radius: 7,
            color: fm > 0.4 ? COSMOS.cyan : COSMOS.blue,
            glow: 7,
            opacity: a,
          }),
        );
      }
    }

    if (fm > 0.02) {
      nodes.push(
        txt(
          '1 band match: s^4  ·  all 8 miss: (1 - s^4)^8',
          -855,
          130,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(fm * a),
      );
    }

    // Glowing S-curve plot on right
    const gx = 100;
    const gy = 250;
    const gw = 720;
    const gh = 510;
    nodes.push(
      txt('CANDIDATE PROBABILITY', gx + gw * 0.5, gy - gh - 45, 28, COSMOS.ink, 'mono').opacity(a),
      line([gx, gy], [gx + gw, gy], { stroke: '#4d6088', width: 3 }).opacity(a),
      line([gx, gy], [gx, gy - gh], { stroke: '#4d6088', width: 3 }).opacity(a),
      txt('100%', gx - 18, gy - gh + 8, 26, COSMOS.muted, 'mono', 'right').opacity(a),
      txt('0%', gx - 18, gy + 8, 26, COSMOS.muted, 'mono', 'right').opacity(a),
      txt('Shingle similarity s', gx + gw * 0.5, gy + 108, 28, COSMOS.muted, 'sans').opacity(a),
    );

    // Sample S-curve points up to curveExtent
    const steps = Math.max(2, Math.floor(ext * 60));
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const sVal = i / 60;
      pts.push([gx + sVal * gw, gy - lshProb(sVal) * gh]);
    }
    if (pts.length >= 2) {
      nodes.push(
        glowingTrail(pts, {
          gradientColors: [
            [0, COSMOS.blue],
            [0.5, COSMOS.cyan],
            [1, COSMOS.gold],
          ],
          width: 5,
          glow: 12,
          opacity: a,
        }),
      );
    }

    for (const sMark of [0.25, 0.5, 0.75]) {
      const mx = gx + sMark * gw;
      const my = gy - lshProb(sMark) * gh;
      nodes.push(txt(sMark.toFixed(2), mx, gy + 48, 26, COSMOS.muted, 'mono').opacity(a));
      if (ext >= sMark) {
        nodes.push(
          glowDot(mx, my, { radius: 9, color: COSMOS.gold, glow: 12, opacity: a }),
          txt(
            `${(100 * lshProb(sMark)).toFixed(1)}%`,
            mx - 14,
            my - 30,
            28,
            COSMOS.gold,
            'mono',
            'right',
          )
            .glow(6, COSMOS.gold)
            .opacity(a),
        );
      }
    }

    return group(...nodes);
  });

  // Part 2: Non-transitive chain A-B-C with 6 numbered shingle tiles + strict prediction withholding
  const part2Live = guardedDynamic(showPart2, (a) => {
    const pe = passEdges.value;
    const fe = failEdge.value;
    const qo = questionOn.value;
    const cd = componentDrop.value > 0.5;
    const rc = recipeOn.value;

    const centers = [-575, 0, 575];
    const labels = ['A', 'B', 'C'];
    const union = [1, 2, 3, 4, 5, 6];
    const cardY = -100;

    const nodes = [
      txt(
        'NON-TRANSITIVE CONNECTED COMPONENT · CUTOFF J >= 0.60',
        -855,
        -430,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt('Keep First ID in Component', -855, -355, 52, COSMOS.ink, 'serif', 'left').opacity(a),
    ];

    LSH_CHAIN_SETS.forEach((members, i) => {
      const cx = centers[i];
      const removed = cd && i > 0;
      const col = removed ? COSMOS.dim : i === 0 ? COSMOS.emerald : COSMOS.cyan;

      nodes.push(
        glassCell(cx, cardY, 420, 220, col, {
          fill: removed ? '#0b0e18' : '#101a30',
          glow: removed ? 0 : 8,
          opacity: (removed ? 0.42 : 0.96) * a,
          dash: removed ? [10, 6] : undefined,
        }),
        txt(labels[i], cx, cardY - 58, 56, col, 'serif').opacity(a),
      );

      // 6 numbered shingle slots
      union.forEach((n, j) => {
        const tx = cx - 155 + j * 62;
        const has = members.includes(n);
        nodes.push(
          rect(50, 58, {
            fill: has ? (removed ? '#232c44' : col) : '#0a0e1a',
            stroke: has ? col : '#26324d',
            width: 1.8,
            radius: 6,
          })
            .at(tx, cardY + 42)
            .opacity((has ? 0.95 : 0.45) * a),
        );
        if (has) {
          nodes.push(
            txt(String(n), tx, cardY + 44, 30, removed ? COSMOS.muted : COSMOS.bg, 'mono').opacity(
              a,
            ),
          );
        }
      });

      if (cd) {
        nodes.push(
          txt(
            i === 0 ? 'RETAIN' : 'REMOVE',
            cx,
            cardY + 150,
            30,
            i === 0 ? COSMOS.emerald : COSMOS.rose,
            'mono',
          )
            .glow(6, i === 0 ? COSMOS.emerald : COSMOS.rose)
            .opacity(a),
        );
      }
    });

    // Verified green edges A-B and B-C (both 4/6 = 2/3 >= 0.60)
    if (pe > 0.02) {
      for (let i = 0; i < 2; i++) {
        const x0 = centers[i] + 215;
        const x1 = centers[i + 1] - 215;
        nodes.push(
          glowingTrail(
            [
              [x0, cardY],
              [x1, cardY],
            ],
            { color: COSMOS.emerald, width: 5, glow: 10, opacity: pe * a },
          ),
          txt('4/6 = 2/3', (x0 + x1) * 0.5, cardY - 38, 26, COSMOS.emerald, 'mono').opacity(pe * a),
        );
      }
    }

    // Failed direct A-C edge (2/6 = 1/3 < 0.60)
    if (fe > 0.02) {
      nodes.push(
        txt(
          'Direct A to C: 2/6 = 0.33 < 0.60 -> direct edge fails',
          0,
          128,
          32,
          COSMOS.rose,
          'mono',
        ).opacity(fe * a),
      );
    }

    // Group shingle inventory row (neutral during prediction; reveals 5 & 6 vanished only after componentDrop!)
    if (qo > 0.02) {
      nodes.push(
        txt(
          cd ? 'RETAINED IN A' : 'GROUP SHINGLES',
          -390,
          245,
          28,
          COSMOS.muted,
          'mono',
          'right',
        ).opacity(qo * a),
      );
      union.forEach((val, idx) => {
        const tx = -280 + idx * 120;
        const vanished = cd && !LSH_CHAIN_SETS[0].includes(val);
        const col = vanished ? COSMOS.rose : COSMOS.cyan;
        nodes.push(
          glassCell(tx, 245, 92, 74, col, {
            fill: vanished ? '#24101a' : '#0f2234',
            glow: vanished ? 8 : 5,
            opacity: (vanished ? 0.85 : 0.95) * qo * a,
            dash: vanished ? [8, 5] : undefined,
          }),
          txt(String(val), tx, 247, 34, col, 'mono').opacity(qo * a),
        );
        if (vanished) {
          nodes.push(txt('LOST', tx, 312, 26, COSMOS.rose, 'mono').opacity(a));
        }
      });
    }

    // Bottom status / prompt
    const msg =
      rc > 0.5
        ? 'FineWeb: 5-word shingles · 112 hashes · 14 bands of 8 · direct band links'
        : cd
          ? 'Shingles 5 and 6 disappeared (absent from representative A)'
          : qo > 0.5
            ? 'Keep alphabetically first record in the connected group: which shingles disappear?'
            : 'Each numbered tile marks one distinct shingle';
    nodes.push(
      txt(msg, 0, 412, 32, cd ? COSMOS.gold : COSMOS.ink, 'sans')
        .glow(cd ? 6 : 0, COSMOS.gold)
        .opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, part1Live, part2Live);

  c.on('pt-lsh-chain-formula', () =>
    s.play(formulaOn.to(1, { duration: remainDuration(c, 'pt-lsh-chain-formula', 0.6) })),
  );
  c.show('pt-lsh-chain-formula', eqLsh, { fade: 0.35 });
  c.on('pt-lsh-chain-curve', () =>
    s.play(curveExtent.to(1, { duration: remainDuration(c, 'pt-lsh-chain-curve', 1.6) })),
  );

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.hide(1, [eqLsh], { fade: 0.2 });

  c.on('pt-lsh-chain-pass', () =>
    s.play(passEdges.to(1, { duration: remainDuration(c, 'pt-lsh-chain-pass', 0.6) })),
  );
  c.on('pt-lsh-chain-fail', () =>
    s.play(failEdge.to(1, { duration: remainDuration(c, 'pt-lsh-chain-fail', 0.5) })),
  );
  c.on('pt-lsh-chain-question', () =>
    s.play(questionOn.to(1, { duration: remainDuration(c, 'pt-lsh-chain-question', 0.5) })),
  );
  // Strict prediction withholding: drop B & C and mark 5,6 lost only AFTER spoken reveal
  c.after('pt-lsh-chain-component', () =>
    s.play(
      componentDrop.to(1, { duration: remainAfterDuration(c, 'pt-lsh-chain-component', 0.5) }),
    ),
  );
  c.on('pt-lsh-chain-recipe', () =>
    s.play(recipeOn.to(1, { duration: remainDuration(c, 'pt-lsh-chain-recipe', 0.6) })),
  );
}
