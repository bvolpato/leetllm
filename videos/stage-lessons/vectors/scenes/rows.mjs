import { matrixProduct, place } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { frame, productOwners, H, P } from '../parts.mjs';
export default function (s, c) {
  const f = frame(c);
  const product = place(
    matrixProduct(H[0], P, {
      size: 36,
      cell: 100,
      width: f.body.width - 320,
      names: ['reset / my / password', 'shared P', 'same word owners'],
      colors: ['cyan', 'cyan'],
    }),
    f.body,
  );
  const owners = productOwners(product);
  const foot = place(
    mono('H @ P → Y: each word keeps its row', { size: 34, color: 'cyan' }),
    f.foot,
  );
  s.add(f.title, product, owners, foot);
  c.on('stack-word-rows', () => s.play(product.a.light({ row: 0 }, { duration: 0.7 })));
  for (const [i, id] of ['row-reset', 'row-my', 'row-password'].entries())
    c.on(id, () => {
      for (let j = 0; j < P[0].length; j++) {
        s.play(product.pair(i, j, { duration: 0.12 }));
        product.line.set('opacity', 0);
        s.play(product.addTerm(2, { duration: 0.12 }));
        s.play(product.store({ duration: 0.12 }));
      }
    });
  c.on('preserve-word-axis', () => s.play(product.complete({ duration: 1 })));
}
