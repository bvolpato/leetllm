import { dot, line, text } from '../defaults.mjs';
import { fixedCapacityReplay } from '../model.mjs';
import { monitoringScene } from '../storyboard.mjs';

export default monitoringScene(
  'parity-probe',
  ['paths', 'rates', 'match', 'larger', 'ask', 'repair'],
  (ctx, api, cue) => {
    const { C } = api;
    const capacity = cue.started('larger') ? 200 : cue.started('match') ? 100 : 50;
    const replay = fixedCapacityReplay(capacity);
    const repaired = cue.started('repair');
    const numerator = replay.numerator;
    text(
      ctx,
      api,
      `Same raw row   /   backlog ${numerator} jobs   /   staffed capacity ${capacity}`,
      960,
      270,
      39,
      C.ink,
    );
    const onlineCapacity = repaired ? capacity : replay.servingCapacity;
    const paths = [
      ['Training', 'backlog / staffed capacity', capacity, C.blue],
      [
        'Serving',
        repaired ? 'backlog / staffed capacity' : 'backlog / 100',
        onlineCapacity,
        C.pink,
      ],
    ];
    paths.forEach(([name, rule, divisor, color], i) => {
      const y = 505 + 210 * i;
      text(ctx, api, name, 155, y - 57, 37, color, 'left');
      if (!cue.started('paths')) return;
      text(ctx, api, rule, 155, y, 30, C.ink, 'left');
      const left = 705;
      const width = 935;
      line(ctx, api, left, y, left + width, y, C.muted, 2);
      [0, 0.25, 0.5].forEach((tick) => {
        const x = left + (width * tick) / 0.5;
        line(ctx, api, x, y + 10, x, y + 22, C.muted, 2);
        text(ctx, api, tick.toFixed(2), x, y + 61, 27, C.muted);
      });
      if (!cue.started('rates')) return;
      const value = numerator / divisor;
      const x = left + (width * value) / 0.5;
      line(ctx, api, left, y, left + (x - left) * cue.progress('rates'), y, color, 8);
      dot(ctx, api, left + (x - left) * cue.progress('rates'), y, color, 13);
      if (cue.done('rates'))
        text(ctx, api, `${numerator} / ${divisor} = ${value.toFixed(2)}`, x, y - 43, 34, color);
    });
    if (repaired)
      text(
        ctx,
        api,
        'Same transform in both paths   /   repeat at capacities 50, 100 and 200',
        960,
        922,
        34,
        C.ink,
      );
    else if (cue.started('ask'))
      text(
        ctx,
        api,
        'Which divisor must serving read from the source row?',
        960,
        922,
        41,
        C.yellow,
      );
    else if (cue.started('match') && !cue.started('larger'))
      text(
        ctx,
        api,
        'Capacity 100: the two transforms happen to agree on this row.',
        960,
        922,
        35,
        C.yellow,
      );
  },
);
