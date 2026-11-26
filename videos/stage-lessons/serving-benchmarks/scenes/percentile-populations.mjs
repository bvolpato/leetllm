// Scene 19: percentile-populations - Change the weighting and the tail changes
// Animated tail-latency percentile distribution visualizer:
//   Mode 0: 20 sorted observations highlighting nearest-rank p95 = rank 19 (and n=80 p99 = max)
//   Mode 1: Response A (nineteen 1 ms gaps) + Response B (one 100 ms gap):
//           pooled p95 = 1 ms vs per-request worst [1, 100] p95 = 100 ms vs bogus mean 50.5 ms!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PERCENTILE_POOLED,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dashedRule,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  nearestRank,
  txt,
} from '../parts.mjs';

export default function percentilePopulations(s, c) {
  const phase = s.value(0);
  const rankLit = s.value(0.25);
  const mode01 = s.value(0); // 0 = nearest-rank 1..20, 1 = pooled vs per-request
  const showPooled = s.value(0);
  const showPerReq = s.value(0);
  const showMeanTrap = s.value(0);

  const pooledP95 = nearestRank(PERCENTILE_POOLED, 0.95); // 1
  const perReqP95 = nearestRank([1, 100], 0.95); // 100

  const header = cinemaHeader(
    'TAIL-LATENCY DISTRIBUTIONS',
    'Change the weighting,',
    'change the tail',
    {
      x: -860,
      y: -435,
      accent: ROLE.focus,
      size: 50,
    },
  );

  const stageAura = aura(120, 20, 680, '#ffd1661c', '#a78bfa1a');

  const rankEq = glowTex(String.raw`\lceil 0.95 \times 20 \rceil = 19`, {
    x: 520,
    y: -355,
    size: 38,
    color: ROLE.focus,
    glow: 7,
  });

  // Mode 0: 20 ordered latency bars with rank-19 golden laser needle
  const view0 = guardedDynamic(
    () => fadeOutHalf(mode01.value),
    (a) => {
      const rl = rankLit.value;
      const baseY = 170;
      const xLeft = -760;
      const stepX = 80;
      const nodes = [
        line([xLeft - 24, baseY], [xLeft + 19 * stepX + 36, baseY], {
          stroke: '#2b3d63',
          width: 2.4,
        }).opacity(a),
        txt('20 SORTED LATENCY OBSERVATIONS', 0, -210, 28, COSMOS.muted, 'mono').opacity(a),
      ];

      for (let i = 0; i < 20; i++) {
        const cx = xLeft + i * stepX;
        // Smooth skewed tail profile rising sharply near p95/p99
        const frac = i / 19;
        const h = 42 + 120 * Math.pow(frac, 2.2) + (i === 19 ? 95 : 0);
        const is19 = i === 18;
        const col = is19 && rl > 0.2 ? ROLE.focus : ROLE.workload;
        nodes.push(
          rect(52, h, {
            fill: col,
            stroke: is19 && rl > 0.2 ? '#ffffff' : col,
            width: is19 && rl > 0.2 ? 2.6 : 1.4,
            radius: 6,
          })
            .at(cx, baseY - h * 0.5)
            .opacity((is19 ? 0.95 : 0.72) * a)
            .glow(is19 && rl > 0.2 ? 12 : 4, col),
        );
        // Show rank numbers evenly spaced (1, 5, 10, 15, 19, 20) so >= 26px labels never crowd!
        if (i === 0 || i === 4 || i === 9 || i === 14 || i === 18 || i === 19) {
          nodes.push(
            txt(
              String(i + 1),
              cx,
              baseY + 42,
              26,
              is19 && rl > 0.2 ? ROLE.focus : COSMOS.muted,
              'mono',
            ).opacity(a),
          );
        }
      }

      // Golden p95 pointer arrow at rank 19
      if (rl > 0.1) {
        const x19 = xLeft + 18 * stepX;
        nodes.push(
          dashedRule(x19, -155, x19, baseY - 155, ROLE.focus, 0.9 * a * rl, 3.0),
          txt('p95 = RANK 19', x19 - 45, -165, 28, ROLE.focus, 'mono', 'right')
            .glow(7, ROLE.focus)
            .opacity(a * rl),
        );
      }

      nodes.push(
        txt(
          'At n = 80 observations, nearest-rank p99 picks rank 80 (the single slowest request!)',
          0,
          322,
          28,
          ROLE.burst,
          'sans',
        ).opacity(a),
        txt(
          'Collect enough observations across the traffic mix you expect',
          0,
          388,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 1: Pooled 20 gaps (nineteen 1 ms + one 100 ms) vs Per-request worst [1, 100] vs bogus mean 50.5
  const view1 = guardedDynamic(
    () => fadeInHalf(mode01.value),
    (a) => {
      const sp = showPooled.value;
      const sr = showPerReq.value;
      const sm = showMeanTrap.value;

      const baseY = 120;
      const xLeft = -760;
      const stepX = 80;
      const nodes = [
        txt('RESP A: nineteen 1 ms gaps', -760, -195, 28, ROLE.runA, 'mono', 'left')
          .glow(5, ROLE.runA)
          .opacity(a),
        txt('RESP B: one 100 ms gap', 780, -195, 28, ROLE.runB, 'mono', 'right')
          .glow(5, ROLE.runB)
          .opacity(a),
        line([xLeft - 24, baseY], [xLeft + 19 * stepX + 36, baseY], {
          stroke: '#2b3d63',
          width: 2.4,
        }).opacity(a),
      ];

      PERCENTILE_POOLED.forEach((ms, i) => {
        const cx = xLeft + i * stepX;
        const isSpike = i === 19;
        const h = isSpike ? 260 : 24;
        const col = isSpike ? ROLE.runB : ROLE.runA;
        nodes.push(
          rect(50, h, {
            fill: col,
            stroke: i === 18 && sp > 0.2 ? ROLE.focus : col,
            width: i === 18 && sp > 0.2 ? 3.0 : 1.4,
            radius: 5,
          })
            .at(cx, baseY - h * 0.5)
            .opacity(0.9 * a)
            .glow(isSpike ? 12 : i === 18 && sp > 0.2 ? 10 : 4, col),
        );
        if (i === 0 || i === 9 || i === 18 || i === 19) {
          nodes.push(
            txt(`${ms}ms`, cx, baseY + 40, 26, isSpike ? ROLE.runB : ROLE.runA, 'mono').opacity(a),
          );
        }
      });

      // Rank 19 laser marker for pooled p95 = 1 ms (label anchored left so it stays clear of rank 20 spike!)
      if (sp > 0.1) {
        const x19 = xLeft + 18 * stepX;
        nodes.push(
          dashedRule(x19, -95, x19, baseY - 26, ROLE.focus, 0.9 * a * sp, 3.0),
          txt('rank 19', x19 - 16, -112, 26, ROLE.focus, 'mono', 'right').opacity(a * sp),
          txt('POOLED 20-GAP p95', -540, 236, 26, COSMOS.muted, 'mono').opacity(a * sp),
          txt(`${pooledP95} ms`, -540, 296, 52, ROLE.runA, 'mono')
            .glow(9, ROLE.runA)
            .opacity(a * sp),
        );
      }

      // Per-request worst [1, 100] -> p95 = 100 ms
      if (sr > 0.1) {
        nodes.push(
          txt('PER-REQUEST WORST [1, 100]', 460, 236, 26, COSMOS.muted, 'mono').opacity(a * sr),
          txt(`${perReqP95} ms`, 460, 296, 52, ROLE.runB, 'mono')
            .glow(9, ROLE.runB)
            .opacity(a * sr),
        );
      }

      // Averaging fallacy (1 + 100) / 2 = 50.5 ms
      if (sm > 0.1) {
        nodes.push(
          txt(
            'AVERAGING TWO RUN p95s = 50.5 ms (RECONSTRUCTS NEITHER!)  ·  KEEP RAW / MERGEABLE SAMPLES',
            0,
            408,
            26,
            ROLE.fail,
            'mono',
          )
            .glow(6, ROLE.fail)
            .opacity(a * sm),
        );
      } else {
        nodes.push(
          txt(
            'Pooled gaps weight longer answers more  ·  Per-request summaries weight every request equally',
            0,
            408,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, rankEq, view0, view1);
  driftValue(s, c, phase, 7, { startOffset: 0.1, endMargin: 0.5 });

  c.on('percentile-populations-beat-0', () => {
    const t = c.cue('percentile-populations-beat-0').start;
    s.play(rankLit.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.hide('percentile-populations-beat-1', rankEq);
  c.on('percentile-populations-beat-1', () => {
    const t = c.cue('percentile-populations-beat-1').start;
    s.play(mode01.to(1, { duration: clampDur(c, t, 0.5) }));
  });
  c.on('percentile-pooled', () => {
    const t = c.cue('percentile-pooled').start;
    s.play(showPooled.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('percentile-per-request', () => {
    const t = c.cue('percentile-per-request').start;
    s.play(showPerReq.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('percentile-populations-beat-2', () => {
    const t = c.cue('percentile-populations-beat-2').start;
    s.play(showMeanTrap.to(1, { duration: clampDur(c, t, 0.4) }));
  });
}
