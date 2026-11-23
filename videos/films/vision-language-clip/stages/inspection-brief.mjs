import { workerSchedule } from '../model.mjs';
import {
  drawInspectionBox,
  drawInspectionLine,
  drawInspectionRectangle,
  drawInspectionText,
  inspectionCueProgress,
  inspectionCueVisible,
  rackPhoto,
} from '../defaults.mjs';
export function drawInspectionBrief(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('inspection-budget', () => {
    if (currentBeat < 2) {
      rackPhoto(ctx, api, 220, 345, 600, 470, {
        selected: currentBeat === 0 ? 'tag' : 'vent',
      });
      drawInspectionBox(
        ctx,
        api,
        'image17@v1\ntenant Ops · site East',
        1010,
        330,
        680,
        125,
        themeColors.cyan,
      );
      const labels =
        currentBeat === 0
          ? [
              'Search → ranked image candidate',
              'OCR → exact asset-tag text',
              'Grounding → located vent region',
            ]
          : [
              'Server scope narrows request sites',
              'Analysis rechecks current image access',
              'answered / abstained / review + evidence',
            ];
      labels.forEach((s, i) =>
        drawInspectionBox(
          ctx,
          api,
          s,
          970,
          530 + i * 130,
          780,
          90,
          [themeColors.cyan, themeColors.yellow, themeColors.blue][i],
        ),
      );
      drawInspectionText(
        ctx,
        api,
        'Search, tag and vent box all refer to this version of the photo',
        960,
        1010,
        29,
        themeColors.muted,
      );
    } else if (currentBeat === 2) {
      drawInspectionText(ctx, api, 'Proposed workload requirements', 960, 300, 40, themeColors.ink);
      drawInspectionBox(ctx, api, 'Search p95 < 300 ms', 260, 430, 650, 155, themeColors.cyan);
      drawInspectionBox(ctx, api, 'Analysis < 3 s', 1030, 430, 650, 155, themeColors.blue);
      for (let i = 0; i < 2; i++)
        drawInspectionBox(
          ctx,
          api,
          'Shared worker ' + (i + 1),
          510 + i * 500,
          730,
          400,
          110,
          themeColors.yellow,
        );
      drawInspectionText(
        ctx,
        api,
        'Both search and analysis use these workers',
        960,
        1010,
        32,
        themeColors.muted,
      );
    } else {
      const cap = currentBeat === 3 ? 2 : 1,
        jobs = workerSchedule(cap),
        time =
          currentBeat === 3
            ? inspectionCueVisible(ctx, api, 'queue-search-late')
              ? 1100
              : 1000 * inspectionCueProgress(ctx, api, 'queue-starve')
            : inspectionCueVisible(ctx, api, 'queue-analysis-finish')
              ? 2000
              : inspectionCueVisible(ctx, api, 'queue-search-fast')
                ? 200
                : 200 * inspectionCueProgress(ctx, api, 'queue-search-first');
      drawInspectionText(
        ctx,
        api,
        'Same arrivals at 0 ms · same 2,200 worker-ms of work',
        960,
        280,
        34,
        themeColors.ink,
      );
      drawInspectionText(
        ctx,
        api,
        'Analysis A = A1 + A2 · 1,000 ms each · searches S1/S2 = 100 ms each',
        960,
        350,
        29,
        themeColors.muted,
      );
      drawInspectionText(
        ctx,
        api,
        'Concurrent analysis cap: ' + cap,
        960,
        425,
        34,
        cap === 1 ? themeColors.green : themeColors.pink,
      );
      const x = (t) => 350 + (t / 2200) * 1400,
        y = (w) => 560 + w * 210;
      for (let w = 0; w < 2; w++) {
        drawInspectionText(ctx, api, 'Worker ' + (w + 1), 210, y(w) + 65, 30, themeColors.ink);
        drawInspectionRectangle(
          ctx,
          api,
          350,
          y(w),
          1400,
          110,
          themeColors.panel,
          themeColors.line,
        );
      }
      for (const j of jobs) {
        const end = Math.min(j.end, Math.max(j.start, time)),
          width = ((end - j.start) / 2200) * 1400,
          color = j.type === 'analysis' ? themeColors.blue : themeColors.yellow;
        if (width > 0)
          drawInspectionRectangle(ctx, api, x(j.start), y(j.worker) + 12, width, 86, color, color);
        if (time >= j.end)
          drawInspectionText(
            ctx,
            api,
            j.id,
            x((j.start + j.end) / 2),
            y(j.worker) + 68,
            28,
            themeColors.bg,
          );
      }
      [0, 200, 1000, 2000].forEach((ms) => {
        drawInspectionLine(ctx, api, x(ms), 895, x(ms), 908, themeColors.muted, 2);
        drawInspectionText(ctx, api, ms + ' ms', x(ms), 950, 26, themeColors.muted);
      });
      if (currentBeat === 3 && inspectionCueVisible(ctx, api, 'queue-search-late'))
        drawInspectionText(
          ctx,
          api,
          'S1 = 1,100 ms · S2 = 1,100 ms',
          960,
          1020,
          34,
          themeColors.pink,
        );
      else if (currentBeat === 4 && inspectionCueVisible(ctx, api, 'queue-search-fast'))
        drawInspectionText(
          ctx,
          api,
          'S1 = 100 ms · S2 = 200 ms' +
            (inspectionCueVisible(ctx, api, 'queue-analysis-finish') ? ' · A = 2,000 ms' : ''),
          960,
          1020,
          33,
          themeColors.green,
        );
      else
        drawInspectionText(
          ctx,
          api,
          'Elapsed time since all three requests arrived',
          960,
          1020,
          29,
          themeColors.muted,
        );
    }
  });
}
export default {
  id: 'inspection-brief',
  draw: drawInspectionBrief,
  cues: [
    'inspection-evidence',
    'inspection-access',
    'inspection-latency',
    'queue-jobs',
    'queue-arrivals',
    'queue-starve',
    'queue-search-late',
    'queue-cap',
    'queue-search-first',
    'queue-search-fast',
    'queue-analysis-finish',
  ],
};
