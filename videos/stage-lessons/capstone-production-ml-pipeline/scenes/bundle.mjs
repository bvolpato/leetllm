import { column, dot, dynamic, place, row, table } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import {
  VALIDATION_STATES,
  BODY,
  FITTED_ROWS,
  pipelineOffline,
  bundle,
  delayPlot,
  open,
  score,
} from '../parts.mjs';
export default function bundleScene(s, c) {
  const [main, foot] = BODY.rows([6, 1], 'wide');
  const [picture, packageRoom] = main.columns([4, 3], 'loose');
  const [graphRoom, compareRoom] = picture.rows([6, 4], 'wide');
  const plot = delayPlot(s, graphRoom, {
    training: false,
    evaluation: true,
    lineVisible: true,
    compact: true,
  });
  const t = place(
    table(
      [
        { key: 'field', label: 'release contents' },
        { key: 'saved', label: 'retained', sample: 'proposed only', marks: true },
      ],
      [
        {
          id: 'model',
          field: 'slope + intercept',
          saved: `${bundle.slope.toFixed(1)} + ${bundle.intercept}`,
        },
        { id: 'transform', field: 'center / range', saved: 'missing' },
        { id: 'schema', field: 'schema / threshold', saved: 'missing' },
        { id: 'build', field: 'training / builder', saved: 'missing' },
        { id: 'monitor', field: 'monitor identity', saved: 'proposed only' },
      ],
      { states: VALIDATION_STATES, size: 34, width: packageRoom.width, leading: 2 },
    ),
    packageRoom,
  );
  const [requestsRoom, pathsRoom, outputsRoom] = compareRoom.rows([2, 4, 4], 'tight');
  const requests = place(
    mono('eval-1: 9 min • eval-2: 8 min', { size: 29, color: 'cyan' }),
    requestsRoom,
  );
  const paths = pathsRoom.columns(2, 'wide'),
    outputs = outputsRoom.columns(2, 'wide');
  const computations = paths.map((r, i) =>
    place(
      column(
        [
          note(i ? 'reloaded v1' : 'original v1', { color: 'green' }),
          mono('z → 0.5 + 1.2z', { size: 29, color: 'dim' }),
        ],
        { gap: 'none' },
      ),
      r,
    ),
  );
  const matching = outputs.map((r) =>
    place(
      column(
        [
          mono('eval-1: ' + score(bundle, 9).toFixed(2), { size: 29, color: 'green' }),
          mono('eval-2: ' + score(bundle, 8).toFixed(2), { size: 29, color: 'green' }),
        ],
        { gap: 'none' },
      ),
      r,
    ),
  );
  const reload = s.value(0);
  const probes = dynamic(() =>
    reload.value <= 0 || reload.value >= 1
      ? []
      : paths.flatMap((r, i) =>
          [0, 1].map((j) => {
            const t = Math.min(1, Math.max(0, reload.value * 1.1 - j * 0.1));
            const start = requestsRoom.point('bottom'),
              gate = [r.left + 18 + j * 18, r.top],
              end = [gate[0], outputs[i].top];
            const a = t < 0.4 ? start : gate,
              b = t < 0.4 ? gate : end,
              u = t < 0.4 ? t / 0.4 : (t - 0.4) / 0.6;
            return dot(8, 'cyan').moveTo([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
          }),
        ),
  );
  const probeRooms = foot.columns(4, 'wide');
  const missing = place(label('missing delay', { color: 'cyan', size: 34 }), probeRooms[0]);
  const mean = place(mono('mean ' + bundle.center, { color: 'green', size: 34 }), probeRooms[1]);
  const missingScore = place(
    mono('score ' + score(bundle, null).toFixed(2), { color: 'green', size: 34 }),
    probeRooms[2],
  );
  const warning = place(label('≥ 0.5 → WARN', { color: 'yellow', size: 34 }), probeRooms[3]);
  const missingProgress = s.value(0);
  const missingDot = dynamic(() => {
    if (missingProgress.value <= 0 || missingProgress.value >= 3) return [];
    const k = Math.floor(missingProgress.value),
      t = missingProgress.value - k;
    const a = probeRooms[k].point('top'),
      b = probeRooms[k + 1].point('top');
    return [dot(10, 'cyan').moveTo([a[0] + (b[0] - a[0]) * t, a[1]])];
  });
  const probe = [missing, mean, missingScore, warning, missingDot];
  const bad = place(label('schema mismatch → stop before inference', { color: 'red' }), foot);
  const tuple = place(
    note(
      'Proposed production tuple: data • feature • model • action • policy • monitor • previous',
    ),
    foot,
  );
  const cost = place(
    label(
      `Synthetic offline cost: ${pipelineOffline(FITTED_ROWS).cost} units versus ${pipelineOffline(FITTED_ROWS).base}`,
      { color: 'yellow' },
    ),
    foot,
  );
  open(s, c);
  s.add(plot.nodes, t, requests, computations, probes);
  c.on('bundle-b1-1', () =>
    s.play(
      t.setCell('transform', 'saved', `${bundle.center} / ${bundle.scale}`),
      t.light('transform'),
    ),
  );
  c.on('bundle-b1-2', () =>
    s.play(t.setCell('schema', 'saved', `delay-v1 / ${bundle.threshold}`), t.light('schema')),
  );
  c.on('bundle-build', () => s.play(t.setCell('build', 'saved', 'retained'), t.light('build')));
  c.on('bundle-b1-3', () => s.play(reload.to(1, { duration: 1.0 })));
  c.show('bundle-b1-3', matching, { after: true });
  c.show(1, [missing, missingDot]);
  c.show('bundle-b2-1', mean, { after: true });
  c.on('bundle-b2-1', () => s.play(t.light('transform'), missingProgress.to(1, { duration: 0.8 })));
  c.on('bundle-b2-score', () => s.play(missingProgress.to(2, { duration: 0.7 })));
  c.show('bundle-b2-score', missingScore, { after: true, lead: 0 });
  c.on('bundle-b2-2', () => s.play(missingProgress.to(3, { duration: 0.7 })));
  c.show('bundle-b2-2', warning, { after: true, lead: 0 });
  c.hide('bundle-b2-3', probe);
  c.hide('bundle-b2-3', matching);
  c.on('bundle-b2-3', () =>
    s.play(
      t.setCell('schema', 'saved', { value: 'wrong / 0.5', state: 'pending' }),
      t.light('schema'),
    ),
  );
  c.show('bundle-stop', bad, { after: true });
  c.after('bundle-stop', () =>
    s.play(t.setCell('schema', 'saved', { value: 'wrong / 0.5', state: 'fail' })),
  );
  c.on('bundle-extension-3', () =>
    s.play(
      t.setCell('schema', 'saved', { value: 'delay-v1 / ' + bundle.threshold, state: 'pass' }),
    ),
  );
  c.show('bundle-extension-3', matching);
  c.swap('bundle-extension-3', bad, tuple);
  c.on('bundle-monitor-limit', () =>
    s.play(t.light('monitor'), t.setCell('monitor', 'saved', { value: 'absent', state: 'warn' })),
  );
  c.swap('pipe-result-trained-cost-receipt', tuple, cost, { after: true });
}
