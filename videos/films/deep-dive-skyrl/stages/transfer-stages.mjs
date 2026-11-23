import { skyChapterModel } from '../model.mjs';
import {
  drawSkyChapterArrow,
  drawSkyChapterBox,
  drawSkyChapterFoot,
  drawSkyChapterRow,
  drawSkyChapterTable,
  drawSkyChapterText,
  drawSkyChapterTitle,
} from '../defaults.mjs';
export function drawTransferStages(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('transfer-stages', state),
    cueProgress = () => api.focus.progress(`sky-${'transfer-stages'}-b${currentBeat}`, progress),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-transfer-stages-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'Four logical stages retain distinct completion states'
        : currentBeat === 1
          ? 'The selected placement changes transport and in-flight treatment'
          : 'A strategy choice still needs complete fleet evidence',
    );
    if (!currentBeat) {
      const completed = done('transfer-finish') ? 4 : Math.min(3, Math.floor(cueProgress() * 4)),
        labels = ['initialize', 'start update', 'transfer chunks', 'finish'];
      labels.forEach((v, i) => {
        drawSkyChapterBox(
          ctx,
          api,
          v,
          170 + i * 440,
          380,
          380,
          100,
          i < completed ? themeColors.green : themeColors.muted,
          31,
        );
        if (i < 3) drawSkyChapterArrow(ctx, api, 560 + i * 440, 430, 590 + i * 440, 430);
      });
      drawSkyChapterRow(ctx, api, ['chunk0', 'chunk1', 'chunk2', 'chunk3'], 625, {
        x: 220,
        width: 1480,
        colors: [0, 1, 2, 3].map((i) =>
          completed > 2 || (completed === 2 && cueProgress() > i / 4)
            ? themeColors.cyan
            : themeColors.muted,
        ),
      });
      if (done('rpc-adapter')) {
        drawSkyChapterText(
          ctx,
          api,
          '/collective_rpc → skyrl_start_weight_update',
          960,
          845,
          30,
          themeColors.cyan,
          'center',
        );
        drawSkyChapterText(
          ctx,
          api,
          'update_weights_nccl / ipc → skyrl_finish_weight_update',
          960,
          920,
          28,
          themeColors.cyan,
          'center',
        );
      }
    } else if (currentBeat === 1) {
      const ipc = done('ipc-placement');
      drawSkyChapterBox(
        ctx,
        api,
        ipc ? 'trainer + sampler share device memory' : 'trainer rank0',
        190,
        390,
        610,
        120,
        themeColors.blue,
        31,
      );
      drawSkyChapterBox(
        ctx,
        api,
        ipc ? 'CUDA IPC + sleep / wake' : 'paused sampler fleet',
        1110,
        390,
        620,
        120,
        themeColors.cyan,
        31,
      );
      drawSkyChapterArrow(ctx, api, 820, 450, 1080, 450, themeColors.yellow);
      drawSkyChapterRow(ctx, api, ['11', '12', '90', '21', '22'], 710, {
        color: done('keep-mode') ? themeColors.blue : themeColors.muted,
      });
      drawSkyChapterText(
        ctx,
        api,
        ipc
          ? 'Memory lifecycle and synchronization must match this protocol'
          : done('keep-mode')
            ? 'KEEP retains the in-flight token history'
            : 'KEEP / ABORT / WAIT have different partial-result and drain semantics',
        960,
        925,
        30,
        themeColors.yellow,
        'center',
      );
    } else {
      drawSkyChapterTable(
        ctx,
        api,
        [
          ['strategy', 'resource boundary'],
          ['NCCL broadcast', 'trainer + network peers'],
          ['CUDA IPC', 'shared local device memory'],
          ['delta / shared storage', 'artifact + storage access'],
          ['NIXL / RDMA', 'selected network/server capability'],
        ],
        220,
        365,
        1480,
        440,
        29,
      );
      drawSkyChapterText(
        ctx,
        api,
        done('fleet-probes')
          ? 'Target version + finished protocol + probes required on every replica'
          : 'Keep the chosen strategy attached to its resource and server receipt',
        960,
        940,
        30,
        done('fleet-probes') ? themeColors.green : themeColors.yellow,
        'center',
      );
    }
    drawSkyChapterFoot(
      ctx,
      api,
      'Illustrative protocol state · no actual transport, endpoint or GPU completion is claimed',
    );
  });
}
export default {
  id: 'transfer-stages',
  draw: drawTransferStages,
  cues: [
    'sky-transfer-stages-b0',
    'sky-transfer-finish',
    'sky-rpc-adapter',
    'sky-transfer-stages-b1',
    'sky-keep-mode',
    'sky-ipc-placement',
    'sky-transfer-stages-b2',
    'sky-fleet-probes',
  ],
};
