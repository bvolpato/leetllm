// Scene 12: playback-deadlines - Which stream can the reader follow?
// Signature 3-rail Playback Deadline Oscilloscope comparing Run A vs Run B against fixed
// reader deadlines [300, 380, 460, 540, 620] ms, stopping at T4 (540 ms) for viewer prediction,
// then exposing Run A's 100 ms slack, Run B's 40 ms stall (same 80 ms mean!), and Etalon reset.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  comparisonTokenTimes,
  dashedRule,
  fixedPlayback,
  glowDot,
  glowingTrail,
  guardedDynamic,
  spanBracket,
  timeAxisNodes,
  tokenTimes,
  txt,
} from '../parts.mjs';

export default function playbackDeadlines(s, c) {
  const tickProg = s.value(0.2); // T1..T5 gold reader ticks
  const clockMs = s.value(220); // 220 -> 540 (STOP!) -> 620
  const showGap = s.value(0); // strictly AFTER reader-gap
  const showSlack = s.value(0); // strictly AFTER reader-slack
  const showLate = s.value(0); // strictly AFTER reader-late
  const showMean = s.value(0); // strictly AFTER reader-mean
  const fixedGlow = s.value(0); // reader-fixed
  const resetProg = s.value(0); // strictly AFTER reader-reset

  const runA = fixedPlayback(tokenTimes);
  const runB = fixedPlayback(comparisonTokenTimes);
  const t4Due = runA.deadlines[3]; // 540
  const endDue = runA.deadlines[4]; // 620
  const period = 80;
  const etalonNext = runB.arrivals[3] + period; // 580 + 80 = 660

  const header = cinemaHeader(
    'FLUIDITY & PLAYBACK SLACK',
    'Which stream can',
    'the reader follow?',
    {
      x: -860,
      y: -435,
      accent: ROLE.deadline,
      size: 50,
    },
  );

  const stageAura = aura(150, 20, 680, '#ffd1661c', '#5ce1e61a');

  const oscView = guardedDynamic(
    () => 1,
    () => {
      const tp = tickProg.value;
      const now = clockMs.value;
      const sg = showGap.value;
      const ss = showSlack.value;
      const sl = showLate.value;
      const sm = showMean.value;
      const fg = fixedGlow.value;
      const rp = resetProg.value;

      const xLeft = -540;
      const xRight = 780;
      const minMs = 220;
      const maxMs = 680;
      const xOf = (ms) => xLeft + ((ms - minMs) / (maxMs - minMs)) * (xRight - xLeft);

      const yReader = -215;
      const yA = -25;
      const yB = 185;

      const nodes = [];

      // Live playback clock top-right
      nodes.push(
        txt('PLAYBACK CLOCK', 780, -395, 26, COSMOS.muted, 'mono', 'right'),
        txt(`${Math.round(now)} ms`, 780, -335, 50, COSMOS.ink, 'mono', 'right').glow(
          6,
          ROLE.focus,
        ),
      );

      // Rail 0: Gold Reader Deadlines
      nodes.push(
        txt('READER DUE', -860, yReader - 8, 28, ROLE.deadline, 'mono', 'left').glow(
          5,
          ROLE.deadline,
        ),
        txt('300 + 80 ms', -860, yReader + 34, 26, COSMOS.muted, 'mono', 'left'),
        line([xLeft, yReader], [xRight, yReader], { stroke: '#2a3758', width: 2.2 }),
      );

      runA.deadlines.forEach((dl, i) => {
        if (i > 0 && tp < i / 4.2) return;
        const xd = xOf(dl);
        const hiFixed = fg > 0.2;
        const tickW = hiFixed ? 4.8 : 3.2;
        nodes.push(
          // Gold deadline tick on Reader rail + aligned gold ticks on Run A & Run B rails (zero label crossings!)
          line([xd, yReader - 16], [xd, yReader + 16], { stroke: ROLE.deadline, width: 4.5 }).glow(
            7,
            ROLE.deadline,
          ),
          line([xd, yA - 16], [xd, yA + 16], { stroke: ROLE.deadline, width: tickW })
            .glow(hiFixed ? 8 : 4, ROLE.deadline)
            .opacity(hiFixed ? 0.95 : 0.72),
          line([xd, yB - 16], [xd, yB + 16], { stroke: ROLE.deadline, width: tickW })
            .glow(hiFixed ? 8 : 4, ROLE.deadline)
            .opacity(hiFixed ? 0.95 : 0.72),
          txt(`T${i + 1}`, xd, yReader - 48, 26, ROLE.deadline, 'mono'),
          txt(String(dl), xd, yReader + 48, 26, ROLE.deadline, 'mono'),
        );
      });

      // Rails 1 & 2: Run A (cyan) and Run B (violet)
      [
        { run: runA, y: yA, name: 'RUN A', col: ROLE.runA },
        { run: runB, y: yB, name: 'RUN B', col: ROLE.runB },
      ].forEach(({ run, y, name, col }) => {
        nodes.push(
          txt(name, -860, y, 32, col, 'mono', 'left').glow(6, col),
          line([xLeft, y], [xRight, y], { stroke: '#233254', width: 2.2 }),
        );
        if (now > minMs + 2) {
          nodes.push(
            glowingTrail(
              [
                [xOf(minMs), y],
                [xOf(now), y],
              ],
              { color: col, width: 4.5, glow: 7 },
            ),
            line([xOf(now), y - 14], [xOf(now), y + 14], { stroke: COSMOS.ink, width: 3.5 }),
          );
        }
        run.arrivals.forEach((arr, i) => {
          if (arr > now + 0.5) return;
          const xa = xOf(arr);
          const isLate = run === runB && i === 3;
          const dotCol = isLate ? ROLE.fail : col;
          nodes.push(
            glowDot(xa, y, { radius: 9.5, color: dotCol, glow: 10 }),
            txt(`T${i + 1}`, xa, y - 42, 26, dotCol, 'mono'),
            txt(String(arr), xa, y + 46, 26, COSMOS.ink, 'mono'),
          );
        });
      });

      // Strictly AFTER reader-gap: Run A 120 ms gap (320 -> 440)
      if (sg > 0.1) {
        nodes.push(
          ...spanBracket(
            xOf(runA.arrivals[2]),
            xOf(runA.arrivals[3]),
            yA - 86,
            '120 ms gap',
            ROLE.runA,
            {
              above: true,
              labelSize: 26,
              opacity: sg,
            },
          ),
        );
      }

      // Strictly AFTER reader-slack: Run A 100 ms early slack (440 -> 540)
      if (ss > 0.1) {
        nodes.push(
          ...spanBracket(
            xOf(runA.arrivals[3]),
            xOf(t4Due),
            yA + 90,
            '100 ms early',
            ROLE.qualified,
            {
              labelSize: 26,
              opacity: ss,
            },
          ),
        );
      }

      // Strictly AFTER reader-late: Run B 40 ms stall (540 -> 580)
      if (sl > 0.1) {
        nodes.push(
          ...spanBracket(xOf(t4Due), xOf(runB.arrivals[3]), yB + 86, '40 ms late', ROLE.fail, {
            labelSize: 26,
            opacity: sl,
          }),
        );
      }

      // Bottom band: mutually exclusive prediction prompt -> mean TPOT paradox -> Etalon reset!
      if (rp > 0.05) {
        const yEt = 376;
        const xLate = xOf(runB.arrivals[3]); // 580
        const xCur = xOf(runB.arrivals[3] + period * rp); // 580 -> 660
        nodes.push(
          txt('ETALON RESET', -860, yEt, 28, ROLE.deadline, 'mono', 'left').glow(6, ROLE.deadline),
          txt('580 + 80 ms -> 660', -860, yEt + 44, 26, COSMOS.ink, 'mono', 'left'),
          glowingTrail(
            [
              [xLate, yEt],
              [xCur, yEt],
            ],
            { color: ROLE.deadline, width: 6.0, glow: 10, opacity: rp },
          ),
          glowDot(xLate, yEt, { radius: 8, color: ROLE.fail, glow: 10, opacity: rp }),
          glowDot(xCur, yEt, { radius: 9, color: ROLE.deadline, glow: 12, opacity: rp }),
          txt('580', xLate, yEt + 42, 26, ROLE.fail, 'mono').opacity(rp),
          txt(`T5 due ${etalonNext}`, xOf(etalonNext), yEt + 42, 26, ROLE.deadline, 'mono')
            .glow(6, ROLE.deadline)
            .opacity(rp),
        );
      } else if (sm > 0.1) {
        nodes.push(
          txt(
            `RUN B MEAN TPOT = ${runB.meanTpot} MS  ·  AVERAGE HIDES THE 40 MS STALL`,
            0,
            396,
            28,
            ROLE.runB,
            'mono',
          )
            .glow(7, ROLE.runB)
            .opacity(sm),
        );
      } else if (now >= t4Due - 2 && sg < 0.1) {
        nodes.push(
          txt(
            'PAUSED AT T4 DEADLINE (540 ms)  ·  PREDICT: WHICH READER CAN KEEP GOING?',
            0,
            396,
            28,
            ROLE.focus,
            'mono',
          ).glow(7, ROLE.focus),
        );
      } else {
        nodes.push(
          ...timeAxisNodes(xLeft, xRight, 376, minMs, maxMs, [240, 300, 380, 460, 540, 620], {
            format: (v) => `${v}ms`,
          }),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, oscView);

  c.on('reader-cadence', () => {
    const t = c.cue('reader-cadence').start;
    s.play(tickProg.to(1, { duration: clampDur(c, t, 1.0) }));
  });
  c.on('reader-to-four', () => {
    const t = c.cue('reader-to-four').start;
    s.play(clockMs.to(t4Due, { duration: clampDur(c, t, 1.2) }));
  });
  c.after('reader-gap', () => {
    const t = c.cue('reader-gap').end;
    s.play(showGap.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.after('reader-slack', () => {
    const t = c.cue('reader-slack').end;
    s.play(showSlack.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('reader-finish', () => {
    const t = c.cue('reader-finish').start;
    s.play(clockMs.to(endDue, { duration: clampDur(c, t, 0.85) }));
  });
  c.after('reader-late', () => {
    const t = c.cue('reader-late').end;
    s.play(showLate.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.after('reader-mean', () => {
    const t = c.cue('reader-mean').end;
    s.play(showMean.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('reader-fixed', () => {
    const t = c.cue('reader-fixed').start;
    s.play(fixedGlow.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.after('reader-reset', () => {
    const t = c.cue('reader-reset').end;
    s.play(resetProg.to(1, { duration: clampDur(c, t, 0.55) }));
  });
}
