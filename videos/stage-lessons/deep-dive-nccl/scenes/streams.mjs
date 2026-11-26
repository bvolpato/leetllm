// Scene 13: When can rank 2 read its shard? Producer 0..1ms, host return 1.2ms (hold! unsafe!), independent backward 2..6ms overlaps, writes end 7ms -> event unlocks reader!
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

export default function streams(s, c) {
  const phase = s.value(0);
  // step: 0=producer 0..1ms, 1=host 1.2ms, 2=ask safe? (hold!), 3=NOT safe (still writing!), 4=overlap bwd 2..6ms, 5=writes finish 7ms, 6=reader unlocked!
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61e', '#6ee7b718');
  const title = heroTitle(['When Can Rank 2', 'Read Its Shard?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.comm,
    eyebrow: 'CUDA STREAMS · OVERLAP & COMPLETION EVENTS',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const p = phase.value;
    const mx = (ms) => -580 + ms * 135; // [0..9 ms] -> [-580..635]

    const nodes = [
      txt('SHARED GPU CLOCK (REDUCE-SCATTER ON RANK 2)', 0, -225, 28, COSMOS.gold, 'mono'),
      line([mx(0), -160], [mx(9), -160], { stroke: COSMOS.muted, width: 2.4 }),
    ];
    [0, 1, 2, 4, 6, 7, 9].forEach((ms) => {
      const tx = mx(ms);
      nodes.push(
        line([tx, -170], [tx, -150], { stroke: ms === 7 ? ROLE.good : COSMOS.muted, width: 2.2 }),
        txt(`${ms}`, tx, -190, 26, ms === 7 ? ROLE.good : COSMOS.muted, 'mono'),
      );
    });

    // Lane 1: Producer + Independent Backward (compute stream)
    nodes.push(
      txt('COMPUTE', -760, -82, 26, ROLE.r0, 'mono'),
      rect(mx(1) - mx(0), 64, { fill: '#12284a', stroke: ROLE.r0, width: 2.4, radius: 8 }).at(
        mx(0.5),
        -82,
      ),
      txt('Prod', mx(0.5), -82, 26, ROLE.r0, 'mono'),
    );
    if (st >= 4) {
      nodes.push(
        rect(mx(6) - mx(2), 64, { fill: '#1f153a', stroke: ROLE.r3, width: 2.6, radius: 8 })
          .at(mx(4), -82)
          .glow(8, ROLE.r3),
        txt('Independent Bwd (2 -> 6 ms)', mx(4), -82, 26, ROLE.r3, 'mono'),
      );
    }

    // Lane 2: Comm stream (1..7 ms) + Host return marker at 1.2 ms
    nodes.push(
      txt('COMM', -760, 24, 26, ROLE.comm, 'mono'),
      rect(mx(7) - mx(1), 64, { fill: '#0e2834', stroke: ROLE.comm, width: 2.8, radius: 8 })
        .at(mx(4), 24)
        .glow(8, ROLE.comm),
      txt('Reduce-Scatter Writes (1 -> 7 ms)', mx(4), 24, 26, COSMOS.ink, 'mono'),
    );
    if (st >= 1) {
      nodes.push(
        glowDot(mx(1.2), 78, { radius: 8, color: COSMOS.gold }),
        txt('host return 1.2 ms', mx(1.2) + 18, 78, 26, COSMOS.gold, 'mono', 'left'),
      );
    }

    // Lane 3: Reader stream
    const readerCol = st >= 6 ? ROLE.good : st >= 3 ? ROLE.bad : COSMOS.gold;
    nodes.push(
      txt('READER', -760, 158, 26, readerCol, 'mono'),
      glassCell(mx(8), 158, 290, 66, st >= 6 ? ROLE.good : COSMOS.dim, {
        fill: st >= 6 ? '#0d2924' : '#0a0f1c',
        glow: st >= 6 ? 10 : 1,
      }),
      txt(
        st >= 6 ? 'SAFE >= 7 ms' : 'LOCKED',
        mx(8),
        158,
        26,
        st >= 6 ? ROLE.good : COSMOS.dim,
        'mono',
      ),
    );

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 265, { radius: 6, color: readerCol }),
      txt(
        st >= 6
          ? 'Record CUDA event after writes at 7 ms -> reader waits on event -> safe to consume shard'
          : st >= 3
            ? 'NOT safe at 1.2 ms! Host return only means enqueued; shard is still being written'
            : st >= 2
              ? 'Predict: host call returned at 1.2 ms; can another stream safely read slot 2 now?'
              : 'Producer finishes input at 1 ms; communication starts reading',
        0,
        345,
        28,
        readerCol,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['streams-input', 0],
    ['streams-host', 1],
    ['streams-ask', 2],
    ['streams-wait', 3, true],
    ['streams-overlap', 4],
    ['streams-complete', 5],
    ['streams-release', 6, true],
  ]);
}
