// Scene 13: scheduler-workers - "Publish completion before releasing the dependent"
// Stage 0: Concurrent Condition handoff (claim under lock -> run outside lock -> reacquire & publish ->
//          decrement dependent -> notify -> woken waiter rechecks predicate under lock).
// Stage 1: Separating FAILED (ran & exhausted) vs BLOCKED (never eligible) + explicit worker lifecycle,
//          clearly noting the article's base implementation is sequential.
import { line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  WORKER_COND_LINES,
  actorOrb,
  cinemaAtmosphere,
  codeSpotlight,
  glowArrow,
  glowPill,
  guardedDynamic,
  hexAlpha,
  lowerFooter,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function schedulerWorkers(s, c) {
  const title = sceneHeading(['Publish completion before', 'releasing the dependent'], {
    accent: ROLE.ok,
  });

  const stage = s.value(0); // 0=concurrent Condition handoff, 1=failed vs blocked & lifecycle
  const handoff = s.value(0); // 0..6: claim, run, publish, release, notify, recheck
  const failStep = s.value(0); // 0=init, 1=failed, 2=blocked, 3=lifecycle, 4=sequential note

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const st = Math.round(stage.value);
      const nodes = [];

      if (st === 0) {
        const hs = Math.round(handoff.value);
        const activeCode =
          hs === 1
            ? [0, 3]
            : hs === 2
              ? [4]
              : hs === 3 || hs === 4
                ? [5, 6]
                : hs >= 5
                  ? [1, 2]
                  : [];

        // Left: 3-lane concurrent handoff diagram
        const tx0 = -640;
        const tx1 = 80;
        const xOf = (u) => tx0 + (tx1 - tx0) * u;
        const yCond = -170;
        const yWork = -35;
        const yWait = 100;

        nodes.push(
          txt(
            'CONCURRENT HANDOFF DESIGN (PROPOSED)',
            -280,
            -280,
            26,
            ROLE.focus,
            'mono',
            'center',
          ).opacity(alpha),
          txt('LOCK', -775, yCond, 26, ROLE.focus, 'mono', 'center').opacity(alpha),
          txt('WORKER', -775, yWork, 26, ROLE.workerA, 'mono', 'center').opacity(alpha),
          txt('WAITER', -775, yWait, 26, ROLE.workerB, 'mono', 'center').opacity(alpha),
          line([tx0, yCond], [tx1, yCond], { stroke: '#29375a', width: 3 }).opacity(alpha),
          line([tx0, yWork], [tx1, yWork], { stroke: '#29375a', width: 3 }).opacity(alpha),
          line([tx0, yWait], [tx1, yWait], { stroke: '#29375a', width: 3 }).opacity(alpha),
        );

        // Claim bar [0..0.18]
        if (hs >= 1) {
          const w = xOf(0.2) - tx0;
          nodes.push(
            rect(w, 44, { radius: 8, fill: COSMOS.bg, stroke: null }).at(tx0 + w / 2, yCond),
            rect(w, 44, {
              radius: 8,
              fill: hexAlpha(ROLE.ok, 0.28 * alpha),
              stroke: ROLE.ok,
              width: 2.5,
            }).at(tx0 + w / 2, yCond),
            txt('claim', tx0 + w / 2, yCond, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
          );
        }

        // Run outside lock [0.22..0.56]
        if (hs >= 2) {
          const rx0 = xOf(0.22);
          const rw = xOf(0.56) - rx0;
          nodes.push(
            rect(rw, 44, { radius: 8, fill: COSMOS.bg, stroke: null }).at(rx0 + rw / 2, yWork),
            rect(rw, 44, {
              radius: 8,
              fill: hexAlpha(ROLE.workerA, 0.28 * alpha),
              stroke: ROLE.workerA,
              width: 2.5,
            })
              .at(rx0 + rw / 2, yWork)
              .glow(8, ROLE.workerA),
            txt('run task', rx0 + rw / 2, yWork, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
          );
        }

        // Reacquire & publish [0.58..0.82]
        if (hs >= 3) {
          const px0 = xOf(0.58);
          const pw = xOf(0.82) - px0;
          nodes.push(
            rect(pw, 44, { radius: 8, fill: COSMOS.bg, stroke: null }).at(px0 + pw / 2, yCond),
            rect(pw, 44, {
              radius: 8,
              fill: hexAlpha(ROLE.ok, 0.3 * alpha),
              stroke: ROLE.ok,
              width: 2.5,
            })
              .at(px0 + pw / 2, yCond)
              .glow(10, ROLE.ok),
            txt('publish', px0 + pw / 2, yCond, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
          );
        }

        // Notify -> Waiter rechecks predicate [0.82..0.98]
        if (hs >= 5) {
          nodes.push(
            glowArrow(xOf(0.82), yCond + 24, xOf(0.86), yWait - 24, ROLE.focus, {
              width: 3.5,
              alpha,
            }),
            glowPill(hs >= 6 ? 'recheck!' : 'notify', xOf(0.88), yWait, ROLE.focus, {
              size: 26,
              fixedW: 195,
              alpha,
              glow: 11,
            }),
          );
        }

        // Bottom left live predicate pills
        nodes.push(
          glowPill(
            hs >= 4 ? 'deploy.remaining = 0 (released!)' : 'deploy.remaining = 1 (waiting)',
            -465,
            235,
            hs >= 4 ? ROLE.ok : ROLE.warn,
            { size: 26, fixedW: 540, alpha, glow: hs >= 4 ? 11 : 5 },
          ),
          glowPill(
            hs >= 6 ? 'waiter: recheck' : 'waiter: sleeping on condition',
            180,
            235,
            hs >= 6 ? ROLE.focus : COSMOS.dim,
            { size: 26, fixedW: 580, alpha },
          ),
        );

        // Right: Python Condition code spotlight
        nodes.push(
          codeSpotlight(WORKER_COND_LINES, 210, -210, {
            lineH: 52,
            size: 27,
            activeLines: activeCode,
            activeColor: hs >= 5 ? ROLE.focus : ROLE.ok,
            beamW: 620,
            alpha,
          }),
        );

        nodes.push(
          txt(
            'Waking from condition.wait() is not permission: always recheck the predicate in a while loop.',
            0,
            345,
            27,
            hs >= 6 ? ROLE.focus : COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Stage 1: FAILED vs BLOCKED & Lifecycle + Sequential note
        const fs = Math.round(failStep.value);
        nodes.push(
          txt(
            'FAILED VS BLOCKED & WORKER LIFECYCLE',
            0,
            -278,
            26,
            ROLE.fail,
            'mono',
            'center',
          ).opacity(alpha),
          // Left: 3-node DAG outcomes
          glowArrow(-620, 82, -360, 82, ROLE.fail, { width: 3.5, dash: [8, 6], alpha }),
          actorOrb(-700, -148, 66, fs >= 1 ? ROLE.ok : ROLE.workerA, 'docs', 'done', { alpha }),
          actorOrb(
            -700,
            82,
            66,
            fs >= 1 ? ROLE.fail : ROLE.warn,
            'test',
            fs >= 1 ? 'FAILED' : 'running',
            {
              alpha,
              active: fs === 1,
            },
          ),
          actorOrb(
            -270,
            82,
            72,
            fs >= 2 ? ROLE.warn : COSMOS.dim,
            'deploy',
            fs >= 2 ? 'BLOCKED' : 'rem: 1',
            {
              alpha,
              active: fs === 2,
            },
          ),

          line([-110, -220], [-110, 210], { stroke: '#29375a', width: 2 }).opacity(alpha),

          // Right: Explicit disposition taxonomy
          glowPill('FAILED: ran & exhausted attempts', 385, -140, ROLE.fail, {
            size: 26,
            fixedW: 790,
            alpha: fs >= 1 ? alpha : 0.55 * alpha,
            glow: fs === 1 ? 12 : 5,
          }),
          glowPill('BLOCKED: never became eligible (rem > 0)', 385, -25, ROLE.warn, {
            size: 26,
            fixedW: 790,
            alpha: fs >= 2 ? alpha : 0.55 * alpha,
            glow: fs === 2 ? 12 : 5,
          }),
          glowPill('LIFECYCLE: explicit shutdown & exception capture', 385, 90, ROLE.record, {
            size: 26,
            fixedW: 790,
            alpha: fs >= 3 ? alpha : 0.55 * alpha,
            glow: fs === 3 ? 12 : 5,
          }),
          glowPill('NOTE: article base scheduler is sequential', 385, 205, ROLE.workerB, {
            size: 26,
            fixedW: 790,
            alpha: fs >= 4 ? alpha : 0.5 * alpha,
            glow: fs >= 4 ? 11 : 0,
          }),

          txt(
            'Keep failed and blocked separate when deciding whether to repair, retry, or skip.',
            0,
            345,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'CLAIM UNDER LOCK  ·  RUN OUTSIDE  ·  PUBLISH UNDER LOCK',
          st === 1
            ? 'FAILED != BLOCKED  ·  BASE CODE SEQUENTIAL'
            : 'RECHECK PREDICATE AFTER NOTIFY',
          { accent: st === 1 ? ROLE.fail : ROLE.ok, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.ok, ROLE.workerA), title, layer);

  // Beat 0: Concurrent handoff
  playCue(s, c, 'ci-scheduler-workers-0-build', () => s.play(stage.to(0, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'workers-claim', () => s.play(handoff.to(1, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'workers-run', () => s.play(handoff.to(2, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'workers-publish-outcome', () => s.play(handoff.to(3, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'ci-scheduler-workers-publish', () => s.play(handoff.to(3, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'workers-release', () => s.play(handoff.to(4, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'workers-notify', () => s.play(handoff.to(5, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'workers-recheck', () => s.play(handoff.to(6, { duration: 0.05 })), {
    dur: 0.1,
  });

  // Beat 1: Failed vs blocked & lifecycle
  playCue(
    s,
    c,
    'ci-scheduler-workers-1-build',
    () => s.play(stage.to(1, { duration: 0.05 }), failStep.to(0, { duration: 0.05 })),
    { dur: 0.1 },
  );
  playCue(s, c, 'workers-failed', () => s.play(failStep.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'workers-blocked', () => s.play(failStep.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'workers-lifecycle', () => s.play(failStep.to(3, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'workers-sequential', () => s.play(failStep.to(4, { duration: 0.05 })), {
    dur: 0.1,
  });
}
