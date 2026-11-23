import {
  arrow,
  boxOf,
  column,
  dot,
  fitted,
  indicate,
  pictogram,
  pipeline,
  place,
  to,
} from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { repositoryContext, rows, wrongRow, score } from '../parts.mjs';

export default function localHook(s, c) {
  const { main } = repositoryContext(s, c);
  const [installBand, copyBand, routeBand, foot] = main.rows([3, 1, 3, 1], 'wide');
  const halves = installBand.columns(2, 'loose');
  const source = place(
    column(
      [
        pictogram('workflow', { size: 110, color: 'cyan' }),
        mono('scripts/pre-commit-ai-eval.sh', { size: 34, color: 'cyan' }),
        note('tracked source'),
      ],
      { gap: 'normal' },
    ),
    halves[0],
  );
  const target = place(
    column(
      [
        pictogram('disk', { size: 110, color: 'dim' }),
        mono('.git/hooks/pre-commit', { size: 34, color: 'pink' }),
        note('private to this clone'),
      ],
      { gap: 'normal' },
    ),
    halves[1],
  );
  const installed = place(
    pictogram('check', { size: 50, color: 'green' }),
    halves[1].rows([1, 4], 'none')[0],
    'right',
  );
  const copyPlaces = copyBand.columns(2, 'loose');
  const copy = dot(15, 'cyan').moveTo(copyPlaces[0].point('center'));
  const copyRoute = arrow(copyPlaces[0].point('center'), copyPlaces[1].point('center'), {
    stroke: 'dim',
    pad: 18,
  });
  const flow = place(
    fitted(routeBand, (width) =>
      pipeline(['commit', 'hook', 'run_eval.sh', 'record'], { width, gates: true, size: 34 }),
    ),
    routeBand,
  );
  const result = score([...rows, wrongRow]);
  const stopped = place(
    mono(`${result.correct}/${result.total}: commit stopped`, { size: 40, color: 'red' }),
    foot,
  );
  s.add(source, target, copyRoute, flow);
  c.show('install-hook', copy, { fade: 0.1 });
  c.on(
    'install-hook',
    () => s.play(to(copy, (n) => n.moveTo(copyPlaces[1].point('center')), { duration: 1.1 })),
    0.15,
  );
  c.hide('install-hook', copy, { lead: -1.4, fade: 0.1 });
  c.show('install-hook', installed, { after: true });
  c.on('hook-input', () =>
    s.play(flow.put({ id: 'run', badge: `${result.total} rows` }, { duration: 0.4 })),
  );
  c.on('hook-runs', () => s.play(flow.move('run', 1, { duration: 0.7 })));
  c.on('hook-scorer', () => s.play(flow.move('run', 2, { duration: 0.7 })));
  c.after('hook-failure', () =>
    s.play(flow.stop('run', `${result.correct}/${result.total}`, { duration: 0.5 })),
  );
  c.show('hook-failure', stopped, { after: true });
  c.clear([copyRoute, ...flow.laneNodes], 0.46, 0.2);
}
