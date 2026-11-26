// Scene 04: What does each word add to the loss? (Signed forward KL terms & constant entropy)
import {
  COSMOS,
  OBJ_KL,
  OBJ_TERMS,
  STUDENT_INIT_PROBS,
  TEACHER_PROBS,
  WORDS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function objective(s, c) {
  const phase = s.value(0);
  const shownCount = s.value(2);
  const sNeg = s.value(0);
  const sFull = s.value(0);
  const sGrad = s.value(0);

  const bgAura = aura(0, 30, 620, '#14335c26', '#2e1d5214');
  const title = heroTitle(['What Does Each Word', 'Add to Forward KL?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'SIGNED LOG-RATIO TERMS · D_KL(q || p) >= 0',
  });

  const eqKl = glowTex('D_{\\mathrm{KL}}(q \\Vert p) = \\sum_i q_i \\ln \\frac{q_i}{p_i}', {
    x: 420,
    y: -355,
    size: 40,
    color: COSMOS.gold,
    glow: 7,
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const cnt = Math.min(4, Math.max(1, Math.round(shownCount.value)));
    const neg = sNeg.value;
    const full = sFull.value;
    const grd = sGrad.value;

    const zeroY = 55;
    const pxPerNat = 165;
    const subtotal = OBJ_TERMS.slice(0, cnt).reduce((acc, v) => acc + v, 0);

    const nodes = [
      // Zero baseline across the four signed token columns
      line([-840, zeroY], [180, zeroY], { stroke: COSMOS.rule, width: 2.6 }),
      txt('0.0', -855, zeroY, 26, COSMOS.muted, 'mono', 'right'),
      txt('POSITIVE  (q > p)', -760, -206, 26, COSMOS.emerald, 'mono', 'left'),
      txt('NEGATIVE  (p > q)', -250, -206, 26, COSMOS.rose, 'mono', 'left'),
    ];

    WORDS.forEach((word, i) => {
      const cx = -700 + i * 245;
      const term = OBJ_TERMS[i];
      const active = i < cnt;
      const isPos = term >= 0;
      const col = isPos ? COSMOS.emerald : COSMOS.rose;
      const barH = Math.max(16, Math.abs(term) * pxPerNat);
      const barCenterY = isPos ? zeroY - barH * 0.5 : zeroY + barH * 0.5;
      const isHighlight = (neg > 0.3 && i === 2) || (full > 0.3 && active);

      nodes.push(
        txt(word, cx, -156, 32, active ? COSMOS.ink : COSMOS.dim, 'mono'),
        txt(`q ${TEACHER_PROBS[i].toFixed(2)}`, cx, 224, 26, COSMOS.blue, 'mono'),
        txt(`p ${STUDENT_INIT_PROBS[i].toFixed(2)}`, cx, 264, 26, COSMOS.cyan, 'mono'),
      );

      if (active) {
        nodes.push(
          rect(112, barH, {
            fill: isPos ? '#113e35' : '#3d1527',
            stroke: col,
            width: 2.6,
            radius: 8,
          })
            .at(cx, barCenterY)
            .glow(isHighlight ? 9 * pulse : 4, col),
          txt(
            `${isPos ? '+' : '-'}${Math.abs(term).toFixed(3)}`,
            cx,
            isPos ? zeroY - barH - 28 : zeroY + barH + 30,
            30,
            col,
            'mono',
          ),
        );
      } else {
        nodes.push(txt('...', cx, zeroY - 28, 28, COSMOS.dim, 'mono'));
      }
    });

    // Right side: Running KL total & Soft Cross-Entropy equivalence
    const rx = 530;
    nodes.push(
      glassCell(rx, -84, 620, 204, cnt === 4 ? COSMOS.emerald : COSMOS.gold, {
        fill: cnt === 4 ? '#0f2c27' : '#221c0e',
        glow: full > 0.3 ? 10 * pulse : 5,
      }),
      txt(
        cnt === 4 ? 'FORWARD KL TOTAL (4/4 TERMS)' : `RUNNING SUBTOTAL (${cnt}/4 TERMS)`,
        rx,
        -148,
        26,
        COSMOS.muted,
        'mono',
      ),
      txt(
        `${subtotal.toFixed(3)} nats`,
        rx,
        -76,
        58,
        cnt === 4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).glow(8, cnt === 4 ? COSMOS.emerald : COSMOS.gold),
      txt(
        cnt === 4 ? 'Always >= 0 (0 iff p == q)' : 'Positive + negative terms cancel partially',
        rx,
        -16,
        26,
        COSMOS.muted,
        'sans',
      ),

      glassCell(rx, 146, 620, 178, grd > 0.35 ? COSMOS.cyan : COSMOS.rule, {
        fill: '#101d35',
        glow: grd > 0.35 ? 8 * pulse : 2,
        opacity: Math.max(0.74, grd),
      }),
      txt('CROSS-ENTROPY = KL + H(q)', rx, 94, 26, COSMOS.cyan, 'mono').opacity(
        Math.max(0.74, grd),
      ),
      txt('H(q) fixed for frozen teacher', rx, 146, 28, COSMOS.ink, 'sans').opacity(
        Math.max(0.74, grd),
      ),
      txt('-> identical student gradients', rx, 194, 28, COSMOS.gold, 'mono').opacity(
        Math.max(0.74, grd),
      ),

      glowDot(-835, 362, { radius: 6, color: COSMOS.gold }),
      txt(
        grd > 0.35
          ? 'Minimizing soft cross-entropy minimizes forward KL exactly'
          : neg > 0.35
            ? 'Cat has p > q, so ln(q/p) < 0, yet the full KL sum stays strictly >= 0'
            : `Full 4-token forward KL = ${OBJ_KL.toFixed(3)} nats at T = 1`,
        -808,
        364,
        28,
        grd > 0.35 ? COSMOS.cyan : COSMOS.gold,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eqKl, live);
  runPhase(s, c, phase, 14);

  c.on('objective-b1-1', () => s.play(shownCount.to(2, { duration: 0.4 })));
  c.on('objective-b1-2', () => s.play(shownCount.to(4, { duration: 1.1 })));
  c.on('objective-b2-1', () => s.play(sNeg.to(1, { duration: 0.45 })));
  c.on('objective-b2-2', () => s.play(sFull.to(1, { duration: 0.45 })));
  c.on('objective-b3-1', () =>
    s.play(sGrad.to(1, { duration: remainDuration(c, 'objective-b3-1', 0.5) })),
  );
}
