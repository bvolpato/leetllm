// Scene 22: Can a wrong scan pass this check? Zero-sum Block A masks missing offset until play 3 changes from -6 to +1.
import {
  ARTICLE_INPUT,
  COSMOS,
  ZERO_FIRST_BLOCK,
  aura,
  exclusive,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  number,
  remainDuration,
  signed,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const showValues = s.value(0);
  const showFirstTrue = s.value(0);
  const editedPlay3 = s.value(0);
  const askBefore = s.value(0);
  const revealTwelve = s.value(0);
  const revealFail = s.value(0);
  const applyRepair = s.value(0);
  const revealFixedPass = s.value(0);

  const bgAura = aura(0, 15, 620, '#5ce1e620', '#ff6b8b16');

  const live = guardedDynamic(1, () => {
    const sv = showValues.value > 0.5;
    const fPass = showFirstTrue.value > 0.5;
    const chg = editedPlay3.value > 0.5;
    const ask = askBefore.value > 0.5;
    const tw = revealTwelve.value > 0.5;
    const fl = revealFail.value > 0.5;
    const rep = applyRepair.value > 0.5;
    const fxd = revealFixedPass.value > 0.5;

    const row = chg ? ARTICLE_INPUT : ZERO_FIRST_BLOCK;
    const expected = exclusive(row);
    const actual = rep ? expected : [...exclusive(row.slice(0, 4)), ...exclusive(row.slice(4))];
    const showRefBlockB = sv && (!chg || tw);
    const checked = chg ? (rep ? fxd : fl) : fPass;
    const matches = actual.every((v, i) => v === expected[i]);

    const colX = (i) => -445 + i * 172;
    const yPlay = -175;
    const yAct = -35;
    const yRef = 105;

    const nodes = [
      heroTitle(['Can a Wrong Scan', 'Pass This Check?'], {
        x: -855,
        y: -420,
        size: 52,
        lineHeight: 62,
        accent: checked ? (matches ? COSMOS.emerald : COSMOS.rose) : COSMOS.gold,
        eyebrow: chg
          ? rep
            ? 'BLOCK B OFFSET +7 APPLIED · RE-CHECK'
            : 'PLAY 3 EDITED: −6 → +1 · CHECK BLOCK B'
          : 'BLOCK A SUMS TO 0 · MISSING OFFSET HIDDEN',
      }),

      // Block A / Block B headers & divider
      txt('BLOCK A', (colX(0) + colX(3)) * 0.5, -264, 26, COSMOS.blue, 'mono'),
      txt('BLOCK B', (colX(4) + colX(7)) * 0.5, -264, 26, COSMOS.cyan, 'mono'),
      line([(colX(3) + colX(4)) * 0.5, -238], [(colX(3) + colX(4)) * 0.5, 165], {
        stroke: COSMOS.gold,
        width: 2.8,
        dash: [8, 6],
      }).opacity(0.8),

      txt('PLAY', -845, yPlay, 27, COSMOS.blue, 'mono', 'left'),
      txt(
        rep ? 'AFTER OFFSET' : 'LOCAL OUTPUT',
        -845,
        yAct,
        27,
        rep ? COSMOS.emerald : COSMOS.ink,
        'mono',
        'left',
      ),
      txt('REFERENCE', -845, yRef, 27, COSMOS.cyan, 'mono', 'left'),
    ];

    row.forEach((val, i) => {
      const cx = colX(i);
      const isEditCell = i === 3;
      const isBad = checked && !matches && i >= 4;
      const isAskPenalty = chg && !fl && i === 5;

      // Play row
      const pCol = isEditCell ? COSMOS.gold : COSMOS.blue;
      nodes.push(
        glassCell(cx, yPlay, 138, 80, pCol, {
          fill: isEditCell ? '#241c10' : '#101d38',
          glow: isEditCell ? 10 : 4,
        }),
        txt(signed(val), cx, yPlay, 36, pCol, 'mono'),
      );

      // Actual output row
      const aCol = isBad ? COSMOS.rose : rep && i >= 4 ? COSMOS.emerald : COSMOS.ink;
      nodes.push(
        glassCell(cx, yAct, 138, 80, sv ? aCol : COSMOS.dim, {
          fill: isBad ? '#28101c' : rep && i >= 4 ? '#0d2624' : '#11192d',
          glow: isBad || (rep && i >= 4) ? 9 : 3,
        }),
        txt(sv ? number(actual[i]) : '·', cx, yAct, 36, sv ? aCol : COSMOS.dim, 'mono'),
      );

      // Reference row (withhold Block B reference values during prediction!)
      const refVisible = sv && (i < 4 || showRefBlockB);
      const rCol = isBad ? COSMOS.rose : isAskPenalty ? COSMOS.gold : COSMOS.cyan;
      nodes.push(
        glassCell(cx, yRef, 138, 80, refVisible ? rCol : COSMOS.dim, {
          fill: isAskPenalty && !tw ? '#241c10' : '#0f1c30',
          glow: isAskPenalty ? 10 : 4,
        }),
        txt(
          refVisible ? number(expected[i]) : isAskPenalty ? '?' : '·',
          cx,
          yRef,
          36,
          refVisible ? rCol : isAskPenalty ? COSMOS.gold : COSMOS.dim,
          'mono',
        ),
      );
    });

    // Prediction prompt bar (between table and verdict)
    if (chg && !fl && ask) {
      nodes.push(
        glassCell(0, 232, 1380, 76, COSMOS.gold, { fill: '#1e1910', glow: 9 }),
        txt(
          `Reference score before −9:  ${tw ? '12  (local 5 is 7 pts low!)' : '?'}`,
          0,
          232,
          28,
          COSMOS.gold,
          'mono',
        ).glow(6, COSMOS.gold),
      );
    }

    // Whole-row comparison verdict panel (strictly withheld until pass/fail cues!)
    const vCol = checked ? (matches ? COSMOS.emerald : COSMOS.rose) : COSMOS.gold;
    const vLabel = checked ? (matches ? 'TRUE' : 'FALSE') : '?';
    nodes.push(
      glassCell(-190, 365, 920, 96, COSMOS.cyan, { fill: '#0f1c30', glow: 7 }),
      txt('actual == reference_scan(row)', -190, 365, 36, COSMOS.ink, 'mono'),

      glassCell(475, 365, 310, 96, vCol, {
        fill: checked ? (matches ? '#0d2624' : '#28101c') : '#241c10',
        glow: 12,
      }),
      txt(vLabel, 475, 365, 48, vCol, 'mono').glow(8, vCol),
    );

    return group(...nodes);
  });

  s.add(bgAura, live);

  c.on('test-compare', () => s.play(showValues.to(1, { duration: 0.4 })));
  c.after('test-pass', () => s.play(showFirstTrue.to(1, { duration: 0.35 })));
  c.on('test-edit', () => s.play(editedPlay3.to(1, { duration: 0.4 })));
  c.on('test-question', () => s.play(askBefore.to(1, { duration: 0.35 })));
  c.after('test-twelve', () => s.play(revealTwelve.to(1, { duration: 0.35 })));
  c.after('test-fail', () => s.play(revealFail.to(1, { duration: 0.35 })));
  c.after('test-repair', () => s.play(applyRepair.to(1, { duration: 0.45 })));
  c.after('test-fixed', () =>
    s.play(revealFixedPass.to(1, { duration: remainDuration(c, 'test-fixed', 0.4) })),
  );
}
