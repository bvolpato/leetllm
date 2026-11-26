// Scene 13: recovery-cost - What does each recovery cost?
// Shared glowing time-axis race (0.0s .. 1.2s):
//   Replay @ 8,000 tok/s = 0.8s  vs  Fast Swap @ 10,000 MiB/s = 0.2s + 0.2s = 0.4s
//   Prediction: Slow Swap @ 4,000 MiB/s -> answer strictly hidden until AFTER slow-out / slow-back / choice!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  RECOVERY,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  dashedRule,
  driftValue,
  fmt,
  glowDot,
  glowingTrail,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function recoveryCost(s, c) {
  const phase = s.value(0);
  const sizeVis = s.value(0);
  const replayProg = s.value(0); // 0 -> 1 (0.8s)
  const replayRateVis = s.value(0);
  const fastLinkVis = s.value(0);
  const fastOut = s.value(0); // 0 -> 1 (0.2s)
  const fastBack = s.value(0); // 0 -> 1 (0.2s -> 0.4s)
  const fastTotalVis = s.value(0);
  const slowLaneVis = s.value(0);
  const predictVis = s.value(0);
  const slowOut = s.value(0); // 0 -> 1 (0.5s, AFTER slow-out!)
  const slowBack = s.value(0); // 0 -> 1 (0.5s -> 1.0s, AFTER slow-back!)
  const choiceVis = s.value(0); // AFTER choice!

  const header = cinemaHeader(
    'RECOVERY COST  ·  2,000 MiB',
    'Replay on GPU',
    'or swap across link?',
    {
      x: -860,
      y: -415,
      accent: ROLE.link,
      size: 54,
    },
  );

  const stageAura = aura(100, 60, 660, '#5ce1e622', '#fb923c1a');

  // Time axis mapping: 0.0 s .. 1.2 s -> x = -420 .. +780 (1000 px / s)
  const axLeft = -420;
  const axRight = 780;
  const mapT = (sec) => axLeft + (sec / 1.2) * (axRight - axLeft);

  const raceDyn = guardedDynamic(
    () => 1,
    () => {
      const ph = phase.value;
      const nodes = [];

      // Spec readout on top-right
      nodes.push(
        txt(
          `${fmt(RECOVERY.tokens)} tokens × ${RECOVERY.kibPerToken} KiB = ${fmt(RECOVERY.totalMib)} MiB private KV`,
          840,
          -345,
          28,
          sizeVis.value > 0.2 ? ROLE.focus : COSMOS.muted,
          'mono',
          'right',
        )
          .glow(sizeVis.value > 0.2 ? 6 : 0, ROLE.focus)
          .opacity(1),
      );

      // Shared vertical time gridlines (0.0s .. 1.2s in 0.2s increments)
      const topGrid = -190;
      const botGrid = 285;
      for (let i = 0; i <= 6; i++) {
        const sec = i * 0.2;
        const gx = mapT(sec);
        const isReplayMark = i === 4; // 0.8s
        nodes.push(
          line([gx, topGrid], [gx, botGrid], {
            stroke: isReplayMark && replayProg.value > 0.8 ? ROLE.key : '#233252',
            width: isReplayMark && replayProg.value > 0.8 ? 2.4 : 1.5,
            dash: [5, 7],
          }).opacity(isReplayMark && replayProg.value > 0.8 ? 0.9 : 0.72),
          txt(`${sec.toFixed(1)} s`, gx, botGrid + 36, 26, COSMOS.muted, 'mono'),
        );
      }
      nodes.push(
        line([axLeft, botGrid], [axRight + 20, botGrid], { stroke: '#4a5f8f', width: 2.4 }),
      );

      // ── Lane 1: GPU Replay (0.8 s) ──
      const y1 = -102;
      nodes.push(
        txt('GPU REPLAY', -855, y1 - 18, 28, ROLE.key, 'mono', 'left').glow(5, ROLE.key),
        txt(
          replayRateVis.value > 0.2 ? `${fmt(RECOVERY.replayRate)} tok/s` : 'recompute on GPU',
          -855,
          y1 + 24,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
      );
      if (replayProg.value > 0.02) {
        const xEnd = mapT(RECOVERY.replaySec * replayProg.value);
        nodes.push(
          beamWithPhotons(
            [
              [axLeft, y1],
              [xEnd, y1],
            ],
            ROLE.key,
            ph * 0.7,
            { width: 14, glow: 12, photonCount: 3 },
          ),
          glowDot(xEnd, y1, { radius: 9, color: '#ffffff', glow: 14 }),
        );
        if (replayProg.value > 0.92) {
          nodes.push(
            txt(
              `${RECOVERY.replaySec.toFixed(1)} s`,
              xEnd + 24,
              y1,
              30,
              ROLE.key,
              'mono',
              'left',
            ).glow(7, ROLE.key),
          );
        }
      }

      // ── Lane 2: Fast Swap @ 10,000 MiB/s (0.2s out + 0.2s back = 0.4s) ──
      const y2 = 42;
      if (fastLinkVis.value > 0.05) {
        const fA = fastLinkVis.value;
        nodes.push(
          txt('SWAP (FAST LINK)', -855, y2 - 18, 28, ROLE.fresh, 'mono', 'left').opacity(fA),
          txt(
            `${fmt(RECOVERY.fastLinkMibs)} MiB/s`,
            -855,
            y2 + 24,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(fA),
        );
        if (fastOut.value > 0.02) {
          const xOut = mapT(RECOVERY.fastLegSec * fastOut.value);
          nodes.push(
            glowingTrail(
              [
                [axLeft, y2 - 8],
                [xOut, y2 - 8],
              ],
              { color: ROLE.link, width: 12, glow: 10, opacity: fA },
            ),
          );
        }
        if (fastBack.value > 0.02) {
          const xMid = mapT(RECOVERY.fastLegSec);
          const xBack = mapT(RECOVERY.fastLegSec + RECOVERY.fastLegSec * fastBack.value);
          nodes.push(
            glowingTrail(
              [
                [xMid, y2 + 10],
                [xBack, y2 + 10],
              ],
              { color: ROLE.fresh, width: 12, glow: 10, opacity: fA },
            ),
            glowDot(xBack, y2 + 10, { radius: 8, color: '#ffffff', glow: 12, opacity: fA }),
          );
        }
        if (fastTotalVis.value > 0.2) {
          nodes.push(
            txt(
              `0.2 + 0.2 = ${RECOVERY.fastTotalSec.toFixed(1)} s`,
              mapT(RECOVERY.fastTotalSec) + 24,
              y2,
              28,
              ROLE.fresh,
              'mono',
              'left',
            )
              .glow(7, ROLE.fresh)
              .opacity(fA * fastTotalVis.value),
          );
        }
      }

      // ── Lane 3: Slow Swap @ 4,000 MiB/s (PREDICTION - bars stay hidden until slow-out/slow-back!) ──
      const y3 = 188;
      if (slowLaneVis.value > 0.05) {
        const sA = slowLaneVis.value;
        const pulse = 0.68 + 0.32 * Math.sin(ph * 5.2);
        nodes.push(
          txt('SWAP (SLOW LINK)', -855, y3 - 18, 28, ROLE.waste, 'mono', 'left').opacity(sA),
          txt(
            `${fmt(RECOVERY.slowLinkMibs)} MiB/s`,
            -855,
            y3 + 24,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(sA),
        );

        if (predictVis.value > 0.1 && slowOut.value < 0.02) {
          nodes.push(
            txt('PREDICT: Transfer vs Replay?', 0, 400, 32, ROLE.focus, 'mono')
              .glow(8, ROLE.focus)
              .opacity(sA * predictVis.value * pulse),
          );
        }

        if (slowOut.value > 0.02) {
          const xOut = mapT(RECOVERY.slowLegSec * slowOut.value);
          nodes.push(
            glowingTrail(
              [
                [axLeft, y3 - 8],
                [xOut, y3 - 8],
              ],
              { color: ROLE.link, width: 12, glow: 10, opacity: sA },
            ),
            txt('0.5 s out', mapT(0.25), y3 - 38, 26, ROLE.link, 'mono').opacity(sA),
          );
        }
        if (slowBack.value > 0.02) {
          const xMid = mapT(RECOVERY.slowLegSec);
          const xBack = mapT(RECOVERY.slowLegSec + RECOVERY.slowLegSec * slowBack.value);
          nodes.push(
            glowingTrail(
              [
                [xMid, y3 + 10],
                [xBack, y3 + 10],
              ],
              { color: ROLE.waste, width: 12, glow: 12, opacity: sA },
            ),
            glowDot(xBack, y3 + 10, { radius: 9, color: '#ffffff', glow: 14, opacity: sA }),
            txt('0.5 s back -> 1.0 s', xBack + 24, y3, 28, ROLE.waste, 'mono', 'left')
              .glow(7, ROLE.waste)
              .opacity(sA * (slowBack.value > 0.8 ? 1 : 0)),
          );
        }
      }

      // Bottom Verdict Banner (AFTER `choice`!)
      if (choiceVis.value > 0.05) {
        nodes.push(
          dashedRule(-855, 344, 855, 344, '#283657', 0.65 * choiceVis.value),
          txt(
            'REPLAY WINS: 0.8 s vs 1.0 s transfer  (+ any queue wait)',
            0,
            400,
            32,
            ROLE.fresh,
            'mono',
          )
            .glow(8, ROLE.fresh)
            .opacity(choiceVis.value),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, raceDyn);
  driftValue(s, c, phase, 8.5, { startOffset: 0.1, endMargin: 0.5 });

  // Beat 0
  c.on('size', () => {
    s.play(sizeVis.to(1, { duration: clampDur(c, c.cue('size').start, 0.3) }));
  });

  // Beat 1
  c.on('compute-rate', () => {
    s.play(replayRateVis.to(1, { duration: clampDur(c, c.cue('compute-rate').start, 0.25) }));
  });
  c.after('replay', () => {
    s.play(replayProg.to(1, { duration: clampDur(c, c.cue('replay').end, 0.45) }));
  });

  // Beat 2
  c.on('link', () => {
    s.play(fastLinkVis.to(1, { duration: clampDur(c, c.cue('link').start, 0.3) }));
  });
  c.after('out', () => {
    s.play(fastOut.to(1, { duration: clampDur(c, c.cue('out').end, 0.35) }));
  });
  c.after('back', () => {
    s.play(fastBack.to(1, { duration: clampDur(c, c.cue('back').end, 0.35) }));
  });
  c.after('round-trip', () => {
    s.play(fastTotalVis.to(1, { duration: clampDur(c, c.cue('round-trip').end, 0.25) }));
  });

  // Beat 3 (PREDICTION: hold 2.7s with NO slow-link bar or winner shown!)
  c.on('slow', () => {
    s.play(slowLaneVis.to(1, { duration: clampDur(c, c.cue('slow').start, 0.3) }));
  });
  c.on('predict', () => {
    s.play(predictVis.to(1, { duration: clampDur(c, c.cue('predict').start, 0.3) }));
  });

  // Beat 4 (Reveal strictly AFTER spoken phrases!)
  c.after('slow-out', () => {
    s.play(slowOut.to(1, { duration: clampDur(c, c.cue('slow-out').end, 0.35) }));
  });
  c.after('slow-back', () => {
    s.play(slowBack.to(1, { duration: clampDur(c, c.cue('slow-back').end, 0.35) }));
  });
  c.after('choice', () => {
    s.play(choiceVis.to(1, { duration: clampDur(c, c.cue('choice').end, 0.3) }));
  });
}
