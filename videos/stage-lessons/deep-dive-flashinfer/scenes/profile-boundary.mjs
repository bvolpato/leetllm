// Scene 24: What happens when attention takes half the time? Amdahl 3.0ms -> 2.2ms (1.36x) + Nsight Systems vs Nsight Compute.
import {
  COSMOS,
  PROFILE_HALF_TOTAL,
  PROFILE_ORIG_TOTAL,
  PROFILE_SPEEDUP,
  PROFILE_STAGES,
  ROLE,
  aura,
  delay,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  par,
  rect,
  remainAfter,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function profileBoundary(s, c) {
  const showBars = s.value(1);
  const showTotal = s.value(0);
  const askHalf = s.value(0);
  const shrinkAnim = s.value(0); // shrinks attention bar 1.6 -> 0.8
  const revNewTotal = s.value(0); // strictly withheld until fi-profile-boundary-1-result!
  const revSpeed = s.value(0); // strictly withheld until fi-profile-boundary-speed!
  const showProfilers = s.value(0);
  const compOn = s.value(0);
  const diagRule = s.value(0);

  const bgAura = aura(0, 20, 660, '#5ce1e61c', '#ffd1661a');

  const title = heroTitle(['When Attention Takes', 'Half the Time'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.r2,
    eyebrow: 'WHOLE-CALL PROFILING · AMDAHL BOUNDARY',
    subtitle: 'Plan 0.8 + Copy 0.2 + Launch 0.1 + Attention 1.6 + Merge 0.3 ms',
  });

  // Map ms in [0, 3.2] -> x in [-720, 720]
  const mapMs = (ms) => -720 + (ms / 3.2) * 1440;

  const barsView = guardedDynamic(showBars, (a) => {
    const tot = showTotal.value;
    const ask = askHalf.value;
    const sh = shrinkAnim.value;
    const nt = revNewTotal.value;
    const sp = revSpeed.value;

    const nodes = [
      txt(
        'SERIAL END-TO-END CALL PROFILE (MILLISECONDS)',
        0,
        -162,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),
      line([mapMs(0), 215], [mapMs(3.2), 215], { stroke: COSMOS.rule, width: 3 }).opacity(a),
    ];

    // Ruler ticks 0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0
    for (let i = 0; i <= 6; i++) {
      const v = i * 0.5;
      const tx = mapMs(v);
      nodes.push(
        line([tx, 205], [tx, 225], { stroke: COSMOS.muted, width: 2.5 }).opacity(a),
        txt(`${v.toFixed(1)}`, tx, 252, 26, COSMOS.muted, 'mono').opacity(a),
      );
    }

    // Top bar: Original 3.0 ms
    const topY = -68;
    nodes.push(txt('ORIGINAL', -855, topY, 26, COSMOS.muted, 'mono', 'left').opacity(a));
    let cur = 0;
    PROFILE_STAGES.forEach((st) => {
      const x0 = mapMs(cur);
      const x1 = mapMs(cur + st.ms);
      const w = x1 - x0 - 4;
      const cx = (x0 + x1) * 0.5;
      nodes.push(
        rect(w, 78, { fill: '#102038', stroke: st.color, width: 2.5, radius: 8 })
          .at(cx, topY)
          .opacity(a),
      );
      if (w >= 175) {
        nodes.push(txt(`${st.label} ${st.ms}`, cx, topY, 26, st.color, 'mono').opacity(a));
      } else if (w >= 100) {
        nodes.push(txt(`${st.ms}`, cx, topY, 26, st.color, 'mono').opacity(a));
      }
      cur += st.ms;
    });
    if (tot > 0.05) {
      nodes.push(
        txt(`${PROFILE_ORIG_TOTAL.toFixed(1)} ms`, mapMs(3.0) + 74, topY, 28, COSMOS.gold, 'mono')
          .glow(5, COSMOS.gold)
          .opacity(tot * a),
      );
    }
    // Overhead group callout above first 1.1 ms
    nodes.push(
      txt(
        'Overhead: 1.1 ms (fixed)',
        (mapMs(0) + mapMs(1.1)) * 0.5,
        topY - 62,
        26,
        ROLE.warn,
        'mono',
      ).opacity(a),
    );

    // Bottom bar: Halved Attention (1.6 -> 0.8), only moves once shrinkAnim starts!
    const botY = 98;
    nodes.push(
      txt('2× ATTN', -855, botY, 26, sh > 0.1 ? ROLE.good : COSMOS.dim, 'mono', 'left').opacity(a),
    );
    let cur2 = 0;
    PROFILE_STAGES.forEach((st, idx) => {
      const dur = idx === 3 ? st.ms * (1 - 0.5 * sh) : st.ms;
      const x0 = mapMs(cur2);
      const x1 = mapMs(cur2 + dur);
      const w = x1 - x0 - 4;
      const cx = (x0 + x1) * 0.5;
      nodes.push(
        rect(w, 78, {
          fill: idx === 3 && sh > 0.3 ? '#0f2d28' : '#0f1b33',
          stroke: idx === 3 && sh > 0.3 ? ROLE.good : st.color,
          width: 2.5,
          radius: 8,
        })
          .at(cx, botY)
          .glow(idx === 3 && sh > 0.3 ? 9 : 0, ROLE.good)
          .opacity(a),
      );
      if (w >= 175) {
        nodes.push(
          txt(
            idx === 3 ? `Attn ${dur.toFixed(1)}` : `${st.label} ${st.ms}`,
            cx,
            botY,
            26,
            idx === 3 && sh > 0.3 ? ROLE.good : st.color,
            'mono',
          ).opacity(a),
        );
      } else if (w >= 100) {
        nodes.push(txt(`${st.ms}`, cx, botY, 26, st.color, 'mono').opacity(a));
      }
      cur2 += dur;
    });
    if (nt > 0.05) {
      nodes.push(
        txt(`${PROFILE_HALF_TOTAL.toFixed(1)} ms`, mapMs(2.2) + 74, botY, 28, ROLE.good, 'mono')
          .glow(6, ROLE.good)
          .opacity(nt * a),
      );
    }

    // Bottom readout box (withholds 2.2 ms and 1.36x until respective cues, stays A8-true during shrink!)
    let bCol = COSMOS.cyan;
    let bLine = 'Overhead = 1.1 ms · Attention = 1.6 ms · Merge = 0.3 ms';
    if (ask > 0.5 && sh < 0.05) {
      bCol = COSMOS.gold;
      bLine = 'Predict: if attention halves (1.6 -> 0.8 ms), where does the whole call finish?';
    } else if (sh >= 0.05 && nt < 0.5) {
      bCol = COSMOS.cyan;
      bLine = 'Shrinking attention 1.6 -> 0.8 ms · merge slides left with it...';
    } else if (nt > 0.5 && sp < 0.5) {
      bCol = ROLE.good;
      bLine = `Merge slides left -> 1.1 + 0.8 + 0.3 = ${PROFILE_HALF_TOTAL.toFixed(1)} ms whole call`;
    } else if (sp > 0.5) {
      bCol = ROLE.good;
      bLine = `Whole-call speedup: ${PROFILE_ORIG_TOTAL.toFixed(1)} / ${PROFILE_HALF_TOTAL.toFixed(1)} ≈ ${PROFILE_SPEEDUP.toFixed(2)}× (not 2.0×!)`;
    }

    nodes.push(
      glassCell(0, 355, 1600, 108, bCol, { fill: '#0e172a', glow: 9, opacity: a }),
      txt(bLine, 0, 355, 28, bCol, 'mono').glow(5, bCol).opacity(a),
    );

    return group(...nodes);
  });

  // View 1: Nsight Systems (timeline boundary) vs Nsight Compute (kernel roofline/stalls)
  const profView = guardedDynamic(showProfilers, (a) => {
    const co = compOn.value;
    const dr = diagRule.value;
    const nodes = [
      txt('CHOOSE THE RIGHT PROFILER BOUNDARY FIRST', 0, -155, 28, COSMOS.gold, 'mono').opacity(a),

      glassCell(-440, 35, 740, 240, ROLE.r0, { fill: '#10213d', glow: 9, opacity: a }),
      txt('NSIGHT SYSTEMS (SYSTEM TIMELINE)', -440, -34, 26, ROLE.r0, 'mono').opacity(a),
      txt('Host plan() · metadata H2D copies', -440, 24, 28, COSMOS.ink, 'sans').opacity(a),
      txt('Stream dependencies & launch gaps', -440, 82, 26, COSMOS.muted, 'sans').opacity(a),

      glassCell(440, 35, 740, 240, co > 0.5 ? ROLE.r2 : COSMOS.dim, {
        fill: co > 0.5 ? '#0f2838' : '#0c1222',
        glow: co > 0.5 ? 10 : 3,
        opacity: a,
      }),
      txt('NSIGHT COMPUTE (SINGLE KERNEL)', 440, -34, 26, ROLE.r2, 'mono').opacity(a),
      txt('Memory workload & arithmetic intensity', 440, 24, 28, COSMOS.ink, 'sans').opacity(a),
      txt('Occupancy limits & warp stall reasons', 440, 82, 26, COSMOS.muted, 'sans').opacity(a),
    ];

    if (dr > 0.05) {
      nodes.push(
        glassCell(0, 295, 1640, 124, ROLE.good, { fill: '#0e2824', glow: 9, opacity: dr * a }),
        txt(
          'Memory-bound -> check page access / precision · Compute-bound -> check tile / backend',
          0,
          295,
          28,
          ROLE.good,
          'mono',
        ).opacity(dr * a),
      );
    }
    return group(...nodes);
  });

  s.add(bgAura, title, barsView, profView);

  c.on('fi-profile-boundary-0', () =>
    s.play(showTotal.to(0.2, { duration: remainDuration(c, 'fi-profile-boundary-0', 0.35) })),
  );
  c.on('fi-profile-boundary-total', () =>
    s.play(showTotal.to(1, { duration: remainDuration(c, 'fi-profile-boundary-total', 0.35) })),
  );
  c.on('fi-profile-boundary-0-result', () =>
    s.play(askHalf.to(1, { duration: remainDuration(c, 'fi-profile-boundary-0-result', 0.35) })),
  );
  c.on('fi-profile-boundary-1', () =>
    s.play(shrinkAnim.to(1, { duration: remainDuration(c, 'fi-profile-boundary-1', 0.6) })),
  );
  c.after('fi-profile-boundary-1-result', () =>
    s.play(revNewTotal.to(1, { duration: remainAfter(c, 'fi-profile-boundary-1-result', 0.4) })),
  );
  c.after('fi-profile-boundary-speed', () =>
    s.play(revSpeed.to(1, { duration: remainAfter(c, 'fi-profile-boundary-speed', 0.4) })),
  );
  c.on('fi-profile-boundary-2', () => {
    s.play(
      par(showBars.to(0, { duration: 0.18 }), delay(showProfilers.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('profile-compute', () =>
    s.play(compOn.to(1, { duration: remainDuration(c, 'profile-compute', 0.4) })),
  );
  c.on('fi-profile-boundary-2-result', () =>
    s.play(diagRule.to(1, { duration: remainDuration(c, 'fi-profile-boundary-2-result', 0.4) })),
  );
}
