import { film, text, circle, fadeIn } from 'vizmatic/stage';

export default film({ title: 'Who experienced the errors?', look: 'midnight' }, (s) => {
  s.add(text('Who experienced the errors?', { font: 'text-serif', size: 76 }).at(0, -375));
  const blocked = new Set([2, 10, 15, 26]);
  const errors = [];
  for (let i = 0; i < 28; i++) {
    const x = (i % 7 - 3) * 130;
    const y = Math.floor(i / 7) * 97 - 209;
    s.add(circle(23, { fill: 'surface', stroke: 'ink', width: 3 }).at(x, y));
    if (blocked.has(i)) errors.push(text('×', { size: 51, color: 'pink' }).at(x, y));
  }
  s.add(text('28 eligible requests', { font: 'mono', size: 43 }).at(0, 202));
  s.wait(2);
  s.play(fadeIn(errors), fadeIn(text('4 wrongly blocked  /  28  =  14.3%',
    { font: 'mono', size: 48, color: 'pink' }).at(0, 300)), { duration: 0.4 });
  s.wait(13.3);
});
