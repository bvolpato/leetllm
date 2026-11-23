import { clamp, motion } from '../arithmetic.mjs';
import { searchCapacity, sharedFleet } from '../model.mjs';
import { chapterFooter, chapterRect, chapterText } from '../defaults.mjs';
export function drawCapacityBounds(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-capacity-bounds-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-capacity-bounds-' + name);
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
  if (currentBeat === 3) {
    api.focus.target('se-capacity-bounds-mechanism', () => {
      const { C } = api;
      const added = Math.round(50 * prog('length', 3));
      const left = 545,
        scale = 2.8,
        output = 120;
      chapterText(ctx, api, 'One hypothetical synthesis request', 165, 291, 39, C.ink);
      for (const [i, prompt] of [250, 250 + added].entries()) {
        const y = 425 + 190 * i;
        chapterText(
          ctx,
          api,
          i ? 'With extra evidence' : 'Original prompt',
          165,
          y + 64,
          34,
          C.ink,
        );
        api.rect(ctx, left, y, prompt * scale, 100, C.panel, C.blue, 4);
        chapterText(ctx, api, prompt + ' input tokens', left + 30, y + 64, 34, C.blue);
        const x = left + prompt * scale + 5;
        api.rect(ctx, x, y, output * scale, 100, C.panel, C.green, 4);
        chapterText(ctx, api, output + ' output tokens', x + 18, y + 61, 28, C.green);
      }
      if (done('length', 3))
        chapterText(
          ctx,
          api,
          'Remeasure prefill, cached positions, residence time and joint throughput.',
          165,
          920,
          36,
          C.yellow,
        );
    });
    return;
  }
  api.focus.target('se-capacity-bounds-mechanism', () => {
    const v = searchCapacity(),
      memory = currentBeat > 0 || done('memory', 0),
      decode = currentBeat > 1 || done('decode', 1),
      merge = currentBeat === 2 ? prog('joint', 2) : 0,
      fleet = sharedFleet(merge);
    chapterText(ctx, api, 'Two constraints on one worker fleet', 170, 285, 33, themeColors.blue);
    chapterText(ctx, api, 'Physical workers / memory', 180, 390, 30, themeColors.cyan);
    chapterText(
      ctx,
      api,
      merge ? 'Output roles move onto those workers' : 'Output-work lower bound',
      1050,
      390,
      29,
      themeColors.green,
    );
    chapterText(ctx, api, v.gib.toFixed(2) + ' GiB ÷ 12 GiB', 180, 465, 30, themeColors.ink);
    chapterText(ctx, api, '600 × 120 ÷ 6,000', 1050, 465, 30, themeColors.ink);
    const nm = memory ? v.memory : Math.ceil(prog('memory', 0) * v.memory),
      nd = decode ? v.decode : currentBeat === 1 ? Math.ceil(prog('decode', 1) * v.decode) : 0;
    for (const w of fleet.workers.slice(0, nm))
      chapterRect(ctx, api, w.x, w.y, 105, 60, themeColors.panel, themeColors.cyan);
    for (const role of fleet.roles.slice(0, nd))
      chapterRect(
        ctx,
        api,
        role.x + merge * 9,
        role.y + merge * 9,
        105 - merge * 18,
        60 - merge * 18,
        themeColors.panel,
        themeColors.green,
      );
    if (memory)
      chapterText(
        ctx,
        api,
        '⌈' + v.gib.toFixed(2) + ' / 12⌉ = ' + v.memory,
        180,
        925,
        32,
        themeColors.cyan,
      );
    if (decode)
      chapterText(ctx, api, '⌈72,000 / 6,000⌉ = ' + v.decode, 1050, 925, 32, themeColors.green);
    if (currentBeat === 2 && done('joint', 2))
      chapterText(
        ctx,
        api,
        '19 physical workers; 12 carry the output-work roles',
        960,
        995,
        29,
        themeColors.yellow,
        'center',
      );
    else
      chapterFooter(
        ctx,
        api,
        'Independently derived resource bounds; joint workload still needs measurement.',
      );
  });
}
export default {
  id: 'capacity-bounds',
  draw: drawCapacityBounds,
  cues: [
    'se-capacity-bounds-0',
    'se-capacity-bounds-memory',
    'se-capacity-bounds-1',
    'se-capacity-bounds-decode',
    'se-capacity-bounds-2',
    'se-capacity-bounds-joint',
    'se-capacity-bounds-length',
  ],
};
