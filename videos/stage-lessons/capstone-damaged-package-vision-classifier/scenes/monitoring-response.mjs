import { column, dot, grid, place, rect, to } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { cast, work } from '../parts.mjs';
export default function scene(s, c) {
  const photoCast = cast(s, c);
  s.add(heading('Capture evidence arrives before accuracy evidence'));
  const [top, body, foot] = work.rows([1, 5, 1], 'wide');
  const lanes = body.rows(2, 'loose');
  const [nowHead, nowTrack] = lanes[0].columns([2, 4], 'wide');
  const [laterHead, laterTrack] = lanes[1].columns([2, 4], 'wide');
  const immediate = place(
    column(
      [
        label('Capture now', { color: 'cyan' }),
        note('brightness · blur'),
        note('presence · latency'),
      ],
      { gap: 'normal' },
    ),
    nowHead,
  );
  const delayed = place(
    column(
      [
        label('Labels later', { color: 'green' }),
        note('misses · precision'),
        note('source · packaging'),
      ],
      { gap: 'normal' },
    ),
    laterHead,
  );
  const rails = [
    place(rect(nowTrack.width, 6, { fill: 'grid', stroke: null }), nowTrack),
    place(rect(laterTrack.width, 6, { fill: 'grid', stroke: null }), laterTrack),
  ];
  const capture = place(dot(22, 'cyan'), nowTrack, 'left');
  const outcome = place(dot(22, 'green'), laterTrack, 'left');
  const name = place(
    label('One served route retains both evidence channels.', { color: 'dim', size: 34 }),
    top,
  );
  const action = place(
    label('Investigate capture. Request better evidence.', { color: 'yellow', size: 34 }),
    foot,
  );
  const candidate = place(
    label('Drift → candidate → evaluated promotion', { color: 'yellow', size: 34 }),
    foot,
  );
  const retain = place(
    label('Keep the original route and complete original bundle.', { color: 'yellow', size: 34 }),
    foot,
  );
  s.add(immediate, delayed, rails, capture, outcome, name);
  c.on('now', () => s.play(to(capture, (n) => place(n, nowTrack, 'right'), { duration: 2 })));
  c.show('investigate', action);
  c.on('later', () => s.play(to(outcome, (n) => place(n, laterTrack, 'right'), { duration: 2 })));
  c.swap('candidate', action, candidate, { after: true });
  c.swap('retain', candidate, retain);
}
