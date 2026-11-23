import { dynamic, line, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { GROUPS } from '../parts.mjs';

export default function subgroupMix(s, c) {
  const [top, plot, footer] = area.inset('wide').rows([1, 3.8, 1.2], 'normal');
  const fraction = s.value(GROUPS.initialLong);
  const details = s.value(0);
  const totalOn = s.value(0);
  const moving = s.value(0);
  const drawing = dynamic(() => {
    const groups = [
      { name: 'Short', share: 1 - fraction.value, rate: GROUPS.shortRate, color: 'blue' },
      { name: 'Long', share: fraction.value, rate: GROUPS.longRate, color: 'pink' },
    ];
    let left = plot.left;
    let total = 0;
    const marks = [];
    for (const { name, share, rate, color } of groups) {
      const width = share * plot.width;
      const cx = left + width / 2;
      const count = Math.round(GROUPS.total * share);
      const hit = Math.round(count * rate);
      total += hit;
      marks.push(
        rect(width - 4, plot.height, { fill: 'surface', stroke: 'dim', width: 2 }).moveTo([
          cx,
          plot.cy,
        ]),
        rect(width - 4, plot.height * rate, { fill: color, stroke: null }).moveTo([
          cx,
          plot.bottom - (plot.height * rate) / 2,
        ]),
        label(name + ' · ' + Math.round(rate * 100) + '% covered', { size: 37, color }).moveTo([
          cx,
          top.cy,
        ]),
      );
      if (!moving.value)
        marks.push(
          mono(details.value ? hit + ' / ' + count : count + ' requests', {
            size: 39,
            color: 'bg',
          }).moveTo([cx, plot.bottom - (plot.height * rate) / 2]),
        );
      left += width;
    }
    marks.push(
      line([plot.left, plot.bottom], [plot.right, plot.bottom], { stroke: 'ink', width: 2 }),
    );
    const question =
      fraction.value === GROUPS.initialLong
        ? 'Overall target 80%'
        : 'Same group rates · still above 80%?';
    marks.push(
      place(
        totalOn.value
          ? mono(
              total +
                ' / ' +
                GROUPS.total +
                ' = ' +
                Number(((100 * total) / GROUPS.total).toFixed(1)) +
                '%',
              { size: 50, color: total / GROUPS.total >= 0.8 ? 'green' : 'red' },
            )
          : label(question, { size: 43 }),
        footer,
      ),
    );
    return marks;
  });
  s.add(heading(c.title), drawing);
  c.after('counts', () => details.set(1));
  c.after('aggregate', () => totalOn.set(1));
  c.on('mixture', () => {
    totalOn.set(0);
    moving.set(1);
    s.play(fraction.to(0.5, { duration: 1.8 }));
    moving.set(0);
  });
  c.after('seventy-five', () => totalOn.set(1));
}
