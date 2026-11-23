import {
  assertEqual,
  dot,
  dynamic,
  group,
  indicate,
  line,
  place,
  recolor,
  rect,
} from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { begin, BODY, FOOT, taskHeader } from '../parts.mjs';
export default function nativePrefix(s, c) {
  const header = taskHeader(),
    length = s.value(1024),
    gradient = s.value(0),
    active = s.value(0);
  const [training, shortRegion] = BODY.rows([6, 1], 'wide');
  const [labels, coordinates] = training.columns([1, 8], 'normal');
  const lanes = coordinates.rows(6, 'normal'),
    nameRows = labels.rows(6, 'normal');
  const prefixes = [64, 128, 256, 1024],
    unit = coordinates.width / 64;
  const names = prefixes.map((n, i) => place(mono('L' + n, { size: 34 }), nameRows[i + 1]));
  const axisLabels = [
    place(note('coordinate 1'), lanes[0], 'left'),
    place(note('1024'), lanes[0], 'right'),
  ];
  const strip = dynamic(() =>
    group(
      ...Array.from({ length: 64 }, (_, i) =>
        rect(unit * 0.8, 32, {
          fill: i * 16 < length.value ? 'ink' : 'surface',
          stroke: 'dim',
        }).moveTo([coordinates.left + (i + 0.5) * unit, lanes[0].cy + 42]),
      ),
    ),
  );
  const spans = dynamic(() => {
    const nodes = [];
    prefixes.forEach((n, i) => {
      const y = lanes[i + 1].cy,
        end = coordinates.left + (coordinates.width * n) / 1024;
      nodes.push(
        line([coordinates.left, y], [end, y], { stroke: active.value ? 'ink' : 'dim', width: 5 }),
      );
      nodes.push(line([end, y - 10], [end, y + 10], { stroke: 'dim', width: 3 }));
      const phase = Math.max(0, Math.min(1, gradient.value - i));
      if (phase > 0 && phase < 1)
        nodes.push(
          dot(12, 'yellow').moveTo([coordinates.left + (end - coordinates.left) * phase, y]),
        );
      if (gradient.value >= i + 1)
        nodes.push(line([coordinates.left, y], [end, y], { stroke: 'yellow', width: 5 }));
    });
    return group(...nodes);
  });
  const accumulation = dynamic(() => {
    const finished = Math.min(4, Math.floor(gradient.value)),
      nodes = [];
    for (let cell = 0; cell < 64; cell++) {
      const count = prefixes.slice(0, finished).filter((n) => cell * 16 < n).length;
      for (let j = 0; j < count; j++)
        nodes.push(
          rect(unit * 0.8, 8, { fill: 'yellow', stroke: 'yellow' }).moveTo([
            coordinates.left + (cell + 0.5) * unit,
            lanes[5].cy - j * 11,
          ]),
        );
    }
    return group(...nodes);
  });
  const legend = place(
    note('Illustrative nonzero loss contributions accumulate on included coordinates'),
    shortRegion,
    'top',
  );
  const counts = place(
    label('first 64: 4 losses     next 64: 3     next 128: 2     last 768: 1', {
      size: 34,
      color: 'yellow',
    }),
    shortRegion,
    'bottom',
  );
  const shortlist = Array.from({ length: 27 }, (_, i) =>
    dot(11, 'dim').moveTo([
      shortRegion.left + ((i + 0.5) * shortRegion.width) / 27,
      shortRegion.cy,
    ]),
  );
  const negative = place(
    label('Untrained 2-of-8 prefix: neighbor overlap ≈ 0.185', { size: 36, color: 'yellow' }),
    FOOT,
  );
  const total = place(
    label('Short prefix search → shortlist → full-vector rescore', { size: 36, color: 'yellow' }),
    FOOT,
  );
  const cap = place(
    label('Only 5 of 27 reference neighbors reach this shortlist', { size: 36, color: 'yellow' }),
    FOOT,
  );
  assertEqual(1024 / 64, 16, 'prefix array saving');
  begin(
    s,
    c,
    'native-prefix',
    'Train the prefixes that serving will use',
    [strip, names, axisLabels, spans, accumulation, legend],
    header,
  );
  c.on('prefix-losses', () => s.play(active.to(1, { duration: 1 })));
  c.on('prefix-gradient', () =>
    s.play(
      gradient.to(4, {
        duration: Math.max(2, c.cue('prefix-gradient').end - c.cue('prefix-gradient').start),
      }),
    ),
  );
  c.show('prefix-gradient', counts, { after: true });
  c.on('prefix-no-guarantee', () => s.play(indicate(names[0], { scale: 1, color: 'yellow' })));
  c.on('prefix-heads', () => s.play(indicate(names, { scale: 1, color: 'yellow' })));
  c.show('prefix-negative', negative, { after: true });
  c.swap('prefix-shortlist', negative, total);
  c.swap('prefix-shortlist', [legend, counts], shortlist, { fade: 0.15 });
  c.on('prefix-shortlist', () => s.play(length.to(64, { duration: 2 })));
  c.after('prefix-five', () =>
    s.play(...shortlist.slice(0, 5).map((n) => recolor(n, 'yellow', { duration: 0.3 }))),
  );
  c.swap('prefix-miss', total, cap, { after: true });
  c.on('prefix-supported', () => s.play(indicate(strip, { scale: 1, color: 'yellow' })));
}
