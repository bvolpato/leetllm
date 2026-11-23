import { dot, line, to } from 'vizmatic/stage';
import { area, heading } from '../../kit-narrated.mjs';
import { ACTION } from '../parts.mjs';
import { caption, recordedView } from '../inspection.mjs';
import { visionReplay } from '../../../films/capstone-damaged-package-vision-classifier/arithmetic.mjs';

export default function scene(s, c) {
  const { photo, output, trace } = recordedView('R-408-a');
  const altered = {
    ...trace,
    damage_threshold: 0.6,
    action: 'priority_damage_review',
    reason: 'damage_threshold',
  };
  const [banner, body, question, verdict] = area.rows([1, 5, 1, 1], 'normal');
  const names = ['Rebuilt from saved inputs', 'Trace under inspection'];
  const pairs = body.columns(2, 'loose').map((side, i) => {
    const [head, score, track, cutoff, route] = side.rows([1, 1, 1.6, 1, 1], 'normal');
    const rail = track.inset('wide', 0);
    const axis = (n) => rail.left + n * rail.width;
    const y = rail.cy;
    const cut = line(
      [axis(trace.damage_threshold), rail.top],
      [axis(trace.damage_threshold), rail.bottom],
      { stroke: 'yellow', width: 5 },
    );
    const tick = dot(19, 'blue').moveTo([axis(trace.damage_probability), y]);
    const rule = (t) => caption(cutoff, 'Threshold  ' + t.toFixed(2), 'yellow', 38);
    const action = (r) => caption(route, ACTION[r.action] + ' review', 'ink');
    const originalRule = rule(trace.damage_threshold),
      originalAction = action(trace);
    s.add(
      caption(head, names[i]),
      caption(score, 'Damage score  ' + trace.damage_probability.toFixed(2), 'blue', 38),
      line([axis(0), y], [axis(1), y], { stroke: 'grid', width: 4 }),
      cut,
      tick,
      originalRule,
      originalAction,
    );
    return {
      cut,
      target: [axis(altered.damage_threshold), y],
      originalRule,
      originalAction,
      editedRule: rule(altered.damage_threshold),
      editedAction: action(altered),
    };
  });
  const verdictFor = (record) =>
    caption(
      verdict,
      'route_replays(trace)    ' + (visionReplay(record, photo, output) ? 'True' : 'False'),
      record === trace ? 'green' : 'pink',
      45,
    );
  const pass = verdictFor(trace),
    fail = verdictFor(altered);
  const right = pairs[1];
  s.add(
    heading(c.title),
    caption(
      banner,
      trace.photo_id + '      •      ' + trace.bundle_id + '      •      Day ' + trace.routed_day,
      'dim',
      38,
    ),
  );
  c.show('original', pass, { after: true });
  c.hide('edit', pass);
  c.on('edit', () => s.play(to(right.cut, (n) => n.moveTo(right.target), { duration: 0.7 })));
  c.swap(
    'edit',
    [right.originalRule, right.originalAction],
    [right.editedRule, right.editedAction],
  );
  const ask = caption(question, 'Does the edited trace replay the original attempt?');
  c.show('ask', ask);
  c.hide('reject', ask);
  c.show('reject', fail, { after: true });
  c.show(
    'retention',
    caption(question, 'Give a later attempt its own ID, timestamp and bundle.', 'ink', 38),
  );
}
