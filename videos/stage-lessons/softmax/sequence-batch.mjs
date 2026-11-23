// Both scenes lay out the third row, so appending it leaves the first two rows in place.
import {
  FRESH_LOGITS,
  FRESH_TARGET,
  LOGITS,
  PROBS,
  TARGET,
} from '../../films/softmax/fixtures.mjs';
import { completeModel, freshState } from '../../films/softmax/model.mjs';
import { area } from '../kit-narrated.mjs';
import { batch } from './parts.mjs';

export function sequenceBatch() {
  const { sequence } = completeModel();
  const [top, middle, foot] = area.rows([1, 3.3, 1.7], 'normal');
  const scores = (values) => `[${values.join(', ')}]`;
  const entries = [
    {
      name: '1',
      input: 'bug',
      scores: scores(LOGITS),
      target: 'docs',
      share: PROBS[TARGET],
      loss: sequence.losses[0],
      color: 'green',
    },
    {
      name: '2',
      input: 'bug docs',
      scores: scores(FRESH_LOGITS),
      target: 'today',
      share: freshState(0).probabilities[FRESH_TARGET],
      loss: sequence.losses[1],
      color: 'pink',
    },
    { name: '3', input: 'unspecified', scores: '[100, −100, 0]', target: '−100', color: 'dim' },
  ];
  const columns = ['name', 'input', 'target', 'scores', 'meter', 'share', 'loss'];
  const { rows, titles } = batch(entries, middle, columns);
  const supervised = rows.slice(0, sequence.count);
  const kept = [
    ...Object.values(titles),
    ...supervised.flatMap((cells) => columns.map((name) => cells[name])),
  ];
  return { sequence, top, foot, rows, titles, supervised, kept };
}
