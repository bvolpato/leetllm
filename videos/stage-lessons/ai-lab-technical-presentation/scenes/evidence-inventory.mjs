import { line, draw, place } from 'vizmatic/stage';
import { label } from '../../kit-narrated.mjs';
import { addTitle, work, caption, ledger, CASE } from '../parts.mjs';

export default function evidenceInventory(s, c) {
  addTitle(s, c);
  const [upper, lower] = work.rows([2.4, 1]);
  const evidence = ledger(
    upper,
    [
      { key: 'Claim', width: 292 },
      { key: 'Owner', width: 160 },
      { key: 'Artifact', width: 330 },
      { key: 'Duration', width: 600 },
    ],
    [
      { id: 'work', Claim: 'Repeated work', Artifact: 'Integration histories', Owner: ' ' },
      { id: 'safe', Claim: 'Tenant-safe lookup', Artifact: 'Adapter contract test', Owner: ' ' },
      { id: 'store', Claim: 'Store behavior', Artifact: 'Store-call span', Owner: ' ' },
    ],
    { leading: 3.4 },
  );
  const initial = caption(lower, 'Which part did the presenter change?', 'dim');
  const window = caption(lower, 'Onboarding window    ·    start to finish');
  const record = evidence.region('work', 'Duration').inset('tight');
  const [durations, delta] = record.columns([2.2, 1], 'normal');
  const measures = durations.rows(2, 'tight').map((band, i) => {
    const [ruler, value] = band.columns([2, 1], 'normal');
    const days = i ? CASE.daysAfter : CASE.daysBefore;
    const color = i ? 'cyan' : 'blue';
    const [x, y] = ruler.point('left');
    const mark = line([x, y], [x + (ruler.width * days) / CASE.daysBefore, y], {
      stroke: color,
      width: 10,
    });
    const name = place(label(days + ' days', { color, size: 30 }), value, 'left');
    return { mark, name };
  });
  const difference = caption(delta, CASE.daysBefore - CASE.daysAfter + ' fewer days', 'yellow', 30);
  const limit = caption(
    lower,
    'Observed difference    ·    source mix and staffing can also change',
    'yellow',
    37,
  );
  s.add(evidence, initial);
  c.on('problem', () => s.play(evidence.light('work')));
  c.on('correct', () => s.play(evidence.light('safe')));
  c.on('sources', () => s.play(evidence.light('work', 'Artifact')));
  c.on('owner', () =>
    s.play(evidence.setCell('safe', 'Owner', 'Presenter'), evidence.light('safe')),
  );
  c.on('store', () =>
    s.play(evidence.setCell('store', 'Owner', 'Store team'), evidence.light('store')),
  );
  c.on('duration', () => s.play(evidence.light('work', 'Artifact')));
  c.swap('period', initial, window);
  c.on('windows', () => s.play(...measures.map(({ mark }) => draw(mark)), { duration: 0.65 }));
  c.show(
    'windows',
    measures.map(({ name }) => name),
    { after: true },
  );
  c.show('delta', difference, { after: true });
  c.swap('cause', window, limit, { after: true });
}
