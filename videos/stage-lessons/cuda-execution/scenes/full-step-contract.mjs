// Scene 22: What is the logging line waiting for? Full-step Adam allocation check, early vs late loss.item() wait, and draining prior queued work.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  TICKET_CLOCK,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  rule,
  txt,
} from '../parts.mjs';

export default function fullStepContract(s, c) {
  const showPart1 = s.value(1); // Beat 0: Full step checks + Adam moments allocation
  const checkProg = s.value(0);
  const adamLit = s.value(0);

  const showPart2 = s.value(0); // Beat 1: loss.item() at 2 ms vs 32 ms + same-stream consumer
  const laterWork = s.value(0);
  const laterRead = s.value(0);
  const showTotal10 = s.value(0);
  const showConsumer = s.value(0);

  const showPart3 = s.value(0); // Beat 2: 5 ms prior work ahead -> drain -> 40 ms clean interval
  const drainProg = s.value(0);

  const bgAura = aura(0, 20, 560, '#5ce1e622', '#ffd16616');

  const title = heroTitle(['Full-Step Budgets', 'and Sync Boundaries'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'PROFILING · loss.item() WAITS · DRAIN BEFORE TIMING',
  });

  // Part 1: 5-stage step check + SGD vs Adam first-step allocation
  const part1 = guardedDynamic(showPart1, (a) => {
    const cp = checkProg.value;
    const ad = adamLit.value;
    const stages = ['1. Shape', '2. Device', '3. Forward', '4. Backward', '5. Update'];
    const nodes = [
      txt(
        'VALIDATE COMPLETE STEP ON LONGEST INPUT',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
    ];

    stages.forEach((st, i) => {
      const cx = -660 + i * 330;
      const done = cp * 5 >= i + 0.4;
      nodes.push(
        glassCell(cx, -50, 290, 134, done ? COSMOS.emerald : COSMOS.rule, {
          fill: done ? '#0e2422' : '#0e1526',
          glow: done ? 8 : 0,
          opacity: a,
        }),
        txt(st, cx, -64, 30, done ? COSMOS.emerald : COSMOS.muted, 'mono').opacity(a),
        txt(done ? 'checked' : '·', cx, -12, 26, done ? COSMOS.ink : COSMOS.dim, 'sans').opacity(a),
      );
    });

    const adamOn = ad > 0.5;
    nodes.push(
      glassCell(0, 215, 1660, 210, adamOn ? COSMOS.rose : COSMOS.blue, {
        fill: adamOn ? '#1c1120' : '#0e172a',
        glow: adamOn ? 9 : 6,
        opacity: a,
      }),
      txt(
        adamOn
          ? 'SWITCHING CLASSIFIER FROM SGD -> ADAM (51 FP32 PARAMETERS)'
          : 'FOUR-TICKET CLASSIFIER · 51 FP32 PARAMETERS (SGD BASELINE)',
        0,
        152,
        26,
        adamOn ? COSMOS.rose : COSMOS.blue,
        'mono',
      ).opacity(a),
      txt(
        adamOn
          ? 'weights 204 B  +  gradients 204 B  +  first-step Adam moments 408 B'
          : 'weights 204 B  +  gradients 204 B  (no optimizer moments yet)',
        0,
        218,
        34,
        COSMOS.ink,
        'mono',
      ).opacity(a),
      txt(
        adamOn
          ? 'First optimizer.step() can OOM even after forward and backward succeed'
          : 'Validate typical and longest inputs through forward, backward, and update',
        0,
        282,
        28,
        adamOn ? COSMOS.gold : COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Part 2: Early (2 ms) vs late (32 ms) loss.item() on same 1..41 ms GPU kernel
  const part2 = guardedDynamic(showPart2, (a) => {
    const lw = laterWork.value;
    const lr = laterRead.value;
    const st10 = showTotal10.value;
    const sc = showConsumer.value;
    const { hostReturn, eventStart, eventEnd, scalarAt } = TICKET_CLOCK;
    const x0 = -490;
    const px = 29; // 44 ms -> 1276 px
    const sx = (ms) => x0 + ms * px;

    const nodes = [
      txt(
        'WHY A PROFILER BLAMES loss.item() · SAME 40 ms GPU KERNEL',
        -855,
        -205,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(a),
      // GPU Kernel track
      txt('GPU kernel', -855, -100, 30, COSMOS.cyan, 'sans', 'left').opacity(a),
      rect((eventEnd - eventStart) * px, 34, { fill: COSMOS.cyan, stroke: null, radius: 5 })
        .at(sx((eventStart + eventEnd) * 0.5), -100)
        .glow(9, COSMOS.cyan)
        .opacity(a),
      txt(`start ${eventStart} ms`, sx(eventStart), -142, 26, COSMOS.cyan, 'mono', 'left').opacity(
        a,
      ),
      txt(`finish ${eventEnd} ms`, sx(eventEnd), -142, 26, COSMOS.cyan, 'mono', 'right').opacity(a),

      // Run 1: loss.item() called at 2 ms -> 39 ms wait + 1 ms read = 40 ms
      txt('Call at 2 ms', -855, 40, 30, COSMOS.gold, 'mono', 'left').opacity(a),
      rect((eventEnd - hostReturn) * px, 32, { fill: COSMOS.gold, stroke: null, radius: 5 })
        .at(sx((hostReturn + eventEnd) * 0.5), 40)
        .glow(8, COSMOS.gold)
        .opacity(a),
      rect((scalarAt - eventEnd) * px, 32, { fill: COSMOS.emerald, stroke: null, radius: 4 })
        .at(sx((eventEnd + scalarAt) * 0.5), 40)
        .opacity(a),
      txt(
        '39 ms waiting + 1 ms read = 40 ms inside loss.item()',
        sx(hostReturn),
        96,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(a),
    ];

    // Run 2: Python does other work until 32 ms, then calls loss.item() -> 9 ms wait + 1 ms read = 10 ms
    if (lw > 0.05) {
      const workEnd = hostReturn + (32 - hostReturn) * lw;
      nodes.push(
        txt('Call at 32 ms', -855, 200, 30, COSMOS.blue, 'mono', 'left').opacity(a),
        rect((workEnd - hostReturn) * px, 32, { fill: COSMOS.blue, stroke: null, radius: 5 })
          .at(sx((hostReturn + workEnd) * 0.5), 200)
          .glow(7, COSMOS.blue)
          .opacity(a),
        txt(
          'other Python work (2..32 ms)',
          sx(hostReturn),
          160,
          26,
          COSMOS.blue,
          'mono',
          'left',
        ).opacity(a),
      );
      if (lr > 0.05) {
        const readEnd = 32 + (scalarAt - 32) * lr;
        const waitEnd = Math.min(readEnd, eventEnd);
        if (waitEnd > 32) {
          nodes.push(
            rect((waitEnd - 32) * px, 32, { fill: COSMOS.gold, stroke: null, radius: 4 })
              .at(sx((32 + waitEnd) * 0.5), 200)
              .glow(7, COSMOS.gold)
              .opacity(a),
          );
        }
        if (readEnd > eventEnd) {
          nodes.push(
            rect((readEnd - eventEnd) * px, 32, { fill: COSMOS.emerald, stroke: null, radius: 4 })
              .at(sx((eventEnd + readEnd) * 0.5), 200)
              .opacity(a),
          );
        }
        const label =
          st10 > 0.5
            ? '9 ms waiting + 1 ms read = 10 ms inside loss.item()'
            : '9 ms remaining on GPU + 1 ms read';
        nodes.push(txt(label, sx(hostReturn), 258, 28, COSMOS.gold, 'mono', 'left').opacity(a));
      }
    }

    if (sc > 0.05) {
      nodes.push(
        glassCell(0, 365, 1660, 96, COSMOS.cyan, { fill: '#0e1d2b', glow: 8, opacity: sc * a }),
        txt(
          'Queue next GPU op on same stream without host wait · use CUDA_LAUNCH_BLOCKING=1 only to debug',
          0,
          368,
          28,
          COSMOS.cyan,
          'sans',
        ).opacity(sc * a),
      );
    }
    return group(...nodes);
  });

  // Part 3: Prior queued work trap -> drain -> clean 40 ms completed interval
  const part3 = guardedDynamic(showPart3, (a) => {
    const dp = drainProg.value;
    const now = dp * 45;
    const x0 = -640;
    const px = 31; // 45 ms -> 1395 px
    const sx = (ms) => x0 + ms * px;

    const bars = [
      { y: -55, start: 0, end: 5, col: COSMOS.dim, label: 'prior 5 ms' },
      { y: -55, start: 5, end: 45, col: COSMOS.cyan, label: 'target step (40 ms)' },
      { y: 125, start: 0, end: 5, col: COSMOS.dim, label: 'drain' },
      { y: 125, start: 5, end: 7, col: COSMOS.blue, label: 'sub' },
      { y: 125, start: 7, end: 45, col: COSMOS.gold, label: 'wait for target finish' },
    ];

    const nodes = [
      txt(
        'TIMING TRAP: 5 ms OF OLDER QUEUED WORK AHEAD OF TARGET STEP',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt('GPU queue', -855, -52, 30, COSMOS.cyan, 'sans', 'left').opacity(a),
      txt('Host clock', -855, 128, 30, COSMOS.blue, 'sans', 'left').opacity(a),
    ];

    bars.forEach((b) => {
      const fullW = (b.end - b.start) * px;
      const frac = Math.max(0, Math.min(1, (now - b.start) / (b.end - b.start)));
      nodes.push(
        glassCell(sx(b.start) + fullW * 0.5, b.y, fullW, 82, b.col, {
          fill: '#0e1526',
          glow: 0,
          opacity: a,
        }),
      );
      if (frac > 0.01) {
        const fw = fullW * frac;
        nodes.push(
          rect(fw, 74, { fill: b.col, stroke: null, radius: 5 })
            .at(sx(b.start) + fw * 0.5, b.y)
            .opacity(0.85 * a),
        );
      }
      if (fullW > 180) {
        nodes.push(
          txt(b.label, sx(b.start) + fullW * 0.5, b.y + 4, 26, '#070910', 'mono').opacity(a),
        );
      }
    });

    nodes.push(
      txt('prior', sx(2.5), 14, 26, COSMOS.muted, 'mono').opacity(a),
      txt('drain', sx(2.5), 196, 26, COSMOS.muted, 'mono').opacity(a),
    );

    for (const ms of [0, 5, 7, 45]) {
      nodes.push(txt(`${ms} ms`, sx(ms), -128, 26, COSMOS.muted, 'mono').opacity(a));
    }
    if (now >= 5) {
      nodes.push(
        rule(sx(5), -106, sx(5), 220, COSMOS.emerald, 4).glow(7, COSMOS.emerald).opacity(a),
        txt('start timer', sx(5), 255, 28, COSMOS.emerald, 'mono').opacity(a),
      );
    }
    if (dp > 0.92) {
      nodes.push(
        rule(sx(45), -106, sx(45), 220, COSMOS.emerald, 4).glow(7, COSMOS.emerald).opacity(a),
        txt('stop timer', sx(45), 255, 28, COSMOS.emerald, 'mono').opacity(a),
        glassCell(0, 355, 1340, 96, COSMOS.emerald, { fill: '#0e2422', glow: 9, opacity: a }),
        txt(
          'Drain old work first -> exact 40 ms completed interval (45 - 5 ms)',
          0,
          358,
          32,
          COSMOS.emerald,
          'mono',
        ).opacity(a),
      );
    }
    return group(...nodes);
  });

  s.add(bgAura, title, part1, part2, part3);

  c.on('full-step-checks', () => s.play(checkProg.to(1, { duration: 1.0 })));
  c.on('full-step-moments', () => s.play(adamLit.to(1, { duration: 0.55 })));

  c.on('full-step-wait', () => {
    s.play(
      par(
        showPart1.to(0, { duration: 0.2 }),
        delay(showPart2.to(1, { duration: 0.25 }), 0.22),
        delay(laterWork.to(1, { duration: 0.75 }), 0.25),
      ),
    );
  });
  c.on('full-step-remaining', () => s.play(laterRead.to(1, { duration: 0.65 })));
  c.on('full-step-read-time', () => s.play(showTotal10.to(1, { duration: 0.35 })));
  c.on('full-step-stream-use', () => s.play(showConsumer.to(1, { duration: 0.45 })));

  c.on('full-step-boundary', () => {
    s.play(
      par(
        showPart2.to(0, { duration: 0.2 }),
        delay(showPart3.to(1, { duration: 0.25 }), 0.22),
        delay(drainProg.to(1, { duration: remainDuration(c, 'full-step-boundary', 1.5) }), 0.25),
      ),
    );
  });
}
