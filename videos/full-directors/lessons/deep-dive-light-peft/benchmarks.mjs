import { C } from './drawing.mjs';
import { TABLE1, TABLE5, FIGURE4, best, qualityFloor, winningStructure } from './examples.mjs';

export function benchmarks(p) {
  const { b, cue, header, foot, label, mono, box, line, dot } = p;
  if (b < 2) {
    header('Gu et al.  /  Table 1  /  RoBERTa-Large with LoRA', 'Which configuration meets the floor and trains fastest?');
    const x = (speed) => 147 + (speed - 1) * 970,
      y = (avg) => 463 - (avg - 91.6) * 148;
    const showFloor = cue(0, 'a four-task average of ninety-two'),
      choose = cue(1, 'The configuration retaining');
    [92, 92.5, 93, 93.5].forEach((v) => {
      line(
        [
          [114, y(v)],
          [827, y(v)],
        ],
        C.fine,
        1,
      );
      mono(v, 100, y(v), 16, C.dim, 'right');
    });
    [1, 1.2, 1.4, 1.6].forEach((v) => {
      line(
        [
          [x(v), 469],
          [x(v), 477],
        ],
        C.dim,
      );
      mono(v.toFixed(1) + '×', x(v), 500, 17, C.dim, 'center');
    });
    label('Four-task average', 119, 156, 18, C.dim);
    label('Point labels show foundation parameters retained', 466, 156, 18, C.blue);
    label('Training speed relative to baseline LoRA', 314, 528, 18, C.dim);
    if (showFloor) {
      line(
        [
          [114, y(qualityFloor)],
          [825, y(qualityFloor)],
        ],
        C.rust,
        2,
        [7, 7],
      );
      label('floor 92', 844, y(qualityFloor), 20, C.rust);
    }
    TABLE1.forEach((row) => {
      const px = x(row.speed),
        py = y(row.average);
      dot(px, py, 9, C.blue);
      if (choose && row === best) dot(px, py, 19, null, C.teal);
      mono(row.average.toFixed(1), px + 26, py + (row.average < qualityFloor ? 8 : 0), 18, C.blue);
      label(
        row.retained === 100 ? 'Baseline · 100%' : row.retained + '%',
        row.retained === 100 ? px + 26 : px,
        py + (row === best ? -30 : 27),
        17,
        C.ink,
        { align: row.retained === 100 ? 'left' : 'center' },
      );
    });
    if (choose) {
      label('Fastest eligible', 861, 194, 20, C.teal);
      mono(best.speed + '×', 858, 243, 42, C.teal);
      label(best.retained + '% of foundation', 861, 287, 21);
      label('parameters retained', 861, 315, 21);
      if (cue(1, 'Inside the winning model')) {
        const { heads, removedHeads, ffnParts, removedFFNParts } = winningStructure;
        label((heads - removedHeads) + '/' + heads + ' heads kept', 861, 458, 20, C.blue);
        label('≈ ' + (ffnParts - removedFFNParts) + '/' + ffnParts + ' FFN dimensions kept', 861, 491, 20, C.blue);
      }
    }
    foot(
      'TITAN RTX 24 GB    •    batch 32    •    length 128    •    training window includes estimation',
      C.blue,
    );
    return;
  }
  if (b === 2) {
    header(
      'Gu et al.  /  Figure 4  /  RoBERTa-Large',
      'Which window produced the training speedup?',
    );
    label('Memory relative to baseline LoRA', 62, 183, 22, C.dim);
    const dims = [
      ['Weights', FIGURE4.weightMemory],
      ['Activations', FIGURE4.activationMemory],
      ['Peak', FIGURE4.peakMemory],
    ];
    dims.forEach(([s, v], i) => {
      const y = 246 + i * 98;
      label(s, 61, y + 15, 22, C.ink);
      box(247, y, 394, 32, C.faint, C.fine);
      if (cue(2, ['weight memory falls', 'activation memory', 'peak memory'][i])) {
        box(247, y, 394 * (1 - v / 100), 32, C.teal);
        mono('−' + v + '%', 657, y + 17, 22, C.teal);
      }
    });
    line(
      [
        [785, 183],
        [785, 497],
      ],
      C.fine,
    );
    label('Ten batches', 826, 224, 23, C.ink, { bold: true });
    label('Forward + backward', 826, 266, 21, C.dim);
    if (cue(2, 'The reported two point two')) mono(FIGURE4.speed + '×', 820, 362, 60, C.blue);
    foot(
      'RTX 3090    •    batch 32    •    length 128    •    ' + FIGURE4.retained + '% of foundation parameters retained',
      C.blue,
    );
    return;
  }
  header('Gu et al.  /  Table 5  /  OPT-6.7B', 'What changes at a fixed backbone size?');
  const rows = [
    [192, 1.2],
    [96, 1.4],
    [TABLE5.modules, TABLE5.inferenceSpeed],
  ];
  label('Foundation parameters retained', 62, 184, 19, C.dim);
  label('Remaining LoRA modules', 376, 184, 19, C.dim);
  label('Inference speed vs. vanilla', 824, 184, 19, C.dim);
  const finished = cue(3, 'one point six times');
  rows.forEach(([modules, speed], i) => {
    const y = 247 + i * 96,
      visible = i === 0 || cue(3, 'Reduce the surviving modules');
    if (!visible) return;
    box(69, y, 163, 27, C.faint);
    box(69, y, (163 * TABLE5.retained) / 100, 27, C.blue);
    mono(TABLE5.retained + '%', 245, y + 13, 21, C.blue);
    for (let j = 0; j < modules / 12; j++) box(377 + (j % 16) * 19, y, 14, 27, C.teal);
    mono(modules, 699, y + 13, 23, C.teal);
    if (finished || i === 0) mono(speed + '×', 859, y + 13, 29, C.ink);
  });
  foot(
    'RTX 3090    •    batch 96    •    maximum length 100    •    each green mark represents 12 modules',
    C.blue,
  );
}
