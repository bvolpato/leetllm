// Act 4 (Scenes 16-20): Training-Serving Parity, Parity Score Calculation & CACE,
// Feature Store & Freshness SLA Routing, Request Audit Wrap, Earned Fresh Transfer Finale.
import { circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PARITY_AGE,
  ROLE,
  beatTo,
  cinemaGrid,
  clock,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  featureTransfer,
  freshFeatureEvents,
  glowBadge,
  glowBar,
  glowDot,
  guardedDynamic,
  heroTitle,
  lagRoute,
  livingDrift,
  mix,
  numCell,
  parityLogit,
  rule,
  sigmoid,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 16. parity: Do the two copies of this row agree?
// Cues: parity-match, parity-stale, parity-missing
// ---------------------------------------------------------------------------
export function parity(s, c) {
  const matP = s.value(0);
  const stlP = s.value(0);
  const misP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.eligible, seed: 16 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61a', '#ff6b8b14'));

  const headline = heroTitle(['Training-Serving', 'Parity Diff Check'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.eligible,
    eyebrow: 'OFFLINE REPLAY VS LIVE SERVING CAPTURE  ·  J-204 AT 09:00',
  });

  const live = dynamic(() => {
    const st = stlP.value;
    const ms = misP.value;
    const mode = ms > 0.35 ? 2 : st > 0.35 ? 1 : 0;
    const nodes = [];

    const sampleTitle =
      mode === 0
        ? 'CAPTURE 1:  EXACT MATCH'
        : mode === 1
          ? 'CAPTURE 2:  STALE ZERO BACKLOG (SILENT SKEW!)'
          : 'CAPTURE 3:  ABSENT KEY (DETECTED BY KEY UNION)';
    const sampleCol = mode === 0 ? ROLE.good : ROLE.leak;

    nodes.push(
      txt(sampleTitle, 0, -210, 32, sampleCol, 'mono').glow(8, sampleCol),
      txt('FIELD', -620, -120, 26, COSMOS.muted, 'mono'),
      txt('OFFLINE REPLAY', -140, -120, 26, ROLE.eligible, 'mono'),
      txt('SERVING CAPTURE', 280, -120, 26, sampleCol, 'mono'),
      txt('PARITY', 660, -120, 26, COSMOS.muted, 'mono'),
      rule(-780, -82, 780, -82, '#2a3759', 2),
    );

    const rows = [
      { key: 'pool', off: 'a100-pool', srv: 'a100-pool', ok: true },
      {
        key: 'backlog',
        off: '18',
        srv: mode === 1 ? '0' : '18',
        ok: mode !== 1,
      },
      {
        key: 'priority',
        off: '0',
        srv: mode === 2 ? '<ABSENT>' : '0',
        ok: mode !== 2,
      },
    ];

    rows.forEach((r, i) => {
      const y = -10 + i * 98;
      const rCol = r.ok ? ROLE.good : ROLE.leak;
      nodes.push(
        txt(r.key, -620, y, 32, COSMOS.ink, 'mono'),
        numCell(r.off, -140, y, { w: 230, h: 64, stroke: ROLE.eligible, textColor: ROLE.eligible }),
        numCell(r.srv, 280, y, {
          w: 230,
          h: 64,
          stroke: rCol,
          textColor: rCol,
          glow: r.ok ? 0 : 12,
        }),
        txt(r.ok ? 'MATCH' : 'FAIL!', 660, y, 30, rCol, 'mono').glow(r.ok ? 0 : 10, ROLE.leak),
      );
    });

    nodes.push(
      txt(
        mode === 2
          ? 'Compare the UNION of keys so an absent key cannot slip past quietly'
          : mode === 1
            ? 'Zero is a valid integer; only parity diff catches 0 vs 18!'
            : 'Same job, same 09:00 cutoff, same transform version → zero diff',
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
  cueTo(s, c, 'parity-match', matP, 1, { dur: 0.7 });
  cueTo(s, c, 'parity-stale', stlP, 1, { dur: 0.75 });
  cueTo(s, c, 'parity-missing', misP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 17. parity-calculation: What did the scorer actually receive?
// Cues: parity-base, parity-delta, feature-parity-scores,
//       feature-parity-restore, parity-type, feature-parity-feedback
// ---------------------------------------------------------------------------
export function parityCalculation(s, c) {
  const baseP = s.value(0);
  const delP = s.value(0);
  const scP = s.value(0);
  const repP = s.value(0);
  const beat2P = s.value(0);
  const typP = s.value(0);
  const beat3P = s.value(0);
  const fbP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.leak, seed: 17 }));
  s.add(decorAura(0, 20, 560, '#ff6b8b1a', '#5ce1e614'));

  const headline = heroTitle(['Score Impact, Type Trap', '& Feedback Loops'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.leak,
    eyebrow: 'LOGIT = 0.02·h + 0.01·backlog − 4  ·  h = 0.5 H',
  });

  // View 1 (Beats 0-1): Score table for Captured (0) vs Source (18) vs Repaired Replay (18)
  const view1 = guardedDynamic(
    () => fadeOut(beat2P.value),
    (vis) => {
      const bs = baseP.value;
      const dl = delP.value;
      const sc = scP.value;
      const rp = repP.value;
      const nodes = [];

      nodes.push(
        txt('ROW', -760, -200, 26, COSMOS.muted, 'mono', 'left'),
        txt('BACKLOG', -90, -200, 26, COSMOS.muted, 'mono'),
        txt('LOGIT z', 240, -200, 26, COSMOS.muted, 'mono'),
        txt('SIGMOID p', 610, -200, 26, COSMOS.muted, 'mono'),
        rule(-780, -162, 780, -162, '#2a3759', 2),
      );

      const rows = [
        { name: 'Captured request', b: 0, col: ROLE.leak, ready: bs > 0.2, show: 1 },
        { name: 'Historical source', b: 18, col: ROLE.eligible, ready: dl > 0.2, show: 1 },
        {
          name: 'Repaired replay',
          b: 18,
          col: ROLE.good,
          ready: rp > 0.2,
          show: mix(0.35, 1, rp),
        },
      ];

      rows.forEach((r, i) => {
        const y = -82 + i * 104;
        const z = parityLogit(r.b);
        const p = sigmoid(z);
        nodes.push(
          group(
            txt(r.name, -760, y, 32, r.col, 'serif', 'left'),
            numCell(r.b, -90, y, { w: 130, h: 62, stroke: r.col, textColor: r.col }),
            txt(r.ready ? z.toFixed(2) : '?', 240, y, 34, r.ready ? r.col : COSMOS.dim, 'mono'),
            txt(
              sc > 0.2 && r.ready ? p.toFixed(6) : '?',
              610,
              y,
              34,
              sc > 0.2 && r.ready ? r.col : COSMOS.dim,
              'mono',
            ).glow(i === 2 && rp > 0.2 ? 9 : 0, ROLE.good),
          ).opacity(r.show),
        );
      });

      nodes.push(
        txt(
          rp > 0.2
            ? 'Keep original capture (0) as evidence; repaired replay matches source (18)'
            : `Fixed heartbeat ${PARITY_AGE} h gives base −3.99; backlog 18 adds +0.18`,
          0,
          285,
          30,
          COSMOS.ink,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 2): Python False == 0 type parity trap
  const view2 = guardedDynamic(
    () => Math.min(fadeIn(beat2P.value), fadeOut(beat3P.value)),
    (vis) => {
      const tp = typP.value;
      return group(
        txt('TYPE PARITY CHECK  ·  PRIORITY FIELD', 0, -205, 28, ROLE.clock, 'mono'),
        txt('REFERENCE', -450, -110, 28, ROLE.eligible, 'mono'),
        txt('CAPTURE', 450, -110, 28, ROLE.leak, 'mono'),
        txt('False', -450, 10, 78, ROLE.eligible, 'mono').glow(10, ROLE.eligible),
        txt('==', 0, 10, 64, COSMOS.muted, 'mono'),
        txt('0', 450, 10, 78, ROLE.leak, 'mono').glow(10, ROLE.leak),
        txt('Python value check: True (PASSES!)', 0, 130, 34, ROLE.good, 'mono').opacity(
          mix(0.45, 1, tp),
        ),
        txt('type: bool', -450, 235, 36, ROLE.eligible, 'mono').opacity(mix(0.45, 1, tp)),
        txt('≠  TYPE MISMATCH!', 0, 235, 32, ROLE.leak, 'mono')
          .glow(9, ROLE.leak)
          .opacity(mix(0.45, 1, tp)),
        txt('type: int', 450, 235, 36, ROLE.leak, 'mono').opacity(mix(0.45, 1, tp)),
      ).opacity(vis);
    },
  );

  // View 3 (Beat 3): CACE Controller Feedback Loop
  const view3 = guardedDynamic(
    () => fadeIn(beat3P.value),
    (vis) => {
      const fb = fbP.value;
      const steps = [
        { x: -640, label: 'Backlog 18', col: ROLE.eligible, show: 1 },
        {
          x: -210,
          label: `Score ${sigmoid(parityLogit(18)).toFixed(4)}`,
          col: ROLE.eligible,
          show: 1,
        },
        { x: 220, label: 'Controller requeues', col: ROLE.clock, show: mix(0.35, 1, fb) },
        { x: 650, label: 'Next day backlog!', col: ROLE.leak, show: mix(0.35, 1, fb) },
      ];
      return group(
        txt('CACE: CHANGING ANYTHING CHANGES EVERYTHING', 0, -195, 30, ROLE.clock, 'mono'),
        rule(-640, 15, 650, 15, '#3b4e78', 3.5),
        ...steps.map((st) =>
          group(
            glowDot(st.x, 15, { radius: 15, color: st.col, glow: 12 }),
            txt(st.label, st.x, 95, 30, st.col, 'mono'),
          ).opacity(st.show),
        ),
        txt(
          'Actions taken on a score alter future feature distributions and labels',
          0,
          255,
          32,
          COSMOS.ink,
          'serif',
        ),
      ).opacity(vis);
    },
  );

  s.add(headline, view1, view2, view3);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'parity-base', baseP, 1, { dur: 0.7 });
  cueTo(s, c, 'parity-delta', delP, 1, { dur: 0.7 });
  cueTo(s, c, 'feature-parity-scores', scP, 1, { dur: 0.7 });
  cueTo(s, c, 'feature-parity-restore', repP, 1, { dur: 0.75 });
  beatTo(s, c, 2, beat2P, 1, { dur: 0.8 });
  cueTo(s, c, 'parity-type', typP, 1, { dur: 0.75 });
  beatTo(s, c, 3, beat3P, 1, { dur: 0.8 });
  cueTo(s, c, 'feature-parity-feedback', fbP, 1, { dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 18. store-and-freshness: Can the online store replay yesterday?
// Cues: store-and-freshness-0, feature-store-overwrite, feature-store-generation,
//       store-and-freshness-1, feature-store-watermark, store-and-freshness-2,
//       feature-lag-route, feature-lag-over45, feature-lag-invalid
// ---------------------------------------------------------------------------
export function storeAndFreshness(s, c) {
  const ovP = s.value(0);
  const genP = s.value(0);
  const beat1P = s.value(0);
  const wmP = s.value(0);
  const beat2P = s.value(0);
  const r45P = s.value(0);
  const r451P = s.value(0);
  const invP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.clock, seed: 18 }));
  s.add(decorAura(0, 20, 560, '#ffd1661a', '#5ce1e614'));

  const headline = heroTitle(['Dual Feature Stores,', 'Watermarks & Lag SLAs'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.clock,
    eyebrow: 'OFFLINE REPLAY  ·  ONLINE LATEST  ·  FRESHNESS POLICY',
  });

  // View 1 (Beat 0): Dual store architecture (offline history vs online overwrite 18 -> 30)
  const view1 = guardedDynamic(
    () => fadeOut(beat1P.value),
    (vis) => {
      const ov = ovP.value;
      const gn = genP.value;
      return group(
        glowBadge('REGISTRY: DEFINITIONS + VERSIONS', 0, -185, ROLE.clock, {
          w: 640,
          h: 62,
          size: 28,
        }),
        line([-160, -152], [-440, -52], { stroke: ROLE.eligible, width: 3 }),
        line([160, -152], [440, -52], { stroke: ROLE.leak, width: 3 }),
        txt('OFFLINE STORE (VERSIONED)', -440, -10, 30, ROLE.eligible, 'mono'),
        numCell('09:00 → 18', -440, 82, {
          w: 320,
          h: 72,
          size: 32,
          stroke: ROLE.eligible,
          textColor: ROLE.eligible,
          glow: 8,
        }),
        txt('Replays exact historical value', -440, 165, 26, ROLE.good, 'sans'),

        txt('ONLINE STORE (LATEST ONLY)', 440, -10, 30, ROLE.leak, 'mono'),
        numCell(ov > 0.35 ? 'LATEST → 30' : 'LATEST → 18', 440, 82, {
          w: 320,
          h: 72,
          size: 32,
          stroke: ov > 0.35 ? ROLE.leak : ROLE.clock,
          textColor: ov > 0.35 ? ROLE.leak : ROLE.clock,
          glow: ov > 0.35 ? 12 : 6,
        }),
        txt(
          ov > 0.35 ? 'Overwrote 18! Cannot replay 09:00' : 'Holds only current entity state',
          440,
          165,
          26,
          ov > 0.35 ? ROLE.leak : COSMOS.muted,
          'sans',
        ),
        txt(
          gn > 0.2
            ? 'Verify backend generation & migration capabilities; keep serving captures'
            : 'Keep serving capture + versioned offline history to audit yesterday',
          0,
          295,
          29,
          COSMOS.ink,
          'serif',
        ),
      ).opacity(vis);
    },
  );

  // View 2 (Beat 1): Feature age (2h) vs Feed Watermark catching up to 10:00
  const view2 = guardedDynamic(
    () => Math.min(fadeIn(beat1P.value), fadeOut(beat2P.value)),
    (vis) => {
      const wm = wmP.value;
      const x0 = -680;
      const x1 = 680;
      const wmX = mix(-200, x1, wm);
      return group(
        txt('FEATURE AGE ≠ FEED FRESHNESS', 0, -205, 30, ROLE.eligible, 'mono'),
        rule(x0, 0, x1, 0, '#3b4e78', 3.5),
        glowDot(x0 + 80, 0, { radius: 14, color: ROLE.eligible, glow: 10 }),
        txt('Last job ping 08:00', x0 + 80, -72, 28, ROLE.eligible, 'mono'),
        glowDot(x1, 0, { radius: 14, color: ROLE.clock, glow: 10 }),
        txt('Prediction 10:00', x1, -72, 28, ROLE.clock, 'mono'),
        glowDot(wmX, 0, { radius: 15, color: ROLE.good, glow: 12 }),
        txt('Feed watermark', wmX, 78, 28, ROLE.good, 'mono'),
        txt(
          wm > 0.7
            ? 'Job heartbeat is 2 h old, yet the feed watermark is caught up to 10:00!'
            : 'Follow the feed watermark advancing toward 10:00...',
          0,
          235,
          32,
          wm > 0.7 ? ROLE.good : COSMOS.ink,
          'serif',
        ),
      ).opacity(vis);
    },
  );

  // View 3 (Beat 2): Freshness SLA lag policy router (0..15 normal, 15..45 fallback, >45 abstain)
  const view3 = guardedDynamic(
    () => fadeIn(beat2P.value),
    (vis) => {
      const r45 = r45P.value;
      const over = r451P.value;
      const inv = invP.value;
      const x0 = -720;
      const x1 = 720;
      const xOf = (m) => mix(x0, x1, m / 60);
      const lagNow = over > 0.2 ? 45.1 : 45;
      const route = lagRoute(lagNow);
      const ready = over > 0.2 || r45 > 0.2;

      return group(
        txt('EXACT LAG POLICY BOUNDARIES (MINUTES)', 0, -205, 28, ROLE.clock, 'mono'),
        // 3 colored SLA bands
        glowBar(xOf(0), -30, xOf(15) - xOf(0), 58, ROLE.good, { glow: 7, opacity: 0.85 }),
        glowBar(xOf(15), -30, xOf(45) - xOf(15), 58, ROLE.clock, { glow: 7, opacity: 0.85 }),
        glowBar(xOf(45), -30, xOf(60) - xOf(45), 58, ROLE.leak, { glow: 7, opacity: 0.85 }),
        txt('≤ 15: normal', (xOf(0) + xOf(15)) / 2, -105, 28, ROLE.good, 'mono'),
        txt('15 < lag ≤ 45: fallback', (xOf(15) + xOf(45)) / 2, -105, 28, ROLE.clock, 'mono'),
        txt('> 45: abstain', (xOf(45) + xOf(60)) / 2, -105, 28, ROLE.leak, 'mono'),
        txt('0', xOf(0), 34, 26, COSMOS.muted, 'mono'),
        txt('15', xOf(15), 34, 26, ROLE.good, 'mono'),
        txt('45', xOf(45), 34, 26, ROLE.clock, 'mono'),
        txt('60', xOf(60), 34, 26, ROLE.leak, 'mono'),
        // Moving probe marker
        glowDot(xOf(lagNow), 95, {
          radius: 14,
          color: over > 0.2 ? ROLE.leak : ROLE.clock,
          glow: 12,
        }),
        txt(
          `${lagNow} min  →  ${ready ? route.toUpperCase() : '?'}`,
          0,
          175,
          38,
          over > 0.2 ? ROLE.leak : ROLE.clock,
          'mono',
        ).glow(9, over > 0.2 ? ROLE.leak : ROLE.clock),
        txt(
          inv > 0.2
            ? 'Boolean False, negative, nonnumeric, or NaN lag → ABSTAIN & ALERT!'
            : 'Fallback requires inputs independent of the stale feed',
          0,
          285,
          29,
          inv > 0.2 ? ROLE.leak : COSMOS.ink,
          'serif',
        ),
      ).opacity(vis);
    },
  );

  s.add(headline, view1, view2, view3);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'store-and-freshness-0', ovP, 0.08, { dur: 0.45 });
  cueTo(s, c, 'feature-store-overwrite', ovP, 1, { dur: 0.75 });
  cueTo(s, c, 'feature-store-generation', genP, 1, { dur: 0.7 });
  beatTo(s, c, 1, beat1P, 1, { dur: 0.8 });
  cueTo(s, c, 'store-and-freshness-1', wmP, 0.12, { dur: 0.5 });
  cueTo(s, c, 'feature-store-watermark', wmP, 1, { dur: 1.0 });
  beatTo(s, c, 2, beat2P, 1, { dur: 0.8 });
  cueTo(s, c, 'store-and-freshness-2', r45P, 0.25, { dur: 0.5 });
  cueTo(s, c, 'feature-lag-route', r45P, 1, { dur: 0.65 });
  cueTo(s, c, 'feature-lag-over45', r451P, 1, { dur: 0.7 });
  cueTo(s, c, 'feature-lag-invalid', invP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 19. wrap: What would you keep from the request?
// Cues: wrap-compare, wrap-backlog*
// ---------------------------------------------------------------------------
export function wrap(s, c) {
  const cmpP = s.value(0);
  const bklP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.eligible, seed: 19 }));
  s.add(decorAura(0, 20, 560, '#5ce1e61a', '#ff6b8b14'));

  const headline = heroTitle(['Preserve Both Copies', 'for Tomorrow’s Audit'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.eligible,
    eyebrow: 'J-204 · 09:00 UTC · VERSIONED 8-SLOT LAYOUT',
  });

  const names = ['A100', 'H100', 'Other', 'Queue', 'HB(h)', 'Backlog', 'Miss', 'Prio'];
  const sourceRow = [1, 0, 0, 42, 0.5, 18, 0, 0];
  const captureRow = [1, 0, 0, 42, 0.5, 0, 0, 0];

  const live = dynamic(() => {
    const bk = bklP.value;
    const nodes = [];

    nodes.push(
      txt('OFFLINE SOURCE REPLAY (09:00)', -820, -180, 28, ROLE.eligible, 'mono', 'left'),
      txt('LIVE SERVING CAPTURE (AS-SENT)', -820, 35, 28, ROLE.clock, 'mono', 'left'),
    );

    names.forEach((n, i) => {
      const cx = -735 + i * 210;
      const isDiff = i === 5;
      const hi = isDiff && bk > 0.2;
      nodes.push(
        txt(n, cx, -135, 26, hi ? ROLE.leak : COSMOS.muted, 'mono'),
        numCell(sourceRow[i], cx, -70, {
          w: 168,
          h: 64,
          stroke: hi ? ROLE.eligible : '#2b3b60',
          textColor: hi ? ROLE.eligible : COSMOS.ink,
          glow: hi ? 12 : 0,
        }),
        numCell(captureRow[i], cx, 115, {
          w: 168,
          h: 64,
          stroke: hi ? ROLE.leak : '#2b3b60',
          textColor: hi ? ROLE.leak : COSMOS.ink,
          glow: hi ? 12 : 0,
        }),
      );
    });

    nodes.push(
      txt(
        bk > 0.2
          ? 'Slot 6 (backlog): Capture saw 0 vs Source replay 18; keep both + cutoff + version!'
          : 'Which slot must you explain to the next engineer?',
        0,
        280,
        31,
        bk > 0.2 ? ROLE.leak : ROLE.clock,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, live);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'wrap-compare', cmpP, 1, { dur: 0.7 });
  cueTo(s, c, 'wrap-backlog', bklP, 1, { dur: 0.75, after: true });
}

// ---------------------------------------------------------------------------
// 20. earned-feature-transfer: Replay the ten o'clock request (FINALE)
// Cues: fresh-receipts, fresh-pick*, feature-fresh-heartbeat*, fresh-pool,
//       fresh-queued, fresh-backlog, feature-fresh-vector,
//       feature-fresh-history, fresh-next-decision,
//       feature-fresh-stale, feature-fresh-correct, fresh-rule,
//       feature-fresh-threshold*, feature-fresh-repair
// ---------------------------------------------------------------------------
export function earnedFeatureTransfer(s, c) {
  const recP = s.value(0);
  const pickP = s.value(0);
  const vecP = s.value(0);
  const lateP = s.value(0);
  const beat2P = s.value(0);
  const stlP = s.value(0);
  const corP = s.value(0);
  const ruleP = s.value(0);
  const thrP = s.value(0);
  const repP = s.value(0);
  const drift = s.value(0);

  const staleRes = featureTransfer(0, 600); // score 13/60 = 0.2167
  const cleanRes = featureTransfer(7, 600); // score 43/150 = 0.2867

  s.add(cinemaGrid({ accent: ROLE.good, seed: 20 }));
  s.add(decorAura(0, 20, 560, '#6ee7b71a', '#5ce1e614'));

  const headline = heroTitle(['Fresh Job J-new:', '10:00 Point-in-Time Replay'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'TRANSFER CHECK  ·  CUTOFF 10:00  ·  ALERT THRESHOLD 0.25',
  });

  // View 1 (Beats 0-1): 10:00 dual-clock ping timeline + 8-slot vector assembly
  const view1 = guardedDynamic(
    () => fadeOut(beat2P.value),
    (vis) => {
      const pk = pickP.value;
      const vc = vecP.value;
      const lt = lateP.value;
      const nodes = [];

      const x0 = -240;
      const x1 = 760;
      const xOf = (m) => mix(x0, x1, (m - 540) / 80); // 09:00 (540) to 10:20 (620)
      const cutX = xOf(600); // 10:00

      nodes.push(
        txt('J-new PINGS', -780, -210, 26, COSMOS.muted, 'mono', 'left'),
        txt('10:00 CUTOFF', cutX, -210, 28, ROLE.clock, 'mono').glow(7, ROLE.clock),
        line([cutX, -172], [cutX, 40], { stroke: ROLE.clock, width: 3.4 }),
        rule(x0, 48, x1, 48, '#3b4e78', 2.4),
      );
      [550, 570, 590, 600, 610].forEach((m) => {
        nodes.push(txt(clock(m), xOf(m), 80, 26, m === 600 ? ROLE.clock : COSMOS.muted, 'mono'));
      });

      freshFeatureEvents.forEach((ev, i) => {
        const y = -130 + i * 68;
        const isWin = i === 0 && pk > 0.2;
        const isLate = i === 1;
        const col = isWin ? ROLE.good : (isLate || i === 2) && pk > 0.2 ? ROLE.leak : ROLE.eligible;
        const sx = xOf(ev.event);
        const rx = xOf(ev.available);
        nodes.push(
          txt(`${clock(ev.event)} → ${clock(ev.available)}`, -780, y, 28, col, 'mono', 'left'),
          line([sx, y], [rx, y], { stroke: col, width: 5.5 }),
          glowDot(sx, y, { radius: 9, color: col, glow: 8 }),
          circle(9, { fill: COSMOS.bg, stroke: col, width: 3.2 }).at(rx, y),
        );
      });

      // Bottom: 8-slot vector for J-new at 10:00
      const vals = cleanRes.vector.map((v, idx) => (idx === 4 ? '5/6' : String(v)));
      const labels = ['A100', 'H100', 'Other', 'Queue', 'HB(h)', 'Backlog', 'Miss', 'Prio'];
      nodes.push(
        txt(
          lt > 0.2
            ? '10:05 decision uses 09:50 (15m); replaying 10:00 STILL uses 09:10 (50m = 5/6 h)!'
            : pk > 0.2
              ? '10:00 VECTOR:  [0, 0, 1, 20, 5/6 h, 7, 0, 0]'
              : 'Which ping belongs in the 10:00 row?  ?',
          0,
          150,
          29,
          lt > 0.2 ? ROLE.clock : pk > 0.2 ? ROLE.good : ROLE.clock,
          'mono',
        ),
      );
      labels.forEach((lb, i) => {
        const cx = -735 + i * 210;
        nodes.push(
          txt(lb, cx, 212, 26, COSMOS.muted, 'mono').opacity(mix(0.45, 1, vc)),
          numCell(vc > 0.2 ? vals[i] : '?', cx, 272, {
            w: 168,
            h: 58,
            size: 28,
            stroke: vc > 0.2 ? ROLE.good : '#2b3b60',
            textColor: vc > 0.2 ? ROLE.good : COSMOS.dim,
          }).opacity(mix(0.45, 1, vc)),
        );
      });

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beats 2-3): Alert threshold 0.25 comparing Captured (0.2167) vs Eligible Replay (0.2867)
  const view2 = guardedDynamic(
    () => fadeIn(beat2P.value),
    (vis) => {
      const st = stlP.value;
      const cr = corP.value;
      const rl = ruleP.value;
      const th = thrP.value;
      const rp = repP.value;
      const nodes = [];

      const x0 = -640;
      const x1 = 680;
      const xOf = (v) => mix(x0, x1, v / 0.35);
      const cutX = xOf(0.25);

      nodes.push(
        txt('ALERT THRESHOLD = 0.25', cutX, -195, 30, ROLE.clock, 'mono')
          .glow(8, ROLE.clock)
          .opacity(mix(0.45, 1, rl)),
        line([cutX, -155], [cutX, 175], { stroke: ROLE.clock, width: 3.6, dash: [9, 6] }).opacity(
          mix(0.45, 1, rl),
        ),
      );

      // Row 1: Captured serving row (backlog = 0 -> 0.2167)
      const y1 = -70;
      nodes.push(
        txt(
          st > 0.2
            ? th > 0.2
              ? `CAPTURED (backlog = 0):  ${staleRes.score.toFixed(4)}  (below 0.25)`
              : `CAPTURED (backlog = 0):  ${staleRes.score.toFixed(4)}`
            : 'CAPTURED (backlog = 0)',
          -820,
          y1 - 45,
          28,
          ROLE.leak,
          'mono',
          'left',
        ),
        glowBar(x0, y1, (xOf(staleRes.score) - x0) * mix(0.2, 1, st), 38, ROLE.leak, { glow: 8 }),
      );

      // Row 2: Eligible 10:00 replay (backlog = 7 -> 0.2867)
      const y2 = 90;
      nodes.push(
        txt('ELIGIBLE REPLAY (backlog = 7)', -820, y2 - 45, 28, ROLE.good, 'mono', 'left'),
        glowBar(x0, y2, (xOf(cleanRes.score) - x0) * mix(0.2, 1, cr), 38, ROLE.good, { glow: 10 }),
        txt(
          cr > 0.2
            ? th > 0.2
              ? `${cleanRes.score.toFixed(4)}  →  RAISES ALERT!`
              : `${cleanRes.score.toFixed(4)}`
            : '?',
          xOf(cleanRes.score) + 22,
          y2,
          30,
          ROLE.good,
          'mono',
          'left',
        ).glow(th > 0.2 ? 10 : 0, ROLE.good),
      );

      nodes.push(
        txt(
          rp > 0.2
            ? 'Keep captured 0 as evidence; replay restores +0.07 from the 7 jobs eligible at 10:00'
            : th > 0.2
              ? 'Only the eligible 10:00 replay crosses 0.25; late 09:50 ping stays out!'
              : 'Which row crosses the 0.25 alert threshold?',
          0,
          285,
          30,
          th > 0.2 ? ROLE.good : ROLE.clock,
          'serif',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'fresh-receipts', recP, 1, { dur: 0.7 });
  cueTo(s, c, 'fresh-pick', pickP, 0.65, { dur: 0.5, after: true });
  cueTo(s, c, 'feature-fresh-heartbeat', pickP, 1, { dur: 0.5, after: true });
  cueTo(s, c, 'fresh-pool', vecP, 0.35, { dur: 0.4 });
  cueTo(s, c, 'fresh-queued', vecP, 0.6, { dur: 0.4 });
  cueTo(s, c, 'fresh-backlog', vecP, 0.82, { dur: 0.4 });
  cueTo(s, c, 'feature-fresh-vector', vecP, 1, { dur: 0.5 });
  cueTo(s, c, 'feature-fresh-history', lateP, 0.55, { dur: 0.5 });
  cueTo(s, c, 'fresh-next-decision', lateP, 1, { dur: 0.6 });
  beatTo(s, c, 2, beat2P, 1, { dur: 0.8 });
  cueTo(s, c, 'feature-fresh-stale', stlP, 1, { dur: 0.75 });
  cueTo(s, c, 'feature-fresh-correct', corP, 1, { dur: 0.75 });
  cueTo(s, c, 'fresh-rule', ruleP, 1, { dur: 0.65 });
  cueTo(s, c, 'feature-fresh-threshold', thrP, 1, { dur: 0.7, after: true });
  cueTo(s, c, 'feature-fresh-repair', repP, 1, { dur: 0.75 });
}
