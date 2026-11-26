// Scene 15: reads - Saved work, growing reads
// Glowing O(N) history-reads curve (gold -> amber -> rose) climbing above flat emerald O(1) write line,
// paired with a live causal row scanner showing 1 green write + full yellow row read + bandwidth slowdown.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  glowingTrail,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function reads(s, c) {
  const phase = s.value(0);
  const growth = s.value(0.25); // grows 0.25 -> 1.0 along linear read curve
  const scanVis = s.value(0);
  const slowerVis = s.value(0);
  const bwVis = s.value(0);

  const header = cinemaHeader('DECODE SCALING', 'Saved writes,', 'growing reads', {
    x: -860,
    y: -415,
    accent: ROLE.focus,
    size: 54,
  });

  const stageAura = aura(240, 20, 620, '#ffd16624', '#ff6b8b18');

  const chartLeft = -95;
  const chartRight = 815;
  const chartBot = 290;
  const chartTop = -255;

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const g = growth.value;
      const ph = phase.value;
      const nodes = [];

      // Left-middle: Live Growing Row Scanner (1 green write square + yellow full-row read frame)
      const nCells = Math.max(3, Math.min(7, Math.round(2 + g * 5)));
      const cellW = 78;
      const startX = -820;
      const rowY = -36;
      nodes.push(txt('ACTIVE DECODE STEP', -855, -130, 26, COSMOS.muted, 'mono', 'left'));
      for (let i = 0; i < nCells; i++) {
        const cx = startX + i * 86;
        const isNewest = i === nCells - 1;
        nodes.push(
          rect(cellW, 66, {
            fill: isNewest ? '#0e2d25' : '#102536',
            stroke: isNewest ? ROLE.fresh : ROLE.key,
            width: isNewest ? 2.8 : 2.0,
            radius: 8,
          }).at(cx, rowY),
          txt(
            isNewest ? '+1' : `t${i + 1}`,
            cx,
            rowY,
            26,
            isNewest ? ROLE.fresh : ROLE.key,
            'mono',
          ),
        );
      }

      // Sweeping yellow full-row outline around ALL nCells
      const frameW = nCells * 86 + 10;
      const frameCx = startX - 43 + frameW * 0.5;
      if (scanVis.value > 0.05) {
        const scanX = startX - 38 + ((ph * 0.55) % 1) * (frameW - 14);
        nodes.push(
          rect(frameW, 84, { fill: null, stroke: ROLE.focus, width: 3.0, radius: 12 })
            .at(frameCx, rowY)
            .glow(10, ROLE.focus)
            .opacity(scanVis.value),
          glowDot(scanX, rowY + 42, {
            radius: 7,
            color: ROLE.focus,
            glow: 14,
            opacity: scanVis.value,
          }),
          txt(
            `1 new K, V written  ·  ${nCells} positions read`,
            -855,
            62,
            26,
            ROLE.focus,
            'mono',
            'left',
          ).opacity(scanVis.value),
        );
      }

      if (slowerVis.value > 0.05) {
        nodes.push(
          txt('Longer row -> slower decode per token', -855, 168, 28, ROLE.link, 'sans', 'left')
            .glow(5, ROLE.link)
            .opacity(slowerVis.value),
        );
      }
      if (bwVis.value > 0.05) {
        nodes.push(
          txt('MEMORY BANDWIDTH SETS THE PACE', -855, 242, 30, ROLE.waste, 'mono', 'left')
            .glow(8, ROLE.waste)
            .opacity(bwVis.value),
        );
      }

      // Right: Glowing Cost-Per-Token Chart (Linear O(N) Reads vs Constant O(1) Writes)
      nodes.push(
        line([chartLeft, chartBot], [chartRight + 16, chartBot], { stroke: '#4a5f8f', width: 2.6 }),
        line([chartLeft, chartBot], [chartLeft, chartTop - 16], { stroke: '#4a5f8f', width: 2.6 }),
        txt(
          'Context Length (N)',
          (chartLeft + chartRight) * 0.5,
          chartBot + 52,
          26,
          COSMOS.muted,
          'sans',
        ),
        txt('Work / step', chartLeft, chartTop - 44, 26, COSMOS.muted, 'mono'),
      );

      // Horizontal reference gridlines
      for (let k = 1; k <= 4; k++) {
        const yy = chartBot - (k / 4) * (chartBot - chartTop);
        nodes.push(
          line([chartLeft, yy], [chartRight, yy], { stroke: '#1e2c4a', width: 1.4, dash: [5, 6] }),
        );
      }

      // Flat emerald baseline: New K,V writes per step = 1 (constant O(1))
      const writeY = chartBot - 52;
      const xTip = chartLeft + g * (chartRight - chartLeft);
      nodes.push(
        glowingTrail(
          [
            [chartLeft, writeY],
            [Math.max(chartLeft + 24, xTip), writeY],
          ],
          { color: ROLE.fresh, width: 5.0, glow: 11 },
        ),
        txt('New K,V write = 1', chartRight - 140, writeY - 34, 26, ROLE.fresh, 'mono').glow(
          5,
          ROLE.fresh,
        ),
      );

      // Rising glowing linear curve: History reads per step = N (O(N))
      const readTipY = chartBot - 52 - g * (chartBot - chartTop - 75);
      const pts = [];
      const segs = 24;
      for (let i = 0; i <= segs; i++) {
        const u = i / segs;
        pts.push([
          chartLeft + u * (xTip - chartLeft),
          chartBot - 52 - u * (chartBot - 52 - readTipY),
        ]);
      }
      nodes.push(
        glowingTrail(pts, {
          gradientColors: [ROLE.focus, ROLE.link, ROLE.waste],
          width: 6.0,
          glow: 13,
        }),
        glowDot(xTip, readTipY, { radius: 9.5, color: '#ffffff', glow: 16 }),
        txt('History reads ~ O(N)', chartRight - 165, chartTop - 44, 28, ROLE.focus, 'mono').glow(
          7,
          ROLE.focus,
        ),
      );

      // Streaming photon markers racing up the linear read slope
      for (let p = 0; p < 4; p++) {
        const u = (ph * 0.45 + p * 0.25) % 1;
        const px = chartLeft + u * (xTip - chartLeft);
        const py = chartBot - 52 - u * (chartBot - 52 - readTipY);
        nodes.push(glowDot(px, py, { radius: 5.2, color: ROLE.focus, glow: 10, opacity: 0.85 }));
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, dyn);
  driftValue(s, c, phase, 6.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('saves', () => {
    s.play(growth.to(0.38, { duration: clampDur(c, c.cue('saves').start, 0.35) }));
  });
  c.on('still-reads', () => {
    s.play(scanVis.to(1, { duration: clampDur(c, c.cue('still-reads').start, 0.35) }));
  });
  c.on('linear', () => {
    s.play(growth.to(1.0, { duration: clampDur(c, c.cue('linear').start, 1.4) }));
  });
  c.on('slower', () => {
    s.play(slowerVis.to(1, { duration: clampDur(c, c.cue('slower').start, 0.35) }));
  });
  c.on('bandwidth', () => {
    s.play(bwVis.to(1, { duration: clampDur(c, c.cue('bandwidth').start, 0.35) }));
  });
}
