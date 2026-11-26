// Scene 23: From a packed row to a held-out reply: Finale packed-join repair (1.461 -> 0.768) + 22-day serving probe.
import {
  COSMOS,
  REPAIR_BAD,
  REPAIR_GOOD,
  arrow,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function freshBoundaryRepair(s, c) {
  const phase = s.value(0);
  const showJoin = s.value(0);
  const repaired = s.value(0);
  const showTerms = s.value(0);
  const showMeans = s.value(0);

  const probeMode = s.value(0);
  const showTicket = s.value(0);
  const showPermission = s.value(0);
  const showStop = s.value(0);
  const gradeAccess = s.value(0);
  const gradeVerdict = s.value(0);

  const bgAura = aura(0, 30, 640, '#6ee7b71c', '#ff6b8b16');
  const title = heroTitle(['Packed Join Repair', '& Held-Out Probe'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.emerald,
    eyebrow: 'FINALE · END-TO-END SFT AUDIT',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sj = showJoin.value;
    const rep = repaired.value > 0.5;
    const st = showTerms.value > 0.5;
    const sm = showMeans.value > 0.5;

    const pm = probeMode.value;
    const tkt = showTicket.value > 0.5;
    const perm = showPermission.value > 0.5;
    const stp = showStop.value > 0.5;
    const acc = gradeAccess.value > 0.5;
    const verd = gradeVerdict.value > 0.5;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [];

    if (pm < 0.5) {
      // Part 1 (Beats 0-2): Packed join repair (19-day key + stray USER from next incident)
      const a = 1 - pm * 2;
      const row = rep ? REPAIR_GOOD : REPAIR_BAD;
      const slots = [
        { pos: '0–3', name: '19-day req', index: 3 },
        ...row.tokens.slice(4).map((name, i) => ({ pos: String(i + 4), name, index: i + 4 })),
      ];
      const slotX = (i) => -680 + i * 272;
      const wallX = (slotX(4) + slotX(5)) * 0.5;
      const topY = -140;
      const botY = 125;

      nodes.push(
        txt('INCIDENT A · 19-DAY KEY', slotX(2), -242, 26, COSMOS.blue, 'mono').opacity(a),
        txt('INCIDENT B', slotX(5), -242, 26, COSMOS.amber, 'mono').opacity(a),
        line([wallX, -248], [wallX, 178], { stroke: COSMOS.gold, width: 4.5, dash: [10, 6] })
          .glow(10, COSMOS.gold)
          .opacity(a),
        txt(`ACTIVE TARGETS = ${row.count}`, 820, 224, 28, COSMOS.cyan, 'mono', 'right').opacity(a),
        txt('LOSS LABELS', -820, 224, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      );

      slots.forEach(({ pos, name, index }, i) => {
        const x = slotX(i);
        const active = row.active[index];
        const isStray = i === 5 && active;
        const isRepairedEnd = i === 4 && active;

        nodes.push(
          tokenPill(name, x, topY, {
            w: 232,
            h: 82,
            color: i === 5 ? COSMOS.amber : COSMOS.blue,
            glow: 6,
            size: 28,
            index: pos,
            indexOffsetY: -72,
            opacity: a,
          }),
          tokenPill(active ? name : i === 0 ? '4 × −100' : '−100', x, botY, {
            w: 232,
            h: 84,
            color: isStray ? COSMOS.rose : active ? COSMOS.emerald : COSMOS.dim,
            fill: isStray ? '#26101b' : active ? '#0c2624' : '#0b0e19',
            textColor: isStray ? COSMOS.rose : active ? COSMOS.emerald : COSMOS.dim,
            dash: active ? undefined : [7, 5],
            glow: active ? 10 * pulse : 0,
            size: 28,
            opacity: (active ? 1 : 0.62) * a,
          }),
        );

        if (active && i > 0) {
          const arrowCol = isStray ? COSMOS.rose : isRepairedEnd ? COSMOS.emerald : COSMOS.gold;
          nodes.push(
            arrow([slotX(i - 1), topY + 46], [x, botY - 48], {
              stroke: arrowCol,
              width: 5,
              tip: 14,
            })
              .glow(10, arrowCol)
              .opacity(Math.max(0.4, sj) * a),
          );
        }
      });

      // Bottom comparison / prompt bar (strict withholding before repair-join & repair-mean!)
      if (st) {
        const badP = REPAIR_BAD.probabilities.map((v) => v.toFixed(2)).join(' × ');
        const goodP = REPAIR_GOOD.probabilities.map((v) => v.toFixed(2)).join(' × ');
        nodes.push(
          glassCell(-425, 342, 790, 128, COSMOS.rose, { fill: '#21101b', glow: 8, opacity: a }),
          txt('BEFORE · STRAY USER (p = 0.10)', -425, 306, 26, COSMOS.rose, 'mono').opacity(a),
          txt(
            `−ln(${badP}) ÷ 3${sm ? ` ≈ ${REPAIR_BAD.mean.toFixed(3)}` : ''}`,
            -425,
            362,
            30,
            COSMOS.ink,
            'mono',
          ).opacity(a),

          glassCell(425, 342, 790, 128, COSMOS.emerald, {
            fill: '#0c2624',
            glow: 11 * pulse,
            opacity: a,
          }),
          txt('AFTER · REAL END (p = 0.80)', 425, 306, 26, COSMOS.emerald, 'mono').opacity(a),
          txt(
            `−ln(${goodP}) ÷ 3${sm ? ` ≈ ${REPAIR_GOOD.mean.toFixed(3)}` : ''}`,
            425,
            362,
            30,
            COSMOS.emerald,
            'mono',
          )
            .glow(6, COSMOS.emerald)
            .opacity(a),
        );
      } else {
        const footCol = rep ? COSMOS.emerald : COSMOS.gold;
        const footMsg = rep
          ? 'Repaired: restore END (ticket → END) · Mask USER to −100 (still 3 targets!)'
          : '3 active targets reported, but follow the arrows: which two labels must change?';
        nodes.push(
          glassCell(0, 348, 1660, 102, footCol, { fill: '#101829', glow: 9, opacity: a }),
          txt(footMsg, 0, 348, 29, footCol, 'mono').opacity(a),
        );
      }
    } else {
      // Part 2 (Beats 3-4): Held-out 22-day service key probe & 3-check grading rubric
      const a = Math.min(1, (pm - 0.5) * 2);

      nodes.push(
        txt(
          'HELD-OUT REQUEST (NO REFERENCE ANSWER)',
          -845,
          -242,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(a),
        glassCell(0, -162, 1690, 96, COSMOS.cyan, { fill: '#0e1e30', glow: 8, opacity: a }),
        txt(
          '“My service key is 22 days old. Can I still use it?”',
          0,
          -162,
          38,
          COSMOS.ink,
          'serif',
        ).opacity(a),

        txt('RELOADED MODEL REPLY', -845, -62, 26, COSMOS.blue, 'mono', 'left').opacity(a),
      );

      // Generated reply stream (left) + grading checks (right, strictly revealed AFTER Beat 3!)
      if (tkt) {
        nodes.push(
          glassCell(-395, 24, 900, 88, verd ? COSMOS.emerald : COSMOS.blue, {
            fill: verd ? '#0c2624' : '#101a30',
            glow: 7,
            opacity: a,
          }),
          txt('“Open a rotation ticket.”', -810, 24, 34, COSMOS.ink, 'serif', 'left').opacity(a),
        );
      }
      if (perm) {
        nodes.push(
          glassCell(-395, 134, 900, 88, acc ? COSMOS.rose : COSMOS.blue, {
            fill: acc ? '#26101b' : '#101a30',
            glow: acc ? 11 * pulse : 7,
            opacity: a,
          }),
          txt(
            '“You can keep using the key.”',
            -810,
            134,
            34,
            acc ? COSMOS.rose : COSMOS.ink,
            'serif',
            'left',
          ).opacity(a),
        );
      }
      if (stp) {
        nodes.push(
          glassCell(-715, 238, 260, 74, verd ? COSMOS.emerald : COSMOS.gold, {
            fill: '#101a30',
            glow: 7,
            opacity: a,
          }),
          txt('<|eot|> END', -715, 238, 28, verd ? COSMOS.emerald : COSMOS.gold, 'mono').opacity(a),
        );
      }

      // Right-hand 3 policy checks (strictly hidden during Beat 3 prediction!)
      if (acc) {
        nodes.push(
          glassCell(475, 134, 720, 88, COSMOS.rose, { fill: '#26101b', glow: 10, opacity: a }),
          txt('FAIL · GRANTS ACCESS (Security only!)', 475, 134, 28, COSMOS.rose, 'mono').opacity(
            a,
          ),
        );
      }
      if (verd) {
        nodes.push(
          glassCell(475, 24, 720, 88, COSMOS.emerald, { fill: '#0c2624', glow: 8, opacity: a }),
          txt('PASS · REQUIRED ACTION (ticket)', 475, 24, 28, COSMOS.emerald, 'mono').opacity(a),

          glassCell(475, 238, 720, 74, COSMOS.emerald, { fill: '#0c2624', glow: 8, opacity: a }),
          txt('PASS · CLEAN TURN ENDING', 475, 238, 28, COSMOS.emerald, 'mono').opacity(a),
        );
      }

      // Bottom verdict / question bar
      const footCol = verd ? COSMOS.rose : COSMOS.gold;
      const footMsg = verd
        ? 'POLICY FAILURE  ·  Apply all 3 checks to exported generations  ·  Next: Mixed Precision'
        : stp
          ? 'The assistant answered and stopped: would you pass this reply?'
          : 'Streaming free generation from the reloaded export…';
      nodes.push(
        glassCell(0, 368, 1690, 96, footCol, {
          fill: verd ? '#24101b' : '#101829',
          glow: 10,
          opacity: a,
        }),
        txt(footMsg, 0, 368, 28, footCol, 'mono').opacity(a),
        glowDot(-815, 368, { radius: 7, color: footCol, opacity: a }),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('inspect-join', () => s.play(showJoin.to(1, { duration: 0.4 })));
  c.after('repair-join', () => s.play(repaired.to(1, { duration: 0.35 })));
  c.on('compare-terms', () => s.play(showTerms.to(1, { duration: 0.4 })));
  c.after('repair-mean', () => s.play(showMeans.to(1, { duration: 0.35 })));

  c.on('held-out-probe', () => s.play(probeMode.to(1, { duration: 0.45 })));
  c.on('sample-ticket', () => s.play(showTicket.to(1, { duration: 0.3 })));
  c.on('sample-permission', () => s.play(showPermission.to(1, { duration: 0.3 })));
  c.on('sample-stop', () => s.play(showStop.to(1, { duration: 0.3 })));
  c.after('grade-access', () => s.play(gradeAccess.to(1, { duration: 0.3 })));
  c.after('grade-reply-result', () =>
    s.play(gradeVerdict.to(1, { duration: remainDuration(c, 'grade-reply-result', 0.4) })),
  );
}
