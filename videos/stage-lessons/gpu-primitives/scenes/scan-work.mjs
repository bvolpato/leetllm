// Scene 12: How many lanes add in each round? Hillis-Steele vs Blelloch per-round workload at N=32 and N=512.
import {
  COSMOS,
  SCAN_WORK_32,
  SCAN_WORK_512,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

function roundCounts(size, stages) {
  const strides = Array.from({ length: stages }, (_, r) => 2 ** r);
  const hillis = strides.map((st) => size - st);
  const up = strides.map((st) => size / (2 * st));
  const blelloch = [...up, ...up.toReversed()];
  return { hillis, blelloch };
}

const DATA_32 = roundCounts(32, SCAN_WORK_32.hillisStages);
const DATA_512 = roundCounts(512, SCAN_WORK_512.hillisStages);

export default function scanWorkScene(s, c) {
  const phase = s.value(0);
  const showH2 = s.value(0);
  const showHRest = s.value(0);
  const showHTotal = s.value(0);
  const showBUp = s.value(0);
  const showBDown = s.value(0);
  const showBTotal = s.value(0);

  const scale512 = s.value(0);
  const show512Counts = s.value(0);
  const show512Rounds = s.value(0);

  const bgAura = aura(0, 15, 620, '#60a5fa20', '#5ce1e618');

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const is512 = scale512.value > 0.5;
    const size = is512 ? 512 : 32;
    const work = is512 ? SCAN_WORK_512 : SCAN_WORK_32;
    const data = is512 ? DATA_512 : DATA_32;

    const hShown = is512
      ? data.hillis.length
      : 1 + (showH2.value > 0.5 ? 1 : 0) + Math.round((data.hillis.length - 2) * showHRest.value);
    const bShown = is512
      ? data.blelloch.length
      : Math.round((data.blelloch.length / 2) * showBUp.value) +
        Math.round((data.blelloch.length / 2) * showBDown.value);

    const hTotalOn = is512 ? show512Counts.value > 0.5 : showHTotal.value > 0.5;
    const bTotalOn = is512 ? show512Counts.value > 0.5 : showBTotal.value > 0.5;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.5);

    const chartLeft = -475;
    const chartWidth = 960;
    const step = chartWidth / data.blelloch.length;
    const hBaseY = 48;
    const bBaseY = 278;
    const maxBarH = 148;

    const nodes = [
      heroTitle([`Work vs Depth`, `N = ${size} Inputs`], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: is512 ? COSMOS.gold : COSMOS.cyan,
        eyebrow: 'ADDITIONS PER PARALLEL ROUND',
      }),

      txt('TOTAL ADDITIONS', 675, -185, 26, COSMOS.muted, 'mono'),
    ];

    const drawTrack = (name, counts, shown, totalShown, totalVal, baseY, col) => {
      const roundsCol = is512 && show512Rounds.value > 0.5 ? COSMOS.gold : COSMOS.muted;
      nodes.push(
        txt(name, -855, baseY - 94, 34, col, 'sans', 'left').glow(5, col),
        txt(`${counts.length} rounds`, -855, baseY - 46, 26, roundsCol, 'mono', 'left'),
        line([chartLeft, baseY], [chartLeft + chartWidth, baseY], {
          stroke: '#324166',
          width: 2.5,
        }),
      );
      counts.forEach((cnt, i) => {
        const cx = chartLeft + (i + 0.5) * step;
        if (i >= shown) return;
        const barH = Math.max(6, (maxBarH * cnt) / size);
        const barW = Math.max(16, step * 0.68);
        nodes.push(
          rect(barW, barH, { fill: col, stroke: '#ffffff', width: 1, radius: 4 })
            .at(cx, baseY - barH * 0.5)
            .glow(6, col)
            .opacity(0.9),
        );
        if (!is512 || i === 0 || i === counts.length - 1 || cnt === 1) {
          nodes.push(txt(String(cnt), cx, baseY - barH - 22, 26, COSMOS.ink, 'mono'));
        }
      });

      // Right-hand total readout box
      nodes.push(
        glassCell(675, baseY - 72, 310, 108, totalShown ? col : COSMOS.dim, {
          fill: totalShown ? '#0e2036' : '#0f1422',
          glow: totalShown ? 10 * pulse : 0,
        }),
        txt(
          totalShown ? totalVal.toLocaleString('en-US') : '?',
          675,
          baseY - 72,
          48,
          totalShown ? col : COSMOS.dim,
          'mono',
        ).glow(totalShown ? 8 : 0, col),
      );
    };

    drawTrack('Hillis-Steele', data.hillis, hShown, hTotalOn, work.hillis, hBaseY, COSMOS.blue);
    drawTrack('Blelloch', data.blelloch, bShown, bTotalOn, work.blelloch, bBaseY, COSMOS.cyan);

    // Bottom takeaway banner
    const ratio = (work.hillis / work.blelloch).toFixed(2);
    const msgCol = is512 && show512Counts.value > 0.5 ? COSMOS.gold : COSMOS.cyan;
    const msg = is512
      ? show512Counts.value > 0.5
        ? `Blelloch: ${ratio}× fewer additions · 2× rounds (18 vs 9) · measure on GPU`
        : 'Scale tile from 32 to 512 inputs'
      : 'Each vertical bar counts active lane additions in one round';

    nodes.push(
      glassCell(0, 395, 1580, 82, msgCol, { fill: '#101829', glow: 8 }),
      txt(msg, 0, 395, 28, msgCol, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, live);
  runPhase(s, c, phase, 14);

  c.on('work-second-stride', () => s.play(showH2.to(1, { duration: 0.35 })));
  c.on('work-final-strides', () => s.play(showHRest.to(1, { duration: 0.5 })));
  c.after('scan-work-step-1', () => s.play(showHTotal.to(1, { duration: 0.4 })));
  c.on('work-up', () => s.play(showBUp.to(1, { duration: 0.55 })));
  c.on('work-down', () => s.play(showBDown.to(1, { duration: 0.55 })));
  c.after('work-blelloch', () => s.play(showBTotal.to(1, { duration: 0.4 })));
  c.on('work-512', () => s.play(scale512.to(1, { duration: 0.45 })));
  c.after('work-larger-counts', () => s.play(show512Counts.to(1, { duration: 0.4 })));
  c.on('scan-work-step-2', () =>
    s.play(show512Rounds.to(1, { duration: remainDuration(c, 'scan-work-step-2', 0.45) })),
  );
}
