import { recordedTiming } from '../fixtures.mjs';
import { timingEvidence } from '../model.mjs';
import { chapterText, footer } from '../defaults.mjs';

const variants = ['naive', 'tiled', 'padded'];
const evidence = timingEvidence();
const deltaUs = recordedTiming.padded.map((value, i) => (value - recordedTiming.tiled[i]) * 1000);

export function drawSynthesis(ctx, scene, state, api) {
  const { C, focus } = api;
  const done = (key) => focus.cue(key)?.phase === 'after';
  const p = (key) => focus.progress(key, 0);
  const detail = p('pair-rounds') > 0;
  const colors = [C.blue, C.cyan, C.yellow];
  chapterText(
    ctx,
    api,
    'RTX 5070 Ti    ·    4096 × 4096 float32    ·    100 launches per batch',
    960,
    251,
    35,
    C.muted,
  );
  if (!detail) {
    const x = (v) => 420 + ((v - 0.17) / 0.18) * 1040;
    const samples = Math.floor(5 * p('plot-times'));
    focus.target('timing-overview', () => {
      for (const tick of [0.18, 0.22, 0.26, 0.3, 0.34]) {
        api.line(ctx, x(tick), 350, x(tick), 755, '#363c46', 2);
        chapterText(ctx, api, tick.toFixed(2), x(tick), 821, 30, C.muted);
      }
      chapterText(ctx, api, 'Average milliseconds per launch', 940, 876, 31, C.muted);
      for (const [i, name] of variants.entries()) {
        const y = 414 + 133 * i;
        chapterText(ctx, api, name, 275, y + 12, 41, colors[i]);
        api.line(ctx, 420, y, 1460, y, '#363c46', 2);
        recordedTiming[name]
          .slice(0, samples)
          .forEach((t, j) => api.circle(ctx, x(t), y + (j - 2) * 14, 9, colors[i]));
        if (done('medians'))
          chapterText(
            ctx,
            api,
            `${evidence.data[name].median.toFixed(3)} ms`,
            1635,
            y + 12,
            34,
            colors[i],
          );
      }
      if (done('medians')) chapterText(ctx, api, 'Median', 1635, 333, 29, C.muted);
    });
    focus.target('timing-question', () =>
      chapterText(
        ctx,
        api,
        done('tile-gap')
          ? 'The slowest tiled batch finished before the fastest naive batch on this scale.'
          : 'Each group contains one batch from each of five rounds.',
        960,
        967,
        33,
        C.ink,
      ),
    );
  } else {
    const names = ['Round', 'Tiled (ms)', 'Padded (ms)'];
    const centers = [210, 450, 720];
    const x = (us) => 1320 + us * 65;
    focus.target('timing-pairs', () => {
      names.forEach((name, i) => chapterText(ctx, api, name, centers[i], 345, 32, colors[i]));
      chapterText(ctx, api, 'Padded time minus tiled time (µs)', 1320, 345, 34);
      for (const tick of [-6, -3, 0, 3, 6]) {
        api.line(
          ctx,
          x(tick),
          412,
          x(tick),
          tick === 0 ? 774 : 424,
          tick === 0 ? C.ink : C.muted,
          tick === 0 ? 3 : 2,
        );
        chapterText(ctx, api, String(tick), x(tick), 398, 26, C.muted);
      }
      const shown = Math.floor(5 * p('pair-marks'));
      for (let i = 0; i < 5; i++) {
        const y = 457 + i * 73;
        chapterText(ctx, api, i + 1, centers[0], y + 12, 35, C.ink);
        chapterText(ctx, api, recordedTiming.tiled[i].toFixed(5), centers[1], y + 12, 35, C.cyan);
        chapterText(
          ctx,
          api,
          recordedTiming.padded[i].toFixed(5),
          centers[2],
          y + 12,
          35,
          C.yellow,
        );
        if (i < shown) {
          const end = x(deltaUs[i]);
          api.line(ctx, x(0), y, end, y, C.yellow, 5);
          api.circle(ctx, end, y, 9, C.yellow);
          chapterText(
            ctx,
            api,
            (deltaUs[i] > 0 ? '+' : '') + deltaUs[i].toFixed(2),
            end + (deltaUs[i] < 0 ? -18 : 18),
            y + 9,
            27,
            C.ink,
            deltaUs[i] < 0 ? 'right' : 'left',
          );
        }
      }
      chapterText(ctx, api, 'Padded faster', 1040, 830, 29, C.muted);
      chapterText(ctx, api, 'Padded slower', 1600, 830, 29, C.muted);
    });
    const faster = deltaUs.filter((v) => v < 0).length;
    focus.target('timing-question', () =>
      chapterText(
        ctx,
        api,
        done('padding-verdict')
          ? `Padded is faster in ${faster} rounds and slower in ${deltaUs.length - faster}. Its speed benefit remains unresolved.`
          : 'Do these five rounds establish a speedup from padding?',
        960,
        921,
        36,
        C.yellow,
      ),
    );
    footer(
      ctx,
      api,
      done('profile-open')
        ? 'Next measurement: matching kernel, shape and launch, with counter access.'
        : 'Same block and logical work   ·   clean timings from separate, unprofiled processes',
    );
  }
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: [
    'plot-times',
    'tile-gap',
    'medians',
    'pair-rounds',
    'pair-marks',
    'padding-verdict',
    'profile-open',
  ],
};
