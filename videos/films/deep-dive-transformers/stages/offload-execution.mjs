import { progressOf, resultDone } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import {
  chapterBox,
  chapterFooter,
  chapterGrid,
  chapterText,
  chapterTitle,
  chapterTransfer,
} from '../defaults.mjs';
export function drawOffloadExecution(ctx, scene, state, api) {
  return api.focus.target('hf-offload-execution-mechanism', () => {
    const { C: themeColors, components: components } = api,
      modelState = sampleModel('offload-execution', state),
      { b: currentBeat, p: progress } = modelState,
      done = (name) => resultDone(state, name);
    {
      chapterTitle(
        ctx,
        api,
        currentBeat === 0
          ? 'Meta parameters carry shapes before values'
          : currentBeat === 1
            ? 'CPU storage → main-GPU execution'
            : 'Supplied simultaneous GPU live set',
      );
      if (currentBeat === 0) {
        for (let i = 0; i < 4; i++) {
          chapterBox(
            ctx,
            api,
            ['GPU0', 'GPU1', 'CPU', 'Disk'][i],
            160 + i * 440,
            390,
            380,
            themeColors.blue,
          );
          chapterGrid(
            ctx,
            api,
            [
              Array.from(
                {
                  length: 4,
                },
                (_, j) => (j < Math.floor(progress * 4) ? 'data' : 'meta'),
              ),
            ],
            160 + i * 440,
            650,
            380,
            100,
            themeColors.cyan,
            24,
          );
        }
        chapterFooter(ctx, api, 'Submodule map respects protected unsplit blocks');
      } else if (currentBeat === 1) {
        chapterBox(ctx, api, 'CPU-stored layer', 180, 430, 550, themeColors.blue);
        chapterBox(ctx, api, 'GPU execution slot', 1130, 430, 610, themeColors.cyan);
        chapterTransfer(
          ctx,
          api,
          [
            {
              x: 750,
              y: 480,
            },
            {
              x: 1090,
              y: 480,
            },
          ],
          Math.min(1, progress * 2),
        );
        chapterText(
          ctx,
          api,
          progress < 0.65
            ? 'Fetch weights and input'
            : 'Compute, then release temporary device copy',
          960,
          790,
          34,
          themeColors.yellow,
          'center',
        );
        chapterText(
          ctx,
          api,
          'Disk → host memory → execution device',
          960,
          930,
          30,
          themeColors.muted,
          'center',
        );
      } else {
        const cols = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.green],
          names = ['Resident weights', 'Fetched layer', 'Live KV', 'Workspace'];
        let x = 200;
        const count = done('offload-total')
          ? 4
          : Math.min(3, Math.floor(progressOf(state, 'hf-offload-total') * 4));
        for (let i = 0; i < 4; i++) {
          chapterBox(
            ctx,
            api,
            names[i] + ' ' + modelState.values[i] + ' GiB',
            160 + i * 440,
            400,
            390,
            cols[i],
            100,
            25,
          );
          if (i < count) {
            components.panel({
              x,
              y: 680,
              width: 120 * modelState.values[i],
              height: 100,
              fill: cols[i],
              stroke: cols[i],
            });
            chapterText(
              ctx,
              api,
              modelState.values[i],
              x + 60 * modelState.values[i],
              745,
              30,
              themeColors.bg,
              'center',
            );
            x += 120 * modelState.values[i];
          }
        }
        api.line(ctx, 1400, 620, 1400, 815, themeColors.yellow, 3);
        chapterText(ctx, api, '10 GiB limit', 1400, 860, 28, themeColors.yellow, 'center');
        chapterText(
          ctx,
          api,
          modelState.showTotal ? '12 GiB > 10 GiB: reject' : 'Count the separate live allocations',
          960,
          960,
          36,
          modelState.showTotal ? themeColors.pink : themeColors.cyan,
          'center',
        );
      }
      return;
    }
  });
}
export default {
  id: 'offload-execution',
  draw: drawOffloadExecution,
  cues: [
    'hf-offload-execution-0',
    'hf-offload-execution-1',
    'hf-offload-execution-2',
    'hf-offload-total',
  ],
};
