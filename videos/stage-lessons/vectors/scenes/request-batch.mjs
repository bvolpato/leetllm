import { matrixProduct, place } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import { frame, productOwners, REQUEST_X, REQUEST_W } from '../parts.mjs';
export default function (s, c) {
  const f = frame(c),
    product = place(
      matrixProduct(
        REQUEST_X,
        REQUEST_W.map((r) => [r[0]]),
        {
          colors: ['cyan', 'cyan'],
          size: 40,
          cell: 130,
          width: f.body.width - 320,
          names: ['A / B / C', 'fixed rule', 'seconds'],
        },
      ),
      f.body,
    );
  const owners = productOwners(product, 'requests-batch');
  const vector = place(mono('X @ w: (3, 2) @ (2,) → (3,)', { size: 36, color: 'cyan' }), f.foot);
  const column = place(
    mono('X @ w[:, None]: (3, 2) @ (2, 1) → (3, 1)', { size: 34, color: 'yellow' }),
    f.foot,
  );
  for (const caption of product.captions) caption.set('visible', false);
  const caps = f.body.rows([1, 5], 'normal')[0].columns(3, 'loose');
  const xName = place(label('A / B / C: X (3, 2)', { size: 34 }), caps[0]);
  const vectorNames = [
    place(label('w (2,)', { size: 34 }), caps[1]),
    place(label('seconds (3,)', { size: 34 }), caps[2]),
  ];
  const matrixNames = [
    place(label('w[:, None] (2, 1)', { size: 34 }), caps[1]),
    place(label('seconds (3, 1)', { size: 34 }), caps[2]),
  ];
  s.add(f.title, product, owners, xName, vectorNames[0]);
  c.show('request-shape', [vector, vectorNames[1]], { after: true });
  for (const [i, id] of ['request-a', 'request-b', 'request-c'].entries())
    c.after(id, () => {
      s.play(product.pair(i, 0, { duration: 0.2 }));
      product.line.set('opacity', 0);
      s.play(product.addTerm(2, { duration: 0.2 }));
      s.play(product.store({ duration: 0.2 }));
    });
  c.swap('request-column', [vector, vectorNames], [column, matrixNames], { after: true });
}
