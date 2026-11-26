// Scene 17: Follow responsibilities through the pinned source (init/bootstrap -> graph/search/tuning -> collectives/enqueue -> device/primitives -> transport/proxy -> debug/ras/nccl_device/gin).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function sourceTour(s, c) {
  const phase = s.value(0);
  // step: 0..3=init/graph/tuning, 4..7=collectives/device/transport/proxy.cc, 8..10=debug/ras/nccl_device/gin
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#a78bfa18');
  const title = heroTitle(['Trace One Collective', 'Through NCCL Source'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.r0,
    eyebrow: 'PINNED NVIDIA/NCCL SUBSYSTEM MAP',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const p = phase.value;

    const boxes = [
      {
        k: 'src/init.cc · bootstrap.cc',
        d: 'Missing rank at startup',
        col: ROLE.r0,
        x: -560,
        y: -110,
        hi: st >= 1 && st < 4,
      },
      {
        k: 'src/graph/search · tuning.cc',
        d: 'Route, algo, proto, channels',
        col: ROLE.comm,
        x: 0,
        y: -110,
        hi: st >= 2 && st < 4,
      },
      {
        k: 'src/collectives · enqueue.cc',
        d: 'Arg checks & kernel planning',
        col: ROLE.r2,
        x: 560,
        y: -110,
        hi: st >= 4 && st < 8,
      },
      {
        k: 'src/device/*.h · primitives',
        d: 'GPU copy & sum reductions',
        col: ROLE.good,
        x: -560,
        y: 125,
        hi: st >= 5 && st < 8,
      },
      {
        k: 'src/transport/* · proxy.cc',
        d: 'Connections & host progress',
        col: ROLE.bad,
        x: 0,
        y: 125,
        hi: st >= 6 && st < 8,
      },
      {
        k: 'debug · ras · nccl_device · gin',
        d: 'Logs, RAS & device-initiated',
        col: ROLE.r3,
        x: 560,
        y: 125,
        hi: st >= 8,
      },
    ];

    const nodes = [txt('SIX SUBSYSTEMS IN THE PINNED NCCL TREE', 0, -230, 28, COSMOS.gold, 'mono')];

    boxes.forEach((b) => {
      nodes.push(
        glassCell(b.x, b.y, 510, 174, b.hi ? b.col : COSMOS.dim, {
          fill: b.hi ? '#13203a' : '#0b101d',
          glow: b.hi ? 11 : 2,
        }),
        txt(b.k, b.x, b.y - 34, 26, b.hi ? b.col : COSMOS.muted, 'mono'),
        txt(b.d, b.x, b.y + 30, 26, b.hi ? COSMOS.ink : COSMOS.dim, 'sans'),
      );
    });

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-760 + u * 1520, 285, { radius: 6, color: st >= 6 && st < 8 ? ROLE.bad : ROLE.comm }),
      txt(
        st >= 8
          ? 'Trace one concrete op & its selected plan; nccl_device/gin have distinct device-side entry points'
          : st >= 6
            ? 'If a network transfer stalls on host progress, open src/proxy.cc & src/transport/*'
            : 'Moving a tensor to another host changes the graph candidates the tuner evaluates',
        0,
        360,
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
    ['nc-source-tour-b0-s0', 0],
    ['nc-source-tour-b0-s1', 1],
    ['nc-source-tour-b0-s2', 2],
    ['nc-source-tour-b0-s3', 3],
    ['nc-source-tour-b1-s0', 4],
    ['nc-source-tour-b1-s1', 5],
    ['nc-source-tour-b1-s2', 6],
    ['nc-source-tour-b1-s3', 7],
    ['nc-source-tour-b2-s0', 8],
    ['nc-source-tour-b2-s1', 9],
    ['nc-source-tour-b2-s2', 10],
  ]);
}
