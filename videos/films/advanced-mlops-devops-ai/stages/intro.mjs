import { cueClock } from '../cue-clock.mjs';
import { featureImpact } from '../features.mjs';
import { base } from '../fixtures.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = cueClock(scene, state);
  const feature = featureImpact(1);
  const text = (value, x, y, size, color = C.ink, align = 'left', font = 'sans') =>
    api.text(ctx, value, x, y, size, color, align, font);

  if (!state.beat) {
    const calendarPage = (x, heading, day, color) => {
      const page = api.rect(ctx, x, 305, 555, 390, C.panel, color, 24);
      for (const offset of [80, 475]) api.line(ctx, x + offset, 284, x + offset, 328, color, 12);
      api.container(ctx, page, () => {
        text(heading, x + 44, 411, 43, color);
        api.line(ctx, x + 40, 444, x + 515, 444, color, 3);
        text(day, x + 42, 568, 94, C.ink, 'left', 'serif');
        text('12:00 noon', x + 46, 649, 43);
      });
    };
    calendarPage(172, 'Predicted finish', 'Tuesday', C.blue);
    calendarPage(1193, 'Actual finish', 'Wednesday', C.pink);
    focus.target('finish-gap', () => {
      const start = 758,
        end = 1162,
        y = 510;
      const progress = p('finish-gap');
      api.line(ctx, start, y, end, y, C.muted, 3);
      if (progress > 0) api.arrow(ctx, start, y, start + (end - start) * progress, y, C.pink, 7);
      if (progress === 1) text('1 day', 960, y - 34, 59, C.pink, 'center');
    });
    focus.target('request-trace', () => {
      text('DeployBuddy   /   us-west', 172, 825, 39, C.blue);
      if (p('open-trace') > 0) {
        text('Request  req_8a2', 172, 912, 46, C.ink, 'left', 'mono');
      }
    });
    focus.target('fixed-model', () => {
      if (p('match-model') > 0) {
        text('Same as evaluation', 880, 825, 39, C.green);
        text(
          [base.prompt, base.base, base.adapter].join('   /   '),
          880,
          912,
          38,
          C.ink,
          'left',
          'mono',
        );
      }
    });
    return;
  }

  focus.target('raw-feature', () => {
    text('Shared feature', 155, 305, 36, C.muted);
    text('[' + feature.raw.join(', ') + ']', 460, 311, 55, C.blue);
  });
  focus.target('score-rule', () => {
    text('Test scorer', 970, 305, 36, C.muted);
    if (p('scoring-rule') > 0) text('(first + second) ÷ 2', 1225, 307, 40);
  });
  api.line(ctx, 150, 365, 1760, 365, C.muted, 2);

  const x = 1040;
  const width = 610;
  const maxScore = 4;
  function lane(id, name, y, transform, values, score, progress, color) {
    focus.target(id, () => {
      text(name, 155, y - 40, 40, color);
      text(transform, 155, y + 23, 30, C.muted);
      if (values) text(values, 580, y + 5, 46);
      api.line(ctx, x, y, x + width, y, C.muted, 3);
      for (let tick = 0; tick <= maxScore; tick++) {
        const at = x + (width * tick) / maxScore;
        api.line(ctx, at, y + 4, at, y + 13, C.muted, 2);
        text(String(tick), at, y + 54, 28, C.muted, 'center');
      }
      if (progress > 0) {
        const at = x + (width * score) / maxScore;
        api.line(ctx, x, y, x + (at - x) * progress, y, color, 10);
        if (progress === 1) {
          api.circle(ctx, at, y, 11, color);
          text(score.toFixed(2), at, y - 30, 47, color, 'center');
        }
      } else {
        text('?', x + width / 2, y - 27, 42, C.yellow, 'center');
      }
    });
  }
  const unit = p('unit-input') === 1;
  lane(
    'batch-lane',
    'Offline batch',
    550,
    p('batch-transform') > 0 ? 'Divide by length 5' : '',
    unit
      ? '[' + feature.normalized.join(', ') + ']'
      : p('batch-transform') > 0
        ? '[3 ÷ 5, 4 ÷ 5]'
        : '',
    feature.offlineScore,
    p('batch-score'),
    C.green,
  );
  lane(
    'serving-lane',
    'Online serving',
    800,
    p('serving-transform') > 0 ? 'Keep raw values' : '',
    p('serving-transform') > 0 ? '[' + feature.online.join(', ') + ']' : '',
    feature.onlineScore,
    p('raw-score'),
    C.pink,
  );
  text(
    p('model-replay') > 0
      ? 'Replay the request with each transform and compare finish times'
      : p('predict-scores') > 0 && p('batch-score') === 0
        ? 'What score will each path produce?'
        : 'Fixed scorer output',
    960,
    990,
    35,
    C.ink,
    'center',
  );
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'finish-gap',
    'open-trace',
    'match-model',
    'load-vector',
    'batch-transform',
    'serving-transform',
    'scoring-rule',
    'predict-scores',
    'unit-input',
    'batch-score',
    'raw-score',
    'model-replay',
  ],
};
