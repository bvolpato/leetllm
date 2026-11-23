import { sentenceCounts } from '../fixtures.mjs';
import {
  constructionCell,
  constructionLine,
  constructionNote,
  constructionText,
} from '../defaults.mjs';
export function drawTimingContract(ctx, scene, state, api) {
  api.focus.target('pl-timing-contract-trace', () => {
    const { C, components: c } = api,
      b = state.beat,
      beatP = state.beatP ?? 0;
    const op = (beat, sentence) => {
      if (
        !sentenceCounts['timing-contract'] ||
        sentence < 0 ||
        sentence >= sentenceCounts['timing-contract'][beat]
      )
        throw Error('Invalid placement sentence timing-contract/' + beat + '/' + sentence);
      if (b > beat) return 1;
      if (b < beat) return 0;
      return state.cues
        ? api.focus.progress(`pl-${'timing-contract'}-${beat}-${sentence}`, 0)
        : Math.max(0, Math.min(1, beatP * sentenceCounts['timing-contract'][beat] - sentence));
    };
    const done = (beat, sentence) => op(beat, sentence) >= 1;
    {
      if (b === 0) {
        constructionText(ctx, api, 'Strict completed-receipt validator', 150, 285, 34, C.cyan);
        const inputs = [
          ['done', 'true', true],
          ['cached ≤ prompt', '1,001 > 1,000', false],
          ['duration integer', 'true', false],
          ['output duration', '0', true],
        ];
        inputs.forEach(([name, v, valid], i) => {
          const y = 390 + i * 130;
          constructionCell(ctx, api, name, 150, y, 470, 80, C.blue);
          constructionCell(ctx, api, v, 810, y, 470, 80, valid ? C.cyan : C.pink);
          if (done(0, Math.min(i + 1, 5)))
            constructionText(
              ctx,
              api,
              i === 3 ? 'rate unavailable' : valid ? 'type accepted' : 'reject',
              1440,
              y + 52,
              30,
              valid ? C.yellow : C.pink,
            );
        });
        constructionNote(
          ctx,
          api,
          'Boolean values never become numeric timings; missing cached count is unknown',
        );
      } else {
        constructionText(
          ctx,
          api,
          'Client timeline · separate timestamp boundaries',
          150,
          285,
          33,
          C.cyan,
        );
        constructionLine(ctx, api, 180, 490, 1710, 490, C.muted);
        const marks = [
          ['Submit', 180],
          ['First chunk', 600],
          ['First visible token', 980],
          ['Completion', 1710],
        ];
        marks.forEach(([v, x], i) => {
          constructionLine(ctx, api, x, 440, x, 540, i < 2 ? C.blue : C.green);
          constructionText(
            ctx,
            api,
            v,
            x,
            620,
            27,
            i < 2 ? C.blue : C.green,
            i === 0 ? 'left' : i === 3 ? 'right' : 'center',
          );
        });
        if (done(1, 0))
          constructionCell(
            ctx,
            api,
            'Final completed server chunk: nanoseconds',
            400,
            760,
            1120,
            85,
            C.cyan,
          );
        if (done(1, 1))
          constructionText(ctx, api, '1,000,000,000 ns = 1 second', 150, 900, 35, C.green);
        constructionNote(
          ctx,
          api,
          'Thinking tokens and buffered chunks change what the client actually sees',
        );
      }
    }
  });
}
export default {
  id: 'timing-contract',
  draw: drawTimingContract,
  cues: [
    'pl-timing-contract-0-0',
    'pl-timing-contract-0-1',
    'pl-timing-contract-0-2',
    'pl-timing-contract-0-3',
    'pl-timing-contract-0-4',
    'pl-timing-contract-0-5',
    'pl-timing-contract-1-0',
    'pl-timing-contract-1-1',
    'pl-timing-contract-1-2',
    'pl-timing-contract-1-3',
    'pl-timing-contract-1-4',
  ],
};
