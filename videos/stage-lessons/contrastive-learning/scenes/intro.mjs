import {
  assertEqual,
  circle,
  dot,
  dynamic,
  ellipse,
  fadeIn,
  group,
  linear,
  place,
  rect,
  svgPath,
} from 'vizmatic/stage';
import { area, label, mono } from '../../kit-narrated.mjs';
import { CAPTIONS, QUERY } from '../caption-match.mjs';

const fur = 'ink';
const patch = 'yellow';
const solid = (path, color) => svgPath(path, { fill: color, stroke: null });

function runningPuppy(stride) {
  // The front and hind paws extend in opposite directions during a bound.
  const phase = Math.cos(2 * Math.PI * stride);
  function leg(x, reach, color) {
    const paw = x + reach;
    return solid(
      `M ${x - 15} 3 Q ${x - 20} 28 ${paw - 8} 61 Q ${paw - 5} 67 ${paw + 10} 65
       Q ${paw + 19} 62 ${paw + 8} 55 L ${x + reach * 0.55 + 8} 31 Q ${x + 20} 13 ${x + 13} 0 Z`,
      color,
    );
  }
  return group(
    leg(-59, 50 * phase, 'dim'),
    leg(50, -48 * phase, 'dim'),
    leg(-65, -52 * phase, fur),
    leg(50, 55 * phase, fur),
    solid('M -70 -22 Q -98 -22 -119 -50 Q -104 -47 -87 -41 Q -69 -33 -49 -33 Z', patch),
    solid(
      'M -82 -24 C -65 -48 -17 -35 15 -36 Q 42 -39 54 -64 Q 59 -87 82 -85 Q 104 -87 112 -65 L 140 -57 Q 145 -43 129 -35 Q 119 -29 104 -31 Q 93 4 67 17 Q 41 32 12 15 Q -10 4 -39 20 Q -69 33 -85 12 Q -97 -5 -82 -24 Z',
      fur,
    ),
    solid('M 63 -76 Q 45 -78 33 -66 Q 19 -56 3 -61 Q 12 -43 32 -44 Q 57 -43 71 -69 Z', patch),
    dot(4, 'bg').at(98, -68),
    ellipse(8, 6, { fill: 'bg', stroke: null }).at(137, -56),
  );
}

function sleepingDog() {
  return group(
    ellipse(165, 27, { fill: 'blue', stroke: null }).at(0, 49),
    solid(
      'M -131 20 Q -135 -38 -77 -55 Q -31 -68 12 -43 Q 49 -25 55 9 Q 53 42 18 44 L -93 43 Q -122 43 -131 20 Z',
      fur,
    ),
    solid(
      'M -126 2 Q -127 31 -89 38 Q -65 42 -41 24 Q -59 51 -97 46 Q -133 45 -138 26 Q -142 10 -126 2 Z',
      patch,
    ),
    solid(
      'M 7 -14 Q 15 -53 57 -54 Q 95 -55 102 -22 L 130 -9 Q 146 -3 143 11 Q 139 25 109 28 L 57 32 Q 17 31 7 -14 Z',
      fur,
    ),
    solid('M 24 -44 Q -2 -24 3 6 Q 4 24 19 25 Q 46 25 50 -30 Q 48 -51 24 -44 Z', patch),
    svgPath('M 71 -17 Q 79 -10 87 -17', { stroke: 'bg', width: 4 }),
    ellipse(8, 6, { fill: 'bg', stroke: null }).at(139, 0),
    ellipse(37, 9, { fill: fur, stroke: null }).at(78, 36),
  );
}

function sky() {
  return group(
    circle(39, { fill: patch, stroke: null }).at(74, -47),
    solid(
      'M -130 44 Q -152 41 -147 17 Q -143 -1 -118 0 Q -116 -28 -88 -36 Q -55 -44 -36 -17 Q -14 -30 5 -9 Q 11 -1 12 7 Q 43 8 42 28 Q 41 45 22 45 Z',
      fur,
    ),
  );
}

export default function intro(s, c) {
  const [search, strip, status, foot] = area.rows([1.1, 4, 0.9, 1.1], 'normal');
  const lanes = strip.columns(3, 'normal');
  const readings = status.columns(3, 'normal');
  const stride = s.value(0);
  const pictures = [
    dynamic(() => {
      const t = stride.value;
      return runningPuppy(t).at(-46 + Math.min(t, 3) * 28, 2 - 16 * Math.cos(2 * Math.PI * t));
    }),
    sleepingDog(),
    sky(),
  ];
  const query = place(label('“' + QUERY + '”', { size: 70, color: 'cyan' }), search);
  const ask = place(label('Which clip matches this search?', { size: 54 }), foot);
  const opening = [query, ask];
  for (const [i, lane] of lanes.entries()) {
    const [image, caption] = lane.rows([3, 1], 'normal');
    const frame = place(
      rect(image.width, image.height, { radius: 18, fill: 'surface', stroke: 'grid', width: 3 }),
      image,
    );
    const figure = group(pictures[i]).at(image.cx, image.cy).scale(1.35, [image.cx, image.cy]);
    opening.push(frame);
    if (i === 2) {
      opening.push(
        group(
          place(
            rect(image.width - 6, image.height - 6, {
              radius: 15,
              fill: 'blue',
              stroke: null,
              opacity: 0.22,
            }),
            image,
          ),
        ),
      );
    }
    opening.push(figure, place(label(CAPTIONS[i], { size: 52 }), caption));
  }
  const terms = QUERY.toLowerCase()
    .split(' ')
    .filter((word) => ['dog', 'running'].includes(word));
  const hits = CAPTIONS.map(
    (caption) => terms.filter((word) => caption.toLowerCase().split(' ').includes(word)).length,
  );
  assertEqual(hits.join(','), '0,1,0', 'exact-word counts for the three captions');
  const counts = hits.map((n, i) =>
    place(mono(n + (n === 1 ? ' hit' : ' hits'), { size: 38 }), readings[i]),
  );
  const words = place(label('Exact words:  dog  ·  running', { color: 'yellow', size: 46 }), foot);
  const target = place(label('Match', { size: 44, color: 'green' }), readings[0]);
  const sleeper = place(label('Competing caption', { size: 44, color: 'pink' }), readings[1]);
  const rank = place(
    label('Score “A puppy runs” higher than “A dog sleeps”', { size: 48, color: 'green' }),
    foot,
  );

  s.add(opening);
  s.play(fadeIn(opening, { duration: 0 }));
  s.play(stride.to(3, { duration: 2.5, ease: linear }));
  c.swap('intro-words', ask, words);
  c.show('intro-word-hit', counts);
  c.swap('intro-choose', words, ask);
  c.on('intro-choose', () => s.play(stride.to(5, { duration: 1.6, ease: linear })));
  c.swap('intro-puppy', counts[0], target, { after: true });
  c.hide('intro-puppy', [ask, counts[2]], { after: true });
  c.swap('intro-sleeper', counts[1], sleeper, { after: true });
  c.show('intro-train', rank, { after: true });
}
