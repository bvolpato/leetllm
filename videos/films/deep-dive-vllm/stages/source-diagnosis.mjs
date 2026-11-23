import { vvProgress, vvState } from '../construction.mjs';
import { chapterCard, chapterText, grid, rect } from '../defaults.mjs';
export function drawSourceDiagnosis(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = vvState('source-diagnosis', state),
    { b: currentBeat, p: progress } = modelState,
    cueProgress = (name, beat = currentBeat) =>
      vvProgress(state, 'vv-source-diagnosis-' + name, beat),
    resultComplete = (name, beat = currentBeat) => cueProgress(name, beat) === 1;
  let title = '';
  const head = (x) => (title = x);
  api.focus.target('vllm-source-diagnosis-mechanism', () => {
    head(
      currentBeat === 0
        ? 'Follow one admitted request through its actual owners'
        : currentBeat === 1
          ? 'Correlate recompute with live capacity before changing a kernel'
          : 'Where did each reader wait?',
    );
    if (currentBeat === 0) {
      const names = [
        'CLI /API',
        'Engine core',
        'Scheduler',
        'KV manager',
        'Block pool',
        'Selected runner',
      ];
      names.forEach((v, i) =>
        chapterCard(
          ctx,
          api,
          v,
          150 + (i % 3) * 550,
          390 + Math.floor(i / 3) * 260,
          500,
          i === Math.min(5, Math.floor(progress * 6)) ? themeColors.yellow : themeColors.blue,
          120,
          29,
        ),
      );
    } else if (currentBeat === 1) {
      grid(
        ctx,
        api,
        [
          ['GPU activity', 'ITL', 'Recompute', 'Free blocks'],
          ['quiet', 'rising', 'increasing', 'inspect first'],
        ],
        150,
        400,
        1600,
        240,
        themeColors.blue,
        30,
      );
      chapterText(
        ctx,
        api,
        'Then: caps →prompt lengths →core CPU →collectives',
        960,
        860,
        34,
        themeColors.yellow,
        'center',
      );
    } else {
      const names = ['Input', 'Queue', 'Prefill', 'Deliver'],
        colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.green],
        traces = [
          {
            values: [80, 5, 7, 3],
            cue: 'input-trace',
            label: 'Request A',
          },
          {
            values: [3, 75, 6, 2],
            cue: 'queue-trace',
            label: 'Request B',
          },
        ];
      traces.forEach((trace, row) => {
        if (row === 1 && cueProgress(trace.cue, 2) === 0) return;
        const y = 420 + row * 280,
          ready = resultComplete(trace.cue, 2);
        chapterText(ctx, api, trace.label, 150, y - 30, 28, themeColors.ink);
        let x = 150;
        trace.values.forEach((v, i) => {
          const w = v * 14;
          rect(ctx, api, x, y, w, 85, colors[i]);
          chapterText(
            ctx,
            api,
            names[i] + ' ' + v + ' ms',
            330 + i * 420,
            y + 155,
            26,
            colors[i],
            'center',
          );
          x += w;
        });
        if (ready)
          chapterText(
            ctx,
            api,
            'Inspect ' + (row ? 'engine admission /scheduling' : 'API input work'),
            960,
            y + 220,
            28,
            themeColors.yellow,
            'center',
          );
      });
    }
  });
  chapterText(ctx, api, title, 960, 275, 35, themeColors.yellow, 'center');
}
export default {
  id: 'source-diagnosis',
  draw: drawSourceDiagnosis,
  cues: [
    'vv-source-diagnosis-op-0',
    'vv-source-diagnosis-op-1',
    'vv-source-diagnosis-kv-first',
    'vv-source-diagnosis-op-2',
    'vv-source-diagnosis-input-trace',
    'vv-source-diagnosis-queue-trace',
  ],
};
