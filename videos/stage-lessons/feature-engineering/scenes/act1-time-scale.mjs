// Act 1 (Scenes 1-6): Intro Rewind & Leakage, Decision-Time Dual Clocks,
// Temporal Contract & Revisions, Numerical Scale, Welford Running Statistics, Scale Artifact.
import { circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  INTRO_JOBS,
  REVISION_RECORDS,
  ROLE,
  beatTo,
  cinemaGrid,
  clock,
  cueTo,
  decorAura,
  eligibleFeatureEvent,
  fadeIn,
  fadeOut,
  glowBadge,
  glowBar,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  iqr,
  livingDrift,
  mean,
  median,
  mix,
  numCell,
  quantile,
  robustFortyTwo,
  robustOutlier,
  rule,
  scaleRows,
  standardFortyTwo,
  std,
  txt,
  welfordTrace,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. intro: Which field could warn us at nine?
// Cues: intro-flags, intro-reading, intro-rewind, intro-backlogs,
//       intro-predict*, intro-finish*, intro-count*, intro-copy*
// ---------------------------------------------------------------------------
export function intro(s, c) {
  const flagP = s.value(0);
  const readP = s.value(0);
  const rewindP = s.value(0);
  const jobsP = s.value(0);
  const predP = s.value(0);
  const finP = s.value(0);
  const cntP = s.value(0);
  const cpyP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.eligible, seed: 1 }));
  s.add(decorAura(-420, 40, 480, '#5ce1e61c', '#ff6b8b14'));

  const headline = heroTitle(['Rewind the Record', 'to 09:00 Scoring'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.eligible,
    eyebrow: 'POINT-IN-TIME FEATURES  ·  JOB J-204',
  });

  // View 1: Rewinding J-204 from post-deadline escalation stamp back to 09:00 UTC
  const view1 = guardedDynamic(
    () => fadeOut(jobsP.value),
    (vis) => {
      const fl = flagP.value;
      const rd = readP.value;
      const rw = rewindP.value;
      const nodes = [];

      // Left: Pre-decision queue count (always readable at 09:00)
      nodes.push(
        txt('KNOWN AT 09:00 UTC  (MAY 1)', -780, -170, 28, ROLE.eligible, 'mono', 'left'),
        txt('18', -630, 15, 132, ROLE.eligible, 'mono').glow(14 * Math.max(0.4, rd), ROLE.eligible),
        txt('jobs waiting in queue', -460, 25, 36, COSMOS.ink, 'serif', 'left'),
        txt('Stays intact when time rewinds', -780, 165, 28, ROLE.good, 'sans', 'left').opacity(
          mix(0.45, 1, rw),
        ),
      );

      nodes.push(rule(0, -190, 0, 230, '#2a3759', 2));

      // Right: Post-deadline escalation stamp lifting off as time rewinds
      const stampLift = rw * 155;
      const stampAlpha = Math.max(0, 1 - rw * 1.15);
      nodes.push(
        txt(
          rw > 0.65 ? 'AT 09:00 UTC  (BEFORE DEADLINE)' : 'RECORDED AFTER MAY 2 DEADLINE',
          100,
          -170,
          28,
          rw > 0.65 ? ROLE.clock : ROLE.leak,
          'mono',
          'left',
        ),
      );
      if (stampAlpha > 0.04) {
        nodes.push(
          group(
            rect(430, 112, {
              fill: '#2b101d',
              stroke: ROLE.leak,
              width: 3.5,
              radius: 14,
            })
              .at(420, 15 - stampLift)
              .glow(12 * Math.max(0.3, fl), ROLE.leak),
            txt('ESCALATED', 420, 18 - stampLift, 48, ROLE.leak, 'mono'),
          ).opacity(stampAlpha),
        );
      }
      if (rw > 0.55) {
        nodes.push(
          txt('NO STAMP EXISTS YET', 420, 18, 42, ROLE.clock, 'mono')
            .glow(10, ROLE.clock)
            .opacity((rw - 0.55) / 0.45),
        );
      }
      nodes.push(
        txt(
          rw > 0.65
            ? 'Stamp vanishes at 09:00; only queue count can warn us'
            : 'Which field could the scheduler read at 09:00?',
          0,
          310,
          32,
          ROLE.clock,
          'serif',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 2: Four completed jobs tested against queue > 10 vs leaky escalation flag
  const view2 = guardedDynamic(
    () => fadeIn(jobsP.value),
    (vis) => {
      const pr = predP.value;
      const fn = finP.value;
      const ct = cntP.value;
      const cp = cpyP.value;
      const nodes = [];

      const barX = -690;
      const unit = 16;
      const cutX = barX + 10 * unit;

      nodes.push(
        txt('JOB', -780, -210, 26, COSMOS.muted, 'mono'),
        txt('QUEUE AT 09:00', -495, -210, 26, ROLE.eligible, 'mono'),
        txt('PREDICT (>10)', -45, -210, 26, ROLE.clock, 'mono'),
        txt('MISSED?', 320, -210, 26, ROLE.leak, 'mono'),
        txt('ESCALATED?', 650, -210, 26, ROLE.leak, 'mono'),
        line([cutX, -170], [cutX, 185], { stroke: ROLE.clock, width: 3, dash: [8, 6] }),
        txt('limit 10', cutX, 222, 26, ROLE.clock, 'mono'),
      );

      INTRO_JOBS.forEach((job, i) => {
        const y = -115 + i * 88;
        const flag = job.backlog > 10;
        const hit = flag === job.missed;
        nodes.push(
          txt(`J${job.id}`, -780, y, 30, COSMOS.ink, 'mono'),
          glowBar(barX, y, job.backlog * unit, 28, ROLE.eligible, { glow: 7 }),
          txt(`${job.backlog}`, barX + job.backlog * unit + 34, y, 30, ROLE.eligible, 'mono'),
          txt(
            pr > 0.2 ? (flag ? 'Yes' : 'No') : '?',
            -45,
            y,
            32,
            pr > 0.2 ? (flag ? ROLE.clock : COSMOS.muted) : COSMOS.dim,
            'mono',
          ),
          ct > 0.2
            ? txt(hit ? 'OK' : 'X', 95, y, 28, hit ? ROLE.good : ROLE.leak, 'mono').opacity(ct)
            : group(),
          txt(
            fn > 0.2 ? (job.missed ? 'Yes' : 'No') : '?',
            320,
            y,
            32,
            fn > 0.2 ? (job.missed ? ROLE.leak : COSMOS.muted) : COSMOS.dim,
            'mono',
          ),
          txt(
            cp > 0.2 ? (job.escalation ? 'Yes' : 'No') : '?',
            650,
            y,
            32,
            cp > 0.2 ? (job.escalation ? ROLE.leak : COSMOS.muted) : COSMOS.dim,
            'mono',
          ),
        );
      });

      nodes.push(
        txt(
          cp > 0.2
            ? 'Backlog rule: 2 / 4 honest   |   Escalation flag: 4 / 4 LEAKAGE!'
            : ct > 0.2
              ? 'Backlog rule (> 10): 2 / 4 correct from 09:00 data'
              : 'Rule: predict a miss if > 10 jobs are waiting',
          0,
          325,
          32,
          cp > 0.2 ? ROLE.leak : ROLE.clock,
          'serif',
        ).glow(cp > 0.2 ? 8 : 0, ROLE.leak),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'intro-flags', flagP, 1, { dur: 0.7 });
  cueTo(s, c, 'intro-reading', readP, 1, { dur: 0.7 });
  cueTo(s, c, 'intro-rewind', rewindP, 1, { dur: 0.95 });
  cueTo(s, c, 'intro-backlogs', jobsP, 1, { dur: 0.8 });
  cueTo(s, c, 'intro-predict', predP, 1, { dur: 0.6, after: true });
  cueTo(s, c, 'intro-finish', finP, 1, { dur: 0.6, after: true });
  cueTo(s, c, 'intro-count', cntP, 1, { dur: 0.6, after: true });
  cueTo(s, c, 'intro-copy', cpyP, 1, { dur: 0.6, after: true });
}

// ---------------------------------------------------------------------------
// 2. decision-time: Which heartbeat belongs to J-204?
// Cues: decision-packets, decision-filter, decision-selected*,
//       decision-time-beat-2-focus-2*, decision-noon
// ---------------------------------------------------------------------------
export function decisionTime(s, c) {
  const pktP = s.value(0);
  const filP = s.value(0);
  const selP = s.value(0);
  const ageP = s.value(0);
  const noonP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.clock, seed: 2 }));
  s.add(decorAura(240, 20, 520, '#ffd1661c', '#5ce1e614'));

  const headline = heroTitle(['Event Time vs', 'Readable Time'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.clock,
    eyebrow: 'DUAL-CLOCK CUTOFF  ·  09:00 DECISION BARRIER',
  });

  const rows = [
    { sent: '01:00', read: '01:01', mSent: 60, mRead: 61, kind: 'earlier' },
    { sent: '08:30', read: '08:31', mSent: 510, mRead: 511, kind: 'winner' },
    { sent: '08:50', read: '09:15', mSent: 530, mRead: 555, kind: 'late' },
    { sent: '12:00', read: '12:01', mSent: 720, mRead: 721, kind: 'future' },
  ];

  const live = dynamic(() => {
    const fl = filP.value;
    const sl = selP.value;
    const ag = ageP.value;
    const nn = noonP.value;
    const nodes = [];

    const x0 = -160;
    const x1 = 760;
    const xOf = (m) => mix(x0, x1, (m - 495) / 75); // 08:15 (495) to 09:30 (570)
    const cutX = xOf(540); // 09:00

    nodes.push(
      txt('SENT', -760, -210, 26, COSMOS.muted, 'mono'),
      txt('READABLE', -520, -210, 26, COSMOS.muted, 'mono'),
      txt('09:00 DECISION', cutX, -210, 28, ROLE.clock, 'mono').glow(7, ROLE.clock),
      line([cutX, -172], [cutX, 175], { stroke: ROLE.clock, width: 3.5 }),
      rule(x0, 185, x1, 185, '#3b4e78', 2.4),
    );

    [510, 525, 540, 555].forEach((m) => {
      const tx = xOf(m);
      nodes.push(
        line([tx, 180], [tx, 196], { stroke: COSMOS.muted, width: 2 }),
        txt(clock(m), tx, 228, 26, m === 540 ? ROLE.clock : COSMOS.muted, 'mono'),
      );
    });

    rows.forEach((row, i) => {
      const y = -115 + i * 82;
      const isWinner = row.kind === 'winner' && sl > 0.2;
      const isLate = row.kind === 'late' && fl > 0.2;
      const isFuture = row.kind === 'future' && nn > 0.15;
      const col = isWinner
        ? ROLE.good
        : isLate || isFuture
          ? ROLE.leak
          : row.kind === 'future' && nn < 0.15
            ? COSMOS.dim
            : ROLE.eligible;

      nodes.push(txt(row.sent, -760, y, 32, col, 'mono'), txt(row.read, -520, y, 32, col, 'mono'));

      if (row.kind === 'earlier') {
        nodes.push(
          line([x0 + 90, y], [x0 + 8, y], { stroke: col, width: 3 }),
          txt('earlier (01:00)', x0 + 235, y, 26, COSMOS.muted, 'mono'),
        );
      } else if (row.kind === 'future') {
        nodes.push(
          line([x1 - 90, y], [x1 - 8, y], { stroke: col, width: 3 }),
          txt(
            isFuture ? 'future (−3h)' : 'later (12:00)',
            x1 - 100,
            y,
            26,
            isFuture ? ROLE.leak : COSMOS.dim,
            'mono',
            'right',
          ),
        );
      } else {
        const sx = xOf(row.mSent);
        const rx = xOf(row.mRead);
        nodes.push(
          line([sx, y], [rx, y], { stroke: col, width: 6 }).glow(isWinner || isLate ? 10 : 4, col),
          glowDot(sx, y, { radius: 9, color: col, glow: 8 }),
          circle(10, { fill: COSMOS.bg, stroke: col, width: 3.5 }).at(rx, y),
        );
        if (isLate) {
          nodes.push(txt('CROSSES 09:00!', rx, y - 34, 26, ROLE.leak, 'mono'));
        }
        if (isWinner) {
          nodes.push(txt('ELIGIBLE', rx + 24, y, 26, ROLE.good, 'mono', 'left'));
        }
      }
    });

    nodes.push(
      txt(
        nn > 0.2
          ? 'Both tests required:  t_event ≤ 09:00  AND  t_available ≤ 09:00'
          : ag > 0.2
            ? 'Selected 08:30  →  age = 09:00 − 08:30 = 30 min = 0.5 h'
            : 'Which ping sets the heartbeat age at 09:00?',
        0,
        325,
        32,
        nn > 0.2 ? ROLE.leak : ag > 0.2 ? ROLE.good : ROLE.clock,
        'mono',
      ).glow(ag > 0.2 ? 9 : 0, ROLE.good),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'decision-packets', pktP, 1, { dur: 0.7 });
  cueTo(s, c, 'decision-filter', filP, 1, { dur: 0.7 });
  cueTo(s, c, 'decision-selected', selP, 1, { dur: 0.65, after: true });
  cueTo(s, c, 'decision-time-beat-2-focus-2', ageP, 1, { dur: 0.65, after: true });
  cueTo(s, c, 'decision-noon', noonP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 3. temporal-contract: Two copies of the same ping
// Cues: temporal-contract-0, temporal-contract-1*, temporal-contract-2*
// ---------------------------------------------------------------------------
export function temporalContract(s, c) {
  const revP = s.value(0);
  const pickP = s.value(0);
  const beat2P = s.value(0);
  const finP = s.value(0);
  const drift = s.value(0);

  const winner = eligibleFeatureEvent(REVISION_RECORDS, 540, 'J-204');

  s.add(cinemaGrid({ accent: ROLE.eligible, seed: 3 }));
  s.add(decorAura(0, 30, 540, '#5ce1e61a', '#ffd16614'));

  const headline = heroTitle(['Revisions & Outcome', 'Ledger Separation'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.eligible,
    eyebrow: 'REVISION HISTORY  ·  J-204 AT 09:00',
  });

  // View 1 (Beats 0-1): Revision history table filtering on Job + Event + Available
  const view1 = guardedDynamic(
    () => fadeOut(beat2P.value),
    (vis) => {
      const pk = pickP.value;
      const nodes = [];
      const cols = [-740, -450, -210, 40, 450];
      ['JOB', 'PING SENT', 'REV', 'READABLE', 'AT 09:00'].forEach((h, i) => {
        nodes.push(txt(h, cols[i], -210, 26, COSMOS.muted, 'mono'));
      });
      nodes.push(rule(-830, -175, 810, -175, '#2a3759', 2));

      REVISION_RECORDS.forEach((r, i) => {
        const y = -112 + i * 74;
        const isWin = r === winner;
        const verdict =
          r.job !== 'J-204'
            ? 'Wrong job'
            : r.event > 540
              ? 'Future ping'
              : r.available > 540
                ? 'Late revision'
                : 'USE REV 1';
        const col = pk < 0.2 ? COSMOS.ink : isWin ? ROLE.good : COSMOS.muted;
        const vCol = pk < 0.2 ? COSMOS.dim : isWin ? ROLE.good : ROLE.leak;

        nodes.push(
          txt(r.job, cols[0], y, 30, col, 'mono'),
          txt(clock(r.event), cols[1], y, 30, col, 'mono'),
          txt(`r${r.revision}`, cols[2], y, 30, col, 'mono'),
          txt(clock(r.available), cols[3], y, 30, col, 'mono'),
          txt(pk > 0.2 ? verdict : '?', cols[4], y, 30, vCol, 'mono').glow(
            pk > 0.2 && isWin ? 10 : 0,
            ROLE.good,
          ),
        );
      });

      nodes.push(
        txt(
          pk > 0.2
            ? 'Keep Rev 1 (08:31); the 09:05 correction belongs to a later view'
            : 'Which revision of the 08:30 ping belongs to J-204 at 09:00?',
          0,
          315,
          30,
          pk > 0.2 ? ROLE.good : ROLE.clock,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): May 1 Decision -> May 2 Deadline -> May 3 Finish (Label = 1)
  const view2 = guardedDynamic(
    () => fadeIn(beat2P.value),
    (vis) => {
      const fn = finP.value;
      const nodes = [];
      const xOf = (h) => mix(-680, 680, h / 53);

      nodes.push(
        txt('SEPARATE LABEL LEDGER  ·  JOB J-204', -740, -195, 28, ROLE.clock, 'mono', 'left'),
        rule(-700, 10, 700, 10, '#3a4f7a', 4),
      );

      const stops = [
        { h: 0, stamp: 'May 1  09:00', name: 'Decision', col: ROLE.eligible, show: 1 },
        { h: 24, stamp: 'May 2  09:00', name: 'Deadline', col: ROLE.clock, show: 1 },
        {
          h: 53,
          stamp: 'May 3  14:00',
          name: 'Finish (late)',
          col: ROLE.leak,
          show: mix(0.28, 1, fn),
        },
      ];
      stops.forEach((st) => {
        const px = xOf(st.h);
        nodes.push(
          group(
            glowDot(px, 10, { radius: 15, color: st.col, glow: 12 }),
            txt(st.stamp, px, -65, 30, st.col, 'mono'),
            txt(st.name, px, 90, 32, st.col, 'serif'),
          ).opacity(st.show),
        );
      });

      nodes.push(
        txt(
          fn > 0.2
            ? 'Finished May 3 > Deadline May 2   →   training label y = 1 (kept outside input row!)'
            : 'Let J-204 run past its 24-hour May 2 deadline...',
          0,
          255,
          32,
          fn > 0.2 ? ROLE.leak : COSMOS.muted,
          'serif',
        ).glow(fn > 0.2 ? 8 : 0, ROLE.leak),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'temporal-contract-0', revP, 1, { dur: 0.7 });
  cueTo(s, c, 'temporal-contract-1', pickP, 1, { dur: 0.7, after: true });
  beatTo(s, c, 2, beat2P, 1, { dur: 0.8 });
  cueTo(s, c, 'temporal-contract-2', finP, 1, { dur: 0.7, after: true });
}

// ---------------------------------------------------------------------------
// 4. numerical-scale: Choose a scale that preserves useful differences
// Cues: numerical-scale-beat-1-focus-1, feature-standard-separation,
//       numerical-scale-beat-2-focus-1, feature-robust-map,
//       numerical-scale-beat-3-focus-1
// ---------------------------------------------------------------------------
export function numericalScale(s, c) {
  const stdP = s.value(0);
  const sepP = s.value(0);
  const robP = s.value(0);
  const outP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.eligible, seed: 4 }));
  s.add(decorAura(0, 40, 560, '#5ce1e61a', '#ff6b8b14'));

  const headline = heroTitle(['Standard vs Robust', 'Scaling Under Outliers'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.eligible,
    eyebrow: '8 QUEUE WAITS:  [5, 12, 18, 24, 30, 42, 55, 12,000 MIN]',
  });

  const live = dynamic(() => {
    const sp = sepP.value;
    const rb = robP.value;
    const ot = outP.value;
    const nodes = [];

    const x0 = -760;
    const x1 = 760;
    const yStd = -105;
    const yRob = 125;

    // Top ruler: Standard scaling z = (x - 1523.25) / 3959.9
    nodes.push(
      txt(
        `STANDARD SCALING   μ = ${mean.toFixed(2)},  σ = ${std.toFixed(1)}`,
        x0,
        yStd - 88,
        28,
        ROLE.leak,
        'mono',
        'left',
      ),
      rule(x0, yStd, x1, yStd, '#3b4e78', 3),
    );
    const xStd = (z) => mix(x0, x1, (z + 0.6) / 3.4);
    scaleRows.forEach((row) => {
      const px = xStd(row.standard);
      const isOut = row.wait === 12000;
      const is42 = row.wait === 42;
      nodes.push(
        glowDot(px, yStd, {
          radius: isOut || is42 ? 12 : 8,
          color: isOut ? ROLE.leak : is42 ? ROLE.clock : ROLE.eligible,
          glow: isOut || is42 ? 11 : 5,
        }),
      );
    });
    nodes.push(
      txt('5m..55m crushed!', xStd(-0.37) + 95, yStd + 48, 26, ROLE.clock, 'mono'),
      txt('12,000m (z = +2.65)', xStd(2.65) - 70, yStd + 48, 26, ROLE.leak, 'mono'),
      txt(
        sp > 0.2
          ? `z(42) = ${standardFortyTwo.toFixed(3)}   ·   Δ(5m, 42m) ≈ 0.009`
          : 'Extreme outlier drags mean to 1,523 min',
        x1,
        yStd - 88,
        26,
        sp > 0.2 ? ROLE.clock : COSMOS.muted,
        'mono',
        'right',
      ),
    );

    // Bottom ruler: Robust scaling (x - 27) / 28.75 (zoomed [-1.2, +1.5] + off-scale arrow for 416.5)
    nodes.push(
      txt(
        `ROBUST SCALING   med = ${median},  IQR = ${iqr}`,
        x0,
        yRob - 88,
        28,
        ROLE.good,
        'mono',
        'left',
      ).opacity(mix(0.55, 1, rb)),
      rule(x0, yRob, x1 - 240, yRob, '#3b4e78', 3).opacity(mix(0.55, 1, rb)),
    );
    const xRob = (r) => mix(x0 + 30, x1 - 280, (r + 1.0) / 2.2);
    scaleRows.slice(0, 7).forEach((row) => {
      const px = xRob(row.robust);
      const is42 = row.wait === 42;
      nodes.push(
        glowDot(px, yRob, {
          radius: is42 ? 13 : 9,
          color: is42 ? ROLE.good : ROLE.eligible,
          glow: is42 ? 12 : 5,
          opacity: mix(0.45, 1, rb),
        }),
      );
    });
    nodes.push(
      txt('5m', xRob(scaleRows[0].robust), yRob + 48, 26, COSMOS.muted, 'mono').opacity(
        mix(0.45, 1, rb),
      ),
      txt(
        `42m → +${robustFortyTwo.toFixed(3)}`,
        xRob(robustFortyTwo),
        yRob + 48,
        28,
        ROLE.good,
        'mono',
      )
        .glow(rb > 0.2 ? 8 : 0, ROLE.good)
        .opacity(mix(0.45, 1, rb)),
      txt('55m', xRob(scaleRows[6].robust), yRob + 48, 26, COSMOS.muted, 'mono').opacity(
        mix(0.45, 1, rb),
      ),
      glowBadge(`12,000m → +${robustOutlier.toFixed(1)}`, x1 - 105, yRob, ROLE.leak, {
        w: 280,
        h: 56,
        size: 26,
        opacity: mix(0.45, 1, ot),
      }),
    );

    nodes.push(
      txt(
        ot > 0.2
          ? 'Robust scaling preserves ordinary spread WITHOUT clipping the 12,000m tail'
          : 'Median & IQR isolate ordinary queue waits from the extreme outlier',
        0,
        310,
        30,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'numerical-scale-beat-1-focus-1', stdP, 1, { dur: 0.7 });
  cueTo(s, c, 'feature-standard-separation', sepP, 1, { dur: 0.7 });
  cueTo(s, c, 'numerical-scale-beat-2-focus-1', robP, 0.35, { dur: 0.55 });
  cueTo(s, c, 'feature-robust-map', robP, 1, { dur: 0.85 });
  cueTo(s, c, 'numerical-scale-beat-3-focus-1', outP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 5. running-statistics: Keep a running mean as readings arrive (Welford)
// Cues: running-statistics-0, welford-first, welford-second, welford-second-mean,
//       welford-second-product, welford-third, welford-third-mean,
//       welford-third-product, feature-welford-variance
// ---------------------------------------------------------------------------
export function runningStatistics(s, c) {
  const s1P = s.value(0);
  const s2P = s.value(0);
  const s2mP = s.value(0);
  const s2pP = s.value(0);
  const s3P = s.value(0);
  const s3mP = s.value(0);
  const s3pP = s.value(0);
  const varP = s.value(0);
  const drift = s.value(0);

  const trace = welfordTrace([2, 4, 6]);

  s.add(cinemaGrid({ accent: ROLE.good, seed: 5 }));
  s.add(decorAura(0, 20, 560, '#6ee7b71a', '#5ce1e614'));

  const headline = heroTitle(['Welford Online', 'Mean & Variance'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'SINGLE-PASS UPDATE  ·  READINGS [2, 4, 6]',
  });

  const eqTex = glowTex('M_2 \\leftarrow M_2 + (x - \\mu_{\\text{old}})(x - \\mu_{\\text{new}})', {
    size: 40,
    color: ROLE.clock,
    glow: 10,
  }).at(350, -395);

  const live = dynamic(() => {
    const p1 = s1P.value;
    const p2 = s2P.value;
    const p2m = s2mP.value;
    const p2p = s2pP.value;
    const p3 = s3P.value;
    const p3m = s3mP.value;
    const p3p = s3pP.value;
    const vp = varP.value;
    const nodes = [];

    // Compute live mean & M2 along [0 -> 2 -> 3 -> 4] and [0 -> 0 -> 2 -> 8]
    const liveMean = mix(0, 2, p1) + mix(0, 1, p2m) + mix(0, 1, p3m);
    const liveM2 = mix(0, 2, p2p) + mix(0, 6, p3p);
    const liveN = p3 > 0.2 ? 3 : p2 > 0.2 ? 2 : p1 > 0.2 ? 1 : 0;

    // Number line 0..7
    const x0 = -740;
    const x1 = 740;
    const yAxis = -75;
    const xOf = (v) => mix(x0, x1, v / 7);
    nodes.push(rule(x0, yAxis, x1, yAxis, '#3b4e78', 3.2));
    for (let v = 0; v <= 7; v += 1) {
      const tx = xOf(v);
      nodes.push(
        line([tx, yAxis - 10], [tx, yAxis + 10], { stroke: COSMOS.muted, width: 2 }),
        txt(`${v}`, tx, yAxis + 42, 26, COSMOS.muted, 'mono'),
      );
    }

    // Arriving readings 2, 4, 6
    const arrivals = [
      { v: 2, p: p1 },
      { v: 4, p: p2 },
      { v: 6, p: p3 },
    ];
    arrivals.forEach((a) => {
      if (a.p < 0.05) return;
      const px = xOf(a.v);
      nodes.push(
        glowDot(px, yAxis, { radius: 13, color: ROLE.eligible, glow: 11, opacity: a.p }),
        txt(`x=${a.v}`, px, yAxis - 48, 28, ROLE.eligible, 'mono').opacity(a.p),
      );
    });

    // Live running mean marker gliding along number line (kept cleanly clear of x= labels)
    const mx = xOf(liveMean);
    nodes.push(
      line([mx, yAxis - 22], [mx, yAxis + 18], { stroke: ROLE.clock, width: 4.5 }).glow(
        9,
        ROLE.clock,
      ),
      txt(`μ = ${liveMean.toFixed(2)}`, mx, yAxis - 104, 30, ROLE.clock, 'mono').glow(
        8,
        ROLE.clock,
      ),
    );

    // State strip: n, mean, M2, and variance denominators
    nodes.push(
      txt(`COUNT  n = ${liveN}`, -740, 85, 32, COSMOS.ink, 'mono', 'left'),
      txt(`MEAN  μ = ${liveMean.toFixed(2)}`, -340, 85, 32, ROLE.clock, 'mono', 'left'),
      txt(`M₂ = ${liveM2.toFixed(1)}`, 140, 85, 32, ROLE.good, 'mono', 'left').glow(8, ROLE.good),
      glowBar(360, 85, Math.max(8, (liveM2 / 8) * 380), 30, ROLE.good, { glow: 9 }),
    );

    // Step ledger & variance readout
    const stepText =
      p3p > 0.2
        ? 'x=6:  δ_old = 3, δ_new = 2  →  M₂ = 2 + 3×2 = 8'
        : p2p > 0.2
          ? 'x=4:  δ_old = 2, δ_new = 1  →  M₂ = 0 + 2×1 = 2'
          : p1 > 0.2
            ? 'x=2:  μ → 2,  δ_new = 0  →  M₂ = 0 (sample variance undefined)'
            : 'Start:  n = 0,  μ = 0,  M₂ = 0  (no stored history needed)';
    nodes.push(txt(stepText, 0, 190, 30, ROLE.eligible, 'mono'));

    nodes.push(
      txt(
        vp > 0.2
          ? `Population σ² = M₂ / 3 = ${trace[2].population.toFixed(2)}    ·    Sample s² = M₂ / 2 = ${trace[2].sample.toFixed(1)}`
          : 'Final state supplies both population (/n) and sample (/(n−1)) variance',
        0,
        295,
        32,
        vp > 0.2 ? ROLE.good : COSMOS.muted,
        'mono',
      ).glow(vp > 0.2 ? 9 : 0, ROLE.good),
    );

    return group(...nodes);
  });

  s.add(headline, eqTex, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'running-statistics-0', s1P, 0.04, { dur: 0.4 });
  cueTo(s, c, 'welford-first', s1P, 1, { dur: 0.8 });
  cueTo(s, c, 'welford-second', s2P, 1, { dur: 0.6 });
  cueTo(s, c, 'welford-second-mean', s2mP, 1, { dur: 0.7 });
  cueTo(s, c, 'welford-second-product', s2pP, 1, { dur: 0.7 });
  cueTo(s, c, 'welford-third', s3P, 1, { dur: 0.6 });
  cueTo(s, c, 'welford-third-mean', s3mP, 1, { dur: 0.7 });
  cueTo(s, c, 'welford-third-product', s3pP, 1, { dur: 0.7 });
  cueTo(s, c, 'feature-welford-variance', varP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 6. scale-artifact: Keep transform meaning and fitted parameters distinct
// Cues: scale-artifact-0, scale-artifact-1, feature-scale-log
// ---------------------------------------------------------------------------
export function scaleArtifact(s, c) {
  const p0 = s.value(0);
  const p1 = s.value(0);
  const logP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.vector, seed: 6 }));
  s.add(decorAura(0, 30, 560, '#a78bfa1c', '#5ce1e614'));

  const headline = heroTitle(['Three Rulers,', 'Three Artifacts'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.vector,
    eyebrow: 'STANDARD  ·  ROBUST  ·  LOG1P(X)',
  });

  const live = dynamic(() => {
    const a1 = p1.value;
    const lg = logP.value;
    const nodes = [];

    const x0 = -360;
    const x1 = 760;

    const lanes = [
      {
        name: 'STANDARD',
        params: `μ=${mean.toFixed(1)}, σ=${std.toFixed(1)}`,
        y: -145,
        col: ROLE.leak,
        map: (row) => (row.standard + 0.5) / 3.3,
        tail: `z=+2.65`,
        alpha: 1,
      },
      {
        name: 'ROBUST',
        params: `Q1=${quantile(0.25)}, Med=${median}, Q3=${quantile(0.75)}`,
        y: 20,
        col: ROLE.good,
        map: (row) => (row.wait === 12000 ? 0.98 : (row.robust + 1.0) / 3.0),
        tail: `r=+416.5`,
        alpha: 1,
      },
      {
        name: 'LOG1P(X)',
        params: 'ln(1 + x)  for x ≥ 0',
        y: 185,
        col: ROLE.vector,
        map: (row) => Math.log1p(row.wait) / Math.log1p(12000),
        tail: `9.39`,
        alpha: mix(0.45, 1, lg),
      },
    ];

    lanes.forEach((lane) => {
      nodes.push(
        group(
          txt(lane.name, -820, lane.y - 20, 30, lane.col, 'mono', 'left'),
          txt(lane.params, -820, lane.y + 22, 26, COSMOS.muted, 'mono', 'left'),
          rule(x0, lane.y, x1 - 155, lane.y, '#3b4e78', 3),
          ...scaleRows.map((row) => {
            const px = mix(x0 + 18, x1 - 175, lane.map(row));
            const isOut = row.wait === 12000;
            return glowDot(px, lane.y, {
              radius: isOut ? 12 : 8,
              color: isOut ? ROLE.clock : lane.col,
              glow: isOut ? 11 : 5,
            });
          }),
          txt(lane.tail, x1, lane.y, 26, ROLE.clock, 'mono', 'right'),
        ).opacity(lane.alpha),
      );
    });

    nodes.push(
      txt(
        lg > 0.2
          ? 'log1p compresses the right tail (still unbounded); store transform + params together'
          : a1 > 0.2
            ? 'Affine scaling is invertible, yet changes conditioning & regularization'
            : 'Quartiles depend on interpolation; guard zero IQR or zero σ explicitly',
        0,
        320,
        29,
        COSMOS.ink,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'scale-artifact-0', p0, 1, { dur: 0.7 });
  cueTo(s, c, 'scale-artifact-1', p1, 1, { dur: 0.7 });
  cueTo(s, c, 'feature-scale-log', logP, 1, { dur: 0.85 });
}
