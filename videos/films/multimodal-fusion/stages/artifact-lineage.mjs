import { clamp } from '../arithmetic.mjs';
import {
  drawExpandedArrow,
  drawExpandedBadge,
  drawExpandedFooter,
  text as drawExpandedText,
  drawExpandedTile,
} from '../defaults.mjs';

function incidentExcerpt(ctx, api, bracketY, color) {
  const { C } = api;
  api.rect(ctx, 115, 335, 795, 489, C.panel, C.muted, 12);
  api.text(ctx, 'I17   /   incident dashboard', 161, 405, 32, C.ink);
  for (const [name, y, trace, tone] of [
    ['CPU %', 500, [0, 2, 1, -2, 1, 0], C.pink],
    ['Latency p95', 660, [20, 20, 20, -9, -19, -20], C.green],
  ]) {
    api.text(ctx, name, 177, y + 12, 35, tone);
    api.path(
      ctx,
      trace.map((dy, i) => ({ x: 422 + i * 84, y: y + dy })),
      {
        color: tone,
        width: 6,
      },
    );
  }
  for (const [x, label] of [
    [422, '14:00'],
    [674, '14:03'],
    [842, '14:05'],
  ]) {
    api.text(ctx, label, x, 776, 28, C.muted, 'center');
  }
  // Brackets travel in the margins, so both metric names stay readable.
  for (const [x, length] of [
    [148, 15],
    [883, -15],
  ]) {
    api.path(
      ctx,
      [
        { x: x + length, y: bracketY - 50 },
        { x, y: bracketY - 50 },
        { x, y: bracketY + 50 },
        { x: x + length, y: bracketY + 50 },
      ],
      { color, width: 4 },
    );
  }
}

export function drawArtifactLineage(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cueProgress = (cue, fallback = progress) =>
    state.cues ? api.focus.progress(cue, fallback) : fallback;
  const full = cueProgress('mm-artifact-lineage-' + currentBeat),
    u = api.phase(full, 0.08, 0.82);
  api.focus.target('mm-artifact-lineage-construction', () => {
    const latency = currentBeat === 1 ? 0 : currentBeat === 0 ? 1 : u;
    incidentExcerpt(
      ctx,
      api,
      500 + 160 * latency,
      currentBeat === 1 ? themeColors.pink : themeColors.yellow,
    );
    if (currentBeat === 0) {
      const labels = [
        ['Source', 'I17 hash'],
        ['Crop', 'original coordinates'],
        ['Producer', 'processor + encoder'],
        ['Interface', 'connector / dtype / route'],
      ];
      labels.forEach(([a, v], i) => {
        const y = 350 + i * 135;
        drawExpandedText(ctx, api, a, 1010, y + 35, 27, themeColors.muted);
        drawExpandedTile(
          ctx,
          api,
          v,
          1220,
          y,
          530,
          80,
          i === 1 ? themeColors.yellow : themeColors.cyan,
        );
      });
      drawExpandedArrow(ctx, api, 928, 660, 1180, 530, themeColors.yellow, u);
      drawExpandedFooter(
        ctx,
        api,
        'Temporal records retain their source sample interval, recording map and word spans.',
      );
    } else if (currentBeat === 1) {
      drawExpandedText(
        ctx,
        api,
        'Claim: p95 rose after deploy',
        1320,
        365,
        33,
        themeColors.yellow,
        'center',
      );
      ['Access permitted', 'Coordinates in range'].forEach((s, i) =>
        drawExpandedText(ctx, api, '✓ ' + s, 1170, 500 + i * 100, 32, themeColors.green),
      );
      drawExpandedBadge(
        ctx,
        api,
        full === 1
          ? 'The box cites CPU usage. The claim is about latency.'
          : 'Which metric is inside the brackets?',
        full === 1 ? themeColors.pink : themeColors.yellow,
      );
    } else {
      drawExpandedTile(
        ctx,
        api,
        'Partial answer: latency rose',
        1090,
        450,
        620,
        90,
        themeColors.yellow,
      );
      drawExpandedTile(
        ctx,
        api,
        'Missing event times: abstain or review',
        1090,
        630,
        620,
        90,
        themeColors.pink,
      );
      if (latency === 1) drawExpandedArrow(ctx, api, 928, 660, 1050, 495, themeColors.yellow);
      drawExpandedFooter(
        ctx,
        api,
        'Partial output needs explicit policy permission and the same source-support checks.',
      );
    }
  });
}
export default {
  id: 'artifact-lineage',
  draw: drawArtifactLineage,
  cues: ['mm-artifact-lineage-0', 'mm-artifact-lineage-1', 'mm-artifact-lineage-2'],
};
