import { clamp, motion } from '../arithmetic.mjs';
import { drawCell, drawFooter, drawLine, drawRectangle, drawText } from '../defaults.mjs';
export function drawReferenceRetirement(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-reference-retirement-' + name];
      if (state.cues && !q)
        throw Error('Missing current scene cue sp-reference-retirement-' + name);
      return q
        ? {
            q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
            done: q.phase === 'after',
          }
        : {
            q: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
            done: currentBeat > index || (currentBeat === index && progress > 0.8),
          };
    },
    cueProgress = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sp-reference-retirement-mechanism', () => {
    const dup = currentBeat > 0 || cueProgress('duplicate', 0) > 0,
      creatorClosed = currentBeat > 0 || resultComplete('duplicate', 0),
      close = currentBeat === 2 ? cueProgress('close', 2) : 0,
      refs = (creatorClosed || close >= 1 ? 0 : 1) + (dup && close < 1 ? 1 : 0);
    drawRectangle(ctx, api, 720, 370, 480, 220, themeColors.blue);
    drawText(ctx, api, 'VM resource S8 / g4', 760, 450, 32, themeColors.blue);
    drawText(
      ctx,
      api,
      'references: ' + refs,
      760,
      520,
      32,
      refs ? themeColors.yellow : themeColors.green,
    );
    const xs = [200, 1320];
    xs.forEach((x, i) => {
      if (i === 0 || dup) {
        drawRectangle(ctx, api, x, 350, 360, 170, i ? themeColors.pink : themeColors.cyan);
        drawText(
          ctx,
          api,
          i ? 'inherited / duplicate' : 'creator fd',
          x + 25,
          410,
          28,
          i ? themeColors.pink : themeColors.cyan,
        );
        drawText(
          ctx,
          api,
          close >= 1 || (i === 0 && creatorClosed) ? 'closed' : 'live reference',
          x + 25,
          475,
          29,
          close >= 1 ? themeColors.green : themeColors.yellow,
        );
        if (close < 1 && !(i === 0 && creatorClosed))
          drawLine(
            ctx,
            api,
            i ? x : 560,
            535,
            i ? 1210 : 710,
            535,
            i ? themeColors.pink : themeColors.cyan,
          );
      }
    });
    if (currentBeat === 1) {
      drawText(ctx, api, 'creator exits ≠ last reference closes', 200, 750, 34, themeColors.yellow);
      drawText(
        ctx,
        api,
        resultComplete('threaded', 1)
          ? 'threaded cgroup kill → EOPNOTSUPP'
          : 'owned valid domain cgroup kill targets process tree',
        200,
        860,
        29,
        themeColors.pink,
      );
    }
    if (currentBeat === 2) {
      const n = Math.min(4, Math.floor(close * 5));
      ['capability', 'network / command', 'writable mapping', 'scratch backing'].forEach(
        (name, i) =>
          drawCell(
            ctx,
            api,
            name,
            i < n ? 'retired' : 'still owned',
            180 + i * 415,
            760,
            370,
            i < n ? themeColors.green : themeColors.yellow,
          ),
      );
      drawText(
        ctx,
        api,
        refs === 0 ? 'Reconciled closure permits free capacity' : 'Capacity remains held',
        200,
        950,
        33,
        refs === 0 ? themeColors.green : themeColors.yellow,
      );
    } else
      drawFooter(
        ctx,
        api,
        'Execution retirement and final descriptor closure are independent observations.',
      );
  });
}
export default {
  id: 'reference-retirement',
  draw: drawReferenceRetirement,
  cues: [
    'sp-reference-retirement-0',
    'sp-reference-retirement-duplicate',
    'sp-reference-retirement-1',
    'sp-reference-retirement-threaded',
    'sp-reference-retirement-2',
    'sp-reference-retirement-close',
  ],
};
