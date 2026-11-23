import { fadeIn, film, line, rect, text, type ColorInput } from 'vizmatic/stage';
const label = (value: string, x: number, y: number, color: ColorInput = 'ink') =>
  text(value, { size: 48, color }).at(x, y);
const title = (value: string) => text(value, { font: 'text-serif', size: 75 }).at(0, -350);
export default film({ look: 'midnight' }, (s) => {
  s.add(title('Which parcel should a specialist inspect?'));
  function parcel(x: number, dark: boolean) {
    const box = rect(450, 255, { fill: dark ? '#20242c' : '#aa8256', stroke: 'dim', width: 3 }).at(
      x,
      20,
    );
    const tape = rect(48, 255, { fill: dark ? '#282b30' : '#dac299', stroke: null }).at(x + 34, 20);
    const tear = [
      [-224, -88],
      [-125, -38],
      [-183, -4],
      [-113, 25],
      [-224, 72],
    ] as const;
    return [
      box,
      tape,
      ...tear
        .slice(1)
        .map((p, i) =>
          line([x + tear[i][0], 20 + tear[i][1]], [x + p[0], 20 + p[1]], {
            stroke: dark ? '#25282e' : '#512b29',
            width: 9,
          }),
        ),
    ];
  }
  s.add(...parcel(-420, true), ...parcel(420, false));
  s.wait(3.2);
  s.play(fadeIn(label('R-406     0.94', -420, 235)), { duration: 0.4 });
  s.wait(3.3);
  s.play(fadeIn(label('R-404     0.83', 420, 235)), { duration: 0.4 });
  s.wait(5.2);
  s.play(
    fadeIn(label('Request a clearer photo', -420, 335, 'dim')),
    fadeIn(label('Inspect the torn seam', 420, 335, 'teal')),
    { duration: 0.45 },
  );
  s.wait(4.05);
});
