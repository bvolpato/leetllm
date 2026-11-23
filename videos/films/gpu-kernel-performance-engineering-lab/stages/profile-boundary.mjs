import { chapterText, footer, line, rectangle, title } from '../defaults.mjs';
export function drawProfileBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const key = (k) => `gpu-${'profile-boundary'}-${k}`,
    cue = (k) => api.focus.cue(key(k)),
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
      currentBeat === 2
        ? 'The attempted counter collection has no report'
        : 'Bind the selected launch to the hypothesis',
    );
    if (currentBeat === 0) {
      F('target', () => {
        rectangle(ctx, api, 170, 365, 1570, 120, themeColors.panel, themeColors.blue);
        chapterText(
          ctx,
          api,
          'transpose_naive · N4096 · block 32×8 · intended source',
          955,
          440,
          34,
          themeColors.blue,
        );
      });
      for (let i = 0; i < 9; i++) {
        const x = 190 + i * 180;
        rectangle(
          ctx,
          api,
          x,
          560,
          130,
          120,
          themeColors.panel,
          i < 6 ? themeColors.muted : i === 6 ? themeColors.green : themeColors.line,
        );
        chapterText(
          ctx,
          api,
          i === 0 ? 'check' : i < 6 ? 'warm' : 'timed',
          x + 65,
          610,
          24,
          i < 6 ? themeColors.muted : themeColors.cyan,
        );
        chapterText(ctx, api, i + 1, x + 65, 655, 29);
      }
      F('skip', () => {
        line(ctx, api, 190, 735, 1210, 735, themeColors.yellow, 4);
        chapterText(ctx, api, 'Skip 6 matching launches', 700, 790, 31, themeColors.yellow);
      });
      F('select', () =>
        chapterText(
          ctx,
          api,
          resultComplete('select')
            ? 'Inspect launch7 only'
            : 'Select after validation + five warmups',
          1450,
          790,
          30,
          themeColors.green,
        ),
      );
      F('replay', () =>
        chapterText(
          ctx,
          api,
          'Full metrics can replay work · keep unprofiled timing separate',
          960,
          900,
          30,
          themeColors.yellow,
        ),
      );
      footer(ctx, api, 'The skip count applies to launches of the selected kernel');
    } else if (currentBeat === 1) {
      const lenses = [
        ['LaunchStats', 'geometry + resources', 'launch'],
        ['MemoryWorkloadAnalysis', 'requests / sectors / levels', 'memory'],
        ['SpeedOfLight', 'target throughput ceilings', 'memory'],
        ['Occupancy', 'capacity + limiting resources', 'occupancy'],
      ];
      lenses.forEach(([name, detail, k], i) => {
        const x = 190 + (i % 2) * 860,
          y = 375 + Math.floor(i / 2) * 210;
        F(k, () => {
          rectangle(ctx, api, x, y, 720, 150, themeColors.panel, themeColors.cyan);
          chapterText(ctx, api, name, x + 360, y + 55, 31, themeColors.cyan);
          chapterText(ctx, api, detail, x + 360, y + 115, 28, themeColors.muted);
        });
      });
      F('predictions', () =>
        chapterText(
          ctx,
          api,
          resultComplete('predictions')
            ? 'Address prediction: 4 load / 32 store sectors per full warp'
            : 'Predict the access-stage counters first',
          960,
          885,
          32,
          themeColors.yellow,
        ),
      );
      F('wrong', () =>
        chapterText(
          ctx,
          api,
          'Observed limiter requires this matching kernel and workload',
          960,
          955,
          30,
          themeColors.muted,
        ),
      );
    } else {
      F('error', () => {
        rectangle(ctx, api, 210, 390, 1500, 175, themeColors.panel, themeColors.pink);
        chapterText(
          ctx,
          api,
          resultComplete('error') ? 'ERR_NVGPUCTRPERM' : 'Counter collection attempted',
          960,
          460,
          resultComplete('error') ? 44 : 34,
          resultComplete('error') ? themeColors.pink : themeColors.muted,
        );
        chapterText(
          ctx,
          api,
          resultComplete('error')
            ? 'No permission to access GPU performance counters'
            : 'Await the actual tool result',
          960,
          525,
          32,
          resultComplete('error') ? themeColors.pink : themeColors.muted,
        );
      });
      ['Load sectors', 'Store sectors', 'Physical bytes', 'Achieved occupancy'].forEach((s, i) => {
        rectangle(ctx, api, 210 + i * 390, 650, 330, 125, themeColors.panel, themeColors.line);
        chapterText(ctx, api, s, 375 + i * 390, 695, 27, themeColors.muted);
        F('none', () =>
          chapterText(ctx, api, 'unavailable', 375 + i * 390, 750, 31, themeColors.muted),
        );
      });
      F('unestablished', () =>
        chapterText(
          ctx,
          api,
          resultComplete('unestablished')
            ? 'Find the limiting stage in a profile of this launch'
            : 'The source gives the addresses. The timer gives the batch average.',
          960,
          890,
          37,
          themeColors.yellow,
        ),
      );
    }
  }
}
export default {
  id: 'profile-boundary',
  draw: drawProfileBoundary,
  cues: [
    'gpu-profile-boundary-target',
    'gpu-profile-boundary-skip',
    'gpu-profile-boundary-select',
    'gpu-profile-boundary-replay',
    'gpu-profile-boundary-launch',
    'gpu-profile-boundary-memory',
    'gpu-profile-boundary-occupancy',
    'gpu-profile-boundary-predictions',
    'gpu-profile-boundary-wrong',
    'gpu-profile-boundary-error',
    'gpu-profile-boundary-none',
    'gpu-profile-boundary-unestablished',
  ],
};
