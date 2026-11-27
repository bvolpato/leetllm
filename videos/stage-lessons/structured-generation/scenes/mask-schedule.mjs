// Scene 12: mask-schedule - Wait for both the logits and the mask
// High-precision glowing 3-lane timeline oscilloscope (GPU 8 ms, CPU Mask 3 -> 10 ms, Sample 1 ms)
// on a 0..12 ms ruler with live sweeping clock cursor and MathJax max(t_gpu, t_mask) + t_sample!
// Beat 0: Serial 8+3+1 = 12 ms. Beat 1: Overlap max(8,3)+1 = 9 ms. Beat 2: Slow mask 10 ms ->
// exposes crimson GPU stall gap (8..10 ms), finishing at 11 ms.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  glowDot,
  glowTex,
  guardedDynamic,
  maskStepTime,
  txt,
} from '../parts.mjs';

export default function maskSchedule(s, c) {
  const mode = s.value(0); // 0 = serial (12 ms), 1 = overlap fast mask (9 ms), 2 = overlap slow mask (11 ms)
  const clockMs = s.value(0);
  const sampleShow = s.value(0);
  const waitHi = s.value(0);

  const header = cinemaHeader('CPU-GPU MASK OVERLAP', 'Wait for both the', 'logits and the mask', {
    accent: ROLE.gpu,
    size: 50,
  });

  const stageAura = aura(180, 50, 640, '#60a5fa1d', '#ffd16618');

  const overlapEq = glowTex(
    String.raw`t_{\text{step}} = \max(t_{\text{gpu}},\, t_{\text{mask}}) + t_{\text{sample}}`,
    { x: 375, y: -375, size: 34, color: ROLE.fsm, glow: 7 },
  );

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const m = mode.value;
      const clk = clockMs.value;
      const sh = sampleShow.value;
      const wh = waitHi.value;
      const nodes = [];

      const isSerial = m < 0.5;
      const isSlow = m > 1.5;
      const gpuDur = 8;
      const maskDur = isSlow ? 10 : 3;
      const sampDur = 1;
      const maskStart = isSerial ? 8 : 0;
      const sampStart = isSerial ? 11 : Math.max(gpuDur, maskDur);
      const totalMs = maskStepTime(gpuDur, maskDur, sampDur, !isSerial);

      const x0 = -590;
      const scale = 112; // 12 ms -> 1344 px (-590 to +754)
      const topY = -175;
      const botY = 235;

      // Precision millisecond ruler ticks
      for (const tick of [0, 3, 8, 10, 11, 12]) {
        const tx = x0 + tick * scale;
        nodes.push(
          line([tx, topY], [tx, botY], { stroke: '#233256', width: 1.8, dash: [6, 8] }),
          txt(`${tick} ms`, tx, topY - 44, 26, COSMOS.muted, 'mono', 'center'),
        );
      }

      const drawLane = (label, y, startMs, durMs, color, visible = true) => {
        nodes.push(txt(label, -840, y, 30, color, 'mono', 'left'));
        if (!visible) return;
        const bx = x0 + startMs * scale;
        const bw = durMs * scale;
        const fillFrac = Math.max(0, Math.min(1, (clk - startMs) / durMs));
        nodes.push(
          rect(bw, 78, { fill: '#10182e', stroke: color, width: 2.8, radius: 10 })
            .at(bx + bw * 0.5, y)
            .glow(7, color),
        );
        if (fillFrac > 0.02) {
          const fw = Math.max(10, (bw - 10) * fillFrac);
          nodes.push(
            rect(fw, 14, { fill: color, stroke: null, radius: 5 })
              .at(bx + 5 + fw * 0.5, y + 26)
              .glow(8, color),
          );
        }
        nodes.push(txt(`${durMs} ms`, bx + bw * 0.5, y - 4, 30, color, 'mono', 'center'));
      };

      drawLane('GPU', -95, 0, gpuDur, ROLE.gpu, true);
      drawLane('MASK', 30, maskStart, maskDur, ROLE.prefix, true);
      drawLane('SAMPLE', 155, sampStart, sampDur, ROLE.legal, sh > 0.1);

      // Crimson GPU stall gap (8..10 ms) when slow mask = 10 ms!
      if (isSlow && wh > 0.05) {
        const gx = x0 + 8 * scale;
        const gw = 2 * scale;
        nodes.push(
          rect(gw, 78, {
            fill: '#2c1122',
            stroke: ROLE.prune,
            width: 2.8,
            radius: 10,
            dash: [8, 6],
          })
            .at(gx + gw * 0.5, -95)
            .glow(10, ROLE.prune)
            .opacity(wh),
          txt('WAIT 2 ms', gx + gw * 0.5, -95, 26, ROLE.prune, 'mono', 'center')
            .glow(7, ROLE.prune)
            .opacity(wh),
        );
      }

      // Live sweeping clock markers on top & bottom rulers (never crosses lane text!)
      const clampedClk = Math.max(0, Math.min(12, clk));
      const laserX = x0 + clampedClk * scale;
      nodes.push(
        line([laserX, topY], [laserX, topY + 26], { stroke: ROLE.fsm, width: 4 }).glow(
          10,
          ROLE.fsm,
        ),
        glowDot(laserX, topY, { radius: 6, color: ROLE.fsm, glow: 12 }),
        line([laserX, botY - 26], [laserX, botY], { stroke: ROLE.fsm, width: 4 }).glow(
          10,
          ROLE.fsm,
        ),
        glowDot(laserX, botY, { radius: 6, color: ROLE.fsm, glow: 12 }),
      );

      // Bottom summary telemetry
      const modeLabel = isSerial
        ? 'SERIAL: 8 + 3 + 1 = 12 ms'
        : isSlow
          ? `SLOW MASK (10 ms): max(8, 10) + 1 = ${totalMs} ms`
          : `OVERLAP (3 ms): max(8, 3) + 1 = ${totalMs} ms`;
      nodes.push(
        txt(
          modeLabel,
          -840,
          310,
          36,
          isSlow ? ROLE.prune : isSerial ? ROLE.prefix : ROLE.legal,
          'mono',
          'left',
        ).glow(8, isSlow ? ROLE.prune : isSerial ? ROLE.prefix : ROLE.legal),
        txt(`CLOCK: ${clampedClk.toFixed(1)} ms`, 840, 310, 32, ROLE.fsm, 'mono', 'right'),
        txt(
          'GPU logits and CPU mask both read the already-accepted prefix; sampling waits for both',
          -840,
          380,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, overlapEq, stageView);

  c.on('sg-mask-schedule-0', () => {
    s.play(clockMs.to(8, { duration: clampDur(c, c.cue('sg-mask-schedule-0').start, 1.2) }));
  });
  c.on('sg-schedule-serial', () => {
    s.play(sampleShow.to(1, { duration: clampDur(c, c.cue('sg-schedule-serial').start, 0.25) }));
    s.play(clockMs.to(12, { duration: clampDur(c, c.cue('sg-schedule-serial').start, 0.9) }));
  });
  c.on('sg-mask-schedule-1', () => {
    s.play(mode.to(1, { duration: clampDur(c, c.cue('sg-mask-schedule-1').start, 0.3) }));
    s.play(sampleShow.to(0, { duration: 0.12 }));
    s.play(clockMs.to(0, { duration: 0.15 }));
  });
  c.on('sg-schedule-mask', () => {
    s.play(clockMs.to(3, { duration: clampDur(c, c.cue('sg-schedule-mask').start, 0.55) }));
  });
  c.on('sg-schedule-gpu', () => {
    s.play(clockMs.to(8, { duration: clampDur(c, c.cue('sg-schedule-gpu').start, 0.65) }));
  });
  c.on('sg-schedule-result', () => {
    s.play(sampleShow.to(1, { duration: clampDur(c, c.cue('sg-schedule-result').start, 0.25) }));
    s.play(clockMs.to(9, { duration: clampDur(c, c.cue('sg-schedule-result').start, 0.45) }));
  });
  c.on('sg-mask-schedule-2', () => {
    s.play(mode.to(2, { duration: clampDur(c, c.cue('sg-mask-schedule-2').start, 0.3) }));
    s.play(sampleShow.to(0, { duration: 0.12 }));
    s.play(clockMs.to(0, { duration: 0.15 }));
  });
  c.on('sg-schedule-change', () => {
    s.play(clockMs.to(8, { duration: clampDur(c, c.cue('sg-schedule-change').start, 0.5) }));
  });
  c.on('sg-schedule-wait', () => {
    s.play(waitHi.to(1, { duration: clampDur(c, c.cue('sg-schedule-wait').start, 0.4) }));
    s.play(clockMs.to(10, { duration: clampDur(c, c.cue('sg-schedule-wait').start, 0.55) }));
  });
  c.on('sg-schedule-slow-result', () => {
    s.play(
      sampleShow.to(1, { duration: clampDur(c, c.cue('sg-schedule-slow-result').start, 0.25) }),
    );
    s.play(clockMs.to(11, { duration: clampDur(c, c.cue('sg-schedule-slow-result').start, 0.45) }));
  });
}
