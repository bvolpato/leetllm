import { fitted, passage, place, table } from 'vizmatic/stage';
import { label, namedBox, note } from '../../kit-narrated.mjs';
import { MAIN, FOOT, open } from '../parts.mjs';

export default function repair(s, c) {
  open(s, c, 'ledger');
  const [conversation, checksArea, repairArea] = MAIN.rows([2.5, 2.5, 1], 'wide');
  const [sourceArea, draftArea] = conversation.columns([1, 1.2], 'loose');
  const source = place(
    passage(
      `Applied credits: 0.
Specialist review required.
Policy: US-v3.`,
      { title: 'VALIDATED STATE', width: sourceArea.width, size: 34, lines: 3, color: 'blue' },
    ),
    sourceArea,
    'top',
  );
  const skeleton = place(
    namedBox('assistant draft', { width: draftArea.width, height: 230, color: 'dim', dash: true }),
    draftArea,
    'top',
  );
  const draft = place(
    passage("I've credited $900 back to your account!", {
      title: 'DRAFT  ·  NO CITATION',
      width: draftArea.width,
      size: 36,
      lines: 3,
      color: 'red',
    }),
    draftArea,
    'top',
  );
  const alternate = place(
    passage('Your refund is on the way.', {
      title: 'ALTERNATE DRAFT  ·  CITES E1',
      width: draftArea.width,
      size: 36,
      lines: 3,
      color: 'red',
    }),
    draftArea,
    'top',
  );
  const safe = place(
    passage(
      `No credit has been applied.
Specialist review is required.`,
      { title: 'STATE TEMPLATE', width: draftArea.width, size: 36, lines: 3, color: 'cyan' },
    ),
    draftArea,
    'top',
  );
  const sourceMarks = [
    source.mark('Applied credits: 0', 'supported'),
    source.mark('Specialist review required', 'supported'),
  ];
  const checks = place(
    fitted(checksArea, (width) =>
      table(
        [{ key: 'check' }, { key: 'result', sample: 'unsupported promise', marks: true }],
        [
          { id: 'phrase', check: 'phrase list', result: { value: 'waiting', state: 'pending' } },
          {
            id: 'support',
            check: 'semantic support',
            result: { value: 'waiting', state: 'pending' },
          },
          { id: 'dispatch', check: 'tool dispatch', result: { value: 'blocked', state: 'fail' } },
        ],
        { width, size: 32 },
      ),
    ),
    checksArea,
  );
  const attempts = place(
    fitted(checksArea, (width) =>
      table(
        [
          'attempt',
          { key: 'attempts left', sample: '2 of 2' },
          { key: 'result', sample: 'draft rejected', marks: true },
        ],
        [
          {
            id: 'initial',
            attempt: 'initial call',
            'attempts left': '1 of 2',
            result: 'timeout',
          },
          {
            id: 'fallback',
            attempt: 'provider fallback',
            'attempts left': '',
            result: '',
          },
          {
            id: 'repair',
            attempt: 'application revision',
            'attempts left': '',
            result: '',
          },
        ],
        { width, size: 32 },
      ),
    ),
    checksArea,
  );
  const limit = place(
    label('At most one revision with the same permissions', { color: 'yellow', size: 36 }),
    repairArea,
  );
  const exhausted = place(
    label('2 attempts used → 0 revisions → handoff or abstain', { color: 'red', size: 36 }),
    repairArea,
  );
  const foot = place(note('The lab checks saved drafts against the billing record.'), FOOT);
  s.add(source, skeleton, checks, foot);
  c.onBeat(0, () => s.play(...sourceMarks));
  const badLink = draft.link('credited', source.span('Applied credits: 0'), { color: 'red' });
  const alternateLink = alternate.link('refund', source.span('Applied credits: 0'), {
    color: 'red',
  });
  const safeLinks = [
    safe.link('No credit has been applied', source.span('Applied credits: 0'), { color: 'blue' }),
    safe.link('Specialist review is required', source.span('Specialist review required'), {
      color: 'green',
    }),
  ];
  c.swap('bad-promise', skeleton, draft);
  c.show('phrase-catch', badLink.enter({ duration: 0.4 }));
  c.after('phrase-catch', () =>
    s.play(
      draft.mark('credited $900', 'contradicted'),
      badLink.break(),
      checks.setCell('phrase', 'result', { value: 'promise + no citation', state: 'fail' }),
    ),
  );
  c.swap('phrase-miss', draft, alternate);
  c.hide('phrase-miss', badLink);
  c.show('phrase-miss', alternateLink.enter({ duration: 0.4 }), { lead: -0.6 });
  c.on('phrase-miss', () =>
    s.play(checks.setCell('phrase', 'result', { value: 'inspecting', state: 'pending' })),
  );
  c.after('phrase-miss', () =>
    s.play(checks.setCell('phrase', 'result', { value: 'passes limited list', state: 'pass' })),
  );
  c.after('semantic-support', () =>
    s.play(
      alternate.mark('refund is on the way', 'contradicted'),
      alternateLink.break(),
      checks.setCell('support', 'result', { value: 'unsupported promise', state: 'fail' }),
    ),
  );
  c.swap('state-template', alternate, safe);
  c.hide('state-template', alternateLink);
  c.show(
    'state-template',
    safeLinks.map((link) => link.enter({ duration: 0.5 })),
    { lead: -0.6 },
  );
  c.after('state-template', () =>
    s.play(checks.setCell('support', 'result', { value: 'state supported', state: 'pass' })),
  );
  c.on('no-dispatch', () => s.play(checks.light('dispatch')));
  c.show('one-revision', limit);
  c.on('same-authority', () => s.play(checks.light('support')));
  c.hide('primary-timeout', limit);
  c.swap('primary-timeout', checks, attempts, { after: true });
  c.after('fallback-rejected', () =>
    s.play(
      attempts.setCell('fallback', 'attempts left', '0 of 2'),
      attempts.setCell('fallback', 'result', { value: 'draft rejected', state: 'fail' }),
    ),
  );
  c.after('no-attempts', () =>
    s.play(
      attempts.setCell('repair', 'attempts left', '0 of 2'),
      attempts.setCell('repair', 'result', { value: 'blocked', state: 'fail' }),
    ),
  );
  c.show('no-attempts', exhausted, { after: true });
}
