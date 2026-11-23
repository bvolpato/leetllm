import { testTimeCoreFrame, ttCue } from '../construction.mjs';
import { card, focusTarget, text } from '../defaults.mjs';
export function drawRouterFeasible(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = testTimeCoreFrame('router-feasible', state);
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
    text(
      ctx,
      api,
      'Quality ≥ 0.84 · latency ≤ 1000 ms · minimum eligible cost',
      960,
      275,
      33,
      themeColors.yellow,
      'center',
    );
    m.rows.forEach((r, i) => {
      const y = 380 + i * 160,
        cue = [m.single, m.bounded, m.guided][i],
        visible = i === 0 || currentBeat >= 1;
      if (!visible) return;
      card(ctx, api, r.id, 150, y, 280, 95, themeColors.blue, 32);
      text(ctx, api, `Q ${r.quality.toFixed(2)}`, 535, y + 60, 34, themeColors.ink, 'center');
      text(ctx, api, `${r.latency} ms`, 840, y + 60, 34, themeColors.ink, 'center');
      text(ctx, api, `$${r.cost.toFixed(3)}`, 1145, y + 60, 34, themeColors.ink, 'center');
      focusTarget(
        ctx,
        api,
        ['tt-router-single', 'tt-router-bounded', 'tt-router-guided'][i],
        () => {
          text(
            ctx,
            api,
            cue.done
              ? i === 1
                ? 'eligible'
                : 'fails ' + (i === 0 ? 'quality' : 'latency')
              : 'checks pending',
            1500,
            y + 60,
            33,
            cue.done ? (i === 1 ? themeColors.green : themeColors.pink) : themeColors.muted,
            'center',
          );
        },
      );
    });
    if (currentBeat >= 1)
      result('tt-router-choice', 'Choose bounded reasoning', 960, 960, themeColors.green, 40, 1);
    if (currentBeat === 2)
      text(
        ctx,
        api,
        'No eligible tested row → declared fallback',
        960,
        1030,
        30,
        themeColors.yellow,
        'center',
      );
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
  id: 'router-feasible',
  draw: drawRouterFeasible,
  cues: [
    'tt-router-feasible-0',
    'tt-router-single',
    'tt-router-feasible-1',
    'tt-router-bounded',
    'tt-router-guided',
    'tt-router-choice',
    'tt-router-feasible-2',
  ],
};
