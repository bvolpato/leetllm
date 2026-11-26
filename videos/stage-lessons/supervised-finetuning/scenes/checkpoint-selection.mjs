// Scene 21: Which checkpoint earns the next test?: Aligned 98% -> 100% format gate with dual prediction withholding.
import {
  COSMOS,
  SFT_CHECKPOINTS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  sftCheckpointGate,
  txt,
} from '../parts.mjs';

export default function checkpointSelection(s, c) {
  const phase = s.value(0);
  const showGate = s.value(0);
  const reveal98 = s.value(0);
  const strictFloor = s.value(0); // 0 => 0.98, 1 => 1.00
  const reveal100 = s.value(0);

  const bgAura = aura(0, 30, 620, '#ffd1661c', '#6ee7b716');
  const title = heroTitle(['Checkpoint', 'Selection Gate'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'FORMAT FLOOR → POLICY PASS → LOSS TIE-BREAK',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sg = showGate.value;
    const r98 = reveal98.value > 0.5;
    const st = strictFloor.value;
    const r100 = reveal100.value > 0.5;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const floor = st > 0.5 ? 1.0 : 0.98;
    const showWinner = st > 0.5 ? r100 : r98;
    const winner = sftCheckpointGate(SFT_CHECKPOINTS, floor);

    const fmtX0 = -430;
    const fmtW = 390;
    const mapFmt = (v) => fmtX0 + ((v - 0.95) / (1.01 - 0.95)) * fmtW;
    const gateX = mapFmt(floor);

    const polX0 = 90;
    const polW = 390;
    const mapPol = (v) => polX0 + ((v - 0.85) / (1.0 - 0.85)) * polW;

    const lossX = 720;

    const nodes = [
      // Active gate banner
      txt(
        `RULE: FORMAT PASS ≥ ${Math.round(floor * 100)}%   →   HIGHEST POLICY PASS   →   LOWEST VAL LOSS`,
        0,
        -238,
        27,
        COSMOS.gold,
        'mono',
      ).glow(5, COSMOS.gold),
      txt('CHECKPOINT', -745, -162, 26, COSMOS.muted, 'mono'),
      txt('FORMAT PASS', fmtX0 + fmtW * 0.5, -162, 26, COSMOS.gold, 'mono'),
      txt('POLICY PASS', polX0 + polW * 0.5, -162, 26, COSMOS.emerald, 'mono'),
      txt('VAL LOSS', lossX, -162, 26, COSMOS.cyan, 'mono'),
    ];

    // Rows for Step 200, 400, 600
    SFT_CHECKPOINTS.forEach((row, i) => {
      const y = -65 + i * 145;
      const eligible = row.format >= floor;
      const isWin = showWinner && winner && row.step === winner.step;
      const dimmed = showWinner && !eligible;
      const rowCol = isWin ? COSMOS.emerald : dimmed ? COSMOS.dim : COSMOS.blue;

      nodes.push(
        glassCell(0, y, 1680, 114, isWin ? COSMOS.emerald : '#29375a', {
          fill: isWin ? '#0c2624' : '#0f1628',
          glow: isWin ? 12 * pulse : 0,
          opacity: dimmed ? 0.48 : 0.96,
        }),
        txt(`Step ${row.step}`, -745, y, 34, isWin ? COSMOS.emerald : COSMOS.ink, 'mono').opacity(
          dimmed ? 0.55 : 1,
        ),
      );

      // Format bar (label cleanly to the left of the bar so movable gate line never touches it)
      const fw = Math.max(24, mapFmt(row.format) - fmtX0);
      const fCol = isWin ? COSMOS.emerald : dimmed ? COSMOS.rose : COSMOS.cyan;
      nodes.push(
        txt(`${Math.round(row.format * 100)}%`, fmtX0 - 24, y, 28, fCol, 'mono', 'right'),
        rect(fw, 44, { fill: '#12283d', stroke: fCol, width: 2.2, radius: 6 })
          .at(fmtX0 + fw * 0.5, y)
          .opacity(dimmed ? 0.45 : 0.94),
      );

      // Policy bar
      const pw = Math.max(24, mapPol(row.policy) - polX0);
      const pCol = isWin ? COSMOS.emerald : COSMOS.blue;
      nodes.push(
        rect(pw, 44, { fill: isWin ? '#103b36' : '#132444', stroke: pCol, width: 2.2, radius: 6 })
          .at(polX0 + pw * 0.5, y)
          .glow(isWin ? 9 * pulse : 0, COSMOS.emerald)
          .opacity(dimmed ? 0.42 : 0.94),
        txt(`${Math.round(row.policy * 100)}%`, polX0 + pw + 46, y, 28, pCol, 'mono'),
      );

      // Validation loss readout
      nodes.push(
        txt(
          row.loss.toFixed(2),
          lossX,
          y,
          34,
          row.step === 400 ? COSMOS.cyan : COSMOS.muted,
          'mono',
        ).opacity(dimmed ? 0.5 : 1),
      );
    });

    // Movable golden format gate laser line
    nodes.push(
      line([gateX, -135], [gateX, 295], { stroke: COSMOS.gold, width: 4.5, dash: [10, 6] })
        .glow(11 * pulse, COSMOS.gold)
        .opacity(Math.max(0.45, sg)),
      glowDot(gateX, -135, { radius: 7, color: COSMOS.gold }),
      txt(`${Math.round(floor * 100)}% gate`, gateX, 316, 26, COSMOS.gold, 'mono'),
    );

    // Bottom verdict bar (strictly withheld until selection-winner / selection-alternate!)
    let footCol = COSMOS.gold;
    let footMsg = 'All three pass ≥ 98% format: which checkpoint wins on policy pass rate?';
    if (st > 0.5 && !r100) {
      footCol = COSMOS.gold;
      footMsg = 'Format gate raised to 100% (measurements fixed): which checkpoint survives now?';
    } else if (showWinner && winner) {
      footCol = COSMOS.emerald;
      footMsg =
        st > 0.5
          ? `Only Step ${winner.step} qualifies (100% format) · Freeze choice, reload export, then run final test`
          : `Step ${winner.step} wins (98% format · 97% policy) · Step 400 had lower loss (1.77) but worse policy (91%)`;
    }

    nodes.push(
      glassCell(0, 392, 1660, 88, footCol, { fill: '#101829', glow: 8 }),
      txt(footMsg, 0, 392, 27, footCol, 'mono'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('selection-gate', () => s.play(showGate.to(1, { duration: 0.45 })));
  c.after('selection-winner', () => s.play(reveal98.to(1, { duration: 0.35 })));
  c.on('raise-floor', () => s.play(strictFloor.to(1, { duration: 0.6 })));
  c.after('selection-alternate', () =>
    s.play(reveal100.to(1, { duration: remainDuration(c, 'selection-alternate', 0.4) })),
  );
}
