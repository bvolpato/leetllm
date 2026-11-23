import { assertEqual, dynamic, line, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';

export default function offload(s, c) {
  const gb = 12;
  const bandwidth = 6;
  const transfer = gb / bandwidth;
  const compute = 3;
  const parallelEnd = Math.max(transfer, compute);
  const serialEnd = transfer + compute;
  assertEqual(transfer, 2, 'seconds of transfer');
  assertEqual(parallelEnd, 3, 'independent work completes in three seconds');
  assertEqual(serialEnd, 5, 'dependent work completes in five seconds');

  const [recipe, scale, first, second, footer] = area
    .inset('normal')
    .rows([0.85, 0.6, 2, 2, 0.8], 'normal');
  const split = (region) => region.columns([1.4, 5, 0.85], 'wide');
  const axis = split(scale)[1];
  const x = (seconds) => axis.left + (axis.width * seconds) / serialEnd;
  const time = [s.value(0), s.value(0)];
  const shown = s.value(0);
  const nodes = [
    heading(c.title),
    place(
      label(`Move ${gb} GB at ${bandwidth} GB/s     ·     Run ${compute} s of GPU work`),
      recipe,
    ),
    ...Array.from({ length: serialEnd + 1 }, (_, i) =>
      mono(i + ' s', { size: 34, color: 'dim' }).moveTo([x(i), scale.cy]),
    ),
  ];

  [first, second].forEach((region, row) => {
    const [name, track, readout] = split(region);
    const [top, bottom] = track.rows(2, 'tight');
    const [moved, result] = readout.rows(2, 'tight');
    const end = row === 0 ? parallelEnd : serialEnd;
    const computeStart = row === 0 ? 0 : transfer;
    nodes.push(
      dynamic(() => {
        if (row === 1 && shown.value < 2) return [];
        const elapsed = time[row].value;
        const bars = [
          place(label(row ? 'Wait for data' : 'Work overlaps', { size: 40 }), name, 'left'),
        ];
        for (const [lane, start, duration, color, title] of [
          [top, 0, transfer, 'pink', 'Transfer'],
          [bottom, computeStart, compute, 'green', 'GPU work'],
        ]) {
          bars.push(line([x(0), lane.cy], [x(serialEnd), lane.cy], { stroke: 'grid', width: 3 }));
          const width = x(Math.min(duration, Math.max(0, elapsed - start))) - x(0);
          if (width > 1) {
            bars.push(
              rect(width, 63, { fill: color, stroke: color }).moveTo([
                x(start) + width / 2,
                lane.cy,
              ]),
            );
            if (width >= 190)
              bars.push(
                mono(title, { size: 33, color: 'surface' }).moveTo([x(start) + width / 2, lane.cy]),
              );
          }
        }
        bars.push(
          line([x(elapsed), top.cy - 38], [x(elapsed), bottom.cy + 38], {
            stroke: 'yellow',
            width: 4,
          }),
        );
        bars.push(
          place(
            mono(Math.min(gb, elapsed * bandwidth).toFixed(1) + ' GB', { size: 38, color: 'pink' }),
            moved,
          ),
          place(
            mono((elapsed >= end ? end : elapsed.toFixed(1)) + ' s', { size: 56, color: 'yellow' }),
            result,
          ),
        );
        return bars;
      }),
    );
  });

  nodes.push(
    dynamic(() =>
      place(
        label(
          [
            'How long does the transfer take?',
            gb + ' GB ÷ ' + bandwidth + ' GB/s = ' + transfer + ' s',
            'The GPU needs the incoming weights.',
            'Waiting for the weights adds ' + (serialEnd - parallelEnd) + ' s to the step.',
          ][shown.value],
          { size: 44 },
        ),
        footer,
      ),
    ),
  );
  s.add(nodes);
  c.on('transfer', () => s.play(time[0].to(transfer, { duration: transfer, ease: (t) => t })));
  c.after('service', () => shown.set(1));
  c.on('finish', () =>
    s.play(time[0].to(parallelEnd, { duration: parallelEnd - transfer, ease: (t) => t })),
  );
  c.on('dependency', () => {
    shown.set(2);
    s.play(time[1].to(serialEnd, { duration: serialEnd, ease: (t) => t }));
  });
  c.after('cost', () => shown.set(3));
}
