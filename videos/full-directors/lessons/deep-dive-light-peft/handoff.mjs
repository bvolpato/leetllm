import { C, mix, smooth } from './drawing.mjs';
import { files, matches, minutes, clockParts, baselineMinutes, fmt } from './examples.mjs';
export function handoff(p) {
  const { b, cue, header, foot, box, line, label, mono } = p;
  if (b >= 4) {
    header('Matched benchmark  /  elapsed minutes', 'Where do both stopwatches stop?');
    const x = 210,
      unit = 8.45,
      y = 300;
    label('Baseline', 60, 226, 24, C.blue, { bold: true });
    box(x, 208, unit * baselineMinutes, 40, C.blue);
    mono(baselineMinutes + ' min', x + unit * baselineMinutes - 15, 228, 22, C.white, 'right');
    label('Candidate', 60, y + 21, 24, C.teal, { bold: true });
    const colors = ['#80b9a5', '#f0c25f', '#d88a5d', '#237667', '#96aecc'];
    let pos = 0;
    clockParts.forEach(([name, d], i) => {
      if (
        cue(
          4,
          [
            'ten estimating',
            'two writing',
            'three slicing',
            'forty training',
            'five evaluating',
          ][i],
        )
      ) {
        box(x + pos * unit, y, d * unit, 43, colors[i], C.paper);
        const lx = 80 + 222 * i;
        box(lx, 412, 16, 16, colors[i]);
        label(name, lx + 25, 421, 17);
        mono(d + ' min', lx + 25, 459, 23);
      }
      pos += d;
    });
    if (cue(5, 'The candidate takes sixty'))
      mono(minutes + ' min', x + minutes * unit + 12, y + 22, 24, C.teal);
    foot(
      cue(5, 'one and a half times')
        ? baselineMinutes +
            ' ÷ ' +
            minutes +
            ' = ' +
            fmt(baselineMinutes / minutes) +
            '× over the same complete window.'
        : 'Count the estimate, its files, surgery, continuation and final evaluation/export.',
      C.teal,
    );
    return;
  }
  header(
    'Estimate → saved evidence → continuation',
    b === 3 ? 'What runs after the handoff?' : 'Which record belongs to the new trainer?',
  );
  const verified = b >= 2 && cue(2, 'Bind its hashes');
  const revision = !cue(1, 'Someone has supplied') || verified ? 17 : 18;
  // A bundle carries its own immutable origin. The receiver stays on revision 17.
  label('Estimate output', 68, 183, 23, C.blue, { bold: true });
  box(66, 217, 422, 291, C.white, C.fine, 8);
  mono('peft_dir', 89, 245, 21, C.blue);
  const namesReady = cue(0, 'The estimate script');
  files.forEach((f, i) => {
    if (!namesReady || (i === 4 && !cue(0, 'Save the adapter'))) return;
    const y = 284 + i * 43;
    p.line(
      [
        [88, y - 11],
        [88, y + 10],
        [105, y + 10],
        [105, y - 6],
        [100, y - 11],
        [88, y - 11],
      ],
      C.teal,
      2,
    );
    mono(f, 119, y, 17, C.ink);
  });
  const bundle = b >= 1;
  if (bundle) {
    const t = verified ? 1 : smooth(cue(1, 'Point the second command', 1.6));
    line(
      [
        [492, 359],
        [719, 359],
      ],
      C.fine,
      3,
      [6, 8],
    );
    const x = mix(493, 554, t);
    box(x, 322, 118, 72, verified ? C.mint : C.white, C.dim, 5);
    label('bundle', x + 59, 339, 15, C.dim, { align: 'center' });
    mono('R' + revision, x + 59, 368, 23, verified ? C.teal : C.ink, 'center');
    box(732, 216, 401, 290, C.white, C.fine, 8);
    label('Receiver', 757, 252, 24, C.blue, { bold: true });
    mono('model R17', 757, 295, 23);
    if (b === 1) {
      label('Shape check', 757, 355, 20, C.dim);
      mono('same dimensions', 757, 396, 23);
    }
    if (b === 2) {
      label('Revision check', 757, 355, 20, C.dim);
      const ok = matches(revision, 17);
      mono(ok ? 'R17 = R17' : 'R18 ≠ R17', 757, 396, 26, ok ? C.teal : C.rust);
      if (cue(2, 'The revisions disagree'))
        label(ok ? 'Use the matching bundle' : 'Hold the load', 757, 454, 22, ok ? C.teal : C.rust);
    }
    if (b === 3) {
      const steps = [
        'Slice feature axes',
        'Restore filtered weights',
        'Slice rank pairs',
        'Start fresh optimizer',
      ];
      steps.forEach((s, i) => {
        if (
          cue(
            3,
            ['slices their base', 'restores the filtered', 'before slicing', 'A new trainer'][i],
          )
        ) {
          p.dot(763, 342 + 39 * i, 6, C.teal);
          label(s, 784, 342 + 39 * i, 20);
        }
      });
    }
  } else {
    label('Full width during estimation', 603, 231, 25, C.blue);
    ['head gates', 'FFN gates', 'modules', 'ranks'].forEach((v, i) => {
      label(v, 603, 285 + i * 54, 19, C.dim);
      for (let h = 0; h < [4, 5, 3, 4][i]; h++)
        box(798 + h * 49, 269 + i * 54, 40, 31, i < 2 ? C.ice : C.mint, i < 2 ? C.blue : C.teal, 2);
    });
  }
  foot(
    [
      'Score the task prefix while all coordinates still execute.',
      'The estimate used R17. Check the bundle before loading it.',
      'Keep the record hashes with the model, data, targets and commands.',
      'Surviving base gates reset to one. The next optimizer starts fresh.',
    ][b],
  );
}
