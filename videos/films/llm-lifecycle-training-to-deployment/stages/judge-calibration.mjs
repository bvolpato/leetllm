import { sceneCues } from '../picture.mjs';

const answers = [
  { id: 'A', words: 'Eligible. No job ran.' },
  { id: 'B', words: 'Rotation completed.' },
];

export function drawJudgeCalibration(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  const swap = cue.progress('judge-swap');
  const arc = Math.sin(Math.PI * swap) * 108;
  api.focus.target('judge-calibration-mechanism', () => {
    api.text(ctx, 'K10234   ·   Eligible under P-7   ·   No rotation ran', 125, 246, 38, C.ink);
    [560, 1360].forEach((x, i) =>
      api.text(ctx, 'Position ' + (i + 1), x, 343, 33, C.muted, 'center'),
    );
    answers.forEach(({ id, words }, i) => {
      const x = i ? 1360 - 800 * swap : 560 + 800 * swap;
      const y = 510 + (i ? arc : -arc);
      const color = i ? C.cyan : C.blue;
      api.rect(ctx, x - 305, y - 55, 610, 106, C.panel, color, 12);
      api.text(ctx, id, x - 262, y + 14, 42, color);
      api.text(ctx, words, x + 36, y + 14, 38, C.ink, 'center');
    });
    api.line(ctx, 125, 680, 1780, 680, C.muted, 2);
    api.text(ctx, 'Ballot 1   ·   A then B', 425, 759, 34, C.muted, 'center');
    api.text(ctx, 'Ballot 2   ·   B then A', 1430, 759, 34, C.muted, 'center');
    api.text(ctx, cue.after('judge-first') ? 'Picked A' : '…', 425, 838, 48, C.ink, 'center');
    api.text(ctx, cue.after('judge-second') ? 'Picked B' : '…', 1430, 838, 48, C.ink, 'center');
    let bottom = '';
    if (state.beat === 0 && cue.started('judge-question'))
      bottom = 'What stayed the same about the two choices?';
    if (cue.after('judge-position')) bottom = 'First position twice   ·   Two different winners';
    if (state.beat === 2)
      bottom = 'Check length and model family in separate, controlled comparisons';
    if (bottom) api.text(ctx, bottom, 960, 965, 39, C.yellow, 'center');
  });
}
export default {
  id: 'judge-calibration',
  draw: drawJudgeCalibration,
  cues: ['judge-first', 'judge-swap', 'judge-second', 'judge-question', 'judge-position'],
};
