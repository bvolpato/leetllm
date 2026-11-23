import { indicate, matrixProduct, place, row } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { frame, productOwners, fmt, REQUEST_X, REQUEST_W } from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    product = place(
      matrixProduct(REQUEST_X, REQUEST_W, {
        colors: ['cyan', 'cyan'],
        size: 40,
        cell: 130,
        width: f.body.width - 320,
        names: ['A / B / C', 'time / priority', 'same request owners'],
      }),
      f.body,
    );
  const owners = productOwners(product, 'requests');
  const terms = place(
    row(
      [
        mono(REQUEST_X[1][0] + ' × ' + REQUEST_W[0][1], { color: 'blue' }),
        mono('+'),
        mono(REQUEST_X[1][1] + ' × ' + REQUEST_W[1][1], { color: 'pink' }),
      ],
      { gap: 'normal' },
    ),
    f.foot,
  );
  const total = place(
    row(
      [
        mono('2 × 0.2', { color: 'blue' }),
        mono('+'),
        mono('1 × 1.5', { color: 'pink' }),
        mono('= ' + fmt(REQUEST_X[1].reduce((sum, v, i) => sum + v * REQUEST_W[i][1], 0)), {
          color: 'yellow',
        }),
      ],
      { gap: 'normal' },
    ),
    f.foot,
  );
  const foot = place(
    mono('X @ W → Y: requests stay; input features contract', {
      size: 34,
      color: 'cyan',
    }),
    f.foot,
  );
  s.add(f.title, product, owners, foot);
  c.after('request-b-time', () => {
    s.play(product.pair(1, 0, { duration: 0.2 }));
    product.line.set('opacity', 0);
    s.play(product.addTerm(2, { duration: 0.2 }));
    s.play(product.store({ duration: 0.2 }));
  });
  c.on('priority-first', () => {
    s.play(product.pair(1, 1, { duration: 0.4 }));
    product.line.set('opacity', 0);
  });
  c.swap('priority-first', foot, terms);
  c.on('priority-second', () =>
    s.play(indicate(product.b.cell(1, 1), { scale: 1, color: 'pink', duration: 0.5 })),
  );
  c.after('request-b-priority', () => {
    s.play(product.addTerm(2, { duration: 0.15 }));
    s.play(product.store({ duration: 0.25 }));
  });
  c.hide('request-b-priority', terms, { after: true, fade: 0.1 });
  c.show('request-b-priority', total, { after: true, lead: -0.3, fade: 0.1 });
  c.after('request-all-outputs', () => s.play(product.complete({ duration: 2 })));
}
