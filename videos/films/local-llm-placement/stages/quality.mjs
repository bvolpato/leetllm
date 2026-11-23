import { evaluate } from '../model.mjs';
import { outputs } from '../fixtures.mjs';
import { cueProgress } from '../worksheet.mjs';

export function drawQuality(ctx, scene, state, api) {
  const { C, focus } = api,
    p = cueProgress(scene, state, api);
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const a = evaluate(outputs.baseline),
    b = evaluate(outputs.candidate);
  const count = Math.ceil(a.rows.length * p('pair-outputs'));
  const flagMissing = a.rows[0].pass && !b.rows[0].pass;
  focus.target('paired-cases', () => {
    text('Same four prompts   /   supplied output strings', 135, 251, 33, C.muted);
    text('Check', 135, 360, 32, C.muted);
    text('Baseline', 675, 360, 32, C.muted);
    text('Smaller candidate', 1110, 360, 32, C.muted);
    a.rows.forEach((row, i) => {
      const y = 439 + i * 77;
      text(row.id + (row.critical ? '  ★' : ''), 135, y, 36, row.critical ? C.yellow : C.ink);
      for (const [j, result] of [row, b.rows[i]].entries()) {
        const visible = i < count;
        text(
          visible ? (result.pass ? 'Pass' : 'Fail') : 'Pending',
          j === 0 ? 675 : 1110,
          y,
          35,
          visible ? (result.pass ? C.green : C.pink) : C.muted,
        );
      }
    });
    if (count === a.rows.length) {
      text('Pass count', 135, 762, 32);
      text(a.score + ' / 4', 675, 762, 39);
      text(b.score + ' / 4', 1110, 762, 39);
    }
  });
  focus.target('command-pair', () => {
    if (state.beat === 0) {
      text(
        p('ask-quality') > 0
          ? 'Can we promote the candidate if rollback flags are protected?'
          : '★ The rollback draft must keep its confirmation flag.',
        135,
        921,
        39,
        C.yellow,
      );
    } else {
      text('Expected', 135, 866, 31, C.muted);
      text(outputs.baseline[0], 430, 866, 39, C.green);
      text('Candidate', 135, 949, 31, C.muted);
      text(outputs.candidate[0], 430, 949, 39, C.ink);
      if (p('read-flag') > 0 && flagMissing) text('Missing   --confirm', 1120, 949, 37, C.pink);
    }
  });
}
export default {
  id: 'quality',
  draw: drawQuality,
  cues: ['pair-outputs', 'ask-quality', 'better-abstention', 'read-flag', 'preserve-pair'],
};
