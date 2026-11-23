import { film, text, line, arrow, fadeIn } from 'vizmatic/stage';

export default film({ title: 'Which reply can the responder act on?', look: 'midnight' }, (s) => {
  s.add(
    text('Which reply can the responder act on?', { font: 'text-serif', size: 72 }).at(0, -460),
  );
  s.add(line([-820, -395], [820, -395], { stroke: 'gridStrong', width: 2 }));
  s.play(fadeIn(text('DEP-27  /  INCIDENT RESPONSE', { size: 40, color: 'dim' }).at(0, -355)), {
    duration: 0.26,
  });
  s.wait(1.04);
  s.play(fadeIn(text('Stop rollout. Run rollback.', { size: 40, color: 'ink' }).at(0, -165)), {
    duration: 0.26,
  });
  s.wait(3.64);
  s.play(fadeIn(text('1   Stop rollout', { size: 52, color: 'ink' }).at(-388, 112)), {
    duration: 0.26,
  });
  s.wait(2.24);
  s.play(fadeIn(text('2   Run rollback', { size: 52, color: 'ink' }).at(385, 112)), {
    duration: 0.26,
  });
  s.wait(4.54);
  s.add(arrow([-175, -90], [-360, 51], { stroke: 'blue', width: 4, tip: 15 }));
  s.add(arrow([175, -90], [360, 51], { stroke: 'blue', width: 4, tip: 15 }));
  s.play(fadeIn(text('Same policy. Same actions.', { size: 40, color: 'teal' }).at(0, 300)), {
    duration: 0.26,
  });
  s.wait(5.24);
  s.play(fadeIn(text('The judge estimates clarity.', { size: 40, color: 'teal' }).at(0, 394)), {
    duration: 0.26,
  });
  s.wait(9.271);
});
