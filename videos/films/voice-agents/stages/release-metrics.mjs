import { drawText } from '../defaults.mjs';
import { sceneCues } from '../reply-strip.mjs';

const attempted = 100;
const onTime = 86;
const late = 4;
const answered = onTime + late;
const target = 95;
const percent = (n, d) => Math.round((1000 * n) / d) / 10;

export function drawReleaseMetrics(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  const comparing = cue.at('load-success');
  const widening = cue.p('load-all');
  api.focus.target('release-cohort', () => {
    if (state.beat === 0) {
      drawText(ctx, api, 'Incident drill', 145, 320, 40, C.blue);
      drawText(ctx, api, '10,000 simultaneous calls', 145, 441, 72);
      if (cue.at('load-cohort')) {
        drawText(ctx, api, 'Call mix', 145, 624, 35, C.cyan);
        drawText(ctx, api, 'Speech, pauses, tools and arrival bursts', 145, 699, 43);
        drawText(ctx, api, 'Playback path', 145, 843, 35, C.green);
        drawText(ctx, api, 'Device, codec and network conditions', 145, 918, 43);
      }
      return;
    }
    drawText(ctx, api, 'One network  /  ' + attempted + ' attempts', 145, 256, 35, C.blue);
    const x = (i) => 180 + (i % 10) * 75;
    const y = (i) => 334 + Math.floor(i / 10) * 60;
    for (let i = 0; i < attempted; i++) {
      let fill = C.panel;
      let border = C.muted;
      if (i < onTime && cue.at('load-fast')) fill = border = C.green;
      if (i >= onTime && i < answered && cue.at('load-late')) fill = border = C.yellow;
      if (i >= answered && cue.at('load-silent')) border = C.pink;
      api.rect(ctx, x(i), y(i), 40, 32, fill, border, 5);
    }
    if (comparing) {
      const bottom = y(answered - 1) + 49 + (y(attempted - 1) - y(answered - 1)) * widening;
      api.line(ctx, 150, 316, 150, bottom, C.cyan, 5);
      api.line(ctx, 150, 316, 172, 316, C.cyan, 5);
      api.line(ctx, 150, bottom, 172, bottom, C.cyan, 5);
    }
    if (cue.at('load-fast')) drawText(ctx, api, onTime + ' within 500 ms', 1010, 370, 42, C.green);
    if (cue.at('load-late')) drawText(ctx, api, late + ' played late', 1010, 458, 42, C.yellow);
    if (cue.at('load-silent'))
      drawText(ctx, api, attempted - answered + ' silent timeouts', 1010, 546, 42, C.pink);
  });
  api.focus.target('release-count', () => {
    if (!cue.at('load-ask')) return;
    const d = widening >= 1 ? attempted : answered;
    drawText(ctx, api, 'Target: ' + target + '% of attempts within 500 ms', 1010, 667, 34, C.ink);
    if (!comparing) {
      drawText(ctx, api, 'Did this network meet the target?', 1010, 785, 41, C.ink);
      return;
    }
    drawText(
      ctx,
      api,
      d === attempted ? 'All attempted calls' : 'Calls with audio',
      1010,
      755,
      34,
      C.cyan,
    );
    drawText(ctx, api, onTime + ' / ' + d + '  =  ' + percent(onTime, d) + '%', 1010, 844, 54);
    if (cue.at('load-hold') && percent(onTime, attempted) < target)
      drawText(ctx, api, 'Hold the release on this network.', 1010, 936, 38, C.pink);
  });
}

export default {
  id: 'release-metrics',
  draw: drawReleaseMetrics,
  cues: [
    'load-cohort',
    'load-fast',
    'load-late',
    'load-silent',
    'load-ask',
    'load-success',
    'load-all',
    'load-hold',
    'load-quality',
  ],
};
