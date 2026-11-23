import { place, rect } from 'vizmatic/stage';
import { area, heading } from '../../kit-narrated.mjs';
import { caption } from '../inspection.mjs';
import { centerLeft, croppedFrame, fitAspect, fullFrame } from '../crop-view.mjs';

export default function scene(s, c) {
  const [headers, body, transform, decision] = area.rows([1, 6, 1, 1], 'normal');
  const [left, right] = body.columns(2, 'loose');
  const [leftTitle, rightTitle] = headers.columns(2, 'loose');
  const crop = fitAspect(left, 1),
    padded = fitAspect(right, 1);
  const frame = place(
    rect(padded.width, padded.height, { fill: '#11151b', stroke: 'grid', width: 2 }),
    padded,
  );
  const resize = caption(transform, 'Short side 256   •   Center 224 × 224', 'yellow', 38);
  const normalize = caption(
    transform,
    'Channels in [0, 1]      →      (channel − mean) / standard deviation',
    'ink',
    38,
  );
  s.add(
    heading(c.title),
    caption(leftTitle, 'ResNet-18   ·   Center crop'),
    croppedFrame(crop, centerLeft),
  );
  c.show('crop', resize);
  c.swap('normalize', resize, normalize);
  c.show('letterbox', [
    caption(rightTitle, 'Alternative   ·   Fit and pad'),
    frame,
    fullFrame(fitAspect(padded, 2)),
  ]);
  c.show(
    'bundle',
    caption(
      decision,
      'Freeze the evaluated transform with the model and routing policy.',
      'yellow',
      38,
    ),
  );
}
