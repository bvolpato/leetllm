import { bounded } from '../arithmetic.mjs';
import { onWords } from '../card-memory.mjs';
import { SHARDS } from '../fixtures.mjs';
import {
  drawExpandedLine,
  drawExpandedText,
  drawExpandedTile,
  drawExpandedTitle,
} from '../defaults.mjs';
export function drawOffload(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0);
  const cueProgress = (a = 0.1, z = 0.85) => api.phase(progress, a, z);
  {
    if (currentBeat === 2) drawExpandedTitle(ctx, api, 'DeepSpeed   /   ZeRO stage 3');
    const xs = [220, 780, 1340],
      names = ['GPU HBM', 'CPU RAM', 'NVMe'];
    if (currentBeat < 2)
      names.forEach((n, i) => {
        drawExpandedLine(
          ctx,
          api,
          xs[i],
          750,
          xs[i] + 360,
          750,
          [themeColors.blue, themeColors.yellow, themeColors.pink][i],
          5,
        );
        drawExpandedText(
          ctx,
          api,
          n,
          xs[i] + 180,
          350,
          34,
          [themeColors.blue, themeColors.yellow, themeColors.pink][i],
          'center',
        );
      });
    if (currentBeat === 0) {
      const q = cueProgress();
      SHARDS.forEach((id, i) => {
        const initial = xs[q < 0.5 ? 0 : 1] + 35 + i * 74,
          target = xs[q < 0.5 ? 1 : 2] + 35 + i * 74,
          mix = q < 0.5 ? q * 2 : (q - 0.5) * 2;
        drawExpandedTile(
          ctx,
          api,
          id,
          initial + (target - initial) * mix,
          520,
          65,
          70,
          themeColors.cyan,
        );
      });
      drawExpandedText(
        ctx,
        api,
        'FSDP CPU offload · DeepSpeed CPU / NVMe hierarchy',
        960,
        900,
        35,
        themeColors.ink,
        'center',
      );
      drawExpandedText(
        ctx,
        api,
        'Active compute still needs device-resident tensors',
        960,
        1010,
        28,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 1) {
      const q = onWords(state, api, 1, 'host-transfer', 0.18, 0.36);
      for (let i = 0; i < 4; i++) {
        const move = bounded(q * 4 - i),
          x = xs[1] + 100 - (xs[1] - xs[0]) * move;
        api.focus.target('host-copy', () =>
          drawExpandedTile(ctx, api, '1 GB', x, 470 + i * 65, 150, 52, themeColors.cyan));
      }
      drawExpandedText(
        ctx,
        api,
        '4 GB  ÷  20 GB/s' + (q === 1 ? '  =  200 ms' : ''),
        960,
        900,
        38,
        themeColors.yellow,
        'center',
      );
      drawExpandedText(
        ctx,
        api,
        'Host memory → GPU',
        960,
        1010,
        28,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 2) {
      const auto = onWords(state, api, 2, 'autotp-stages', 0.1, 0.17);
      const pipeline = onWords(state, api, 2, 'pipeline-stages', 0.18, 0.25);
      const parent = onWords(state, api, 2, 'expert-parent', 0.5, 0.66);
      const bucket = onWords(state, api, 2, 'bucket-bytes', 0.74, 0.86);
      const step = onWords(state, api, 2, 'managed-step', 0.87, 0.95);
      for (const [i, target, label, answer, shown, color] of [
        [0, 'autotp', 'AutoTP', 'Stages 0–3', auto, themeColors.green],
        [1, 'pipeline-module', 'PipelineModule', 'Stages 0–1', pipeline, themeColors.pink],
      ]) {
        const y = 375 + i * 165;
        api.focus.target(target, () => {
          drawExpandedTile(ctx, api, label, 325, y, 570, 112, themeColors.blue);
          drawExpandedTile(ctx, api, shown === 1 ? answer : '?', 1025, y, 570, 112,
            shown === 1 ? color : themeColors.muted);
        });
      }
      api.focus.target('integration-detail', () => {
        const detail = step > 0 ? 'DeepSpeed scales the loss and schedules the optimizer step.'
          : bucket > 0 ? '500M elements  ×  2 bytes' + (bucket === 1 ? '  =  1 GB' : '')
          : parent > 0 ? 'One leaf module gathers the experts on every rank.'
          : pipeline === 1 ? 'Try one step with AutoTP + ZeRO-3.' : '';
        if (detail) api.text(ctx, detail, 960, 899, 43, themeColors.ink, 'center');
      });
    }
    return;
  }
  return;
}
export default {
  id: 'offload',
  draw: drawOffload,
  cues: ['host-transfer', 'autotp-stages', 'pipeline-stages', 'expert-parent', 'bucket-bytes', 'managed-step'],
};
