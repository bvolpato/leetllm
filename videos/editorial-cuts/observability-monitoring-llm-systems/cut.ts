import { film, text, line, arrow, fadeIn } from 'vizmatic/stage';

export default film({ title: 'The request succeeded. Did the answer?', look: 'midnight' }, (s) => {
  s.add(
    text('The request succeeded. Did the answer?', { font: 'text-serif', size: 72 }).at(0, -460),
  );
  s.add(line([-820, -395], [820, -395], { stroke: 'gridStrong', width: 2 }));
  s.play(fadeIn(text('DEPLOYMENT REQUEST', { size: 52, color: 'dim' }).at(0, -300)), {
    duration: 0.26,
  });
  s.wait(1.04);
  s.play(fadeIn(text('HTTP 200', { size: 52, color: 'ink' }).at(-475, -65)), { duration: 0.26 });
  s.wait(1.44);
  s.play(fadeIn(text('Low latency', { size: 52, color: 'ink' }).at(-475, 55)), { duration: 0.26 });
  s.wait(1.84);
  s.play(fadeIn(text('Approval delivered', { size: 52, color: 'ink' }).at(480, -65)), {
    duration: 0.26,
  });
  s.wait(2.94);
  s.play(fadeIn(text('Deployment record', { size: 52, color: 'ink' }).at(480, 55)), {
    duration: 0.26,
  });
  s.wait(1.74);
  s.add(arrow([-340, -67], [235, -67], { stroke: 'teal', width: 5, tip: 19 }));
  s.add(line([245, 110], [720, 110], { stroke: 'yellow', width: 3, dash: [12, 12] }));
  s.play(fadeIn(text('Supporting evidence missing', { size: 40, color: 'ink' }).at(480, 180)), {
    duration: 0.26,
  });
  s.wait(4.04);
  s.play(fadeIn(text('Review the outcome', { size: 52, color: 'teal' }).at(0, 331)), {
    duration: 0.26,
  });
  s.wait(3.502);
});
