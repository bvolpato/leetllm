const phaseNames = ['Retrieval + prefill', 'Decode', 'Idle'];
const keys = ['prefill', 'decode', 'idle'];
const number = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

export function shiftHeader(p, order, subtitle, target = 'shift-order') {
  p.target(target, () => {
    p.text(order, 148, 257, 44, p.C.ink);
    p.text(subtitle, 1760, 257, 31, p.C.muted, 'right');
  });
}

export function phaseTable(p, phases, rows, digits = 2) {
  const { C, text, line } = p;
  const colors = [C.blue, C.cyan, C.yellow];
  text('Phase', 150, 352, 29, C.muted);
  text('Time in this shift', 575, 352, 29, C.muted);
  text('Whole device', 1105, 352, 29, C.muted);
  text('Energy', 1420, 352, 29, C.muted);
  line(150, 378, 1760, 378, C.muted);
  phases.forEach(({ seconds, watts }, i) => {
    const { visible, time, wh } = rows[i];
    if (!visible) return;
    const y = 450 + 86 * i;
    p.target('shift-' + keys[i], () => {
      p.rect(151, y - 34, 9, 40, colors[i]);
      text(phaseNames[i], 181, y, 38, colors[i]);
      text(time ?? number(seconds) + ' s', 575, y, 37);
      text(watts + ' W', 1105, y, 39);
      if (wh)
        text(
          keys[i] + ' ' + ((seconds * watts) / 3600).toFixed(digits) + ' Wh',
          1420,
          y,
          35,
          colors[i],
        );
    });
  });
}

// Both strips use the same origin and scale. A partial strip contains only the phase energy charged so far.
export function batteryScale(p, { max, usable, nominal, showLimit, strips }) {
  const { C, text, rect, line } = p;
  const x = 410,
    width = 1125;
  const pixel = (value) => x + (width * value) / max;
  p.target('shift-limit', () => {
    if (showLimit) {
      const mark = pixel(usable);
      text(usable + ' Wh usable', mark, 712, 34, C.pink, 'center');
      line(mark, 723, mark, 923, C.pink, 3);
    } else {
      text('Battery use (Wh)', x, 712, 31, C.muted);
    }
    if (nominal) text(nominal + ' Wh nominal', 1790, 712, 28, C.muted, 'right');
  });
  p.target('shift-bill', () => {
    strips.forEach(({ name, amounts, total }, i) => {
      const y = 750 + i * 103;
      text(name, 150, y + 44, 34);
      rect(x, y, width, 57, C.panel, C.muted, 5);
      if (showLimit && nominal)
        rect(pixel(usable), y + 3, pixel(max) - pixel(usable) - 3, 51, '#402836');
      let used = 0;
      amounts.forEach((value, j) => {
        if (value > 0)
          rect(pixel(used), y + 8, (width * value) / max, 41, [C.blue, C.cyan, C.yellow][j]);
        used += value;
      });
      if (showLimit) line(pixel(usable), y - 6, pixel(usable), y + 64, C.pink, 4);
      if (total) text(total, 1790, y + 44, 32, C.ink, 'right');
    });
  });
}
