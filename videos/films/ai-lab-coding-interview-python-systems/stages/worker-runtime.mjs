import { codingChapterState } from '../construction.mjs';
import {
  drawArrow,
  drawChapterCard,
  drawChapterText,
  drawFooter,
  drawHeading,
  drawMovingCard,
} from '../defaults.mjs';
export function drawWorkerRuntime(ctx, scene, state, api) {
  api.focus.target('ci-worker-runtime-trace', () => {
    const { C: themeColors, teaching: teaching } = api,
      modelState = codingChapterState('worker-runtime', state),
      currentBeat = modelState.beat,
      progress = modelState.p,
      q = modelState.q;
    {
      if (currentBeat === 0) {
        drawHeading(ctx, api, 'GIL-enabled bytecode shares one execution lane');
        const time = 5 * q;
        teaching.timeline({
          x: 220,
          y: 365,
          width: 1480,
          height: 390,
          domain: [0, 5],
          time,
          lanes: [
            {
              id: 'waitA',
              label: 'I/O A',
            },
            {
              id: 'waitB',
              label: 'I/O B',
            },
            {
              id: 'cpu',
              label: 'Python CPU',
            },
          ],
          intervals: [
            {
              id: 'a',
              lane: 'waitA',
              start: 0,
              end: 2,
              label: 'waiting',
              color: themeColors.blue,
            },
            {
              id: 'b',
              lane: 'waitB',
              start: 0,
              end: 2,
              label: 'waiting',
              color: themeColors.cyan,
            },
            {
              id: 'ca',
              lane: 'cpu',
              start: 2,
              end: 3,
              label: 'A',
              color: themeColors.green,
            },
            {
              id: 'cb',
              lane: 'cpu',
              start: 3,
              end: 4,
              label: 'B',
              color: themeColors.yellow,
            },
          ],
          ticks: [0, 1, 2, 3, 4, 5],
          fontSize: 24,
        });
        drawChapterCard(
          ctx,
          api,
          'free-threaded build: optional · inspect active process',
          260,
          865,
          1400,
          100,
          themeColors.yellow,
          29,
        );
        drawFooter(
          ctx,
          api,
          'Separate supplied two-second I/O model; compound state still needs synchronization',
        );
      } else if (currentBeat === 1) {
        drawHeading(ctx, api, 'Serialization creates a worker copy, not a shared parent list');
        drawChapterCard(ctx, api, 'parent [1, 2]', 180, 410, 620, 110, themeColors.blue, 37);
        drawChapterCard(
          ctx,
          api,
          q > 0.4 ? 'worker copy [1, 2, 3]' : 'worker copy [1, 2]',
          1120,
          410,
          620,
          110,
          themeColors.cyan,
          34,
        );
        drawMovingCard(
          ctx,
          api,
          'serialized bytes',
          300,
          660,
          1230,
          660,
          Math.min(1, q * 2),
          themeColors.yellow,
          330,
        );
        drawChapterCard(
          ctx,
          api,
          q > 0.75 ? 'lambda → PicklingError' : 'callable serialization pending',
          410,
          860,
          1100,
          100,
          q > 0.75 ? themeColors.pink : themeColors.muted,
          32,
        );
        drawFooter(
          ctx,
          api,
          'Interpreter and process results return with IDs for parent-side merge',
        );
      } else {
        drawHeading(ctx, api, 'Only a yielding await lets the second task start');
        const blocking = state.cues?.['ci-worker-runtime-blocking']
            ? state.cues['ci-worker-runtime-blocking'].phase !== 'before'
            : progress > 0.9,
          sequence = blocking
            ? ['A start', 'A resume', 'B start', 'B resume']
            : ['A start', 'B start', 'A resume', 'B resume'];
        drawChapterText(
          ctx,
          api,
          blocking ? 'blocking sleep · no yield' : 'actual sleep(0) · interleaves',
          960,
          370,
          32,
          blocking ? themeColors.pink : themeColors.green,
          'center',
        );
        sequence.forEach((v, i) => {
          const x = 200 + i * 415;
          drawChapterCard(
            ctx,
            api,
            v,
            x,
            530,
            350,
            110,
            i % 2 ? themeColors.cyan : themeColors.blue,
            30,
          );
          if (i < 3) drawArrow(ctx, api, x + 365, 585, x + 400, 585, themeColors.muted);
        });
        drawChapterCard(
          ctx,
          api,
          'main guard · startup · serialize · compute · merge',
          210,
          835,
          1500,
          110,
          themeColors.yellow,
          29,
        );
        drawFooter(
          ctx,
          api,
          'An already-completed awaitable need not yield; measure actual executor overhead',
        );
      }
    }
  });
}
export default {
  id: 'worker-runtime',
  draw: drawWorkerRuntime,
  cues: [
    'ci-worker-runtime-0-build',
    'ci-worker-runtime-1-build',
    'ci-worker-runtime-2-build',
    'ci-worker-runtime-blocking',
  ],
};
