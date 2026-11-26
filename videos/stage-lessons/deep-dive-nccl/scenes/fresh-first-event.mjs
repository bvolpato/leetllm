// Scene 26 (Finale): Step 19 on the same four ranks: broken trace (prod->4ms, comm 3..7ms, reader 5ms -> fix read@3 FIRST!) vs replay (comm 4..8ms -> reader safe at 8ms!).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function freshFirstEvent(s, c) {
  const phase = s.value(0);
  // step: 0=prod 0..4, 1=comm 3..7, 2=read@5, 3=replay 4..8, 4=predict (hold!), 5=fix read@3 FIRST!, 6=wait on prod event, 7=replay ends 8ms, 8=reader safe @ 8ms!
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#fb71851c', '#6ee7b718');
  const title = heroTitle(['Step 19 on the', 'Same Four Ranks'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'FINALE TRANSFER · INPUT & OUTPUT EVENT DEPENDENCIES',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const p = phase.value;
    // ms [0..10] -> x in [-560, 640] (120 px/ms)
    const mx = (ms) => -560 + ms * 120;

    const nodes = [
      txt('BROKEN TRACE (TOP) vs REPLAYED SCHEDULE (BOTTOM)', 0, -225, 26, COSMOS.gold, 'mono'),
      line([mx(0), -160], [mx(10), -160], { stroke: COSMOS.muted, width: 2.2 }),
    ];
    [0, 3, 4, 5, 7, 8, 10].forEach((ms) => {
      const tx = mx(ms);
      nodes.push(
        line([tx, -170], [tx, -150], { stroke: ms === 8 ? ROLE.good : COSMOS.muted, width: 2.2 }),
        txt(`${ms}`, tx, -190, 26, ms === 8 ? ROLE.good : COSMOS.muted, 'mono'),
      );
    });

    // Broken Run (top half)
    nodes.push(
      txt('BROKEN R3', -760, -82, 26, ROLE.r3, 'mono'),
      rect(mx(4) - mx(0), 58, { fill: '#22153d', stroke: ROLE.r3, width: 2.4, radius: 8 }).at(
        mx(2),
        -82,
      ),
      txt('R3 Producer (0 -> 4 ms)', mx(2), -82, 26, ROLE.r3, 'mono'),
    );
    if (st >= 1) {
      nodes.push(
        txt('BROKEN RS', -760, -6, 26, st >= 5 ? ROLE.bad : ROLE.comm, 'mono'),
        rect(mx(7) - mx(3), 58, {
          fill: st >= 5 ? '#2d1222' : '#0e2834',
          stroke: st >= 5 ? ROLE.bad : ROLE.comm,
          width: 2.8,
          radius: 8,
        })
          .at(mx(5), -6)
          .glow(8, st >= 5 ? ROLE.bad : ROLE.comm),
        txt(
          st >= 5 ? 'RACE @ 3 ms! (FIX FIRST)' : 'Comm (3 -> 7 ms)',
          mx(5),
          -6,
          26,
          st >= 5 ? ROLE.bad : COSMOS.ink,
          'mono',
        ),
      );
    }
    if (st >= 2) {
      nodes.push(
        glowDot(mx(5), 42, { radius: 8, color: ROLE.bad }),
        txt('R2 reads @ 5 ms (early)', mx(5) + 18, 42, 26, ROLE.bad, 'mono', 'left'),
      );
    }

    // Replay Run (bottom half)
    if (st >= 3) {
      nodes.push(
        txt('REPLAY RS', -760, 128, 26, ROLE.good, 'mono'),
        rect(mx(4) - mx(0), 58, { fill: '#22153d', stroke: ROLE.r3, width: 2.2, radius: 8 }).at(
          mx(2),
          128,
        ),
        txt('Prod (0 -> 4)', mx(2), 128, 26, ROLE.r3, 'mono'),
        rect(mx(8) - mx(4) - 4, 58, { fill: '#0e2834', stroke: ROLE.comm, width: 2.8, radius: 8 })
          .at(mx(6), 128)
          .glow(8, ROLE.comm),
        txt('Comm (4 -> 8 ms)', mx(6), 128, 26, COSMOS.ink, 'mono'),
        glassCell(mx(9), 128, 220, 58, st >= 8 ? ROLE.good : COSMOS.dim, {
          fill: st >= 8 ? '#0d2924' : '#0a0f1c',
          glow: st >= 8 ? 10 : 1,
        }),
        txt(
          st >= 8 ? 'R2 @ 8 ms!' : 'R2 @ ? ms',
          mx(9),
          128,
          26,
          st >= 8 ? ROLE.good : COSMOS.gold,
          'mono',
        ),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 268, { radius: 6, color: st >= 8 ? ROLE.good : COSMOS.gold }),
      txt(
        st >= 8
          ? 'Fix input read @ 3 ms FIRST (wait for producer event); replay unlocks R2 shard safely at 8 ms!'
          : st >= 5
            ? 'Fix the read at 3 ms first! Comm read R3 input before producer finished at 4 ms'
            : st >= 4
              ? 'Predict: which read do you fix first in the broken run, and when can R2 read in the replay?'
              : 'All 4 ranks call matching reduce-scatter; stream events still govern buffer safety',
        0,
        345,
        28,
        st >= 8 ? ROLE.good : COSMOS.gold,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['fresh-input', 0],
    ['fresh-comm', 1],
    ['fresh-read', 2],
    ['fresh-replay', 3],
    ['fresh-predict', 4],
    ['fresh-first', 5, true],
    ['fresh-depend', 6],
    ['fresh-finish', 7],
    ['fresh-release', 8, true],
  ]);
}
