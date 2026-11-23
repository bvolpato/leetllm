import { film, text, rect, type ColorInput } from 'vizmatic/stage';
export default film({ title: 'Count the word after cat', look: 'midnight', fps: 30 }, (s) => {
  let elapsed = 0;
  function at(t: number) {
    if (t > elapsed) s.wait(t - elapsed);
    elapsed = Math.max(elapsed, t);
  }
  function show(v: string, x: number, y: number, size: number, color: ColorInput = 'ink') {
    s.add(text(v, { size, color }).at(x, y));
  }
  show('Count the word after cat', 0, -370, 83);

  const words = ['sat', 'sat', 'slept'];
  words.forEach((word, i) => {
    at([1.7, 4.7, 7.4][i]);
    show('the cat', -580, -160 + i * 125, 58);
    show(word, -290, -160 + i * 125, 64, i === 2 ? 'yellow' : 'teal');
  });
  at(11);
  show('after cat', 340, -275, 44);
  for (let i = 0; i < 3; i++) {
    at(11.5 + i * 0.6);
    s.add(rect(92, 92, { fill: i === 2 ? 'yellow' : 'teal', stroke: null }).at(240 + i * 104, -60));
  }
  at(17.5);
  show('2 / 3 sat', 270, 115, 60, 'teal');
  at(19.4);
  show('1 / 3 slept', 300, 225, 60, 'yellow');

  at(29);
});
