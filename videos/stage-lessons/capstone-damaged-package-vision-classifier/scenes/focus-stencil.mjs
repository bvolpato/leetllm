import { to } from 'vizmatic/stage';
import { area, heading } from '../../kit-narrated.mjs';
import { visionStencil } from '../../../films/capstone-damaged-package-vision-classifier/arithmetic.mjs';
import { edgeGrid, responseRows } from '../edge-grid.mjs';
import { caption } from '../inspection.mjs';

export default function scene(s, c) {
  const m = visionStencil();
  const [names, images, equation, result] = area.rows([1, 6, 1.2, 1], 'normal');
  const [left, right] = images.columns(2, 'loose');
  const [src, dst] = names.columns(2, 'loose');
  const pixels = edgeGrid(left, m.pixels, 'pixels', 88);
  const responses = edgeGrid(right, responseRows(m.responses), 'responses', 112);
  const stencil = pixels.footprint(1, 1);
  const operation = caption(equation, 'North + south + east + west − 4 × center', 'yellow');
  function sumAt(col, solved = false) {
    const [n, south, e, w, center] = [
      m.pixels[0][col],
      m.pixels[2][col],
      m.pixels[1][col + 1],
      m.pixels[1][col - 1],
      m.pixels[1][col],
    ];
    const response = m.responses[col - 1];
    const value = response > 0 ? '+' + response : String(response).replace('-', '−');
    return caption(
      equation,
      [n, south, e, w].join(' + ') + ' − 4 × ' + center + ' = ' + (solved ? value : '?'),
      'yellow',
      46,
    );
  }
  const first = sumAt(1),
    second = sumAt(2);
  const firstSum = sumAt(1, true),
    secondSum = sumAt(2, true);
  const variance = m.squared.reduce((sum, n) => sum + n, 0) + ' / ' + m.responses.length + ' = 2/3';
  s.add(
    heading(c.title),
    caption(src, 'Input intensities', 'ink'),
    caption(dst, 'Signed responses', 'ink'),
    pixels.frames,
    pixels.entries,
    responses.frames,
    operation,
  );
  c.show('neighbors', stencil);
  c.swap('first', operation, first);
  c.show('positive', responses.entries[0], { after: true });
  c.swap('positive', first, firstSum, { after: true });
  c.on('across', () =>
    s.play(to(stencil, (node) => node.moveTo(pixels.center(1, 2)), { duration: 0.6 })),
  );
  c.swap('across', firstSum, second);
  c.show('negative', responses.entries[1], { after: true });
  c.swap('negative', second, secondSum, { after: true });
  c.hide('interior', [secondSum, stencil]);
  c.show('interior', responses.entries.slice(2), { stagger: true });
  c.show('mean', caption(equation, 'Three +1, three −1, three 0     •     Mean = 0', 'ink'), {
    after: true,
  });
  c.show('variance', caption(result, 'Population variance  =  ' + variance, 'yellow'), {
    after: true,
  });
}
