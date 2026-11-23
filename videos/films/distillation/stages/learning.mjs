import { INITIAL, TEACHER, WORDS } from '../fixtures.mjs';
import { learningSnapshot, studentTrace } from '../model.mjs';
import { distribution, equation, text } from '../defaults.mjs';
import { stableSoftmax } from 'vizmatic';
export function drawLearning(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const teacher = stableSoftmax(TEACHER),
    initial = stableSoftmax(INITIAL);
  {
    const trace = studentTrace(),
      snapshot = learningSnapshot(currentBeat, progress, state.cues, state.t),
      { step, current } = snapshot,
      highlight = currentBeat === 2 ? 2 : null;
    api.focus.target('divergence-trajectory', () =>
      distribution(
        ctx,
        api,
        teacher,
        260,
        420,
        themeColors.blue,
        'Teacher target',
        1,
        290,
        highlight,
      ),
    );
    api.focus.target('divergence-trajectory', () =>
      distribution(
        ctx,
        api,
        current.probs,
        1080,
        420,
        themeColors.cyan,
        snapshot.amount > 0 && snapshot.amount < 1
          ? 'Student: update 12 → 13'
          : `Student: update ${step}`,
        1,
        290,
        highlight,
      ),
    );
    if (currentBeat === 0) {
      api.focus.target('student-gradient', () => {
        equation(
          ctx,
          api,
          String.raw`\frac{\partial L}{\partial z_i}=p_i-q_i`,
          960,
          300,
          43,
          themeColors.yellow,
          'center',
        );
        WORDS.forEach((word, i) => {
          const gradient = current.probs[i] - teacher[i],
            direction = gradient < 0 ? 'raise logit' : 'lower logit';
          components.card({
            label:
              word + ' · ' + (gradient >= 0 ? '+' : '') + gradient.toFixed(3) + '\n' + direction,
            x: 250 + i * 390,
            y: 800,
            width: 300,
            height: 115,
            fontSize: 26,
            baselineOffset: -12,
            padding: 10,
            fill: themeColors.panel,
            stroke: gradient < 0 ? themeColors.green : themeColors.pink,
            textColor: gradient < 0 ? themeColors.green : themeColors.pink,
          });
        });
        equation(
          ctx,
          api,
          String.raw`z_i\leftarrow z_i-\eta(p_i-q_i)`,
          960,
          1000,
          40,
          themeColors.ink,
          'center',
        );
      });
    } else {
      const plot = teaching.axes({
        x: 380,
        y: 850,
        width: 1140,
        height: 85,
        xDomain: [0, 40],
        yDomain: [0, 0.7],
        xTicks: [0, 20, 40],
        yTicks: [],
        color: themeColors.muted,
      });
      const points = trace.slice(0, step + 1).map((x) => ({
        x: x.step,
        y: x.loss,
      }));
      if (snapshot.amount > 0 && snapshot.amount < 1)
        points.push({
          x: 12 + snapshot.amount,
          y: current.loss,
        });
      api.focus.target('divergence-trajectory', () =>
        teaching.curve({
          plot,
          points,
          color: themeColors.yellow,
          width: 4,
        }),
      );
      text(ctx, api, 'KL', 280, 900, 30, themeColors.yellow);
    }
    if (currentBeat === 2) {
      const baseLogit = snapshot.base.logits[2],
        nextLogit = snapshot.next.logits[2];
      const label = !snapshot.showGradient
        ? 'Highlighted cat logit: ' + baseLogit.toFixed(3) + ' · predict its next direction'
        : snapshot.amount === 0
          ? 'At update 12: cat gradient +' + snapshot.gradient.toFixed(3)
          : snapshot.amount < 1
            ? 'Update 12 gradient +' +
              snapshot.gradient.toFixed(3) +
              ' · current cat logit ' +
              current.logits[2].toFixed(3)
            : 'Update 12 gradient +' +
              snapshot.gradient.toFixed(3) +
              ' · cat logit ' +
              baseLogit.toFixed(3) +
              ' → ' +
              nextLogit.toFixed(3);
      text(ctx, api, label, 960, 310, 29, themeColors.yellow, 'center');
    }
  }
}
export default {
  id: 'learning',
  draw: drawLearning,
  cues: [
    'learning-b1-1',
    'learning-b2-1',
    'learning-b3-1',
    'distill-cat-positive',
    'distill-cat-lower',
  ],
};
