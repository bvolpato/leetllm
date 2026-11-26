// Scene 22: close: Untied output-table trap (ID 5 emits ·soft!) -> animated row swap restores ·falls at ID 1!
import {
  CLOSE_FIXED,
  CLOSE_HIDDEN,
  CLOSE_OTHER_MAX,
  CLOSE_OUTPUT,
  CLOSE_PARTIAL,
  CLOSE_SLOTS,
  COSMOS,
  IDS_B,
  ROLE,
  aura,
  bindCueBeat,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function close(s, c) {
  const showOutput = s.value(0);
  const showScores = s.value(0);
  const showLimit = s.value(0);
  const showPredict = s.value(0);
  const revealWrong = s.value(0); // strictly withheld until AFTER `printed`!
  const swapProgress = s.value(0); // 0 -> 1 swaps weight rows 1 and 5 along smooth opposing arcs!
  const revealFixed = s.value(0); // strictly withheld until AFTER `restored`!

  const bgAura = aura(0, 10, 760, '#18365e28', '#3e1a4a1a');
  const title = heroTitle(['What will the', 'model write?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.merge,
  });

  const leftX = -380;
  const rightX = 380;
  const weightY = -70;
  const idY = 125;
  const pieceY = 240;

  const w1 = CLOSE_OUTPUT[CLOSE_SLOTS[0]]; // row 1 originally for ·soft -> score 0.2
  const w5 = CLOSE_OUTPUT[CLOSE_SLOTS[1]]; // row 5 originally for ·falls -> score 0.7
  const s1 = CLOSE_PARTIAL.scores[CLOSE_SLOTS[0]]; // 0.2
  const s5 = CLOSE_PARTIAL.scores[CLOSE_SLOTS[1]]; // 0.7

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const out = showOutput.value;
    const sc = showScores.value;
    const lim = showLimit.value;
    const pr = showPredict.value;
    const wr = revealWrong.value;
    const sw = swapProgress.value;
    const fx = revealFixed.value;
    const nodes = [];

    // Top-right hidden vector & other-rows ceiling
    if (out > 0.05) {
      nodes.push(
        txt(`h = [${CLOSE_HIDDEN.join(', ')}]`, 855, -410, 34, ROLE.piece, 'mono', 'right').opacity(
          out * alpha,
        ),
      );
    }
    if (lim > 0.05) {
      nodes.push(
        txt(
          `Best of other 6 rows: ${CLOSE_OTHER_MAX.toFixed(1)}`,
          855,
          -348,
          28,
          COSMOS.muted,
          'mono',
          'right',
        ).opacity(lim * alpha),
      );
    }

    // Quiet input-alignment header before output weights appear (fills upper stage cleanly!)
    if (out < 0.05) {
      nodes.push(
        txt(
          'INPUT TABLE W_E ALIGNED TO REPLACEMENT IDs',
          0,
          -145,
          28,
          ROLE.piece,
          'mono',
          'center',
        ).opacity(alpha),
        glowingTrail(
          [
            [leftX, -95],
            [rightX, -95],
          ],
          { color: '#2b3c68', width: 2.5, glow: 5, core: false, opacity: 0.7 * alpha },
        ),
        txt('ID 1 reads ·falls vector', leftX, -45, 28, ROLE.ok, 'mono', 'center').opacity(alpha),
        txt('ID 5 reads ·soft vector', rightX, -45, 28, ROLE.ok, 'mono', 'center').opacity(alpha),
      );
    }

    // Status line above output weight rows (stable label, no brief intermediate flash!)
    if (out > 0.05) {
      const statusText =
        sw > 0.5 ? 'OUTPUT WEIGHTS ALIGNED TO IDs' : 'UNTIED OUTPUT WEIGHTS (TRAINING ORDER)';
      const statusCol = sw > 0.5 ? ROLE.ok : ROLE.merge;
      nodes.push(
        txt(statusText, 0, -225, 28, statusCol, 'mono', 'center')
          .glow(6, statusCol)
          .opacity(out * alpha),
      );

      // Smooth opposing vertical-offset arc positions for the two output weight rows
      const arcLift = Math.sin(sw * Math.PI) * 95;
      const posA = [leftX + (rightX - leftX) * sw, weightY - arcLift]; // starts left (0.2), moves right
      const posB = [rightX + (leftX - rightX) * sw, weightY + arcLift]; // starts right (0.7), moves left

      const rowALabel = `[${w1.map((v) => v.toFixed(1)).join(', ')}]`;
      const rowBLabel = `[${w5.map((v) => v.toFixed(1)).join(', ')}]`;

      nodes.push(
        tokenPill(rowALabel, posA[0], posA[1], {
          w: 360,
          h: 76,
          color: ROLE.piece,
          size: 32,
          opacity: out * alpha,
        }),
        tokenPill(rowBLabel, posB[0], posB[1], {
          w: 360,
          h: 76,
          color: ROLE.merge,
          size: 32,
          glow: 12,
          opacity: out * alpha,
        }),
      );

      if (sc > 0.05) {
        nodes.push(
          txt(
            `score ${s1.toFixed(1)}`,
            posA[0],
            posA[1] + 64,
            30,
            ROLE.piece,
            'mono',
            'center',
          ).opacity(sc * out * alpha),
          txt(`score ${s5.toFixed(1)}`, posB[0], posB[1] + 64, 32, ROLE.merge, 'mono', 'center')
            .glow(8, ROLE.merge)
            .opacity(sc * out * alpha),
        );
      }
    }

    // Fixed Replacement Dictionary slots below: ID 1 -> ·falls (left) and ID 5 -> ·soft (right)
    const leftWin = fx > 0.5;
    const rightWin = wr > 0.5 && sw < 0.1;
    const slotInfo = [
      { id: IDS_B['·falls'], piece: '·falls', x: leftX, win: leftWin, winCol: ROLE.ok },
      { id: IDS_B['·soft'], piece: '·soft', x: rightX, win: rightWin, winCol: ROLE.warn },
    ];

    slotInfo.forEach((slot) => {
      const col = slot.win ? slot.winCol : ROLE.token;
      nodes.push(
        txt(`ID ${slot.id}`, slot.x, idY, 44, col, 'mono', 'center')
          .glow(slot.win ? 10 : 0, col)
          .opacity(alpha),
        glowingTrail(
          [
            [slot.x, idY + 34],
            [slot.x, pieceY - 46],
          ],
          { color: col, width: slot.win ? 5 : 2.5, glow: slot.win ? 12 : 4, opacity: alpha },
        ),
        tokenPill(slot.piece, slot.x, pieceY, {
          w: 250,
          h: 80,
          color: col,
          size: 40,
          glow: slot.win ? 14 : 6,
          strokeWidth: slot.win ? 4 : 2.6,
          opacity: alpha,
        }),
      );
      if (slot.win) {
        nodes.push(
          glowDot(slot.x, pieceY - 46, { radius: 8, color: col, glow: 14, opacity: alpha }),
        );
      }
    });

    // Bottom prediction prompt / verdict (strictly withheld!)
    if (pr > 0.05 && wr < 0.2) {
      nodes.push(
        txt(
          'Greedy decoding picks max score: which piece prints?',
          0,
          385,
          36,
          ROLE.merge,
          'serif',
          'center',
        )
          .glow(8, ROLE.merge)
          .opacity(pr * (1 - wr * 5) * alpha),
      );
    }
    if (wr > 0.5 && sw < 0.1) {
      nodes.push(
        txt(
          `Emits "${CLOSE_PARTIAL.piece}" (wrong!)  ·  Row 5 still won at 0.7`,
          0,
          385,
          34,
          ROLE.warn,
          'mono',
          'center',
        )
          .glow(8, ROLE.warn)
          .opacity(wr * alpha),
      );
    }
    if (fx > 0.5) {
      nodes.push(
        txt(
          `Restored! Row 1 wins at 0.7 → emits "${CLOSE_FIXED.piece}". Pin both tables + tokenizer.`,
          0,
          385,
          30,
          ROLE.ok,
          'mono',
          'center',
        )
          .glow(8, ROLE.ok)
          .opacity(fx * alpha),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'output', (d) => s.play(showOutput.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'dot', (d) => s.play(showScores.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'other-rows', (d) => s.play(showLimit.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'predict', (d) => s.play(showPredict.to(1, { duration: d })), { dur: 0.4 });
  // Strictly withhold emitted piece until AFTER `printed`!
  playCue(s, c, 'printed', (d) => s.play(revealWrong.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'swap', (d) => s.play(swapProgress.to(1, { duration: d })), { dur: 1.1 });
  // Strictly withhold restored emitted piece until AFTER `restored`!
  playCue(s, c, 'restored', (d) => s.play(revealFixed.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  bindCueBeat(s, c, s.value(0), ['map', 'input', 'hidden']);
}
