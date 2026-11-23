import { chapterText, dot, footer, line, rectangle, title } from '../defaults.mjs';
export function drawUnrollIssue(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const key = (k) => `gpu-${'unroll-issue'}-${k}`,
    cue = (k) => api.focus.cue(key(k)),
    cueProgress = (k) => api.focus.progress(key(k), 0),
    resultComplete = (k) => cue(k)?.phase === 'after';
  const F = (keys, paint) => {
    const a = Array.isArray(keys) ? keys : [keys];
    const nest = (i) => (i === a.length ? paint() : api.focus.target(key(a[i]), () => nest(i + 1)));
    return nest(0);
  };
  {
    title(
      ctx,
      api,
      currentBeat === 0
        ? 'One thread owns four separated rows'
        : currentBeat === 1
          ? 'Did the order of the loads change?'
          : 'More overlap can keep more values live',
    );
    const offsets = [0, 8, 16, 24];
    if (currentBeat === 0) {
      offsets.forEach((v, i) => {
        const y = 390 + i * 115;
        chapterText(ctx, api, 'offset ' + v, 260, y + 45, 32, themeColors.blue);
        rectangle(ctx, api, 420, y, 1260, 72, themeColors.panel, themeColors.line);
        F('offsets', () =>
          dot(ctx, api, 460 + 220 * cueProgress('offsets'), y + 36, themeColors.blue, 12),
        );
        F('loads', () => {
          const x = 700 + 600 * cueProgress('loads');
          dot(ctx, api, x, y + 36, themeColors.yellow, 12);
          if (cueProgress('loads') > 0)
            line(ctx, api, 700, y + 36, x, y + 36, themeColors.yellow, 4);
        });
        chapterText(
          ctx,
          api,
          'load → dependent shared store',
          1050,
          y + 104,
          27,
          themeColors.muted,
        );
      });
      footer(ctx, api, 'Example schedule for one thread');
    } else if (currentBeat === 1) {
      for (const [x, name] of [
        [200, 'Compiler default'],
        [1080, 'With an unroll pragma'],
      ]) {
        rectangle(ctx, api, x, 380, 640, 425, themeColors.panel, themeColors.cyan);
        chapterText(ctx, api, name, x + 320, 435, 29, themeColors.cyan);
        ['LD offset0', 'LD offset8', 'LD offset16', 'LD offset24'].forEach((s, i) =>
          F('assembly', () => {
            if (x === 200 || i < Math.floor(4 * cueProgress('compiler')))
              chapterText(ctx, api, s, x + 320, 515 + i * 65, 32, themeColors.ink);
          }),
        );
      }
      F(['pragma', 'compiler', 'request'], () =>
        chapterText(
          ctx,
          api,
          resultComplete('assembly')
            ? 'Both builds issue the four loads in the same order'
            : 'Compare the loads in each build',
          960,
          915,
          32,
          themeColors.yellow,
        ),
      );
      footer(ctx, api, 'Example compiler output');
    } else {
      F('live', () => {
        for (let i = 0; i < 8; i++) {
          const x = 220 + i * 185;
          rectangle(
            ctx,
            api,
            x,
            435,
            120,
            Math.max(1, 220 * (i < 4 ? 1 : cueProgress('live'))),
            i < 4 ? themeColors.blue : themeColors.yellow,
            undefined,
            4,
          );
          chapterText(ctx, api, 'v' + i, x + 60, 730, 28, themeColors.muted);
        }
      });
      F('spills', () =>
        chapterText(
          ctx,
          api,
          resultComplete('spills')
            ? 'Register pressure may add cached local-memory traffic'
            : 'Keep independent values until their dependent uses',
          960,
          355,
          30,
          themeColors.yellow,
        ),
      );
      F('measure', () =>
        chapterText(
          ctx,
          api,
          'Instructions · registers · spills · validity · clean timing',
          960,
          850,
          32,
          themeColors.cyan,
        ),
      );
      F('notrun', () =>
        chapterText(
          ctx,
          api,
          'Compare the compiler resource reports for both builds',
          960,
          935,
          30,
          themeColors.muted,
        ),
      );
      footer(ctx, api, 'Example register lifetimes');
    }
  }
}
export default {
  id: 'unroll-issue',
  draw: drawUnrollIssue,
  cues: [
    'gpu-unroll-issue-offsets',
    'gpu-unroll-issue-loads',
    'gpu-unroll-issue-pragma',
    'gpu-unroll-issue-compiler',
    'gpu-unroll-issue-assembly',
    'gpu-unroll-issue-request',
    'gpu-unroll-issue-live',
    'gpu-unroll-issue-spills',
    'gpu-unroll-issue-measure',
    'gpu-unroll-issue-notrun',
  ],
};
