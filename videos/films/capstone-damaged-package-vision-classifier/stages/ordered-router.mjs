import { visionRoute } from '../arithmetic.mjs';
import { visionTestRows } from '../construction.mjs';
import { visionFrame } from '../model.mjs';
import { visionCard, visionNote, visionText } from '../defaults.mjs';
export function drawOrderedRouter(ctx, scene, state, api) {
  const frameState = visionFrame('ordered-router', state);
  return api.focus.target('dv-ordered-router-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      const chosen = ['R-409-a', 'R-406-a', 'R-404-a'];
      chosen.forEach((id, i) => {
        const row = visionTestRows.find((r) => r.photo.photo_id === id),
          trace = visionRoute(row.photo, row.output),
          x = 150 + i * 550;
        visionCard(
          ctx,
          api,
          id,
          x,
          310,
          500,
          80,
          [themeColors.pink, themeColors.yellow, themeColors.green][i],
        );
        visionText(
          ctx,
          api,
          'Visible ' + String(row.output.box_visible),
          x + 35,
          465,
          29,
          themeColors.ink,
        );
        visionText(
          ctx,
          api,
          'Brightness ' + row.output.brightness.toFixed(2),
          x + 35,
          525,
          29,
          themeColors.ink,
        );
        visionText(
          ctx,
          api,
          'Blur ' + row.output.blur_score.toFixed(2),
          x + 35,
          585,
          29,
          themeColors.ink,
        );
        visionText(
          ctx,
          api,
          'Damage ' + row.output.damage_probability.toFixed(2),
          x + 35,
          665,
          32,
          themeColors.yellow,
        );
        const show = resultComplete(
          i === 0 ? 'presence-route' : i === 1 ? 'quality-route' : 'priority-route',
          0,
        );
        visionCard(
          ctx,
          api,
          show
            ? trace.action === 'request_new_photo'
              ? 'Request new photo'
              : 'Priority review'
            : 'Checking ordered gates',
          x,
          760,
          500,
          105,
          show ? (i < 2 ? themeColors.pink : themeColors.green) : themeColors.muted,
        );
      });
      if (currentBeat === 2)
        visionText(
          ctx,
          api,
          resultComplete('route-counts', 2)
            ? '7 photos → 3 priority · 2 normal · 2 new photo'
            : 'Seven photo routes · totals pending',
          960,
          920,
          32,
          resultComplete('route-counts', 2) ? themeColors.cyan : themeColors.muted,
          'center',
        );
      else
        visionText(
          ctx,
          api,
          currentBeat === 1
            ? 'Brightness ≥ .20 · blur ≤ .45 · damage ≥ .70'
            : 'Presence → numerical quality → damage threshold',
          960,
          918,
          32,
          themeColors.ink,
          'center',
        );
      visionNote(
        ctx,
        api,
        'The human label never enters these branches; a high score remains recorded after a quality veto.',
      );
    }
  });
}
export default {
  id: 'ordered-router',
  draw: drawOrderedRouter,
  cues: [
    'dv-ordered-router-0',
    'dv-ordered-router-operation-0',
    'dv-presence-route',
    'dv-quality-route',
    'dv-priority-route',
    'dv-ordered-router-1',
    'dv-ordered-router-operation-1',
    'dv-inclusive-route',
    'dv-ordered-router-2',
    'dv-ordered-router-operation-2',
    'dv-route-counts',
  ],
};
