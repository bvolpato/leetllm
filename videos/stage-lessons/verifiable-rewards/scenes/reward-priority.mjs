// Scene 28: What earns format credit? (Misweighted 0.7 format + 0.3 content vs gated 1.0 contract)
import {
  COSMOS,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function rewardPriority(s, c) {
  const phase = s.value(0);
  const sStyle = s.value(0);
  const sRank = s.value(0);
  const sRule = s.value(0);
  const revealRescore = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#3d1c4c14');
  const title = heroTitle(['What Earns', 'Format Credit?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.amber,
    eyebrow: 'REWARD WEIGHTING · STYLE OVERRIDING CORRECTNESS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const ss = Math.max(0.65, sStyle.value);
    const rk = sRank.value;
    const rl = sRule.value;
    const rs = revealRescore.value;

    const gatedMode = rl > 0.3;
    const bx = -100;
    const barMax = 680;

    const rows = [
      {
        label: 'A: \\boxed{148}  (wrong, boxed)',
        oldScore: 0.7,
        newScore: 0.0,
        col: gatedMode ? COSMOS.rose : COSMOS.amber,
        y: -110,
      },
      {
        label: 'B: "168"  (right, plain text)',
        oldScore: 0.3,
        newScore: 0.0,
        col: gatedMode && rs > 0.5 ? COSMOS.rose : COSMOS.cyan,
        y: 35,
      },
      {
        label: 'C: \\boxed{168}  (right & boxed)',
        oldScore: 1.0,
        newScore: 1.0,
        col: COSMOS.emerald,
        y: 180,
      },
    ];

    const nodes = [
      txt(
        gatedMode
          ? 'GATED CONTRACT: r = 1 IFF 1 BOX AND VALUE == 168'
          : 'ADDITIVE SPLIT: +0.70 BOX FORMAT  +  0.30 RIGHT VALUE',
        -830,
        -196,
        26,
        gatedMode ? COSMOS.emerald : COSMOS.amber,
        'mono',
        'left',
      ),
    ];

    rows.forEach((row, idx) => {
      const showVal = !gatedMode ? row.oldScore : rs > 0.5 ? row.newScore : null;
      const barW = showVal === null ? 18 : Math.max(12, showVal * barMax);
      nodes.push(
        txt(row.label, -830, row.y + 2, 28, row.col, 'mono', 'left').opacity(ss),
        rect(barMax, 58, { fill: '#111626', stroke: COSMOS.rule, width: 1.8, radius: 8 })
          .at(bx + barMax * 0.5, row.y)
          .opacity(ss),
      );
      if (showVal !== null) {
        nodes.push(
          rect(barW, 52, { fill: row.col, stroke: null, radius: 7 })
            .at(bx + barW * 0.5, row.y)
            .glow(idx === 0 && rk > 0.3 && !gatedMode ? 10 * pulse : 5, row.col)
            .opacity(ss),
          txt(showVal.toFixed(1), bx + barMax + 28, row.y + 2, 34, row.col, 'mono', 'left').opacity(
            ss,
          ),
        );
      } else {
        nodes.push(
          txt('?', bx + barMax + 28, row.y + 2, 36, COSMOS.gold, 'mono', 'left').glow(
            7,
            COSMOS.gold,
          ),
        );
      }
    });

    nodes.push(
      txt(
        rs > 0.5
          ? 'Plain "168" gets 0.0 (missing box) · only boxed 168 gets 1.0 · log format & accuracy separately'
          : gatedMode
            ? 'Under the gated contract, what does plain "168" earn?'
            : rk > 0.3
              ? 'Wrong boxed answer (0.7) BEATS right plain answer (0.3)!'
              : 'Compare additive format credit vs strict gated contract',
        0,
        328,
        28,
        rs > 0.5 ? COSMOS.emerald : gatedMode ? COSMOS.gold : COSMOS.rose,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('priority-style', () => s.play(sStyle.to(1, { duration: 0.45 })));
  c.on('priority-rank', () => s.play(sRank.to(1, { duration: 0.45 })));
  c.on('priority-rule', () => s.play(sRule.to(1, { duration: 0.5 })));
  c.after('priority-rescore', () =>
    s.play(revealRescore.to(1, { duration: remainDuration(c, 'priority-rescore', 0.45) })),
  );
}
