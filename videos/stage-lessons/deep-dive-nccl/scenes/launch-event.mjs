// Scene 12: What does the launch event tell the reader? NCCL 2.32.3 launchCompletionEvent at 4ms != writes done at 9ms; caller-owned DisableTiming event.
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
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function launchEvent(s, c) {
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#ffd1661c', '#6ee7b718');
  const title = heroTitle(['Launch Event vs', 'Write Completion'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.r2,
    eyebrow: 'NCCL 2.32.3 · LAUNCHCOMPLETIONEVENT',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const mx = (ms) => -560 + ms * 120;

    const nodes = [
      txt('KERNEL LAUNCH AT 4 ms  !=  OUTPUT READY AT 9 ms', 0, -222, 28, COSMOS.gold, 'mono'),
      line([mx(0), -155], [mx(10), -155], { stroke: COSMOS.muted, width: 2.4 }),
    ];
    [0, 2, 4, 6, 8, 10].forEach((ms) => {
      const tx = mx(ms);
      nodes.push(
        line([tx, -166], [tx, -144], {
          stroke: ms === 4 ? COSMOS.gold : ms === 9 ? ROLE.good : COSMOS.muted,
          width: 2.4,
        }),
        txt(`${ms} ms`, tx, -188, 26, ms === 4 ? COSMOS.gold : COSMOS.muted, 'mono'),
      );
    });

    // Comm stream writes 4..9 ms
    nodes.push(
      txt('COMM STREAM', -755, -55, 26, ROLE.comm, 'mono'),
      rect(mx(9) - mx(4), 76, { fill: '#0e2834', stroke: ROLE.comm, width: 2.8, radius: 8 })
        .at(mx(6.5), -55)
        .glow(8, ROLE.comm),
      txt('5 ms of Collective Writes (4 -> 9 ms)', mx(6.5), -55, 26, COSMOS.ink, 'mono'),

      // Launch event marker at 4 ms
      glowDot(mx(4), -110, { radius: 10, color: COSMOS.gold }),
      txt('launchEvent (4 ms)', mx(4) - 18, -110, 26, COSMOS.gold, 'mono', 'right'),

      // Completion event marker at 9 ms
      glowDot(mx(9), 20, { radius: 10, color: ROLE.good }),
      txt('writeDoneEvent (9 ms)', mx(9) - 18, 20, 26, ROLE.good, 'mono', 'right'),

      // Contract cards below
      glassCell(-420, 165, 760, 172, st >= 4 ? ROLE.r0 : COSMOS.dim, {
        fill: st >= 4 ? '#0f1d36' : '#0a0f1c',
        glow: st >= 4 ? 8 : 2,
      }),
      txt('LAUNCH EVENT CONTRACT (2.32.3)', -420, 114, 26, ROLE.r0, 'mono'),
      txt('cudaEventDisableTiming · all ranks pass or NULL', -420, 168, 26, COSMOS.ink, 'mono'),
      txt('Keep alive through queued waits & CUDA graphs', -420, 218, 26, COSMOS.muted, 'sans'),

      glassCell(430, 165, 760, 172, st >= 7 ? ROLE.good : COSMOS.dim, {
        fill: st >= 7 ? '#0d2624' : '#0a0f1c',
        glow: st >= 7 ? 9 : 2,
      }),
      txt('OUTPUT LEASE SAFETY', 430, 114, 26, ROLE.good, 'mono'),
      txt('CUDA < 12.3 records launch event before launch', 430, 168, 26, COSMOS.ink, 'mono'),
      txt('Reader ALWAYS waits on event AFTER writes (9 ms)', 430, 218, 26, ROLE.good, 'mono'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['nc-launch-event-b0-s0', 0],
    ['nc-launch-event-b0-s1', 1],
    ['nc-launch-event-b0-s2', 2],
    ['nc-launch-event-b0-s3', 3],
    ['nc-launch-event-b1-s0', 4],
    ['nc-launch-event-b1-s1', 5],
    ['nc-launch-event-b1-s2', 6],
    ['nc-launch-event-b1-s3', 7],
    ['nc-launch-event-b1-s4', 8],
  ]);
}
