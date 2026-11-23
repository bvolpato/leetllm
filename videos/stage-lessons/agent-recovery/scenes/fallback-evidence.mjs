// Scene `fallback-evidence`: what a switch of provider does not change.
//
// The picture: the route at the top. A switch arm goes from the primary model to the backup, and
// all the rest stays: the agent, the tool lane, the controller with job-1. Under the route, one
// band changes with the voice: what the backup must pass, then an observation on a line of time
// that is 40 minutes from now, then the card of a handoff that fills field by field.
import {
  arrow,
  appear,
  moveTo,
  seq,
  vanish,
  assertEqual,
  beside,
  boxOf,
  column,
  dynamic,
  grid,
  indicate,
  lerp,
  line,
  place,
  rect,
  row,
} from 'vizmatic/stage';
import { dispatchOperation, recoveryObservation } from '../../../films/agent-recovery/model.mjs';
import { area, chip, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { COLOR, OP, ageLine, cross, record, tint, token, travel, wall } from '../parts.mjs';

/** The age of the cached observation, and the share of that time that a claim about now accepts. */
const AGE = '40 minutes ago';
const FRESH = 30 / (40 * 60);

export default function fallbackEvidence(s, c) {
  const seen = recoveryObservation();
  assertEqual([seen.jobId, seen.state], [OP.job, OP.state], 'the cached observation');
  const database = { operations: new Map(), jobs: new Map() };
  dispatchOperation(database, OP.key, { run: 'RUN-842', revision: OP.revision }, 'after-commit');
  const operationRecord = database.operations.get(OP.key);
  assertEqual(operationRecord.job, seen.jobId, 'the handoff identifies the observed job');
  const payload = Object.entries(operationRecord.payload)
    .map(([name, value]) => `${name}: ${value}`)
    .join('\n');

  const [top, bottom] = area.rows(2, 'normal');

  // The route: two providers, the agent, the tool lane, and the controller with its job.
  const providers = [
    namedBox('primary model', { width: 280, height: 96, color: COLOR.fail, sub: 'not available' }),
    namedBox('backup model', { width: 280, height: 96, color: COLOR.attempt }),
  ];
  place(column(providers, { gap: 'wide' }), top, 'left');
  const agent = place(
    namedBox('agent', { width: 240, height: 110, color: COLOR.attempt }),
    top.columns([5, 3, 10], 'none')[1],
    'right',
  );
  const panel = place(
    rect(460, top.height, { radius: 18, stroke: COLOR.controller, fill: 'surface', width: 3 }),
    top,
    'right',
  );
  const inside = boxOf(panel).inset('normal');
  const panelName = place(label('controller', { color: COLOR.controller }), inside, 'top left');
  const job = place(
    record(
      [
        [seen.jobId, COLOR.sure],
        [seen.state, 'ink'],
      ],
      inside.width,
    ),
    inside,
  );
  const unknownJob = record(
    [
      [seen.jobId, COLOR.sure],
      ['?', 'dim'],
    ],
    inside.width,
    { color: 'dim', dash: [10, 8] },
  ).moveTo(job.center);
  const currentUnknown = beside(note('current state: unobserved'), unknownJob, 'under', 'normal');
  const operation = beside(token(OP.key, COLOR.op), panelName, 'under', 'tight', 'left');
  const laneY = agent.center[1];
  const from = [boxOf(agent).right + 14, laneY];
  const to = [boxOf(panel).left - 14, laneY];
  const lane = arrow(from, to, { stroke: 'dim', width: 4, pad: 0 });
  // The switch arm: from the agent to the provider that it uses. 0 is the primary, 1 is the backup.
  const route = s.value(0);
  const hinge = [boxOf(agent).left - 12, laneY];
  const arm = dynamic(() =>
    line(
      hinge,
      [
        boxOf(providers[0]).right + 12,
        lerp(providers[0].center[1], providers[1].center[1], route.value),
      ],
      {
        stroke: route.value > 0.5 ? COLOR.attempt : COLOR.fail,
        width: 7,
      },
    ),
  );
  const at = [lerp(from[0], to[0], 0.36), laneY];
  const gate = wall(s, { at, top: laneY - 70, bottom: laneY + 70 });
  gate.open.set(1);
  const narrow = beside(
    chip('write tools off: classify a log excerpt', { color: COLOR.mark, stroke: COLOR.mark }),
    [at[0], laneY - 70],
    'above',
    'tight',
  );
  const failing = cross().moveTo([lerp(from[0], to[0], 0.7), laneY]);
  const failingName = beside(
    note('the same failing tool', { color: COLOR.fail }),
    failing,
    'under',
    'normal',
  );
  const shared = beside(
    chip('one deadline, one spend, one cancel', { color: COLOR.mark, stroke: COLOR.mark }),
    agent,
    'under',
    'wide',
    'left',
  );

  // The message keeps its operation key through translation and compatibility checks.
  const [pipelineNames, pipelinePath, pipelineFoot] = bottom.rows([2, 2, 1], 'normal');
  const columns = pipelineNames.columns(3, 'wide');
  const adapters = [
    place(namedBox('message', { width: columns[0].width, height: 100, color: 'dim' }), columns[0]),
    place(
      namedBox('translation adapter', { width: columns[1].width, height: 100, color: 'dim' }),
      columns[1],
    ),
    place(
      namedBox('compatibility checks', { width: columns[2].width, height: 100, color: 'dim' }),
      columns[2],
    ),
  ];
  const stops = pipelinePath.columns(3, 'wide').map((cell) => cell.point());
  const links = [0, 1].map((i) => arrow(stops[i], stops[i + 1], { stroke: 'faint', width: 3 }));
  const message = token([
    [OP.key, COLOR.op],
    ['text: excerpt', COLOR.attempt],
  ]).moveTo(stops[0]);
  const translatedMessage = token([
    [OP.key, COLOR.op],
    ['content: excerpt', COLOR.attempt],
  ]).moveTo(stops[1]);
  const dataAllowed = beside(
    note('data allowed', { color: COLOR.sure }),
    adapters[0],
    'above',
    'tight',
  );
  const translated = beside(
    note('roles · tools · schema · context', { color: COLOR.attempt }),
    adapters[1],
    'under',
    'tight',
  );
  const refusal = beside(note('refusal · incomplete response'), adapters[2], 'under', 'tight');
  const compatible = place(
    chip('route tested', { color: COLOR.sure, stroke: COLOR.sure }),
    pipelineFoot,
    'right',
  );
  const log = place(
    chip('log excerpt: read only', { color: COLOR.sure, stroke: COLOR.sure }),
    pipelineFoot,
    'left',
  );
  const sizeNote = place(
    note('Measure cost and accuracy on the log task'),
    pipelineFoot,
    'right',
  );
  const pipeline = [...adapters, ...links, message];

  // Band 2. The cached observation on a line of time, and the claim about now.
  const [seenRow, lineRow, rulesRow] = bottom.rows(3, 'none');
  const age = ageLine(lineRow.inset('wide', 'none'), { past: AGE, fresh: FRESH });
  const cached = (state) =>
    beside(
      token(
        [
          [seen.jobId, COLOR.sure],
          [state, 'ink'],
        ],
        COLOR.sure,
      ),
      age.start,
      'above',
      'wide',
      'left',
    );
  const observed = cached(seen.state);
  const completed = cached('completed');
  const lastSeen = beside(
    note('what was last seen', { color: COLOR.sure }),
    observed,
    'right',
    'normal',
  );
  const claim = beside(
    chip('finished now?', { color: 'dim', stroke: 'dim', dash: [10, 8] }),
    age.now,
    'above',
    'wide',
    'right',
  );
  const noClaim = beside(
    chip('finished now: cannot say', { color: COLOR.fail, stroke: COLOR.fail }),
    age.now,
    'above',
    'wide',
    'right',
  );
  const flag = place(
    column(
      [
        token('has_live_evidence: true', 'dim', { dash: [10, 8] }),
        note('model label on the cached record', { color: COLOR.fail }),
      ],
      {
        gap: 'tight',
        align: 'center',
      },
    ),
    seenRow,
  );
  const rules = [
    'through a trusted adapter',
    'the right run and operation',
    'new enough for the claim',
  ].map((words) => chip(words, { color: COLOR.mark, stroke: COLOR.mark }));
  place(row(rules), rulesRow, 'left');
  const dated = place(
    label('Last seen completed 40 minutes ago', { size: 34, color: 'dim' }),
    seenRow,
  );

  // Band 3. The card of a handoff, and three rules for it.
  const fields = [
    ['task', 'rollback, approved', 'ink'],
    ['key', OP.key, COLOR.op],
    ['payload', payload, COLOR.op],
    ['last seen', `${seen.jobId} completed, ${AGE}`, COLOR.sure],
    ['state', 'unresolved', COLOR.mark],
    ['attempts', 'a1, a2', COLOR.attempt],
    ['stop', 'no route meets the claim', COLOR.fail],
  ].map(([name, value, color]) => [note(name), mono(value, { size: 34, color })]);
  const [cardSide, ruleSide] = bottom.columns(2, 'wide');
  place(grid(fields.flat(), { columns: 2, gap: ['wide', 'tight'] }), cardSide, 'left');
  const answer = chip('answer: unavailable, or a handoff', {
    color: COLOR.mark,
    stroke: COLOR.mark,
  });
  const cardRules = [
    'allowlisted, redacted fields: no raw transcript',
    'cached access: this caller, permission checked now',
    'a user cancel starts no fallback',
  ].map((words) => chip(words, { color: 'ink', stroke: 'dim' }));
  place(column([answer, ...cardRules], { gap: 'normal' }), ruleSide, 'left');

  s.add(
    heading(c.title),
    providers,
    agent,
    panel,
    panelName,
    operation,
    job,
    lane,
    arm,
    gate.nodes,
    shared,
    adapters,
    links,
  );
  c.clear([...links, lane], 0.46, 0.2);
  c.show('fallback-processor', dataAllowed);
  c.on('fallback-processor', () => s.play(appear(message)));
  c.on('fallback-format', () => s.play(travel(message, stops[1], { duration: 0.9 })));
  c.on('fallback-format', () => s.play(vanish(message), appear(translatedMessage)), 1.1);
  c.show('fallback-format', translated, { after: true });
  c.show('fallback-refusal', refusal);
  c.on('fallback-refusal', () => s.play(travel(translatedMessage, stops[2], { duration: 0.9 })));
  c.on('fallback-switch', () => s.play(indicate(adapters[2], { color: COLOR.mark, scale: 1 })));
  c.show('fallback-switch', compatible, { after: true });
  c.after('fallback-switch', () => s.play(route.to(1, { duration: 0.6 })));
  c.show('narrower', [narrow, log]);
  c.on('narrower', () => s.play(gate.open.to(0, { duration: 0.6 })));
  c.swap('model-size', compatible, sizeNote);
  c.on('shared-state', () => s.play(indicate(shared, { color: COLOR.mark, scale: 1 })));
  c.show('shared-dependency', [failing, failingName]);

  // A cache from 40 minutes ago: it says what was seen, and nothing about now.
  c.hide(1, links, { lead: 0.5, fade: 0.2 });
  c.swap(
    1,
    [...adapters, translatedMessage, dataAllowed, translated, refusal, log, sizeNote, job],
    [age.nodes, unknownJob, currentUnknown],
  );
  c.show('cache-says', observed);
  c.show('last-observed', lastSeen);
  c.show('stale-evidence', claim);
  c.swap('stale-evidence', claim, noClaim, { after: true });
  c.show('evidence-rules', rules[0]);
  c.show('right-run', rules[1]);
  c.show('freshness', [rules[2], age.band, age.bandName]);
  c.show('generated-flag', flag);
  c.hide('completed-old', lastSeen);
  c.swap('completed-old', observed, completed);
  c.on('completed-old', () => s.play(indicate(age.bandName, { color: COLOR.mark, scale: 1 })), 1.2);
  c.swap('dated-report', flag, dated);

  // No route can make the claim: the answer is "unavailable", or a handoff with these fields.
  c.swap(
    2,
    [...age.nodes, completed, noClaim, ...rules, age.band, age.bandName, dated],
    fields.map((field) => field[0]),
  );
  c.show('unavailable', answer);
  ['h-task', 'h-key', 'h-payload', 'h-observation', 'h-state'].forEach((cue, index) =>
    c.show(cue, fields[index][1]),
  );
  c.show('h-attempts', [fields[5][1], fields[6][1]], { stagger: true });
  c.show('allowlist', cardRules[0]);
  c.show('recheck-permission', cardRules[1]);
  c.show('no-cancel-fallback', cardRules[2]);
}
