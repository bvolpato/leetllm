import { complete, sentence } from '../construction.mjs';
import { drawChapterCard, drawChapterFooter, drawChapterText } from '../defaults.mjs';
export function drawOffloadDomains(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    currentBeat = state.beat;
  const sentenceProgress = (beat, index) => sentence(state, 'offload-domains', beat, index),
    resultComplete = (beat, index) => complete(state, 'offload-domains', beat, index);
  api.focus.target('offload-domains-construction', () => {
    drawOffloadDomains();
  });
  function drawOffloadDomains() {
    if (currentBeat === 0) {
      const movement = sentenceProgress(0, 0),
        nvme = sentenceProgress(0, 1);
      drawChapterText(ctx, api, 'GPU', 380, 330, 37, themeColors.blue, 'center');
      drawChapterText(ctx, api, 'CPU', 960, 330, 37, themeColors.pink, 'center');
      drawChapterText(ctx, api, 'NVMe', 1540, 330, 37, themeColors.cyan, 'center');
      drawChapterCard(ctx, api, 'Compute W remains here', 150, 410, 460, themeColors.blue, 100, 29);
      drawChapterCard(ctx, api, 'Optimizer computation', 730, 410, 460, themeColors.pink, 100, 29);
      const gpu = drawChapterCard(
          ctx,
          api,
          movement === 1 ? 'Optimizer arrays released' : 'Master W + m + v',
          150,
          610,
          460,
          movement === 1 ? themeColors.muted : themeColors.pink,
          105,
          29,
        ),
        cpu = drawChapterCard(
          ctx,
          api,
          movement < 1
            ? 'State destination'
            : nvme === 1
              ? 'Staging before update'
              : 'Master W + m + v',
          730,
          610,
          460,
          movement === 1 ? themeColors.pink : themeColors.muted,
          105,
          29,
        ),
        disk = drawChapterCard(
          ctx,
          api,
          nvme === 1 ? 'Master W + m + v' : 'Optional state destination',
          1310,
          610,
          460,
          nvme === 1 ? themeColors.pink : themeColors.muted,
          105,
          28,
        );
      teaching.transfer({
        source: {
          shape: gpu,
          opacity: 1,
        },
        target: {
          shape: cpu,
          opacity: 1,
        },
        progress: movement,
        color: themeColors.pink,
        particle: {
          radius: 8,
          fill: themeColors.pink,
        },
      });
      if (nvme > 0)
        teaching.transfer({
          source: {
            shape: cpu,
            opacity: 1,
          },
          target: {
            shape: disk,
            opacity: 1,
          },
          progress: nvme,
          color: themeColors.pink,
          particle: {
            radius: 8,
            fill: themeColors.pink,
          },
        });
      if (resultComplete(0, 3)) {
        drawChapterText(
          ctx,
          api,
          'NVMe state → CPU staging → CPU optimizer computation',
          960,
          825,
          35,
          themeColors.yellow,
          'center',
        );
      }
      drawChapterText(
        ctx,
        api,
        'Optimizer offload: stages 1–3 · parameter offload: stage 3',
        960,
        940,
        32,
        themeColors.muted,
        'center',
      );
    } else {
      const transfer = 4,
        compute = 6,
        dependency = sentenceProgress(1, 2),
        dependent = dependency > 0,
        time = currentBeat > 1 ? 10 : 10 * Math.max(sentenceProgress(1, 0), sentenceProgress(1, 2));
      drawChapterText(
        ctx,
        api,
        resultComplete(1, 0)
          ? 'Supplied transfer bound: 20 GB / achieved 5 GB/s = 4 s'
          : 'Supplied inputs: 20 GB · achieved 5 GB/s · compute 6 s',
        960,
        285,
        32,
        themeColors.yellow,
        'center',
      );
      teaching.timeline({
        x: 150,
        y: 390,
        width: 1600,
        height: 360,
        domain: [0, 10],
        time,
        lanes: [
          {
            id: 'move',
            label: 'Move state',
          },
          {
            id: 'work',
            label: 'Consumer',
          },
        ],
        intervals: [
          {
            id: 'transfer',
            label: resultComplete(1, 0) ? '20 GB · 4 s' : '20 GB',
            lane: 'move',
            start: 0,
            end: transfer,
            color: themeColors.blue,
          },
          {
            id: 'work',
            label: '6 s compute',
            lane: 'work',
            start: transfer * dependency,
            end: transfer * dependency + compute,
            color: themeColors.pink,
          },
        ],
        ticks: [0, 2, 4, 6, 8, 10],
        labelWidth: 230,
        fontSize: 27,
        color: themeColors.muted,
        trackColor: themeColors.panel,
        cursorColor: themeColors.yellow,
      });
      if (resultComplete(1, 2))
        drawChapterText(
          ctx,
          api,
          'Dependent lower bound: 4 + 6 = 10 s',
          960,
          875,
          39,
          themeColors.yellow,
          'center',
        );
      else if (resultComplete(1, 1) && !dependent)
        drawChapterText(
          ctx,
          api,
          'Ideal independent lower bound: max(4,6) = 6 s',
          960,
          875,
          39,
          themeColors.green,
          'center',
        );
      drawChapterFooter(
        ctx,
        api,
        'Achieved bandwidth and dependency bounds · no runtime benchmark',
      );
    }
  }
}
export default {
  id: 'offload-domains',
  draw: drawOffloadDomains,
  cues: [
    'ds-offload-domains-b0-s0',
    'ds-offload-domains-b0-s1',
    'ds-offload-domains-b0-s2',
    'ds-offload-domains-b0-s3',
    'ds-offload-domains-b1-s0',
    'ds-offload-domains-b1-s1',
    'ds-offload-domains-b1-s2',
    'ds-offload-domains-b1-s3',
    'ds-offload-domains-b2-s0',
    'ds-offload-domains-b2-s1',
    'ds-offload-domains-b2-s2',
    'ds-offload-domains-b2-s3',
  ],
};
