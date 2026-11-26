// Scene 13: complete-buffers: Checkpoint memory scaling (45 MiB / 325 MiB) + conv-window restore (4.3875 vs 3.7375).
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  bufferFixture,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  swapVis,
  txt,
  valuePill,
} from '../parts.mjs';

export default function completeBuffers(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const show45 = s.value(0);
  const show325 = s.value(0);
  const clearLower = s.value(0);
  const slideFour = s.value(0);
  const revealWrites = s.value(0); // strictly withheld until AFTER `compare-writes`!
  const slideTwo = s.value(0);

  const bgAura = aura(0, 0, 740, '#16355e28', '#3c1a3618');
  const title = heroTitle(['Complete Buffers:', 'state + convolution window'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.read,
  });

  const buf = bufferFixture(); // prefix.state=2.15, buffer=[0,3,1]; restored=[..., 4.3875]; dropped=[..., 3.7375]

  // View 1: Snapshot memory growth (5 MiB live -> 45 MiB at 8k -> 325 MiB at 65k)
  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const s45 = show45.value;
    const s325 = show325.value;
    const maxW = 880;
    const barX = -380;
    const nodes = [
      txt(
        'SNAPSHOT MEMORY (5 MiB PER COPY · SAVE EVERY 1,024 TOKENS)',
        -855,
        -210,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      txt('Live copy (1×)', -855, -100, 32, ROLE.state, 'mono', 'left').opacity(alpha),
      lumBar(barX, -100, (5 / 325) * maxW, 38, ROLE.state, { opacity: alpha, maxTrackW: maxW }),
      txt('5 MiB', barX + maxW + 34, -100, 32, ROLE.state, 'mono', 'left').opacity(alpha),
      txt(
        '8,192 pos (9×)',
        -855,
        20,
        32,
        s45 > 0.2 ? ROLE.carry : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, 20, (45 / 325) * maxW * Math.max(0.08, s45), 38, ROLE.carry, {
        opacity: (0.28 + 0.72 * s45) * alpha,
        maxTrackW: maxW,
      }),
      txt(
        s45 > 0.2 ? '45 MiB' : '8k window',
        barX + maxW + 34,
        20,
        32,
        s45 > 0.2 ? ROLE.carry : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),

      txt(
        '65,536 pos (65×)',
        -855,
        140,
        32,
        s325 > 0.2 ? ROLE.delta : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, 140, maxW * Math.max(0.05, s325), 38, ROLE.delta, {
        opacity: (0.28 + 0.72 * s325) * alpha,
        maxTrackW: maxW,
      }),
      txt(
        s325 > 0.2 ? '325 MiB' : '65k window',
        barX + maxW + 34,
        140,
        34,
        s325 > 0.2 ? ROLE.delta : COSMOS.dim,
        'mono',
        'left',
      )
        .glow(s325 > 0.2 ? 8 : 0, ROLE.delta)
        .opacity(alpha),
    ];
    return group(...nodes);
  });

  // View 2: Upper complete copy [0, 3, 1] vs Lower cleared window [0, 0, 0]
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const cl = clearLower.value;
    const s4 = slideFour.value;
    const rw = revealWrites.value;
    const s2 = slideTwo.value;

    const upperBuf =
      s2 > 0.5 ? buf.restored[1].buffer : s4 > 0.5 ? buf.restored[0].buffer : buf.prefix.buffer;
    const lowerBuf =
      s2 > 0.5
        ? buf.dropped[1].buffer
        : s4 > 0.5
          ? buf.dropped[0].buffer
          : cl > 0.5
            ? [0, 0, 0]
            : buf.prefix.buffer;
    const upperH =
      s2 > 0.5 ? buf.restored[1].state : rw > 0.5 ? buf.restored[0].state : buf.prefix.state;
    const lowerH =
      s2 > 0.5 ? buf.dropped[1].state : rw > 0.5 ? buf.dropped[0].state : buf.prefix.state;

    const nodes = [
      txt(
        'CONV WEIGHTS [0.2, 0.3, 0.5]  ·  CARRY 0.5',
        -855,
        -220,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),

      // Upper row: complete checkpoint
      txt('COMPLETE RESTORE', -855, -100, 28, ROLE.state, 'mono', 'left').opacity(alpha),
      valuePill(`[${upperBuf.join(', ')}]`, -320, -100, {
        w: 260,
        h: 74,
        color: ROLE.state,
        opacity: alpha,
      }),
      txt(
        rw > 0.5
          ? `write=${(s2 > 0.5 ? buf.restored[1].write : buf.restored[0].write).toFixed(2)}  →  h=${upperH.toFixed(4)}`
          : `state = ${upperH.toFixed(2)}`,
        -135,
        -100,
        30,
        ROLE.state,
        'mono',
        'left',
      )
        .glow(rw > 0.5 ? 8 : 0, ROLE.state)
        .opacity(alpha),

      // Lower row: cleared conv window
      txt(
        'CLEARED WINDOW',
        -855,
        65,
        28,
        cl > 0.5 ? ROLE.write : ROLE.carry,
        'mono',
        'left',
      ).opacity(alpha),
      valuePill(`[${lowerBuf.join(', ')}]`, -320, 65, {
        w: 260,
        h: 74,
        color: cl > 0.5 ? ROLE.write : ROLE.carry,
        opacity: alpha,
      }),
      txt(
        rw > 0.5
          ? `write=${(s2 > 0.5 ? buf.dropped[1].write : buf.dropped[0].write).toFixed(2)}  →  h=${lowerH.toFixed(4)}`
          : `state = ${lowerH.toFixed(2)}`,
        -135,
        65,
        30,
        cl > 0.5 ? ROLE.write : ROLE.carry,
        'mono',
        'left',
      )
        .glow(rw > 0.5 ? 8 : 0, ROLE.write)
        .opacity(alpha),
    ];

    if (s4 <= 0.5 && s2 <= 0.5) {
      nodes.push(
        txt(
          'Causal Conv1D reads the last 3 inputs [x_{t-2}, x_{t-1}, x_t] before each recurrence step',
          -855,
          245,
          28,
          COSMOS.dim,
          'sans',
          'left',
        ).opacity(alpha),
      );
    }

    if (s4 > 0.5 && rw < 0.2) {
      nodes.push(
        txt(
          'Which copy writes more on input 4, and which old slots create the gap?',
          -855,
          235,
          32,
          ROLE.delta,
          'serif',
          'left',
        )
          .glow(8, ROLE.delta)
          .opacity((1 - rw * 5) * alpha),
      );
    }

    if (s2 > 0.5) {
      nodes.push(
        txt(
          `Complete restore (${buf.restored[1].state.toFixed(4)}) matches uninterrupted run; cleared window drifts to ${buf.dropped[1].state.toFixed(4)}`,
          -855,
          245,
          28,
          ROLE.state,
          'mono',
          'left',
        )
          .glow(6, ROLE.state)
          .opacity(alpha),
      );
    }
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'ssm-snapshots45', (d) => s.play(show45.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'ssm-snapshots325', (d) => s.play(show325.to(1, { duration: d })), { dur: 0.45 });

  playCue(s, c, 'complete-buffers-b2', (d) => s.play(swapVis(view1Vis, view2Vis, d)), { dur: 0.6 });
  playCue(s, c, 'clear-window', (d) => s.play(clearLower.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'append-four', (d) => s.play(slideFour.to(1, { duration: d })), { dur: 0.45 });
  // Strictly withhold write comparison until AFTER `compare-writes`!
  playCue(s, c, 'compare-writes', (d) => s.play(revealWrites.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'append-two', (d) => s.play(slideTwo.to(1, { duration: d })), { dur: 0.45 });
  bindCueBeat(s, c, s.value(0), [
    'complete-buffers-b1',
    'ssm-buffer-first',
    'ssm-buffer-second',
    'ssm-buffer-dropped',
  ]);
}
