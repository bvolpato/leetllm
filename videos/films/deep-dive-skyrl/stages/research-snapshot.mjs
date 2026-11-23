import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterFoot,
  drawSkyChapterL,
  drawSkyChapterTable,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawResearchSnapshot(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('research-snapshot', state),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-research-snapshot-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'Dispatcher speed relative to naive asynchronous batching'
        : currentBeat === 1
          ? 'Issues solved on the first attempt'
          : 'What changes between recipes?',
    );
    if (!currentBeat) {
      drawSkyChapterL(ctx, api, 510, 840, 1710, 840, themeColors.muted, 3);
      drawSkyChapterText(ctx, api, 'naive async', 170, 470, 32, themeColors.blue);
      drawSkyChapterText(ctx, api, 'reported dispatcher', 170, 695, 30, themeColors.cyan);
      api.rect(ctx, 510, 410, 660, 90, themeColors.blue);
      drawSkyChapterText(ctx, api, '1× reference', 1210, 470, 33, themeColors.blue);
      if (done('dispatcher-result')) {
        api.rect(ctx, 510, 635, 660 * 1.55, 90, themeColors.cyan);
        drawSkyChapterText(ctx, api, '1.55×', 1590, 695, 35, themeColors.cyan);
      } else drawSkyChapterText(ctx, api, 'ratio pending', 1160, 695, 34, themeColors.muted);
      drawSkyChapterText(
        ctx,
        api,
        'CPU tool calls overlap with GPU token generation',
        960,
        945,
        31,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      const rows = [
        ['Qwen3-32B', 24.4, 'paper-baseline', themeColors.blue],
        ['SA-SWE-32B', 39.4, 'paper-trained', themeColors.cyan],
      ];
      drawSkyChapterL(ctx, api, 640, 840, 1740, 840, themeColors.muted, 3);
      for (const tick of [0, 20, 40, 60, 80, 100]) {
        drawSkyChapterL(ctx, api, 640 + tick * 11, 830, 640 + tick * 11, 850, themeColors.muted, 2);
        drawSkyChapterText(
          ctx,
          api,
          tick + '%',
          640 + tick * 11,
          890,
          26,
          themeColors.muted,
          'center',
        );
      }
      rows.forEach(([name, value, cue, col], i) => {
        drawSkyChapterText(ctx, api, name, 170, 470 + i * 225, 34, col);
        if (done(cue)) {
          api.rect(ctx, 640, 410 + i * 225, value * 11, 95, col);
          drawSkyChapterText(
            ctx,
            api,
            value.toFixed(1) + '%',
            680 + value * 11,
            470 + i * 225,
            33,
            col,
          );
        } else
          drawSkyChapterText(
            ctx,
            api,
            'result pending',
            1030,
            470 + i * 225,
            32,
            themeColors.muted,
          );
      });
      drawSkyChapterText(
        ctx,
        api,
        'SWE-bench Verified · simplified ReAct · editor + bash · 40k context · 100 steps',
        960,
        980,
        28,
        themeColors.yellow,
        'center',
      );
    } else {
      drawSkyChapterTable(
        ctx,
        api,
        [
          ['recipe', 'changed mechanism', 'comparison still needed'],
          ['DAPO', 'filtering + token objectives', 'reward / data / normalization'],
          ['AReaL', 'overlap + staleness', 'matched policy / work / evaluation'],
          ['this SkyRL fixture', 'declared source contracts', 'actual selected implementation'],
        ],
        190,
        405,
        1540,
        360,
        29,
      );
      drawSkyChapterText(
        ctx,
        api,
        'Hold the task, policy and reward fixed to compare schedules',
        960,
        935,
        36,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat < 2) drawSkyChapterFoot(ctx, api, 'Source: SkyRL-Agent, 2025');
  });
}
export default {
  id: 'research-snapshot',
  draw: drawResearchSnapshot,
  cues: [
    'sky-research-snapshot-b0',
    'sky-dispatcher-result',
    'sky-research-snapshot-b1',
    'sky-paper-baseline',
    'sky-paper-trained',
    'sky-research-snapshot-b2',
  ],
};
