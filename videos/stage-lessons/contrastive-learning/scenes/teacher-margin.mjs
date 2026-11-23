import { assertEqual, indicate, numberLine, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';

export default function teacherMargin(s, c) {
  const [top, teacherRegion, studentRegion, foot] = area.rows([1, 3, 3, 1], 'normal');
  const pos = 0.2,
    neg = 0.8,
    margin = pos - neg;
  const title = place(label('teacher → student score margins', { color: 'cyan' }), top);
  const teacher = place(
    numberLine({
      length: teacherRegion.width - 160,
      width: 3,
      range: [0, 1],
      step: 0.2,
      size: 34,
      labelSize: 34,
      format: (v) => v.toFixed(1),
      points: [
        { name: 'approved', value: pos, color: 'green' },
        { name: 'non-match', value: neg, color: 'pink' },
      ],
    }),
    teacherRegion,
  );
  const student = place(
    numberLine({
      length: studentRegion.width - 160,
      width: 3,
      range: [0, 1],
      step: 0.2,
      size: 34,
      labelSize: 34,
      format: (v) => v.toFixed(1),
      points: [
        { name: 'approved', value: 0.4, color: 'green' },
        { name: 'non-match', value: 0.6, color: 'pink' },
      ],
    }),
    studentRegion,
  );
  const teacherLabel = place(
    label('Teacher', { color: 'cyan', size: 34 }),
    teacherRegion,
    'top left',
  );
  const studentLabel = place(
    label('Student', { color: 'cyan', size: 34 }),
    studentRegion,
    'top left',
  );
  const signed = place(
    mono('Δ teacher = ' + margin.toFixed(1) + '     Δ student = ' + margin.toFixed(1), {
      size: 36,
      color: 'yellow',
    }),
    top,
  );
  const bad = place(mono(`MSE = (Δ student − Δ teacher)² = 0`, { color: 'red' }), foot);
  const limit = 1 - -1,
    requested = 3.5,
    residual = requested - limit;
  const range = place(
    label('Possible raw cosine margins: −2 to +2', { color: 'cyan', size: 42 }),
    top,
  );
  const ruler = place(
    numberLine({
      length: teacherRegion.width - 240,
      range: [-2, 4],
      step: 1,
      labelSize: 36,
      size: 38,
      points: [
        { name: 'student limit', value: limit, color: 'cyan' },
        { name: 'teacher target', value: requested, color: 'pink' },
      ],
    }),
    teacherRegion,
  );
  const floor = place(
    mono(
      'smallest squared error = (' +
        requested +
        ' − ' +
        limit +
        ')² = ' +
        (residual ** 2).toFixed(2),
      { color: 'yellow', size: 44 },
    ),
    studentRegion,
  );
  assertEqual(residual ** 2, 2.25, 'best attainable squared error for this cosine student');
  s.add(heading(c.title), title, teacher, student, teacherLabel, studentLabel);
  c.on('cl-teacher-margin-difference', () => s.play(indicate(teacher, { scale: 1 })));
  c.on('cl-teacher-margin-result', () =>
    s.play(student.move({ approved: pos, 'non-match': neg }, { duration: 1.8 })),
  );
  c.show('cl-teacher-margin-wrong', bad, { after: true });
  c.swap('cl-teacher-margin-result', title, signed, { after: true });
  c.swap(
    'cl-teacher-margin-range',
    [bad, signed, teacher, student, teacherLabel, studentLabel],
    range,
  );
  c.show('teacher-target', ruler);
  c.show('cl-teacher-margin-scale', floor, { after: true });
}
