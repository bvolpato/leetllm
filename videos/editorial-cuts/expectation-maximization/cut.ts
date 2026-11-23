import { film, text, rect, line, fadeIn } from 'vizmatic/stage';

export default film({ title: 'One request, two prior odds', look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  s.add(label('One request, two prior odds', 0, -395, 82));
  s.add(label('Observed latency   45 ms', 0, -265, 52));
  const densities = [20, 80].map(
    (mean) => Math.exp(-0.5 * ((45 - mean) / 15) ** 2) / (15 * Math.sqrt(2 * Math.PI)),
  );
  const amounts = (prior: number) => {
    const left = prior * densities[0];
    return left / (left + (1 - prior) * densities[1]);
  };
  s.add(
    label('20 ms component', -440, -130, 46, 'blue'),
    label('80 ms component', 440, -130, 46, 'purple'),
  );
  const bar = (p: number, y: number) => {
    const fraction = amounts(p),
      width = 1200;
    return [
      rect(width * fraction, 84, { fill: 'blue', stroke: null }).at(
        -600 + (width * fraction) / 2,
        y,
      ),
      rect(width * (1 - fraction), 84, { fill: 'purple', stroke: null }).at(
        600 - (width * (1 - fraction)) / 2,
        y,
      ),
      line([0, y - 56], [0, y + 56], { stroke: 'ink', width: 3 }),
      label('Prior ' + p.toFixed(2), -755, y, 40),
      label((100 * fraction).toFixed(1) + '%', -600 + (width * fraction) / 2, y, 45, '#10151d'),
      label(
        (100 * (1 - fraction)).toFixed(1) + '%',
        600 - (width * (1 - fraction)) / 2,
        y,
        45,
        '#10151d',
      ),
    ];
  };
  s.wait(1);
  s.play(fadeIn(bar(0.25, 0)), { duration: 0.5 });
  s.wait(5.2);
  s.play(fadeIn(bar(0.1, 165)), { duration: 0.5 });
  s.wait(4);
  s.play(fadeIn(label('Same observation. The more frequent component now wins.', 0, 335, 45)), {
    duration: 0.5,
  });
  s.wait(8.3);
});
