import { coldPhases } from '../arithmetic.mjs';
import { arrow, box, detailText, focusTarget, footer, line, visible } from '../defaults.mjs';
export function drawRequestClock(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    focus = api.focus;
  const resultComplete = (id) => focus.cue(id)?.phase === 'after';
  {
    if (currentBeat === 0)
      focusTarget(ctx, api, 'compiler-producers', () => {
        const rows = [
          ['NVRTC', 'PTX / cubin / LTO IR', 'target and options'],
          ['driver PTX JIT', 'device native image', 'driver compiler path'],
          ['nvJitLink', 'linked cubin', 'supported code inputs'],
          ['CUDA 13.4 Tile path', 'Tile IR', 'documented version scope'],
        ];
        rows.forEach(([a, z, note], i) => {
          const y = 330 + i * 150;
          detailText(ctx, api, a, 150, y + 25, 33, themeColors.cyan);
          if (visible(ctx, api, i === 2 ? 'link-cubin' : 'compiler-producers')) {
            arrow(ctx, api, 680, y + 12, 880, y + 12, themeColors.cyan);
            detailText(ctx, api, z, 940, y + 25, 32, themeColors.green);
            detailText(ctx, api, note, 940, y + 82, 27, themeColors.muted);
          }
        });
      });
    else if (currentBeat === 1)
      focusTarget(ctx, api, 'cold-clock', () => {
        const phases = coldPhases();
        const native = coldPhases(true);
        const scale = 16;
        const x = 415;
        const styles = {
          initialize: ['cold-init', 'Initialize', themeColors.blue],
          'load module': ['cold-load', 'Load module', themeColors.cyan],
          'PTX JIT': ['cold-jit', 'Compile PTX', themeColors.yellow],
          'publish cache': ['cold-publish', 'Publish entry', themeColors.pink],
          'first launch': ['cold-launch', 'First launch', themeColors.green],
        };
        detailText(ctx, api, 'Example first request  ·  sequential phases', 145, 275, 38);
        for (const [i, phase] of phases.entries()) {
          const [id, name, color] = styles[phase.id];
          if (!focus.visible(id)) continue;
          const col = 150 + i * 337;
          detailText(ctx, api, name, col, 391, 33, color);
          if (resultComplete(id)) detailText(ctx, api, phase.duration + ' ms', col, 449, 38, color);
        }
        const replay = focus.visible('native-omit');
        for (const [i, row] of [phases, native].entries()) {
          if (i === 1 && !replay) continue;
          const y = 545 + i * 171;
          detailText(ctx, api, i ? 'Native image' : 'PTX path', 145, y + 49, 35);
          line(ctx, api, x, y + 71, x + 80 * scale, y + 71, themeColors.muted, 2);
          for (const phase of row) {
            const [id, , color] = styles[phase.id];
            const progress = i ? focus.progress('native-omit') : focus.progress(id);
            if (progress <= 0) continue;
            const end = i
              ? Math.min(phase.end, row.at(-1).end * progress)
              : phase.start + phase.duration * progress;
            if (end > phase.start)
              api.rect(
                ctx,
                x + phase.start * scale,
                y,
                (end - phase.start) * scale,
                62,
                color,
                undefined,
                1,
              );
          }
          if (resultComplete(i ? 'native-omit' : 'cold-total')) {
            const end = row.at(-1).end;
            detailText(ctx, api, end + ' ms', x + end * scale + 19, y + 46, 32, themeColors.ink);
          }
        }
        for (const tick of [0, 20, 40, 60, 80]) {
          const xx = x + tick * scale;
          line(ctx, api, xx, 815, xx, 833, themeColors.muted, 2);
          detailText(ctx, api, tick + ' ms', xx, 878, 29, themeColors.muted, 'center');
        }
        if (resultComplete('native-omit')) {
          detailText(
            ctx,
            api,
            'Native total ' + native.at(-1).end + 'ms  ·  same loading and application cache work',
            145,
            963,
            34,
            themeColors.ink,
          );
        } else if (resultComplete('cold-total')) {
          detailText(
            ctx,
            api,
            phases.map((p) => p.duration).join(' + ') + ' = ' + phases.at(-1).end + 'ms',
            145,
            963,
            37,
            themeColors.ink,
          );
        }
      });
    else
      focusTarget(ctx, api, 'warm-clock', () => {
        const rows = [
          ['fresh process', 'cache state + loader mode recorded'],
          ['first use', 'initialization / loading / optional JIT'],
          ['exact warm specialization', 'separately synchronized timed interval'],
        ];
        rows.forEach(([a, z], i) => {
          const y = 350 + i * 175;
          box(ctx, api, 170, y, 1480, 130, i === 2 ? themeColors.green : themeColors.cyan);
          detailText(ctx, api, a, 200, y + 52, 31, i === 2 ? themeColors.green : themeColors.cyan);
          if (i < 2 || visible(ctx, api, 'separate-warm')) detailText(ctx, api, z, 760, y + 52, 27);
        });
        detailText(
          ctx,
          api,
          'Driver compute cache and application recipe cache have distinct identities.',
          960,
          940,
          27,
          themeColors.muted,
          'center',
        );
      });
    if (currentBeat !== 1)
      footer(ctx, api, 'Time the first request and the synchronized warm launch separately.');
  }
}
export default {
  id: 'request-clock',
  draw: drawRequestClock,
  cues: [
    'compiler-producers',
    'link-cubin',
    'cold-init',
    'cold-jit',
    'cold-total',
    'native-omit',
    'cold-load',
    'cold-publish',
    'cold-launch',
    'separate-warm',
  ],
};
