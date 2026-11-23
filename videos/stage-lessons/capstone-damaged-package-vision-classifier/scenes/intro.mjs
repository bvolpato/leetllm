import { dynamic, group, line, shift } from 'vizmatic/stage';
import { area, heading } from '../../kit-narrated.mjs';
import { caption, photograph, recordedView, seamFinder } from '../inspection.mjs';

export default function scene(s, c) {
  const views = ['R-406-a', 'R-404-a'].map(recordedView);
  const [gallery, ruleArea] = area.rows([9, 1], 'normal');
  const progress = s.value(0.04);
  const minimum = views[0].trace.min_brightness;
  const cards = gallery.columns(2, 'loose').map((slot, i) => {
    const { output } = views[i];
    const [score, image, reading, meter, action] = slot.rows([1, 5, 0.9, 0.5, 0.9], 'tight');
    const track = meter.inset('wide', 0);
    const x = (v) => track.left + v * track.width;
    const bar = dynamic(() =>
      line([x(0), track.cy], [x(progress.value * output.brightness), track.cy], {
        stroke: 'cyan',
        width: 16,
      }),
    );
    return {
      picture: group(
        caption(score, 'Damage score   ' + output.damage_probability.toFixed(2), 'ink', 54),
        photograph(image, i ? 'mailer' : 'dark'),
        caption(reading, 'Brightness   ' + output.brightness.toFixed(2), 'cyan', 42),
        line([x(0), track.cy], [x(1), track.cy], { stroke: 'grid', width: 16 }),
        bar,
      ),
      tick: line([x(minimum), track.cy - 24], [x(minimum), track.cy + 24], {
        stroke: 'yellow',
        width: 5,
      }),
      finder: i ? seamFinder(image) : null,
      outcome: caption(
        action,
        i ? 'Inspect this seam' : 'Retake in better light',
        i ? 'yellow' : 'cyan',
      ),
    };
  });
  const arrival = 96;
  cards[1].picture.shift(0, arrival);
  const opening = [heading(c.title), ...cards.map((card) => card.picture)];
  s.add(opening);
  for (const node of opening) node.opacity(1);
  s.play(
    shift(cards[1].picture, 0, -arrival, { duration: 0.85 }),
    progress.to(1, { duration: 1.45 }),
  );
  const threshold = 'Damage score ≥ ' + views[1].trace.damage_threshold.toFixed(2);
  const scoreRule = caption(ruleArea, threshold, 'ink', 40);
  const bothRules = caption(
    ruleArea,
    'Brightness ≥ ' + minimum.toFixed(2) + '     •     ' + threshold,
    'yellow',
    40,
  );
  c.show('threshold', scoreRule);
  c.swap('light', scoreRule, [bothRules, ...cards.map((card) => card.tick)]);
  c.show('inspect', [cards[1].finder, cards[1].outcome], { after: true });
  c.show('retake', cards[0].outcome, { after: true });
}
