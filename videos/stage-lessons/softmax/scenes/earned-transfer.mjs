import { dynamic, line, place, rect, text } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';

export default function earnedTransfer(s, c) {
  const [premise, table, conclusion] = area.rows([1, 3.8, 1.35], 'wide');
  const [header, first, second] = table.rows([0.5, 1, 1], 'normal');
  const widths = [0.74, 1.55, 1.55, 0.9, 1.05, 1, 1.1];
  const slots = (region) => region.columns(widths, 'normal');
  const headers = ['Report', 'Target 1', 'Target 2', 'Target 3', 'Loss sum', 'Divisor', 'Mean'].map(
    (name, i) => place(label(name, { size: 36 }), slots(header)[i]),
  );
  const title = heading(c.title);
  const premiseText = place(label('Integer targets   ·   no class weights'), premise, 'left');
  const baseline = [0.25, 0.5];
  const measured = ([p, q]) => -Math.log(p) - Math.log(q);
  const baselineMean = measured(baseline) / 2;
  const changedMean = measured([0.5, 0.5]) / 2;
  if (Math.abs(measured(baseline) / 3 - changedMean) > 1e-12)
    throw new Error('The two reports must display the same mean before the repair');

  const cases = [first, second].map((band, index) => {
    const col = slots(band);
    const share = baseline.map((value) => s.value(value));
    const counted = s.value(2);
    const local = () => share.map((p) => p.value);
    const meters = [0, 1].map((i) =>
      dynamic(() => {
        const p = share[i].value;
        const slot = col[i + 1];
        const width = slot.width - 12;
        const length = width * p;
        const color = ['green', 'pink'][i];
        const railY = slot.cy - 6;
        return [
          rect(width, 32, { stroke: 'dim', fill: null, width: 2 }).at(slot.cx, railY),
          rect(length, 30, { fill: color, stroke: null }).at(slot.cx - (width - length) / 2, railY),
          text((p * 100).toFixed(0) + '%', { size: 40, font: 'mono', color }).at(
            slot.cx,
            railY - 53,
          ),
        ];
      }),
    );
    const losses = [0, 1].map((i) =>
      dynamic(() =>
        text('−ln p ≈ ' + (-Math.log(share[i].value)).toFixed(3), {
          size: 27,
          font: 'mono',
          color: 'dim',
        }).at(col[i + 1].cx, col[i + 1].cy + 44),
      ),
    );
    const name = place(mono(['A', 'B'][index], { size: 64 }), col[0]);
    const ignored = place(note('ignored', { size: 34 }), col[3]);
    const sum = dynamic(() =>
      text(measured(local()).toFixed(3), { size: 40, font: 'mono' }).at(col[4].cx, col[4].cy),
    );
    const divisor = dynamic(() => {
      const n = counted.value;
      const x = col[5].cx;
      const y = col[5].cy;
      const tokens = ['green', 'pink', 'dim'].slice(0, n);
      return [
        text(String(n), { size: 48, font: 'mono' }).at(x, y - 16),
        ...tokens.map((color, i) =>
          rect(27, 18, { fill: color, stroke: null }).at(
            x + (i - (tokens.length - 1) / 2) * 33,
            y + 36,
          ),
        ),
      ];
    });
    const mean = dynamic(() =>
      text((measured(local()) / counted.value).toFixed(3), {
        size: 49,
        font: 'mono',
        color: 'yellow',
      }).at(col[6].cx, col[6].cy),
    );
    return { share, counted, name, meters, ignored, losses, sum, divisor, mean };
  });
  const [a, b] = cases;
  const caption = (words, color = 'ink') =>
    place(label(words, { size: 46, color }), conclusion, 'top left');
  const question = caption('Which report shows a better prediction?');
  const audit = caption('A counted the ignored target.');
  const finding = caption('B gave the first observed word more probability.', 'green');
  const next = place(
    note('Next lesson  ·  How a recurrent network uses the preceding words'),
    conclusion,
    'bottom left',
  );
  const previous = place(
    mono('Start   ' + baselineMean.toFixed(3) + ' nats per supervised target', { size: 36 }),
    conclusion,
    'bottom left',
  );

  s.add(
    title,
    premiseText,
    headers,
    a.name,
    b.name,
    line([area.left, first.bottom + 12], [area.right, first.bottom + 12], {
      stroke: 'grid',
      width: 2,
    }),
  );
  c.show(
    'fresh-targets',
    cases.flatMap((r) => r.meters),
  );
  c.show(
    'fresh-ignored',
    cases.map((r) => r.ignored),
  );
  c.show(
    'fresh-two-losses',
    cases.flatMap((r) => r.losses),
    { after: true },
  );
  c.show(
    'fresh-loss-sum',
    cases.map((r) => r.sum),
    { after: true },
  );
  c.show('fresh-start', cases.flatMap((r) => [r.divisor, r.mean]).concat(previous), {
    after: true,
  });

  c.after('earned-dashboard', () => a.counted.set(3));
  c.on('fresh-b-update', () => s.play(b.share[0].to(0.5, { duration: 1.6 })));
  c.show('earned-predict', question);
  c.swap('fresh-b-answer', question, finding, { after: true });
  c.swap('fresh-counted', finding, audit, { after: true });
  c.after('fresh-mean-repair', () => a.counted.set(2));
  c.swap('fresh-earned', audit, finding, { after: true });
  c.swap('earned-next', previous, next);
}
