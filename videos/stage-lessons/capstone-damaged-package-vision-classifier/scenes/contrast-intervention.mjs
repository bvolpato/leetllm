import { area, heading } from '../../kit-narrated.mjs';
import { visionStencil } from '../../../films/capstone-damaged-package-vision-classifier/arithmetic.mjs';
import { edgeGrid, responseRows } from '../edge-grid.mjs';
import { caption } from '../inspection.mjs';

export default function scene(s, c) {
  const original = visionStencil(),
    half = visionStencil(0.5);
  const [names, images, equation, result] = area.rows([1, 6, 1.2, 1], 'normal');
  const [left, right] = images.columns(2, 'loose');
  const [src, dst] = names.columns(2, 'loose');
  const input = edgeGrid(left, original.pixels, 'pixels', 88);
  const changed = edgeGrid(left, half.pixels, 'pixels', 88);
  const before = edgeGrid(right, responseRows(original.responses), 'responses', 112);
  const after = edgeGrid(right, responseRows(half.responses), 'responses', 112);
  const initial = caption(equation, 'Original population variance  =  2/3');
  const prompt = caption(result, 'What happens to the variance?', 'yellow');
  const answer = caption(
    equation,
    '6 × (0.5)² / 9  =  1/6  ≈  ' + half.variance.toFixed(4),
    'yellow',
  );
  const originalTitle = caption(dst, 'Original signed responses');
  s.add(
    heading(c.title),
    caption(src, 'Input intensities'),
    originalTitle,
    input.frames,
    input.entries,
    before.frames,
    before.entries,
    initial,
  );
  c.swap('halve', [input.frames, input.entries], [changed.frames, changed.entries]);
  c.swap('response', before.entries, after.entries, { after: true });
  c.swap('response', originalTitle, caption(dst, 'Signed responses at half contrast'), {
    after: true,
  });
  c.show('ask', prompt);
  c.hide('variance', prompt);
  c.swap('variance', initial, answer, { after: true });
  const law = caption(result, 'Intensity × c      Response × c      Variance × c²', 'cyan');
  c.show('law', law, { after: true });
  c.swap(
    'boundary',
    law,
    caption(result, 'Routing uses a separate blur score. Larger means blurrier.', 'ink', 38),
  );
}
