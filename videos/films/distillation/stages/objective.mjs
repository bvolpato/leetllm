import { INITIAL, TEACHER, WORDS } from '../fixtures.mjs';
import { objectiveSnapshot } from '../model.mjs';
import { card, equation, text } from '../defaults.mjs';
import { stableSoftmax } from 'vizmatic';
export function drawObjective(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.05, 0.9);
  const teacher = stableSoftmax(TEACHER),
    initial = stableSoftmax(INITIAL);
  {
    api.focus.target('kl-objective', () =>
      equation(
        ctx,
        api,
        String.raw`D_{\mathrm{KL}}(q\Vert p)=\sum_i q_i\ln\frac{q_i}{p_i}`,
        960,
        300,
        51,
        themeColors.ink,
        'center',
      ),
    );
    const current = objectiveSnapshot(currentBeat, phaseForBeat(currentBeat), state.cues);
    WORDS.forEach((word, i) =>
      api.focus.target('token-contributions', () =>
        api.focus.target(i >= 2 ? 'negative-contributions' : 'positive-contributions', () => {
          card(
            ctx,
            api,
            word,
            250 + i * 390,
            455,
            300,
            i >= 2 ? themeColors.pink : themeColors.blue,
          );
          if (i < current.count)
            text(
              ctx,
              api,
              (current.terms[i] >= 0 ? '+' : '−') + Math.abs(current.terms[i]).toFixed(3),
              400 + i * 390,
              645,
              43,
              current.terms[i] >= 0 ? themeColors.yellow : themeColors.pink,
              'center',
            );
          text(
            ctx,
            api,
            'Teacher q   ' + teacher[i].toFixed(3),
            400 + i * 390,
            703,
            29,
            themeColors.blue,
            'center',
          );
          text(
            ctx,
            api,
            'Student p   ' + initial[i].toFixed(3),
            400 + i * 390,
            752,
            29,
            themeColors.cyan,
            'center',
          );
        }),
      ),
    );
    api.focus.target('kl-subtotal', () =>
      card(
        ctx,
        api,
        `${current.count === 4 ? 'KL total' : 'Visible subtotal'} ≈ ${current.total.toFixed(3)}`,
        600,
        800,
        720,
        current.count === 4 ? themeColors.green : themeColors.yellow,
      ),
    );
    text(
      ctx,
      api,
      `${current.count} of 4 signed contributions`,
      960,
      945,
      29,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'objective',
  draw: drawObjective,
  cues: ['objective-b1-1', 'objective-b1-2', 'objective-b2-1', 'objective-b2-2', 'objective-b3-1'],
};
