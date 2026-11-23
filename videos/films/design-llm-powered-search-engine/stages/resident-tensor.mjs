import { clamp, motion } from '../arithmetic.mjs';
import { searchCapacity } from '../model.mjs';
import {
  chapterFooter,
  chapterMeter,
  chapterParagraph,
  chapterRect,
  chapterText,
} from '../defaults.mjs';
export function drawResidentTensor(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-resident-tensor-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-resident-tensor-' + name);
    return q
      ? {
          progress: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          progress: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
          done: currentBeat > index || (currentBeat === index && progress > 0.76),
        };
  };
  const prog = (name, index) => cue(name, index).progress,
    done = (name, index) => cue(name, index).done;
  api.focus.target('se-resident-tensor-mechanism', () => {
    const v = searchCapacity();
    if (currentBeat < 2) {
      chapterText(
        ctx,
        api,
        'Same synthesis arrival stream: 600 / s',
        170,
        285,
        33,
        themeColors.blue,
      );
      const cells = [
        ['Before model', 0.37, themeColors.blue],
        ['KV resident', 1.93, themeColors.cyan],
        ['After release', 0.2, themeColors.green],
      ];
      let x = 180;
      for (const [name, span, color] of cells) {
        const width = (span / 2.5) * 1500;
        chapterRect(ctx, api, x, 390, width, 140, themeColors.panel, color);
        chapterParagraph(ctx, api, name, x + 15, 440, width - 30, 25, color);
        chapterText(ctx, api, span.toFixed(2) + ' s', x + width / 2, 505, 25, color, 'center');
        x += width;
      }
      if (done('interval', 0) || currentBeat > 0)
        chapterText(ctx, api, 'Total = 2.50 s', 180, 630, 32, themeColors.yellow);
      if (currentBeat === 1) {
        const q = prog('counts', 1);
        chapterMeter(
          ctx,
          api,
          'Total in flight',
          v.inflight,
          1500,
          180,
          730,
          620,
          themeColors.blue,
          done('counts', 1),
        );
        chapterMeter(
          ctx,
          api,
          'KV-resident requests',
          v.resident,
          1500,
          1050,
          730,
          620,
          themeColors.cyan,
          done('counts', 1),
        );
        if (!done('counts', 1))
          chapterText(
            ctx,
            api,
            'Rate × the selected residence interval',
            180,
            925,
            30,
            themeColors.muted,
          );
      }
      chapterFooter(
        ctx,
        api,
        'Retrieval waits and final CPU checks can sit outside the KV lifetime.',
      );
    } else {
      chapterText(
        ctx,
        api,
        'Mean KV allocation · raw full-history model',
        160,
        285,
        32,
        themeColors.cyan,
      );
      const factors = [
          ['K + V', 2],
          ['layers', 32],
          ['KV heads', 8],
          ['head width', 128],
          ['bytes/value', 2],
        ],
        n = Math.ceil(prog('2', 2) * 5);
      factors.forEach(([name, value], i) => {
        const x = 170 + i * 320;
        chapterText(ctx, api, name, x + 140, 350, 25, themeColors.muted, 'center');
        chapterRect(
          ctx,
          api,
          x,
          390,
          280,
          100,
          themeColors.panel,
          i < n ? themeColors.cyan : themeColors.muted,
        );
        chapterText(
          ctx,
          api,
          i < n ? value : 'pending',
          x + 140,
          455,
          31,
          i < n ? themeColors.cyan : themeColors.muted,
          'center',
        );
      });
      const count = done('bytes', 2) ? 32 : Math.floor(prog('bytes', 2) * 32);
      for (let j = 0; j < count; j++) {
        const x = 240 + j * 9,
          y = 730 - j * 5;
        chapterRect(ctx, api, x, y, 440, 50, themeColors.blue, themeColors.cyan);
        chapterRect(ctx, api, x + 620, y, 440, 50, themeColors.pink, themeColors.cyan);
      }
      chapterText(ctx, api, 'K', 400, 865, 32, themeColors.blue);
      chapterText(ctx, api, 'V', 1040, 865, 32, themeColors.pink);
      if (done('bytes', 2))
        chapterText(
          ctx,
          api,
          v.bytesPerPosition.toLocaleString() + ' bytes / position',
          960,
          565,
          33,
          themeColors.yellow,
          'center',
        );
      if (done('gib', 2))
        chapterText(
          ctx,
          api,
          '1,158 × 1,560 × 131,072 / 2³⁰ = ' + v.gib.toFixed(2) + ' GiB',
          960,
          935,
          30,
          themeColors.green,
          'center',
        );
      chapterFooter(
        ctx,
        api,
        '32 logical layers in each K/V stack; allocation overhead is excluded.',
      );
    }
  });
}
export default {
  id: 'resident-tensor',
  draw: drawResidentTensor,
  cues: [
    'se-resident-tensor-0',
    'se-resident-tensor-interval',
    'se-resident-tensor-1',
    'se-resident-tensor-counts',
    'se-resident-tensor-2',
    'se-resident-tensor-bytes',
    'se-resident-tensor-gib',
  ],
};
