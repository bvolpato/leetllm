import { column, row, place, rect, indicate, to, tex } from 'vizmatic/stage';
import { heading, label, note, chip } from '../../kit-narrated.mjs';
import { caseBoard, MAIN, FOOT, rankedPrecision } from '../parts.mjs';
export default function ragMetrics(s, c) {
  const board = caseBoard();
  const [ranks, facts, answers] = MAIN.rows([2, 2, 2], 'wide');
  const ranked = [1, 0, 1].map((flag, i) =>
    place(
      column([note(`rank ${i + 1}`), chip(String(flag), { color: flag ? 'green' : 'red' })], {
        gap: 'normal',
      }),
      ranks.columns(3, 'wide')[i],
    ),
  );
  const values = ['1/1 = 1', '2/3', `AP = ${rankedPrecision([1, 0, 1]).toFixed(3)}`].map((v, i) =>
    place(label(v, { color: 'yellow', size: 36 }), FOOT),
  );
  const [factHead, factMarks] = facts.columns([1, 3], 'wide');
  const factName = place(note('required facts'), factHead);
  const marks = ['approval', 'rollback', 'revocation'].map((v, i) =>
    place(chip(v, { color: i < 2 ? 'cyan' : 'red' }), factMarks.columns(3, 'wide')[i]),
  );
  const [answerHead, answerMarks] = answers.columns([1, 3], 'wide');
  const answerName = place(note('answer claims'), answerHead);
  const claims = ['approval', 'rollback'].map((v, i) =>
    place(chip(v, { color: 'blue' }), answerMarks.columns(3, 'wide')[i]),
  );
  const recall = place(label('Recall = 2/3', { color: 'yellow' }), FOOT, 'left');
  const faithful = place(label('Faithfulness = 2/2 = 1', { color: 'yellow' }), FOOT, 'right');
  const relevance = place(note('Relevancy: generated questions → cosine similarities'), FOOT);
  s.add(heading('Keep the denominators separate'), ranked, factName, marks, answerName);
  c.take(board.nodes);
  c.on('rag-metrics-phase-0', () => s.play(indicate(ranked, { scale: 1, color: 'yellow' })));
  c.show('precision-first', values[0], { after: true });
  c.on('ba-rag-metrics-rank1', () => s.play(indicate(ranked[0], { scale: 1, color: 'yellow' })));
  c.swap('precision-third', values[0], values[1], { after: true });
  c.on('ba-rag-metrics-rank3', () => s.play(indicate(ranked[2], { scale: 1, color: 'yellow' })));
  c.swap('precision-average', values[1], values[2], { after: true });
  c.on('ba-rag-metrics-average', () => s.play(indicate(ranked, { scale: 1, color: 'yellow' })));
  c.hide('rag-metrics-phase-1', values[2]);
  c.on('rag-metrics-phase-1', () => s.play(indicate(marks, { scale: 1, color: 'yellow' })));
  c.show('context-recall', recall, { after: true });
  c.on('ba-rag-metrics-recall', () => s.play(indicate(marks[2], { scale: 1, color: 'red' })));
  c.show('two-claims', claims);
  c.show('faithfulness-one', faithful, { after: true });
  c.on('ba-rag-metrics-faithful', () => s.play(indicate(claims, { scale: 1, color: 'green' })));
  c.swap('rag-metrics-phase-2', [recall, faithful], relevance);
  c.on('ba-rag-metrics-relevance', () =>
    s.play(indicate(relevance, { scale: 1, color: 'yellow' })),
  );
  c.keep(board.nodes);
}
