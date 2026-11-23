import { place } from 'vizmatic/stage';
import { label, note } from '../../kit-narrated.mjs';
import { STATE, captions, frame, ledger, nfmt, pct, plot, record } from '../parts.mjs';
import { policyValueFixture } from '../../../films/causality/model.mjs';

export default function policyValue(s, c) {
  frame(
    s,
    'Which logged actions does the target choose?',
    'Importance mass on logged decisions',
    'Always-assistant target',
  );
  const model = policyValueFixture(),
    log = ledger(s, { ...STATE.strata, total: [0.5, 0.5] });
  const [action, reward, value] = record(s, [
    ['Target / logging probability', 'π(a | x) / e(a | x)'],
    ['Weighted reward', 'Observed resolution'],
    ['Estimated policy value', ''],
  ]);
  const [, controlBand] = plot.rows(2, 'wide');
  const [head, field] = controlBand.rows([1, 3], 'normal');
  const records = log.observedMarks(1);
  const count = place(
    note(model.rows.filter((t) => t.arm === 'control').length + ' logged'),
    head.columns(2)[0],
    'right',
  );
  const v2 = [
    log.missing(1, 1, 0.5),
    place(label('Assistant v2', { color: 'cyan', size: 35 }), head.columns(2)[1]),
    place(note('No logged tickets'), field.columns(2)[1]),
  ];
  c.show('zero', [records, count], { after: true, lead: 0 });
  s.add(log.nodes);
  reward(c, 'reward', 'r × Y');
  c.after('zero', () => log.move({ easy: STATE.strata.easy, total: [0.5, 0], absent: [2, 3] }));
  c.show('version', v2, { after: true, lead: 0 });
  c.after('inverse', () => log.move({ easy: [0.5, 0.9], total: [1, 0], absent: [2, 3] }));
  const success = model.rows.reduce((sum, t) => sum + t.ratio * Number(t.resolved), 0);
  action(c, 'zero', 'Control ratio = 0', true);
  reward(c, 'value', nfmt(success) + ' / ' + model.rows.length, true);
  value(c, 'value', pct(model.ips) + ' for v1', true);
  action(c, 'version', 'No v2 actions logged', true);
  captions(s, c, 'Keep the context, action, reward and actual logging probability together.', [
    ['zero', 'Every control record stays in the log and gets zero target mass.', true],
    ['value', 'The target always uses the assistant in the log’s fifty-fifty risk mix.', true],
    [
      'version',
      'The old-workflow estimate still belongs to v1. A changed prompt needs support.',
      true,
    ],
  ]);
}
