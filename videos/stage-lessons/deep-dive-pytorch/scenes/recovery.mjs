// Scene 22: Which way will the next Adam update go? Uninterrupted & complete checkpoint move LEFT (m > 0), fresh optimizer moves RIGHT (m < 0)!
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  adamNext,
  adamReset,
  adamSaved,
  aura,
  glassCell,
  glowDot,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function recovery(s, c) {
  const phase = s.value(0);
  const savedOn = s.value(0);
  const negGrad = s.value(0);
  const revLeft = s.value(0);
  const showFresh = s.value(0);
  const showFreshM = s.value(0);
  const revRight = s.value(0);
  const showCompare = s.value(0);

  const bgAura = aura(0, 20, 620, '#6ee7b718', '#fb71851c');
  const title = heroTitle(['Which Way Will the Next', 'Adam Update Go?'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.good,
    eyebrow: 'CHECKPOINT RECOVERY · FIRST-MOMENT SIGN',
  });

  const live = guardedDynamic(1, () => {
    const sv = savedOn.value;
    const ng = negGrad.value;
    const rl = revLeft.value;
    const sf = showFresh.value;
    const sm = showFreshM.value;
    const rr = revRight.value;
    const sc = showCompare.value;
    const p = phase.value;

    // Weight number line: w in [0.975, 1.005] -> x in [-500, 420]
    const wMin = 0.975;
    const wMax = 1.005;
    const wx = (w) => -500 + ((w - wMin) / (wMax - wMin)) * 920;
    const startX = wx(adamSaved.w); // 0.990

    const nodes = [
      txt(
        ng > 0.5
          ? 'STEP 1 SAVED w = 0.990 (g=+0.5)   ·   NEW GRADIENT g2 = -0.25'
          : 'STEP 1: w = 1.000 -> 0.990 with g1 = +0.50 (save w, m, v, step=1)',
        0,
        -225,
        26,
        COSMOS.gold,
        'mono',
      ),
      // Scale ruler
      line([-500, -155], [420, -155], { stroke: COSMOS.muted, width: 2.6 }),
    ];

    [0.98, 0.985, 0.99, 0.995, 1.0].forEach((tick) => {
      const tx = wx(tick);
      nodes.push(
        line([tx, -166], [tx, -144], {
          stroke: tick === 0.99 ? COSMOS.gold : COSMOS.muted,
          width: 2.6,
        }),
        txt(tick.toFixed(3), tx, -190, 26, tick === 0.99 ? COSMOS.gold : COSMOS.muted, 'mono'),
      );
    });

    // Three parallel lanes: Uninterrupted, Complete Restore, Fresh Optimizer
    const lanes = [
      {
        label: 'UNINTERRUPTED',
        y: -70,
        col: ROLE.orig,
        endW: adamNext.w,
        moved: rl > 0.5,
        mText:
          rl > 0.5
            ? `m = +${adamNext.m.toFixed(3)} -> LEFT`
            : `saved m = +${adamSaved.m.toFixed(2)}`,
      },
      {
        label: 'COMPLETE RESTORE',
        y: 35,
        col: ROLE.good,
        endW: adamNext.w,
        moved: rl > 0.5,
        mText:
          sc > 0.5
            ? 'EXACT MATCH!'
            : rl > 0.5
              ? `m = +${adamNext.m.toFixed(3)} -> LEFT`
              : 'w, m, v, step loaded',
      },
      {
        label: 'WEIGHT-ONLY (FRESH)',
        y: 140,
        col: ROLE.bad,
        endW: adamReset.w,
        moved: rr > 0.5,
        mText:
          rr > 0.5
            ? `m = ${adamReset.m.toFixed(3)} -> RIGHT!`
            : sm > 0.5
              ? 'm turns NEGATIVE!'
              : sf > 0.5
                ? 'm=0, v=0, step=0'
                : 'waiting...',
      },
    ];

    lanes.forEach((ln) => {
      nodes.push(
        txt(ln.label, -845, ln.y, 26, ln.col, 'mono', 'left'),
        line([-500, ln.y], [420, ln.y], { stroke: COSMOS.dim, width: 1.8 }),
        glowDot(startX, ln.y, { radius: 8, color: COSMOS.gold }),
      );
      if (ln.moved) {
        const ex = wx(ln.endW);
        nodes.push(
          line([startX, ln.y], [ex, ln.y], { stroke: ln.col, width: 5.0 }).glow(8, ln.col),
          glowDot(ex, ln.y, { radius: 11, color: ln.col }),
        );
      }
      nodes.push(txt(ln.mText, 455, ln.y, 26, ln.col, 'mono', 'left'));
    });

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 262, { radius: 6, color: rr > 0.5 ? ROLE.bad : ROLE.good }),
      txt(
        sc > 0.5
          ? 'Also restore LR scheduler, grad scaler, RNG, and data cursor for exact distributed resume'
          : rr > 0.5
            ? 'Same starting weight 0.990, OPPOSITE update directions because Adam momentum was lost!'
            : ng > 0.5
              ? 'Predict: if a fresh optimizer loads only w=0.990, will it step the same direction?'
              : sv > 0.5
                ? 'Saved checkpoint holds weight, first moment m, second moment v, and step count'
                : 'Adam starts at w = 1.0 with g1 = +0.5',
        0,
        345,
        28,
        rl < 0.5 ? COSMOS.gold : ROLE.good,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('save-adam', () =>
    s.play(savedOn.to(1, { duration: remainDuration(c, 'save-adam', 0.35) })),
  );
  c.on('next-grad', () =>
    s.play(negGrad.to(1, { duration: remainDuration(c, 'next-grad', 0.35) })),
  );
  c.after('complete-step', () =>
    s.play(revLeft.to(1, { duration: remainDuration(c, 'complete-step', 0.45) })),
  );
  c.on('reset-step', () =>
    s.play(showFresh.to(1, { duration: remainDuration(c, 'reset-step', 0.35) })),
  );
  c.on('reset-moment', () =>
    s.play(showFreshM.to(1, { duration: remainDuration(c, 'reset-moment', 0.35) })),
  );
  c.after('reset-direction', () =>
    s.play(revRight.to(1, { duration: remainDuration(c, 'reset-direction', 0.45) })),
  );
  c.on('compare-resume', () =>
    s.play(showCompare.to(1, { duration: remainDuration(c, 'compare-resume', 0.4) })),
  );
}
