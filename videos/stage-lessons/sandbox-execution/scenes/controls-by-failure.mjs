// Scene 06 (controls-by-failure): "What stops when a limit is reached?"
// Closed-network stdout leak demo + 5 luminous cgroup / watchdog telemetry instruments
// (64 MiB scratch inside 512 MiB memory, 64 tasks/threads, 50ms/100ms CPU throttle strip, 30s watchdog).
import {
  COSMOS,
  ROLE,
  WORKER_ID,
  cinemaAtmosphere,
  crossSwap,
  glowArrow,
  glowDot,
  guardedDynamic,
  heroTitle,
  line,
  linear,
  lumBar,
  renderGauge,
  resourceFixture,
  rule,
  runtimeProbe,
  tweenCue,
  txt,
  verifyApprox,
} from '../parts.mjs';

const PERIODS = 6;
const CAP = 0.8;

export default function controlsByFailure(s, c) {
  const limits = resourceFixture();
  const probes = runtimeProbe();
  verifyApprox(
    limits.cpuQuota / limits.cpuPeriod,
    limits.cpuEquivalent,
    1e-12,
    '50ms / 100ms = 0.5 CPU',
  );

  // Top worker-to-supervisor leak channel
  const tokenVis = s.value(1);
  const tokenHot = s.value(0);
  const netHot = s.value(0);
  const leakPos = s.value(0);
  const leakedVis = s.value(0);
  const showBounds = s.value(0);
  const stoppedVis = s.value(0);
  const aliveHot = s.value(0);

  // Gauges
  const scratchLvl = s.value(0);
  const memLvl = s.value(0.28);
  const taskLvl = s.value(0);
  const wallLvl = s.value(0);

  const show64 = s.value(0);
  const show512 = s.value(0);
  const scratchHot = s.value(0);
  const showEnospc = s.value(0);
  const showNoSwap = s.value(0);
  const showPressure = s.value(0);
  const showThreads = s.value(0);
  const showEagain = s.value(0);

  // CPU 6-period strip
  const cpuTime = s.value(0);
  const cpuShare = s.value(0);
  const showPeriod = s.value(0);
  const showQuota = s.value(0);
  const showThrottled = s.value(0);
  const showAggregate = s.value(0);
  const showEquation = s.value(0);
  const showLoop = s.value(0);

  // Watchdog
  const showStopMsg = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.candidate, ROLE.host);
  const title = heroTitle(['What Stops When', 'a Limit Hits?'], {
    x: -860,
    y: -445,
    size: 46,
    lineHeight: 54,
    accent: ROLE.candidate,
    eyebrow: 'CGROUP QUOTAS & WATCHDOG',
  });

  const live = guardedDynamic(s.value(1), () => {
    const nodes = [];

    // === TOP CHANNEL: Worker -> (Network CLOSED / Output OPEN) -> Supervisor ===
    const ty = -356;
    const isStopped = stoppedVis.value > 0.5;
    nodes.push(
      lumBar(-80, ty, 490, 108, {
        color: isStopped ? ROLE.host : ROLE.candidate,
        fillOpacity: 0.14,
        strokeWidth: 2.2,
        glow: 9,
      }),
      txt(WORKER_ID, -305, ty - 26, 26, ROLE.candidate, 'mono', 'left'),
      txt(
        isStopped ? 'stop requested' : 'parse.py  (running)',
        -305,
        ty + 22,
        26,
        isStopped ? ROLE.host : aliveHot.value > 0.4 ? ROLE.mark : ROLE.pass,
        'mono',
        'left',
      ),
    );

    if (tokenVis.value > 0.02) {
      nodes.push(
        lumBar(70, ty - 24, 172, 38, {
          color: tokenHot.value > 0.4 ? ROLE.mark : ROLE.candidate,
          fillOpacity: 0.22,
          strokeWidth: 2,
          glow: 9,
          opacity: tokenVis.value,
        }),
        txt('DEMO_TOKEN', 70, ty - 24, 26, ROLE.candidate, 'mono').opacity(tokenVis.value),
      );
    }

    // Closed network vs open stdout channel
    const netY = ty - 26;
    const outY = ty + 28;
    nodes.push(
      line([178, netY], [340, netY], { stroke: COSMOS.dim, width: 3, dash: [8, 6] }),
      line([259, netY - 16], [259, netY + 16], {
        stroke: netHot.value > 0.4 ? ROLE.mark : ROLE.host,
        width: 6,
      }).glow(8, ROLE.host),
      txt('net: none', 259, netY - 36, 26, netHot.value > 0.4 ? ROLE.mark : ROLE.host, 'mono'),
      glowArrow([178, outY], [344, outY], ROLE.evidence, { width: 4, tip: 13 }),
      txt('stdout', 259, outY + 30, 26, ROLE.evidence, 'mono'),
    );

    if (leakPos.value > 0.01 && tokenVis.value > 0.02) {
      const lx = 178 + (344 - 178) * leakPos.value;
      nodes.push(
        glowDot(lx, outY, {
          radius: 10,
          color: ROLE.candidate,
          glow: 14,
          opacity: tokenVis.value,
        }),
      );
    }

    // Supervisor panel
    nodes.push(
      lumBar(605, ty, 505, 108, {
        color: ROLE.host,
        fillOpacity: 0.14,
        strokeWidth: 2.2,
        glow: 9,
      }),
      txt('SUPERVISOR', 376, ty - 26, 26, ROLE.host, 'mono', 'left'),
    );
    if (leakedVis.value > 0.02 && tokenVis.value > 0.02) {
      nodes.push(
        txt('DEMO_TOKEN leaked via stdout!', 376, ty + 22, 26, ROLE.candidate, 'mono', 'left')
          .glow(8, ROLE.candidate)
          .opacity(leakedVis.value * tokenVis.value),
      );
    } else if (showBounds.value > 0.02) {
      nodes.push(
        txt('caps: output, logs, mem, jobs', 376, ty + 22, 26, ROLE.host, 'sans', 'left').opacity(
          showBounds.value,
        ),
      );
    } else {
      nodes.push(txt('credential-free isolation', 376, ty + 22, 26, COSMOS.muted, 'sans', 'left'));
    }

    // === FIVE TELEMETRY ROWS ===
    const nameX = -860;
    const trackLeft = -565;
    const trackW = 790;
    const statusX = 270;

    // Row 0: Scratch (64 MiB)
    const y0 = -188;
    nodes.push(txt('Scratch', nameX, y0, 30, COSMOS.ink, 'sans', 'left'));
    const g0 = renderGauge(trackLeft, y0, trackW, 38, scratchLvl.value, {
      cap: CAP,
      color: ROLE.candidate,
      limitColor: scratchHot.value > 0.4 ? ROLE.mark : COSMOS.ink,
    });
    nodes.push(...g0.nodes);
    if (show64.value > 0.02) {
      nodes.push(
        txt(
          `${limits.scratchMiB} MiB`,
          trackLeft + trackW - 6,
          y0 - 48,
          26,
          ROLE.mark,
          'mono',
          'right',
        ).opacity(show64.value),
      );
    }
    if (showEnospc.value > 0.02) {
      nodes.push(
        txt(probes[2].outcome, statusX, y0, 26, ROLE.warn, 'mono', 'left').opacity(
          showEnospc.value,
        ),
      );
    }

    // Row 1: Memory (512 MiB, no swap)
    const y1 = -74;
    nodes.push(txt('Memory', nameX, y1, 30, COSMOS.ink, 'sans', 'left'));
    const g1 = renderGauge(trackLeft, y1, trackW, 38, memLvl.value, {
      cap: CAP,
      color: ROLE.evidence,
    });
    nodes.push(...g1.nodes);
    if (show512.value > 0.02) {
      nodes.push(
        txt(
          `${limits.memoryMiB} MiB`,
          trackLeft + trackW - 6,
          y1 - 48,
          26,
          ROLE.host,
          'mono',
          'right',
        ).opacity(show512.value),
      );
    }
    if (showNoSwap.value > 0.02 || showPressure.value > 0.02) {
      const mText =
        showPressure.value > 0.4 ? 'no swap  /  reclaim · fail · kill' : 'swap disabled';
      nodes.push(
        txt(mText, statusX, y1, 26, ROLE.host, 'mono', 'left').opacity(
          Math.max(showNoSwap.value, showPressure.value),
        ),
      );
    }

    // Row 2: Tasks & Threads (64)
    const y2 = 40;
    nodes.push(
      txt(
        showThreads.value > 0.5 ? 'Tasks + threads' : 'Tasks',
        nameX,
        y2,
        30,
        showThreads.value > 0.5 ? ROLE.mark : COSMOS.ink,
        'sans',
        'left',
      ),
    );
    const g2 = renderGauge(trackLeft, y2, trackW, 38, taskLvl.value, {
      cap: CAP,
      color: ROLE.candidate,
    });
    nodes.push(...g2.nodes);
    if (showEagain.value > 0.02) {
      nodes.push(
        txt(probes[3].outcome, statusX, y2, 26, ROLE.warn, 'mono', 'left').opacity(
          showEagain.value,
        ),
      );
    }

    // Row 3: CPU 6-period throttle strip (100 ms periods, 50 ms quota -> 2x25 ms)
    const y3 = 205;
    const stripH = 68;
    nodes.push(
      txt('CPU quota', nameX, y3, 30, COSMOS.ink, 'sans', 'left'),
      lumBar(trackLeft + trackW * 0.5, y3, trackW, stripH, {
        color: COSMOS.rule,
        fillOpacity: 0.22,
        strokeWidth: 2,
        glow: 0,
      }),
    );
    const px = (p) => trackLeft + (p / PERIODS) * trackW;
    for (let k = 1; k < PERIODS; k++) {
      nodes.push(
        line([px(k), y3 - stripH * 0.5], [px(k), y3 + stripH * 0.5], {
          stroke: COSMOS.dim,
          width: 2,
        }),
      );
    }
    const tVal = cpuTime.value;
    const sh = cpuShare.value;
    const laneWidths = [0.5 - 0.25 * sh, 0.25 * sh];
    for (let p = 0; p < PERIODS; p++) {
      laneWidths.forEach((lw, lane) => {
        const endP = Math.min(p + lw, tVal);
        if (endP - p > 0.02) {
          const x0 = px(p) + 3;
          const x1 = px(endP) - 2;
          const ly = y3 - stripH * 0.24 + lane * stripH * 0.48;
          nodes.push(
            lumBar((x0 + x1) * 0.5, ly, Math.max(4, x1 - x0), stripH * 0.36, {
              color: lane === 0 ? ROLE.candidate : ROLE.mark,
              fillOpacity: 0.78,
              strokeWidth: 1.6,
              glow: 7,
              radius: 4,
            }),
          );
        }
      });
    }
    if (showPeriod.value > 0.02) {
      nodes.push(
        txt(
          `period: ${limits.cpuPeriod} ms`,
          trackLeft,
          y3 - 58,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(showPeriod.value),
      );
    }
    if (showQuota.value > 0.02) {
      const qStr =
        showAggregate.value > 0.4
          ? `quota: ${limits.cpuQuota} ms total  (2 threads x 25 ms)`
          : `quota: ${limits.cpuQuota} ms CPU / period`;
      nodes.push(
        txt(qStr, trackLeft, y3 + 60, 26, ROLE.candidate, 'mono', 'left').opacity(showQuota.value),
      );
    }
    if (showThrottled.value > 0.02) {
      nodes.push(
        txt('throttled rest of period', statusX, y3, 26, COSMOS.muted, 'sans', 'left').opacity(
          showThrottled.value,
        ),
      );
    }
    if (showEquation.value > 0.02) {
      nodes.push(
        txt(
          `${limits.cpuQuota} ms / ${limits.cpuPeriod} ms = ${limits.cpuEquivalent} CPU`,
          statusX,
          y3 - 12,
          28,
          ROLE.mark,
          'mono',
          'left',
        )
          .glow(8, ROLE.mark)
          .opacity(showEquation.value),
      );
    }
    if (showLoop.value > 0.02) {
      nodes.push(
        txt('loop still runs forever', statusX, y3 + 36, 26, COSMOS.muted, 'sans', 'left').opacity(
          showLoop.value,
        ),
      );
    }

    // Row 4: Wall-clock Watchdog (30 s)
    const y4 = 376;
    nodes.push(
      txt(
        'Wall clock',
        nameX,
        y4,
        30,
        showLoop.value > 0.4 ? ROLE.mark : COSMOS.ink,
        'sans',
        'left',
      ),
    );
    const g4 = renderGauge(trackLeft, y4, trackW, 38, wallLvl.value, {
      cap: CAP,
      color: ROLE.host,
    });
    nodes.push(...g4.nodes);
    if (showStopMsg.value > 0.02) {
      nodes.push(
        txt(
          `${limits.wallSeconds} s  /  watchdog kills job`,
          statusX,
          y4,
          26,
          ROLE.host,
          'mono',
          'left',
        )
          .glow(7, ROLE.host)
          .opacity(showStopMsg.value),
      );
    }

    return nodes;
  });

  s.add(bgAtmo, title, live);

  // Beat 0: closed network still leaks stdout token
  tweenCue(s, c, 'cf-credentials', tokenHot, 1, { duration: 0.45 });
  tweenCue(s, c, 'cf-network', netHot, 1, { duration: 0.45 });
  tweenCue(s, c, 'cf-print', leakPos, 1, { duration: 1.0 });
  tweenCue(s, c, 'cf-returns', leakedVis, 1, { duration: 0.35 });

  // Beat 1: scratch, memory, swap, tasks
  c.onBeat(1, () => {
    s.play(tokenVis.to(0, { duration: 0.3 }));
  });
  tweenCue(s, c, 'cf-sixtyfour', show64, 1, { duration: 0.35 });
  tweenCue(s, c, 'cf-fivetwelve', show512, 1, { duration: 0.35 });
  c.on('cf-consumes', () => {
    s.play(
      scratchLvl.to(CAP, { duration: 1.4 }),
      memLvl.to(0.28 + (CAP * limits.scratchMiB) / limits.memoryMiB, { duration: 1.4 }),
    );
  });
  tweenCue(s, c, 'cf-scratch', scratchHot, 1, { duration: 0.35 });
  tweenCue(s, c, 'cf-write-fails', showEnospc, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'cf-distinct', aliveHot, 1, { duration: 0.4 });
  tweenCue(s, c, 'cf-swap', showNoSwap, 1, { duration: 0.35 });
  tweenCue(s, c, 'cf-pressure', showPressure, 1, { duration: 0.35 });
  tweenCue(s, c, 'cf-threads', showThreads, 1, { duration: 0.35 });
  tweenCue(s, c, 'cf-tasks', taskLvl, CAP, { duration: 1.1 });
  tweenCue(s, c, 'cf-reject', showEagain, 1, { duration: 0.35, after: true });

  // Beat 2: CPU strip + aggregate share
  tweenCue(s, c, 'cf-period', showPeriod, 1, { duration: 0.35 });
  tweenCue(s, c, 'cf-quota', showQuota, 1, { duration: 0.35 });
  tweenCue(s, c, 'cf-cpu', cpuTime, PERIODS, { duration: 2.2, ease: linear });
  tweenCue(s, c, 'cf-cpu', showThrottled, 1, { duration: 0.35, after: true });
  c.on('cf-aggregate', () => {
    s.play(cpuShare.to(1, { duration: 0.9 }), showAggregate.to(1, { duration: 0.35 }));
  });
  crossSwap(s, c, 'cf-equation', showThrottled, showEquation, { duration: 0.4 });
  tweenCue(s, c, 'cf-loop', showLoop, 1, { duration: 0.35 });

  // Beat 3: Host bounds + 30s wall watchdog
  tweenCue(s, c, 'cf-bounds', showBounds, 1, { duration: 0.4 });
  tweenCue(s, c, 'cf-deadline', wallLvl, CAP, { duration: 1.8, ease: linear });
  c.after('cf-stop', () => {
    s.play(showStopMsg.to(1, { duration: 0.35 }), stoppedVis.to(1, { duration: 0.35 }));
  });
}
