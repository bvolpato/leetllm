import { operationProgress, resultAfter } from '../../lib/lesson-definition.mjs';
import { sampleNarrationCues } from '../../lib/narration-cues.mjs';
import { estimatedTimeline } from '../../lib/stage-lesson.mjs';

const storyboardClocks = new WeakMap();

export function sceneCues(scene, state) {
  let clock = state;
  if (!clock.cues) {
    let timing = storyboardClocks.get(scene);
    if (!timing) {
      timing = estimatedTimeline({ id: scene.id, scenes: [scene] }).scenes[0];
      storyboardClocks.set(scene, timing);
    }
    const beat = timing.beats[state.beat];
    const time = beat.start + (beat.until - beat.start) * state.beatP;
    clock = { cues: sampleNarrationCues(timing.visualCues, time) };
  }
  return {
    end: (id) => clock.cues[id].end,
    started: (id) => clock.cues[id].phase !== 'before',
    after: (id) => resultAfter(clock, id),
    progress: (id) => operationProgress(clock, id),
  };
}

export function requestHeader(ctx, api, request) {
  const { C } = api;
  api.text(ctx, request.id, 122, 248, 38, C.ink, 'left', 'mono');
  api.text(ctx, request.stale ? 'Marked stale' : 'Marked current', 445, 248, 36, C.cyan);
  api.text(ctx, 'Checkpoint ' + request.model, 1798, 248, 31, C.muted, 'right');
  api.line(ctx, 122, 278, 1798, 278, C.muted, 2);
}

// A vertical age mark crosses every interval that would accept this stale request.
export function policyRuler(ctx, api, age, lanes) {
  const { C } = api;
  const x = (days) => 445 + 13 * days;
  api.text(ctx, 'Key age in days', 122, 431, 32, C.muted);
  api.line(ctx, x(0), 423, x(100), 423, C.muted, 3);
  for (const day of [0, 15, 30, 45, 60, 75, 90, 100]) {
    api.line(ctx, x(day), 420, x(day), 436, C.muted, 2);
    api.text(ctx, String(day), x(day), 480, 28, C.ink, 'center');
  }
  lanes.forEach(({ label, start, color }, i) => {
    const y = 550 + 95 * i;
    api.text(ctx, label, 122, y + 12, 31, C.ink);
    api.line(ctx, x(0), y, x(100), y, C.panel, 17);
    api.line(ctx, x(start), y, x(100), y, color, 17);
    api.line(ctx, x(start), y - 19, x(start), y + 19, color, 5);
    api.circle(ctx, x(age), y, 8, C.cyan, C.bg, 2);
  });
  const px = x(age);
  api.line(ctx, px, 369, px, 416, C.cyan, 3);
  api.circle(ctx, px, 423, 11, C.cyan);
  api.text(ctx, age + ' days', px, 350, 48, C.cyan, 'center');
}

export function verdict(eligible) {
  return eligible ? 'Eligible' : 'Ineligible';
}
