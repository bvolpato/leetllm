import {
  arrow,
  assertEqual,
  boxOf,
  column,
  dot,
  dynamic,
  grid,
  group,
  line,
  place,
  rect,
  row,
  table,
  to,
} from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note } from '../kit-narrated.mjs';
import {
  bundle,
  priorBundle,
  RETAINED_RELEASES,
  train,
  OFFLINE_CASES,
  HAND_FAIL,
  OFFLINE_POLICY,
  passingWindow,
  pendingWindow,
  regressingHistory,
} from '../../films/capstone-production-ml-pipeline/fixtures.mjs';
import { score, matureQuality } from '../../films/capstone-production-ml-pipeline/arithmetic.mjs';
import {
  pipelineOffline,
  probeRelease,
} from '../../films/capstone-production-ml-pipeline/model.mjs';
export {
  bundle,
  priorBundle,
  RETAINED_RELEASES,
  train,
  OFFLINE_CASES,
  HAND_FAIL,
  OFFLINE_POLICY,
  passingWindow,
  pendingWindow,
  regressingHistory,
  score,
  matureQuality,
  pipelineOffline,
  probeRelease,
};

const WARNING_COST = 2;
const MISSED_COST = 25;
export const FITTED_ROWS = OFFLINE_CASES.map((r) => {
  const pred = score(bundle, r.x) >= bundle.threshold;
  return {
    ...r,
    pred,
    cost: pred ? WARNING_COST : r.gold ? MISSED_COST : 0,
    baseline: r.gold ? MISSED_COST : 0,
  };
});
assertEqual(pipelineOffline(FITTED_ROWS).cost, 4, 'fitted offline cost');
assertEqual(pipelineOffline(FITTED_ROWS).base, 50, 'silent offline baseline');

export const COLOR = {
  request: 'cyan',
  baseline: 'blue',
  candidate: 'green',
  evidence: 'pink',
  focus: 'yellow',
  failure: 'red',
};
export const VALIDATION_STATES = {
  pass: { color: 'ink', mark: 'check' },
  fail: { color: 'red', mark: 'cross' },
  warn: { color: 'yellow', mark: 'bang' },
  pending: { color: 'dim', mark: 'ring' },
  skip: { color: 'dim', mark: 'dash' },
};
export const [BODY, RAIL] = area.rows([8, 1], 'wide');
export const STATE = {
  intro: 'failed hand fixture held',
  'feature-clocks': 'nine-minute request admitted',
  fit: 'v1 fitted',
  bundle: 'v1 retained',
  'strict-model-loader': 'v1 reload verified',
  offline: 'v1 offline evidence',
  'bound-evidence': 'v1 evidence bound',
  canary: 'passing history ready; alternative history aborted',
  'canary-window-contract': 'window contract checked',
  promotion: 'ready receipt 3 selects v1 and clears the canary',
  'alias-generation': 'illustrative v0 generation 43; expected 41 stale',
  recovery: 'v0 restored',
  'production-history': 'valid day 9 retained',
  'product-monitoring': 'four product contracts',
  synthesis: 'eval-2 retains the original miss and warns on a fitted replay',
  'fresh-stale-receipt': 'receipt 5 selects v1 and the eight-minute replay warns',
};

/** The same delivery pipeline stays at the foot of every scene. */
export function rail(scene) {
  const cells = RAIL.columns(6, 'normal');
  const names = ['scans', 'fit', 'bundle', 'offline', 'canary', 'production'];
  const stages = [
    ['feature-clocks'], ['fit'], ['bundle', 'strict-model-loader'],
    ['intro', 'offline', 'bound-evidence', 'synthesis'], ['canary', 'canary-window-contract'],
    ['promotion', 'alias-generation', 'recovery', 'production-history', 'product-monitoring', 'fresh-stale-receipt'],
  ];
  return names.map((name, i) =>
    place(column([
      dot(7, stages[i].includes(scene) ? 'cyan' : 'grid'),
      note(name, {color: stages[i].includes(scene) ? 'cyan' : 'dim'}),
    ], { gap: 'tight', align: 'center' }), cells[i]),
  );
}
export function open(s, c, title = heading(c.title)) {
  const track = rail(c.id);
  s.add(title);
  if (c.id === 'intro') s.add(track);
  else c.take(track);
  if (c.id !== 'fresh-stale-receipt') c.keep(track);
  return track;
}

/** The line and every evaluation dot follow one fitted computation. */
export function delayPlot(
  s,
  region,
  {
    model = bundle,
    training = true,
    evaluation = false,
    lineVisible = false,
    compact = false,
  } = {},
) {
  const [head, panel, foot] = region.rows(compact ? [2, 7, 2] : [1, 7, 1], 'normal');
  const plot = compact ? panel.inset('tight').columns([1, 10, 1], 'none')[1] : panel.inset('loose');
  const px = (x) => plot.left + ((x + 0.8) / 11.6) * plot.width;
  const py = (y) => plot.bottom - ((y + 0.2) / 1.4) * plot.height;
  const lineOn = s.value(lineVisible ? 1 : 0),
    evalOn = s.value(evaluation ? 1 : 0),
    trainOn = s.value(training ? 1 : 0);
  const center = s.value(model.center),
    scale = s.value(model.scale),
    slope = s.value(model.slope),
    intercept = s.value(model.intercept);
  const current = () => ({
    center: center.value,
    scale: scale.value,
    slope: slope.value,
    intercept: intercept.value,
    threshold: model.threshold,
  });
  const threshold = group(
    line([plot.left, py(model.threshold)], [plot.right, py(model.threshold)], {
      stroke: 'yellow',
      width: 2,
      dash: [10, 8],
    }),
  );
  const frame = group(
    line([plot.left, py(0)], [plot.right, py(0)], { stroke: 'dim', width: 2 }),
    line([px(0), plot.top], [px(0), plot.bottom], { stroke: 'dim', width: 2 }),
    ...[0, 5, 10].flatMap((x) => [
      line([px(x), plot.bottom], [px(x), plot.bottom + 10], { stroke: 'dim' }),
      mono(String(x), { color: 'dim', size: 34 }).moveTo([px(x), plot.bottom + 35]),
    ]),
    ...[0, 0.5, 1].map((y) =>
      mono(String(y), { color: y === 0.5 ? 'yellow' : 'dim', size: 34 }).moveTo([
        plot.left - 55,
        py(y),
      ]),
    ),
  );
  const names = [
    place(label('delay → decision score', { color: 'cyan' }), head),
    place(note('minutes     •     threshold 0.5'), foot),
  ];
  const marks = dynamic(() => {
    const m = current();
    return [
      ...(lineOn.value > 0.01
        ? [
            line(
              [px(0), py(m.intercept + (score(m, 0) - m.intercept) * lineOn.value)],
              [px(10), py(m.intercept + (score(m, 10) - m.intercept) * lineOn.value)],
              { stroke: 'green', width: 5 },
            ).opacity(lineOn.value),
          ]
        : []),
      ...(trainOn.value > 0.01
        ? train.map((r) =>
            dot(10, 'dim')
              .moveTo([px(r.x), py(r.y)])
              .opacity(trainOn.value),
          )
        : []),
      ...(evalOn.value > 0.01
        ? OFFLINE_CASES.map((r) =>
            dot(13, 'cyan')
              .moveTo([px(r.x), py(score(m, r.x))])
              .opacity(evalOn.value),
          )
        : []),
    ];
  });
  return {
    nodes: [frame, threshold, names, marks],
    lineOn,
    evalOn,
    trainOn,
    center,
    scale,
    slope,
    intercept,
    current,
    px,
    py,
  };
}

/** Both retained computations, their byte identities, and one routed probe. */
export function releaseBench(s, region = BODY, selected = 'v0', qualified = false) {
  const [middle, footer] = region.rows([7, 1], 'normal');
  const [result, qualification] = qualified ? footer.columns([2, 3], 'wide') : [footer, footer];
  const status = result;
  const [left, control, right] = middle.columns([3, 2, 3], 'wide');
  const packet = (id, target, color) => {
    const model = id === 'v0' ? priorBundle : bundle;
    const [name, fields, digest] = target.rows([1, 8, 1], 'normal');
    const title = place(
      label(id === 'v0' ? 'v0 • retained' : 'v1 • fitted', { color, size: 32 }),
      name,
    );
    const cells = place(
      table(
        [
          { key: 'field', label: 'saved' },
          { key: 'value', label: 'value', mono: true },
        ],
        [
          { id: 'center', field: 'center', value: model.center },
          { id: 'scale', field: 'range', value: model.scale },
          { id: 'slope', field: 'slope', value: model.slope.toFixed(1) },
          { id: 'intercept', field: 'intercept', value: model.intercept.toFixed(1) },
          { id: 'threshold', field: 'threshold', value: model.threshold },
        ],
        { states: VALIDATION_STATES, size: 32, width: fields.width, leading: 1.5 },
      ),
      fields,
    );
    const hash = place(
      mono(RETAINED_RELEASES[id].sha256.slice(0, 12), { size: 30, color: 'dim' }),
      digest,
    );
    return { nodes: [title, cells, hash], title, cells, target };
  };
  const v0 = packet('v0', left, 'blue'),
    v1 = packet('v1', right, 'green');
  const selector = s.value(selected === 'v1' ? 1 : 0);
  const [aliasRoom, probeRoom] = control.rows(2, 'wide');
  const alias = place(
    namedBox('production', { width: aliasRoom.width, height: 85, color: 'yellow' }),
    aliasRoom,
  );
  const request = place(
    column(
      [label('same probe', { color: 'cyan' }), mono('delay 9 min', { size: 34, color: 'cyan' })],
      { gap: 'normal' },
    ),
    probeRoom,
  );
  const a = boxOf(alias).point('left'),
    b = boxOf(alias).point('right');
  const zero = boxOf(v0.cells).point('right'),
    one = boxOf(v1.cells).point('left');
  const switchY = middle.top - 24;
  const switchA = [left.point('center')[0], switchY];
  const switchB = [right.point('center')[0], switchY];
  const switchTrack = line(switchA, switchB, { stroke: 'grid', width: 3 });
  const switchMark = dynamic(() =>
    dot(11, 'yellow').moveTo([switchA[0] + (switchB[0] - switchA[0]) * selector.value, switchY]),
  );
  const routes = dynamic(() => [
    arrow(a, zero, { stroke: selector.value < 0.5 ? 'yellow' : 'grid', width: 5, pad: 12 }),
    arrow(b, one, { stroke: selector.value >= 0.5 ? 'yellow' : 'grid', width: 5, pad: 12 }),
  ]);
  const readOn = s.value(0);
  const output = dynamic(() => {
    if (readOn.value < 0.01) return [];
    const id = selector.value < 0.5 ? 'v0' : 'v1',
      p = probeRelease(id, 9);
    return [
      group(
        ...place(
          row(
            [
              mono(`${id}: ${p.score.toFixed(2)}`, { color: id === 'v1' ? 'green' : 'blue' }),
              label(p.warning ? 'WARN' : 'SILENT', { color: 'yellow' }),
            ],
            { gap: 'wide' },
          ),
          result,
        ).nodes,
      ).opacity(readOn.value),
    ];
  });
  const caption = [];
  return {
    nodes: [v0.nodes, v1.nodes, alias, request, switchTrack, switchMark, routes, output, caption],
    v0,
    v1,
    alias,
    request,
    selector,
    readOn,
    status,
    result,
    qualification,
  };
}

assertEqual(Number(score(bundle, 9).toFixed(2)), 0.98, 'nine-minute fitted score');
assertEqual(pipelineOffline(HAND_FAIL).recall, 0.5, 'failed critical recall');
assertEqual(matureQuality(passingWindow).candidateCost, 92, 'four mature canary costs');
