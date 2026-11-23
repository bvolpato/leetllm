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
export function drawTinkerFutures(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress } = skyChapterModel('tinker-futures', state),
    cueProgress = () => api.focus.progress(`sky-${'tinker-futures'}-b${currentBeat}`, progress),
    R = (id) => api.focus.progress('sky-' + id, state.cues ? 0 : progress),
    done = (id) => R(id) >= 1;
  api.focus.target('sky-tinker-futures-mechanism', () => {
    drawSkyChapterTitle(
      ctx,
      api,
      !currentBeat
        ? 'A persisted future ID is not a completed operation'
        : currentBeat === 1
          ? 'Accumulation and sampler publication have separate barriers'
          : 'Sampler export and training checkpoint retain different state',
    );
    if (!currentBeat) {
      const n = done('future-completion') ? 3 : Math.min(3, Math.floor(cueProgress() * 4)),
        labels = [
          'API: accept F7',
          'database: persist F7',
          'engine: dispatch F7',
          'backend: execute',
        ];
      labels.forEach((v, i) => {
        drawSkyChapterBox(
          ctx,
          api,
          v,
          165 + i * 440,
          420,
          380,
          100,
          i <= n ? themeColors.blue : themeColors.muted,
          28,
        );
        if (i < 3) drawSkyChapterArrow(ctx, api, 555 + i * 440, 470, 585 + i * 440, 470);
      });
      drawSkyChapterBox(
        ctx,
        api,
        done('future-completion') ? 'F7: completed' : 'F7: pending / running',
        520,
        760,
        880,
        120,
        done('future-completion') ? themeColors.green : themeColors.yellow,
        40,
      );
      drawSkyChapterText(
        ctx,
        api,
        'Supplied operation fixture · future identity persists across every stage',
        960,
        955,
        30,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      const q = R('accumulate-gradients'),
        g1 = q > 0 ? 0.2 : 0,
        g2 = q > 0.45 ? 0.3 : 0,
        step = done('accumulate-gradients'),
        synced = done('sampler-sync');
      drawSkyChapterTable(
        ctx,
        api,
        [
          ['supplied scalar fixture', 'backward1', 'backward2', 'accumulated'],
          ['gradient', g1.toFixed(1), g2.toFixed(1), (g1 + g2).toFixed(1)],
        ],
        180,
        380,
        1560,
        230,
        29,
      );
      drawSkyChapterBox(
        ctx,
        api,
        step ? 'trainer w: 1 − .1×.5 = .95' : 'optimizer step pending',
        220,
        720,
        690,
        115,
        step ? themeColors.green : themeColors.yellow,
        32,
      );
      drawSkyChapterBox(
        ctx,
        api,
        synced ? 'sampler: published version 19' : 'sampler: old version 11',
        1030,
        720,
        690,
        115,
        synced ? themeColors.green : themeColors.pink,
        32,
      );
      drawSkyChapterText(
        ctx,
        api,
        'Toy accumulation arithmetic · trainer update alone does not synchronize the sampler',
        960,
        950,
        29,
        themeColors.yellow,
        'center',
      );
    } else {
      const ephemeral = done('ephemeral-client');
      drawSkyChapterBox(
        ctx,
        api,
        'Persistent sampler export',
        170,
        375,
        730,
        100,
        themeColors.blue,
        34,
      );
      drawSkyChapterBox(
        ctx,
        api,
        'Ephemeral sampling client',
        1020,
        375,
        730,
        100,
        themeColors.cyan,
        33,
      );
      drawSkyChapterBox(
        ctx,
        api,
        'model weight artifact',
        170,
        625,
        730,
        110,
        themeColors.blue,
        36,
      );
      drawSkyChapterBox(
        ctx,
        api,
        ephemeral ? 'client; no disk export' : 'pending client',
        1020,
        625,
        730,
        110,
        ephemeral ? themeColors.green : themeColors.muted,
        34,
      );
      drawSkyChapterRow(ctx, api, ['model', 'optimizer', 'scheduler', 'data / RNG progress'], 850, {
        x: 170,
        width: 1580,
        color: themeColors.yellow,
        size: 28,
      });
    }
    drawSkyChapterFoot(
      ctx,
      api,
      'A service-style API receipt is separate from real server, optimizer or device execution',
    );
  });
}
export default {
  id: 'tinker-futures',
  draw: drawTinkerFutures,
  cues: [
    'sky-tinker-futures-b0',
    'sky-future-completion',
    'sky-tinker-futures-b1',
    'sky-accumulate-gradients',
    'sky-sampler-sync',
    'sky-tinker-futures-b2',
    'sky-ephemeral-client',
  ],
};
