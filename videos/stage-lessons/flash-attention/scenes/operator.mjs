// Scene 03: What does the full row return?: Dense reference computation from scores to 32.405.
import {
  COSMOS,
  DENSE_ALL,
  DENSE_OUTPUT,
  DENSE_PROBS,
  DENSE_TERMS,
  PROMPT_3,
  SCORES,
  VALUES,
  aura,
  glassCell,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function operator(s, c) {
  const kFix = s.value(0);
  const kThis = s.value(0);
  const kTest = s.value(0);
  const showW = s.value(0);
  const showP = s.value(0);
  const showT = s.value(0);
  const showOut = s.value(0);

  const bgAura = aura(150, 60, 560, '#5ce1e622', '#6ee7b714');
  const title = heroTitle(['Dense', 'Reference'], {
    x: -855,
    y: -410,
    size: 60,
    lineHeight: 70,
    accent: COSMOS.cyan,
    eyebrow: 'EXACT FULL-ROW ATTENTION',
  });

  const eq = glowTex(String.raw`o = \sum_j \frac{e^{s_j - m}}{\sum_k e^{s_k - m}}\,v_j`, {
    x: -645,
    y: 120,
    size: 34,
    color: COSMOS.gold,
  });

  const colX = [-120, 260, 640];
  const colColors = [COSMOS.blue, COSMOS.cyan, COSMOS.gold];
  const rawW = SCORES.map((sc) => Math.exp(sc - DENSE_ALL.m));

  const live = guardedDynamic(1, () => {
    const vis = [kFix.value, kThis.value, kTest.value];
    const sw = showW.value;
    const sp = showP.value;
    const st = showT.value;
    const so = showOut.value;

    const nodes = [
      // Row labels on the left of columns
      txt('SCORE & VALUE', -440, -315, 26, COSMOS.muted, 'mono', 'right'),
      txt('exp(s − 3)', -440, -140, 26, COSMOS.gold, 'mono', 'right').opacity(Math.max(0.25, sw)),
      txt('SHARE p', -440, 25, 26, COSMOS.cyan, 'mono', 'right').opacity(Math.max(0.25, sp)),
      txt('TERM p · v', -440, 185, 26, COSMOS.emerald, 'mono', 'right').opacity(Math.max(0.25, st)),
    ];

    for (let i = 0; i < 3; i++) {
      const cx = colX[i];
      const col = colColors[i];
      const kv = Math.max(0.22, vis[i]);

      // Score & value header cell
      nodes.push(
        txt(PROMPT_3[i], cx, -395, 34, col, 'serif').glow(6, col).opacity(kv),
        glassCell(cx, -315, 290, 92, col, {
          fill: '#11192e',
          glow: vis[i] > 0.5 ? 9 : 3,
          opacity: kv,
        }),
        txt(`s = ${SCORES[i]}  ·  v = ${VALUES[i]}`, cx, -315, 28, COSMOS.ink, 'mono').opacity(kv),
      );

      // Exponential weights (skeleton visible dim from start so frame is balanced)
      nodes.push(
        glassCell(cx, -140, 260, 82, sw > 0.05 ? COSMOS.gold : '#263457', {
          fill: sw > 0.05 ? '#1a1720' : '#0c1122',
          glow: sw > 0.05 ? 6 : 0,
          opacity: Math.max(0.45, sw),
        }),
      );
      if (sw > 0.02) {
        nodes.push(txt(rawW[i].toFixed(3), cx, -140, 32, COSMOS.gold, 'mono').opacity(sw));
      }

      // Softmax share bars (track skeleton visible from start)
      nodes.push(
        rect(250, 36, { fill: '#111a2e', stroke: '#2b3a60', width: 1.5, radius: 6 })
          .at(cx, 25)
          .opacity(Math.max(0.55, sp)),
      );
      if (sp > 0.02) {
        const barW = Math.max(24, DENSE_PROBS[i] * 250 * sp);
        nodes.push(
          rect(barW, 28, { fill: col, stroke: null, radius: 5 })
            .at(cx - 125 + barW * 0.5, 25)
            .glow(7, col)
            .opacity(0.9 * sp),
          txt(`${(DENSE_PROBS[i] * 100).toFixed(1)}%`, cx, 72, 26, col, 'mono').opacity(sp),
        );
      }

      // Weighted value contribution (skeleton visible from start)
      nodes.push(
        glassCell(cx, 185, 260, 82, st > 0.05 ? COSMOS.emerald : '#263457', {
          fill: st > 0.05 ? '#0e2224' : '#0c1122',
          glow: st > 0.05 ? 7 : 0,
          opacity: Math.max(0.45, st),
        }),
      );
      if (st > 0.02) {
        nodes.push(
          txt(DENSE_TERMS[i].toFixed(2), cx, 185, 32, COSMOS.emerald, 'mono').opacity(st),
          glowingArc([cx, 228], [260, 322], 24, {
            color: col,
            width: 3.4,
            opacity: 0.85 * st,
          }),
        );
      }
    }

    // Converged dense output box (dim frame from start, lights up on reveal)
    nodes.push(
      glassCell(260, 370, 520, 96, so > 0.05 ? COSMOS.emerald : '#263457', {
        fill: so > 0.05 ? '#0d2626' : '#0c1122',
        glow: so > 0.05 ? 12 : 0,
        opacity: Math.max(0.45, so),
      }),
    );
    if (so > 0.02) {
      nodes.push(
        txt(`Dense Output ≈ ${DENSE_OUTPUT.toFixed(1)}`, 260, 370, 40, COSMOS.emerald, 'mono')
          .glow(8, COSMOS.emerald)
          .opacity(so),
        txt('Guaranteed inside [10, 40]', -620, 370, 28, COSMOS.muted, 'sans').opacity(so),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);

  c.on('dense-input', () => s.play(kFix.to(0.5, { duration: 0.3 })));
  c.on('key-fix', () => s.play(kFix.to(1, { duration: 0.4 })));
  c.on('key-this', () => s.play(kThis.to(1, { duration: 0.4 })));
  c.on('key-test', () => s.play(kTest.to(1, { duration: 0.4 })));
  c.on('dense-weights', () => s.play(showW.to(1, { duration: 0.45 })));
  c.on('dense-shares', () => s.play(showP.to(1, { duration: 0.5 })));
  c.on('dense-terms', () => s.play(showT.to(1, { duration: 0.5 })));
  c.after('dense-output', () =>
    s.play(showOut.to(1, { duration: remainDuration(c, 'dense-output', 0.45) })),
  );
}
