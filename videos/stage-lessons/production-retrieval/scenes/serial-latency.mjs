// Scene 19 (serial-latency): "Follow one clock from admission to first token and completion"
// Luminous serial waterfall timeline (2+18+1+320 = 341ms caller TTFT, +410 = 751ms completion,
// +3ms off-path trace write at 754ms, buffered validation shift) above a live cumulative stage-cap
// stack (10+80+10+500+450 = 1050ms) breaching the 1,000 ms end-to-end deadline laser wall!
import { dynamic, fade, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  callerTag,
  cinemaAtmosphere,
  glowDot,
  glowTex,
  heroTitle,
  lumBar,
  playCue,
  runPhase,
  serialRequestTrace,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function serialLatency(s, c) {
  const trace = serialRequestTrace();

  const phase = s.value(0);
  const clockMs = s.value(0); // 0 -> 21 -> 341 -> 751 -> 754
  const showBuffer = s.value(0);
  // Cumulative local stage caps: 5 animated bars
  const capVals = trace.localPassingStages.map(() => s.value(0));
  const showOverrun = s.value(0);
  // Footer mode: 0=intro, 1=TTFT 341ms, 2=complete 751ms, 3=trace 754ms, 4=buffered, 5=overrun 1050ms
  const footMode = s.value(0);

  const title = heroTitle(['One Request Clock:', 'TTFT to Deadline'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 62,
    accent: ROLE.policy,
    eyebrow: 'SERIAL LATENCY WATERFALL · END-TO-END DEADLINE',
  });

  const ttftEq = glowTex('\\text{TTFT}_{\\text{caller}} = 2 + 18 + 1 + 320 = 341\\text{ ms}', {
    x: 420,
    y: -365,
    size: 34,
    color: ROLE.focus,
    glow: 6,
  }).opacity(0);

  const stageColors = [ROLE.request, ROLE.policy, ROLE.admitted, ROLE.violet, ROLE.focus];

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const cm = clockMs.value;
    const sb = showBuffer.value;
    const ov = showOverrun.value;
    const fm = Math.round(footMode.value);

    const nodes = [callerTag(1)];

    // Shared horizontal time axis: 0 .. 1100 ms -> x in [-560, 820]
    const axL = -560;
    const axR = 820;
    const maxMs = 1100;
    const xMs = (ms) => axL + (Math.min(maxMs, Math.max(0, ms)) / maxMs) * (axR - axL);
    const xDead = xMs(1000);

    // 1,000 ms end-to-end deadline laser wall (stops cleanly below cap bar)
    nodes.push(
      line([xDead, -260], [xDead, 272], {
        stroke: ov > 0.3 ? ROLE.danger : ROLE.focus,
        width: ov > 0.3 ? 5.0 : 3.4,
        dash: [10, 7],
      }).glow((ov > 0.3 ? 13 : 8) * pulse, ov > 0.3 ? ROLE.danger : ROLE.focus),
      txt(
        '1,000 ms DEADLINE',
        xDead,
        -284,
        26,
        ov > 0.3 ? ROLE.danger : ROLE.focus,
        'mono',
        'center',
      ),
      txt('0 ms', axL, -284, 26, COSMOS.muted, 'mono', 'center'),
    );

    // Upper section: 6-lane serial waterfall (5 critical stages + 1 off-path trace write)
    const shortNames = ['Authorize', 'Retrieve', 'Pack', 'Startup', 'Generate'];
    const rows = [
      ...trace.stages.map((st, i) => ({
        label: `${shortNames[i]} (${st.duration}ms)`,
        start: st.start,
        end: st.end,
        col: stageColors[i],
      })),
      {
        label: 'Trace (3ms)',
        start: trace.completion,
        end: trace.traceComplete,
        col: COSMOS.muted,
      },
    ];

    rows.forEach((row, i) => {
      const ry = -222 + i * 58;
      nodes.push(
        line([axL, ry], [axR, ry], { stroke: '#1e2b48', width: 1.8 }),
        txt(row.label, axL - 22, ry, 26, row.col, 'mono', 'right'),
      );
      if (cm > row.start) {
        const curEnd = Math.min(row.end, cm);
        const bx0 = xMs(row.start);
        const bx1 = Math.max(bx0 + 10, xMs(curEnd));
        nodes.push(
          lumBar((bx0 + bx1) * 0.5, ry, bx1 - bx0, 34, {
            color: row.col,
            fillAlpha: 0.62,
            strokeWidth: 2.0,
            glow: 8,
            radius: 6,
          }),
        );
      }
    });

    // Live vertical sweep cursor across waterfall
    if (cm > 1) {
      const cx = xMs(cm);
      nodes.push(
        line([cx, -250], [cx, 102], { stroke: ROLE.focus, width: 2.8 }).glow(8, ROLE.focus),
        glowDot(cx, -250, { radius: 7, color: ROLE.focus, glow: 11 }),
      );
    }

    // Milestone markers on waterfall: Token 1 (341 ms) sits left of cursor so sweep moves away
    if (cm >= 330) {
      const xFirst = xMs(trace.callerTTFT);
      nodes.push(
        txt('Token 1: 341ms', xFirst - 18, -135, 26, ROLE.focus, 'mono', 'right').glow(
          6,
          ROLE.focus,
        ),
      );
    }
    if (sb > 0.2) {
      const xBuf = xMs(trace.completion);
      nodes.push(
        txt('Buffered >= 751ms', xBuf + 26, 42, 26, ROLE.warn, 'mono', 'left')
          .glow(7, ROLE.warn)
          .opacity(sb),
      );
    }

    // Lower section: Cumulative local stage caps (10 + 80 + 10 + 500 + 450 = 1050 ms > 1000 ms!)
    const capY = 235;
    nodes.push(
      txt(
        ov > 0.3
          ? 'STAGE CAPS SUM:  10 + 80 + 10 + 500 + 450 = 1,050 ms  (> 1,000 ms)'
          : 'CUMULATIVE STAGE CAPS VS 1,000 ms END-TO-END DEADLINE',
        axL,
        capY - 56,
        26,
        ov > 0.3 ? ROLE.danger : COSMOS.muted,
        'mono',
        'left',
      ),
      lumBar((axL + xDead) * 0.5, capY, xDead - axL, 58, {
        color: '#2c3d63',
        fillAlpha: 0.16,
        strokeWidth: 2,
        glow: 0,
        radius: 8,
      }),
    );

    let accMs = 0;
    const capNames = ['10', '80', '10', '500', '450'];
    trace.localPassingStages.forEach((ms, i) => {
      const val = ms * capVals[i].value;
      if (val > 0.5) {
        const x0 = xMs(accMs);
        const x1 = Math.max(x0 + 8, xMs(accMs + val));
        const col = i === 4 && ov > 0.3 ? ROLE.danger : stageColors[i];
        nodes.push(
          lumBar((x0 + x1) * 0.5, capY, x1 - x0 - 2, 48, {
            color: col,
            fillAlpha: 0.58,
            strokeWidth: 2,
            glow: i === 4 && ov > 0.3 ? 12 * pulse : 7,
            radius: 5,
          }),
        );
        if (x1 - x0 > 65) {
          nodes.push(
            txt(capNames[i] + 'ms', (x0 + x1) * 0.5, capY, 26, COSMOS.ink, 'mono', 'center'),
          );
        }
      }
      accMs += val;
    });

    if (ov > 0.3) {
      nodes.push(
        txt('+50 ms OVER!', xMs(1050) + 12, capY + 68, 26, ROLE.danger, 'mono', 'right')
          .glow(9 * pulse, ROLE.danger)
          .opacity(ov),
      );
    }

    // Bottom discrete verdict
    const footMap = [
      {
        text: 'One serial clock from caller admission through model startup and generation',
        col: COSMOS.muted,
      },
      { text: 'Caller token 1 at 341 ms  (model TTFT alone is only 320 ms)', col: ROLE.focus },
      { text: 'Answer completes at 751 ms  (+410 ms generation)', col: ROLE.admitted },
      { text: 'Nonblocking trace write finishes off-path at 754 ms', col: ROLE.policy },
      {
        text: 'Buffered full-answer validation delays caller text until after generation',
        col: ROLE.warn,
      },
      {
        text: '1,050 ms > 1,000 ms  ·  propagate one end-to-end deadline across stages',
        col: ROLE.danger,
      },
    ];
    const ft = footMap[Math.max(0, Math.min(footMap.length - 1, fm))];
    nodes.push(txt(ft.text, -855, 415, 30, ft.col, 'mono', 'left').glow(fm > 0 ? 7 : 0, ft.col));

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.violet), title, ttftEq, live);
  runPhase(s, c, phase, 14);

  tweenCue(s, c, 'pr-startup', clockMs, trace.stages[3].start, { dur: 0.85 });
  playCue(s, c, 'pr-first', (d) => s.play(clockMs.to(trace.callerTTFT, { duration: d })), {
    dur: 1.0,
  });
  playCue(
    s,
    c,
    'pr-first',
    (d) => s.play(footMode.to(1, { duration: 0.001 }), fade(ttftEq, 1, { duration: d })),
    { after: true, dur: 0.45 },
  );
  playCue(s, c, 'pr-complete', (d) => s.play(clockMs.to(trace.completion, { duration: d })), {
    dur: 1.0,
  });
  playCue(s, c, 'pr-complete', () => s.play(footMode.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(
    s,
    c,
    'pr-trace',
    (d) =>
      s.play(clockMs.to(trace.traceComplete, { duration: d }), footMode.to(3, { duration: 0.05 })),
    { after: true, dur: 0.45 },
  );
  playCue(
    s,
    c,
    'pr-buffer',
    (d) => s.play(showBuffer.to(1, { duration: d }), footMode.to(4, { duration: 0.05 })),
    { after: true, dur: 0.5 },
  );
  ['cap-auth', 'cap-retrieval', 'cap-packing', 'cap-startup', 'cap-generation'].forEach(
    (cue, i) => {
      tweenCue(s, c, cue, capVals[i], 1, { dur: 0.35 });
    },
  );
  playCue(
    s,
    c,
    'pr-deadline',
    (d) => s.play(showOverrun.to(1, { duration: d }), footMode.to(5, { duration: 0.05 })),
    { after: true, dur: 0.5 },
  );
}
