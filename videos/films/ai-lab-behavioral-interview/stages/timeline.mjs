import { clamp } from '../arithmetic.mjs';
import { PHASES, TIMELINE } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawTimeline(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('timeline', state);
  {
    const timeline = api.focus.target('timeline-timeline-lanes', () =>
      teaching.timeline({
        x: 145,
        y: 255,
        width: 1630,
        height: 460,
        domain: TIMELINE.domain,
        lanes: TIMELINE.lanes,
        intervals: TIMELINE.intervals,
        time: modelState.time,
        ticks: [0, 1, 2, 3, 4, 5, 6],
        formatTime: (value) => PHASES[value] ?? String(value),
        labelWidth: 210,
        laneGap: 16,
        fontSize: 24,
        color: themeColors.muted,
        trackColor: '#17253d',
        cursorColor: themeColors.yellow,
      }),
    );
    const stops = [
      {
        at: 0,
        x: 180,
        label: 'reproduce',
        owner: 'you',
      },
      {
        at: 2.7,
        x: 650,
        label: 'repair',
        owner: 'service owner',
      },
      {
        at: 3.6,
        x: 1120,
        label: 'offline gate',
        owner: 'you',
      },
      {
        at: 4.8,
        x: 1590,
        label: 'canary review',
        owner: 'release owner',
      },
    ];
    api.line(ctx, 180, 795, 1590, 795, themeColors.muted, 3);
    stops.forEach((stop) => {
      api.circle(
        ctx,
        stop.x,
        795,
        8,
        modelState.time >= stop.at ? themeColors.cyan : themeColors.muted,
      );
      text(
        ctx,
        api,
        stop.label,
        stop.x,
        755,
        25,
        modelState.time >= stop.at ? themeColors.cyan : themeColors.muted,
        'center',
      );
    });
    const index = stops.findLastIndex((stop) => modelState.time >= stop.at),
      next = Math.min(stops.length - 1, index + 1),
      from = stops[index],
      to = stops[next];
    const progress = next === index ? 1 : clamp((modelState.time - from.at) / (to.at - from.at)),
      x = from.x + (to.x - from.x) * progress;
    const verified = modelState.time >= 4.6;
    api.focus.target('timeline-acl-denied-snippet', () =>
      card(
        ctx,
        api,
        `${verified ? 'B18' : 'B17'} · acl-denied-snippet`,
        Math.max(100, Math.min(1280, x - 270)),
        835,
        540,
        verified ? themeColors.green : themeColors.pink,
        76,
        27,
      ),
    );
    text(
      ctx,
      api,
      `Owner: ${from.owner} · ${verified ? 'both exact cases return DENY' : 'B17 restricted output remains the recorded failure'} · approved traffic ${modelState.story.candidateTraffic.toFixed(1)}%`,
      960,
      970,
      26,
      verified ? themeColors.green : themeColors.pink,
      'center',
    );
  }
}
export default {
  id: 'timeline',
  draw: drawTimeline,
  cues: [
    'timeline-beat-1-focus-1',
    'timeline-beat-1-focus-2',
    'timeline-beat-2-focus-1',
    'timeline-repair',
    'timeline-cases-pass',
    'timeline-approved',
  ],
};
