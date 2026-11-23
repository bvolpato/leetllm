import { column, dot, dynamic, indicate, line, place } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { BODY, FITTED_ROWS, HAND_FAIL, open, pipelineOffline, probeRelease } from '../parts.mjs';

export default function synthesis(s, c) {
  const missed = HAND_FAIL.find((r) => r.critical && r.gold && !r.pred);
  const replay = probeRelease('v1', missed.x);
  const fitted = FITTED_ROWS.find((r) => r.id === missed.id);
  const failedGate = pipelineOffline(HAND_FAIL);
  const fittedGate = pipelineOffline(FITTED_ROWS);
  const [subject, main, foot] = BODY.rows([1.2, 4.6, 1.1], 'wide');
  const [left, right] = main.columns(2, 'loose');
  const [oldTitle, oldCost, oldLog, oldCount] = left.rows([1, 1.3, 1.3, 1.2], 'normal');
  const [newTitle, scoreRoom, action, newCount] = right.rows([1, 1.3, 1.3, 1.2], 'normal');
  const record = place(
    label(
      missed.id +
        '     ·     ' +
        missed.x +
        ' min delay     ·     critical delivery     ·     arrived late',
      { color: 'cyan', size: 43 },
    ),
    subject,
  );
  const first = place(note('Original hand-entered receipt', { color: 'pink' }), oldTitle);
  const supplied = place(
    mono('Cost   ' + missed.cost + ' / ' + missed.baseline + ' supplied units', { size: 37 }),
    oldCost,
  );
  const empty = place(label('Warning log       No warning', { size: 43, color: 'red' }), oldLog);
  const fraction = place(
    mono('Critical recall     ' + failedGate.hits + ' / ' + failedGate.positives, { size: 38 }),
    oldCount,
  );
  const second = place(note('Independent evaluation of fitted v1', { color: 'green' }), newTitle);
  const [tickText, track] = scoreRoom.rows([1.2, 1], 'tight');
  const x = (value) => track.left + 30 + (track.width - 60) * value;
  const y = track.point('center')[1];
  const ruler = [
    line([x(0), y], [x(1), y], { stroke: 'grid', width: 5 }),
    line([x(replay.model.threshold), y - 16], [x(replay.model.threshold), y + 16], {
      stroke: 'yellow',
      width: 3,
    }),
    place(note('Warning threshold 0.50', { color: 'yellow' }), tickText),
  ];
  const point = s.value(0);
  const score = dynamic(() =>
    point.value > 0
      ? [
          dot(12, 'green').moveTo([x(replay.score), y]),
          mono(replay.score.toFixed(2), { size: 36, color: 'green' }).moveTo([
            x(replay.score),
            y - 43,
          ]),
        ]
      : [],
  );
  const sent = place(
    label('Warn    ·    ' + fitted.cost + ' cost units', { size: 40, color: 'green' }),
    action,
  );
  const total = place(
    column(
      [
        mono('Critical recall     ' + fittedGate.hits + ' / ' + fittedGate.positives, { size: 38 }),
        note('Total assumed cost   ' + fittedGate.cost + ' / ' + fittedGate.base),
      ],
      { gap: 'tight' },
    ),
    newCount,
  );
  const next = place(
    label('Replay eval-2 through the selected production package', { size: 38, color: 'cyan' }),
    foot,
  );
  open(s, c);
  s.add(record, first, supplied, empty, fraction);
  c.on('synthesis-failed', () => s.play(indicate(supplied, { scale: 1.04, color: 'pink' })));
  c.on('synthesis-miss', () => s.play(indicate(empty, { scale: 1.04, color: 'pink' })));
  c.show('synthesis-replay', [second, ruler, score]);
  c.after('synthesis-score', () => point.set(1));
  c.show('synthesis-warn', sent, { after: true, lead: 0 });
  c.show('synthesis-both', total);
  c.show('synthesis-select', next);
}
