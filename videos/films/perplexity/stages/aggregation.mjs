import { corpusLoss } from '../arithmetic.mjs';
import { spokenCue } from '../construction.mjs';
import { box, drawText } from '../defaults.mjs';

const windows = [
  { count: 2, loss: 0.5 },
  { count: 8, loss: 2 },
];
const corpus = corpusLoss(windows);
const naivePpl = windows.reduce((sum, row) => sum + Math.exp(row.loss), 0) / windows.length;

export default {
  id: 'aggregation',
  cues: [
    'aggregation-windows',
    'aggregation-expand',
    'aggregation-mean',
    'aggregation-ppl',
    'aggregation-worker',
    'aggregation-empty',
  ],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const cue = (id) => spokenCue(scene, state, id);
    const expand = cue('aggregation-expand').progress;
    const worker = cue('aggregation-worker').progress === 1;
    api.focus.target('window-summaries', () => {
      windows.forEach((row, i) => {
        const total = row.count * row.loss;
        box(
          ctx,
          api,
          worker
            ? total + ' nats  /  ' + row.count + ' targets'
            : row.count + ' targets  ·  ' + row.loss.toFixed(1) + ' nats each',
          190 + i * 850,
          315,
          690,
          102,
          i === 0 ? C.blue : C.pink,
          39,
        );
      });
    });
    api.focus.target('window-contributions', () => {
      let position = 0;
      windows.forEach((row, group) => {
        for (let i = 0; i < row.count; i++, position++) {
          const slice = 184 / row.count;
          const home = 535 + group * 850 - 92 + (i + 0.5) * slice;
          const x = api.lerp(home, 238 + position * 158, expand);
          const w = api.lerp(slice, 116, expand);
          const h = row.loss * 147;
          api.rect(ctx, x - w / 2, 794 - h, w, h, group ? C.pink : C.blue, undefined, 3 * expand);
          if (expand === 1)
            drawText(
              ctx,
              api,
              (group ? 'B' : 'A') + (i + 1),
              x,
              844,
              29,
              group ? C.pink : C.blue,
              'center',
            );
        }
      });
      api.line(ctx, 174, 801, 1746, 801, C.muted, 2);
    });
    api.focus.target('window-mean', () => {
      const mean = cue('aggregation-mean').phase === 'after';
      const score = cue('aggregation-ppl').phase === 'after';
      let label = expand > 0 ? 'One column for each scored target' : 'One column per window';
      if (expand === 1) label = '1 + 16 = 17 nats across 10 targets';
      if (mean) label = '17 / 10 = ' + corpus.mean.toFixed(2) + ' nats per target';
      if (score) label += '     →     PPL ' + corpus.perplexity.toFixed(2);
      drawText(ctx, api, label, 960, 943, 44, mean ? C.yellow : C.ink, 'center');
      if (score && !worker)
        drawText(
          ctx,
          api,
          'Averaging the two window PPLs gives ' + naivePpl.toFixed(2),
          960,
          1021,
          31,
          C.muted,
          'center',
        );
      if (cue('aggregation-empty').phase === 'after')
        drawText(
          ctx,
          api,
          'Zero targets overall → no corpus mean',
          960,
          1021,
          34,
          C.pink,
          'center',
        );
    });
  },
};
