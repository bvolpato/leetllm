// Scene 14: Prepare the next batch while the current batch computes (HERO 3D Overlap Scheduler Stream: Serial 10 vs Overlapped 9 units).
import {
  COSMOS,
  ROLE,
  aura,
  buildOverlapStream3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function overlap(s, c) {
  const phase = s.value(0);
  // step: 0=separate host & GPU resources, 1=serial leaves GPU gap (finish 10),
  // 2=prepare B during GPU A, 3=GPU B starts immediately at t=5, 4=finish at 9 (saves 1 unit),
  // 5=valid batch handoff & correctness
  const step = s.value(0);

  const bgAura = aura(460, 20, 560, '#5ce1e620', '#6ee7b71a');
  const { view: stream3d } = buildOverlapStream3d(step, phase, { x: 475, y: 25, unit: 92 });

  const title = heroTitle(['Overlap Host Planning', 'With GPU Execution'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.decode,
    eyebrow: 'OVERLAP SCHEDULER · SERIAL (10) VS PIPELINED (9)',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const overlapped = st >= 2;
    const endUnit = overlapped ? 9 : 10;

    const nodes = [
      txt('3D OVERLAP SCHEDULER STREAM', 475, -390, 26, ROLE.radix, 'mono').glow(5, ROLE.radix),
      txt(
        overlapped
          ? 'Overlap active: GPU idle gap eliminated'
          : 'Serial loop: GPU waits for Host B',
        475,
        405,
        26,
        overlapped ? ROLE.decode : ROLE.fail,
        'mono',
      ),
    ];

    // 2D exact timeline scale on left [-720 .. -20]
    const x0 = -720;
    const wTotal = 700;
    const xOf = (t) => x0 + (t / 10) * wTotal;

    const hostY = -110;
    const gpuY = 45;

    nodes.push(
      txt(
        overlapped ? 'OVERLAPPED SCHEDULE (FINISH = 9)' : 'SERIAL SCHEDULE (FINISH = 10)',
        -420,
        -205,
        28,
        overlapped ? ROLE.decode : COSMOS.gold,
        'mono',
      ),
      txt('Host', -850, hostY, 26, COSMOS.muted, 'mono', 'left'),
      txt('GPU', -850, gpuY, 26, COSMOS.muted, 'mono', 'left'),
      line([xOf(0), 125], [xOf(10), 125], { color: '#475569', width: 3 }),
    );

    [0, 1, 2, 5, 6, 9, 10].forEach((t) => {
      nodes.push(txt(String(t), xOf(t), 158, 26, COSMOS.muted, 'mono'));
    });

    // Intervals
    const drawSpan = (t0, t1, y, lbl, col, fill) => {
      const cx = (xOf(t0) + xOf(t1)) / 2;
      const bw = Math.max(60, xOf(t1) - xOf(t0) - 6);
      nodes.push(
        glassCell(cx, y, bw, 76, col, { fill, glow: 8 }),
        txt(lbl, cx, y, 26, COSMOS.ink, 'mono'),
      );
    };

    drawSpan(0, 1, hostY, 'A', ROLE.prefill, '#10213d');
    drawSpan(1, 5, gpuY, 'GPU A (1..5)', ROLE.prefill, '#10213d');

    if (overlapped) {
      drawSpan(1, 2, hostY, 'B', ROLE.fail, '#2a1224');
      drawSpan(5, 9, gpuY, 'GPU B (5..9)', ROLE.decode, '#0d2922');
    } else {
      drawSpan(5, 6, hostY, 'B', ROLE.fail, '#2a1224');
      drawSpan(5, 6, gpuY, 'gap', ROLE.fail, '#2b101c');
      drawSpan(6, 10, gpuY, 'GPU B (6..10)', ROLE.fail, '#241428');
    }

    // Completion metric readout
    nodes.push(
      glassCell(-420, 245, 860, 88, overlapped ? ROLE.decode : COSMOS.gold, {
        fill: overlapped ? '#0d2922' : '#201c10',
        glow: 9,
      }),
      txt(
        st >= 4
          ? `Overlapped path: ${endUnit} units (1 idle unit saved!)`
          : overlapped
            ? 'Host plans B during GPU A -> B starts t=5'
            : `Serial path: ${endUnit} units (GPU idles t=5..6)`,
        -420,
        245,
        26,
        overlapped ? ROLE.decode : COSMOS.gold,
        'mono',
      ),
    );

    const caption =
      st >= 5
        ? 'Overlap still requires valid budgets, KV slots, and grammar state at handoff.'
        : overlapped
          ? 'Pipelining host planning hides CPU overhead behind active GPU compute.'
          : 'A serial host loop stalls the GPU between consecutive forward batches.';

    nodes.push(txt(caption, -855, 360, 26, COSMOS.ink, 'sans', 'left'));
    return group(...nodes);
  });

  s.add(bgAura, stream3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, stream3d, { theta: -0.2, phi: 0.9 });
  wireStepCues(s, c, step, [
    ['overlap-beat-1-focus-1', 0],
    ['overlap-beat-1-focus-2', 1],
    ['overlap-beat-2-focus-2', 2],
    ['overlap-b-ready', 3],
    ['overlap-beat-2-focus-1', 4, true],
    ['overlap-beat-3-focus-2', 5],
    ['overlap-beat-3-focus-1', 5],
  ]);
}
