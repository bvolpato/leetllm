// Scene 05: Change the work a task requires (Evol-Instruct 5 in-depth styles, S12 constraints, valid refusal filter)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function evolution(s, c) {
  const phase = s.value(0);
  const sStyles = s.value(0);
  const sFive = s.value(0);
  const sAct2 = s.value(0);
  const sClock = s.value(0);
  const sRetry = s.value(0);
  const sCursor = s.value(0);
  const sTaskDone = s.value(0);
  const sAct3 = s.value(0);
  const sKeep = s.value(0);

  const bgAura = aura(0, 20, 680, '#14385c28', '#331b4f18');

  const title = heroTitle(['Change the Work', 'A Task Requires'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'EVOL-INSTRUCT · IN-DEPTH MUTATIONS & REFUSAL PRESERVATION',
  });

  const depthStyles = [
    { name: 'Constraints', col: COSMOS.blue },
    { name: 'Deepen', col: COSMOS.cyan },
    { name: 'Concretize', col: COSMOS.gold },
    { name: 'Multi-step', col: COSMOS.emerald },
    { name: 'Complicate', col: COSMOS.rose },
  ];

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);
    const st = Math.max(0.75, sStyles.value);
    const fv = sFive.value;
    const a2 = sAct2.value;
    const clk = sClock.value;
    const ret = sRetry.value;
    const cur = sCursor.value;
    const a3 = sAct3.value;
    const kp = sKeep.value;

    // Act 3: WizardLM elimination filter vs valid safety refusals
    if (a3 > 0.5) {
      const nodes = [
        txt('ELIMINATION HEURISTIC VS VALID SAFETY REFUSAL', 0, -188, 28, COSMOS.amber, 'mono'),
        glassCell(0, -70, 1280, 114, COSMOS.amber, { fill: '#261b0e', glow: 7 }),
        txt(
          'Naive heuristic flags: short answer containing "sorry"',
          0,
          -68,
          32,
          COSMOS.amber,
          'mono',
        ),

        glassCell(-410, 128, 700, 150, COSMOS.rose, { fill: '#261018', glow: 5 }),
        txt('UNSOLVABLE / BROKEN REWRITE', -410, 94, 26, COSMOS.rose, 'mono'),
        txt('Filter out low-info / copied text', -410, 148, 28, COSMOS.ink, 'sans'),

        glassCell(410, 128, 700, 150, kp > 0.3 ? COSMOS.emerald : COSMOS.blue, {
          fill: kp > 0.3 ? '#0e2824' : '#101d35',
          glow: kp > 0.3 ? 10 * pulse : 5,
        }),
        txt('POLICY-COMPLIANT SAFETY REFUSAL', 410, 94, 26, COSMOS.emerald, 'mono'),
        txt(
          kp > 0.3 ? 'KEEP VALID REFUSAL IN DATASET' : 'Policy requires refusing unsafe request',
          410,
          148,
          28,
          kp > 0.3 ? COSMOS.emerald : COSMOS.ink,
          'sans',
        ),

        txt(
          'Always distinguish broken rewrites from required policy refusals',
          0,
          355,
          28,
          COSMOS.muted,
          'sans',
        ),
      ];
      return group(...nodes);
    }

    // Act 2: Stacking 3 testable constraints on S12
    if (a2 > 0.5) {
      const constraints = [
        {
          n: '1',
          label: 'Deterministic clock  ->  check exact wait times',
          col: COSMOS.gold,
          on: clk > 0.2,
        },
        {
          n: '2',
          label: 'Bounded retry schedule  ->  count attempts per page',
          col: COSMOS.cyan,
          on: ret > 0.2,
        },
        {
          n: '3',
          label: 'Preserve returned cursor after HTTP 429',
          col: COSMOS.emerald,
          on: cur > 0.2,
        },
      ];

      const nodes = [
        glassCell(0, -142, 1460, 92, COSMOS.blue, { fill: '#0e1d36', glow: 6 }),
        txt('BASE SEED S12 · PAGINATION & RATE-LIMIT RECOVERY', 0, -140, 30, COSMOS.blue, 'mono'),
      ];

      constraints.forEach((row, i) => {
        const y = -6 + i * 130;
        nodes.push(
          glassCell(-650, y, 92, 86, row.on ? row.col : COSMOS.rule, {
            fill: row.on ? '#14263b' : '#0b101d',
            glow: row.on ? 7 : 0,
          }),
          txt(row.n, -650, y + 2, 34, row.on ? row.col : COSMOS.dim, 'mono'),
          glassCell(105, y, 1340, 86, row.on ? row.col : COSMOS.rule, {
            fill: row.on ? '#101d32' : '#0b101d',
            glow: row.on ? 6 : 0,
          }),
          txt(row.label, -530, y + 2, 30, row.on ? COSMOS.ink : COSMOS.dim, 'sans', 'left'),
        );
      });

      nodes.push(
        txt(
          'Every added constraint is directly executable against the search fixture',
          0,
          380,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes);
    }

    // Act 1: 5 In-Depth rising staircase pillars + In-Breadth side branch
    const baseY = 235;
    const nodes = [
      txt('IN-DEPTH EVOLUTION: 5 WAYS TO RAISE TASK DIFFICULTY', 0, -196, 28, COSMOS.blue, 'mono'),
    ];

    depthStyles.forEach((item, i) => {
      const cx = -640 + i * 320;
      const h = 110 + i * 58;
      const active = fv > 0.2 ? 1 : 0.78;
      nodes.push(
        rect(224, h, {
          fill: '#101c34',
          stroke: item.col,
          width: 2.6,
          radius: 10,
        })
          .at(cx, baseY - h * 0.5)
          .opacity(active)
          .glow(fv > 0.2 ? 7 : 3, item.col),
        txt(`+${i + 1}`, cx, baseY - h + 38, 34, item.col, 'mono').opacity(st),
        txt(item.name, cx, baseY + 42, 26, item.col, 'mono').opacity(st),
      );
      if (i < depthStyles.length - 1) {
        nodes.push(
          glowingArc([cx + 118, baseY - h + 40], [cx + 202, baseY - (h + 58) + 40], -18, {
            color: item.col,
            width: 2.6,
            opacity: active,
          }),
        );
      }
    });

    nodes.push(
      glassCell(0, 368, 1520, 86, COSMOS.violet, { fill: '#17122b', glow: 5 }),
      glowDot(-680, 368, { radius: 7, color: COSMOS.violet }),
      txt(
        'In-breadth: propose a different task   ·   Synonym swaps leave work unchanged',
        0,
        370,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('evolution-styles', () => s.play(sStyles.to(1, { duration: 0.4 })));
  c.after('depth-five', () => s.play(sFive.to(1, { duration: 0.45 })));
  c.on('clock-constraint', () => {
    s.play(sAct2.to(1, { duration: 0.3 }), sClock.to(1, { duration: 0.45 }));
  });
  c.on('retry-constraint', () => s.play(sRetry.to(1, { duration: 0.45 })));
  c.on('cursor-constraint', () => s.play(sCursor.to(1, { duration: 0.45 })));
  c.after('evolution-task', () => s.play(sTaskDone.to(1, { duration: 0.35 })));
  c.on('refusal-keep', () => s.play(sAct3.to(1, { duration: 0.35 })));
  c.after('valid-refusal', () =>
    s.play(sKeep.to(1, { duration: remainDuration(c, 'valid-refusal', 0.45) })),
  );
}
