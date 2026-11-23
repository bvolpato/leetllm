import { dpoExample, twoLogitState, twoLogitTrace } from '../model.mjs';
import { equation, text } from '../defaults.mjs';
export function drawUpdate(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0, 0, 1);
  const phaseForBeat = (i) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress2, 0.05, 0.93);
  const d = dpoExample();
  {
    const stepSize = 0.4;
    const trace = twoLogitTrace(6, stepSize),
      progress = phaseForBeat(1),
      updates = trace.length - 1;
    const position = progress * updates,
      index = Math.min(updates - 1, Math.floor(position));
    const fraction = progress >= 1 ? 1 : position - index;
    const before = trace[index].logits,
      after = trace[index + 1].logits;
    const logits =
      progress >= 1
        ? trace.at(-1).logits
        : before.map((value, i) => api.lerp(value, after[i], fraction));
    const current = twoLogitState(logits),
      completed = Math.min(updates, Math.floor(position));
    text(
      ctx,
      api,
      'Two-response policy · reference logits start equal',
      960,
      295,
      36,
      themeColors.ink,
      'center',
    );
    teaching.changeCue(
      {
        x: 220,
        y: 350,
        width: 620,
        height: 60,
        from: 0,
        to: current.margin,
        progress: 1,
        color: themeColors.yellow,
        restColor: themeColors.yellow,
        emphasis: currentBeat === 1 ? 0.28 : 0,
      },
      () =>
        api.focus.target('updated-margin', () =>
          equation(
            ctx,
            api,
            String.raw`m=\theta_w-\theta_l=${current.margin.toFixed(2)}`,
            530,
            395,
            41,
            themeColors.yellow,
          ),
        ),
    );
    equation(
      ctx,
      api,
      String.raw`q_{\mathrm{DPO}}=\sigma(0.5m)=${current.preferenceProbability.toFixed(3)}`,
      1360,
      385,
      37,
      themeColors.green,
    );
    text(ctx, api, 'Pair margin', 530, 330, 26, themeColors.yellow, 'center');
    text(ctx, api, 'Preference confidence', 1360, 330, 26, themeColors.green, 'center');
    text(
      ctx,
      api,
      'POLICY CONTINUATION PROBABILITIES · softmax pπ',
      960,
      465,
      28,
      themeColors.cyan,
      'center',
    );
    const labels = ['Chosen response · continuation pπ', 'Scenic detour · continuation pπ'];
    api.focus.target('policy-probabilities', () =>
      teaching.bars({
        x: 360,
        y: 480,
        width: 1200,
        height: 180,
        values: current.probabilities,
        labels,
        colors: [themeColors.green, themeColors.pink],
        max: 1,
        showValues: true,
        format: (v) => v.toFixed(2),
        fontSize: 30,
        progress: 1,
      }),
    );
    const distance = 320 * Math.abs(current.gradient[0]);
    api.focus.target('chosen-gradient', () =>
      api.arrow(ctx, 660, 870, 660, 870 - distance, themeColors.green, 6),
    );
    api.focus.target('rejected-gradient', () =>
      api.arrow(ctx, 1260, 790, 1260, 790 + distance, themeColors.pink, 6),
    );
    text(ctx, api, 'Raise chosen logit', 660, 765, 29, themeColors.green, 'center');
    text(ctx, api, 'Lower detour logit', 1260, 765, 29, themeColors.pink, 'center');
    text(
      ctx,
      api,
      `Gradient magnitude ${Math.abs(current.gradient[0]).toFixed(3)} × step size ${stepSize} = logit change ${(stepSize * Math.abs(current.gradient[0])).toFixed(3)}`,
      960,
      935,
      30,
      themeColors.cyan,
      'center',
    );
  }
}
export default {
  id: 'update',
  draw: drawUpdate,
  cues: ['update-b1-1', 'update-b2-1', 'update-b2-2', 'update-b3-1'],
};
