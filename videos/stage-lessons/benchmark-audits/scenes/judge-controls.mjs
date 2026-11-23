import { column, place, boxOf, shift, indicate, seq, par } from 'vizmatic/stage';
import { heading, label, note, chip } from '../../kit-narrated.mjs';
import { caseBoard, MAIN, FOOT } from '../parts.mjs';
export default function judge(s, c) {
  const board = caseBoard();
  const [headers, travel, answerBand] = MAIN.rows([1, 3, 1], 'wide');
  const slots = travel.columns(2, 'loose');
  const names = ['concise', 'friendly'];
  const answers = names.map((name, i) =>
    place(
      column([chip(name, { color: i ? 'blue' : 'cyan' }), note('commander approval')], {
        gap: 'normal',
      }),
      slots[i],
    ),
  );
  const heads = ['slot A', 'slot B'].map((v, i) =>
    place(label(v, { color: 'dim' }), headers.columns(2, 'loose')[i]),
  );
  const rubric = place(note('Reviewed labels + rubric + disagreement policy'), answerBand);
  const votes = [
    'slot A → concise',
    'slot A → friendly',
    'Named winners differ → unresolved',
    'Grounded answer wins both orders',
  ].map((v) =>
    place(label(v, { color: v.includes('unresolved') ? 'yellow' : 'ink', size: 36 }), FOOT),
  );
  const destination = answers.map((a) => boxOf(a).point('center'));
  const upper = slots[0].point('top'),
    lower = slots[1].point('bottom');
  const unsupported = place(
    column([chip('missing approval', { color: 'red' }), note('on-call engineer')], {
      gap: 'normal',
    }),
    slots[0],
  );
  s.add(heading('Track names through the judge swap'), heads, answers, rubric);
  s.add(board.nodes);
  c.on('judge-controls-phase-0', () => s.play(indicate(rubric, { scale: 1, color: 'yellow' })));
  c.on('ba-judge-controls-rubric', () => s.play(indicate(answers, { scale: 1, color: 'yellow' })));
  c.on('judge-controls-phase-1', () => s.play(indicate(heads[0], { scale: 1, color: 'yellow' })));
  c.on('ba-judge-controls-tie', () => s.play(indicate(heads[0], { scale: 1, color: 'yellow' })));
  c.show('judge-first', votes[0], { after: true });
  c.on('ba-judge-controls-swap', () =>
    s.play(
      seq(
        par(
          shift(answers[0], 0, upper[1] - destination[0][1]),
          shift(answers[1], 0, lower[1] - destination[1][1]),
        ),
        par(
          shift(answers[0], destination[1][0] - destination[0][0], 0),
          shift(answers[1], destination[0][0] - destination[1][0], 0),
        ),
        par(
          shift(answers[0], 0, destination[1][1] - upper[1]),
          shift(answers[1], 0, destination[0][1] - lower[1]),
        ),
      ),
      { duration: 2.4 },
    ),
  );
  c.swap('judge-swapped', votes[0], votes[1], { after: true });
  c.swap('judge-unresolved', votes[1], votes[2], { after: true });
  c.on('ba-judge-controls-unresolved', () =>
    s.play(indicate(heads, { scale: 1, color: 'yellow' })),
  );
  c.swap('judge-controls-phase-2', answers[1], unsupported);
  c.swap('ba-judge-controls-grounded', votes[2], votes[3], { after: true });
  c.on('ba-judge-controls-truth', () => s.play(indicate(rubric, { scale: 1, color: 'yellow' })));
  c.keep(board.nodes);
}
