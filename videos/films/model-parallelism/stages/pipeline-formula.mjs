import { pipelineOccupancy } from '../arithmetic.mjs';
import { sceneClock } from '../scene-clock.mjs';

export function drawPipelineFormula(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const items = clock.done('twelve-batches') ? 12 : clock.done('one-batch') ? 1 : 4;
  const schedule = pipelineOccupancy(3, items);
  const colors = [api.C.blue, api.C.cyan, api.C.pink, api.C.yellow];
  const x = 370,
    y = 355,
    width = Math.min(230, 1370 / schedule.ticks),
    height = 111;
  const counted = clock.done('count-work');
  const filled =
    state.beat === 0
      ? Math.ceil(clock.progress('follow-last') * (schedule.stages - 1))
      : schedule.stages;
  api.focus.target('stage-slots', () => {
    api.text(
      ctx,
      `${items} independent microbatch${items === 1 ? '' : 'es'}   ·   3 equal-time stages`,
      155,
      255,
      40,
      api.C.ink,
    );
    for (let t = 0; t < schedule.ticks; t++) {
      api.text(ctx, String(t + 1), x + (t + 0.5) * width, y - 25, 36, api.C.muted, 'center');
    }
    schedule.layout.forEach((row, stage) => {
      api.text(ctx, 'Stage ' + (stage + 1), 150, y + stage * height + 59, 37, api.C.ink);
      row.forEach((batch, t) => {
        const visible = batch !== null && (batch !== items || stage <= filled);
        const color = visible ? colors[(batch - 1) % colors.length] : api.C.muted;
        const left = x + t * width,
          top = y + height * stage;
        api.rect(ctx, left, top, width - 9, 86, visible ? color : api.C.panel, color, 5);
        if (visible)
          api.text(ctx, String(batch), left + (width - 9) / 2, top + 57, 40, api.C.bg, 'center');
      });
    });
    let line = 'Follow microbatch 4 through the last two stages';
    if (counted)
      line = `${schedule.occupied} occupied  /  ${schedule.total} stage slots   =   ${(schedule.utilization * 100).toFixed(1)}% busy`;
    if (counted && state.beat === 0)
      line = `${schedule.occupied} occupied  /  ${schedule.total} stage slots   ·   What fraction sat idle?`;
    if (items !== 4 && !clock.done(items === 1 ? 'one-rate' : 'twelve-rate'))
      line = 'How many of the available stage slots carry work?';
    api.text(ctx, line, 960, 795, 49, api.C.ink, 'center');
    if (state.beat === 1 && clock.done('idle-ratio')) {
      api.text(ctx, 'Idle fraction   6 / 18 = ⅓', 225, 915, 39, api.C.yellow);
      if (clock.done('drain-ratio'))
        api.text(ctx, 'Extra elapsed time   2 / 4 = ½ of the ideal time', 882, 915, 39, api.C.cyan);
      if (clock.done('general-rule')) {
        api.text(ctx, '(p − 1) / (m + p − 1)', 225, 987, 34, api.C.yellow);
        api.text(ctx, '(p − 1) / m', 882, 987, 34, api.C.cyan);
      }
    } else if (clock.done('general-rule')) {
      api.text(
        ctx,
        'm batches, p stages     ·     m + p − 1 ticks     ·     m / (m + p − 1) busy',
        960,
        929,
        40,
        api.C.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'pipeline-formula',
  draw: drawPipelineFormula,
  cues: [
    'follow-last',
    'count-work',
    'idle-ratio',
    'drain-ratio',
    'general-rule',
    'one-batch',
    'one-rate',
    'twelve-batches',
    'twelve-rate',
  ],
};
