// Scene 11: When does the group reach the GPU queue? GroupEnd blocking vs nonblocking (2ms inProgress -> 4ms enqueue poll -> 9ms writes done) + 2-stream group barrier.
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

export default function groupEnqueue(s, c) {
  const phase = s.value(0);
  // step: 0..3=blocking GroupEnd, 4..7=nonblocking 2ms->4ms->9ms, 8..11=2-stream group join
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61e', '#ffd16618');
  const title = heroTitle(['When Does the Group', 'Reach the GPU Queue?'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.comm,
    eyebrow: 'NCCLGROUPEND · NONBLOCKING POLL · MULTI-STREAM',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const p = phase.value;
    // ms [0..10] -> x in [-560, 640] (120 px/ms)
    const mx = (ms) => -560 + ms * 120;

    const nodes = [
      txt(
        st >= 8
          ? 'MULTI-STREAM GROUP: WAITS FOR PRIOR WORK ON BOTH STREAMS'
          : st >= 4
            ? 'NONBLOCKING COMMUNICATOR: 2 ms IN-PROGRESS -> 4 ms ENQUEUED -> 9 ms WRITES DONE'
            : 'BLOCKING COMMUNICATOR: ncclGroupEnd() DEFERS STREAM ENQUEUE UNTIL CLOSE',
        0,
        -222,
        26,
        st >= 4 ? COSMOS.gold : ROLE.comm,
        'mono',
      ),
      line([mx(0), -155], [mx(10), -155], { stroke: COSMOS.muted, width: 2.4 }),
    ];

    [0, 2, 4, 6, 8, 10].forEach((ms) => {
      const tx = mx(ms);
      nodes.push(
        line([tx, -166], [tx, -144], { stroke: COSMOS.muted, width: 2.2 }),
        txt(`${ms} ms`, tx, -188, 26, COSMOS.muted, 'mono'),
      );
    });

    // Host lane
    nodes.push(
      txt('HOST THREAD', -760, -70, 26, ROLE.r0, 'mono'),
      rect(mx(2) - mx(0), 68, { fill: '#122444', stroke: ROLE.r0, width: 2.4, radius: 8 }).at(
        mx(1),
        -70,
      ),
      txt('GroupEnd', mx(1), -70, 26, ROLE.r0, 'mono'),
    );
    if (st >= 4) {
      nodes.push(
        rect(mx(4) - mx(2) - 4, 68, { fill: '#261e0e', stroke: COSMOS.gold, width: 2.6, radius: 8 })
          .at(mx(3), -70)
          .glow(8, COSMOS.gold),
        txt('poll OK', mx(3), -70, 26, COSMOS.gold, 'mono'),
      );
    }

    // GPU Comm stream lane
    nodes.push(
      txt('GPU STREAM', -760, 50, 26, ROLE.comm, 'mono'),
      rect(mx(9) - mx(4), 68, { fill: '#0e2834', stroke: ROLE.comm, width: 2.8, radius: 8 })
        .at(mx(6.5), 50)
        .glow(8, ROLE.comm),
      txt('NCCL Collective Writes (4 -> 9 ms)', mx(6.5), 50, 26, COSMOS.ink, 'mono'),
    );

    // Reader / Stream 2 lane
    nodes.push(
      txt(st >= 8 ? 'STREAM B' : 'READER', -760, 170, 26, ROLE.good, 'mono'),
      glassCell(mx(9.5), 170, 260, 68, st >= 6 ? ROLE.good : COSMOS.dim, {
        fill: st >= 6 ? '#0d2924' : '#0a0f1c',
        glow: st >= 6 ? 9 : 1,
      }),
      txt(
        st >= 8 ? 'waits >= 9 ms' : 'safe @ 9 ms',
        mx(9.5),
        170,
        26,
        st >= 6 ? ROLE.good : COSMOS.dim,
        'mono',
      ),
    );

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(mx(0) + u * (mx(10) - mx(0)), 268, { radius: 6, color: ROLE.comm }),
      txt(
        st >= 8
          ? 'Grouping calls across streams joins dependencies: NCCL waits for prior work on both'
          : 'A reader needs the CUDA completion event after writes finish at 9 ms, not GroupEnd return',
        0,
        345,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['nc-group-enqueue-b0-s0', 0],
    ['nc-group-enqueue-b0-s1', 1],
    ['nc-group-enqueue-b0-s2', 2],
    ['nc-group-enqueue-b0-s3', 3],
    ['nc-group-enqueue-b1-s0', 4],
    ['nc-group-enqueue-b1-s1', 5],
    ['nc-group-enqueue-b1-s2', 6],
    ['nc-group-enqueue-b1-s3', 7],
    ['nc-group-enqueue-b2-s0', 8],
    ['nc-group-enqueue-b2-s1', 9],
    ['nc-group-enqueue-b2-s2', 10],
    ['nc-group-enqueue-b2-s3', 11],
  ]);
}
