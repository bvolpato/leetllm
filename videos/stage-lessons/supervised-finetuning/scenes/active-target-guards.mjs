// Scene 09: Did a usable target survive?: 4-token vocab gradient verify (ln 4) + max_length=5 truncation NaN guard.
import {
  COSMOS,
  LOG_FOUR,
  TOKENS,
  arrow,
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
  streamX,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function activeTargetGuards(s, c) {
  const phase = s.value(0);
  const showFixture = s.value(0);
  const showLogFour = s.value(0);
  const truncMode = s.value(0);
  const cutProg = s.value(0);

  const bgAura = aura(0, 30, 620, '#6ee7b71a', '#ff6b8b14');
  const title = heroTitle(['Active Target', 'Guards'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.emerald,
    eyebrow: 'SHIFT VERIFICATION & TRUNCATION SAFETY',
  });

  const eqLog4 = glowTex(String.raw`-\ln\!\left(\tfrac{1}{4}\right) = \ln 4 \approx 1.386`, {
    x: 470,
    y: -365,
    size: 38,
    color: COSMOS.emerald,
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sf = showFixture.value;
    const lf = showLogFour.value;
    const tm = truncMode.value;
    const cut = cutProg.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [];

    if (tm < 0.5) {
      // Beat 0: 4-position vocabulary=4 verification check
      const a = 1 - tm * 2;
      const xs = [-540, -180, 180, 540];
      const inputs = ['prompt', 'assistant', 'answer', 'stop'];
      const labels = ['−100', '−100', 'ID 2', 'ID 3'];

      nodes.push(
        txt(
          '4-POSITION SHIFT CHECK · VOCAB SIZE = 4 · ALL LOGITS = 0 (p = 0.25)',
          0,
          -238,
          26,
          COSMOS.cyan,
          'mono',
        ).opacity(a),
        txt('LOGIT ROW', -835, -110, 26, COSMOS.blue, 'mono', 'left').opacity(a),
        txt('LABELS', -835, 145, 26, COSMOS.emerald, 'mono', 'left').opacity(a),
      );

      inputs.forEach((word, i) => {
        const x = xs[i];
        const hasGrad = i === 1 || i === 2;
        const activeLbl = i >= 2;
        nodes.push(
          tokenPill(word, x, -110, {
            w: 256,
            h: 88,
            color: hasGrad ? COSMOS.gold : COSMOS.blue,
            textColor: hasGrad ? COSMOS.gold : COSMOS.ink,
            glow: hasGrad ? 11 * pulse : 5,
            opacity: a,
            index: `row ${i}`,
            indexColor: hasGrad ? COSMOS.gold : COSMOS.muted,
          }),
          // 4-cell uniform logit strip inside row
          ...Array.from({ length: 4 }, (_, v) =>
            rect(52, 20, {
              fill: hasGrad ? '#272010' : '#10182b',
              stroke: hasGrad ? COSMOS.gold : '#2f3d62',
              width: 1.5,
              radius: 4,
            })
              .at(x - 90 + v * 60, -45)
              .opacity(Math.max(0.4, sf) * a),
          ),
          tokenPill(labels[i], x, 145, {
            w: 256,
            h: 88,
            color: activeLbl ? COSMOS.emerald : COSMOS.dim,
            fill: activeLbl ? '#0c2624' : '#0b0e19',
            textColor: activeLbl ? COSMOS.emerald : COSMOS.dim,
            dash: activeLbl ? undefined : [7, 5],
            glow: activeLbl ? 10 * pulse : 0,
            opacity: (activeLbl ? 1 : 0.6) * a,
          }),
        );

        if (activeLbl) {
          nodes.push(
            arrow([xs[i - 1], -24], [x, 94], { stroke: COSMOS.gold, width: 4.5, tip: 13 })
              .glow(9, COSMOS.gold)
              .opacity(Math.max(0.35, sf) * a),
          );
        }
      });

      const footCol = lf > 0.5 ? COSMOS.emerald : COSMOS.gold;
      const footMsg =
        lf > 0.5
          ? `Only rows 1 & 2 get direct gradients  ·  Each loss = −ln(¼) = ln 4 ≈ ${LOG_FOUR.toFixed(3)}`
          : 'Equal logits across 4 classes → p = ¼ for every target';
      nodes.push(
        glassCell(0, 345, 1620, 102, footCol, { fill: '#101829', glow: 8, opacity: a }),
        txt(footMsg, 0, 345, 29, footCol, 'mono').opacity(a),
      );
    } else {
      // Beat 1: max_length = 5 truncation shears off the entire reply (usable targets 3 -> 0 -> NaN)
      const a = Math.min(1, (tm - 0.5) * 2);
      const wallX = (streamX(4) + streamX(5)) * 0.5;
      const clipped = cut > 0.4;
      const usable = clipped ? 0 : 3;

      nodes.push(
        txt(
          'INCIDENT T102 UNDER max_length = 5',
          -830,
          -225,
          26,
          COSMOS.amber,
          'mono',
          'left',
        ).opacity(a),
        // Glowing rose truncation guillotine line at position 5
        line([wallX, -210], [wallX, 115], { stroke: COSMOS.rose, width: 5 })
          .glow(12 * pulse, COSMOS.rose)
          .opacity(a),
        glowDot(wallX, -210, { radius: 8, color: COSMOS.rose, opacity: a }),
        txt('LENGTH LIMIT = 5', wallX, -245, 28, COSMOS.rose, 'mono')
          .glow(6, COSMOS.rose)
          .opacity(a),
      );

      TOKENS.forEach((word, i) => {
        const x = streamX(i);
        const isCut = i >= 5;
        const dropY = isCut ? cut * 130 : 0;
        const cellAlpha = isCut ? Math.max(0.18, 1 - cut * 0.8) * a : a;
        const col = isCut ? COSMOS.rose : COSMOS.blue;
        nodes.push(
          tokenPill(word, x, -65 + dropY, {
            color: col,
            fill: isCut ? '#21101b' : '#101a30',
            textColor: isCut ? COSMOS.rose : COSMOS.ink,
            dash: isCut && clipped ? [8, 5] : undefined,
            glow: isCut && !clipped ? 8 : 4,
            opacity: cellAlpha,
            index: i,
            indexColor: isCut ? COSMOS.rose : COSMOS.muted,
          }),
        );
      });

      // Live target counter + NaN warning
      const resCol = usable === 0 ? COSMOS.rose : COSMOS.emerald;
      nodes.push(
        glassCell(-430, 235, 720, 128, COSMOS.cyan, { fill: '#101a30', glow: 7, opacity: a }),
        txt('RETAINED INPUT POSITIONS', -430, 200, 26, COSMOS.muted, 'mono').opacity(a),
        txt(
          clipped ? '5 of 8 (context only)' : '8 of 8',
          -430,
          255,
          34,
          COSMOS.cyan,
          'mono',
        ).opacity(a),

        glassCell(430, 235, 720, 128, resCol, {
          fill: usable === 0 ? '#24101a' : '#0c2624',
          glow: 10,
          opacity: a,
        }),
        txt('USABLE SHIFTED TARGETS', 430, 200, 26, COSMOS.muted, 'mono').opacity(a),
        txt(
          usable === 0 ? '0  →  0 / 0 = NaN!' : '3  (open, ticket, END)',
          430,
          255,
          36,
          resCol,
          'mono',
        )
          .glow(8, resCol)
          .opacity(a),

        txt(
          usable === 0
            ? 'Count usable labels after shift & truncation · Drop or raise max_length before training'
            : 'Five context tokens fill the entire length-5 window',
          0,
          388,
          28,
          usable === 0 ? COSMOS.rose : COSMOS.gold,
          'sans',
        ).opacity(a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('active-target-guards-b1', () => s.play(showFixture.to(1, { duration: 0.45 })));
  c.show('active-log-four', eqLog4);
  c.after('active-log-four', () => s.play(showLogFour.to(1, { duration: 0.35 })));
  c.hide('active-target-guards-b2', [eqLog4], { fade: 0.25 });
  c.on('active-target-guards-b2', () => s.play(truncMode.to(1, { duration: 0.45 })));
  c.on('active-truncated', () =>
    s.play(cutProg.to(1, { duration: remainDuration(c, 'active-truncated', 0.85) })),
  );
}
