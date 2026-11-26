// Scene 07 (checkpoint-retry): "Resume from a meaningful state"
// Checkpoint capsule + bounded retry circuit-breaker pips + node re-entry replay diagram
// + trusted host freshness clock (10s -> 210s vs 60s film / 300s article limits) + 4 failure-recovery tracks.
import {
  ARTICLE_FRESH_S,
  COSMOS,
  FRESH_SECONDS,
  INITIAL_AGE_S,
  ROLE,
  STALE_AGE_S,
  cinemaAtmosphere,
  crossSwap,
  glowArrow,
  glowDot,
  glowRing,
  glowingArc,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  renderGauge,
  renderRetryPips,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function checkpointRetry(s, c) {
  const phase = s.value(0);
  const st0 = s.value(1); // Beat 0-1: Checkpoint capsule + bounded retry + re-entry replay
  const st1 = s.value(0); // Beat 2: Thread auth + freshness clock (10s -> 210s vs 60s / 300s)
  const st2 = s.value(0); // Beat 3: 4 drawn failure-recovery signal tracks

  // Beat 0: Checkpoint + partial retry
  const cpStores = s.value(0);
  const healthOut = s.value(0);
  const savedLit = s.value(0);
  const retryPips = s.value(0);
  const notRestart = s.value(0);

  // Beat 1: Persistence != external effects
  const persistSep = s.value(0);
  const reEnter = s.value(0);
  const explicitRetry = s.value(0);
  const repeatSafe = s.value(0);

  // Beat 2: Thread auth + freshness clock
  const authLit = s.value(0);
  const threadSel = s.value(0);
  const noPerm = s.value(0);
  const hostNow = s.value(0);
  const recheckLit = s.value(0);
  const ageSeconds = s.value(INITIAL_AGE_S);
  const expiredLit = s.value(0);
  const artLimLit = s.value(0);

  // Beat 3: 4 failure classes
  const fRead = s.value(0);
  const fReadRec = s.value(0);
  const fId = s.value(0);
  const fIdRec = s.value(0);
  const fRev = s.value(0);
  const fWrite = s.value(0);
  const fWriteRec = s.value(0);
  const fDiff = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.triage, ROLE.policy);
  const title = heroTitle(['Resume from a', 'Meaningful State'], {
    x: -860,
    y: -440,
    size: 54,
    lineHeight: 62,
    accent: ROLE.triage,
    eyebrow: 'CHECKPOINTS  /  BOUNDED RETRIES & FRESHNESS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const m0 = st0.value;
    const m1 = st1.value;
    const m2 = st2.value;
    const lx = -860;
    const nodes = [];

    // =========================================================================
    // STAGE 0 (Beats 0-1): Checkpoint Capsule + Bounded Retry + Re-entry Contract
    // =========================================================================
    if (m0 > 0.02) {
      const hOut = healthOut.value;
      const rPip = Math.round(retryPips.value * 3);

      // Left: Thread Checkpoint Capsule holding saved Eval & Policy writes
      nodes.push(
        txt(
          'THREAD CHECKPOINT CAPSULE',
          lx,
          -205,
          26,
          cpStores.value > 0.3 ? ROLE.triage : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m0),
        rule(lx, -181, -40, -181, ROLE.rule, 2).opacity(m0),
      );

      const slots = [
        {
          y: -115,
          name: 'EVAL',
          status: savedLit.value > 0.3 ? 'SAVED (v3)' : 'complete',
          col: ROLE.pass,
        },
        {
          y: -25,
          name: 'POLICY',
          status: savedLit.value > 0.3 ? 'SAVED (v3)' : 'complete',
          col: ROLE.pass,
        },
        {
          y: 65,
          name: 'HEALTH',
          status: rPip >= 2 ? 'REFRESHED' : hOut > 0.3 ? 'TIMEOUT' : 'running',
          col: rPip >= 2 ? ROLE.pass : hOut > 0.3 ? ROLE.reject : ROLE.health,
        },
      ];
      slots.forEach((sl) => {
        nodes.push(
          lumBar(-450, sl.y, 820, 58, {
            color: sl.col,
            fillOpacity: 0.16,
            strokeWidth: 2.4,
            glow: 8,
            opacity: m0,
          }),
          txt(sl.name, lx + 24, sl.y, 26, sl.col, 'mono', 'left').opacity(m0),
          txt(sl.status, -60, sl.y, 26, sl.col, 'mono', 'right').opacity(m0),
        );
      });

      // Bounded retry circuit-breaker pips under Health
      nodes.push(
        txt('BOUNDED RETRY BUDGET', lx, 152, 26, ROLE.policy, 'mono', 'left').opacity(m0),
        ...renderRetryPips(lx + 380, 152, 3, Math.max(1, rPip), {
          color: ROLE.policy,
          spentColor: ROLE.pass,
          opacity: m0,
        }),
        txt(
          notRestart.value > 0.3
            ? 'Refresh failed branch only; keep saved Eval & Policy'
            : 'Integration sketch with configured checkpointer',
          lx,
          212,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(m0),
      );

      // Right: Persistence vs External Effects + Re-entry Replay Arc
      const rx = 120;
      nodes.push(
        txt(
          'PERSISTENCE  !=  EXTERNAL EFFECTS',
          rx,
          -205,
          26,
          persistSep.value > 0.3 ? ROLE.mark : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m0),
        rule(rx, -181, 860, -181, ROLE.rule, 2).opacity(m0),
      );

      // Node re-entry diagram: Line 1 -> Pre-interrupt work -> interrupt() -> Destination
      const nY = -12;
      nodes.push(
        lumBar(255, nY, 240, 66, {
          color: reEnter.value > 0.3 ? ROLE.policy : ROLE.eval,
          fillOpacity: 0.18,
          glow: reEnter.value > 0.3 ? 11 : 5,
          opacity: m0,
        }),
        txt('NODE TOP', 255, nY, 26, COSMOS.ink, 'mono').opacity(m0),
        glowArrow([385, nY], [515, nY], ROLE.eval, { width: 3.2, opacity: m0 }),
        lumBar(665, nY, 270, 66, {
          color: repeatSafe.value > 0.3 ? ROLE.pass : ROLE.merge,
          fillOpacity: 0.18,
          glow: repeatSafe.value > 0.3 ? 11 : 5,
          opacity: m0,
        }),
        txt('interrupt()', 665, nY, 26, COSMOS.ink, 'mono').opacity(m0),
      );

      if (reEnter.value > 0.02) {
        nodes.push(
          glowingArc([665, nY - 40], [255, nY - 40], -82, {
            color: ROLE.reject,
            width: 3.4,
            glow: 9,
            opacity: m0 * reEnter.value,
          }),
          txt('resume replays from top!', 460, nY - 118, 26, ROLE.reject, 'mono').opacity(
            m0 * reEnter.value,
          ),
        );
      }

      nodes.push(
        txt(
          explicitRetry.value > 0.3
            ? '1. Keep retryable reads explicit'
            : 'Checkpoints save graph state',
          rx,
          105,
          26,
          explicitRetry.value > 0.3 ? ROLE.eval : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m0),
        txt(
          repeatSafe.value > 0.3
            ? '2. Make side effects repeat-safe / reconcilable'
            : 'External targets need their own replay contract',
          rx,
          165,
          26,
          repeatSafe.value > 0.3 ? ROLE.pass : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m0),
      );

      nodes.push(
        rule(lx, 310, 860, 310, ROLE.rule, 2).opacity(m0),
        txt(
          'Checkpoint durability saves workflow progress; idempotency protects external targets',
          lx,
          362,
          26,
          ROLE.eval,
          'sans',
          'left',
        ).opacity(m0),
      );
    }

    // =========================================================================
    // STAGE 1 (Beat 2): Thread Authorization & Live Freshness Clock (10s -> 210s)
    // =========================================================================
    if (m1 > 0.02) {
      const age = Math.round(ageSeconds.value);
      const isExpired = age > FRESH_SECONDS;

      // Top section: Thread ID selector vs Authorization gate
      nodes.push(
        txt(
          'THREAD AUTHORIZATION',
          lx,
          -210,
          26,
          authLit.value > 0.3 ? ROLE.triage : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m1),
        rule(lx, -186, 860, -186, ROLE.rule, 2).opacity(m1),
        lumBar(-650, -110, 420, 62, {
          color: threadSel.value > 0.3 ? ROLE.eval : COSMOS.rule,
          fillOpacity: 0.16,
          opacity: m1,
        }),
        txt('thread_id: "rel-17"', -650, -110, 26, COSMOS.ink, 'mono').opacity(m1),
        glowArrow([-425, -110], [-255, -110], noPerm.value > 0.3 ? ROLE.reject : COSMOS.muted, {
          width: 3.4,
          opacity: m1,
        }),
        lumBar(80, -110, 640, 62, {
          color: noPerm.value > 0.3 ? ROLE.reject : ROLE.pass,
          fillOpacity: 0.18,
          glow: 9,
          opacity: m1,
        }),
        txt(
          noPerm.value > 0.3 ? 'SELECTS STATE  !=  GRANTS ACCESS' : 'Authorize inspect & resume',
          80,
          -110,
          26,
          noPerm.value > 0.3 ? ROLE.reject : ROLE.pass,
          'mono',
        ).opacity(m1),
      );

      // Top-right host clock badge to balance upper-right canvas
      nodes.push(
        lumBar(685, -110, 350, 62, {
          color: hostNow.value > 0.3 ? ROLE.mark : ROLE.eval,
          fillOpacity: 0.16,
          glow: 8,
          opacity: m1,
        }),
        txt(
          `HOST NOW: t=${990 + age}`,
          685,
          -110,
          26,
          hostNow.value > 0.3 ? ROLE.mark : COSMOS.ink,
          'mono',
        ).opacity(m1),
      );

      // Middle section: Live Freshness Clock Gauge (0s to 320s scale)
      const gy = 85;
      const gLeft = -860;
      const gW = 1420;
      const maxScale = 320;
      const capFrac = FRESH_SECONDS / maxScale; // 60 / 320
      const levelFrac = Math.min(1, age / maxScale);
      const fg = renderGauge(gLeft, gy, gW, 38, levelFrac, {
        cap: capFrac,
        color: ROLE.pass,
        overColor: ROLE.reject,
        limitColor: ROLE.mark,
        opacity: m1,
      });

      nodes.push(
        txt(
          hostNow.value > 0.3
            ? 'TRUSTED HOST CLOCK  /  RECEIPT FRESHNESS'
            : 'RECEIPT AGE AFTER PAUSE',
          gLeft,
          gy - 106,
          26,
          recheckLit.value > 0.3 ? ROLE.mark : ROLE.eval,
          'mono',
          'left',
        ).opacity(m1),
        ...fg.nodes,
        txt(`60 s film limit`, fg.capX, gy - 58, 26, ROLE.mark, 'mono').opacity(m1),
        txt(
          `${age} s`,
          gLeft + gW + 45,
          gy,
          44,
          isExpired ? ROLE.reject : ROLE.pass,
          'mono',
          'left',
        )
          .glow(10, isExpired ? ROLE.reject : ROLE.pass)
          .opacity(m1),
      );

      // Optional 300 s article limit reference marker
      if (artLimLit.value > 0.02) {
        const artX = gLeft + (ARTICLE_FRESH_S / maxScale) * gW;
        nodes.push(
          line([artX, gy - 32], [artX, gy + 32], { stroke: ROLE.eval, width: 3.5, dash: [6, 5] })
            .glow(6, ROLE.eval)
            .opacity(m1 * artLimLit.value),
          txt('300 s article merge', artX - 24, gy + 62, 26, ROLE.eval, 'mono', 'right').opacity(
            m1 * artLimLit.value,
          ),
        );
      }

      // Lower telemetry strip (keeps bottom canvas richly populated & zero empty space)
      nodes.push(
        txt(
          expiredLit.value > 0.3
            ? `STALE: ${STALE_AGE_S} s > ${FRESH_SECONDS} s film limit  ->  must refresh receipts`
            : `Initial age ${INITIAL_AGE_S} s (fresh <= ${FRESH_SECONDS} s)`,
          gLeft,
          gy + 128,
          28,
          expiredLit.value > 0.3 ? ROLE.reject : ROLE.pass,
          'mono',
          'left',
        ).opacity(m1),
        rule(gLeft, 290, 860, 290, ROLE.rule, 2).opacity(m1),
        lumBar(-610, 355, 500, 62, { color: ROLE.eval, fillOpacity: 0.14, opacity: m1 }),
        txt('RECEIPT STAMP: t=990 (v3)', -610, 355, 26, ROLE.eval, 'mono').opacity(m1),
        lumBar(0, 355, 520, 62, {
          color: isExpired ? ROLE.reject : ROLE.pass,
          fillOpacity: 0.16,
          opacity: m1,
        }),
        txt(
          isExpired ? 'ACTION: REFRESH RECEIPTS' : 'ACTION: VALID WINDOW',
          0,
          355,
          26,
          isExpired ? ROLE.reject : ROLE.pass,
          'mono',
        ).opacity(m1),
        lumBar(600, 355, 520, 62, { color: ROLE.triage, fillOpacity: 0.14, opacity: m1 }),
        txt('AUTH: VERIFY CALLER SCOPE', 600, 355, 26, ROLE.triage, 'mono').opacity(m1),
      );
    }

    // =========================================================================
    // STAGE 2 (Beat 3): Four Drawn Failure-Recovery Signal Tracks (zero boxes!)
    // =========================================================================
    if (m2 > 0.02) {
      nodes.push(
        txt('MATCH RECOVERY TO FAILURE SEMANTICS', lx, -215, 26, ROLE.mark, 'mono', 'left').opacity(
          m2,
        ),
        rule(lx, -191, 860, -191, ROLE.rule, 2).opacity(m2),
      );

      const tracks = [
        {
          y: -115,
          sig: '1. Metrics read timeout',
          act: 'Jitter backoff + deadline / retry cap',
          col: ROLE.eval,
          v1: fRead.value,
          v2: fReadRec.value,
          kind: 'pips',
        },
        {
          y: 10,
          sig: '2. Release lookup: Not Found',
          act: 'Check alias or escalate for review',
          col: ROLE.policy,
          v1: fId.value,
          v2: fIdRec.value,
          kind: 'arrow',
        },
        {
          y: 135,
          sig: '3. Reviewer rejects proposal',
          act: 'Route cleanly to Cancel (no retry)',
          col: ROLE.reject,
          v1: fRev.value,
          v2: fRev.value,
          kind: 'stop',
        },
        {
          y: 260,
          sig: '4. Writer timeout (ambiguous)',
          act: 'Lookup op-key at destination + replay same key',
          col: ROLE.writer,
          v1: fWrite.value,
          v2: fWriteRec.value,
          kind: 'reconcile',
        },
      ];

      tracks.forEach((tr) => {
        const op = m2 * Math.max(0.28, tr.v1);
        nodes.push(
          glowDot(lx + 14, tr.y, {
            radius: 8,
            color: tr.col,
            glow: tr.v1 > 0.3 ? 11 : 4,
            opacity: op,
          }),
          txt(
            tr.sig,
            lx + 42,
            tr.y,
            28,
            tr.v1 > 0.3 ? COSMOS.ink : COSMOS.muted,
            'sans',
            'left',
          ).opacity(op),
        );

        // Drawn miniature mechanism in the middle column (-260 to -30)
        if (tr.kind === 'pips') {
          nodes.push(
            ...renderRetryPips(-240, tr.y, 4, tr.v2 > 0.3 ? 3 : 1, { color: tr.col, opacity: op }),
          );
        } else if (tr.kind === 'arrow') {
          nodes.push(
            glowArrow([-250, tr.y], [-95, tr.y], tr.col, { width: 3.2, opacity: op }),
            glowRing(-65, tr.y, 14, tr.col, { fillOpacity: 0.25, opacity: op }),
          );
        } else if (tr.kind === 'stop') {
          nodes.push(
            line([-250, tr.y], [-125, tr.y], { stroke: tr.col, width: 3.2 }).opacity(op),
            line([-125, tr.y - 18], [-125, tr.y + 18], { stroke: tr.col, width: 5 })
              .glow(8, tr.col)
              .opacity(op),
          );
        } else {
          nodes.push(
            glowRing(-225, tr.y, 14, tr.col, { fillOpacity: 0.3, opacity: op }),
            glowArrow([-200, tr.y], [-95, tr.y], tr.col, { width: 3.2, opacity: op }),
            glowRing(-65, tr.y, 14, ROLE.mark, { fillOpacity: 0.3, opacity: op }),
          );
        }

        nodes.push(
          txt(tr.act, 15, tr.y, 26, tr.v2 > 0.3 ? tr.col : COSMOS.muted, 'mono', 'left')
            .glow(tr.v2 > 0.4 ? 6 : 0, tr.col)
            .opacity(m2 * (tr.v2 > 0.3 ? 1 : 0.45)),
        );
      });

      nodes.push(
        rule(lx, 330, 860, 330, ROLE.rule, 2).opacity(m2),
        txt(
          'Follow every outcome back to the component that recorded it',
          lx,
          378,
          28,
          fDiff.value > 0.3 ? ROLE.mark : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m2 * (fDiff.value > 0.3 ? 1 : 0.55)),
      );
    }

    return nodes;
  });

  s.add(bgAtmo, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  // Beat 0
  tweenCue(s, c, 'cp-stores', cpStores, 1, { duration: 0.35 });
  tweenCue(s, c, 'health-timeout', healthOut, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'saved-results', savedLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'retry-health-read', retryPips, 1, { duration: 0.5 });
  tweenCue(s, c, 'not-restart', notRestart, 1, { duration: 0.35 });

  // Beat 1
  tweenCue(s, c, 'persistent-checkpoint', persistSep, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 're-enter', reEnter, 1, { duration: 0.35 });
  tweenCue(s, c, 'retryable-explicit', explicitRetry, 1, { duration: 0.35 });
  tweenCue(s, c, 'repeat-safe-retry', repeatSafe, 1, { duration: 0.35 });

  // Beat 2: Thread auth & freshness clock
  crossSwap(s, c, 'checkpoint-access', st0, st1, { duration: 0.42 });
  tweenCue(s, c, 'checkpoint-access', authLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'thread-selects', threadSel, 1, { duration: 0.3 });
  tweenCue(s, c, 'no-permission', noPerm, 1, { duration: 0.35 });
  tweenCue(s, c, 'host-now', hostNow, 1, { duration: 0.3 });
  tweenCue(s, c, 'recheck-age', recheckLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'measured-age', ageSeconds, STALE_AGE_S, { duration: 0.42, after: true });
  tweenCue(s, c, 'film-expiry', expiredLit, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'article-limit', artLimLit, 1, { duration: 0.35 });

  // Beat 3: Four failure classes
  crossSwap(s, c, 'checkpoint-retry-construct-3', st1, st2, { duration: 0.42 });
  tweenCue(s, c, 'checkpoint-retry-construct-3', fRead, 1, { duration: 0.3 });
  tweenCue(s, c, 'read-recovery', fReadRec, 1, { duration: 0.35 });
  tweenCue(s, c, 'wrong-identity', fId, 1, { duration: 0.3 });
  tweenCue(s, c, 'identity-recovery', fIdRec, 1, { duration: 0.35 });
  tweenCue(s, c, 'reviewer-rejects', fRev, 1, { duration: 0.35 });
  tweenCue(s, c, 'writer-timeout', fWrite, 1, { duration: 0.3 });
  tweenCue(s, c, 'writer-recovery', fWriteRec, 1, { duration: 0.35 });
  tweenCue(s, c, 'different-semantics', fDiff, 1, { duration: 0.35 });
}
