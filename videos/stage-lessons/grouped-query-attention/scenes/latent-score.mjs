// Scene 14: latent-score - Exact MLA matrix absorption: (W^T q)^T c = q^T (W c) reused across history.
import {
  COSMOS,
  MLA,
  ROLE,
  buildVectorPlane,
  cinemaAtmosphere,
  dotProd,
  glowDot,
  glowTex,
  glowVector,
  group,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  playCue,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function latentScore(s, c) {
  const k0 = MLA.W.map((row) => dotProd(row, MLA.c0)); // [5, 2]
  const qPrime = MLA.WT.map((row) => dotProd(row, MLA.q)); // [1, 2]
  const s0 = dotProd(MLA.q, k0); // 5
  const s1 = dotProd(qPrime, MLA.c1); // 3

  const phase = s.value(0);
  const stepRow = s.value(0);
  const stepKey = s.value(0);
  const stepScore = s.value(0);
  const stepTranspose = s.value(0);
  const stepQuery = s.value(0);
  const stepAgain = s.value(0);
  const stepMove = s.value(0);
  const stepAsk = s.value(0);
  const stepReuse = s.value(0);
  const stepNext = s.value(0);
  const stepValue = s.value(0);
  const stepFuse = s.value(0);

  const title = heroTitle(['Which vector can travel', 'down the history?'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.query,
    eyebrow: 'MLA MATRIX ABSORPTION · EXACT ALGEBRA',
  });

  const eqTop = glowTex(
    String.raw`q^{\top}\!\left(W c_s\right) \;=\; \left(W^{\top} q\right)^{\top} c_s`,
    { x: 465, y: -395, size: 38, color: ROLE.gold, glow: 7 },
  );

  const valEq = glowTex(
    String.raw`\sum_i \alpha_i \left(W_V c_i\right) \;=\; W_V\!\left(\sum_i \alpha_i c_i\right)`,
    { x: 0, y: 425, size: 36, color: ROLE.value, glow: 7 },
  );

  // Clean vector plane shown on the right before 'transpose' replaces it with the absorbed path
  const plane = buildVectorPlane({
    originX: 115,
    originY: 120,
    scale: 110,
    xMin: -0.3,
    xMax: 5.6,
    yMin: -0.3,
    yMax: 2.6,
    step: 1,
    xLabel: 'x₁',
    yLabel: 'x₂',
    showTicks: true,
  });

  /** Draw a clean luminous 2x2 or 2x1 matrix with brackets (zero box clutter). */
  function drawMat(cx, cy, rows, col, hiRow = -1, alpha = 1) {
    const rCount = rows.length;
    const cCount = rows[0].length;
    const cw = 64;
    const ch = 54;
    const totalW = cCount * cw;
    const totalH = rCount * ch;
    const x0 = cx - totalW / 2;
    const y0 = cy - totalH / 2;
    const out = [
      line([x0 - 10, y0 - 6], [x0 - 10, y0 + totalH + 6], {
        stroke: '#6d82b5',
        width: 2.6,
      }).opacity(alpha),
      line([x0 + totalW + 10, y0 - 6], [x0 + totalW + 10, y0 + totalH + 6], {
        stroke: '#6d82b5',
        width: 2.6,
      }).opacity(alpha),
    ];
    for (let r = 0; r < rCount; r++) {
      for (let k = 0; k < cCount; k++) {
        const x = x0 + (k + 0.5) * cw;
        const y = y0 + (r + 0.5) * ch;
        const lit = hiRow === r;
        if (lit) {
          out.push(
            lumBar(x, y, cw - 6, ch - 6, {
              color: ROLE.gold,
              fillOpacity: 0.28,
              strokeWidth: 2,
              glow: 8,
              radius: 5,
              opacity: alpha,
            }),
          );
        }
        out.push(
          txt(String(rows[r][k]), x, y, 32, lit ? ROLE.gold : col, 'mono', 'center').opacity(alpha),
        );
      }
    }
    return out;
  }

  const live = guardedDynamic(1, () => {
    const rw = stepRow.value;
    const ky = stepKey.value;
    const sc = stepScore.value;
    const tr = stepTranspose.value;
    const qr = stepQuery.value;
    const ag = stepAgain.value;
    const mv = stepMove.value;
    const ask = stepAsk.value;
    const ru = stepReuse.value;
    const nx = stepNext.value;
    const vl = stepValue.value;

    const nodes = [rule(-25, -305, -25, 360, COSMOS.rule, 1.6).opacity(0.6)];

    // --- LEFT: Expand historical key per position (W c0 = k0) ---
    nodes.push(
      txt('EXPAND KEY · ONE MATMUL PER POSITION', -455, -260, 26, COSMOS.muted, 'mono', 'center'),
      txt('W', -670, -182, 28, ROLE.key, 'mono', 'center'),
      txt('c₀', -465, -182, 28, ROLE.pos, 'mono', 'center'),
      txt('=', -375, -92, 36, COSMOS.muted, 'mono', 'center'),
      txt('k₀', -285, -182, 28, ROLE.key, 'mono', 'center'),
      ...drawMat(-670, -92, MLA.W, ROLE.key, rw > 0.3 && ky < 0.5 ? 0 : -1, 1),
      ...drawMat(-465, -92, [[MLA.c0[0]], [MLA.c0[1]]], ROLE.pos, -1, 1),
      ...drawMat(
        -285,
        -92,
        [[rw > 0.3 ? String(k0[0]) : '?'], [ky > 0.5 ? String(k0[1]) : '?']],
        ky > 0.5 ? ROLE.key : ROLE.gold,
        -1,
        1,
      ),
    );

    if (rw > 0.02) {
      nodes.push(txt('1·1 + 2·2 = 5', -455, 18, 30, ROLE.gold, 'mono', 'center').opacity(rw));
    }
    if (ky > 0.02) {
      nodes.push(
        txt(`k₀ = (${k0[0]}, ${k0[1]})`, -455, 72, 34, ROLE.key, 'mono', 'center').opacity(ky),
      );
    }
    if (sc > 0.02) {
      nodes.push(
        txt(`q · k₀ = (1, 0) · (5, 2) = ${s0}`, -455, 145, 34, ROLE.gold, 'mono', 'center')
          .glow(8, ROLE.gold)
          .opacity(sc),
      );
    }
    if (vl > 0.02) {
      nodes.push(
        txt(
          'Value projection is linear too: weight latents first',
          -455,
          245,
          28,
          ROLE.value,
          'sans',
          'center',
        ).opacity(vl),
      );
    }

    // --- RIGHT: Before 'transpose' show geometric dot product; after 'transpose' show absorbed query ---
    const geomOp = Math.max(0, 1 - tr * 2);
    const absOp = Math.max(0, (tr - 0.5) * 2);

    if (geomOp > 0.02) {
      nodes.push(
        txt(
          'DOT PRODUCT WITH CURRENT QUERY q = (1, 0)',
          440,
          -260,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(geomOp),
        plane.node.opacity(geomOp),
        glowVector(plane.origin, plane.toScreen(...MLA.q), {
          color: ROLE.query,
          width: 6.5,
          tipSize: 16,
          glow: 9,
          opacity: geomOp,
        }),
        txt('q = (1, 0)', ...plane.toScreen(1.0, -1.05), 26, ROLE.query, 'mono', 'center').opacity(
          geomOp,
        ),
      );
      if (ky > 0.02) {
        nodes.push(
          glowVector(plane.origin, plane.toScreen(...k0), {
            color: ROLE.key,
            width: 5.5,
            tipSize: 15,
            glow: 8,
            opacity: ky * geomOp,
          }),
          txt('k₀ = (5, 2)', ...plane.toScreen(4.8, 2.35), 28, ROLE.key, 'mono', 'center').opacity(
            ky * geomOp,
          ),
        );
      }
      if (sc > 0.02) {
        const proj = plane.toScreen(s0, 0);
        nodes.push(
          line(plane.toScreen(...k0), proj, { stroke: ROLE.gold, width: 3, dash: [7, 5] }).opacity(
            sc * geomOp,
          ),
          glowDot(proj[0], proj[1], {
            radius: 8,
            color: ROLE.gold,
            glow: 12,
            opacity: sc * geomOp,
          }),
          txt('score = 5', proj[0], proj[1] + 115, 30, ROLE.gold, 'mono', 'center').opacity(
            sc * geomOp,
          ),
        );
      }
    }

    if (absOp > 0.02) {
      nodes.push(
        txt(
          'ABSORB INTO QUERY · COMPUTE ONCE',
          440,
          -260,
          26,
          ROLE.query,
          'mono',
          'center',
        ).opacity(absOp),
        txt('Wᵀ', 225, -182, 28, ROLE.key, 'mono', 'center').opacity(absOp),
        txt('q', 430, -182, 28, ROLE.query, 'mono', 'center').opacity(absOp),
        txt('=', 520, -92, 36, COSMOS.muted, 'mono', 'center').opacity(absOp),
        txt('q′', 610, -182, 28, ROLE.gold, 'mono', 'center').opacity(absOp),
        ...drawMat(225, -92, MLA.WT, ROLE.key, -1, absOp),
        ...drawMat(430, -92, [[MLA.q[0]], [MLA.q[1]]], ROLE.query, -1, absOp),
        ...drawMat(
          610,
          -92,
          [[qr > 0.5 ? String(qPrime[0]) : '?'], [qr > 0.5 ? String(qPrime[1]) : '?']],
          ROLE.gold,
          -1,
          absOp,
        ),
      );

      if (ag > 0.02) {
        nodes.push(
          txt(`Pos 0:  q′ · c₀ = (1, 2) · (1, 2) = ${s0}`, 440, 42, 32, ROLE.gold, 'mono', 'center')
            .glow(7, ROLE.gold)
            .opacity(ag * absOp),
        );
      }

      // Position 1 arrives -> prediction withheld until c.after('reuse') & c.after('next')
      if (mv > 0.02) {
        nodes.push(
          rule(120, 96, 760, 96, COSMOS.rule, 1.5).opacity(0.6 * mv * absOp),
          txt('Pos 1 arrives:  c₁ = (3, 0)', 440, 142, 32, ROLE.pos, 'mono', 'center').opacity(
            mv * absOp,
          ),
        );
      }
      if (ru > 0.02) {
        nodes.push(
          txt(
            nx > 0.5
              ? `Reuse q′ = (1, 2)  →  (1, 2) · (3, 0) = ${s1}`
              : 'Reuse q′ = (1, 2)  →  (1, 2) · (3, 0) = ?',
            440,
            218,
            32,
            nx > 0.5 ? ROLE.gold : ROLE.query,
            'mono',
            'center',
          )
            .glow(8, nx > 0.5 ? ROLE.gold : ROLE.query)
            .opacity(ru * absOp),
        );
      } else if (ask > 0.02) {
        nodes.push(
          txt('Which vector can we reuse?', 440, 218, 34, ROLE.gold, 'serif', 'center')
            .glow(8, ROLE.gold)
            .opacity(ask * absOp),
        );
      }
      if (nx > 0.02) {
        nodes.push(
          txt(
            'q′ depends only on current head & query  ·  zero key expansion',
            440,
            286,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(nx * absOp),
        );
      }
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.query, ROLE.pos), title, eqTop, live);
  c.show('fuse', valEq, { after: true, fade: 0.45 });
  runPhase(s, c, phase, 14);

  playCue(s, c, 'row', (d) => s.play(stepRow.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'key', (d) => s.play(stepKey.to(1, { duration: d })), { after: true, dur: 0.5 });
  playCue(s, c, 'score', (d) => s.play(stepScore.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'transpose', (d) => s.play(stepTranspose.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'query', (d) => s.play(stepQuery.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'again', (d) => s.play(stepAgain.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'move', (d) => s.play(stepMove.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'ask', (d) => s.play(stepAsk.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'reuse', (d) => s.play(stepReuse.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'next', (d) => s.play(stepNext.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'value', (d) => s.play(stepValue.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'fuse', (d) => s.play(stepFuse.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
}
