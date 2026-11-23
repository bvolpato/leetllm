import { sampleModel } from '../model.mjs';
import { equation, text } from '../defaults.mjs';
export function drawTraffic(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    modelState = sampleModel('traffic', state),
    currentBeat = modelState.step;
  {
    text(
      ctx,
      api,
      themeColors,
      'Same triad · n = 1,000,003 elements',
      960,
      270,
      35,
      themeColors.ink,
      'center',
    );
    api.focus.target('traffic-operand-bytes', () =>
      [
        ['Read X', themeColors.blue],
        ['Read Z', themeColors.cyan],
        ['Write Y', themeColors.green],
      ].forEach(([label, color], i) => {
        api.rect(ctx, 300 + i * 440, 350, 440, 70, color, undefined, 0);
        api.focus.target('traffic-label-4-bytes-element', () =>
          text(
            ctx,
            api,
            themeColors,
            label + ' · 4 bytes / element',
            520 + i * 440,
            455,
            27,
            color,
            'center',
          ),
        );
      }),
    );
    api.focus.target('traffic-fixed-useful-volume-s-bytes-tolocalestring-en-us-bytes', () =>
      text(
        ctx,
        api,
        themeColors,
        'Fixed useful volume: ' + modelState.bytes.toLocaleString('en-US') + ' bytes',
        960,
        525,
        34,
        themeColors.ink,
        'center',
      ),
    );
    api.focus.target('traffic-math-b-useful-rac-12n-t', () =>
      equation(ctx, api, themeColors, String.raw`B_{useful}=\frac{12n}{t}`, 960, 605, 47),
    );
    const left = 470,
      span = 900;
    text(ctx, api, themeColors, 'Elapsed interval', 160, 706, 30, themeColors.yellow);
    api.rect(ctx, left, 665, span, 58, themeColors.panel, themeColors.muted, 1);
    api.focus.target('traffic-elapsed-interval', () =>
      teaching.changeCue(
        {
          x: 455,
          y: 650,
          width: 1260,
          height: 90,
          from: 8,
          to: 3,
          progress: currentBeat ? modelState.q : 0,
          color: themeColors.yellow,
          restColor: themeColors.yellow,
          emphasis: currentBeat && modelState.q > 0 && modelState.q < 1 ? 0.7 : 0,
        },
        (cue) => {
          api.rect(ctx, left, 665, (span * cue.value) / 8, 58, cue.color, undefined, 0);
          text(
            ctx,
            api,
            themeColors,
            cue.value.toFixed(2) + ' µs',
            1570,
            707,
            34,
            cue.color,
            'center',
          );
        },
      ),
    );
    text(ctx, api, themeColors, 'Effective rate', 160, 856, 30, themeColors.green);
    api.rect(ctx, left, 815, span, 58, themeColors.panel, themeColors.muted, 1);
    api.focus.target('traffic-effective-rate', () =>
      teaching.changeCue(
        {
          x: 455,
          y: 800,
          width: 1260,
          height: 90,
          from: modelState.bytes / 8000,
          to: modelState.bytes / 3000,
          progress: currentBeat
            ? (modelState.gbps - modelState.bytes / 8000) /
              (modelState.bytes / 3000 - modelState.bytes / 8000)
            : 0,
          color: themeColors.green,
          restColor: themeColors.green,
          emphasis: currentBeat && modelState.q > 0 && modelState.q < 1 ? 0.7 : 0,
        },
        (cue) => {
          api.rect(ctx, left, 815, (span * cue.value) / 4000.012, 58, cue.color, undefined, 0);
          text(
            ctx,
            api,
            themeColors,
            cue.value.toFixed(0) + ' GB/s',
            1570,
            857,
            34,
            cue.color,
            'center',
          );
        },
      ),
    );
    text(
      ctx,
      api,
      themeColors,
      'Measured HBM bytes: requires counters from a matching experiment',
      960,
      975,
      30,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'traffic',
  draw: drawTraffic,
  cues: [
    'traffic-two-loads-one-store',
    'traffic-useful-rate',
    'traffic-interval-shrinks',
    'traffic-rate-rises',
  ],
};
