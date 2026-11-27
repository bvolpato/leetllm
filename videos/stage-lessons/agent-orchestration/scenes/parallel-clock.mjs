// Scene 03 (parallel-clock): "Which receipt keeps Vega waiting?"
// Dual-track luminous Gantt wall-clock observatory (serial 6.0s vs parallel 3.0s + 0.5s merge = 3.5s)
// with strict c.after prediction withholding on Health bottleneck & 3.5s completion.
import {
  COSMOS,
  DURATIONS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  markDecoration,
  renderGauge,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function parallelClock(s, c) {
  // Beat 0: Serial durations + parallel start signal (bottleneck withheld!)
  const showEval = s.value(0.25);
  const showHealth = s.value(0.25);
  const showPolicy = s.value(0.25);
  const serialLit = s.value(0);
  const parallelStart = s.value(0);
  const parallelSweep = s.value(0); // 0 -> 3.5 s on clock

  // Beat 1: Reveal completions & bottleneck strictly after cues
  const oneClockLit = s.value(0);
  const healthRevealed = s.value(0);
  const mergeWaitsLit = s.value(0);
  const mergeBar = s.value(0);
  const totalRevealed = s.value(0);

  // Beat 2: Conserved 6s work + 4 real-world latency taxes
  const sameWorkLit = s.value(0);
  const taxDispatch = s.value(0);
  const taxRate = s.value(0);
  const taxContention = s.value(0);
  const taxQueue = s.value(0);
  const measureLit = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.eval, ROLE.policy);
  const title = heroTitle(['Which Receipt Keeps', 'Vega Waiting?'], {
    x: -860,
    y: -440,
    size: 54,
    lineHeight: 62,
    accent: ROLE.mark,
    eyebrow: 'CRITICAL PATH  /  SERIAL VS PARALLEL CLOCK',
  });

  const leftX = -530;
  const pxPerSec = 155; // 6.5s = 1007.5px -> ends at +477.5
  const xOf = (sec) => leftX + sec * pxPerSec;

  const live = guardedDynamic(s.value(1), () => {
    const sw = parallelSweep.value;
    const pStart = parallelStart.value;
    const hRev = healthRevealed.value;
    const tRev = totalRevealed.value;
    const nodes = [];

    // Shared luminous time ruler (0s to 6.5s)
    const rulerY = -235;
    nodes.push(
      rule(
        leftX,
        rulerY,
        xOf(6.5),
        rulerY,
        oneClockLit.value > 0.4 ? ROLE.mark : COSMOS.muted,
        2.5,
      ),
    );
    for (let sec = 0; sec <= 6; sec++) {
      const tx = xOf(sec);
      nodes.push(
        line([tx, rulerY - 8], [tx, rulerY + 10], { stroke: COSMOS.muted, width: 2.2 }),
        txt(`${sec}s`, tx, rulerY - 28, 26, COSMOS.muted, 'mono'),
        markDecoration(
          line([tx, rulerY + 12], [tx, 210], {
            stroke: COSMOS.rule,
            width: 1.2,
            dash: [6, 8],
          }).opacity(0.42),
        ),
      );
    }

    // Track 1: SERIAL EXECUTION (2s Eval + 3s Health + 1s Policy = 6.0s)
    const serY = -145;
    nodes.push(
      txt(
        'SERIAL',
        -860,
        serY - 14,
        28,
        serialLit.value > 0.4 ? ROLE.triage : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        serialLit.value > 0.4 ? '2 + 3 + 1 = 6 s' : 'sum of reads',
        -860,
        serY + 30,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
    );
    const serialBars = [
      { start: 0, dur: DURATIONS.eval, label: 'Eval 2s', col: ROLE.eval, op: showEval.value },
      {
        start: 2,
        dur: DURATIONS.health,
        label: 'Health 3s',
        col: ROLE.health,
        op: showHealth.value,
      },
      { start: 5, dur: DURATIONS.policy, label: 'Pol 1s', col: ROLE.policy, op: showPolicy.value },
    ];
    serialBars.forEach((b) => {
      const w = b.dur * pxPerSec - 6;
      const cx = xOf(b.start) + (b.dur * pxPerSec) / 2;
      nodes.push(
        lumBar(cx, serY, w, 54, {
          color: b.col,
          fillOpacity: 0.34,
          strokeWidth: 2.6,
          glow: b.op > 0.6 ? 10 : 4,
          opacity: Math.max(0.35, b.op),
        }),
        txt(b.label, cx, serY, 26, COSMOS.ink, 'mono').opacity(Math.max(0.45, b.op)),
      );
    });
    if (serialLit.value > 0.2) {
      nodes.push(
        txt('6.0 s', xOf(6.0) + 28, serY, 30, ROLE.triage, 'mono', 'left')
          .glow(7, ROLE.triage)
          .opacity(serialLit.value),
      );
    }

    // Track 2: PARALLEL FAN-OUT + MERGE (all start at t = 0)
    const parBaseY = -5;
    const laneGap = 72;
    nodes.push(
      txt(
        'PARALLEL',
        -860,
        parBaseY + 12,
        28,
        pStart > 0.3 ? ROLE.eval : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        pStart > 0.3 ? 'start t=0' : 'concurrent',
        -860,
        parBaseY + 54,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
    );

    const parLanes = [
      { id: 'Policy', dur: DURATIONS.policy, y: parBaseY, col: ROLE.policy },
      { id: 'Eval', dur: DURATIONS.eval, y: parBaseY + laneGap, col: ROLE.eval },
      { id: 'Health', dur: DURATIONS.health, y: parBaseY + laneGap * 2, col: ROLE.health },
    ];
    parLanes.forEach((lane) => {
      // Bar fills up to min(sw, lane.dur) once clock sweeps, or shows faint outline when aligned at t=0
      const activeDur = sw > 0.05 ? Math.min(sw, lane.dur) : pStart > 0.2 ? 0.35 : 0.12;
      const w = Math.max(12, activeDur * pxPerSec);
      const isHealthHot = lane.id === 'Health' && hRev > 0.3;
      nodes.push(
        txt(
          `${lane.id} ${lane.dur}s`,
          leftX - 22,
          lane.y,
          26,
          isHealthHot ? ROLE.mark : lane.col,
          'mono',
          'right',
        ),
        lumBar(leftX + w / 2, lane.y, w, 46, {
          color: isHealthHot ? ROLE.mark : lane.col,
          fillOpacity: sw >= lane.dur ? 0.45 : 0.24,
          strokeWidth: isHealthHot ? 3.4 : 2.4,
          glow: isHealthHot ? 14 : 7,
        }),
      );
    });

    // Live vertical playhead sweeping strictly across the parallel track (starts below serial row!)
    if (sw > 0.04) {
      const px = xOf(Math.min(3.5, sw));
      nodes.push(
        line([px, parBaseY - 46], [px, parBaseY + laneGap * 2 + 30], {
          stroke: ROLE.mark,
          width: 3.4,
        }).glow(10, ROLE.mark),
        glowDot(px, parBaseY - 46, { radius: 6.5, color: ROLE.mark, glow: 12 }),
        glowDot(px, rulerY, { radius: 7, color: ROLE.mark, glow: 12 }),
      );
    }

    // Merge overhead bar (0.5 s starting at t = 3.0 s, label sits cleanly below bar!)
    if (mergeBar.value > 0.02) {
      const mw = DURATIONS.merge * pxPerSec * mergeBar.value;
      const mcx = xOf(3.0) + mw / 2;
      nodes.push(
        lumBar(mcx, parBaseY + laneGap, Math.max(10, mw), 188, {
          color: ROLE.merge,
          fillOpacity: 0.26,
          strokeWidth: 2.8,
          glow: 11,
          opacity: mergeBar.value,
        }),
        txt('MERGE +0.5s', xOf(3.25), parBaseY + laneGap * 2 + 64, 26, ROLE.merge, 'mono').opacity(
          mergeBar.value,
        ),
      );
    }

    // Right readout panel: Prediction question -> Health bottleneck -> 3.5 s total (strictly gated!)
    const rx = 565;
    nodes.push(
      txt('BOTTLENECK', rx, -190, 26, COSMOS.muted, 'mono', 'left'),
      rule(rx, -166, 860, -166, ROLE.rule, 2),
    );
    if (hRev > 0.02) {
      nodes.push(
        txt('HEALTH', rx, -110, 44, ROLE.mark, 'mono', 'left').glow(10, ROLE.mark).opacity(hRev),
        txt('slowest: 3.0 s', rx, -62, 26, ROLE.health, 'mono', 'left').opacity(hRev),
      );
    } else {
      nodes.push(
        txt('???', rx, -110, 48, ROLE.mark, 'mono', 'left')
          .glow(8, ROLE.mark)
          .opacity(1 - hRev),
        txt('Which branch?', rx, -62, 26, COSMOS.muted, 'sans', 'left').opacity(1 - hRev),
      );
    }

    nodes.push(
      txt('PACKET READY', rx, 20, 26, COSMOS.muted, 'mono', 'left'),
      rule(rx, 44, 860, 44, ROLE.rule, 2),
    );
    if (tRev > 0.02) {
      nodes.push(
        txt('3.5 s', rx, 102, 50, ROLE.pass, 'mono', 'left').glow(12, ROLE.pass).opacity(tRev),
        txt('3.0 s + 0.5 s merge', rx, 152, 26, COSMOS.muted, 'mono', 'left').opacity(tRev),
      );
    } else {
      nodes.push(txt('waiting...', rx, 102, 32, COSMOS.muted, 'mono', 'left').opacity(1 - tRev));
    }

    // Bottom observatory: Conserved 6.0 s total compute + 4 latency-tax chips
    const botY = 295;
    nodes.push(rule(-860, botY - 40, 860, botY - 40, ROLE.rule, 2));

    const workGauge = renderGauge(-860, botY + 12, 460, 24, 1.0, {
      cap: 1.0,
      color: sameWorkLit.value > 0.3 ? ROLE.triage : COSMOS.dim,
      showLimit: false,
    });
    nodes.push(
      ...workGauge.nodes,
      txt(
        'TOTAL READ WORK: 6.0 s (unchanged)',
        -860,
        botY + 58,
        26,
        sameWorkLit.value > 0.3 ? ROLE.triage : COSMOS.muted,
        'mono',
        'left',
      ),
    );

    const taxes = [
      { label: 'Dispatch', v: taxDispatch.value, x: -245 },
      { label: 'Rate limits', v: taxRate.value, x: 5 },
      { label: 'Contention', v: taxContention.value, x: 265 },
      { label: 'Queueing', v: taxQueue.value, x: 535 },
    ];
    taxes.forEach((tx) => {
      const hot = tx.v > 0.35;
      nodes.push(
        lumBar(tx.x, botY + 12, 210, 48, {
          color: hot ? ROLE.reject : COSMOS.rule,
          fillOpacity: hot ? 0.24 : 0.1,
          strokeWidth: hot ? 2.6 : 1.6,
          glow: hot ? 9 : 0,
        }),
        txt(tx.label, tx.x, botY + 12, 26, hot ? COSMOS.ink : COSMOS.dim, 'mono'),
      );
    });

    if (measureLit.value > 0.02) {
      nodes.push(
        txt(
          'In production: measure both wall time and total cost',
          860,
          botY + 58,
          26,
          ROLE.mark,
          'sans',
          'right',
        )
          .glow(6, ROLE.mark)
          .opacity(measureLit.value),
      );
    } else if (mergeWaitsLit.value > 0.3 && sameWorkLit.value < 0.2) {
      nodes.push(
        txt(
          'Merge waits for the slowest required branch',
          860,
          botY + 58,
          26,
          ROLE.merge,
          'sans',
          'right',
        ).opacity(mergeWaitsLit.value * (1 - sameWorkLit.value)),
      );
    }

    return nodes;
  });

  s.add(bgAtmo, title, live);

  // Beat 0: Serial durations + parallel start signal (answer strictly withheld)
  tweenCue(s, c, 'eval-two', showEval, 1, { duration: 0.3 });
  tweenCue(s, c, 'health-three', showHealth, 1, { duration: 0.3 });
  tweenCue(s, c, 'policy-one', showPolicy, 1, { duration: 0.3 });
  tweenCue(s, c, 'serial-reads', serialLit, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'parallel-run', parallelStart, 1, { duration: 0.35 });
  tweenCue(s, c, 'parallel-result', parallelSweep, 0.75, { duration: 0.5, after: true });

  // Beat 1: Reveal parallel sweep, Health bottleneck AFTER health-answer, 3.5s AFTER parallel-total
  tweenCue(s, c, 'one-clock', oneClockLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'parallel-reads', parallelSweep, 3.0, { duration: 1.4 });
  tweenCue(s, c, 'health-answer', healthRevealed, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'merge-waits', mergeWaitsLit, 1, { duration: 0.3 });
  c.on('merge-overhead', () => {
    s.play(mergeBar.to(1, { duration: 0.45 }), parallelSweep.to(3.5, { duration: 0.45 }));
  });
  tweenCue(s, c, 'parallel-total', totalRevealed, 1, { duration: 0.4, after: true });

  // Beat 2: Conserved compute & real-world latency overhead
  tweenCue(s, c, 'same-total-work', sameWorkLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'overhead', taxDispatch, 1, { duration: 0.3 });
  tweenCue(s, c, 'rate-limits', taxRate, 1, { duration: 0.3 });
  tweenCue(s, c, 'contention', taxContention, 1, { duration: 0.3 });
  tweenCue(s, c, 'queueing', taxQueue, 1, { duration: 0.3 });
  tweenCue(s, c, 'measure-wall', measureLit, 1, { duration: 0.35 });
}
