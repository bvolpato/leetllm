// Scene 13: fallback-evidence - "Can the backup answer the status question?"
// Three stages: (1) Model failover checklist (data policy, role/tool translation, shared budget & tool),
// (2) Evidence freshness gauge (40m cached snapshot vs live read; model "live" label cannot override clock),
// (3) Redacted human handoff packet & caller cancellation stopping the fallback chain.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  OP,
  ROLE,
  actorOrb,
  ambientClock,
  cinemaAtmosphere,
  glowArrow,
  glowCross,
  glowDot,
  glowPill,
  guardedDynamic,
  heroTitle,
  hexAlpha,
  lowerFooter,
  playCue,
  txt,
} from '../parts.mjs';

export default function fallbackEvidence(s, c) {
  const title = heroTitle(['Can the backup answer', 'the status question?'], {
    x: -855,
    y: -440,
    size: 50,
    lineHeight: 58,
    accent: ROLE.violet,
  });

  const amb = ambientClock(s, c);
  const stage = s.value(0); // 0 = backup route, 1 = freshness gauge, 2 = redacted handoff
  const showPolicy = s.value(0);
  const showTranslate = s.value(0);
  const showNarrow = s.value(0);
  const showSharedTool = s.value(0);

  const showCache40 = s.value(0);
  const showAdapter = s.value(0);
  const showModelLie = s.value(0);
  const showCompletedOld = s.value(0);

  const showFields = s.value(0);
  const showRedact = s.value(0);
  const showCancelStop = s.value(0);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const st = Math.round(stage.value);
      const nodes = [];

      if (st === 0) {
        // Stage 1: Primary -> Backup model route + shared failed dependency
        nodes.push(
          txt(
            'PROVIDER FALLBACK SHARES BUDGET, DEADLINE & TOOLS',
            0,
            -275,
            27,
            ROLE.violet,
            'mono',
            'center',
          ).opacity(alpha),
          actorOrb(-665, -125, 62, ROLE.fail, 'Primary', 'unavailable', { alpha }),
          actorOrb(-665, 135, 62, ROLE.violet, 'Backup', 'read-only route', {
            alpha,
            active: true,
          }),
          actorOrb(665, 10, 68, ROLE.fail, 'Failed Tool', 'shared dependency', {
            alpha,
            active: showSharedTool.value > 0.4,
          }),
          glowArrow(-550, -125, -395, -125, hexAlpha(ROLE.fail, 0.45 * alpha), {
            width: 3,
            alpha,
            dash: [8, 6],
          }),
          glowArrow(-550, 135, -395, 135, ROLE.violet, { width: 3.5, alpha }),
          glowArrow(410, 10, 535, 10, ROLE.fail, { width: 3.5, alpha }),
        );

        // Failover checks floating cleanly in center column
        const checks = [
          {
            y: -150,
            text: '1. Data processor allowed',
            col: ROLE.sure,
            op: Math.max(0.5, showPolicy.value),
          },
          {
            y: -62,
            text: '2. Translate roles, tools & limits',
            col: ROLE.agent,
            op: Math.max(0.4, showTranslate.value),
          },
          {
            y: 26,
            text: '3. Test refusal & incomplete output',
            col: ROLE.mark,
            op: Math.max(0.4, showTranslate.value),
          },
          {
            y: 114,
            text: '4. Read-only mode + measure cost',
            col: ROLE.violet,
            op: Math.max(0.35, showNarrow.value),
          },
        ];
        for (const ch of checks) {
          nodes.push(glowPill(ch.text, 10, ch.y, ch.col, { size: 26, alpha: ch.op * alpha }));
        }

        if (showSharedTool.value > 0.4) {
          nodes.push(
            glowCross(515, 10, 34, ROLE.fail, showSharedTool.value * alpha),
            txt(
              'Switching models cannot fix a shared failed tool or expand the remaining budget.',
              0,
              315,
              27,
              ROLE.fail,
              'sans',
              'center',
            ).opacity(showSharedTool.value * alpha),
          );
        } else {
          nodes.push(
            txt(
              'Test every backup route on the real task before trusting failover.',
              0,
              315,
              27,
              COSMOS.muted,
              'sans',
              'center',
            ).opacity(alpha),
          );
        }
      } else if (st === 1) {
        // Stage 2: Evidence freshness timeline (40 min ago vs NOW)
        const tlY = -10;
        const x0 = -680;
        const x1 = 680;
        nodes.push(
          txt(
            'HOST TIMESTAMP OVERRIDES MODEL CLAIMS',
            0,
            -275,
            28,
            ROLE.mark,
            'mono',
            'center',
          ).opacity(alpha),
          line([x0, tlY], [x1, tlY], { stroke: '#4a5c88', width: 4.5 }).opacity(alpha),
          glowDot(x0, tlY, { radius: 13, color: ROLE.fail, glow: 14, opacity: alpha }),
          glowDot(x1, tlY, { radius: 13, color: ROLE.sure, glow: 14, opacity: alpha }),
          txt('40 MIN AGO (CACHED)', x0, tlY + 46, 26, ROLE.fail, 'mono', 'left').opacity(alpha),
          txt('NOW (FRESH READ REQUIRED)', x1, tlY + 46, 26, ROLE.sure, 'mono', 'right').opacity(
            alpha,
          ),
        );

        // Cached observation card
        const cacheState =
          showCompletedOld.value > 0.5 ? 'completed (40m ago)' : 'queued (40m ago)';
        nodes.push(
          glowPill(`${OP.job}: ${cacheState}`, x0 + 230, tlY - 82, ROLE.mark, {
            size: 27,
            alpha: Math.max(0.55, showCache40.value) * alpha,
          }),
        );

        // Trusted adapter requirements on right
        if (showAdapter.value > 0.3) {
          nodes.push(
            glowPill('Trusted adapter + run/op match + timestamp', 340, tlY - 82, ROLE.sure, {
              size: 26,
              alpha: showAdapter.value * alpha,
            }),
          );
        }

        // Model tries to label cached record "live" -> crossed out cleanly to the left!
        if (showModelLie.value > 0.3) {
          nodes.push(
            glowCross(-540, 155, 34, ROLE.fail, showModelLie.value * alpha),
            glowPill('Model text: "LIVE NOW"', -240, 155, ROLE.fail, {
              size: 27,
              alpha: showModelLie.value * alpha,
            }),
            glowPill('Host timestamp: still 40m old!', 320, 155, ROLE.mark, {
              size: 27,
              alpha: showModelLie.value * alpha * (0.85 + 0.15 * pulse),
            }),
          );
        }

        nodes.push(
          txt(
            showCompletedOld.value > 0.5
              ? 'Even a cached "completed" state stays dated to when it was observed.'
              : 'Report when the queue last saw it; never present stale cache as live status.',
            0,
            315,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Stage 3: Redacted Human Handoff Packet + Caller Cancel
        nodes.push(
          txt(
            'SAFE UNAVAILABLE RESPONSE OR REDACTED HANDOFF PACKET',
            0,
            -275,
            27,
            ROLE.sure,
            'mono',
            'center',
          ).opacity(alpha),
        );

        const fields = [
          { x: -430, y: -135, text: '1. Authorized task', col: ROLE.agent },
          { x: 430, y: -135, text: `2. Operation key (${OP.key})`, col: ROLE.op },
          { x: -430, y: -25, text: `3. Exact payload (${OP.revision})`, col: ROLE.op },
          { x: 430, y: -25, text: '4. Last confirmed observation', col: ROLE.sure },
          { x: -430, y: 85, text: '5. Unresolved state', col: ROLE.mark },
          { x: 430, y: 85, text: '6. Attempts + stop reason', col: ROLE.violet },
        ];

        for (const f of fields) {
          nodes.push(
            glowPill(f.text, f.x, f.y, f.col, {
              size: 26,
              alpha: Math.max(0.5, showFields.value) * alpha,
            }),
          );
        }

        nodes.push(
          glowPill(
            'Allowlist approved fields · Redact secrets · Recheck permission',
            0,
            205,
            ROLE.sure,
            {
              size: 26,
              alpha: Math.max(0.4, showRedact.value) * alpha,
            },
          ),
          txt(
            showCancelStop.value > 0.5
              ? 'Caller cancel stops the fallback chain.'
              : 'Scope cached access strictly to the authenticated caller.',
            0,
            315,
            28,
            showCancelStop.value > 0.5 ? ROLE.fail : COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'HONEST FALLBACKS · DATED OBSERVATIONS · REDACTED HANDOFF',
          st === 0
            ? 'SHARED BUDGET & FAILED TOOLS'
            : st === 1
              ? 'STALE CACHE != LIVE STATUS'
              : 'CANCEL STOPS FALLBACK CHAIN',
          { accent: ROLE.violet, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.violet, ROLE.mark), title, layer);

  playCue(s, c, 'fallback-processor', (d) => s.play(showPolicy.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'fallback-format', (d) => s.play(showTranslate.to(0.6, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'fallback-refusal', (d) => s.play(showTranslate.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'fallback-switch', (d) => s.play(showTranslate.to(1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'narrower', (d) => s.play(showNarrow.to(0.7, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'model-size', (d) => s.play(showNarrow.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'shared-state', (d) => s.play(showSharedTool.to(0.6, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'shared-dependency', (d) => s.play(showSharedTool.to(1, { duration: d })), {
    dur: 0.45,
  });

  playCue(
    s,
    c,
    'cache-says',
    (d) => s.play(stage.to(1, { duration: 0.15 }), showCache40.to(1, { duration: d })),
    {
      dur: 0.45,
    },
  );
  playCue(s, c, 'last-observed', (d) => s.play(showCache40.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'stale-evidence', (d) => s.play(showAdapter.to(0.4, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'evidence-rules', (d) => s.play(showAdapter.to(0.7, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'right-run', (d) => s.play(showAdapter.to(0.9, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'freshness', (d) => s.play(showAdapter.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'generated-flag', (d) => s.play(showModelLie.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'completed-old', (d) => s.play(showCompletedOld.to(0.7, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'dated-report', (d) => s.play(showCompletedOld.to(1, { duration: d })), {
    dur: 0.4,
  });

  playCue(
    s,
    c,
    'unavailable',
    (d) => s.play(stage.to(2, { duration: 0.15 }), showFields.to(0.5, { duration: d })),
    {
      dur: 0.4,
    },
  );
  playCue(s, c, 'h-task', (d) => s.play(showFields.to(0.65, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'h-key', (d) => s.play(showFields.to(0.75, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'h-payload', (d) => s.play(showFields.to(0.85, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'h-observation', (d) => s.play(showFields.to(0.9, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'h-state', (d) => s.play(showFields.to(0.95, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'h-attempts', (d) => s.play(showFields.to(1, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'allowlist', (d) => s.play(showRedact.to(0.7, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'recheck-permission', (d) => s.play(showRedact.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'no-cancel-fallback', (d) => s.play(showCancelStop.to(1, { duration: d })), {
    dur: 0.45,
  });
}
