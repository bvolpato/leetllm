import { film, text, rect, line, fadeIn } from 'vizmatic/stage';

export default film({ title: 'Who shares the history?', look: 'midnight' }, (s) => {
  const caption = (v: string, x: number, y: number, size: number) => text(v, { size }).at(x, y);
  const xs = Array.from({ length: 8 }, (_, i) => -700 + i * 200);
  s.add(caption('Eight queries look back', 0, -390, 78));
  xs.forEach((x, i) => s.add(caption('Q' + i, x, -180, 46)));
  const history = (x: number, y: number, w: number, word: string, color: 'blue' | 'teal') => [
    rect(w, 92, { fill: 'surface', stroke: color, width: 3, radius: 14 }).at(x, y),
    caption(word, x, y, 36),
  ];
  s.wait(3.4);
  const separate = xs.flatMap((x) => [
    line([x, -138], [x, -10], { stroke: 'blue', width: 3 }),
    ...history(x, 40, 158, 'K / V', 'blue'),
  ]);
  const oldCaption = caption('One stored history per query head', 0, 248, 49);
  s.add(...separate, oldCaption);
  s.wait(5.75);
  s.remove(...separate, oldCaption); // keep the query positions fixed across the switch
  const groups = [-400, 400];
  xs.forEach((x, i) =>
    s.add(
      line([x, -138], [groups[Math.floor(i / 4)], 84], {
        stroke: i < 4 ? 'blue' : 'teal',
        width: 3,
      }),
    ),
  );
  groups.forEach((x, i) =>
    s.add(...history(x, 130, 445, 'Shared K / V history', i === 0 ? 'blue' : 'teal')),
  );
  s.play(fadeIn(caption('Two stored histories for eight distinct queries', 0, 248, 48)), {
    duration: 0.45,
  });
  s.wait(5.96);
});
