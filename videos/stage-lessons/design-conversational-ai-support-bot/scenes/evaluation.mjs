import { assertEqual, dot, dynamic, fitted, line, place, rect, table, to } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { caseSlip, money } from '../parts.mjs';
import { replay } from '../../../films/design-conversational-ai-support-bot/model.mjs';

export default function evaluation(s, c) {
  const title = heading(c.title);
  const [MAIN, FOOT] = area.rows([7, 1], 'normal');
  const normal = replay(),
    extra = replay('extra'),
    missing = replay('missing');
  for (const result of [normal, extra, missing])
    assertEqual(result.labelsPass, 12, 'All reported dispositions match across these three runs.');
  assertEqual(normal.ready, true, 'The declared fixtures agree with the stored effects.');
  assertEqual(extra.unexpected.length, 1, 'One unexpected record holds the release.');
  assertEqual(missing.missing.length, 1, 'One missing record holds the release.');
  const sorted = [...normal.rows].sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
  const [reports, ledgers, resultArea] = MAIN.rows([1.4, 4.1, 0.9], 'loose');
  const [reportTitle, marksArea] = reports.rows(2, 'tight');
  const categories = {
    HANDOFF: 'need review',
    ABSTAIN: 'abstain',
    'POLICY REPLY': 'policy reply',
    CONFIRM: 'ask to confirm',
    QUEUED: 'queued',
  };
  const cases = Object.entries(categories).map(([outcome, words], i) =>
    place(
      label(normal.counts[outcome] + '  ' + words, { size: 35, color: 'green' }),
      marksArea.columns(5, 'tight')[i],
    ),
  );
  const reportsTitle = place(
    label('Reported ticket outcomes   ' + normal.labelsPass + ' / ' + sorted.length + ' correct', {
      size: 42,
    }),
    reportTitle,
  );
  const [left, right] = ledgers.columns(2, 'wide');
  const expected = caseSlip(left, 'EXPECTED QUEUE', 'TEST', 'blue');
  const actual = caseSlip(right, 'STORED QUEUE', 'TEST', 'cyan');
  const expectedSlots = expected.body.rows(2, 'normal');
  const actualSlots = actual.body.rows(2, 'normal');
  const entry = (record, region, color) => {
    const [value, key] = region.rows(2, 'tight');
    return [
      place(mono(record.key, { size: 36, color }), key, 'left'),
      place(
        label(
          record.payload.invoice +
            '   ' +
            money(record.payload.amount) +
            '   ' +
            record.payload.status,
          { size: 40, color },
        ),
        value,
        'left',
      ),
    ];
  };
  const target = entry(normal.expected[0], expectedSlots[0], 'blue');
  const stored = entry(normal.actual[0], actualSlots[0], 'cyan');
  const [addedKey, addedCharge] = entry(extra.actual.at(-1), actualSlots[1], 'cyan');
  const empty = place(label('Queue empty', { size: 43, color: 'dim' }), actualSlots[0], 'left');
  const decision = (words, color) => place(label(words, { size: 43, color }), resultArea);
  const match = decision('Stored queue matches the fixture.', 'green');
  const predict = decision('Which row holds the release?', 'yellow');
  const unexpected = decision('Hold release: the $10 row has no matching expectation.', 'pink');
  const lost = decision('Hold release: Alex’s $35 entry is missing.', 'pink');
  const metrics = place(
    fitted(MAIN, (width) =>
      table(
        [
          { key: 'measure' },
          { key: 'observation', sample: 'repeat contacts + reopened + abandonment', marks: true },
        ],
        ['resolution', 'containment', 'satisfaction'].map((id) => ({
          id,
          measure: id,
          observation: { value: '', state: 'pending' },
        })),
        { width, size: 36, leading: 2.8 },
      ),
    ),
    MAIN,
  );
  const [cohortTitleArea, neededArea, transitArea, escalatedArea, formulaArea] = MAIN.rows(
    [1, 1.4, 1.4, 1.4, 1],
    'wide',
  );
  const neededIds = sorted.filter((row) => row.expected === 'HANDOFF').map((row) => row.id);
  const missedId = neededIds.at(-1),
    unnecessaryId = sorted[0].id;
  const escalatedIds = [...neededIds.slice(0, -1), unnecessaryId];
  const cohortTitle = place(
    label('Illustrative escalation choices', { size: 36, color: 'cyan' }),
    cohortTitleArea,
  );
  const [neededNameArea, neededMarksArea] = neededArea.columns([1, 3], 'wide');
  const [escalatedNameArea, escalatedMarksArea] = escalatedArea.columns([1, 3], 'wide');
  const neededSlots = neededMarksArea.columns(neededIds.length, 'normal');
  const escalatedSlots = escalatedMarksArea.columns(escalatedIds.length, 'normal');
  const neededName = place(label('Needs review', { size: 32, color: 'pink' }), neededNameArea);
  const escalatedName = place(label('Escalated', { size: 32, color: 'cyan' }), escalatedNameArea);
  const neededLabels = neededIds.map((id, i) =>
    place(label(id, { size: 32, color: id === missedId ? 'pink' : 'dim' }), neededSlots[i], 'top'),
  );
  const actualLabels = escalatedIds.map((id, i) =>
    place(
      label(id, { size: 32, color: id === unnecessaryId ? 'red' : 'cyan' }),
      escalatedSlots[i],
      'bottom',
    ),
  );
  const other = place(
    note(unnecessaryId + ' needs no review', { color: 'dim' }),
    transitArea,
    'top right',
  );
  const marks = escalatedIds.map((id) => {
    const i = neededIds.indexOf(id);
    return dot(16, i < 0 ? 'red' : 'green').moveTo(
      i < 0 ? transitArea.point('right') : [neededSlots[i].cx, neededSlots[i].bottom],
    );
  });
  const missedMark = dot(16, 'pink').moveTo([neededSlots.at(-1).cx, neededSlots.at(-1).bottom]);
  const precisionFocus = place(
    rect(escalatedArea.width, escalatedArea.height, {
      fill: 'surface',
      stroke: 'yellow',
      radius: 12,
    }),
    escalatedArea,
  ).zIndex(-1);
  const recallFocus = place(
    rect(neededArea.width, neededArea.height, { fill: 'surface', stroke: 'yellow', radius: 12 }),
    neededArea,
  ).zIndex(-1);
  const correct = escalatedIds.filter((id) => neededIds.includes(id)).length;
  const precisionFormula = place(
    label('Precision: ' + correct + ' needed review / ' + escalatedIds.length + ' escalated', {
      size: 34,
      color: 'yellow',
    }),
    formulaArea,
  );
  const recallFormula = place(
    label('Recall: ' + correct + ' escalated / ' + neededIds.length + ' needed review', {
      size: 34,
      color: 'yellow',
    }),
    formulaArea,
  );
  const cohort = [
    cohortTitle,
    neededName,
    escalatedName,
    neededLabels,
    actualLabels,
    other,
    marks,
    missedMark,
    precisionFocus,
  ];
  const [loadTitleArea, axisLabelsArea, loadPlot, loadCaptionArea] = MAIN.rows(
    [1, 1, 4, 1],
    'normal',
  );
  const [loadNamesArea, loadLinesArea] = loadPlot.columns([1, 5], 'normal');
  const loadRows = loadLinesArea.rows(3, 'loose');
  const loadNameRows = loadNamesArea.rows(3, 'loose');
  const loadNames = ['case A', 'case B', 'case C'].map((name, i) =>
    place(label(name, { size: 30, color: 'cyan' }), loadNameRows[i], 'left'),
  );
  const time = s.value(0);
  const arrivals = [0, 0.15, 0.3],
    service = [0.3, 0.85, Infinity],
    resolution = [0.9, Infinity, Infinity];
  const tx = (value) => loadLinesArea.left + value * loadLinesArea.width;
  const loadRails = loadRows.map((region) =>
    line([region.left, region.cy], [region.right, region.cy], { stroke: 'grid', width: 3 }),
  );
  const loadMarks = dynamic(() =>
    loadRows.flatMap((region, i) => {
      const now = time.value;
      if (now < arrivals[i]) return [];
      const end = Math.min(now, resolution[i]);
      const waitEnd = Math.min(end, service[i]);
      const waiting = Math.max(0, waitEnd - arrivals[i]);
      const working = Math.max(0, end - service[i]);
      return [
        ...(waiting > 0
          ? [
              rect(waiting * region.width, 24, { fill: 'yellow', stroke: 'yellow' }).moveTo([
                tx(arrivals[i] + waiting / 2),
                region.cy,
              ]),
            ]
          : []),
        ...(working > 0
          ? [
              rect(working * region.width, 24, { fill: 'cyan', stroke: 'cyan' }).moveTo([
                tx(service[i] + working / 2),
                region.cy,
              ]),
            ]
          : []),
        dot(17, now >= resolution[i] ? 'green' : 'cyan').moveTo([tx(end), region.cy]),
      ];
    }),
  );
  const loadTitle = place(
    label('Three tickets on one clock', { size: 36, color: 'cyan' }),
    loadTitleArea,
  );
  const loadLabels = ['arrival', 'first useful output', 'full resolution'].map((words, i) =>
    note(words, { color: i === 2 ? 'green' : 'dim' }).moveTo([
      tx([0, 0.5, 0.9][i]),
      axisLabelsArea.cy,
    ]),
  );
  const usefulMarker = line([tx(0.5), loadRows[0].cy - 32], [tx(0.5), loadRows[0].cy + 32], {
    stroke: 'cyan',
    width: 4,
  });
  const unfinished = place(
    label('Yellow: waiting · cyan: unfinished · green: resolved', { size: 32, color: 'yellow' }),
    loadCaptionArea,
  );
  const loadPicture = [
    loadTitle,
    loadNames,
    loadRails,
    loadMarks,
    loadLabels,
    usefulMarker,
    unfinished,
  ];
  const metricFoot = place(
    note('Illustrative cohorts and arrivals. Population outcomes need independent observations.'),
    FOOT,
  );
  s.add(title, expected.paper, actual.paper);
  c.show('twelve-cases', [reportsTitle, ...cases], { stagger: true });
  c.show('expected-effects', [...target, ...stored, match], { after: true });
  c.hide('unexpected-write', match);
  c.show('unexpected-write', addedCharge);
  c.show('extra-question', predict);
  c.swap('extra-verdict', predict, unexpected, { after: true });
  c.show('extra-verdict', addedKey, { after: true });
  c.hide('reset-ledger', [unexpected, addedKey, addedCharge]);
  c.swap('missing-effect', stored, empty);
  c.show('missing-verdict', lost, { after: true });
  c.swapAll('outcome-metrics', [metrics, metricFoot], {
    keep: [title],
  });
  c.on(
    'outcome-metrics',
    () =>
      s.play(
        metrics.setCell('resolution', 'observation', {
          value: 'independently verified task outcome',
          state: 'pass',
        }),
        metrics.light('resolution'),
      ),
    0.6,
  );
  c.on('containment-metric', () =>
    s.play(
      metrics.setCell('containment', 'observation', {
        value: 'repeat contacts + reopened + abandonment',
        state: 'warn',
      }),
      metrics.light('containment'),
    ),
  );
  c.on('satisfaction-metric', () =>
    s.play(
      metrics.setCell('satisfaction', 'observation', {
        value: 'observation window + nonresponse',
        state: 'pending',
      }),
      metrics.light('satisfaction'),
    ),
  );
  c.swapAll('precision-recall', cohort, { keep: [title, metricFoot] });
  c.on(
    'precision-recall',
    () =>
      s.play(
        ...marks.map((mark, i) =>
          to(mark, (n) => n.moveTo([escalatedSlots[i].cx, escalatedSlots[i].top]), {
            duration: 1.4,
          }),
        ),
      ),
    0.6,
  );
  c.show('precision-recall', precisionFormula);
  c.swap('recall-metric', precisionFocus, recallFocus);
  c.swap('recall-metric', precisionFormula, recallFormula);
  c.swapAll('latency-metric', loadPicture, { keep: [title, metricFoot] });
  c.on('latency-metric', () => s.play(time.to(0.6, { duration: 2 })), 0.6);
  c.on('queueing-metric', () => s.play(time.to(0.82, { duration: 1.4 })));
  c.on('arrival-load', () => s.play(time.to(1, { duration: 0.8 })));
  c.clear([...loadRails, usefulMarker], 0.46, 0.2);
}
