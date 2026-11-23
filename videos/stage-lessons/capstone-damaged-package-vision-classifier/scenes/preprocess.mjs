import { dynamic } from 'vizmatic/stage';
import { area, heading } from '../../kit-narrated.mjs';
import { caption } from '../inspection.mjs';
import { centerLeft, croppedFrame, fitAspect, fullFrame, viewfinder } from '../crop-view.mjs';

export default function scene(s, c) {
  const [headers, body, question, result] = area.rows([1, 6, 1, 1], 'normal');
  const [left, right] = body.columns([3, 2], 'loose');
  const [leftTitle, rightTitle] = headers.columns([3, 2], 'loose');
  const source = fitAspect(left, 2),
    output = fitAspect(right, 1);
  const position = s.value(0);
  const outline = dynamic(() => viewfinder(source, position.value));
  const crop = dynamic(() => croppedFrame(output, position.value));
  const ask = caption(question, 'When the window moves to the center, which detail falls outside?');
  s.add(
    heading(c.title),
    caption(leftTitle, 'Resized photo   ·   512 × 256'),
    caption(rightTitle, 'Model input   ·   224 × 224'),
    fullFrame(source),
    outline,
    crop,
  );
  c.show('ask', ask);
  c.on('center', () => s.play(position.to(centerLeft, { duration: 1.6 })));
  c.swap(
    'seam',
    ask,
    caption(question, 'The shipping label enters as the torn corner leaves.', 'yellow'),
    { after: true },
  );
  c.show('meaning', caption(result, 'The model gets only the pixels on the right.', 'dim', 38));
}
