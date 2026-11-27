// Scene 11: scheduler - "Does deploy get a turn?"
// Glowing dependency constellation (docs, test -> deploy) + live priority/attempt telemetry
// contrasting max_attempts = 2 (retry succeeds, deploy runs) vs max_attempts = 1 (test failed, deploy blocked),
// with strict prediction withholding on Beat 0!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SCHEDULE_BLOCKED,
  SCHEDULE_RETRY,
  actorOrb,
  cinemaAtmosphere,
  glowArrow,
  glowPill,
  guardedDynamic,
  lowerFooter,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function scheduler(s, c) {
  const title = sceneHeading(['Does deploy get a turn?'], { accent: ROLE.ok });

  // Discrete step 0..10:
  // Run A (cap = 2): 0=init, 1=docs done, 2=test false (retry avail), 3=question,
  //   4=test back in heap, 5=test succeeds (attempt 2), 6=deploy remaining->0 ready, 7=deploy done
  // Run B (cap = 1): 8=reset cap=1, 9=docs done, 10=test failed (1/1), 11=deploy blocked!
  const step = s.value(0);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const st = Math.round(step.value);
      const isCap1 = st >= 8;
      const cap = isCap1 ? 1 : 2;

      // Derive exact task state from discrete step (100% consistent with SCHEDULE_RETRY / SCHEDULE_BLOCKED)
      const docsState = st === 0 || st === 8 ? 'ready' : 'done';
      const docsAtt = docsState === 'done' ? 1 : 0;

      const testState =
        st <= 1 || st === 8 || st === 9
          ? 'ready'
          : st === 2 || st === 3
            ? 'retry avail'
            : st === 4
              ? 'ready (retry)'
              : st >= 5 && st <= 7
                ? 'done'
                : 'failed';
      const testAtt = st <= 1 || st === 8 || st === 9 ? 0 : st >= 5 && st <= 7 ? 2 : 1;

      const depRem = st === 6 || st === 7 ? 0 : 1;
      const depState =
        st <= 5 || st === 8 || st === 9 || st === 10
          ? 'waiting'
          : st === 6
            ? 'ready'
            : st === 7
              ? 'done'
              : 'blocked';
      const depAtt = st === 7 ? 1 : 0;

      const execList =
        st === 0 || st === 8
          ? []
          : st === 1 || st === 9
            ? ['docs']
            : st >= 2 && st <= 4
              ? ['docs', 'test']
              : st === 5 || st === 6
                ? ['docs', 'test', 'test']
                : st === 7
                  ? SCHEDULE_RETRY.executed
                  : SCHEDULE_BLOCKED.executed;

      const colOf = (v) =>
        v === 'done'
          ? ROLE.ok
          : v === 'failed' || v === 'blocked'
            ? ROLE.fail
            : v.startsWith('retry')
              ? ROLE.warn
              : v === 'ready'
                ? ROLE.workerB
                : COSMOS.muted;

      const nodes = [
        // Attempt cap badge top-right
        glowPill(`Attempt cap = ${cap}`, 655, -420, isCap1 ? ROLE.fail : ROLE.focus, {
          size: 29,
          fixedW: 360,
          alpha,
          glow: 10,
        }),

        // Left: Glowing 3-node DAG constellation
        txt('DEPENDENCY GRAPH', -535, -280, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        glowArrow(-620, 62, -405, 62, depRem === 0 ? ROLE.ok : ROLE.warn, {
          width: 4,
          alpha,
          glow: depRem === 0 ? 11 : 6,
        }),
        actorOrb(-715, -148, 66, colOf(docsState), 'docs', `p=1 · ${docsState}`, {
          alpha,
          active: st === 1 || st === 9,
        }),
        actorOrb(-715, 62, 66, colOf(testState), 'test', `p=2 · ${testState}`, {
          alpha,
          active: st === 2 || st === 4 || st === 5 || st === 10,
        }),
        actorOrb(-310, 62, 72, colOf(depState), 'deploy', `unmet: ${depRem}`, {
          alpha,
          active: st === 6 || st === 7 || st === 11,
        }),

        // Vertical hairline
        line([-160, -255], [-160, 195], { stroke: '#29375a', width: 2 }).opacity(alpha),

        // Right: Live Priority / Attempts / State rows
        txt('TASK', -70, -265, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt('PRI', 95, -265, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt('UNMET', 250, -265, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt('TRIES', 415, -265, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt('STATE', 680, -265, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        line([-135, -230], [855, -230], { stroke: '#2c3a5e', width: 2 }).opacity(alpha),
      ];

      const rows = [
        { y: -145, name: 'docs', pri: 1, rem: 0, att: docsAtt, state: docsState },
        { y: -25, name: 'test', pri: 2, rem: 0, att: testAtt, state: testState },
        { y: 95, name: 'deploy', pri: 3, rem: depRem, att: depAtt, state: depState },
      ];
      rows.forEach((r) => {
        const cRow = colOf(r.state);
        nodes.push(
          txt(r.name, -70, r.y, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
          txt(String(r.pri), 95, r.y, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
          txt(
            String(r.rem),
            250,
            r.y,
            28,
            r.rem > 0 ? ROLE.warn : ROLE.ok,
            'mono',
            'center',
          ).opacity(alpha),
          txt(`${r.att}/${cap}`, 415, r.y, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
          glowPill(r.state, 680, r.y, cRow, {
            size: 26,
            fixedW: 290,
            alpha,
            glow: cRow === COSMOS.muted ? 0 : 9,
          }),
        );
      });

      // Executed call tape (y = 258)
      const callStr = execList.length ? execList.join('  ->  ') : '[]';
      nodes.push(
        glowPill(`Calls to run:   ${callStr}`, 0, 258, ROLE.workerB, {
          size: 28,
          fixedW: 1120,
          alpha,
          glow: 7,
        }),
      );

      // Bottom prompt / verdict
      const capY = 345;
      if (st === 3) {
        nodes.push(
          txt(
            'test returned False with 2 attempts allowed. Should deploy enter the ready heap yet?',
            0,
            capY,
            29,
            ROLE.focus,
            'serif',
            'center',
          )
            .glow(7, ROLE.focus)
            .opacity(alpha),
        );
      } else if (st >= 11) {
        nodes.push(
          txt(
            'Report test as FAILED and deploy as BLOCKED. Fix the prerequisite first.',
            0,
            capY,
            28,
            ROLE.fail,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else if (st === 7) {
        nodes.push(
          txt(
            "Only test's success drops deploy's unmet count from 1 to 0, releasing it to run.",
            0,
            capY,
            28,
            ROLE.ok,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        nodes.push(
          txt(
            'Lowest priority number runs first; a retry keeps its original priority.',
            0,
            capY,
            27,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'PRIORITY MIN-HEAP + DEPENDENCY COUNT',
          st >= 11
            ? 'CAP 1: test FAILED  ·  deploy BLOCKED'
            : st === 7
              ? 'CAP 2: docs -> test -> test -> deploy'
              : `ATTEMPT CAP = ${cap}`,
          { accent: st >= 11 ? ROLE.fail : ROLE.ok, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.ok, ROLE.fail), title, layer);

  // Beat 0: cap = 2, docs runs, test fails once -> PREDICTION HOLD!
  playCue(s, c, 'sched-docs', () => s.play(step.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'sched-false', () => s.play(step.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'sched-question', () => s.play(step.to(3, { duration: 0.05 })), { dur: 0.1 });

  // Beat 1: retry succeeds -> release deploy -> deploy completes
  playCue(s, c, 'sched-retry', () => s.play(step.to(4, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'sched-success', () => s.play(step.to(5, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'sched-release', () => s.play(step.to(6, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'sched-deploy', () => s.play(step.to(7, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  // Beat 2: reset with cap = 1 -> docs done -> test failed -> deploy blocked
  playCue(s, c, 'sched-reset', () => s.play(step.to(8, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'sched-docs-again', () => s.play(step.to(9, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'sched-last', () => s.play(step.to(10, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'sched-blocked', () => s.play(step.to(11, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
}
