// Scene 5: retry-clock - "How long until the next status read?"
// Exponential full-jitter windows (1s, 2s, 4s), multi-client spread, Retry-After 1.5s floor,
// and hard 5.0s deadline wall strictly withholding 7.8s until 'read-clock' ({ after: true }).
import { line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  DEADLINE,
  RETRY_AFTER,
  RETRY_FLOOR,
  ROLE,
  ambientClock,
  cinemaAtmosphere,
  glowDot,
  glowPill,
  glowTex,
  guardedDynamic,
  heroTitle,
  hexAlpha,
  lowerFooter,
  playCue,
  txt,
} from '../parts.mjs';

const OTHER_CLIENTS = [
  [0.18, 0.55, 0.84],
  [0.42, 1.05, 1.88],
  [0.75, 1.95, 3.45],
];

export default function retryClock(s, c) {
  const title = heroTitle(['How long until the next', 'status read?'], {
    x: -855,
    y: -440,
    size: 50,
    lineHeight: 58,
    accent: ROLE.agent,
  });

  const amb = ambientClock(s, c);
  const showJitter = s.value(0);
  const showPeers = s.value(0);
  const showFloor = s.value(0);
  const showOffset = s.value(0);
  const showElapsed = s.value(0);
  const showTotal = s.value(0); // STRICTLY AFTER 'read-clock'!
  const showStop = s.value(0);
  const showWriteWarn = s.value(0);

  const eq = glowTex(
    'T_{\\text{wait}} = T_{\\text{floor}} + \\mathrm{Uniform}(0, \\min(T_{\\max}, 2^{k-1}))',
    { x: 380, y: -405, size: 32, color: COSMOS.cyan, glow: 6 },
  );

  const x0 = -640;
  const x1 = 790;
  const maxSec = 8.5;
  const xOf = (sec) => x0 + ((x1 - x0) * sec) / maxSec;
  const rowYs = [-145, 5, 155];

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const nodes = [];

      // Seconds axis at y = 250
      const axisY = 250;
      nodes.push(line([x0, axisY], [x1, axisY], { stroke: '#4a5c88', width: 3.5 }).opacity(alpha));
      for (let sec = 0; sec <= 8; sec += 1) {
        const tx = xOf(sec);
        nodes.push(
          line([tx, axisY], [tx, axisY + 12], { stroke: COSMOS.muted, width: 2.4 }).opacity(alpha),
          txt(
            sec === 8 ? '8 s' : String(sec),
            tx,
            axisY + 38,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }

      // Hard 5.0s deadline laser wall
      const dlX = xOf(DEADLINE);
      nodes.push(
        line([dlX, -245], [dlX, axisY], {
          stroke: ROLE.fail,
          width: 4,
          dash: [10, 7],
        })
          .glow(8 + 4 * showStop.value, ROLE.fail)
          .opacity(alpha),
        txt(`DEADLINE ${DEADLINE}s`, dlX, -270, 26, ROLE.fail, 'mono', 'center').opacity(alpha),
      );

      // Draw the 3 retry rows
      RETRY_FLOOR.forEach((step, idx) => {
        const ry = rowYs[idx];
        const barH = 44;
        const baseStart = idx === 2 && showElapsed.value > 0.5 ? step.elapsedBefore : 0;
        const floorW = showFloor.value * RETRY_AFTER;
        const jitStart = baseStart + floorW;
        const capW = step.cap;

        nodes.push(
          txt(`Retry ${step.attempt}`, -765, ry, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
        );

        // Elapsed prefix bar on Retry 3 (4.7s elapsed before retry 3)
        if (idx === 2 && showElapsed.value > 0.3) {
          const ea = showElapsed.value * alpha;
          const ew = xOf(step.elapsedBefore) - x0;
          nodes.push(
            rect(ew, barH, {
              radius: 8,
              fill: hexAlpha(COSMOS.muted, 0.25 * ea),
              stroke: hexAlpha(COSMOS.muted, 0.65 * ea),
              width: 2,
            }).at(x0 + ew / 2, ry),
            txt(
              `elapsed ${step.elapsedBefore.toFixed(1)}s`,
              x0 + ew / 2,
              ry,
              26,
              COSMOS.ink,
              'mono',
              'center',
            ).opacity(ea),
          );
        }

        // Retry-After floor bar (1.5s)
        if (showFloor.value > 0.05) {
          const fa = showFloor.value * alpha;
          const fx1 = xOf(baseStart);
          const fx2 = xOf(baseStart + floorW);
          const fw = Math.max(4, fx2 - fx1);
          const floorLblX =
            idx === 2 && showElapsed.value > 0.5 ? Math.max(dlX + 95, fx1 + fw / 2) : fx1 + fw / 2;
          nodes.push(
            rect(fw, barH, {
              radius: 8,
              fill: hexAlpha(ROLE.controller, 0.35 * fa),
              stroke: ROLE.controller,
              width: 2.5,
            })
              .at(fx1 + fw / 2, ry)
              .glow(6, ROLE.controller),
          );
          if (showFloor.value > 0.72) {
            nodes.push(
              txt(
                `${RETRY_AFTER}s floor`,
                floorLblX,
                ry - 52,
                26,
                ROLE.controller,
                'mono',
                'center',
              ).opacity(idx === 0 || (idx === 2 && showElapsed.value > 0.5) ? fa : 0.55 * fa),
            );
          }
        }

        // Full jitter uniform window [0, cap]
        const winStart = xOf(jitStart);
        const winEnd = xOf(Math.min(maxSec, jitStart + capW));
        const ww = Math.max(8, winEnd - winStart);
        // Hide retry 3's final total position past deadline until showTotal > 0.5!
        const hideRow3Overflow = idx === 2 && showElapsed.value > 0.5 && showTotal.value < 0.5;
        if (!hideRow3Overflow) {
          nodes.push(
            rect(ww, barH, {
              radius: 8,
              fill: hexAlpha(ROLE.agent, 0.14 * alpha),
              stroke: hexAlpha(ROLE.agent, 0.65 * alpha),
              width: 2,
              dash: [7, 5],
            }).at(winStart + ww / 2, ry),
          );
        }

        // Other clients drawing independent waits
        if (showPeers.value > 0.05 && !(idx === 2 && showElapsed.value > 0.5)) {
          const pa = showPeers.value * alpha;
          for (const pVal of OTHER_CLIENTS[idx]) {
            const px = xOf(jitStart + pVal);
            if (px < x1) {
              nodes.push(
                glowDot(px, ry + 8, {
                  radius: 6,
                  color: ROLE.controller,
                  glow: 6,
                  opacity: 0.85 * pa,
                }),
              );
            }
          }
        }

        // Our sampled jitter dot
        if (showJitter.value > 0.05) {
          const ja = showJitter.value * alpha;
          if (!hideRow3Overflow) {
            const sampleSec = jitStart + step.jitter;
            const sx = xOf(sampleSec);
            const dotCol = idx === 2 && showTotal.value > 0.5 ? ROLE.fail : ROLE.mark;
            nodes.push(
              glowDot(sx, ry, { radius: 11, color: dotCol, glow: 14, opacity: ja }),
              txt(
                idx === 2 && showTotal.value > 0.5
                  ? `${step.elapsedAfter.toFixed(1)}s (> ${DEADLINE}s)`
                  : `+${step.jitter.toFixed(1)}s`,
                sx + (idx === 2 && showTotal.value > 0.5 ? -36 : 0),
                ry - 52,
                26,
                dotCol,
                'mono',
                'center',
              ).opacity(ja),
            );
          } else {
            // Prediction hold on Retry 3: show "+ 1.5s + 1.6s = ?" without revealing 7.8s!
            const qx = xOf(step.elapsedBefore + 1.5);
            nodes.push(
              glowPill('+ 1.6s jitter -> ?', qx + 170, ry, ROLE.mark, {
                size: 26,
                alpha: ja * (0.75 + 0.25 * pulse),
              }),
            );
          }
        }
      });

      // Bottom prompt / verdict area
      const capY = 345;
      if (showWriteWarn.value > 0.5) {
        nodes.push(
          txt(
            'Writes with a missing reply must reconcile by saved key first, never blind-retry.',
            0,
            capY,
            27,
            ROLE.op,
            'sans',
            'center',
          ).opacity(showWriteWarn.value * alpha),
        );
      } else if (showTotal.value > 0.5 || showStop.value > 0.5) {
        nodes.push(
          glowPill('4.7 + 1.5 + 1.6 = 7.8 s > 5.0 s -> STOP', 0, capY, ROLE.fail, {
            size: 29,
            alpha: Math.max(showTotal.value, showStop.value) * alpha,
          }),
        );
      } else if (showElapsed.value > 0.5) {
        nodes.push(
          txt(
            '4.7 s elapsed + 1.5 s floor + 1.6 s jitter: when would retry 3 start?',
            0,
            capY,
            30,
            ROLE.mark,
            'serif',
            'center',
          )
            .glow(6, ROLE.mark)
            .opacity(showElapsed.value * alpha),
        );
      } else {
        nodes.push(
          txt(
            'Full jitter spreads clients across doubling windows [0, 1s], [0, 2s], [0, 4s].',
            0,
            capY,
            27,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'FULL JITTER + RETRY-AFTER FLOOR',
          showTotal.value > 0.5 ? '7.8s > 5.0s -> ABORT' : 'HARD TASK DEADLINE: 5.0s',
          { accent: showTotal.value > 0.5 ? ROLE.fail : ROLE.agent, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.agent, ROLE.fail), title, eq, layer);

  playCue(s, c, 'sample-full-jitter', (d) => s.play(showJitter.to(1, { duration: d })), {
    dur: 0.5,
  });
  playCue(s, c, 'spread-clients', (d) => s.play(showPeers.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'retry-after-floor', (d) => s.play(showFloor.to(1, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'bounded-offset', (d) => s.play(showOffset.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'combined-deadline', (d) => s.play(showElapsed.to(1, { duration: d })), {
    dur: 0.55,
  });
  // Strict prediction withholding: reveal 7.8s ONLY AFTER 'read-clock'!
  playCue(s, c, 'read-clock', (d) => s.play(showTotal.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'whole-deadline', (d) => s.play(showStop.to(0.6, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'stop-retry', (d) => s.play(showStop.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'not-safe', (d) => s.play(showWriteWarn.to(1, { duration: d })), { dur: 0.45 });
}
