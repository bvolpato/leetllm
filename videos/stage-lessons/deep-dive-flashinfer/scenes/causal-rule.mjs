// Scene 06: Place the query in its history: bottom-right alignment formula K - Q + i, wrong masks, transfer K=7 Q=3.
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  remainAfter,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function causalRule(s, c) {
  const phase = s.value(0);
  const formulaReady = s.value(0);
  const activeRow = s.value(0); // 0..3
  const maskMode = s.value(0); // 0=bottom-right, 1=top-left bug, 2=unmasked bug, 3=restored
  const transferMode = s.value(0); // 0=R2(K=9,Q=4), 1=transfer(K=7,Q=3)
  const transferAns = s.value(0); // strictly withheld until causal-transfer-answer!

  const bgAura = aura(260, 30, 620, '#5ce1e61e', '#ffd16618');

  const title = heroTitle(['Place the Query', 'in Its History'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.r2,
    eyebrow: 'BOTTOM-RIGHT CAUSAL MASK',
  });

  const formula = glowTex('j \\le (K - Q) + i', {
    x: -515,
    y: -155,
    size: 46,
    color: COSMOS.gold,
    glow: 7,
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const fReady = formulaReady.value;
    const row = Math.round(activeRow.value);
    const mm = Math.round(maskMode.value);
    const tr = transferMode.value > 0.5;
    const ta = transferAns.value > 0.5;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const K = tr ? 7 : 9;
    const Q = tr ? 3 : 4;
    const selRow = tr ? 1 : row;
    const startPos = K - Q; // 5 for R2, 4 for transfer
    const correctStop = startPos + selRow;

    const nodes = [];

    // Left column: algebraic parameters + current mode readout
    const paramLines = tr
      ? [
          `K = ${K} cached keys`,
          `Q = ${Q} new queries`,
          `K - Q = ${startPos} (first new token)`,
          `local row i = ${selRow}`,
        ]
      : [
          `K = ${K} cached keys`,
          `Q = ${Q} new queries`,
          `K - Q = ${startPos} (first new token)`,
          `local row i = ${selRow}`,
        ];

    paramLines.forEach((lineStr, idx) => {
      nodes.push(
        txt(
          lineStr,
          -855,
          -62 + idx * 52,
          28,
          idx === 3 ? COSMOS.gold : COSMOS.ink,
          'mono',
          'left',
        ),
      );
    });

    // Verdict / status box on bottom-left (withholding transfer answer until causal-transfer-answer!)
    let vCol = ROLE.good;
    let vTitle = 'BOTTOM-RIGHT ALIGNED';
    let vSub = `Row ${selRow} sees ${correctStop + 1} keys (k0..k${correctStop})`;

    if (tr && !ta) {
      vCol = COSMOS.gold;
      vTitle = 'PREDICT ROW 1 STOP';
      vSub = `Start = 7 - 3 = 4: where does row 1 stop?`;
    } else if (tr && ta) {
      vCol = ROLE.good;
      vTitle = 'STOPS AT KEY 5';
      vSub = 'Row 1 -> 4 + 1 = 5 (6 keys: k0..k5)';
    } else if (mm === 1) {
      vCol = ROLE.bad;
      vTitle = 'TOP-LEFT BUG';
      vSub = 'q0 sees only k0 (loses 5 legal keys!)';
    } else if (mm === 2) {
      vCol = ROLE.bad;
      vTitle = 'UNMASKED BUG';
      vSub = 'q0 reads k6, k7, k8 (3 future keys!)';
    } else if (fReady < 0.5) {
      vCol = COSMOS.cyan;
      vTitle = 'RULE DERIVATION';
      vSub = 'Allow every key j <= (K - Q) + i';
    }

    nodes.push(
      glassCell(-515, 255, 675, 132, vCol, { fill: '#0e182c', glow: 9 }),
      txt(vTitle, -515, 226, 28, vCol, 'mono').glow(5, vCol),
      txt(vSub, -515, 278, 26, COSMOS.ink, 'sans'),
    );

    // Right side: Q x K causal attention mask matrix
    const matLeft = -45;
    const cellStep = K === 9 ? 96 : 118;
    const cellW = K === 9 ? 82 : 102;
    const matTop = -156;
    const rowStep = 100;

    nodes.push(
      txt(
        tr ? `TRANSFER MASK (${Q} × ${K})` : `R2 ATTENTION MASK (${Q} × ${K})`,
        matLeft + (K - 1) * cellStep * 0.5,
        -288,
        28,
        tr ? COSMOS.gold : ROLE.r2,
        'mono',
      ),
    );

    for (let j = 0; j < K; j++) {
      nodes.push(txt(`k${j}`, matLeft + j * cellStep, -234, 26, COSMOS.muted, 'mono'));
    }

    for (let i = 0; i < Q; i++) {
      const cy = matTop + i * rowStep;
      const isRowSel = i === selRow;
      nodes.push(txt(`q${i}`, matLeft - 76, cy, 28, isRowSel ? COSMOS.gold : COSMOS.muted, 'mono'));
      for (let j = 0; j < K; j++) {
        const cx = matLeft + j * cellStep;
        let allowed = j <= startPos + i;
        if (!tr && mm === 1) allowed = j <= i;
        if (!tr && mm === 2) allowed = true;

        // Withhold row 1 cells in transfer mode before answer!
        const concealCell = tr && !ta && i === 1 && j >= startPos;
        const isErrorCell =
          !tr && ((mm === 1 && i === 0 && j >= 1 && j <= 5) || (mm === 2 && i === 0 && j >= 6));

        let stroke = allowed ? ROLE.good : COSMOS.dim;
        let fill = allowed ? '#102b28' : '#0b101d';
        let label = allowed ? '1' : '·';

        if (concealCell) {
          stroke = COSMOS.gold;
          fill = '#251e10';
          label = '?';
        } else if (isErrorCell) {
          stroke = ROLE.bad;
          fill = '#33101d';
          label = mm === 1 ? '×' : '!';
        } else if (isRowSel && allowed) {
          stroke = COSMOS.gold;
          fill = '#252110';
        }

        nodes.push(
          glassCell(cx, cy, cellW, 78, stroke, {
            fill,
            glow: isRowSel && (allowed || concealCell) ? 8 * pulse : isErrorCell ? 9 : 0,
            opacity: isRowSel || isErrorCell ? 0.98 : 0.62,
          }),
          txt(
            label,
            cx,
            cy,
            30,
            isErrorCell
              ? ROLE.bad
              : concealCell || (isRowSel && allowed)
                ? COSMOS.gold
                : allowed
                  ? ROLE.good
                  : COSMOS.dim,
            'mono',
          ),
        );
      }
    }

    // Bottom caption under matrix
    nodes.push(
      txt(
        tr
          ? 'Logical boundary comes from query position, independent of page IDs'
          : 'Paged-prefill handles mixed Q lengths; batch-decode assumes Q = 1',
        365,
        365,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, formula, live);
  runPhase(s, c, phase, 14);

  c.on('fi-causal-rule-0', () =>
    s.play(formulaReady.to(0.6, { duration: remainDuration(c, 'fi-causal-rule-0', 0.4) })),
  );
  c.after('fi-causal-rule-0-result', () =>
    s.play(formulaReady.to(1, { duration: remainAfter(c, 'fi-causal-rule-0-result', 0.35) })),
  );
  c.on('fi-causal-rule-1', () =>
    s.play(activeRow.to(0, { duration: remainDuration(c, 'fi-causal-rule-1', 0.3) })),
  );
  c.on('rule-seven', () =>
    s.play(activeRow.to(1, { duration: remainDuration(c, 'rule-seven', 0.3) })),
  );
  c.on('rule-eight', () =>
    s.play(activeRow.to(2, { duration: remainDuration(c, 'rule-eight', 0.3) })),
  );
  c.on('rule-nine', () =>
    s.play(activeRow.to(3, { duration: remainDuration(c, 'rule-nine', 0.3) })),
  );
  c.after('fi-causal-rule-1-result', () =>
    s.play(activeRow.to(3, { duration: remainAfter(c, 'fi-causal-rule-1-result', 0.25) })),
  );
  c.on('rule-top', () => {
    s.play(activeRow.to(0, { duration: remainDuration(c, 'rule-top', 0.25) }));
    s.play(maskMode.to(1, { duration: remainDuration(c, 'rule-top', 0.35) }));
  });
  c.on('rule-open', () =>
    s.play(maskMode.to(2, { duration: remainDuration(c, 'rule-open', 0.35) })),
  );
  c.on('rule-restore', () =>
    s.play(maskMode.to(3, { duration: remainDuration(c, 'rule-restore', 0.35) })),
  );
  c.on('fi-causal-rule-2', () =>
    s.play(formulaReady.to(1, { duration: remainDuration(c, 'fi-causal-rule-2', 0.3) })),
  );
  c.on('causal-transfer', () => {
    s.play(transferMode.to(1, { duration: remainDuration(c, 'causal-transfer', 0.45) }));
  });
  c.after('causal-transfer-answer', () =>
    s.play(transferAns.to(1, { duration: remainAfter(c, 'causal-transfer-answer', 0.4) })),
  );
}
