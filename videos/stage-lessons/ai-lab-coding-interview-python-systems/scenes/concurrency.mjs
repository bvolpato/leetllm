// Scene 20: concurrency - "Where does each page spend its time?"
// Left: Overlapped I/O waits (3s) + GIL-serialized Python CPU turns (A: 3->4s, B: 4->5s) = 5s vs 8s serial!
// Right: Isolated CPU worker boundary sending {id: "t7", x: 7}, returning {id: "t7", square: 49},
//        and merging cleanly into parent records["t7"] = 49.
import { line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  ambientClock,
  cinemaAtmosphere,
  glowArrow,
  glowDot,
  glowPill,
  guardedDynamic,
  hexAlpha,
  lowerFooter,
  mixedWorkSchedule,
  playCue,
  sceneHeading,
  serializedWorkerTrace,
  txt,
} from '../parts.mjs';

export default function concurrency(s, c) {
  const title = sceneHeading(['Where does each page', 'spend its time?'], { accent: ROLE.workerB });

  const amb = ambientClock(s, c);
  const waitProg = s.value(0); // 0 -> 1 fills 0..3s wait bars
  const cpuProg = s.value(0); // 0 -> 1 fills A (3..4s) and B (4..5s) CPU bars
  const sendProg = s.value(0); // 0 -> 1 sends t7 input
  const retShown = s.value(0); // 0 -> 1 worker returns 49
  const mergedShown = s.value(0); // 0 -> 1 parent merges t7 -> 49

  const sched = mixedWorkSchedule({ jobs: 2, wait: 3, cpu: 1 });
  const ser = serializedWorkerTrace();

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const nodes = [];

      // Left hemisphere: Overlapped Wait + Single-GIL CPU Timeline (x = -720 .. 70)
      const x0 = -715;
      const x1 = 45;
      const xOf = (sec) => x0 + ((x1 - x0) * sec) / 5;
      const yA = -160;
      const yB = -45;
      const yCpu = 75;
      const axisY = 155;

      nodes.push(
        txt(
          '2 PAGES: 3s WAIT + 1s PYTHON CPU (GIL)',
          -335,
          -278,
          26,
          ROLE.workerB,
          'mono',
          'center',
        ).opacity(alpha),
        txt('A wait', -845, yA, 26, ROLE.workerA, 'mono', 'left').opacity(alpha),
        txt('B wait', -845, yB, 26, ROLE.workerB, 'mono', 'left').opacity(alpha),
        txt('CPU', -845, yCpu, 26, ROLE.focus, 'mono', 'left').opacity(alpha),
        line([x0, axisY], [x1, axisY], { stroke: '#3a4d78', width: 3.5 }).opacity(alpha),
      );

      for (let sec = 0; sec <= 5; sec++) {
        const tx = xOf(sec);
        nodes.push(
          line([tx, axisY], [tx, axisY + 12], { stroke: COSMOS.muted, width: 2.2 }).opacity(alpha),
          txt(`${sec}s`, tx, axisY + 38, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        );
      }

      // Overlapped wait bars [0..3s]
      const wSpan = (xOf(3) - x0) * Math.max(0.08, waitProg.value);
      nodes.push(
        rect(wSpan, 44, {
          radius: 8,
          fill: hexAlpha(ROLE.workerA, 0.28 * alpha),
          stroke: ROLE.workerA,
          width: 2.5,
        })
          .at(x0 + wSpan / 2, yA)
          .glow(7, ROLE.workerA),
        rect(wSpan, 44, {
          radius: 8,
          fill: hexAlpha(ROLE.workerB, 0.28 * alpha),
          stroke: ROLE.workerB,
          width: 2.5,
        })
          .at(x0 + wSpan / 2, yB)
          .glow(7, ROLE.workerB),
      );
      if (wSpan > 160) {
        nodes.push(
          txt('wait 3 s', x0 + wSpan / 2, yA, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
          txt('wait 3 s', x0 + wSpan / 2, yB, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
        );
      }

      // Serialized CPU bars under GIL: A [3..4s], B [4..5s]
      if (cpuProg.value > 0.05) {
        const aFrac = Math.min(1, cpuProg.value * 2);
        const aW = (xOf(4) - xOf(3)) * aFrac;
        nodes.push(
          rect(aW, 44, {
            radius: 8,
            fill: hexAlpha(ROLE.workerA, 0.42 * alpha),
            stroke: ROLE.workerA,
            width: 2.6,
          })
            .at(xOf(3) + aW / 2, yCpu)
            .glow(9, ROLE.workerA),
        );
        if (aW > 55) {
          nodes.push(
            txt('A', xOf(3) + aW / 2, yCpu, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
          );
        }

        const bFrac = Math.max(0, Math.min(1, (cpuProg.value - 0.5) * 2));
        if (bFrac > 0.05) {
          const bW = (xOf(5) - xOf(4)) * bFrac;
          nodes.push(
            rect(bW, 44, {
              radius: 8,
              fill: hexAlpha(ROLE.workerB, 0.42 * alpha),
              stroke: ROLE.workerB,
              width: 2.6,
            })
              .at(xOf(4) + bW / 2, yCpu)
              .glow(9, ROLE.workerB),
          );
          if (bW > 55) {
            nodes.push(
              txt('B', xOf(4) + bW / 2, yCpu, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
            );
          }
        }
      }

      nodes.push(
        glowPill(
          cpuProg.value > 0.9
            ? `Overlapped: ${sched.overlapped} s   vs   Serial: ${sched.serial} s`
            : 'Threads / async overlap I/O waits cleanly',
          -340,
          262,
          cpuProg.value > 0.9 ? ROLE.ok : ROLE.workerB,
          { size: 26, fixedW: 760, alpha, glow: cpuProg.value > 0.9 ? 11 : 5 },
        ),
      );

      // Center vertical hairline
      nodes.push(line([115, -275], [115, 290], { stroke: '#29375a', width: 2 }).opacity(alpha));

      // Right hemisphere: Isolated CPU Process / Subinterpreter Boundary
      const rx = 500;
      const isSent = sendProg.value > 0.3;
      const isRet = retShown.value > 0.5;
      const isMerged = mergedShown.value > 0.5;

      nodes.push(
        txt('CPU-BOUND: ISOLATED WORKER', rx, -278, 26, ROLE.record, 'mono', 'center').opacity(
          alpha,
        ),

        // Step 1: Serialized input
        txt('1. SERIALIZED INPUT', rx, -205, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        glowPill(`job "${ser.id}"  ·  input x = 7`, rx, -140, isSent ? ROLE.record : COSMOS.dim, {
          size: 27,
          fixedW: 620,
          alpha: isSent ? alpha : 0.6 * alpha,
          glow: isSent ? 10 : 4,
        }),

        glowArrow(rx, -104, rx, -42, isSent ? ROLE.record : COSMOS.dim, { width: 3.4, alpha }),

        // Step 2: Serialized worker output
        txt('2. WORKER RETURNS RECORD', rx, -16, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        glowPill(
          isRet ? `return  ("${ser.id}",  square = ${ser.result})` : 'isolated worker computing...',
          rx,
          48,
          isRet ? ROLE.focus : COSMOS.dim,
          { size: 27, fixedW: 620, alpha: isRet ? alpha : 0.55 * alpha, glow: isRet ? 11 : 0 },
        ),

        glowArrow(rx, 84, rx, 146, isMerged ? ROLE.ok : COSMOS.dim, { width: 3.4, alpha }),

        // Step 3: Parent merge
        txt('3. PARENT MERGES BY ID', rx, 174, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        glowPill(
          isMerged ? `parent["${ser.id}"]  =  ${ser.result}` : `parent["${ser.id}"]  =  empty`,
          rx,
          240,
          isMerged ? ROLE.ok : COSMOS.dim,
          { size: 28, fixedW: 620, alpha, glow: isMerged ? 13 : 0 },
        ),

        txt(
          isMerged
            ? 'A worker mutating its own local dict leaves the parent empty; return identified records.'
            : 'Use threads or async for waits; use processes or isolated interpreters when Python CPU dominates.',
          0,
          355,
          27,
          isMerged ? ROLE.ok : COSMOS.ink,
          'sans',
          'center',
        ).opacity(alpha),

        glowDot(-855 + ((amb.value * 400) % 240), 422, {
          radius: 4.5 + 1.5 * pulse,
          color: ROLE.workerB,
          glow: 8,
          opacity: 0.65 * alpha,
        }),
        lowerFooter(
          'OVERLAP I/O WAITS  ·  ISOLATE CPU WORKERS',
          isMerged ? 'PARENT MERGED t7 -> 49' : '5s OVERLAPPED VS 8s SERIAL (0 OVERHEAD)',
          { accent: isMerged ? ROLE.ok : ROLE.workerB, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.workerB, ROLE.record), title, layer);

  playCue(s, c, 'concurrency-network-waits', (d) => s.play(waitProg.to(1, { duration: d })), {
    dur: 1.5,
  });
  playCue(s, c, 'concurrency-beat-1-focus-1', (d) => s.play(cpuProg.to(1, { duration: d })), {
    dur: 1.6,
  });
  playCue(s, c, 'concurrency-beat-2-focus-1', (d) => s.play(sendProg.to(1, { duration: d })), {
    dur: 0.6,
  });
  playCue(s, c, 'concurrency-return', () => s.play(retShown.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'concurrency-parent-merge', () => s.play(mergedShown.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
}
