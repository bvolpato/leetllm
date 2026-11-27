// Scene 16: Put a clock on one token. 3 compute stages of 2 ms each (6.0 ms) + 2 boundary handoffs of 0.2 ms -> 6.4 ms (strict hold until arrival-time!).
import {
  COSMOS,
  PIPE_LAT_COMPUTE,
  PIPE_LAT_TOTAL,
  PIPE_LAT_TRANSFER,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainAfterDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function pipelineLatency(s, c) {
  const pSingle = s.value(0);
  const pHandoff = s.value(0);
  const pArrival = s.value(0);
  const pProfile = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#ff6b8b16');
  const title = heroTitle(['Put a Clock on', 'One Single Token'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.gpu1,
    eyebrow: '3 × 2.0 MS COMPUTE + 2 × 0.2 MS HANDOFFS',
  });

  const stageCols = [ROLE.gpu0, ROLE.gpu1, COSMOS.gold];
  const stageFills = ['#11284a', '#0e2d3b', '#2b220f'];

  const live = guardedDynamic(1, () => {
    const sg = pSingle.value;
    const ho = pHandoff.value;
    const arr = pArrival.value > 0.5;
    const prof = pProfile.value > 0.5;

    const x0 = -560;
    const msPx = 190; // 7 ms = 1330 px -> ends at +770

    const nodes = [
      txt('ELAPSED TIME (MILLISECONDS)', -560, -210, 26, COSMOS.muted, 'mono', 'left'),
    ];

    // Ruler 0..7 ms
    for (let t = 0; t <= 7; t++) {
      const tx = x0 + t * msPx;
      nodes.push(
        txt(`${t} ms`, tx, -158, 26, COSMOS.muted, 'mono'),
        line([tx, -132], [tx, -114], { stroke: COSMOS.muted, width: 2.5 }),
      );
    }
    nodes.push(line([x0, -122], [x0 + 7 * msPx, -122], { stroke: COSMOS.rule, width: 2.5 }));

    const drawBar = (y, overheadMs, label, revealProg) => {
      nodes.push(txt(label, x0 - 30, y, 28, COSMOS.ink, 'mono', 'right'));
      for (let st = 0; st < 3; st++) {
        const startMs = st * (PIPE_LAT_COMPUTE + overheadMs);
        const sx = x0 + startMs * msPx;
        if (st > 0 && overheadMs > 0.005) {
          const hw = overheadMs * msPx;
          nodes.push(
            rect(hw, 86, { fill: '#3d1526', stroke: ROLE.bad, width: 2.2, radius: 5 })
              .at(sx - hw * 0.5, y)
              .glow(7, ROLE.bad),
          );
        }
        const cw = PIPE_LAT_COMPUTE * msPx * Math.min(1, Math.max(0.02, revealProg * 3 - st));
        if (revealProg * 3 > st) {
          nodes.push(
            rect(cw - 4, 86, {
              fill: stageFills[st],
              stroke: stageCols[st],
              width: 2.6,
              radius: 8,
            })
              .at(sx + cw * 0.5, y)
              .glow(7, stageCols[st]),
          );
          if (cw > 240) {
            nodes.push(txt(`Stage ${st + 1} · 2 ms`, sx + cw * 0.5, y, 28, stageCols[st], 'mono'));
          }
        }
      }
    };

    drawBar(-38, 0, 'Compute only', Math.max(0.35, sg));
    if (ho > 0.02) {
      drawBar(128, PIPE_LAT_TRANSFER * ho, 'With handoffs', 1);
      if (ho > 0.85) {
        nodes.push(
          txt('Each rose sliver adds a 0.2 ms inter-stage handoff', 80, 215, 28, ROLE.bad, 'sans'),
        );
      }
    }

    const foot = prof
      ? 'Profile real stage times and queues: one slow stage shifts the finish right'
      : arr
        ? `3 × 2.0 ms + 2 × 0.2 ms = ${PIPE_LAT_TOTAL.toFixed(1)} ms (+6.7% vs 6.0 ms compute)`
        : ho > 0.5
          ? 'Predict: when does this token finish stage 3 on the millisecond ruler?'
          : 'Idle pipeline slots do not lengthen a single token path (6.0 ms compute)';

    nodes.push(
      glassCell(0, 320, 1460, 84, arr ? ROLE.good : ho > 0.5 ? COSMOS.gold : ROLE.gpu1, {
        fill: '#10182b',
        glow: 8,
      }),
      txt(foot, 0, 320, 28, arr ? ROLE.good : ho > 0.5 ? COSMOS.gold : COSMOS.ink, 'mono'),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('single-token', () =>
    s.play(pSingle.to(1, { duration: remainDuration(c, 'single-token', 0.85) })),
  );
  c.on('two-handoffs', () =>
    s.play(pHandoff.to(1, { duration: remainDuration(c, 'two-handoffs', 0.8) })),
  );
  c.after('arrival-time', () =>
    s.play(pArrival.to(1, { duration: remainAfterDuration(c, 'arrival-time', 0.4) })),
  );
  c.on('profile-stages', () =>
    s.play(pProfile.to(1, { duration: remainDuration(c, 'profile-stages', 0.4) })),
  );
}
