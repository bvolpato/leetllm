import { chapterText, footer, rectangle, title } from '../defaults.mjs';
export function drawRaceRecovery(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const key = (k) => `gpu-${'race-recovery'}-${k}`,
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
      currentBeat < 2
        ? 'Which tool catches the early read?'
        : 'Repeat all three checks after the repair',
    );
    if (currentBeat < 2) {
      const logs = [
        ['memcheck', '0 errors', '7 mismatches', 'mem', 'memoutput', themeColors.blue],
        [
          'racecheck',
          resultComplete('exit') ? '4 hazards · exit 99' : '4 hazards',
          '108 mismatches',
          'race',
          'raceoutput',
          themeColors.pink,
        ],
        ['synccheck', '0 errors', '95 mismatches', 'sync', 'syncoutput', themeColors.yellow],
      ];
      logs.forEach(([name, summary, output, ck, ok, color], i) => {
        const x = 180 + i * 550;
        rectangle(ctx, api, x, 390, 460, 440, themeColors.panel, color);
        chapterText(ctx, api, name, x + 230, 450, 36, color);
        F(ck, () =>
          chapterText(
            ctx,
            api,
            currentBeat === 1 && resultComplete(ck) ? summary : 'await recorded tool result',
            x + 230,
            570,
            29,
            currentBeat === 1 && resultComplete(ck) ? color : themeColors.muted,
          ),
        );
        F(ok, () =>
          chapterText(
            ctx,
            api,
            currentBeat === 1 && resultComplete(ok) ? output : 'output belongs to this run',
            x + 230,
            690,
            28,
            themeColors.muted,
          ),
        );
        chapterText(ctx, api, 'N33 · broken', x + 230, 775, 27, themeColors.muted);
      });
      F(['broken', 'memfirst', 'notiming', 'different'], () =>
        chapterText(
          ctx,
          api,
          currentBeat === 0
            ? 'Missing shared dependency · accepted timing suppressed'
            : 'Three instrumented executions · mismatch counts can differ',
          960,
          915,
          33,
          themeColors.pink,
        ),
      );
      footer(
        ctx,
        api,
        'memcheck checks addresses    ·    racecheck checks shared accesses    ·    synccheck checks barrier use',
      );
    } else {
      const variants = ['copy', 'naive', 'tiled', 'padded'],
        tools = ['memcheck', 'racecheck', 'synccheck'];
      chapterText(ctx, api, 'N33', 775, 335, 31, themeColors.blue);
      chapterText(ctx, api, 'N1024', 1425, 335, 31, themeColors.cyan);
      for (let n = 0; n < 2; n++)
        for (let k = 0; k < 3; k++)
          chapterText(ctx, api, tools[k], 602 + n * 650 + k * 170, 375, 24, themeColors.muted);
      for (let i = 0; i < 4; i++) {
        chapterText(ctx, api, variants[i], 285, 440 + i * 120, 32, themeColors.blue);
        for (let n = 0; n < 2; n++)
          for (let k = 0; k < 3; k++) {
            const x = 530 + n * 650 + k * 170,
              y = 390 + i * 120;
            rectangle(
              ctx,
              api,
              x,
              y,
              145,
              75,
              themeColors.panel,
              resultComplete('clean') ? themeColors.green : themeColors.line,
            );
            F(['restore', 'matrix', 'clean'], () =>
              chapterText(
                ctx,
                api,
                resultComplete('clean') ? 'clean' : tools[k].slice(0, 4),
                x + 72,
                y + 48,
                26,
                resultComplete('clean') ? themeColors.green : themeColors.muted,
              ),
            );
          }
      }
      F('limits', () =>
        chapterText(
          ctx,
          api,
          resultComplete('clean')
            ? '24 clean commands across two shapes and four kernels'
            : 'Recovery commands await their recorded outcomes',
          960,
          950,
          31,
          themeColors.yellow,
        ),
      );
      footer(ctx, api, 'Keep the failing run with the repair and its new timings');
    }
  }
}
export default {
  id: 'race-recovery',
  draw: drawRaceRecovery,
  cues: [
    'gpu-race-recovery-broken',
    'gpu-race-recovery-memfirst',
    'gpu-race-recovery-notiming',
    'gpu-race-recovery-mem',
    'gpu-race-recovery-memoutput',
    'gpu-race-recovery-race',
    'gpu-race-recovery-exit',
    'gpu-race-recovery-raceoutput',
    'gpu-race-recovery-sync',
    'gpu-race-recovery-syncoutput',
    'gpu-race-recovery-different',
    'gpu-race-recovery-restore',
    'gpu-race-recovery-matrix',
    'gpu-race-recovery-clean',
    'gpu-race-recovery-limits',
  ],
};
