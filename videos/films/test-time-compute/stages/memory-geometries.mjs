import { testTimeCoreFrame, ttCue } from '../construction.mjs';
import { arrow, card, focusTarget, text } from '../defaults.mjs';
export function drawMemoryGeometries(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = testTimeCoreFrame('memory-geometries', state);
  const prog = (name, beat = 0) => ttCue(state, name, beat);
  const result = (name, label, x = 960, y = 900, k = themeColors.green, z = 38, beat = 0) =>
    focusTarget(ctx, api, name, () =>
      text(
        ctx,
        api,
        prog(name, beat).done ? label : 'Calculation pending',
        x,
        y,
        z,
        prog(name, beat).done ? k : themeColors.muted,
        'center',
      ),
    );
  function content() {
    if (currentBeat < 2) {
      ['K', 'V'].forEach((s, i) => {
        const x = 220 + i * 850;
        card(ctx, api, s, x, 330, 550, 90, i ? themeColors.pink : themeColors.blue, 42);
        for (let r = 0; r < 4; r++)
          for (let h = 0; h < 8; h++)
            api.rect(
              ctx,
              x + h * 67,
              500 + r * 75,
              52,
              48,
              i ? themeColors.pink : themeColors.blue,
              undefined,
              0,
            );
        text(
          ctx,
          api,
          'Each pictured row groups 8 layers',
          x + 275,
          825,
          26,
          themeColors.muted,
          'center',
        );
        text(
          ctx,
          api,
          '32 layers × 8 KV heads × 128 width',
          x + 275,
          885,
          27,
          themeColors.muted,
          'center',
        );
      });
      if (currentBeat === 0)
        text(
          ctx,
          api,
          'Multiply keys + values by retained positions and scalar bytes',
          960,
          975,
          33,
          themeColors.yellow,
          'center',
        );
      else
        result(
          'tt-kv-product',
          '2 × 32 × 8 × 128 × 2 = 131,072 B = 128 KiB / position',
          960,
          975,
          themeColors.green,
          33,
          1,
        );
    } else {
      card(ctx, api, 'Shared prompt block', 610, 305, 700, 100, themeColors.blue, 36);
      const owners = [];
      for (let i = 0; i < 3; i++) {
        owners.push(
          card(
            ctx,
            api,
            `private branch ${i + 1}`,
            240 + i * 570,
            665,
            350,
            110,
            themeColors.pink,
            31,
          ),
        );
        arrow(ctx, api, 800 + i * 160, 450, 415 + i * 570, 610);
      }
      focusTarget(ctx, api, 'tt-cow-diverge', () => {
        const q = prog('tt-cow-diverge', 2).p,
          destination = card(
            ctx,
            api,
            q === 1 ? 'new private block' : 'reserved private block',
            1380,
            835,
            350,
            90,
            themeColors.pink,
            27,
          );
        api.teaching.transfer({
          source: {
            shape: owners[2],
            opacity: 1,
          },
          target: {
            shape: destination,
            opacity: 1,
          },
          progress: q,
          color: themeColors.pink,
          particle: {
            radius: 9,
            fill: themeColors.pink,
          },
        });
      });
      text(
        ctx,
        api,
        'Raw KV excludes weights, workspace and allocator overhead',
        960,
        1000,
        31,
        themeColors.muted,
        'center',
      );
    }
  }
  // Existing manuscript operation targets remain attached to the actual construction.
  const bases = scene.beats.flatMap((beat) =>
    (beat.visual_cues ?? [])
      .filter((cue) => /^tt-[a-z].*-\d+$/.test(cue.id))
      .flatMap((cue) => cue.targets ?? []),
  );
  const wrap = (i) =>
    i < bases.length ? focusTarget(ctx, api, bases[i], () => wrap(i + 1)) : content();
  wrap(0);
}
export default {
  id: 'memory-geometries',
  draw: drawMemoryGeometries,
  cues: [
    'tt-memory-geometries-0',
    'tt-memory-geometries-1',
    'tt-kv-product',
    'tt-memory-geometries-2',
    'tt-cow-diverge',
  ],
};
