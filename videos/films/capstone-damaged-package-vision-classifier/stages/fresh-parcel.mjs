import { visionFrame } from '../model.mjs';
import {
  visionCard,
  visionMetrics,
  visionNote,
  visionPhoto,
  visionTable,
  visionText,
} from '../defaults.mjs';
export function drawFreshParcel(ctx, scene, state, api) {
  const frameState = visionFrame('fresh-parcel', state);
  return api.focus.target('dv-fresh-parcel-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat;
    {
      const f = frameState.fresh;
      if (currentBeat === 0 || currentBeat === 1) {
        [f.rows[4], f.rows[5]].forEach((row, i) => {
          const x = 200 + i * 880,
            p = visionPhoto(ctx, api, x + 140, 350, 460, i === 0);
          visionText(ctx, api, row.photo.photo_id, x + 370, 300, 32, themeColors.ink, 'center');
          visionText(
            ctx,
            api,
            'Damage ' +
              row.output.damage_probability.toFixed(2) +
              ' · brightness ' +
              row.output.brightness.toFixed(2),
            x + 370,
            745,
            31,
            themeColors.yellow,
            'center',
          );
          if (frameState.showRoutes)
            visionCard(
              ctx,
              api,
              i === 0 ? 'Request new photo' : 'Normal review',
              x,
              810,
              740,
              90,
              i === 0 ? themeColors.pink : themeColors.blue,
            );
        });
        if (currentBeat === 0)
          visionNote(
            ctx,
            api,
            'Predict: case action? Count the outcome at day 21? Label reviewed day 21, available day 22.',
          );
        else if (!frameState.showRoutes)
          visionNote(ctx, api, 'Prediction hold · keep the supplied inputs visible.');
        else
          visionNote(
            ctx,
            api,
            frameState.showMetrics
              ? 'Case action: normal. Day 21: precision 2/3, recall 1, but only 4/5 outcomes → HOLD.'
              : 'Case action: normal. Availability decision pending.',
          );
      } else {
        visionText(
          ctx,
          api,
          'Evidence repair on fixed served routes',
          960,
          290,
          38,
          themeColors.ink,
          'center',
        );
        const rows = [['Case', 'Served action', 'Available', 'Joined cell']];
        f.outcomes.forEach((o) => {
          const joined = f.joined.find((r) => r.case_id === o.case_id);
          rows.push([
            o.case_id,
            f.servedActions[o.case_id] === 'priority_damage_review' ? 'Priority' : 'Normal',
            'day ' + o.available_day,
            joined && (o.case_id !== 'R-520' || frameState.showMiss) ? joined.cell : 'pending',
          ]);
        });
        visionTable(ctx, api, rows, 200, 380, 1500, 76);
        visionText(
          ctx,
          api,
          'Readout day ' + f.cutoff + ' · routes unchanged',
          960,
          820,
          32,
          themeColors.ink,
          'center',
        );
        visionMetrics(ctx, api, f, frameState.showMetrics, 865);
        visionNote(
          ctx,
          api,
          currentBeat === 3
            ? 'Complete synthetic bookkeeping cannot promote absent photographs or weights.'
            : frameState.showMiss
              ? 'One delayed false negative becomes observable. The classifier never improved.'
              : f.cutoff === 22
                ? 'Readout advanced. Join the retained outcome before calculating metrics.'
                : 'Keep the original routes while checking the permitted readout cutoff.',
        );
      }
    }
  });
}
export default {
  id: 'fresh-parcel',
  draw: drawFreshParcel,
  cues: [
    'dv-fresh-parcel-0',
    'dv-fresh-parcel-operation-0',
    'dv-fresh-parcel-1',
    'dv-fresh-parcel-operation-1',
    'dv-fresh-route',
    'dv-fresh-incomplete-metrics',
    'dv-fresh-parcel-2',
    'dv-fresh-parcel-operation-2',
    'dv-fresh-cutoff',
    'dv-fresh-missed-case',
    'dv-fresh-complete-metrics',
    'dv-fresh-parcel-3',
    'dv-fresh-parcel-operation-3',
  ],
};
