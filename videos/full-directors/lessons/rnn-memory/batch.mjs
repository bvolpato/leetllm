import {
  ink,
  mute,
  rule,
  pale,
  blue,
  green,
  red,
  teal,
  gold,
  sea,
  blush,
  rect,
  line,
  dot,
  poly,
  arrow,
  text,
  num,
  title,
  note,
  footFormula,
  fmt,
  pair,
  cue,
  lerp,
  animal,
} from './drawing.mjs';
import { m, dog, states, scalar, bRows, fillers, packedIncident, eventNames } from './examples.mjs';
export function suffix(c, k) {
  title(c, 'Did the actor survive the batch?');
  const b = k.beat.beatIndex,
    run = cue(k, 2, 'cell runs again', 1.6),
    skip = cue(k, 3, 'skip the update', 1.3);
  const x = (i) => 224 + i * 280,
    y = (h) => 656 - h * 412;
  const list = [...dog.words, 'filler'];
  list.forEach((w, i) => text(c, w, x(i), 261, 45, i === 5 ? red : ink, 'center', 'Serif'));
  line(c, x(0) - 39, y(0), x(5) + 85, y(0), rule, 2);
  num(c, '0', 112, y(0), 30, mute);
  dog.states.slice(1).forEach((h, i) => {
    if (i) line(c, x(i - 1), y(dog.states[i]), x(i), y(h), blue, 7);
    dot(c, x(i), y(h), 12, blue);
    num(c, fmt(h), x(i), y(h) - 45, 35, blue, 'center');
  });
  line(c, x(4) + 83, 328, x(4) + 83, 694, mute, 3, [7, 11]);
  text(c, 'valid end', x(4) + 85, 741, 35, mute, 'center');
  if (run) {
    const endY = y(dog.padded);
    line(c, x(4), y(dog.final), lerp(x(4), x(5), run), lerp(y(dog.final), endY, run), red, 7);
    if (run === 1) {
      dot(c, x(5), endY, 13, red);
      num(c, fmt(dog.padded), x(5), endY + 48, 38, red, 'center');
    }
  }
  if (skip) {
    line(c, x(4), y(dog.final), lerp(x(4), x(5), skip), y(dog.final), green, 5, [9, 9]);
    if (skip === 1) num(c, fmt(dog.final), x(5), y(dog.final) - 45, 38, green, 'center');
  }
  if (b === 3) {
    animal(c, 'dog', 280, 890, 0.72, blue);
    text(
      c,
      'Both say dog. Skipping the filler preserves the final state.',
      1010,
      893,
      42,
      ink,
      'center',
    );
  } else note(c, 'One more zero input still applies tanh(0.9 × old h).', 838);
}

export function boundary(c, k) {
  const b = k.beat.beatIndex;
  if (b < 5) {
    title(c, 'Does changing the filler change the readout?');
    const packed = b >= 3;
    for (let row = 0; row < 2; row++) {
      const y = 242 + row * 122;
      text(
        c,
        (row ? 'B' : 'A') + '  length ' + (row ? 2 : 3),
        111,
        y + 41,
        40,
        ink,
        'left',
        'Serif',
      );
      for (let i = 0; i < 3; i++) {
        const x = 488 + 426 * i,
          isFill = row === 1 && i === 2;
        if (isFill && packed) {
          line(c, x - 28, y - 5, x - 28, y + 86, red, 6);
          text(c, 'end', x + 15, y + 40, 36, red);
          continue;
        }
        rect(c, x, y, 369, 82, isFill ? '#e7ddd4' : sea);
        text(
          c,
          isFill ? 'filler' : eventNames[i],
          x + 184,
          y + 41,
          40,
          isFill ? red : teal,
          'center',
        );
      }
    }
    const xs = [632, 1324];
    if (b >= 1) {
      fillers.forEach((filler, i) => {
        if (i === 1 && b === 1) return;
        const x = xs[i],
          length = packed ? 2 : 3;
        text(c, 'Filler ' + pair(filler, 0), x, 578, 38, mute, 'center');
        const ready = packed
          ? cue(k, 4, 'Compare both packed runs', 0)
          : i
            ? cue(k, 3, 'Compare with B alone', 0)
            : cue(k, 2, 'Read the result', 0);
        if (!ready) return;
        num(
          c,
          pair(packedIncident([...bRows, filler], length)),
          x,
          678,
          49,
          packed ? teal : red,
          'center',
        );
      });
    }
    num(c, 'B alone   ' + pair(states[2]), 960, packed ? 770 : 808, 42, teal, 'center');
    if (b === 4)
      note(c, 'Right-padded prefixes   •   CPU lengths [3, 2]   •   enforce_sorted=False', 838);
    else if (packed) note(c, 'Only A is active at step three.', 838);
  } else {
    title(c, 'Whose state starts the next incident?');
    for (let j = 0; j < 2; j++) {
      const y = 373 + j * 275,
        col = j ? red : teal,
        old = j ? scalar.at(-1) : 0;
      text(c, j ? 'Carry prior incident' : 'Start fresh', 115, y, 44, col, 'left', 'Serif');
      num(c, 'old h  ' + fmt(old), 596, y, 40, ink);
      arrow(c, 995, y, 1224, y, col, 6);
      text(c, 'event 0.4', 1115, y - 62, 32, mute, 'center');
      if (cue(k, 6, j ? 'once from the previous' : 'Run it once from zero', 0))
        num(c, 'h  ' + fmt(j ? m.leakedNext : m.resetNext), 1307, y, 50, col);
    }
    if (b === 6)
      note(c, 'Move each state with its stream. Start an independent incident from zero.', 838);
  }
}
