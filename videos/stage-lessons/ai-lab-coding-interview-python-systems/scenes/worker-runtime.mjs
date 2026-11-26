// Scene 21: worker-runtime - "Match the runtime to waiting and computation"
// Stage 0: CPython GIL vs optional free-threading (3.13 -> 3.14 supported) + explicit sync still needed.
// Stage 1: InterpreterPoolExecutor / ProcessPoolExecutor serialization: pickle rejects lambda,
//          worker mutates its own copy ['ERROR', 'INFO', 'ERROR'] while parent keeps ['ERROR', 'INFO', empty].
// Stage 2: asyncio yielding (sleep(0) -> A start, B start, A resume, B resume) vs blocking sleep serializing!
// NOTE: ZERO em dashes anywhere!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  ambientClock,
  cinemaAtmosphere,
  glowArrow,
  glowCross,
  glowDot,
  glowPill,
  guardedDynamic,
  lowerFooter,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function workerRuntime(s, c) {
  const title = sceneHeading(['Match the runtime to', 'waiting and computation'], {
    accent: ROLE.record,
  });

  const amb = ambientClock(s, c);
  const stage = s.value(0); // 0=GIL & free-threading, 1=pickle & isolated copy, 2=asyncio yield vs block
  const serStep = s.value(0); // 0=init, 1=copied to worker, 2=lambda rejected, 3=worker appends ERROR
  const asyncMode = s.value(0); // 0=yield (interleaved), 1=blocking sleep (serialized!)

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const st = Math.round(stage.value);
      const nodes = [];

      if (st === 0) {
        nodes.push(
          txt(
            'CPYTHON RUNTIME: GIL VS OPTIONAL FREE-THREADING',
            0,
            -278,
            26,
            ROLE.workerB,
            'mono',
            'center',
          ).opacity(alpha),

          // Left: Standard GIL build
          txt('STANDARD GIL BUILD', -445, -175, 27, ROLE.workerA, 'mono', 'center').opacity(alpha),
          glowPill('1 thread runs Python bytecode at a time', -445, -90, ROLE.workerA, {
            size: 26,
            fixedW: 720,
            alpha,
          }),
          glowPill('Blocking I/O releases GIL -> waits overlap', -445, 20, ROLE.ok, {
            size: 26,
            fixedW: 720,
            alpha,
          }),

          line([0, -200], [0, 115], { stroke: '#29375a', width: 2 }).opacity(alpha),

          // Right: Free-threaded build (3.13 / 3.14)
          txt(
            'FREE-THREADED BUILD (3.13 -> 3.14)',
            445,
            -175,
            27,
            ROLE.focus,
            'mono',
            'center',
          ).opacity(alpha),
          glowPill('Officially supported (optional) in 3.14', 445, -90, ROLE.focus, {
            size: 26,
            fixedW: 720,
            alpha,
          }),
          glowPill('Incompatible C-ext can re-enable the GIL', 445, 20, ROLE.warn, {
            size: 26,
            fixedW: 720,
            alpha,
          }),

          glowPill(
            'FREE THREADING STILL REQUIRES LOCKS ON SHARED COMPOUND STATE',
            0,
            185,
            ROLE.fail,
            {
              size: 26,
              fixedW: 1180,
              alpha,
              glow: 10,
            },
          ),

          txt(
            'Inspect the running interpreter and synchronize shared state transitions under either build.',
            0,
            335,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else if (st === 1) {
        const ss = Math.round(serStep.value);
        const copied = ss >= 1;
        const badLambda = ss >= 2;
        const mutated = ss >= 3;

        nodes.push(
          txt(
            'ISOLATED POOLS (3.14 InterpreterPool / ProcessPool): SERIALIZED COPIES',
            0,
            -278,
            26,
            ROLE.record,
            'mono',
            'center',
          ).opacity(alpha),

          // Parent list row (NEVER mutated by worker!)
          txt('PARENT LIST', -745, -150, 26, ROLE.workerA, 'mono', 'center').opacity(alpha),
          glowPill('[0]  ERROR', -430, -150, ROLE.workerA, { size: 26, fixedW: 250, alpha }),
          glowPill('[1]  INFO', -140, -150, ROLE.workerA, { size: 26, fixedW: 250, alpha }),
          glowPill('[2]  empty', 150, -150, COSMOS.dim, {
            size: 26,
            fixedW: 250,
            alpha: 0.65 * alpha,
            glow: 0,
            textColor: COSMOS.muted,
          }),

          // Pickle copy arrows downward
          glowArrow(-430, -110, -430, -28, copied ? ROLE.record : COSMOS.dim, {
            width: 3.4,
            alpha,
          }),
          glowArrow(-140, -110, -140, -28, copied ? ROLE.record : COSMOS.dim, {
            width: 3.4,
            alpha,
          }),
          txt('pickle copy', -285, -70, 26, ROLE.record, 'mono', 'center').opacity(
            copied ? alpha : 0.45 * alpha,
          ),

          // Worker copy row (mutates slot [2] locally!)
          txt('WORKER COPY', -745, 12, 26, ROLE.workerB, 'mono', 'center').opacity(alpha),
          glowPill(
            copied ? '[0]  ERROR' : '[0]  empty',
            -430,
            12,
            copied ? ROLE.workerB : COSMOS.dim,
            {
              size: 26,
              fixedW: 250,
              alpha: copied ? alpha : 0.5 * alpha,
            },
          ),
          glowPill(
            copied ? '[1]  INFO' : '[1]  empty',
            -140,
            12,
            copied ? ROLE.workerB : COSMOS.dim,
            {
              size: 26,
              fixedW: 250,
              alpha: copied ? alpha : 0.5 * alpha,
            },
          ),
          glowPill(
            mutated ? '[2]  ERROR' : '[2]  empty',
            150,
            12,
            mutated ? ROLE.focus : COSMOS.dim,
            { size: 26, fixedW: 250, alpha: mutated ? alpha : 0.5 * alpha, glow: mutated ? 12 : 0 },
          ),

          // Right side: Callable serialization guard
          line([330, -205], [330, 110], { stroke: '#29375a', width: 2 }).opacity(alpha),
          txt('CALLABLE PICKLE', 605, -185, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          glowPill(
            badLambda ? 'lambda -> REJECTED' : 'lambda -> testing...',
            605,
            -95,
            badLambda ? ROLE.fail : COSMOS.dim,
            { size: 26, fixedW: 460, alpha, glow: badLambda ? 12 : 0 },
          ),
          glowPill('module-level def -> OK', 605, 12, ROLE.ok, {
            size: 26,
            fixedW: 460,
            alpha,
            glow: 8,
          }),

          glowPill(
            mutated
              ? 'Parent list UNCHANGED! Return records and merge in the parent.'
              : 'Isolated interpreters each have their own GIL and memory space.',
            0,
            185,
            mutated ? ROLE.ok : ROLE.record,
            { size: 27, fixedW: 1120, alpha, glow: mutated ? 11 : 5 },
          ),

          txt(
            'Use importable module-level functions and put portable process startup under __main__.',
            0,
            335,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );

        if (badLambda) {
          nodes.push(glowCross(855, -95, 24, ROLE.fail, alpha));
        }
      } else {
        // Stage 2: asyncio yielding (sleep(0)) vs blocking sleep
        const isBlock = asyncMode.value > 0.5;
        const yA = -110;
        const yB = 65;
        const x0 = -640;
        const x1 = 700;
        const stepX = (i) => x0 + ((x1 - x0) * (i + 0.5)) / 4;

        nodes.push(
          txt(
            isBlock
              ? 'BLOCKING time.sleep() STALLS THE EVENT LOOP (SERIALIZED!)'
              : 'YIELDING await asyncio.sleep(0) INTERLEAVES TASKS',
            0,
            -278,
            26,
            isBlock ? ROLE.fail : ROLE.ok,
            'mono',
            'center',
          ).opacity(alpha),
          txt('Task A', -790, yA, 28, ROLE.workerA, 'mono', 'center').opacity(alpha),
          txt('Task B', -790, yB, 28, ROLE.workerB, 'mono', 'center').opacity(alpha),
          line([x0, yA], [x1, yA], { stroke: '#29375a', width: 3 }).opacity(alpha),
          line([x0, yB], [x1, yB], { stroke: '#29375a', width: 3 }).opacity(alpha),
        );

        const events = isBlock
          ? [
              { i: 0, y: yA, label: '1. A start', col: ROLE.workerA },
              { i: 1, y: yA, label: '2. A resume', col: ROLE.fail },
              { i: 2, y: yB, label: '3. B start', col: ROLE.workerB },
              { i: 3, y: yB, label: '4. B resume', col: ROLE.workerB },
            ]
          : [
              { i: 0, y: yA, label: '1. A start', col: ROLE.workerA },
              { i: 1, y: yB, label: '2. B start', col: ROLE.workerB },
              { i: 2, y: yA, label: '3. A resume', col: ROLE.ok },
              { i: 3, y: yB, label: '4. B resume', col: ROLE.ok },
            ];

        events.forEach((ev) => {
          nodes.push(
            glowPill(ev.label, stepX(ev.i), ev.y, ev.col, {
              size: 27,
              fixedW: 280,
              alpha,
              glow: 10,
            }),
          );
        });

        nodes.push(
          glowPill(
            isBlock
              ? 'Blocking sleep never yields; awaiting an already-done awaitable need not yield either'
              : '3.14 default process start moved off fork  ·  Measure startup + pickle + merge',
            0,
            215,
            isBlock ? ROLE.fail : ROLE.focus,
            { size: 26, fixedW: 1380, alpha, glow: isBlock ? 11 : 6 },
          ),
          txt(
            isBlock
              ? 'Keep blocking I/O and CPU work off the asyncio event loop.'
              : 'Cooperate at real await boundaries so other coroutines can make progress.',
            0,
            335,
            27,
            isBlock ? ROLE.fail : ROLE.ok,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        glowDot(-855 + ((amb.value * 400) % 240), 422, {
          radius: 4.5 + 1.5 * pulse,
          color: ROLE.record,
          glow: 8,
          opacity: 0.65 * alpha,
        }),
        lowerFooter(
          'GIL  ·  FREE-THREADING  ·  PICKLE ISOLATION  ·  ASYNCIO',
          st === 2
            ? asyncMode.value > 0.5
              ? 'BLOCKING SLEEP SERIALIZES LOOP'
              : 'sleep(0): A START, B START, A RESUME, B RESUME'
            : st === 1
              ? 'WORKER COPY != PARENT LIST'
              : 'SYNC SHARED STATE UNDER EVERY BUILD',
          { accent: st === 2 && asyncMode.value > 0.5 ? ROLE.fail : ROLE.record, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.record, ROLE.workerB), title, layer);

  // Beat 0: GIL & free-threading
  playCue(s, c, 'ci-worker-runtime-0-build', () => s.play(stage.to(0, { duration: 0.05 })), {
    dur: 0.1,
  });

  // Beat 1: Pickle & isolated copy
  playCue(
    s,
    c,
    'ci-worker-runtime-1-build',
    () => s.play(stage.to(1, { duration: 0.05 }), serStep.to(0, { duration: 0.05 })),
    { dur: 0.1 },
  );
  playCue(s, c, 'runtime-serialize', () => s.play(serStep.to(1, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'runtime-lambda', () => s.play(serStep.to(2, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'runtime-copy', () => s.play(serStep.to(3, { duration: 0.05 })), { dur: 0.1 });

  // Beat 2: asyncio yield vs blocking sleep
  playCue(
    s,
    c,
    'ci-worker-runtime-2-build',
    () => s.play(stage.to(2, { duration: 0.05 }), asyncMode.to(0, { duration: 0.05 })),
    { dur: 0.1 },
  );
  playCue(s, c, 'runtime-interleave', () => s.play(asyncMode.to(0, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'ci-worker-runtime-blocking', () => s.play(asyncMode.to(1, { duration: 0.05 })), {
    dur: 0.1,
  });
}
