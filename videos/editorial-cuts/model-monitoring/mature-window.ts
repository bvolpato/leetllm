import { film, text, line, fadeIn } from 'vizmatic/stage';

export default film({ look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, color = 'ink', size = 44) =>
    text(value, { font: 'mono', size, color }).at(x, y);
  const x = (count: number) => -680 + count * 2.72;
  s.add(text('Can we judge this release?', { font: 'text-serif', size: 80 }).at(0, -360));
  s.add(label('Mature prediction windows', 0, -200));
  s.add(line([x(0), 0], [x(500), 0], { stroke: 'dim', width: 9 }));
  s.add(line([x(0), 0], [x(380), 0], { stroke: 'teal', width: 17 }));
  s.add(line([x(380), 0], [x(400), 0], { stroke: 'yellow', width: 17 }));
  s.add(label('380 labels joined', x(190), 85, 'teal'), label('400 mature', x(400), -80));
  s.wait(2.6);
  s.play(fadeIn(label('380 ÷ 400 = 95%', x(190), 195, 'teal')), { duration: 0.4 });
  s.wait(5.4 - s.duration);
  s.play(fadeIn(label('20 labels missing', x(390), 84, 'yellow', 36)), { duration: 0.4 });
  s.wait(10.4 - s.duration);
  s.play(fadeIn(line([x(500), -32], [x(500), 32], { stroke: 'ink', width: 5 })),
    fadeIn(label('500 required', x(500), -155, 'ink', 36)), { duration: 0.4 });
  s.wait(14.5 - s.duration);
  s.play(fadeIn(label('Hold the decision. Check label ingestion.', 0, 315)), { duration: 0.5 });
  s.wait(22.175 - s.duration);
});
