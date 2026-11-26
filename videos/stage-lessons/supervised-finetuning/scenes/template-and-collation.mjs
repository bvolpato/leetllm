// Scene 08: When the stop ID also means padding: Shared ID 2 prediction withholding + TRL format defaults.
import {
  COSMOS,
  PAD_IDS,
  PAD_LABELS_BY_POS,
  PAD_TOKENS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function templateAndCollation(s, c) {
  const phase = s.value(0);
  const highlightDup = s.value(0);
  const resolvedStop = s.value(0);
  const formatView = s.value(0);
  const assistantOnly = s.value(0);

  const bgAura = aura(0, 30, 620, '#ffd1661c', '#5ce1e614');
  const title = heroTitle(['When Stop ID', 'Equals Pad ID'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'COLLATION · POSITION-BASED MASKING',
  });

  const colX = (i) => -505 + i * 240;

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const dup = highlightDup.value;
    const res = resolvedStop.value;
    const fv = formatView.value;
    const ao = assistantOnly.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [];

    if (fv < 0.5) {
      const a = 1 - fv * 2;
      const wallX = (colX(3) + colX(4)) * 0.5;
      const activeCount = PAD_LABELS_BY_POS.filter((v) => v !== -100).length;

      nodes.push(
        txt('REAL REPLY', (colX(0) + colX(3)) * 0.5, -225, 28, COSMOS.cyan, 'mono').opacity(a),
        txt('RIGHT PADDING', (colX(4) + colX(5)) * 0.5, -225, 28, COSMOS.dim, 'mono').opacity(a),
        line([wallX, -238], [wallX, 222], { stroke: COSMOS.gold, width: 4, dash: [10, 6] })
          .glow(8, COSMOS.gold)
          .opacity(a),
        txt('TOKEN', -830, -120, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
        txt('TOKEN ID', -830, 12, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('LOSS LABEL', -830, 148, 26, COSMOS.emerald, 'mono', 'left').opacity(a),
      );

      PAD_TOKENS.forEach((tok, i) => {
        const x = colX(i);
        const id = PAD_IDS[i];
        const isPad = i >= 4;
        const isShared2 = id === 2;
        const lblVal = PAD_LABELS_BY_POS[i];

        // Token row
        nodes.push(
          glassCell(x, -120, 206, 86, isPad ? COSMOS.dim : COSMOS.blue, {
            fill: isPad ? '#0c0f1b' : '#101a30',
            dash: isPad ? [7, 5] : undefined,
            glow: isPad ? 0 : 6,
            opacity: (isPad ? 0.72 : 1) * a,
          }),
          txt(tok, x, -120, 30, isPad ? COSMOS.dim : COSMOS.ink, 'mono').opacity(a),
        );

        // Token ID row
        const idCol = isShared2 && dup > 0.3 ? COSMOS.gold : COSMOS.ink;
        nodes.push(
          txt(String(id), x, 12, 40, idCol, 'mono')
            .glow(isShared2 && dup > 0.3 ? 8 * pulse : 0, COSMOS.gold)
            .opacity(a),
        );

        // Label row (strictly withhold ID 2 positions as "?" until keep-stop!)
        const unresolved = res < 0.5 && isShared2;
        const active = lblVal !== -100;
        const lblText = unresolved ? '?' : active ? String(lblVal) : '−100';
        const lblCol = unresolved ? COSMOS.gold : active ? COSMOS.emerald : COSMOS.dim;
        nodes.push(
          glassCell(x, 148, 206, 88, lblCol, {
            fill: unresolved ? '#201b10' : active ? '#0c2624' : '#0b0e19',
            dash: !active && !unresolved ? [7, 5] : undefined,
            glow: unresolved || active ? 10 * pulse : 0,
            opacity: (!active && !unresolved ? 0.65 : 1) * a,
          }),
          txt(lblText, x, 148, unresolved ? 44 : 34, lblCol, 'mono').opacity(a),
        );
      });

      const footCol = res > 0.5 ? COSMOS.emerald : COSMOS.gold;
      const footMsg =
        res > 0.5
          ? `Mask padding by position (keep END at pos 3)  ·  ${activeCount} active targets`
          : 'Three identical ID 2 slots: which one belongs in the loss?';
      nodes.push(
        glassCell(0, 338, 1620, 102, footCol, { fill: '#101829', glow: 8, opacity: a }),
        txt(footMsg, 0, 338, 30, footCol, 'mono').opacity(a),
      );
    } else {
      // Beat 2: Dataset format defaults (prompt+completion vs messages)
      const a = Math.min(1, (fv - 0.5) * 2);
      const cxs = [-130, 270, 660];
      const headers = ['PROMPT TOKENS', 'REPLY TEXT', 'TURN ENDING'];
      headers.forEach((h, i) => {
        nodes.push(txt(h, cxs[i], -165, 26, COSMOS.muted, 'mono').opacity(a));
      });

      const rows = [
        { name: 'Prompt + Completion', scores: [false, true, true] },
        { name: 'Messages (chat list)', scores: [ao < 0.5, true, true] },
      ];
      rows.forEach((row, r) => {
        const y = -20 + r * 185;
        nodes.push(
          glassCell(-575, y, 520, 108, r === 1 && ao > 0.5 ? COSMOS.emerald : COSMOS.blue, {
            fill: '#101a30',
            glow: 7,
            opacity: a,
          }),
          txt(row.name, -575, y, 32, COSMOS.ink, 'sans').opacity(a),
        );
        row.scores.forEach((scored, i) => {
          const isFlipped = r === 1 && i === 0 && ao > 0.5;
          const col = scored ? (r === 1 && i === 0 ? COSMOS.amber : COSMOS.emerald) : COSMOS.dim;
          nodes.push(
            glassCell(cxs[i], y, 310, 104, isFlipped ? COSMOS.cyan : col, {
              fill: scored ? '#0d2624' : '#0c0f1c',
              dash: scored ? undefined : [8, 6],
              glow: scored ? 8 : 0,
              opacity: a,
            }),
            txt(scored ? 'SCORE' : 'IGNORE (−100)', cxs[i], y, 26, col, 'mono').opacity(a),
          );
        });
      });

      const msgCol = ao > 0.5 ? COSMOS.emerald : COSMOS.cyan;
      const msg =
        ao > 0.5
          ? 'Messages + assistant_only_loss=True  ·  Template marks generation spans'
          : 'Inspect a collated row to verify which labels survived after batching';
      nodes.push(
        glassCell(0, 338, 1620, 102, msgCol, { fill: '#101829', glow: 8, opacity: a }),
        txt(msg, 0, 338, 29, msgCol, 'mono').opacity(a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('same-id', () => s.play(highlightDup.to(1, { duration: 0.45 })));
  c.after('keep-stop', () => s.play(resolvedStop.to(1, { duration: 0.45 })));
  c.onBeat(2, () => s.play(formatView.to(1, { duration: 0.45 })));
  c.on('check-format', () =>
    s.play(assistantOnly.to(1, { duration: remainDuration(c, 'check-format', 0.5) })),
  );
}
