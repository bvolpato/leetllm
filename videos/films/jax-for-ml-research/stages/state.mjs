import { history } from '../fixtures.mjs';
import { sampleModel } from '../model.mjs';
import { drawCard, legacyEquation, legacyText } from '../defaults.mjs';
export function drawState(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('state', state),
    { b: currentBeat, q } = modelState;
  {
    if (!currentBeat) {
      const incoming = api.focus.target('initial-state', () =>
          drawCard(ctx, api, 'θ₀ = [0, 0, 0]', 160, 455, 510, themeColors.blue, 110, 36),
        ),
        step = drawCard(
          ctx,
          api,
          'Value + gradient → SGD',
          760,
          455,
          410,
          themeColors.yellow,
          110,
          30,
        ),
        outgoing = api.focus.target('returned-state', () =>
          drawCard(
            ctx,
            api,
            q > 0.74 ? 'θ₁ = [0.225, 0.075, 0.125]' : 'Returned state pending',
            1260,
            455,
            510,
            q > 0.74 ? themeColors.green : themeColors.muted,
            110,
            28,
          ),
        );
      drawCard(
        ctx,
        api,
        'Read-only batch · four named rows',
        605,
        285,
        710,
        themeColors.cyan,
        85,
        30,
      );
      api.arrow(ctx, 960, 390, 960, 435, themeColors.cyan, 4);
      teaching.transfer({
        source: {
          shape: incoming,
          opacity: 1,
        },
        target: {
          shape: step,
          opacity: 1,
        },
        color: themeColors.blue,
        progress: api.phase(q, 0, 0.35),
        particle: {
          radius: 8,
        },
      });
      teaching.transfer({
        source: {
          shape: step,
          opacity: 1,
        },
        target: {
          shape: outgoing,
          opacity: 1,
        },
        color: themeColors.green,
        progress: api.phase(q, 0.5, 0.8),
        particle: {
          radius: 8,
        },
      });
      if (q > 0.35) legacyEquation(ctx, api, String.raw`\nabla L=[-4.5,-1.5,-2.5]`, 960, 690, 43);
      if (q > 0.74)
        legacyText(
          ctx,
          api,
          'Fresh loss: ' + modelState.first.loss.toFixed(6),
          1515,
          705,
          33,
          themeColors.green,
          'center',
        );
    } else {
      const previous = history[Math.max(0, modelState.step - 1)];
      drawCard(
        ctx,
        api,
        'Input θ' +
          (modelState.step - 1) +
          ' · [' +
          previous.p.map((v) => v.toFixed(2)).join(', ') +
          ']',
        170,
        285,
        620,
        themeColors.blue,
        90,
        27,
      );
      drawCard(
        ctx,
        api,
        'Four-row batch → gradient → update',
        900,
        285,
        820,
        themeColors.yellow,
        90,
        29,
      );
      const plot = teaching.axes({
        x: 240,
        y: 480,
        width: 1120,
        height: 350,
        xDomain: [0, 80],
        yDomain: [0, 4],
        xTicks: [0, 20, 40, 60, 80],
        yTicks: [0, 1, 2, 3, 4],
        xLabel: 'computed SGD updates',
        yLabel: 'fresh post-update MSE',
        fontSize: 27,
      });
      teaching.curve({
        plot,
        points: modelState.history.map((v, i) => ({
          x: i,
          y: v.loss,
        })),
        color: themeColors.cyan,
        width: 5,
      });
      teaching.scatter({
        plot,
        points: [
          {
            x: modelState.step,
            y: modelState.current.loss,
          },
        ],
        color: themeColors.yellow,
        radius: 8,
      });
      api.focus.target('current-state', () =>
        legacyText(
          ctx,
          api,
          'Returned θ' + modelState.step,
          1515,
          485,
          34,
          themeColors.green,
          'center',
        ),
      );
      api.focus.target('current-state', () =>
        legacyText(
          ctx,
          api,
          '[' + modelState.current.p.map((v) => v.toFixed(3)).join(', ') + ']',
          1515,
          590,
          29,
          themeColors.green,
          'center',
        ),
      );
      teaching.changeCue(
        {
          x: 1350,
          y: 655,
          width: 340,
          height: 85,
          from: previous.loss,
          to: modelState.current.loss,
          progress: 1,
          color: themeColors.green,
          restColor: themeColors.cyan,
          emphasis: 0.3,
        },
        (cue) =>
          api.focus.target('fresh-loss', () =>
            legacyText(
              ctx,
              api,
              'Fresh L = ' + cue.value.toFixed(6),
              1520,
              705,
              30,
              cue.color,
              'center',
            ),
          ),
      );
      legacyText(
        ctx,
        api,
        'Four-row recurrence · learning rate 0.05 · each output becomes the next input',
        960,
        985,
        29,
        themeColors.muted,
        'center',
      );
    }
  }
}
export default {
  id: 'state',
  draw: drawState,
  cues: ['state-b1-1', 'state-b1-2', 'state-b2-1', 'state-b2-2'],
};
