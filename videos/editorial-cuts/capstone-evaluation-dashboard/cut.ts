import { film, text, rect, fadeIn, fadeOut, line } from 'vizmatic/stage';

export default film(
  { title: 'Where did the fourth check fail?', look: 'midnight', fps: 30 },
  (s) => {
    const label = (words: string, x: number, y: number, size: number, color = 'ink') =>
      text(words, { size, color, font: 'text-serif' }).at(x, y);
    const totals = [-470, 470].map((x) => label('3 / 4', x, -130, 164));
    s.add(
      label('Two runs pass the same number of checks.', 0, -414, 70),
      label('Baseline', -470, -280, 48),
      label('Hybrid candidate', 470, -280, 48),
      ...totals,
    );
    s.wait(3.2);
    s.play(fadeOut(totals), { duration: 0.4 });
    const tracks = [-470, 470].flatMap((x, run) =>
      ['Policy', 'Paraphrase', 'Unsupported', 'Private note'].flatMap((item, i) => {
        const y = -128 + i * 91;
        const failed = i === (run ? 3 : 1);
        return [
          label(item, x - 110, y, 43),
          rect(125, 54, { radius: 12, fill: failed ? 'yellow' : 'teal' }).at(x + 180, y),
          label(failed ? 'miss' : 'pass', x + 180, y, 34, '#121824'),
        ];
      }),
    );
    s.play(...tracks.map((node) => fadeIn(node)), { duration: 0.5 });
    s.wait(3.1);
    const left = label('Missed a useful answer', -470, 320, 45, 'yellow');
    s.play(fadeIn(left), { duration: 0.3 });
    s.wait(2);
    s.play(
      fadeIn(line([200, 200], [740, 200], { stroke: 'yellow', width: 4 })),
      fadeIn(label('Cited private evidence', 470, 320, 45, 'yellow')),
      { duration: 0.4 },
    );
    s.wait(6.8);
  },
);
