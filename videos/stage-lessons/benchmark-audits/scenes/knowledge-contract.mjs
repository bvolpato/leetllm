import { column, row, place, indicate, dynamic, rect } from 'vizmatic/stage';
import { heading, label, note, chip } from '../../kit-narrated.mjs';
import { caseBoard, MAIN, FOOT } from '../parts.mjs';
export default function knowledge(s, c) {
  const board = caseBoard();
  const [choices, probability, splits] = MAIN.rows([2, 1, 3], 'wide');
  const branches = Array.from({ length: 10 }, (_, i) =>
    chip(String.fromCharCode(65 + i), { color: i === 0 ? 'yellow' : 'dim' }),
  );
  place(row(branches, { gap: 'normal' }), choices);
  const four = place(label('MMLU · 57 subjects · 4 choices', { color: 'cyan' }), FOOT);
  const ten = place(label('MMLU-Pro · up to 10 choices', { color: 'blue' }), FOOT);
  const probabilityLabels = ['Uniform guess: 1/4', 'Exactly ten: 1/10'].map((v) =>
    place(label(v, { color: 'yellow' }), probability),
  );
  const ancestors = place(
    column(
      [
        label('GPQA Extended · 546', { color: 'cyan' }),
        label('main · 448', { color: 'blue' }),
        label('Diamond · 198', { color: 'yellow' }),
      ],
      { gap: 'wide' },
    ),
    splits,
    'left',
  );
  const human = place(
    column(
      [
        label('34%', { color: 'yellow' }),
        note('non-expert validators'),
        note('Extended · historical study'),
      ],
      { gap: 'normal' },
    ),
    splits,
    'right',
  );
  const helm = place(label('HELM → custom private scenario', { color: 'green' }), FOOT);
  const parser = place(
    column(
      [
        label('Choice-token probabilities', { color: 'cyan', size: 36 }),
        label('Generated-letter parsing', { color: 'blue', size: 36 }),
        note('Record which path produced the score'),
      ],
      { gap: 'wide' },
    ),
    splits,
  );
  s.add(heading('Keep the task attached'), four, branches.slice(0, 4), parser);
  c.take(board.nodes);
  c.on('knowledge-contract-phase-0', () =>
    s.play(indicate(branches.slice(0, 4), { scale: 1, color: 'yellow' })),
  );
  c.on('ba-knowledge-contract-four', () =>
    s.play(indicate(branches[0], { scale: 1, color: 'yellow' })),
  );
  c.show('mmlu-guess', probabilityLabels[0], { after: true });
  c.on('ba-knowledge-contract-quarter', () =>
    s.play(indicate(branches.slice(1, 4), { scale: 1, color: 'dim' })),
  );
  c.swap('knowledge-contract-phase-1', four, ten);
  c.show('ba-knowledge-contract-ten', branches.slice(4));
  c.swap('pro-guess', probabilityLabels[0], probabilityLabels[1], { after: true });
  c.swap('ba-knowledge-contract-gpqa', parser, ancestors);
  c.on('knowledge-contract-phase-2', () =>
    s.play(indicate(ancestors, { scale: 1, color: 'yellow' })),
  );
  c.show('ba-knowledge-contract-human', human, { after: true });
  c.swap('ba-knowledge-contract-custom', ten, helm);
  c.keep(board.nodes);
}
