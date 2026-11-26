// Scene 6: progress-budget - "What did the third read buy?"
// 8-slot glowing call budget bar, stall meter (0/2 -> 1/2 -> 0/2 vs counterfactual 2/2 STOP),
// and three distinct recovery routes (schema repair, read retry, write reconcile).
import { circle, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  ambientClock,
  cinemaAtmosphere,
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

export default function progressBudget(s, c) {
  const title = heroTitle(['What did the third read buy?'], {
    x: -855,
    y: -440,
    size: 52,
    accent: ROLE.sure,
  });

  const amb = ambientClock(s, c);
  const call1 = s.value(0);
  const call2 = s.value(0);
  const call3Ok = s.value(0);
  const showRem5 = s.value(0);
  const counterMode = s.value(0); // swaps call 3 from page-5 to page-4 again
  const askCall4 = s.value(0);
  const showStop = s.value(0); // STRICTLY AFTER 'second-stall'!
  const routeMode = s.value(0);
  const hiSchema = s.value(0);
  const hiRetry = s.value(0);
  const hiWrite = s.value(0);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const nodes = [];

      if (routeMode.value < 0.5) {
        // 8-slot hard call budget strip centered at y = -185
        const slotY = -175;
        const slotW = 148;
        const slotGap = 24;
        const totalW = 8 * slotW + 7 * slotGap;
        const startX = -totalW / 2 + slotW / 2;

        nodes.push(
          txt(
            'HARD CALL BUDGET (8 SLOTS)',
            -totalW / 2,
            slotY - 68,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(alpha),
          txt(
            showRem5.value > 0.5 ? '5 SLOTS REMAINING' : '3 OF 8 USED',
            totalW / 2,
            slotY - 68,
            26,
            ROLE.agent,
            'mono',
            'right',
          ).opacity(alpha),
        );

        for (let i = 0; i < 8; i++) {
          const sx = startX + i * (slotW + slotGap);
          let label = `slot ${i + 1}`;
          let col = '#40527a';
          let filled = 0;
          if (i === 0 && call1.value > 0.2) {
            label = 'page-4';
            col = ROLE.sure;
            filled = call1.value;
          } else if (i === 1 && call2.value > 0.2) {
            label = 'page-4';
            col = ROLE.mark;
            filled = call2.value;
          } else if (i === 2 && (call3Ok.value > 0.2 || counterMode.value > 0.2)) {
            const isDup = counterMode.value > 0.5;
            label = isDup ? 'page-4' : 'page-5';
            col = isDup ? (showStop.value > 0.5 ? ROLE.fail : ROLE.mark) : ROLE.sure;
            filled = Math.max(call3Ok.value, counterMode.value);
          } else if (i === 3 && askCall4.value > 0.3) {
            label = showStop.value > 0.5 ? 'BLOCKED' : 'call 4?';
            col = showStop.value > 0.5 ? ROLE.fail : ROLE.mark;
            filled = 0.5;
          }
          nodes.push(
            rect(slotW, 74, {
              radius: 12,
              fill: hexAlpha(col, (filled > 0.1 ? 0.2 : 0.06) * alpha),
              stroke: hexAlpha(col, (filled > 0.1 ? 0.9 : 0.4) * alpha),
              width: filled > 0.1 ? 3 : 2,
            })
              .at(sx, slotY)
              .glow(filled > 0.5 ? 8 : 0, col),
            txt(label, sx, slotY, 26, filled > 0.1 ? col : COSMOS.muted, 'mono', 'center').opacity(
              alpha,
            ),
          );
        }

        // Stall counter gauge (left) vs Evidence readout (right) at y = 75
        const midY = 75;
        const isCounter = counterMode.value > 0.5;
        const stallCount = isCounter
          ? showStop.value > 0.5
            ? 2
            : 1
          : call3Ok.value > 0.5
            ? 0
            : call2.value > 0.5
              ? 1
              : 0;

        nodes.push(
          txt(
            'CONSECUTIVE STALLS (LIMIT 2)',
            -420,
            midY - 78,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ).opacity(alpha),
        );
        for (let k = 0; k < 2; k++) {
          const cx = -500 + k * 160;
          const lit = k < stallCount;
          const isPending = isCounter && k === 1 && showStop.value < 0.5;
          const cCol = lit
            ? stallCount === 2
              ? ROLE.fail
              : ROLE.mark
            : isPending
              ? ROLE.mark
              : '#40527a';
          nodes.push(
            circle(42, {
              fill: hexAlpha(cCol, (lit ? 0.28 : 0.08) * alpha),
              stroke: cCol,
              width: lit || isPending ? 3.5 : 2,
              dash: isPending ? [6, 5] : null,
            })
              .at(cx, midY + 6)
              .glow(lit ? 12 : 3, cCol),
            txt(
              isPending ? '?' : lit ? String(k + 1) : '0',
              cx,
              midY + 6,
              32,
              cCol,
              'mono',
              'center',
            ).opacity(alpha),
          );
        }

        // Right side: Distinct evidence & decision state
        const rightX = 360;
        if (isCounter) {
          if (showStop.value > 0.5) {
            nodes.push(
              glowPill('STOP HERE · 2/2 STALLS', rightX, midY - 22, ROLE.fail, {
                size: 30,
                alpha: showStop.value * alpha,
              }),
              txt(
                'Hand off page-4 and explain why the run stopped.',
                rightX,
                midY + 52,
                26,
                COSMOS.ink,
                'sans',
                'center',
              ).opacity(showStop.value * alpha),
            );
          } else {
            nodes.push(
              txt(
                'Call 3 returns page-4 again. 5 slots remain.',
                rightX,
                midY - 38,
                27,
                COSMOS.ink,
                'sans',
                'center',
              ).opacity(alpha),
              txt('Would you admit call 4?', rightX, midY + 34, 34, ROLE.mark, 'serif', 'center')
                .glow(7, ROLE.mark)
                .opacity((0.75 + 0.25 * pulse) * alpha),
            );
          }
        } else if (call3Ok.value > 0.5) {
          nodes.push(
            glowPill('NEW EVIDENCE: page-5', rightX, midY - 24, ROLE.sure, {
              size: 30,
              alpha: call3Ok.value * alpha,
            }),
            txt(
              'Stall counter resets to 0 · hard budget stays at 5 left.',
              rightX,
              midY + 50,
              26,
              ROLE.sure,
              'sans',
              'center',
            ).opacity(call3Ok.value * alpha),
          );
        } else {
          nodes.push(
            txt(
              call2.value > 0.5
                ? '2 calls used · 1 distinct page · 1 stall'
                : '1 call used · page-4 accepted as new evidence',
              rightX,
              midY + 6,
              28,
              call2.value > 0.5 ? ROLE.mark : ROLE.sure,
              'mono',
              'center',
            ).opacity(alpha),
          );
        }

        nodes.push(
          txt(
            'New evidence resets only the stall counter, never the hard call cap.',
            0,
            318,
            27,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Beat 5: Three separate recovery routes driven by distinct observations
        const ra = routeMode.value * alpha;
        const cols = [
          {
            x: -560,
            top: 'SCHEMA',
            bot: 'ERROR',
            obs: 'Malformed proposal',
            act: '1 repair + re-admit',
            col: ROLE.mark,
            hi: hiSchema.value,
          },
          {
            x: 0,
            top: 'TRANSIENT',
            bot: 'READ',
            obs: '503 / read timeout',
            act: 'Retry within budget',
            col: ROLE.agent,
            hi: hiRetry.value,
          },
          {
            x: 560,
            top: 'UNKNOWN',
            bot: 'WRITE',
            obs: 'Lost write receipt',
            act: 'Reconcile by op key',
            col: ROLE.op,
            hi: hiWrite.value,
          },
        ];

        nodes.push(
          txt(
            'WHERE A RUN STOPS DECIDES THE NEXT ACTION',
            0,
            -255,
            28,
            COSMOS.ink,
            'mono',
            'center',
          ).opacity(ra),
        );

        for (const item of cols) {
          const active = item.hi > 0.4;
          nodes.push(
            circle(96, {
              fill: hexAlpha(item.col, (active ? 0.24 : 0.1) * ra),
              stroke: item.col,
              width: active ? 4.2 : 2.4,
            })
              .at(item.x, -75)
              .glow(active ? 14 : 5, item.col),
            txt(item.top, item.x, -92, 26, item.col, 'mono', 'center').opacity(ra),
            txt(item.bot, item.x, -56, 26, COSMOS.ink, 'mono', 'center').opacity(ra),
            line([item.x, 28], [item.x, 118], {
              stroke: item.col,
              width: 3.5,
            }).opacity(ra),
            glowDot(item.x, 118, { radius: 8, color: item.col, glow: 10, opacity: ra }),
            txt(item.obs, item.x, 165, 26, COSMOS.muted, 'sans', 'center').opacity(ra),
            glowPill(item.act, item.x, 240, item.col, { size: 26, alpha: ra }),
          );
        }
        nodes.push(
          txt(
            'Each recovery branch relies on a different verified observation.',
            0,
            345,
            28,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(ra),
        );
      }

      if (showStop.value > 0.5 && routeMode.value < 0.5) {
        nodes.push(glowCross(-260, -175, 26, ROLE.fail, 0)); // placeholder no-op kept clean
      }

      nodes.push(
        lowerFooter(
          'PROGRESS GUARD + HARD CALL CAP',
          routeMode.value > 0.5
            ? '3 FAILURE STAGES -> 3 ROUTES'
            : showStop.value > 0.5
              ? '2 STALLS -> STOP EARLY'
              : 'NEW EVIDENCE RESETS STALLS ONLY',
          { accent: showStop.value > 0.5 && routeMode.value < 0.5 ? ROLE.fail : ROLE.sure, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.sure, ROLE.mark), title, layer);

  playCue(s, c, 'useful-evidence', (d) => s.play(call1.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'repeated-page', (d) => s.play(call2.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'no-change', (d) => s.play(call2.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'new-page', (d) => s.play(call3Ok.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'finite-calls', (d) => s.play(showRem5.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'other-page', (d) => s.play(counterMode.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'admit-four', (d) => s.play(askCall4.to(1, { duration: d })), { dur: 0.45 });
  // Strict prediction withholding: reveal STOP ONLY AFTER 'second-stall'!
  playCue(s, c, 'second-stall', (d) => s.play(showStop.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(
    s,
    c,
    'schema-route',
    (d) => s.play(routeMode.to(1, { duration: d }), hiSchema.to(1, { duration: d })),
    {
      dur: 0.5,
    },
  );
  playCue(s, c, 'retry-route', (d) => s.play(hiRetry.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'unknown-write-route', (d) => s.play(hiWrite.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(
    s,
    c,
    'separate-routes',
    (d) =>
      s.play(
        hiSchema.to(1, { duration: d }),
        hiRetry.to(1, { duration: d }),
        hiWrite.to(1, { duration: d }),
      ),
    {
      dur: 0.4,
    },
  );
}
