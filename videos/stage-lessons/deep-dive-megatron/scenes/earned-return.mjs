// Scene 29: Can the new mesh resume this step? (Earned return on col 6 w=1.5: x=2, target=2, pred=3 -> g=2; saved v=0.8 -> 1.26 vs reset v=0 -> 1.30; stale cursor x=1 -> g=-0.5 -> 1.51 RIGHT; cursor repair -> 1.26 aligned!).
import {
  COSMOS,
  EARNED_FULL,
  EARNED_RESET,
  EARNED_STALE,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function earnedReturn(s, c) {
  const phase = s.value(0);
  // step:
  // 0=saved example x=2,t=2
  // 1=pred=3
  // 2=grad rule (pred-target)*x
  // 3=v0=0.8 vs 0.0
  // 4=PREDICT HOLD 1 (where do weights land?)
  // 5=grad=2
  // 6=ref -> 1.26
  // 7=reset -> 1.30
  // 8=stale cursor x=1,t=2 (both v0=0.8)
  // 9=PREDICT HOLD 2 (left or right of 1.50?)
  // 10=stale -> 1.51 (RIGHT!)
  // 11=advance cursor to x=2
  // 12=rerun -> both 1.26 aligned!
  const step = s.value(0);

  const bgAura = aura(0, 15, 640, '#fbbf241c', '#34d39918');
  const title = heroTitle(['Can the New Mesh', 'Resume This Step?'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'COL 6 (w = 1.5) · WEIGHT + OPTIMIZER + DATA CURSOR',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    // Common weight scale ruler: [1.20, 1.56]
    const xOf = (w) => -640 + ((w - 1.2) / (1.56 - 1.2)) * 1280;

    // Top row: Stream cursor & rule cards
    const cursorX = st >= 8 && st <= 10 ? 1 : 2;
    const cursorTag =
      st >= 8 && st <= 10
        ? 'STALE CURSOR: x = 1, target = 2'
        : st >= 11
          ? 'REPAIRED CURSOR: x = 2, target = 2'
          : 'SAVED CURSOR: x = 2, target = 2';

    nodes.push(
      glassCell(-420, -162, 760, 130, st >= 8 && st <= 10 ? ROLE.bad : ROLE.tp, {
        fill: st >= 8 && st <= 10 ? '#2c1220' : '#101f38',
        glow: 8,
      }),
      txt(cursorTag, -420, -191, 26, st >= 8 && st <= 10 ? ROLE.bad : ROLE.tp, 'mono'),
      txt(
        st >= 8 && st <= 10
          ? st >= 10
            ? 'pred = 1.5 -> g = (1.5 - 2) x 1 = -0.5'
            : 'pred = 1.5 x 1 = 1.5 (target = 2)'
          : `w0 = 1.50 (Rank 1)  |  pred = 1.5 x ${cursorX} = 3.0`,
        -420,
        -135,
        26,
        COSMOS.ink,
        'mono',
      ),

      glassCell(420, -162, 760, 130, COSMOS.gold, { fill: '#1b1a14', glow: 8 }),
      txt('UPDATE RULE (beta = 0.5, lr = 0.1)', 420, -191, 26, COSMOS.gold, 'mono'),
      txt(
        st >= 5 && st <= 7
          ? 'g = (3 - 2) x 2 = 2.0  |  tol <= 0.001'
          : st >= 10 && st <= 10
            ? 'v1 = 0.4 + (-0.5) = -0.1  ->  w1 = 1.51'
            : 'g = (pred - target) x x  |  v1 = 0.5 v0 + g',
        420,
        -135,
        26,
        COSMOS.ink,
        'mono',
      ),
    );

    // Ruler
    const rulerY = 65;
    nodes.push(line([-660, rulerY], [660, rulerY], { color: '#475569', width: 3 }));
    [1.26, 1.3, 1.4, 1.5].forEach((tick) => {
      const tx = xOf(tick);
      nodes.push(
        line([tx, rulerY - 14], [tx, rulerY + 14], { color: '#64748b', width: 2.5 }),
        txt(tick.toFixed(2), tx, rulerY + 42, 26, COSMOS.muted, 'mono'),
      );
    });

    // Reference marker (top of ruler) & Restart marker (bottom of ruler)
    const refVal = st >= 6 ? EARNED_FULL.nextWeight : 1.5;
    const rstVal =
      st === 7
        ? EARNED_RESET.nextWeight
        : st === 10
          ? EARNED_STALE.nextWeight
          : st >= 12
            ? EARNED_FULL.nextWeight
            : 1.5;

    const refX = xOf(refVal);
    const rstX = xOf(rstVal);
    const rstCol = st >= 12 ? ROLE.good : ROLE.bad;

    nodes.push(
      glowDot(refX, rulerY - 52, { radius: 12, color: ROLE.good }),
      txt(
        st >= 6 ? 'Uninterrupted: 1.26' : 'Uninterrupted (v0=0.8): 1.50',
        refX,
        rulerY - 94,
        26,
        ROLE.good,
        'mono',
      ),
      glowDot(rstX, rulerY + 94, { radius: 12, color: rstCol }),
      txt(
        st === 7
          ? 'Restart (v0=0): 1.30 (+0.04 err)'
          : st === 10
            ? 'Restart (stale x=1): 1.51 (RIGHT!)'
            : st >= 12
              ? 'Restart (repaired): 1.26 (EXACT!)'
              : st >= 8
                ? 'Restart (v0=0.8, x=1): 1.50'
                : 'Restart (v0=0): 1.50',
        rstX,
        rulerY + 136,
        26,
        rstCol,
        'mono',
      ),
    );

    if (st >= 6) {
      nodes.push(
        line([xOf(1.5), rulerY - 52], [refX, rulerY - 52], { color: ROLE.good, width: 4 }),
      );
    }
    if (st === 7 || st === 10 || st >= 12) {
      nodes.push(line([xOf(1.5), rulerY + 94], [rstX, rulerY + 94], { color: rstCol, width: 4 }));
    }

    const bottomCaption =
      st <= 4
        ? 'Predict: With v0 = 0.8 vs v0 = 0, where do the two weights land after one step?'
        : st === 5
          ? 'Gradient g = (3 - 2) x 2 = 2.0 (tolerance <= 0.001)'
          : st === 6
            ? 'Uninterrupted carries +0.4 velocity -> steps to 1.26'
            : st === 7
              ? 'Reset velocity steps to 1.30 (+0.04 drift fails tolerance)'
              : st <= 9
                ? 'Predict: With cursor back 1 example (x = 1, target = 2), LEFT or RIGHT of 1.50?'
                : st === 10
                  ? 'Stale cursor (x = 1) reverses gradient -> moves RIGHT to 1.51!'
                  : st === 11
                    ? 'Advance cursor to saved example (x = 2, target = 2)'
                    : 'Comparing the next update verifies weight, optimizer history, and data cursor together';

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 295, { radius: 6, color: COSMOS.gold }),
      txt(bottomCaption, 0, 355, 26, st === 4 || st === 9 ? COSMOS.gold : COSMOS.ink, 'sans'),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 16);
  wireStepCues(s, c, step, [
    ['end-saved-example', 0],
    ['end-probe-result', 1],
    ['end-gradient-rule', 2],
    ['end-history', 3],
    ['end-predict', 4],
    ['mg-fresh-gradient', 5, true],
    ['mg-fresh-full', 6, true],
    ['mg-fresh-reset', 7, true],
    ['mg-fresh-old-input', 8],
    ['end-direction', 9],
    ['mg-fresh-stale-result', 10, true],
    ['mg-fresh-cursor-repair', 11],
    ['end-rerun', 12, true],
  ]);
}
