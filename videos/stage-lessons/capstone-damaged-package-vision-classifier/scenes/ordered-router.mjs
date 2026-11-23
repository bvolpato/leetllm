import { column, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { ACTION } from '../parts.mjs';
import { caption, recordedView } from '../inspection.mjs';
import { visionRoute } from '../../../films/capstone-damaged-package-vision-classifier/arithmetic.mjs';
import { visionServed } from '../../../films/capstone-damaged-package-vision-classifier/construction.mjs';

export default function scene(s, c) {
  const sample = recordedView('R-404-a');
  const exact = { damage_probability: 0.7, box_visible: true, brightness: 0.2, blur_score: 0.45 };
  const exactRoute = visionRoute(sample.photo, exact);
  const [readings, gates, answer, batch] = area.rows([2, 3, 1, 2], 'wide');
  const [quality, score] = readings.columns([2, 1], 'normal');
  const value = caption(score, 'Damage  0.70', 'blue');
  const invalid = caption(score, 'Damage  True', 'blue');
  const panels = gates.columns(3, 'wide');
  const names = ['1   Parcel in frame?', '2   Image quality', '3   Damage score'];
  const limits = ['Visible = yes', 'Light ≥ .20   Blur ≤ .45', 'Score ≥ .70'];
  const checks = panels.map((panel, i) => {
    const [title, condition, step] = panel.inset('normal').rows(3, 'normal');
    s.add(
      place(rect(panel.width, panel.height, { fill: 'surface', stroke: 'grid', width: 3 }), panel),
      caption(title, names[i], 'dim', 38),
      caption(condition, limits[i], 'ink', 38),
    );
    return caption(step, i === 2 ? 'Send to priority' : 'Pass', 'yellow', 40);
  });
  const question = caption(answer, 'At these three limits, where does this photo go?');
  const result = caption(answer, ACTION[exactRoute.action] + ' review', 'yellow');
  const invalidQuestion = caption(answer, 'Can this record enter the first gate?');
  const rejected = caption(answer, 'Invalid numeric score   ·   No photo route', 'pink');
  const counts = Object.entries(ACTION).map(
    ([action, name]) => name + '  ' + visionServed.filter((view) => view.action === action).length,
  );
  const totals = place(
    column(
      [
        label('Seven test photos', { size: 34, color: 'dim' }),
        mono(counts.join('      '), { size: 38 }),
      ],
      { gap: 'normal' },
    ),
    batch,
  );
  s.add(
    heading(c.title),
    caption(quality, 'Visible  yes      Brightness  0.20      Blur  0.45'),
    value,
    question,
  );
  c.show('visible', checks[0], { after: true });
  c.show('quality', checks[1], { after: true });
  c.show('priority', checks[2], { after: true });
  c.swap('priority', question, result, { after: true });
  c.swap('boolean', value, invalid);
  c.hide('boolean', checks);
  c.swap('boolean', result, invalidQuestion);
  c.swap('invalid', invalidQuestion, rejected, { after: true });
  c.show('totals', totals, { after: true });
}
