// Scene 22: fresh-worker-plan - "Which page goes into the queue first?"
// Capstone transfer scene with TWO strict prediction holds:
// Stage 0 (Beats 0-1): Serial vs overlapped schedule (4s wait + 1s CPU, 1 CPU lane) ->
//          strictly withholds 10 s until 'plan-serial' and 6 s until 'plan-finish'!
// Stage 1 (Beats 2-3): Parent-ordered frontier merge for /setup and /cli ->
//          strictly withholds /help, /help?v=2, /tips until their respective spoken reveals!
// Stage 2 (Beats 3-4): Order-independence test table proving both [/cli, /setup] and [/setup, /cli]
//          produce identical queue ['/help', '/help?v=2', '/tips']!
import { line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  ambientClock,
  cinemaAtmosphere,
  glowDot,
  glowPill,
  guardedDynamic,
  hexAlpha,
  lowerFooter,
  mixedWorkSchedule,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';
import { bufferedFrontier, drawFrontierMerge } from '../frontier-merge.mjs';

const PARENTS = [
  { path: '/setup', links: ['/help#top', '/help?v=2'] },
  { path: '/cli', links: ['/help#end', '/tips'] },
];

export default function freshWorkerPlan(s, c) {
  const title = sceneHeading(['Which page goes into', 'the queue first?'], {
    accent: ROLE.focus,
  });

  const amb = ambientClock(s, c);
  const stage = s.value(0); // 0=timing transfer, 1=frontier merge transfer, 2=order-independence test

  // Stage 0 timing states (strict withholding!)
  const budgetLit = s.value(0);
  const askTiming = s.value(0);
  const serialProg = s.value(0); // 0 -> 1 (STRICTLY AFTER 'plan-serial'!)
  const waitProg = s.value(0); // 0 -> 1 (overlapped 0..4s)
  const cliCpu = s.value(0); // 0 -> 1 (4..5s)
  const setupCpu = s.value(0); // 0 -> 1 (5..6s)
  const finishShown = s.value(0); // 0 -> 1 (STRICTLY AFTER 'plan-finish'!)

  // Stage 1 frontier merge states (strict withholding!)
  const mergeStep = s.value(0); // 0=CLI arrives, 1=setup arrives, 2=PREDICTION HOLD, 3=/help, 4=/help?v=2, 5=skip dupe, 6=/tips

  // Stage 2 verification table
  const testStep = s.value(0); // 0=table empty, 1=CLI first True, 2=setup first True, 3=owner note, 4=front spotlight

  const wait = 4;
  const cpu = 1;
  const plan = mixedWorkSchedule({ jobs: 2, wait, cpu });
  const cliFirst = bufferedFrontier(PARENTS, [1, 0]);
  const setupFirst = bufferedFrontier(PARENTS, [0, 1]);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const st = Math.round(stage.value);
      const nodes = [];

      if (st === 0) {
        const x0 = -640;
        const x1 = 760;
        const xOf = (sec) => x0 + ((x1 - x0) * sec) / plan.serial;
        const ySer = -140;
        const yW1 = -10;
        const yW2 = 75;
        const yCpu = 160;
        const axisY = 225;

        const show10 = serialProg.value > 0.5;
        const show6 = finishShown.value > 0.5;

        nodes.push(
          glowPill(
            'Per page: 4 s wait + 1 s Python CPU  ·  1 CPU lane  ·  zero overhead',
            0,
            -278,
            budgetLit.value > 0.5 ? ROLE.focus : ROLE.workerB,
            { size: 27, fixedW: 1180, alpha, glow: budgetLit.value > 0.5 ? 11 : 6 },
          ),

          txt('SERIAL', -820, ySer, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
          txt('setup wait', -820, yW1, 26, ROLE.workerA, 'mono', 'left').opacity(alpha),
          txt('CLI wait', -820, yW2, 26, ROLE.workerB, 'mono', 'left').opacity(alpha),
          txt('CPU lane', -820, yCpu, 26, ROLE.focus, 'mono', 'left').opacity(alpha),

          line([x0, axisY], [x1, axisY], { stroke: '#3a4d78', width: 3.5 }).opacity(alpha),
        );

        for (let sec = 0; sec <= 10; sec += 2) {
          const tx = xOf(sec);
          nodes.push(
            line([tx, axisY], [tx, axisY + 12], { stroke: COSMOS.muted, width: 2.2 }).opacity(
              alpha,
            ),
            txt(`${sec}s`, tx, axisY + 38, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          );
        }

        // Serial bars (strictly hidden until plan-serial!)
        if (show10) {
          const segs = [
            { s: 0, e: 4, lbl: 'setup wait', col: ROLE.workerA },
            { s: 4, e: 5, lbl: 'CPU', col: ROLE.workerA },
            { s: 5, e: 9, lbl: 'CLI wait', col: ROLE.workerB },
            { s: 9, e: 10, lbl: 'CPU', col: ROLE.workerB },
          ];
          segs.forEach((seg) => {
            const sx = xOf(seg.s);
            const sw = xOf(seg.e) - sx;
            nodes.push(
              rect(sw - 4, 44, {
                radius: 8,
                fill: hexAlpha(seg.col, 0.3 * alpha),
                stroke: seg.col,
                width: 2.4,
              }).at(sx + sw / 2, ySer),
              txt(seg.lbl, sx + sw / 2, ySer, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
            );
          });
        } else {
          nodes.push(
            line([x0, ySer], [x1, ySer], { stroke: '#253352', width: 3, dash: [8, 8] }).opacity(
              alpha,
            ),
          );
        }

        // Overlapped wait bars [0..4s]
        if (waitProg.value > 0.05) {
          const ww = (xOf(4) - x0) * waitProg.value;
          nodes.push(
            rect(ww, 40, {
              radius: 8,
              fill: hexAlpha(ROLE.workerA, 0.28 * alpha),
              stroke: ROLE.workerA,
              width: 2.4,
            }).at(x0 + ww / 2, yW1),
            rect(ww, 40, {
              radius: 8,
              fill: hexAlpha(ROLE.workerB, 0.28 * alpha),
              stroke: ROLE.workerB,
              width: 2.4,
            }).at(x0 + ww / 2, yW2),
          );
          if (ww > 180) {
            nodes.push(
              txt('wait 4 s', x0 + ww / 2, yW1, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
              txt('wait 4 s', x0 + ww / 2, yW2, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
            );
          }
        }

        // Overlapped CPU turns: CLI [4..5s], setup [5..6s]
        if (cliCpu.value > 0.05) {
          const cw = (xOf(5) - xOf(4)) * cliCpu.value;
          nodes.push(
            rect(cw, 40, {
              radius: 8,
              fill: hexAlpha(ROLE.workerB, 0.42 * alpha),
              stroke: ROLE.workerB,
              width: 2.5,
            })
              .at(xOf(4) + cw / 2, yCpu)
              .glow(8, ROLE.workerB),
          );
          if (cw > 70) {
            nodes.push(
              txt('CLI', xOf(4) + cw / 2, yCpu, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
            );
          }
        }
        if (setupCpu.value > 0.05) {
          const sw = (xOf(6) - xOf(5)) * setupCpu.value;
          nodes.push(
            rect(sw, 40, {
              radius: 8,
              fill: hexAlpha(ROLE.workerA, 0.42 * alpha),
              stroke: ROLE.workerA,
              width: 2.5,
            })
              .at(xOf(5) + sw / 2, yCpu)
              .glow(8, ROLE.workerA),
          );
          if (sw > 85) {
            nodes.push(
              txt('setup', xOf(5) + sw / 2, yCpu, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
            );
          }
        }

        // Strict prediction readout at bottom (y = 335)
        const capY = 342;
        if (show6) {
          nodes.push(
            glowPill(
              `Serial:  ${plan.serial} s     |     Overlapped:  ${plan.overlapped} s`,
              0,
              capY,
              ROLE.ok,
              { size: 30, fixedW: 840, alpha, glow: 12 },
            ),
          );
        } else if (show10) {
          nodes.push(
            glowPill(`Serial:  ${plan.serial} s     |     Overlapped:  ?`, 0, capY, ROLE.focus, {
              size: 30,
              fixedW: 840,
              alpha,
              glow: 10,
            }),
          );
        } else if (askTiming.value > 0.5) {
          nodes.push(
            txt(
              'How long for both pages in series? How long if both waits start together?',
              0,
              capY,
              30,
              ROLE.focus,
              'serif',
              'center',
            )
              .glow(7, ROLE.focus)
              .opacity(alpha * (0.82 + 0.18 * pulse)),
          );
        } else {
          nodes.push(
            txt(
              'Count just the 4-second waits and 1-second Python link extraction.',
              0,
              capY,
              27,
              COSMOS.muted,
              'sans',
              'center',
            ).opacity(alpha),
          );
        }
      } else if (st === 1) {
        // Stage 1: Parent-ordered frontier merge (strict prediction withholding on 3 queue slots!)
        const ms = Math.round(mergeStep.value);
        const qSlots = [
          ms >= 3 ? { path: cliFirst.queue[0].path, color: ROLE.workerA } : null,
          ms >= 4 ? { path: cliFirst.queue[1].path, color: ROLE.workerA } : null,
          ms >= 6 ? { path: cliFirst.queue[2].path, color: ROLE.workerB } : null,
        ];
        nodes.push(
          ...drawFrontierMerge({
            parents: PARENTS,
            alpha,
            showRow1: true,
            showRow0: ms >= 1,
            row0States: [ms >= 3 ? 'claimed' : 'raw', ms >= 4 ? 'claimed' : 'raw'],
            row1States: [ms >= 5 ? 'skip' : 'raw', ms >= 6 ? 'claimed' : 'raw'],
            queueSlots: qSlots,
            cursorParent: ms >= 5 ? 1 : ms >= 3 ? 0 : -1,
            highlightSlot: ms >= 6 ? 0 : -1,
            modeLabel: 'CLI FINISHED FIRST  ·  SETUP WAS FIRST IN PARENT ORDER',
          }),
        );

        const capY = 335;
        if (ms === 2) {
          nodes.push(
            txt(
              'Both results carry parent IDs. What are the next three queue entries, in order?',
              0,
              capY,
              30,
              ROLE.focus,
              'serif',
              'center',
            )
              .glow(7, ROLE.focus)
              .opacity(alpha * (0.82 + 0.18 * pulse)),
          );
        } else if (ms >= 6) {
          nodes.push(
            txt(
              'Next frontier: /help, then /help?v=2 (distinct query), then /tips.',
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
              ms >= 3
                ? 'Coordinator walks parent 1 (/setup) before parent 2 (/cli), skipping duplicate /help.'
                : 'Buffer both raw lists by parent ID before admitting any child.',
              0,
              capY,
              27,
              COSMOS.muted,
              'sans',
              'center',
            ).opacity(alpha),
          );
        }
      } else {
        // Stage 2: Order-independence verification test + final front-slot takeaway
        const ts = Math.round(testStep.value);
        const expected = ['/help', '/help?v=2', '/tips'];
        const ok1 = cliFirst.queue.map((x) => x.path).join(' ') === expected.join(' ');
        const ok2 = setupFirst.queue.map((x) => x.path).join(' ') === expected.join(' ');

        nodes.push(
          txt(
            'ORDER-INDEPENDENCE REGRESSION CHECK',
            0,
            -278,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).opacity(alpha),

          // Left: Verification runs
          txt('CALLBACK RETURN ORDER', -430, -175, 26, COSMOS.muted, 'mono', 'center').opacity(
            alpha,
          ),
          txt('QUEUE == EXPECTED', 30, -175, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          line([-760, -140], [210, -140], { stroke: '#2c3a5e', width: 2 }).opacity(alpha),

          glowPill('Run 1:  /cli returns before /setup', -430, -60, ROLE.workerB, {
            size: 26,
            fixedW: 620,
            alpha: ts >= 1 ? alpha : 0.45 * alpha,
          }),
          glowPill(
            ts >= 1 ? (ok1 ? 'True (MATCH)' : 'False') : '...',
            30,
            -60,
            ts >= 1 ? ROLE.ok : COSMOS.dim,
            {
              size: 27,
              fixedW: 280,
              alpha: ts >= 1 ? alpha : 0.45 * alpha,
              glow: ts >= 1 ? 11 : 0,
            },
          ),

          glowPill('Run 2:  /setup returns before /cli', -430, 65, ROLE.workerA, {
            size: 26,
            fixedW: 620,
            alpha: ts >= 2 ? alpha : 0.45 * alpha,
          }),
          glowPill(
            ts >= 2 ? (ok2 ? 'True (MATCH)' : 'False') : '...',
            30,
            65,
            ts >= 2 ? ROLE.ok : COSMOS.dim,
            {
              size: 27,
              fixedW: 280,
              alpha: ts >= 2 ? alpha : 0.45 * alpha,
              glow: ts >= 2 ? 11 : 0,
            },
          ),

          // Right: Expected immutable queue slots
          line([255, -200], [255, 195], { stroke: '#29375a', width: 2 }).opacity(alpha),
          txt('EXPECTED QUEUE', 565, -175, 26, ROLE.focus, 'mono', 'center').opacity(alpha),
          glowPill('1.  /help  (FRONT)', 565, -80, ts >= 4 ? ROLE.focus : ROLE.ok, {
            size: 28,
            fixedW: 430,
            alpha,
            glow: ts >= 4 ? 16 : 8,
          }),
          glowPill('2.  /help?v=2', 565, 25, ROLE.workerA, {
            size: 28,
            fixedW: 430,
            alpha,
          }),
          glowPill('3.  /tips', 565, 130, ROLE.workerB, {
            size: 28,
            fixedW: 430,
            alpha,
          }),

          glowPill(
            ts >= 3
              ? 'Parent ID + coordinator claim before fetch = deterministic FIFO frontier'
              : 'Keep expected queue fixed across both callback orders',
            0,
            255,
            ts >= 3 ? ROLE.focus : ROLE.workerB,
            { size: 26, fixedW: 1220, alpha, glow: ts >= 3 ? 11 : 5 },
          ),

          txt(
            'That single ownership boundary keeps /help in the front slot regardless of completion order.',
            0,
            352,
            27,
            ROLE.ok,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        glowDot(-855 + ((amb.value * 400) % 240), 422, {
          radius: 4.5 + 1.5 * pulse,
          color: ROLE.focus,
          glow: 8,
          opacity: 0.65 * alpha,
        }),
        lowerFooter(
          'CAPSTONE TRANSFER: TIMING + DETERMINISTIC FRONTIER',
          st === 2
            ? 'BOTH ORDERS -> /help, /help?v=2, /tips'
            : st === 1
              ? 'PARENT ORDER OWNS ADMISSION'
              : finishShown.value > 0.5
                ? '10 s SERIAL  ·  6 s OVERLAPPED'
                : '4 s WAIT + 1 s CPU PER PAGE',
          { accent: st === 2 ? ROLE.ok : ROLE.focus, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.focus, ROLE.ok), title, layer);

  // Beat 0-1: Timing transfer (strict withholding!)
  playCue(s, c, 'plan-budget', (d) => s.play(budgetLit.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'plan-question', () => s.play(askTiming.to(1, { duration: 0.05 })), { dur: 0.1 });
  // Reveal 10s ONLY AFTER 'plan-serial'!
  playCue(s, c, 'plan-serial', (d) => s.play(serialProg.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'plan-waits', (d) => s.play(waitProg.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'plan-cli', (d) => s.play(cliCpu.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'plan-setup', (d) => s.play(setupCpu.to(1, { duration: d })), { dur: 0.55 });
  // Reveal 6s ONLY AFTER 'plan-finish'!
  playCue(s, c, 'plan-finish', () => s.play(finishShown.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  // Beat 2-3: Frontier merge transfer (strict withholding!)
  playCue(
    s,
    c,
    'plan-slots',
    () => s.play(stage.to(1, { duration: 0.05 }), mergeStep.to(0, { duration: 0.05 })),
    { dur: 0.1 },
  );
  playCue(s, c, 'plan-list-cli', () => s.play(mergeStep.to(0, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'plan-list-setup', () => s.play(mergeStep.to(1, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'plan-merge-question', () => s.play(mergeStep.to(2, { duration: 0.05 })), {
    dur: 0.1,
  });

  // Strict reveals ONLY AFTER their spoken clauses!
  playCue(s, c, 'plan-help', () => s.play(mergeStep.to(3, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'plan-version', () => s.play(mergeStep.to(4, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'plan-dupe', () => s.play(mergeStep.to(5, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'plan-tips', () => s.play(mergeStep.to(6, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  // Beat 3-4: Verification table & final spotlight
  playCue(
    s,
    c,
    'plan-test',
    () => s.play(stage.to(2, { duration: 0.05 }), testStep.to(0, { duration: 0.05 })),
    { dur: 0.1 },
  );
  playCue(s, c, 'plan-first-test', () => s.play(testStep.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'plan-other-test', () => s.play(testStep.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'plan-owner', () => s.play(testStep.to(3, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'plan-front', () => s.play(testStep.to(4, { duration: 0.05 })), { dur: 0.1 });
}
