// Scene 02: Which incident belongs in validation?: Clean broken rows, group T102 turns together, document holdout.
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function rowGroupSplit(s, c) {
  const phase = s.value(0);
  const dropBroken = s.value(0);
  const splitMode = s.value(0);
  const grouped = s.value(0);
  const docLeak = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa22', '#5ce1e614');
  const title = heroTitle(['Clean Rows &', 'Grouped Splits'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'DATA HYGIENE · ZERO LEAKAGE',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const drop = dropBroken.value;
    const sm = splitMode.value;
    const grp = grouped.value;
    const dl = docLeak.value;
    const pulse = 0.75 + 0.25 * Math.sin(p * 3.2);

    const nodes = [];

    // Phase 1 (Beat 0): Filtering raw rows before tokenization
    if (sm < 0.5) {
      const a = 1 - sm * 2;
      const cols = [-680, -250, 220, 640];
      ['INCIDENT ID', 'REQUEST', 'APPROVED ANSWER', 'PIPELINE STATUS'].forEach((h, i) => {
        nodes.push(txt(h, cols[i], -190, 26, COSMOS.muted, 'mono').opacity(a));
      });
      const rows = [
        { id: 'T102', req: '18-day key', ans: 'Open a rotation ticket', keep: true },
        { id: 'B550', req: 'Expired key', ans: '(empty answer)', keep: false },
        { id: '(missing ID)', req: 'Role change', ans: 'Escalate to security', keep: false },
      ];
      rows.forEach((r, i) => {
        const y = -70 + i * 165;
        const shiftX = r.keep ? 0 : drop * 110;
        const rowCol = r.keep ? COSMOS.emerald : drop > 0.2 ? COSMOS.rose : COSMOS.blue;
        const rowAlpha = r.keep ? a : a * (1 - 0.32 * drop);
        nodes.push(
          glassCell(shiftX, y, 1620, 114, rowCol, {
            fill: r.keep ? '#0d2324' : '#191220',
            dash: !r.keep && drop > 0.2 ? [10, 6] : undefined,
            glow: r.keep ? 8 * pulse : 4,
            opacity: rowAlpha,
          }),
          txt(r.id, cols[0] + shiftX, y, 32, r.keep ? COSMOS.cyan : rowCol, 'mono').opacity(
            rowAlpha,
          ),
          txt(r.req, cols[1] + shiftX, y, 30, COSMOS.ink, 'sans').opacity(rowAlpha),
          txt(r.ans, cols[2] + shiftX, y, 30, r.keep ? COSMOS.ink : COSMOS.rose, 'sans').opacity(
            rowAlpha,
          ),
          txt(
            drop > 0.2 ? (r.keep ? 'KEEP' : 'SET ASIDE') : 'INSPECT',
            cols[3] + shiftX,
            y,
            28,
            drop > 0.2 ? (r.keep ? COSMOS.emerald : COSMOS.rose) : COSMOS.muted,
            'mono',
          ).opacity(rowAlpha),
        );
      });
      nodes.push(
        txt(
          'Filter incomplete completions and missing group keys before tokenizing',
          0,
          390,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );
    }

    // Phase 2 & 3 (Beats 1 & 2): Grouped Train/Validation partition + Document-level link
    if (sm >= 0.5) {
      const a = Math.min(1, (sm - 0.5) * 2);
      const trainX = -435;
      const valX = 435;
      const wallX = 0;

      nodes.push(
        txt('TRAINING POOL', trainX, -210, 32, COSMOS.blue, 'mono').glow(6, COSMOS.blue).opacity(a),
        txt('VALIDATION POOL', valX, -210, 32, COSMOS.cyan, 'mono').glow(6, COSMOS.cyan).opacity(a),
        line([wallX, -230], [wallX, 240], { stroke: COSMOS.gold, width: 3, dash: [10, 8] })
          .glow(6, COSMOS.gold)
          .opacity(a),
      );

      // T102 Turn 1 stays in Training
      nodes.push(
        glassCell(trainX, -95, 700, 102, COSMOS.blue, { fill: '#101d35', glow: 8, opacity: a }),
        txt('T102 · Turn 1   (key age?)', trainX, -95, 32, COSMOS.ink, 'mono').opacity(a),
      );

      // T102 Turn 2 glides from Validation across the wall into Training!
      const t2x = valX + (trainX - valX) * grp;
      const t2Col = grp > 0.8 ? COSMOS.blue : COSMOS.amber;
      nodes.push(
        glassCell(t2x, 45, 700, 102, t2Col, { fill: '#101d35', glow: 9, opacity: a }),
        txt('T102 · Turn 2   (who approves?)', t2x, 45, 32, COSMOS.ink, 'mono').opacity(a),
      );

      // P771 in Training, R550 held out in Validation
      nodes.push(
        glassCell(trainX, 185, 700, 96, COSMOS.blue, { fill: '#101a2f', glow: 6, opacity: a }),
        txt('P771 · Policy rotation case', trainX, 185, 30, COSMOS.muted, 'mono').opacity(a),
        glassCell(valX, 185, 700, 96, COSMOS.cyan, { fill: '#0e2230', glow: 8, opacity: a }),
        txt('R550 · Held-out incident', valX, 185, 30, COSMOS.cyan, 'mono').opacity(a),
      );

      if (dl > 0.05) {
        // Shared policy document arc connecting top edges of P771 (train) and R550 (val)
        nodes.push(
          glowingArc([trainX + 180, 134], [valX - 180, 134], -44, {
            color: COSMOS.rose,
            width: 4.2,
            opacity: dl * a,
          }),
          glowDot(0, 112, { radius: 8, color: COSMOS.rose, opacity: dl * a }),
          glassCell(0, 325, 1480, 92, COSMOS.rose, {
            fill: '#1e1120',
            glow: 9,
            opacity: dl * a,
          }),
          txt(
            'SHARED POLICY DOCUMENT → Group by document · Chronological cutoff · Final test vault',
            0,
            325,
            27,
            COSMOS.rose,
            'mono',
          ).opacity(dl * a),
        );
      } else {
        const badgeCol = grp > 0.8 ? COSMOS.emerald : COSMOS.gold;
        const badgeMsg =
          grp > 0.8
            ? 'Incident overlap: Train ∩ Val = ∅   (T102 turns stay together)'
            : 'Same incident T102 across splits leaks phrasing and context';
        nodes.push(
          glassCell(0, 325, 1320, 88, badgeCol, { fill: '#0f182a', glow: 8, opacity: a }),
          txt(badgeMsg, 0, 325, 29, badgeCol, 'mono').opacity(a),
        );
      }
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('row-group-split-b1', () => s.play(dropBroken.to(1, { duration: 0.65 })));
  c.onBeat(1, () => s.play(splitMode.to(1, { duration: 0.45 })));
  c.on('row-group-split-b2', () => s.play(grouped.to(1, { duration: 0.85 })));
  c.on('row-group-split-b3', () =>
    s.play(docLeak.to(1, { duration: remainDuration(c, 'row-group-split-b3', 0.6) })),
  );
}
