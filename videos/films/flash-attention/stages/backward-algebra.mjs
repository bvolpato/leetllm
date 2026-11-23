import { SCORES, VALUES } from '../fixtures.mjs';
import { attentionBackwardRow } from '../model.mjs';
import { rowClock, words } from '../row-workspace.mjs';

export function drawBackwardAlgebra(ctx, scene, state, api) {
  const { C } = api,
    clock = rowClock(scene, state);
  const g = attentionBackwardRow(SCORES, VALUES, 1);
  if (state.beat < 2) {
    const x = (v) => 248 + (v - 10) * 45;
    const moving = clock.started('raise-score') && !clock.started('distance');
    const step = moving ? clock.progress('raise-score') : 0;
    const score = SCORES[1] + step;
    const output = moving
      ? attentionBackwardRow([SCORES[0], score, SCORES[2]], VALUES).output
      : g.output;
    api.focus.target('value-ruler', () => {
      api.text(ctx, 'Value carried by each key', 175, 241, 37, C.muted);
      api.text(ctx, 'Score for “this”   ' + score.toFixed(2), x(20), 327, 39, C.yellow, 'center');
      api.line(ctx, x(10), 470, x(40), 470, C.muted, 4);
      for (const [i, v] of VALUES.entries()) {
        api.circle(ctx, x(v), 470, 11, C.blue);
        api.text(ctx, words[i] + '   ' + v, x(v), 424, 38, C.blue, 'center');
      }
      if (moving) {
        api.line(ctx, x(g.output), 448, x(g.output), 492, C.muted, 3);
      }
      api.line(ctx, x(output), 447, x(output), 502, C.yellow, 5);
      api.text(ctx, 'Output  ' + output.toFixed(3), x(output), 554, 38, C.yellow, 'center');
      if (clock.started('distance'))
        api.arrow(ctx, x(g.output) - 15, 492, x(20) + 8, 492, C.pink, 5);
    });
    api.focus.target('grad-table', () => {
      api.text(ctx, 'Score derivative', 140, 728, 36, C.muted);
      for (const [i, v] of VALUES.entries()) {
        const visible = clock.done('all-slopes') || (i === 1 && clock.done('score-slope'));
        const col = visible ? (g.ds[i] < 0 ? C.pink : C.green) : C.muted;
        api.text(ctx, words[i], 715 + i * 407, 686, 31, C.muted, 'center');
        api.text(ctx, visible ? g.ds[i].toFixed(3) : '?', 715 + i * 407, 765, 51, col, 'center');
      }
    });
    const note = clock.done('grad-sum')
      ? 'Same shift to all scores   →   same blend'
      : clock.started('distance')
        ? 'For this row,   ∂O / ∂score = probability × (value − output)'
        : moving
          ? 'More weight on 20 pulls the output toward 20'
          : 'Give “this” a higher score. Which way does the output move?';
    api.focus.target('grad-note', () => api.text(ctx, note, 960, 946, 39, C.ink, 'center'));
    return;
  }
  api.focus.target('value-path', () => {
    api.text(ctx, 'Through the values', 160, 302, 42, C.cyan);
    api.math(ctx, 'dV=P^{\\mathsf T}dO', 160, 435, 52, C.ink);
  });
  api.focus.target('score-path', () => {
    api.text(ctx, 'Through the scores', 918, 302, 42, C.blue);
    if (clock.started('prob-path')) api.math(ctx, 'dP=dO\\,V^{\\mathsf T}', 918, 435, 52, C.ink);
    if (clock.started('row-correction'))
      api.math(ctx, 'D_i=\\sum_j P_{ij}dP_{ij}=dO_i\\cdot O_i', 918, 558, 45, C.yellow);
    if (state.beat === 3) api.math(ctx, 'dS_{ij}=P_{ij}(dP_{ij}-D_i)', 918, 687, 47, C.ink);
  });
  if (state.beat === 3)
    api.focus.target('qk-path', () => {
      api.line(ctx, 160, 764, 1740, 764, C.muted, 2);
      if (clock.done('qk-grad')) {
        api.math(ctx, 'dQ=dS\\,K/\\sqrt d', 225, 906, 50, C.cyan);
        api.math(ctx, 'dK=dS^{\\mathsf T}Q/\\sqrt d', 980, 906, 50, C.cyan);
      } else api.text(ctx, 'Back through the scaled query–key dot product', 160, 897, 42, C.ink);
    });
}

export default {
  id: 'backward-algebra',
  draw: drawBackwardAlgebra,
  cues: [
    'gradient-question',
    'raise-score',
    'distance',
    'score-slope',
    'all-slopes',
    'grad-sum',
    'value-path',
    'prob-path',
    'row-correction',
    'derive-score',
    'qk-grad',
  ],
};
