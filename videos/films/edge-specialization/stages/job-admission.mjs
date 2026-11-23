import { clamp } from '../construction.mjs';
import { edgeState } from '../model.mjs';
import {
  drawEdgeCard,
  drawEdgeL,
  drawEdgeMove,
  drawEdgeRectangle,
  drawEdgeRow,
  drawEdgeText,
} from '../defaults.mjs';
export function drawJobAdmission(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = edgeState('job-admission', state),
    { b: currentBeat, q, done, progress } = modelState;
  let edgeHeading = '',
    edgeNote = '';
  const note = (v) => (edgeNote = v),
    heading = (v) => (edgeHeading = v);
  api.focus.target('edge-job-admission-mechanism', () => {
    heading(
      currentBeat === 0
        ? 'Choose the output contract before choosing weights'
        : currentBeat === 1
          ? 'One request, two generation clocks'
          : 'Apply each job’s own predicates',
    );
    if (currentBeat === 0) {
      const jobs = [
        ['E2 definition', 'indexed lookup', 'battery low'],
        ['fault or escalation?', 'classifier', 'intent label'],
        ['why this action?', 'applicable evidence', 'supported explanation'],
        ['photo + text', 'vision contract', 'defined decision'],
      ];
      jobs.forEach((r, i) => {
        const y = 350 + i * 145;
        drawEdgeRow(
          ctx,
          api,
          r,
          150,
          y,
          1600,
          85,
          [themeColors.blue, themeColors.green, themeColors.yellow, themeColors.pink][i],
        );
        drawEdgeMove(
          ctx,
          api,
          {
            x: 680,
            y: y + 110,
          },
          {
            x: 1150,
            y: y + 110,
          },
          clamp(q * 4 - i),
          themeColors.cyan,
        );
      });
    } else if (currentBeat === 1) {
      const phases = [
        'dispatch',
        'retrieval',
        'template',
        'tokenize',
        'prefill',
        'hidden tokens',
        'visible answer',
      ];
      phases.forEach((v, i) => {
        const x = 140 + i * 235;
        drawEdgeCard(
          ctx,
          api,
          v,
          x,
          450,
          220,
          i === 5 ? themeColors.pink : i === 6 ? themeColors.green : themeColors.blue,
          105,
        );
        if (i < 6) drawEdgeL(ctx, api, x + 220, 502, x + 235, 502, themeColors.muted);
      });
      const p = q * 6;
      drawEdgeRectangle(ctx, api, 240 + Math.min(p, 6) * 235, 585, 18, 18, themeColors.yellow);
      drawEdgeL(ctx, api, 250, 690, 1530, 690, themeColors.blue, 4);
      drawEdgeText(ctx, api, 'first generated token', 1320, 745, 28, themeColors.pink, 'center');
      if (done('visible-clock')) {
        drawEdgeL(ctx, api, 250, 825, 1660, 825, themeColors.green, 5);
        drawEdgeText(
          ctx,
          api,
          'first visible answer token',
          1480,
          885,
          29,
          themeColors.green,
          'center',
        );
      }
      drawEdgeText(
        ctx,
        api,
        'Illustrative order and spacing; no supplied phase durations',
        960,
        960,
        27,
        themeColors.muted,
        'center',
      );
    } else {
      const rows = [
        ['Intent', 42, 60, 0.98, 0.97, 'intent'],
        ['Policy Q&A', 228, 250, 0.93, 0.92, 'policy'],
        ['Photo', 470, 400, 0.91, 0.92, 'photo'],
      ];
      drawEdgeRow(
        ctx,
        api,
        ['Job', 'Latency / strict limit', 'Quality / floor', 'Local privacy', 'Decision'],
        150,
        350,
        1600,
        80,
        themeColors.cyan,
      );
      rows.forEach(([name, ms, lim, v, f, k], i) => {
        const ready = done(k);
        drawEdgeRow(
          ctx,
          api,
          [
            name,
            `${ms} / < ${lim} ms`,
            `${v} / ≥ ${f}`,
            'trusted true',
            ready ? (ms < lim && v >= f ? 'PASS' : 'HOLD') : 'pending',
          ],
          150,
          480 + i * 145,
          1600,
          90,
          ready && i === 2 ? themeColors.pink : themeColors.blue,
        );
      });
    }
    note('Invented device worksheet; actual hardware qualification remains open');
  });
  if (edgeHeading) drawEdgeText(ctx, api, edgeHeading, 960, 270, 33, themeColors.yellow, 'center');
  if (edgeNote) drawEdgeText(ctx, api, edgeNote, 960, 1020, 26, themeColors.muted, 'center');
}
export default {
  id: 'job-admission',
  draw: drawJobAdmission,
  cues: [
    'edge-job-admission-op-0',
    'edge-job-admission-op-1',
    'edge-job-admission-visible-clock',
    'edge-job-admission-op-2',
    'edge-job-admission-intent',
    'edge-job-admission-policy',
    'edge-job-admission-photo',
  ],
};
