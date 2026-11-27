// Scene 18: When can the second batch start? Serial vs overlapped copy/compute streams with event deps, pinned ownership, and D2H sync.
import { delay, par } from 'vizmatic/stage';
import {
  COPY_OVERLAP,
  COPY_SERIAL,
  COSMOS,
  afterDuration,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  rule,
  txt,
} from '../parts.mjs';

export default function copyDependencies(s, c) {
  const showStreams = s.value(1); // Beats 0..3: serial -> overlap @ 6 ms -> finish @ 17 ms -> ownership
  const overlapMode = s.value(0); // 0=serial, 1=overlap, 2=ownership replay
  const simMs = s.value(0);
  const atSixFlag = s.value(0);
  const showSavings = s.value(0);

  const showD2H = s.value(0); // Beat 4: Device -> Pinned Host copy readiness
  const d2hProg = s.value(0);

  const bgAura = aura(0, 20, 560, '#5ce1e622', '#60a5fa16');

  const title = heroTitle(['Pinned Transfers', 'and Stream Overlap'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'PINNED HOST · COPY ENGINE · CUDA EVENTS',
  });

  const partStreams = guardedDynamic(showStreams, (a) => {
    const mode = Math.round(overlapMode.value);
    const isOverlap = mode >= 1;
    const isOwner = mode === 2;
    const sched = isOverlap ? COPY_OVERLAP : COPY_SERIAL;
    const t = simMs.value;
    const x0 = -600;
    const pxPerMs = 68; // 20 ms -> 1360 px
    const sx = (ms) => x0 + ms * pxPerMs;
    const copyY = -45;
    const compY = 125;

    const subtitle = isOwner
      ? 'OWNERSHIP REPLAY · RELEASE PINNED HOST BUFFER WHEN COPY ENDS'
      : isOverlap
        ? 'TWO STREAMS + TWO DEVICE BUFFERS · 3 ms COPY, 7 ms COMPUTE'
        : 'ONE CUDA STREAM (SERIAL) · 3 ms COPY, 7 ms COMPUTE';

    const nodes = [
      txt(subtitle, -855, -205, 26, isOverlap ? COSMOS.cyan : COSMOS.blue, 'mono', 'left').opacity(
        a,
      ),
      txt('Copy', -855, copyY, 30, COSMOS.blue, 'sans', 'left').opacity(a),
      rule(sx(0), copyY + 34, sx(20), copyY + 34, COSMOS.rule, 2).opacity(a),
      txt('Compute', -855, compY, 30, COSMOS.cyan, 'sans', 'left').opacity(a),
      rule(sx(0), compY + 34, sx(20), compY + 34, COSMOS.rule, 2).opacity(a),
    ];

    // Draw schedule bars up to current time t
    sched.events.forEach((ev) => {
      const y = ev.lane === 'copy' ? copyY : compY;
      const end = Math.min(t, ev.end);
      if (end > ev.start + 0.02) {
        const w = (end - ev.start) * pxPerMs;
        const col = ev.owner === 'A' ? COSMOS.blue : COSMOS.cyan;
        nodes.push(
          rect(w, 48, { fill: col, stroke: null, radius: 6 })
            .at(sx(ev.start) + w * 0.5, y)
            .glow(7, col)
            .opacity(0.92 * a),
        );
        if (w > 135) {
          nodes.push(
            txt(
              `${ev.lane === 'copy' ? 'Copy' : 'Kern'} ${ev.owner}`,
              sx(ev.start) + w * 0.5,
              y + 4,
              26,
              '#070910',
              'mono',
            ).opacity(a),
          );
        }
      }
    });

    // Event dependency arrows when overlapped
    if (isOverlap) {
      for (const name of ['A', 'B']) {
        const arr = sched.inputReady[name];
        const lch = sched.computeReady[name];
        if (t >= arr) {
          const col = name === 'A' ? COSMOS.blue : COSMOS.cyan;
          nodes.push(
            glowDot(sx(arr), copyY + 34, { radius: 7, color: col, glow: 10, opacity: a }),
            rule(sx(arr), copyY + 36, sx(arr), copyY + 95, col, 3).opacity(a),
          );
          if (lch > arr) {
            const reach = Math.min(t, lch);
            nodes.push(rule(sx(arr), copyY + 95, sx(reach), copyY + 95, col, 3).opacity(a));
          }
          if (t >= lch) {
            nodes.push(rule(sx(lch), copyY + 95, sx(lch), compY - 26, col, 3).opacity(a));
          }
        }
      }
    }

    // Ruler ticks
    for (const tick of [0, 3, 6, 10, 13, 17, 20]) {
      nodes.push(
        rule(sx(tick), compY + 42, sx(tick), compY + 56, COSMOS.muted, 2).opacity(a),
        txt(`${tick} ms`, sx(tick), compY + 86, 26, COSMOS.muted, 'mono').opacity(a),
      );
    }

    // Split playhead OUTSIDE the bars so it never crosses bar text labels
    const px = sx(Math.max(0, Math.min(20, t)));
    nodes.push(
      rule(px, copyY - 46, px, copyY - 28, COSMOS.gold, 3)
        .glow(6, COSMOS.gold)
        .opacity(a),
      rule(px, copyY + 38, px, compY - 28, COSMOS.gold, 3)
        .glow(6, COSMOS.gold)
        .opacity(a),
    );

    // Bottom status panels
    if (isOwner) {
      for (const [idx, name] of ['A', 'B'].entries()) {
        const bx = idx === 0 ? -440 : 440;
        const done = t >= sched.inputReady[name];
        const col = done ? COSMOS.emerald : COSMOS.gold;
        nodes.push(
          glassCell(bx, 345, 810, 106, col, { fill: '#0f1828', glow: 8, opacity: a }),
          txt(`Pinned host source ${name}`, bx, 318, 26, COSMOS.muted, 'mono').opacity(a),
          txt(
            `Safe to refill at ${sched.inputReady[name]} ms (copy done)`,
            bx,
            366,
            28,
            col,
            'mono',
          ).opacity(a),
        );
      }
    } else if (isOverlap) {
      const sav = showSavings.value > 0.5;
      const msg = sav
        ? 'A finishes at 10 ms · B finishes at 17 ms  (saved 3 ms vs 20 ms serial)'
        : atSixFlag.value > 0.5
          ? 'At 6 ms: both inputs arrived · Can B compute start while A owns compute lane?'
          : 'Dual streams · separate device buffers';
      const col = sav ? COSMOS.emerald : COSMOS.gold;
      nodes.push(
        glassCell(0, 345, 1660, 104, col, { fill: '#0f1728', glow: 8, opacity: a }),
        txt(msg, 0, 348, 30, col, 'mono').glow(6, col).opacity(a),
      );
    } else {
      nodes.push(
        glassCell(0, 345, 1660, 104, COSMOS.blue, { fill: '#0f1728', glow: 7, opacity: a }),
        txt(
          t >= 19.5
            ? 'Serial stream: 20 ms total · Where could Copy B run while Compute A executes?'
            : 'Running Copy A -> Compute A -> Copy B -> Compute B on one stream...',
          0,
          348,
          30,
          t >= 19.5 ? COSMOS.gold : COSMOS.blue,
          'mono',
        ).opacity(a),
      );
    }

    return group(...nodes);
  });

  // Part 2: D2H copy readiness (Beat 4)
  const partD2H = guardedDynamic(showD2H, (a) => {
    const p = d2hProg.value;
    const done = p > 0.92;
    const nodes = [
      txt(
        'DEVICE-TO-HOST TRANSFER · WAIT BEFORE READING ON CPU',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      glassCell(-490, 45, 480, 175, COSMOS.cyan, { fill: '#0e2030', glow: 8, opacity: a }),
      txt('GPU DEVICE SOURCE', -490, -4, 26, COSMOS.cyan, 'mono').opacity(a),
      txt('2.625', -490, 64, 54, COSMOS.ink, 'mono').opacity(a),

      glowingArc([-240, 45], [240, 45], -40, { color: COSMOS.cyan, width: 4, opacity: a }),
      glowDot(-240 + 480 * p, 45 - 20 * Math.sin(Math.PI * p), {
        radius: 10,
        color: COSMOS.gold,
        glow: 14,
        opacity: a,
      }),

      glassCell(490, 45, 480, 175, done ? COSMOS.emerald : COSMOS.blue, {
        fill: '#0f1a2d',
        glow: done ? 10 : 6,
        opacity: a,
      }),
      txt('PINNED HOST DESTINATION', 490, -4, 26, COSMOS.blue, 'mono').opacity(a),
      txt(done ? '2.625' : '·', 490, 64, 54, done ? COSMOS.emerald : COSMOS.dim, 'mono').opacity(a),

      glassCell(0, 325, 1580, 102, done ? COSMOS.emerald : COSMOS.gold, {
        fill: '#0e1d26',
        glow: 8,
        opacity: a,
      }),
      txt(
        'Wait for D2H transfer to finish -> pinned host buffer is ready to read',
        0,
        328,
        30,
        done ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).opacity(a),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, partStreams, partD2H);

  c.on('copy-serial', () => s.play(simMs.to(20, { duration: 1.2 })));
  c.on('copy-buffers', () => {
    s.play(overlapMode.to(1, { duration: 0.05 }));
    s.play(simMs.to(0, { duration: 0.05 }));
  });
  c.on('copy-start-a', () => s.play(simMs.to(3, { duration: 0.55 })));
  // Stop at 6 ms on copy-overlap so prediction stays open!
  c.on('copy-overlap', () => {
    s.play(simMs.to(6, { duration: 0.65 }));
    s.play(atSixFlag.to(1, { duration: 0.1 }));
  });
  c.on('copy-finish', () => {
    s.play(atSixFlag.to(0, { duration: 0.05 }));
    s.play(simMs.to(17, { duration: 1.1 }));
  });
  c.after('copy-finish', () =>
    s.play(showSavings.to(1, { duration: afterDuration(c, 'copy-finish', 0.35) })),
  );
  c.on('copy-ownership', () => {
    s.play(overlapMode.to(2, { duration: 0.05 }));
    s.play(simMs.to(0, { duration: 0.05 }));
    s.play(delay(simMs.to(6, { duration: 1.0 }), 0.08));
  });
  c.on('copy-readiness', () => {
    s.play(
      par(
        showStreams.to(0, { duration: 0.2 }),
        delay(showD2H.to(1, { duration: 0.25 }), 0.22),
        delay(d2hProg.to(1, { duration: remainDuration(c, 'copy-readiness', 1.1) }), 0.25),
      ),
    );
  });
}
