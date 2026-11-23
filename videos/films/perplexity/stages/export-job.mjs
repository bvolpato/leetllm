import { answerChecks } from '../arithmetic.mjs';
import { spokenCue } from '../construction.mjs';
import { drawText } from '../defaults.mjs';
import { FRESH_ANSWERS, FRESH_CONTRACT } from '../fixtures.mjs';

export default {
  id: 'export-job',
  cues: ['fresh-job-contract', 'cedar-fields', 'pine-fields', 'fresh-cedar', 'fresh-pass'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const checked = ['fresh-cedar', 'fresh-pass'].map(
      (id) => spokenCue(scene, state, id).phase === 'after',
    );
    const rows = ['status', 'source', 'automatic'];
    const label = (field, value) =>
      field === 'automatic' ? (value ? 'on' : 'off') : value.replace('_', ' ');
    drawText(ctx, api, 'Field', 170, 340, 54, C.ink);
    api.focus.target('fresh-contract', () => {
      drawText(ctx, api, 'Required', 745, 340, 46, C.yellow, 'center');
      rows.forEach((field, i) =>
        drawText(
          ctx,
          api,
          label(field, FRESH_CONTRACT[field]),
          745,
          525 + i * 120,
          42,
          C.yellow,
          'center',
        ),
      );
    });
    ['Status', 'Source', 'Automatic deletion'].forEach((name, i) =>
      drawText(ctx, api, name, 170, 525 + i * 120, 40, C.muted),
    );
    FRESH_ANSWERS.forEach((answer, i) => {
      const x = 1175 + i * 440;
      const dealt = spokenCue(scene, state, i === 0 ? 'cedar-fields' : 'pine-fields').progress;
      api.focus.target(i === 0 ? 'cedar-answer' : 'pine-answer', () => {
        drawText(ctx, api, answer.id, x, 340, 50, C.ink, 'center');
        if (dealt > 0) drawText(ctx, api, 'PPL ' + answer.ppl, x, 405, 33, C.muted, 'center');
        const passes = answerChecks(answer, FRESH_CONTRACT);
        rows.forEach((field, j) => {
          if (dealt * rows.length < j + 1) return;
          const color = checked[i] ? (passes[j] ? C.green : C.pink) : C.ink;
          drawText(ctx, api, label(field, answer[field]), x, 525 + j * 120, 42, color, 'center');
        });
      });
    });
    api.focus.target('fresh-checks', () => {
      api.line(ctx, 170, 836, 1770, 836, C.muted, 2);
      if (checked[0]) drawText(ctx, api, '1 of 3 pass', 1175, 928, 43, C.pink, 'center');
      if (checked[1]) drawText(ctx, api, '3 of 3 pass', 1615, 928, 43, C.green, 'center');
      if (!checked[0] && spokenCue(scene, state, 'pine-fields').phase === 'after')
        drawText(ctx, api, 'Which answer clears all three checks?', 960, 928, 44, C.ink, 'center');
    });
  },
};
