import { assertEqual, dot, dynamic, line, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { COORD, MAIN, footer } from '../parts.mjs';

export default function grounding(s, c) {
  const { point: p, unpadded, native, css } = COORD;
  const sx = p.cropWidth / p.renderedWidth;
  const sy = p.cropHeight / p.renderedHeight;
  const scaled = { x: unpadded.x * sx, y: unpadded.y * sy };
  assertEqual(scaled.x + p.cropX, native.x, 'native x');
  assertEqual(scaled.y + p.cropY, native.y, 'native y');
  assertEqual(css.x, 150, 'viewport x in CSS pixels');
  assertEqual(css.y, 75, 'viewport y in CSS pixels');

  const [imageRegion, math] = MAIN.columns([1.22, 1], 'wide');
  const [viewTitle, paper] = imageRegion.rows([0.75, 6], 'normal');
  const width = 1024,
    height = 768;
  const unit = Math.min(paper.width / width, paper.height / height);
  const [cx, cy] = paper.point('center');
  const xy = (x, y) => [cx + (x - width / 2) * unit, cy + (y - height / 2) * unit];
  const box = (x, y, w, h, style) =>
    rect(w * unit, h * unit, style).moveTo(xy(x + w / 2, y + h / 2));
  const viewport = box(0, 0, width, height, { fill: 'surface', stroke: 'dim', width: 3 });
  const crop = box(p.cropX, p.cropY, p.cropWidth, p.cropHeight, {
    fill: null,
    stroke: 'cyan',
    width: 3,
  });
  const mx = p.cropX - sx * p.paddingX;
  const my = p.cropY - sy * p.paddingY;
  const padded = box(
    mx,
    my,
    p.cropWidth + 2 * sx * p.paddingX,
    p.cropHeight + 2 * sy * p.paddingY,
    { fill: null, stroke: 'blue', width: 3, dash: [9, 7] },
  );
  const tab = box(native.x - 25, native.y - 30, 305, 74, {
    radius: 9,
    fill: 'surface',
    stroke: 'cyan',
    width: 3,
  });
  const tabName = label('Failed tests', { size: 34, color: 'ink' }).moveTo(
    xy(native.x + 140, native.y + 7),
  );
  const pin = dot(9, 'yellow').moveTo(xy(native.x, native.y));
  const originX = s.value(mx),
    originY = s.value(my);
  const tickWidth = s.value(sx);
  const tickHeight = s.value(sy);
  // One tick is 50 units in the coordinate space currently being read.
  const rulers = dynamic(() => {
    const x = originX.value,
      y = originY.value;
    const stroke = { stroke: 'yellow', width: 3 };
    const marks = [
      line(xy(x, y), xy(native.x, y), stroke),
      line(xy(x, y), xy(x, native.y), stroke),
      line(xy(native.x, y), xy(native.x, native.y), { stroke: 'dim', width: 2, dash: [5, 5] }),
      line(xy(x, native.y), xy(native.x, native.y), { stroke: 'dim', width: 2, dash: [5, 5] }),
    ];
    for (let t = x; t <= native.x + 0.01; t += 50 * tickWidth.value)
      marks.push(line(xy(t, y), xy(t, y + 12), stroke));
    for (let t = y; t <= native.y + 0.01; t += 50 * tickHeight.value)
      marks.push(line(xy(x, t), xy(x + 12, t), stroke));
    return marks;
  });
  const measure = (x, y, xUnit, yUnit) =>
    s.play(originX.to(x), originY.to(y), tickWidth.to(xUnit), tickHeight.to(yUnit), {
      duration: 0.65,
    });
  const band = math.rows(5, 'normal');
  const step = (index, operation, pair) => {
    const [a, b] = band[index].rows([1, 1.2], 'tight');
    return [
      place(note(operation, { color: 'dim', size: 31 }), a, 'left'),
      place(mono('(' + pair.x + ', ' + pair.y + ')', { color: 'yellow', size: 42 }), b, 'left'),
    ];
  };
  const model = step(0, 'Point in padded model image', { x: p.modelX, y: p.modelY });
  const unpad = step(1, 'Subtract padding  (32, 16)', unpadded);
  const restore = step(2, 'Resize  320 × 200  →  640 × 400', scaled);
  const origin = step(3, 'Add crop origin  (100, 50)', native);
  const browser = step(4, 'Device pixels ÷ 2  →  CSS pixels', css);
  const legend = place(
    note('Viewport   1024 × 768 device pixels', { color: 'blue' }),
    viewTitle,
    'left',
  );
  const key = note('Ruler ticks: 50 units', { size: 31, color: 'yellow' }).moveTo(xy(500, 630));
  const view = footer('The yellow point stays on the same part of the tab.', 'cyan');
  const ask = footer('Which point belongs to the browser mouse?', 'yellow');
  const cssAnswer = footer('Browser mouse   (150, 75) CSS px', 'green');
  s.add(
    heading(c.title),
    viewport,
    legend,
    crop,
    padded,
    tab,
    tabName,
    pin,
    model,
    rulers,
    key,
    view,
  );
  c.show('padding', unpad[0]);
  c.on('padding', () => measure(p.cropX, p.cropY, sx, sy));
  c.hide('padding', padded);
  c.show('unpadded', unpad[1], { after: true });
  c.show('resize', restore[0]);
  c.on('resize', () => measure(p.cropX, p.cropY, 1, 1));
  c.show('restored', restore[1], { after: true });
  c.show('offset', origin[0]);
  c.on('offset', () => measure(0, 0, 1, 1));
  c.show('native', origin[1], { after: true });
  c.show('device-scale', browser[0]);
  c.swap('predict', view, ask);
  c.on('css', () => measure(0, 0, p.dpr, p.dpr));
  c.show('css', browser[1], { after: true });
  c.swap('css', ask, cssAnswer, { after: true });
  c.swap(
    'contract',
    cssAnswer,
    footer('Check capture units, viewport origin and scroll offset.', 'blue'),
  );
}
