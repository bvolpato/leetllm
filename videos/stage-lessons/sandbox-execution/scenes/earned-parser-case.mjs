import { assertEqual, boxOf, column, draw, indicate, moveTo, place, row } from 'vizmatic/stage';
import { parserIdentities, verdictAxes } from '../../../films/sandbox-execution/model.mjs';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, FRESH_CASES, FRESH_REPORT_XML, wall } from '../parts.mjs';

export default function earnedParserCase(s, c) {
  const title = heading(c.title);
  const [meta, body, foot] = area.rows([1.1, 5.8, 1.3], 'normal');
  const source = place(
    mono('report.xml   /   urn:fresh   /   class payments', {
      size: 39,
      color: COLOR.evidence,
    }),
    meta,
    'left',
  );
  const [names, children, kept] = body.columns([2, 5, 3], 'normal');
  const xmlLines = FRESH_REPORT_XML.split('\n').filter((text) => text.includes('<testcase'));
  const samples = FRESH_CASES.map((test, i) => {
    const kids = xmlLines[i].slice(
      xmlLines[i].indexOf('>') + 1,
      xmlLines[i].lastIndexOf('</testcase>'),
    );
    const prefixRows = parserIdentities(
      `<testsuite xmlns="urn:fresh">${xmlLines.slice(0, i + 1).join('')}</testsuite>`,
    );
    const why = ['keep the first', 'skip wins', 'too deep', 'already counted'][i];
    const name = place(mono(test.name, { size: 44 }), names.rows(4, 'normal')[i], 'left');
    const tags = place(
      mono(kids, { size: 38, color: COLOR.evidence }),
      children.rows(4, 'normal')[i],
      'left',
    );
    const action = place(
      label(why, { size: 38, color: i === 0 ? COLOR.pass : COLOR.quiet }),
      kept.rows(4, 'normal')[i],
      'left',
    );
    assertEqual(prefixRows, ['payments::retry'], `one selected identity after case ${i + 1}`);
    return { name, tags, action };
  });
  const actual = parserIdentities(FRESH_REPORT_XML);
  assertEqual(actual, ['payments::retry'], 'the fresh report matches the independent expected row');
  const question = place(
    label('Which rows should the validator expect?', { size: 48, color: COLOR.mark }),
    foot,
    'left',
  );
  const result = place(mono(`1   ${actual[0]}`, { size: 48, color: COLOR.pass }), foot, 'left');

  s.add(title, source, ...samples.flatMap((sample) => [sample.name, sample.tags]));
  samples.forEach((sample, i) =>
    c.on(`ep-case-${i}`, () =>
      s.play(indicate(sample.tags, { color: COLOR.mark, scale: 1, duration: 0.8 })),
    ),
  );
  c.show('ep-predict', question);
  c.swap('ep-first', question, result, { after: true });
  c.show('ep-first', samples[0].action, { after: true });
  c.show('ep-skip', samples[1].action);
  c.show('ep-depth', samples[2].action);
  c.show('ep-repeat', samples[3].action);

  const [receipts, slot] = body.columns([1, 1], 'loose');
  const [scratch, nextJob] = slot.rows([3, 1], 'wide');
  const [statusBox, occupantBox] = foot.columns([1, 1], 'loose');
  const dossier = place(
    label('Run evidence   /   worker A, generation 7', { size: 48 }),
    meta,
    'left',
  );
  const previousPass = place(
    mono(`PASS   ${actual[0]}`, { size: 40, color: COLOR.pass }),
    receipts.rows(4, 'normal')[0],
    'left',
  );
  const connection = place(
    label('Egress probe   /   connection failed', { size: 39, color: COLOR.mark }),
    receipts.rows(4, 'normal')[1],
    'left',
  );
  const deny = place(
    label('Policy log   /   connection denied', { size: 39, color: COLOR.host }),
    receipts.rows(4, 'normal')[1],
    'left',
  );
  const terminated = place(
    label('Job processes remaining   /   0', { size: 39, color: COLOR.host }),
    receipts.rows(4, 'normal')[2],
    'left',
  );
  const cleanup = place(note('Other reset checks passed'), receipts.rows(4, 'normal')[3], 'left');
  const scratchWall = wall(scratch, 'scratch directory', { color: COLOR.host });
  const [expectedBox, observedBox] = scratch.inset('wide', 'normal').rows(2, 'normal');
  const baseline = [];
  const beforeReset = ['last-report.xml'];
  const afterReset = [];
  const listing = (files) => JSON.stringify(files);
  const expected = place(
    column([note('Expected at reset'), mono(listing(baseline), { size: 53 })], { align: 'left' }),
    expectedBox,
    'left',
  );
  const observedLabel = note('Observed in slot A');
  const leftover = mono(listing(beforeReset), { size: 44, color: COLOR.evidence });
  place(column([observedLabel, leftover], { align: 'left' }), observedBox, 'left');
  const clear = place(
    mono(listing(afterReset), { size: 44, color: COLOR.evidence }),
    observedBox,
    'bottom left',
  );
  clear.moveTo([observedBox.left + boxOf(clear).width / 2, boxOf(leftover).cy]);
  const berth = wall(nextJob, 'slot A  /  next job', { color: COLOR.host });
  const queueLabel = note('Queued for admission');
  const queued = chip('worker A / 8', { color: COLOR.candidate, size: 35 });
  place(row([queueLabel, queued], { gap: 'normal', align: 'center' }), occupantBox, 'left');
  const canReuse = place(
    label('Can the next job take slot A?', { size: 44, color: COLOR.mark }),
    statusBox,
    'left',
  );
  const slotState = (files) =>
    verdictAxes({
      functional: true,
      enforcedDeny: true,
      terminated: true,
      reset: listing(files) === listing(baseline),
    }).slot;
  const dirtyState = slotState(beforeReset);
  const cleanState = slotState(afterReset);
  assertEqual(
    [dirtyState, cleanState],
    ['quarantined', 'reusable'],
    'scratch is the last outstanding reset check',
  );
  const blocked = place(
    label(`Slot A   /   ${dirtyState}`, { size: 46, color: COLOR.mark }),
    statusBox,
    'left',
  );
  const ready = place(
    label(`Slot A   /   ${cleanState}`, { size: 46, color: COLOR.pass }),
    statusBox,
    'left',
  );
  const protectedSlot = place(
    label('Late cleanup   /   worker A / 7', { size: 43, color: COLOR.host }),
    statusBox,
    'left',
  );

  c.swapAll('ep-receipt', [
    heading('Checking slot A for the next job'),
    dossier,
    previousPass,
    scratchWall,
    expected,
    observedLabel,
  ]);
  c.show('ep-connection', connection);
  c.swap('ep-probe', connection, deny);
  c.show('ep-empty-job', terminated);
  c.show('ep-baseline', cleanup);
  c.show('ep-file', [leftover, draw(berth), queueLabel, queued]);
  c.show('ep-slot-question', canReuse);
  c.swap('ep-quarantine', canReuse, blocked, { after: true });
  c.swap('ep-rescan', leftover, clear, { after: true });
  c.swap('ep-ready', blocked, ready, { after: true });
  c.hide('ep-admit', [queueLabel, ready], { after: true });
  c.after('ep-admit', () => s.play(moveTo(queued, nextJob.point(), { duration: 1 })));
  c.show('ep-late', protectedSlot, { after: true });
  const ignored = place(
    label('Generation 7 update ignored', { size: 43, color: COLOR.host }),
    statusBox,
    'left',
  );
  c.swap('ep-stays', protectedSlot, ignored);
  c.on('ep-stays', () => s.play(indicate(queued, { color: COLOR.mark, scale: 1, duration: 0.8 })));
  c.on('ep-earned', () =>
    s.play(indicate(previousPass, { color: COLOR.pass, scale: 1, duration: 1.2 })),
  );
  const nextLesson = place(note('Which files can your local agent read?'), occupantBox, 'left');
  c.show('ep-workstation', nextLesson);
}
