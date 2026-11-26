// Scene 33: Which zero belongs in the next update? (18x14=252 fresh batch: quarantine R4 + rescore R2 -> advantage flip)
import {
  COSMOS,
  REPAIR_OLD,
  REPAIR_STRICT,
  REPAIR_WEAK,
  aura,
  freshProduct,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function freshBatchRepair(s, c) {
  const phase = s.value(0);
  const sInputs = s.value(0);
  const sRows = s.value(0);
  const sQuar = s.value(0);
  const sWeakStats = s.value(0);
  const sStrict = s.value(0);
  const sStrictStats = s.value(0);
  const sFlip = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#3d1c4c14');
  const title = heroTitle(['Which Zero Belongs', 'in the Next Update?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: `FRESH CLUSTER · 18 x 14 = ${freshProduct} · QUARANTINE + PARSER REPAIR`,
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sr = Math.max(0.65, sRows.value);
    const sq = sQuar.value;
    const sw = sWeakStats.value;
    const st = sStrict.value;
    const ss = sStrictStats.value;
    const fl = sFlip.value;

    const activeStage = st > 0.5 ? REPAIR_STRICT : sq > 0.5 ? REPAIR_WEAK : REPAIR_OLD;

    const rows = [
      {
        id: 'R1',
        text: '\\boxed{252}',
        r: activeStage.rewards[0],
        adv: activeStage.advantages[0],
        col: COSMOS.emerald,
        y: -115,
      },
      {
        id: 'R2',
        text: '\\boxed{252} then \\boxed{251}',
        r: activeStage.rewards[1],
        adv: activeStage.advantages[1],
        col: st > 0.5 ? COSMOS.rose : COSMOS.amber,
        y: -10,
      },
      {
        id: 'R3',
        text: 'Candidate timeout (healthy)',
        r: activeStage.rewards[2],
        adv: activeStage.advantages[2],
        col: COSMOS.amber,
        y: 95,
      },
      {
        id: 'R4',
        text: 'Host crash (unmeasured)',
        r: sq > 0.5 ? null : 0,
        adv: sq > 0.5 ? null : activeStage.advantages[3],
        col: COSMOS.rose,
        y: 200,
      },
    ];

    const nodes = [
      txt('4 CANDIDATE RECORDS', -830, -196, 26, COSMOS.cyan, 'mono', 'left'),
      txt('REWARD & ADVANTAGE', 440, -196, 26, COSMOS.gold, 'mono'),
    ];

    rows.forEach((row, idx) => {
      const isQuar = idx === 3 && sq > 0.5;
      const isR2Flip = idx === 1 && fl > 0.3;
      const showAdv = sw > 0.3 || ss > 0.3;
      nodes.push(
        glassCell(-280, row.y, 1100, 82, row.col, {
          fill: isQuar ? '#28111a' : isR2Flip ? '#2c131d' : '#101d34',
          dash: isQuar ? [9, 6] : undefined,
          glow: isR2Flip ? 10 * pulse : 4,
          opacity: isQuar ? 0.68 : sr,
        }),
        txt(`${row.id}:  ${row.text}`, -805, row.y + 2, 28, row.col, 'mono', 'left').opacity(
          isQuar ? 0.72 : sr,
        ),
        txt(
          isQuar
            ? 'QUARANTINE'
            : showAdv
              ? `r=${row.r}   A=${row.adv >= 0 ? '+' : ''}${row.adv.toFixed(2)}`
              : `r=${row.r}`,
          225,
          row.y + 2,
          28,
          row.col,
          'mono',
          'right',
        ).opacity(isQuar ? 0.75 : sr),
      );
    });

    // Right column: Mean & std shift (2/3 -> 1/3, same std 0.471!)
    const rx = 590;
    nodes.push(
      glassCell(rx, -60, 520, 175, st > 0.5 ? COSMOS.emerald : COSMOS.gold, {
        fill: st > 0.5 ? '#0e2824' : '#231d0f',
        glow: 8 * pulse,
      }),
      txt(
        st > 0.5 ? 'REPAIRED (SINGLE-BOX)' : sq > 0.5 ? 'OLD FIRST-BOX (n=3)' : 'UNREPAIRED (n=4)',
        rx,
        -112,
        26,
        COSMOS.muted,
        'mono',
      ),
      txt(
        `mean = ${activeStage.mean.toFixed(3)}`,
        rx,
        -58,
        38,
        st > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ),
      txt(`std  = ${activeStage.std.toFixed(3)}`, rx, -6, 32, COSMOS.cyan, 'mono'),

      glassCell(rx, 145, 520, 165, fl > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: fl > 0.3 ? '#291018' : '#12182b',
        glow: fl > 0.3 ? 9 : 3,
      }),
      txt('ROW R2 ADVANTAGE FLIP', rx, 102, 26, COSMOS.gold, 'mono'),
      txt(
        st > 0.5
          ? `Weak: +${REPAIR_WEAK.advantages[1].toFixed(2)} -> Strict: ${REPAIR_STRICT.advantages[1].toFixed(2)}`
          : 'Old parser: R2 stays > 0',
        rx,
        152,
        26,
        st > 0.5 ? COSMOS.rose : COSMOS.muted,
        'mono',
      ),
      txt(
        st > 0.5 ? 'R3 timeout shifts too!' : 'Keep R3 zero · quarantine R4',
        rx,
        196,
        26,
        COSMOS.muted,
        'sans',
      ),

      txt(
        fl > 0.3
          ? 'Which version of the group should supply the next policy update?'
          : '18 workers x 14 slots = 252 · separate candidate timeout (0) from host crash (quarantine)',
        0,
        345,
        28,
        fl > 0.3 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('batch-inputs', () => s.play(sInputs.to(1, { duration: 0.4 })));
  c.on('batch-first', () => s.play(sRows.to(0.4, { duration: 0.3 })));
  c.on('batch-second', () => s.play(sRows.to(0.6, { duration: 0.3 })));
  c.on('batch-timeout', () => s.play(sRows.to(0.8, { duration: 0.3 })));
  c.on('batch-lost', () => s.play(sRows.to(0.95, { duration: 0.3 })));
  c.on('batch-buffer', () => s.play(sRows.to(1, { duration: 0.3 })));
  c.after('batch-quarantine', () => s.play(sQuar.to(1, { duration: 0.45 })));
  c.on('batch-weak-stats', () => s.play(sWeakStats.to(1, { duration: 0.45 })));
  c.on('batch-fields', () => s.play(sStrict.to(0.3, { duration: 0.3 })));
  c.on('batch-strict', () => s.play(sStrict.to(1, { duration: 0.5 })));
  c.on('batch-strict-stats', () => s.play(sStrictStats.to(1, { duration: 0.45 })));
  c.on('batch-flip', () => s.play(sFlip.to(1, { duration: remainDuration(c, 'batch-flip', 0.5) })));
}
