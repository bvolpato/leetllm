import { resolvedRates } from '../fixtures.mjs';
import { sampleModel } from '../model.mjs';
import { cascadeSnapshot } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawCascade(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel(state);
  {
    const beat = Math.min(1, state.beat ?? 0),
      flow = cascadeSnapshot(beat, state.beatP ?? 0);
    if (state.cues && !beat) {
      ['cascade-rules', 'cascade-classifier', 'cascade-judge', 'cascade-human'].forEach(
        (id, index) => {
          const stage = flow.stages[index],
            fraction = api.focus.progress(id, stage.fraction);
          Object.assign(stage, {
            received: index === 0 || api.focus.visible(id),
            fraction,
            resolved: Math.round(resolvedRates[index] * fraction),
            remainder: stage.incoming - Math.round(resolvedRates[index] * fraction),
          });
        },
      );
    }
    if (state.cues && beat) {
      flow.handling = api.focus.progress('cascade-review-work', flow.handling);
      flow.staffing = api.focus.progress('cascade-staffing', flow.staffing);
    }
    const labels = ['Rules + cache', 'Classifier', 'Policy judge', 'Human review'];
    text(
      ctx,
      api,
      'Follow the requests that still need a decision',
      960,
      278,
      35,
      themeColors.ink,
      'center',
    );
    flow.stages.forEach((stage, index) =>
      api.focus.target(`cascade-stage-${index}`, () => {
        const x = 140 + index * 445,
          center = x + 180,
          color = index === 3 ? themeColors.yellow : themeColors.cyan;
        card(
          ctx,
          api,
          labels[index],
          x,
          355,
          360,
          beat && index === 1 ? themeColors.yellow : color,
          90,
        );
        if (!stage.received) {
          text(ctx, api, 'Awaiting remainder', center, 530, 26, themeColors.muted, 'center');
          return;
        }
        api.focus.target(`cascade-incoming-${index}`, () =>
          text(
            ctx,
            api,
            stage.incoming.toLocaleString() + ' / s in',
            center,
            520,
            32,
            themeColors.ink,
            'center',
          ),
        );
        api.rect(ctx, x + 20, 585, 320, 50, themeColors.panel, themeColors.muted, 1);
        const exitedWidth = (320 * stage.resolved) / stage.incoming;
        if (exitedWidth > 0)
          api.rect(ctx, x + 20, 585, exitedWidth, 50, themeColors.green, undefined, 0);
        if (exitedWidth < 320)
          api.rect(ctx, x + 20 + exitedWidth, 585, 320 - exitedWidth, 50, color, undefined, 0);
        teaching.changeCue(
          {
            x: x + 15,
            y: 665,
            width: 330,
            height: 65,
            from: 0,
            to: resolvedRates[index],
            progress: stage.fraction,
            color: themeColors.green,
          },
          (cue) =>
            text(
              ctx,
              api,
              Math.round(cue.value).toLocaleString() + ' / s resolved',
              center,
              710,
              28,
              cue.color,
              'center',
            ),
        );
        text(
          ctx,
          api,
          stage.remainder.toLocaleString() + ' / s remain',
          center,
          785,
          28,
          stage.fraction > 0 && stage.fraction < 1 ? color : themeColors.ink,
          'center',
        );
        if (index < 3 && stage.fraction === 1) {
          api.line(ctx, x + 360, 505, x + 423, 505, color, 3);
          api.line(ctx, x + 413, 495, x + 423, 505, color, 3);
          api.line(ctx, x + 413, 515, x + 423, 505, color, 3);
        }
      }),
    );
    const classifierWork = (y) => {
      const classifier = flow.stages[1];
      api.focus.target('cascade-classifier-work', () =>
        text(
          ctx,
          api,
          `Classifier work = ${classifier.resolved.toLocaleString()} resolved + ${classifier.remainder.toLocaleString()} escalated = ${classifier.incoming.toLocaleString()} requests / s`,
          960,
          y,
          30,
          themeColors.yellow,
          'center',
        ),
      );
    };
    if (!beat)
      text(
        ctx,
        api,
        'Green leaves the cascade with a decision; blue continues to the next stage.',
        960,
        925,
        29,
        themeColors.muted,
        'center',
      );
    else if (!(state.cues ? api.focus.visible('cascade-human-work') : flow.seconds >= 9)) {
      classifierWork(895);
    } else {
      if (state.cues?.['cascade-classifier-work']?.active) classifierWork(830);
      api.focus.target('cascade-human-inputs', () =>
        text(
          ctx,
          api,
          'Human arrivals 100 / s · mean handling 120 s · target occupancy 70%',
          960,
          870,
          29,
          themeColors.yellow,
          'center',
        ),
      );
      api.focus.reveal('cascade-review-work', () =>
        api.focus.target('cascade-review-work', () => {
          teaching.changeCue(
            {
              x: 230,
              y: 900,
              width: 680,
              height: 72,
              from: flow.busy,
              to: flow.busy,
              progress: flow.handling,
              color: themeColors.yellow,
            },
            (cue) =>
              text(
                ctx,
                api,
                '100 × 120 = ' + cue.value.toLocaleString() + ' busy reviewers',
                570,
                950,
                29,
                cue.color,
                'center',
              ),
          );
          api.focus.reveal('cascade-staffing', () =>
            api.focus.target('cascade-staffing', () =>
              teaching.changeCue(
                {
                  x: 1000,
                  y: 900,
                  width: 700,
                  height: 72,
                  from: flow.staff,
                  to: flow.staff,
                  progress: flow.staffing,
                  color: themeColors.pink,
                },
                (cue) =>
                  text(
                    ctx,
                    api,
                    'ceil(12,000 / 0.70) = ' + cue.value.toLocaleString() + ' staff',
                    1350,
                    950,
                    29,
                    cue.color,
                    'center',
                  ),
              ),
            ),
          );
        }),
      );
    }
  }
}
export default {
  id: 'cascade',
  draw: drawCascade,
  cues: [
    'cascade-rules',
    'cascade-classifier',
    'cascade-judge',
    'cascade-human',
    'cascade-incoming',
    'cascade-classifier-work',
    'cascade-human-work',
    'cascade-review-work',
    'cascade-staffing',
  ],
};
