import { complete, sentence } from '../construction.mjs';
import { drawChapterFooter, drawChapterGrid, drawChapterText } from '../defaults.mjs';
export function drawEngineSource(ctx, scene, state, api) {
  const { C: themeColors, components, teaching } = api,
    currentBeat = state.beat;
  const sentenceProgress = (beat, index) => sentence(state, 'engine-source', beat, index),
    resultComplete = (beat, index) => complete(state, 'engine-source', beat, index);
  api.focus.target('engine-source-construction', () => {
    drawEngineSource();
  });
  function drawEngineSource() {
    const files = [
      'runtime/engine.py',
      'zero/stage_1_and_2.py',
      'zero/stage3.py',
      'zero/partition_parameters.py',
    ];
    drawChapterText(
      ctx,
      api,
      'Installed source c455031 · select the operation that actually failed',
      960,
      285,
      33,
      themeColors.yellow,
      'center',
    );
    if (currentBeat === 0) {
      files.forEach((file, i) => {
        const active = sentenceProgress(0, [1, 2, 2, 3][i]) > 0;
        components.card({
          label: active ? file : 'operation path pending',
          x: 170,
          y: 355 + i * 140,
          width: 820,
          height: 85,
          fontSize: 31,
          font: 'mono',
          textColor: active ? themeColors.cyan : themeColors.muted,
          fill: themeColors.panel,
          stroke: active ? themeColors.blue : themeColors.muted,
          padding: 14,
        });
        if (active)
          drawChapterText(
            ctx,
            api,
            [
              'backward · step · save/load',
              'gradient + optimizer owners',
              'sharded state + parameter availability',
              'partition · gather · status',
            ][i],
            1090,
            410 + i * 140,
            28,
            themeColors.muted,
          );
      });
    } else if (currentBeat === 1) {
      drawChapterText(
        ctx,
        api,
        'Same parameter W7 · availability trace',
        150,
        395,
        32,
        themeColors.blue,
      );
      const phase = Math.floor(sentenceProgress(1, 1) * 3),
        statuses = ['Not available', 'In flight', 'Available', 'Released'];
      drawChapterGrid(ctx, api, [statuses], 180, 470, 1560, 105, themeColors.blue, 32, [
        {
          row: 0,
          column: Math.min(3, phase),
          fill: themeColors.panel,
          stroke: themeColors.yellow,
        },
      ]);
      if (phase > 0) {
        const x = 375 + Math.min(3, phase) * 390;
        api.arrow(ctx, x, 600, x, 660, themeColors.yellow, 4);
      }
      drawChapterText(
        ctx,
        api,
        'Gather/release trace for availability · engine counter for an early update',
        960,
        790,
        32,
        themeColors.cyan,
        'center',
      );
      drawChapterFooter(ctx, api, 'Offload: state-swap path · pipeline: separate engine');
    } else {
      const rows = [['Integration path', 'Requested stage', 'Inspected contract']];
      if (sentenceProgress(2, 0) > 0)
        rows.push([
          'Pinned PipelineEngine',
          'ZeRO 2 or 3',
          resultComplete(2, 0) ? 'reject' : 'checking',
        ]);
      if (sentenceProgress(2, 1) > 0)
        rows.push([
          'Current AutoTP training',
          '0–3',
          resultComplete(2, 1) ? 'model-specific support' : 'checking',
        ]);
      drawChapterGrid(ctx, api, rows, 230, 390, 1460, rows.length * 80, themeColors.blue, 30);
      drawChapterText(
        ctx,
        api,
        'Names do not establish wrapper compatibility',
        960,
        800,
        40,
        themeColors.yellow,
        'center',
      );
      drawChapterFooter(
        ctx,
        api,
        'FSDP and Megatron provide distinct interfaces/components · test the actual combination',
      );
    }
  }
}
export default {
  id: 'engine-source',
  draw: drawEngineSource,
  cues: [
    'ds-engine-source-b0-s0',
    'ds-engine-source-b0-s1',
    'ds-engine-source-b0-s2',
    'ds-engine-source-b0-s3',
    'ds-engine-source-b1-s0',
    'ds-engine-source-b1-s1',
    'ds-engine-source-b1-s2',
    'ds-engine-source-b1-s3',
    'ds-engine-source-b2-s0',
    'ds-engine-source-b2-s1',
    'ds-engine-source-b2-s2',
    'ds-engine-source-b2-s3',
    'ds-engine-source-b2-s4',
  ],
};
