// Scene 10: cas-boundary - "Two writers at the deadline"
// Stage 0: Untimed AtomicStore compare-and-set calls (True -> False -> True).
// Stage 1: Split-lock race at TTL = 15s (strict prediction hold: whose write disappears?) -> B's write lost!
// Stage 2: Atomic single-lock replay -> A cleans, compares, writes ready (True); B sees ready (False).
// Stage 3: Snapshot isolation -> live key mutates to running while snapshot stays ready.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowCross,
  glowPill,
  guardedDynamic,
  hexAlpha,
  lowerFooter,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function casBoundary(s, c) {
  const title = sceneHeading(['Two writers at', 'the deadline'], { accent: ROLE.focus });

  const stage = s.value(0); // 0=untimed CAS, 1=split-lock race, 2=atomic replay, 3=snapshot isolation
  const casStep = s.value(0); // 0..3
  const raceStep = s.value(0); // 0=reset, 1=A cleans, 2=gap, 3=B writes queued, 4=question, 5=A overwrites ready!
  const atomStep = s.value(0); // 0=replay reset, 1=A cleans, 2=A writes ready, 3=B denied
  const snapLive = s.value(0); // 0=ready, 1=running

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const st = Math.round(stage.value);
      const nodes = [];

      if (st === 0) {
        const cs = Math.round(casStep.value);
        nodes.push(
          txt(
            'ATOMICSTORE  ·  COMPARE-AND-SET (NO EXPIRY)',
            0,
            -278,
            26,
            ROLE.workerB,
            'mono',
            'center',
          ).opacity(alpha),
          txt('CALL', -660, -188, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          txt('EXPECTED', -340, -188, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          txt('REPLACEMENT', 60, -188, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          txt('RETURNED', 540, -188, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          line([-820, -152], [820, -152], { stroke: '#2c3a5e', width: 2 }).opacity(alpha),
        );

        const rows = [
          { y: -80, n: 'Call 1', exp: 'None', rep: '"running"', ok: true, show: cs >= 1 },
          { y: 35, n: 'Call 2', exp: 'None', rep: '"ready"', ok: false, show: cs >= 2 },
          { y: 150, n: 'Call 3', exp: '"running"', rep: '"ready"', ok: true, show: cs >= 3 },
        ];
        rows.forEach((r) => {
          nodes.push(
            txt(r.n, -660, r.y, 27, COSMOS.ink, 'mono', 'center').opacity(alpha),
            glowPill(r.exp, -340, r.y, ROLE.workerA, { size: 26, fixedW: 250, alpha }),
            glowPill(r.rep, 60, r.y, ROLE.workerB, { size: 26, fixedW: 260, alpha }),
            glowPill(
              r.show ? (r.ok ? 'True' : 'False') : '...',
              540,
              r.y,
              r.show ? (r.ok ? ROLE.ok : ROLE.fail) : COSMOS.dim,
              {
                size: 27,
                fixedW: 230,
                alpha: r.show ? alpha : 0.5 * alpha,
                glow: r.show ? 11 : 0,
              },
            ),
          );
        });

        const liveVal = cs >= 3 ? '"ready"' : cs >= 1 ? '"running"' : 'None';
        nodes.push(
          glowPill(`stored value:  task:1 = ${liveVal}`, 0, 290, ROLE.focus, {
            size: 28,
            fixedW: 640,
            alpha,
          }),
        );
      } else if (st === 1) {
        const rs = Math.round(raceStep.value);
        nodes.push(
          txt(
            'SPLIT-LOCK RACE AT t = 15.000 s  ·  BOTH WRITERS EXPECT None',
            0,
            -280,
            26,
            ROLE.warn,
            'mono',
            'center',
          ).opacity(alpha),
        );

        // Writer A & Writer B lanes
        const aSaw = rs >= 1 ? 'missing' : '...';
        const aRet = rs >= 5 ? 'True (STALE!)' : rs >= 2 ? 'waiting (lock dropped)' : '...';
        const bSaw = rs >= 3 ? 'missing' : '...';
        const bRet = rs >= 3 ? 'True' : '...';

        nodes.push(
          glowPill('Writer A  ->  wants "ready"', -515, -155, ROLE.workerA, {
            size: 26,
            fixedW: 520,
            alpha,
          }),
          glowPill(`saw: ${aSaw}`, -20, -155, rs >= 1 ? ROLE.focus : COSMOS.dim, {
            size: 26,
            fixedW: 320,
            alpha: rs >= 1 ? alpha : 0.5 * alpha,
          }),
          glowPill(aRet, 485, -155, rs >= 5 ? ROLE.fail : rs >= 2 ? ROLE.warn : COSMOS.dim, {
            size: 26,
            fixedW: 480,
            alpha: rs >= 2 ? alpha : 0.5 * alpha,
            glow: rs >= 5 ? 13 : 5,
          }),

          glowPill('Writer B  ->  wants "queued"', -515, -35, ROLE.workerB, {
            size: 26,
            fixedW: 520,
            alpha,
          }),
          glowPill(`saw: ${bSaw}`, -20, -35, rs >= 3 ? ROLE.focus : COSMOS.dim, {
            size: 26,
            fixedW: 320,
            alpha: rs >= 3 ? alpha : 0.5 * alpha,
          }),
          glowPill(`returned: ${bRet}`, 485, -35, rs >= 3 ? ROLE.ok : COSMOS.dim, {
            size: 26,
            fixedW: 480,
            alpha: rs >= 3 ? alpha : 0.5 * alpha,
            glow: rs >= 3 ? 10 : 0,
          }),
        );

        // Live record bar at y = 130
        const recStr =
          rs >= 5
            ? 'task:1  =  "ready"  |  permanent   (B\'s "queued" OVERWRITTEN!)'
            : rs >= 3
              ? 'task:1  =  "queued"  |  permanent'
              : rs >= 1
                ? 'task:1  =  missing  (expired row removed)'
                : 'task:1  =  "running"  |  expires at 15.000 s';
        const recCol =
          rs >= 5 ? ROLE.fail : rs >= 3 ? ROLE.workerB : rs >= 1 ? ROLE.focus : ROLE.warn;
        nodes.push(
          txt('LIVE RECORD IN STORE', 0, 68, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          glowPill(recStr, 0, 140, recCol, { size: 28, fixedW: 1120, alpha, glow: 11 }),
        );
        if (rs >= 5) {
          nodes.push(glowCross(-600, 140, 30, ROLE.fail, alpha));
        }

        // Bottom prompt / verdict
        const capY = 315;
        if (rs === 4) {
          nodes.push(
            txt(
              'A acts on its stale comparison. Whose successful write will disappear?',
              0,
              capY,
              30,
              ROLE.focus,
              'serif',
              'center',
            )
              .glow(7, ROLE.focus)
              .opacity(alpha),
          );
        } else if (rs >= 5) {
          nodes.push(
            txt(
              "B's write disappears! Both writers returned True because the lock split check from write.",
              0,
              capY,
              28,
              ROLE.fail,
              'sans',
              'center',
            ).opacity(alpha),
          );
        } else {
          nodes.push(
            txt(
              rs >= 2
                ? 'Lock dropped after cleanup: B slips in and writes "queued".'
                : 'Clock frozen at 15.000 s. Both A and B try compare_and_set(None, ...).',
              0,
              capY,
              27,
              COSMOS.muted,
              'sans',
              'center',
            ).opacity(alpha),
          );
        }
      } else if (st === 2) {
        // Stage 2: Atomic single-lock replay
        const as = Math.round(atomStep.value);
        nodes.push(
          txt(
            'ATOMIC REPLAY: ONE LOCK WRAPS CLEANUP + COMPARE + WRITE',
            0,
            -280,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).opacity(alpha),
          glowPill('Writer A  (holds single lock)', -515, -145, ROLE.workerA, {
            size: 26,
            fixedW: 520,
            alpha,
            glow: as < 3 ? 12 : 5,
          }),
          glowPill(as >= 1 ? 'saw: missing' : 'entering lock...', -20, -145, ROLE.focus, {
            size: 26,
            fixedW: 320,
            alpha,
          }),
          glowPill(
            as >= 2 ? 'returned: True' : 'writing...',
            485,
            -145,
            as >= 2 ? ROLE.ok : COSMOS.dim,
            {
              size: 26,
              fixedW: 440,
              alpha: as >= 2 ? alpha : 0.55 * alpha,
              glow: as >= 2 ? 11 : 0,
            },
          ),

          glowPill('Writer B  (enters after A)', -515, -20, ROLE.workerB, {
            size: 26,
            fixedW: 520,
            alpha,
          }),
          glowPill(
            as >= 3 ? 'saw: "ready"' : 'waiting on lock',
            -20,
            -20,
            as >= 3 ? ROLE.ok : COSMOS.dim,
            {
              size: 26,
              fixedW: 320,
              alpha: as >= 3 ? alpha : 0.55 * alpha,
            },
          ),
          glowPill(
            as >= 3 ? 'returned: False' : '...',
            485,
            -20,
            as >= 3 ? ROLE.fail : COSMOS.dim,
            {
              size: 26,
              fixedW: 440,
              alpha: as >= 3 ? alpha : 0.55 * alpha,
              glow: as >= 3 ? 11 : 0,
            },
          ),

          txt('LIVE RECORD IN STORE', 0, 82, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          glowPill(
            as >= 2
              ? 'task:1  =  "ready"  |  permanent  (1 winner)'
              : as >= 1
                ? 'task:1  =  missing  (cleaned inside lock)'
                : 'task:1  =  "running"  |  expires at 15.000 s',
            0,
            152,
            as >= 2 ? ROLE.ok : ROLE.focus,
            { size: 28, fixedW: 960, alpha, glow: 10 },
          ),

          txt(
            'Use internal unlocked helpers or RLock if public methods also acquire the lock.',
            0,
            315,
            27,
            ROLE.ok,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Stage 3: Snapshot isolation
        const mutated = snapLive.value > 0.5;
        nodes.push(
          txt(
            'SNAPSHOT ISOLATION ACROSS LATER WRITES',
            0,
            -275,
            26,
            ROLE.record,
            'mono',
            'center',
          ).opacity(alpha),
          // Two parallel immutable vs live tracks
          txt('TAKEN SNAPSHOT', -450, -130, 26, ROLE.record, 'mono', 'center').opacity(alpha),
          glowPill('snapshot["task:1"]  =  "ready"', -450, -45, ROLE.record, {
            size: 28,
            fixedW: 660,
            alpha,
            glow: 11,
          }),
          txt('unchanged by later writes', -450, 35, 26, ROLE.ok, 'mono', 'center').opacity(alpha),

          line([0, -160], [0, 120], { stroke: hexAlpha('#2d3c61', 0.8 * alpha), width: 2.5 }),

          txt('LIVE STORE', 450, -130, 26, ROLE.workerB, 'mono', 'center').opacity(alpha),
          glowPill(
            mutated ? 'live["task:1"]  =  "running"' : 'live["task:1"]  =  "ready"',
            450,
            -45,
            mutated ? ROLE.focus : ROLE.workerB,
            { size: 28, fixedW: 660, alpha, glow: mutated ? 12 : 7 },
          ),
          txt(
            mutated ? 'writer updated live key' : 'matching snapshot at creation',
            450,
            35,
            26,
            mutated ? ROLE.focus : COSMOS.muted,
            'mono',
            'center',
          ).opacity(alpha),

          glowPill(
            'Strings: synchronized copy  ·  Mutable values: deep isolation / COW',
            0,
            195,
            ROLE.record,
            {
              size: 26,
              fixedW: 1180,
              alpha,
            },
          ),
          txt(
            'Versioned records or copy-on-write preserve the exact snapshot view.',
            0,
            325,
            27,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'COMPARE-AND-SET + EXPIRY BOUNDARY',
          st === 3
            ? 'SNAPSHOT STAYS "ready" WHILE LIVE MOVES'
            : st === 2
              ? 'ONE LOCK -> ONE WINNER'
              : st === 1 && raceStep.value >= 4.5
                ? 'SPLIT LOCK LOST WRITER B'
                : 'CLEANUP + COMPARE + WRITE ATOMICALLY',
          { accent: st === 2 ? ROLE.ok : st === 3 ? ROLE.record : ROLE.focus, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.focus, ROLE.record), title, layer);

  // Beat 0: Untimed CAS
  playCue(s, c, 'cas-first', () => s.play(casStep.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'cas-repeat', () => s.play(casStep.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'cas-third', () => s.play(casStep.to(3, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  // Beat 1-3: Split-lock race (strict withholding of A's stale overwrite until after 'cas-stale'!)
  playCue(
    s,
    c,
    'cas-reset',
    () => s.play(stage.to(1, { duration: 0.05 }), raceStep.to(0, { duration: 0.05 })),
    { dur: 0.1 },
  );
  playCue(s, c, 'cas-clean', () => s.play(raceStep.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'cas-gap', () => s.play(raceStep.to(2, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'cas-b-write', () => s.play(raceStep.to(3, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'cas-question', () => s.play(raceStep.to(4, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'cas-stale', () => s.play(raceStep.to(5, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  // Beat 4: Atomic single-lock replay
  playCue(
    s,
    c,
    'cas-replay',
    () => s.play(stage.to(2, { duration: 0.05 }), atomStep.to(0, { duration: 0.05 })),
    { dur: 0.1 },
  );
  playCue(s, c, 'cas-atomic-clean', () => s.play(atomStep.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'cas-atomic-write', () => s.play(atomStep.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'cas-deny', () => s.play(atomStep.to(3, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  // Beat 5: Snapshot isolation
  playCue(
    s,
    c,
    'cas-snapshot',
    () => s.play(stage.to(3, { duration: 0.05 }), snapLive.to(0, { duration: 0.05 })),
    { dur: 0.1 },
  );
  playCue(s, c, 'cas-later', () => s.play(snapLive.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
}
