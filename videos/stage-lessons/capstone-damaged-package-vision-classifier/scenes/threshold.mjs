import { boxOf, dot, line, place } from 'vizmatic/stage';
import { area, heading, mono } from '../../kit-narrated.mjs';
import { ACTION } from '../parts.mjs';
import { caption, recordedView } from '../inspection.mjs';

export default function scene(s, c) {
  const views = ['R-404-a', 'R-407-a', 'R-408-a', 'R-405-a'].map(recordedView);
  const [legend, body, foot] = area.rows([1, 6, 1], 'wide');
  const [ids, bars, actions] = body.columns([2, 5, 2], 'wide');
  const lanes = bars.rows(views.length, 'normal');
  const x = (score) => bars.left + bars.width * score;
  const cut = views[0].trace.damage_threshold;
  const ticks = line([x(cut), bars.top], [x(cut), bars.bottom], { stroke: 'yellow', width: 5 });
  const markers = views.map(({ photo, trace }, i) => {
    const lane = lanes[i],
      y = lane.point('center')[1];
    const mark = dot(16, 'cyan').moveTo([x(trace.damage_probability), y]);
    const number = mono(trace.damage_probability.toFixed(2), { size: 34 });
    const clearance = boxOf(number).width / 2 + 12;
    const numberX = trace.damage_probability >= cut
      ? Math.max(x(trace.damage_probability), x(cut) + clearance)
      : Math.min(x(trace.damage_probability), x(cut) - clearance);
    s.add(
      place(mono(photo.photo_id, { size: 42 }), ids.rows(views.length, 'normal')[i]),
      line([x(0), y], [x(1), y], { stroke: 'grid', width: 3 }),
    );
    return {
      input: [mark, number.moveTo([numberX, y - 39])],
      route: caption(actions.rows(views.length, 'normal')[i], ACTION[trace.action], 'ink', 38),
    };
  });
  s.add(
    heading(c.title),
    ticks,
    caption(legend, 'Quality passed     •     Priority at or above  ' + cut.toFixed(2), 'yellow'),
  );
  c.show(
    'scores',
    markers.map((m) => m.input),
  );
  c.show(
    'priority',
    markers.slice(0, 2).map((m) => m.route),
    { after: true },
  );
  c.show(
    'normal',
    markers.slice(2).map((m) => m.route),
    { after: true },
  );
  c.show('outcome', caption(foot, 'Specialist outcome pending for each case', 'dim'), {
    after: true,
  });
}
