// Scene 18: mid-scale-gate: "Does the forecast survive a larger trial?"
// Left/center: Allowed loss tolerance (0.020) vs growing observed residual (0.040 at 10B/100B),
//   revealing observed 2.350 strictly AFTER gate-observed and HOLD verdict AFTER gate-hold.
// Right (Beat 2): Separate hardware throughput gauge (useful tokens / GPU-s & MFU) keeping
//   loss diagnosis cleanly separated from cluster efficiency.
import { line } from 'vizmatic/stage';
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playCue,
  scenePulse,
  surfaceLoss,
} from '../parts.mjs';

export default function midScaleGate(s, c) {
  const pred = surfaceLoss(10e9, 100e9); // 2.310
  const obs = 2.35;
  const tol = 0.02;
  const gap = Math.abs(obs - pred); // 0.040

  const title = heroTitle(['Does the forecast survive', 'a larger trial?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.cap,
  });

  const tolGlow = s.value(0); // sl-mid-scale-gate-0
  const obsVis = s.value(0); // AFTER gate-observed
  const gapGrow = s.value(0); // sl-mid-scale-gate-1
  const holdVis = s.value(0); // AFTER gate-hold
  const thruVis = s.value(0); // sl-mid-scale-gate-2
  const pulse = s.value(0);

  const stageLayer = guardedDynamic(s.value(1), (alpha) => {
    const nodes = [];
    const tg = tolGlow.value;
    const ov = obsVis.value;
    const gg = gapGrow.value;
    const hv = holdVis.value;
    const tv = thruVis.value;
    const p = pulse.value;

    const baseY = 215;
    const barScale = 6400; // 0.040 -> 256 px, 0.020 -> 128 px
    const tolH = tol * barScale;
    const errVal = gap * gg;
    const errH = Math.max(8, errVal * barScale);

    // Left / Center: Loss-gate comparison
    const tolX = -560;
    const errX = -150;

    nodes.push(
      txt(
        '10B params × 100B tokens   ·   mid-scale trial',
        -830,
        -255,
        28,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      txt(`Forecast: ${fmt(pred, 3)} nats`, -830, -185, 36, ROLE.tokens, 'mono', 'left')
        .glow(6, ROLE.tokens)
        .opacity(alpha),
      line([-760, baseY], [90, baseY], { stroke: '#4d6090', width: 2.6 }).opacity(alpha),
      // Tolerance threshold line spanning tolerance bar cleanly without crossing rising label
      line([-760, baseY - tolH], [-310, baseY - tolH], { stroke: ROLE.tokens, width: 2.2 }).opacity(
        0.75 * alpha,
      ),
      // Tolerance bar
      lumBar(tolX, baseY - tolH / 2, 220, tolH, {
        color: ROLE.tokens,
        fillOpacity: 0.42,
        strokeWidth: 2.8,
        glow: 8 + 5 * tg,
        opacity: alpha,
      }),
      txt('±0.020', tolX, baseY - tolH - 34, 34, ROLE.tokens, 'mono', 'center')
        .glow(6, ROLE.tokens)
        .opacity(alpha),
      txt('Allowed error', tolX, baseY + 46, 28, COSMOS.ink, 'sans', 'center').opacity(alpha),
    );

    if (ov > 0.05) {
      nodes.push(
        txt(`Observed: ${fmt(obs, 3)} nats`, -340, -185, 36, ROLE.cap, 'mono', 'left')
          .glow(7, ROLE.cap)
          .opacity(ov * alpha),
      );
    }

    if (gg > 0.02) {
      nodes.push(
        lumBar(errX, baseY - errH / 2, 220, errH, {
          color: ROLE.cap,
          fillOpacity: 0.48,
          strokeWidth: 3,
          glow: 12,
          opacity: alpha,
        }),
        txt(fmt(errVal, 3), errX, baseY - 295, 36, ROLE.cap, 'mono', 'center')
          .glow(8, ROLE.cap)
          .opacity(alpha),
        txt('Observed miss', errX, baseY + 46, 28, ROLE.cap, 'sans', 'center').opacity(alpha),
      );
    } else {
      nodes.push(
        txt('Observation pending', errX, baseY + 46, 26, COSMOS.dim, 'mono', 'center').opacity(
          alpha,
        ),
      );
    }

    if (hv > 0.05) {
      nodes.push(
        txt(
          '0.040 > 0.020 (2× limit)  ->  HOLD LARGE RUN',
          -355,
          345,
          32,
          ROLE.cap,
          'mono',
          'center',
        )
          .glow(10, ROLE.cap)
          .opacity(hv * alpha),
      );
    }

    // Right: Separate hardware throughput & MFU check (Beat 2)
    const rx = 215;
    const gaugeW = 580;
    const mfuFill = 0.62 + 0.04 * Math.sin(p * Math.PI * 6);
    const rightA = (0.28 + 0.72 * tv) * alpha;

    nodes.push(
      txt('SEPARATE HARDWARE CHECK', rx, -255, 26, ROLE.compute, 'mono', 'left')
        .glow(tv > 0.4 ? 6 : 0, ROLE.compute)
        .opacity(rightA),
      txt('Throughput = useful tok / GPU-s', rx, -165, 28, COSMOS.ink, 'mono', 'left').opacity(
        rightA,
      ),
      // Target bar
      lumBar(rx + gaugeW / 2, -70, gaugeW, 52, {
        color: COSMOS.dim,
        fillOpacity: 0.1,
        strokeWidth: 1.8,
        glow: 0,
        opacity: rightA,
      }),
      lumBar(rx + (gaugeW * mfuFill) / 2, -70, gaugeW * mfuFill, 52, {
        color: ROLE.compute,
        fillOpacity: 0.42,
        strokeWidth: 2.6,
        glow: 10,
        opacity: rightA,
      }),
      txt('Measured MFU vs peak', rx, 5, 26, ROLE.compute, 'mono', 'left').opacity(rightA),
      txt('Profile kernels, comms & stalls', rx, 75, 26, COSMOS.muted, 'sans', 'left').opacity(
        rightA,
      ),
      txt('Slow interconnect stretches time', rx, 130, 26, COSMOS.muted, 'sans', 'left').opacity(
        rightA,
      ),
      txt('without changing loss at step T', rx, 178, 26, ROLE.optimal, 'sans', 'left').opacity(
        rightA,
      ),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.cap, ROLE.compute), title, stageLayer);
  scenePulse(s, c, pulse);

  playCue(s, c, 'sl-mid-scale-gate-0', (d) => s.play(tolGlow.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'gate-observed', (d) => s.play(obsVis.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'sl-mid-scale-gate-1', (d) => s.play(gapGrow.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'gate-hold', (d) => s.play(holdVis.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'sl-mid-scale-gate-2', (d) => s.play(thruVis.to(1, { duration: d })), { dur: 0.9 });
}
