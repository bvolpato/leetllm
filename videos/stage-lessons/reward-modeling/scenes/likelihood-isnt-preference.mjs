// Scene 02: Which answer is more likely? Autoregressive token product chain vs preference choice.
import {
  COSMOS,
  LIKE_A,
  LIKE_A_PREFIX,
  LIKE_A_PROD,
  LIKE_B,
  LIKE_B_PREFIX,
  LIKE_B_PROD,
  afterDuration,
  aura,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  radialDial,
  remainDuration,
  tokenCell,
  txt,
} from '../parts.mjs';

export default function likelihoodIsntPreference(s, c) {
  const step1 = s.value(0.25);
  const step2 = s.value(0);
  const step3 = s.value(0);
  const revealProd = s.value(0);
  const revealRule = s.value(0);

  const bgAura = aura(100, 10, 560, '#5ce1e61e', '#ffd16614');
  const title = heroTitle(['Likelihood Is Not', 'Preference'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.cyan,
    eyebrow: 'TOKEN CHAIN PROBABILITY · AUTOREGRESSIVE WRITER',
  });

  const eq = glowTex(String.raw`P(y \mid x) = \prod_{t=1}^{3} P(y_t \mid x, y_{<t})`, {
    x: 420,
    y: -365,
    size: 38,
    color: COSMOS.gold,
  });

  const tokX = [-445, -145, 155];
  const rowAY = -110;
  const rowBY = 140;

  const live = guardedDynamic(1, () => {
    const s1 = step1.value;
    const s2 = step2.value;
    const s3 = step3.value;
    const rp = revealProd.value;
    const rr = revealRule.value;
    const stepVis = [s1, s2, s3];

    const nodes = [
      // Row labels (clear left margin from first token cell at -445 - 115 = -560)
      txt('REPLY A', -855, rowAY - 18, 32, rr > 0.5 ? COSMOS.emerald : COSMOS.cyan, 'mono', 'left'),
      txt('Waits for review', -855, rowAY + 24, 26, COSMOS.muted, 'sans', 'left'),
      txt('REPLY B', -855, rowBY - 18, 32, rp > 0.5 ? COSMOS.amber : COSMOS.blue, 'mono', 'left'),
      txt('Grants access', -855, rowBY + 24, 26, COSMOS.muted, 'sans', 'left'),

      // Product symbols cleanly positioned in gaps between token cells (no rail crossing text)
      txt('×', -295, rowAY, 34, COSMOS.gold, 'mono').opacity(Math.max(0.35, s2)),
      txt('×', 5, rowAY, 34, COSMOS.gold, 'mono').opacity(Math.max(0.35, s3)),
      txt('×', -295, rowBY, 34, COSMOS.gold, 'mono').opacity(Math.max(0.35, s2)),
      txt('×', 5, rowBY, 34, COSMOS.gold, 'mono').opacity(Math.max(0.35, s3)),
      txt('=', 325, rowAY, 38, COSMOS.gold, 'mono'),
      txt('=', 325, rowBY, 38, COSMOS.gold, 'mono'),
    ];

    // Draw 3 token cells per row (cleanly sized so text has >12px margin from borders)
    for (let i = 0; i < 3; i++) {
      const vis = Math.max(0.38, stepVis[i]);
      const colA = COSMOS.cyan;
      const colB = i === 0 && rp > 0.5 ? COSMOS.amber : COSMOS.blue;
      nodes.push(
        tokenCell(tokX[i], rowAY, 232, 124, colA, {
          fill: '#0e1b2d',
          glow: stepVis[i] > 0.5 ? 8 : 2,
          opacity: vis,
        }),
        txt(LIKE_A.pieces[i], tokX[i], rowAY - 24, 26, COSMOS.ink, 'sans').opacity(vis),
        txt(
          `p = ${LIKE_A.probabilities[i].toFixed(2)}`,
          tokX[i],
          rowAY + 26,
          28,
          COSMOS.gold,
          'mono',
        ).opacity(vis),

        tokenCell(tokX[i], rowBY, 232, 124, colB, {
          fill: '#11192e',
          glow: stepVis[i] > 0.5 ? 8 : 2,
          opacity: vis,
        }),
        txt(LIKE_B.pieces[i], tokX[i], rowBY - 24, 26, COSMOS.ink, 'sans').opacity(vis),
        txt(
          `p = ${LIKE_B.probabilities[i].toFixed(2)}`,
          tokX[i],
          rowBY + 26,
          28,
          i === 0 && rp > 0.5 ? COSMOS.amber : COSMOS.gold,
          'mono',
        ).opacity(vis),
      );
    }

    // Final product dials on right: STRICT WITHHOLDING until revealProd > 0.5!
    const dialX = 495;
    const fracA = rp > 0.5 ? LIKE_A_PROD * 2.5 : 0.08;
    const fracB = rp > 0.5 ? LIKE_B_PROD * 2.5 : 0.08;
    nodes.push(
      radialDial(dialX, rowAY, 90, fracA, {
        color: COSMOS.cyan,
        width: 9,
        glow: rp > 0.5 ? 10 : 3,
      }),
      txt(
        rp > 0.5 ? LIKE_A_PROD.toFixed(2) : '?',
        dialX,
        rowAY + 4,
        36,
        rp > 0.5 ? COSMOS.cyan : COSMOS.gold,
        'mono',
      ).glow(6, rp > 0.5 ? COSMOS.cyan : COSMOS.gold),

      radialDial(dialX, rowBY, 90, fracB, {
        color: rp > 0.5 ? COSMOS.amber : COSMOS.blue,
        width: 9,
        glow: rp > 0.5 ? 12 : 3,
      }),
      txt(
        rp > 0.5 ? LIKE_B_PROD.toFixed(2) : '?',
        dialX,
        rowBY + 4,
        36,
        rp > 0.5 ? COSMOS.amber : COSMOS.gold,
        'mono',
      ).glow(6, rp > 0.5 ? COSMOS.amber : COSMOS.gold),
    );

    // Bottom contrast strip: Likelihood ranking vs Preference ranking
    if (rp < 0.05) {
      nodes.push(
        txt(
          `Prefix A: ${LIKE_A_PREFIX[0].toFixed(2)} → ${LIKE_A_PREFIX[1].toFixed(2)} → ?     |     Prefix B: ${LIKE_B_PREFIX[0].toFixed(2)} → ${LIKE_B_PREFIX[1].toFixed(2)} → ?`,
          0,
          365,
          28,
          COSMOS.muted,
          'mono',
        ),
      );
    } else {
      nodes.push(
        glowingTrail(
          [
            [-780, 365],
            [-140, 365],
          ],
          { color: COSMOS.amber, width: 3.5, opacity: 0.8 * rp },
        ),
        txt('WRITER LIKELIHOOD:  B (0.20) = 2× A (0.10)', -460, 330, 28, COSMOS.amber, 'mono')
          .glow(6, COSMOS.amber)
          .opacity(rp),
      );
    }

    if (rr > 0.05) {
      nodes.push(
        glowingTrail(
          [
            [110, 365],
            [790, 365],
          ],
          { color: COSMOS.emerald, width: 4.0, opacity: 0.9 * rr },
        ),
        txt('APPROVAL RULE P-7:  A  ≻  B', 450, 330, 30, COSMOS.emerald, 'mono')
          .glow(8, COSMOS.emerald)
          .opacity(rr),
        txt(
          'Reward model learns human preference, not token likelihood',
          450,
          405,
          26,
          COSMOS.ink,
          'sans',
        ).opacity(rr),
      );
    }

    // Right-edge annotation
    nodes.push(
      txt('PRODUCT', dialX, -222, 26, COSMOS.muted, 'mono'),
      txt(
        rp > 0.5 ? '2× higher' : 'predict',
        700,
        rowBY,
        28,
        rp > 0.5 ? COSMOS.amber : COSMOS.muted,
        'mono',
      ),
      txt(
        rr > 0.5 ? 'preferred' : 'predict',
        700,
        rowAY,
        28,
        rr > 0.5 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);

  c.on('likelihood-first-piece', () => s.play(step1.to(1, { duration: 0.45 })));
  c.on('likelihood-second-piece', () => s.play(step2.to(1, { duration: 0.45 })));
  c.on('likelihood-third-piece', () => s.play(step3.to(1, { duration: 0.45 })));
  c.after('likelihood-product-result', () =>
    s.play(revealProd.to(1, { duration: afterDuration(c, 'likelihood-product-result', 0.45) })),
  );
  c.on('likelihood-rule-choice', () =>
    s.play(revealRule.to(1, { duration: remainDuration(c, 'likelihood-rule-choice', 0.5) })),
  );
}
