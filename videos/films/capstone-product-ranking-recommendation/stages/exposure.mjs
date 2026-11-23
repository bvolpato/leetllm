import { clip } from '../arithmetic.mjs';
import { exposureFrame } from '../model.mjs';
import { sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';
export function drawExposure(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    modelState = sampleModel('exposure', state);
  {
    text(
      ctx,
      api,
      'Each dot is one displayed impression · yellow is a click',
      960,
      280,
      34,
      themeColors.ink,
      'center',
    );
    const observed = state.beat > 0 ? 1 : api.focus.progress('exposure-observe', modelState.p);
    const normalize =
      state.beat === 0
        ? 0
        : api.focus.progress('exposure-normalize', clip((state.beatP - 0.2) / 0.35));
    const rows = exposureFrame(observed);
    rows.forEach((row, index) => {
      const x = 360 + index * 600,
        top = 425;
      text(
        ctx,
        api,
        row.id,
        x,
        365,
        38,
        [themeColors.pink, themeColors.green, themeColors.blue][index],
        'center',
      );
      api.focus.target('impressions', () =>
        row.events.forEach((event) => {
          components.fade(event.cohort === 0 ? 1 : 1 - normalize * 0.82, () =>
            api.circle(
              ctx,
              x - 162 + event.column * 36,
              top + event.cohort * 36,
              10,
              event.clicked ? themeColors.yellow : themeColors.panel,
              event.clicked ? themeColors.yellow : themeColors.blue,
              2,
            ),
          );
        }),
      );
      if (normalize > 0)
        components.fade(normalize, () =>
          api.focus.target('matched-exposures', () =>
            api.rect(ctx, x - 187, top - 25, 374, 50, 'transparent', themeColors.cyan, 12),
          ),
        );
      api.focus.target('feedback', () =>
        text(
          ctx,
          api,
          row.clicks + ' clicks / ' + row.impressions + ' views',
          x,
          850,
          30,
          themeColors.ink,
          'center',
        ),
      );
      components.fade(normalize, () =>
        api.focus.target('observed-rates', () =>
          text(
            ctx,
            api,
            row.equalClicks +
              ' / ' +
              row.equalImpressions +
              ' = ' +
              (row.rate * 100).toFixed(0) +
              '%',
            x,
            935,
            38,
            themeColors.cyan,
            'center',
          ),
        ),
      );
    });
    if (normalize > 0)
      components.fade(normalize, () =>
        text(
          ctx,
          api,
          'Observed rates still reflect position and selection',
          960,
          1020,
          28,
          themeColors.muted,
          'center',
        ),
      );
  }
}
export default {
  id: 'exposure',
  draw: drawExposure,
  cues: ['exposure-observe', 'exposure-raw', 'exposure-normalize', 'exposure-limits'],
};
