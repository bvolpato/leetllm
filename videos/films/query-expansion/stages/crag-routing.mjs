import { correctionPath } from '../model.mjs';
import { spoken } from '../construction.mjs';

const cases = [
  { grades: [0.81, 0.12], beat: 0, cue: 'crag-grade' },
  { grades: [0.45, 0.12], beat: 1, cue: 'crag-mid' },
  { grades: [0.17, 0.12], beat: 2, cue: 'crag-low' },
];
export function drawCragRouting(ctx, scene, state, api) {
  const { C, focus } = api;
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const selected = cases.filter((item) => spoken(state, item.beat, item.cue) > 0).at(-1);
  const score = selected && Math.max(...selected.grades);
  const chosen = selected && correctionPath(score);
  const reveal =
    selected &&
    spoken(
      state,
      selected.beat,
      ['crag-internal', 'crag-combined', 'crag-external'][selected.beat],
    ) === 1;
  const denied = spoken(state, 3, 'crag-permission') === 1;
  focus.target('crag-score', () => {
    label('Two retrieved pages', 135, 265, 34, C.muted);
    label(selected ? 'E1   ' + selected.grades[0].toFixed(2) : 'E1   ?', 680, 284, 52);
    label(selected ? 'E2   ' + selected.grades[1].toFixed(2) : 'E2   ?', 1235, 284, 52);
  });
  const x = (n) => 180 + n * 1560;
  api.line(ctx, x(0), 500, x(1), 500, C.muted, 5);
  for (const v of [0, 0.2, 0.7, 1]) {
    api.line(ctx, x(v), 483, x(v), 520, C.muted, 4);
    label(v.toFixed(1), x(v), 574, 39, C.ink, 'center');
  }
  if (selected)
    focus.target('crag-score', () => {
      label('Best  ' + score.toFixed(2), x(score), 398, 40, C.yellow, 'center');
      api.line(ctx, x(score), 420, x(score), 477, C.yellow, 5);
      api.circle(ctx, x(score), 500, 12, C.yellow);
    });
  const bands = [
    ['external', 0.1, 'Below 0.2', 'External'],
    ['combined', 0.45, '0.2 through 0.7', 'Both sources'],
    ['internal', 0.85, 'Above 0.7', 'Internal'],
  ];
  bands.forEach(([id, mid, rule, name]) => {
    const color = reveal && id === chosen ? C.green : C.ink;
    label(rule, x(mid), 685, 32, C.muted, 'center');
    focus.target('crag-consequence', () => label(name, x(mid), 767, 45, color, 'center'));
  });
  const outcome = {
    internal: 'Refine the internal passages.',
    combined: 'Combine refined internal and approved external evidence.',
    external: 'Discard the internal hits. Check permission for an external search.',
  };
  const caption = denied
    ? 'Private policy   ·   0 web calls   ·   seek an authorized internal source'
    : reveal
      ? outcome[chosen]
      : 'Which sources should supply the next passages?';
  focus.target('crag-consequence', () =>
    label(caption, 960, 947, 37, denied ? C.pink : C.yellow, 'center'),
  );
}
export default {
  id: 'crag-routing',
  draw: drawCragRouting,
  cues: [
    'crag-grade',
    'crag-internal',
    'crag-mid',
    'crag-combined',
    'crag-low',
    'crag-external',
    'crag-permission',
  ],
};
