import { film, text, line, fadeIn } from 'vizmatic/stage';

export default film({ title: 'Can we promise a recovery time?', look: 'midnight' }, (s) => {
  s.add(text('Can we promise a recovery time?', { font: 'text-serif', size: 72 }).at(0, -460));
  s.add(line([-820, -395], [820, -395], { stroke: 'gridStrong', width: 2 }));
  s.play(fadeIn(text('INCIDENT SNAPSHOT', { size: 52, color: 'dim' }).at(-440, -240)), {
    duration: 0.26,
  });
  s.wait(2.14);
  s.play(fadeIn(text('Embedding API', { size: 52, color: 'ink' }).at(-440, -122)), {
    duration: 0.26,
  });
  s.wait(2.74);
  s.play(fadeIn(text('08:14 UTC', { size: 52, color: 'ink' }).at(-440, 20)), { duration: 0.26 });
  s.wait(2.54);
  s.play(fadeIn(text('Database failover', { size: 52, color: 'ink' }).at(-440, 140)), {
    duration: 0.26,
  });
  s.wait(1.54);
  s.play(fadeIn(text('Investigating', { size: 52, color: 'teal' }).at(-440, 263)), {
    duration: 0.26,
  });
  s.wait(3.14);
  s.play(fadeIn(text('DRAFT UPDATE', { size: 52, color: 'dim' }).at(480, -240)), {
    duration: 0.26,
  });
  s.wait(1.64);
  s.play(fadeIn(text('14:30 UTC', { size: 52, color: 'ink' }).at(480, 20)), { duration: 0.26 });
  s.wait(2.24);
  s.play(fadeIn(text('Recovery estimate', { size: 52, color: 'ink' }).at(480, 140)), {
    duration: 0.26,
  });
  s.wait(3.24);
  s.add(line([0, -290], [0, 320], { stroke: 'gridStrong', width: 3 }));
  s.add(line([280, 62], [680, 62], { stroke: 'yellow', width: 4 }));
  s.play(fadeIn(text('No matching evidence', { size: 52, color: 'teal' }).at(480, 263)), {
    duration: 0.26,
  });
  s.wait(2.603);
});
