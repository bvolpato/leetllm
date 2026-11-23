import { timedForecastScene } from '../construction.mjs';
import { fridayChart } from '../friday-chart.mjs';
import { alertPolicyVersion, forecastVersion } from '../fixtures.mjs';
import { text } from '../defaults.mjs';

const scene = timedForecastScene('alert-receipt', (ctx, api, clock) => {
  const { C } = api;
  fridayChart(ctx, api);
  const replay = clock.progress('impact') > 0;
  api.focus.target('friday-action', () => {
    if (clock.beat === 0) {
      text(
        ctx,
        api,
        'Band fixed Sun 25 Jan   ·   Forecast source Fri 23 Jan   ·   Target Fri 30 Jan',
        960,
        882,
        34,
        C.ink,
      );
      return;
    }
    text(
      ctx,
      api,
      forecastVersion + '   ·   ' + alertPolicyVersion + '   ·   planned launch',
      960,
      835,
      26,
      C.muted,
    );
    const call = replay
      ? 'route_alert(alert, urgent_impact=True)'
      : 'route_alert(alert, urgent_impact=False)';
    api.text(ctx, call, 960, 900, 36, replay ? C.pink : C.blue, 'center', 'mono');
    const route = replay
      ? clock.after('page')
        ? 'page actionable capacity impact'
        : 'Which action?'
      : clock.after('review')
        ? 'review planned model launch capacity'
        : 'Which action?';
    text(ctx, api, route, 960, 974, 40, C.ink);
  });
});

export const drawAlertReceipt = scene.draw;
export default scene;
