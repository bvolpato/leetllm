import { film, text, line, fadeIn } from 'vizmatic/stage';

export default film({ title: 'Did the repair preserve useful answers?', look: 'midnight' }, (s) => {
  s.add(
    text('Did the repair preserve useful answers?', { font: 'text-serif', size: 72 }).at(0, -460),
  );
  s.add(line([-820, -395], [820, -395], { stroke: 'gridStrong', width: 2 }));
  s.play(fadeIn(text('Run 2    /    first repair', { size: 40, color: 'dim' }).at(0, -285)), {
    duration: 0.26,
  });
  s.wait(1.34);
  s.play(fadeIn(text('Unsupported deployment', { size: 52, color: 'ink' }).at(-490, -62)), {
    duration: 0.26,
  });
  s.wait(2.34);
  s.play(fadeIn(text('Refusal expected', { size: 52, color: 'ink' }).at(-490, 88)), {
    duration: 0.26,
  });
  s.wait(2.34);
  s.play(fadeIn(text('Supported rollback', { size: 52, color: 'ink' }).at(490, -62)), {
    duration: 0.26,
  });
  s.wait(2.24);
  s.play(fadeIn(text('Guidance expected', { size: 52, color: 'ink' }).at(490, 88)), {
    duration: 0.26,
  });
  s.wait(2.54);
  s.add(line([0, -150], [0, 254], { stroke: 'gridStrong', width: 3 }));
  s.add(line([-740, 149], [-248, 149], { stroke: 'teal', width: 5 }));
  s.add(line([250, 149], [740, 149], { stroke: 'yellow', width: 3, dash: [12, 12] }));
  s.play(fadeIn(text('Does it still answer?', { size: 52, color: 'teal' }).at(490, 212)), {
    duration: 0.26,
  });
  s.wait(3.74);
  s.play(fadeIn(text('Compare both cases across runs.', { size: 40, color: 'teal' }).at(0, 362)), {
    duration: 0.26,
  });
  s.wait(3.752);
});
