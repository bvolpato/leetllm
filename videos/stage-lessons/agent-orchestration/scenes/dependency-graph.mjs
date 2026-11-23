// Scene `dependency-graph`: an edge says when a node may run.
//
// The picture: the board. A run goes triage, then the three checks, and the cards arrive at the
// barrier in the order policy, eval, health. The gates open only at the third. Then each node gets
// its kind, the join reads the cards rule by rule, and a rejected review sends the token back:
// the one cycle. A strip of states in the band follows the token.
import {
  arrow,
  beside,
  boxOf,
  column,
  draw,
  fitted,
  grid,
  group,
  indicate,
  lagged,
  par,
  pictogram,
  place,
  pulse,
  recolor,
  rect,
  row,
  seq,
  spin,
  steps,
} from 'vizmatic/stage';
import { readSchedule } from '../../../films/agent-orchestration/arithmetic.mjs';
import { REQUEST } from '../../../films/agent-orchestration/fixtures.mjs';
import { chip, display, heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  BAND,
  BRANCHES,
  BRANCH_COLOR,
  CORNER,
  FRESH_SECONDS,
  MARK,
  QUIET,
  VALID,
  WRONG,
  board,
} from '../parts.mjs';

/** The seconds of each read, from the model: eval, health, policy. */
const SECONDS = readSchedule(0).branches.map((branch) => branch.duration);

export default function dependencyGraph(s, c) {
  const b = board(s);
  const { triage, checks, plates, ask, fan, packetFrame } = b.nodes;
  s.add(heading(c.title));
  b.enter(c);

  // Beat 0. Nodes, arrows, and one run. The table in the band says what each node waits for.
  const tag = (words, color = 'ink') => chip(words, { color, stroke: color });
  const waits = [
    { node: [tag('triage')], after: [tag('request')] },
    { node: BRANCHES.map((branch, i) => tag(branch, BRANCH_COLOR[i])), after: [tag('triage')] },
    { node: [tag('merge')], after: BRANCHES.map((branch, i) => tag(branch, BRANCH_COLOR[i])) },
  ].map((entry) => ({
    node: row(entry.node, { gap: 'tight' }),
    word: note('after'),
    after: row(entry.after, { gap: 'tight' }),
  }));
  const table = place(
    grid(
      waits.flatMap((entry) => [entry.node, entry.word, entry.after]),
      { columns: 3, gap: ['normal', 'normal'], align: ['right', 'center', 'left'], even: true },
    ),
    BAND,
    'left',
  );
  const tableRow = (i) => [waits[i].node, waits[i].word, waits[i].after];

  // The frame of the packet takes the color and keeps its size: its name is on its border.
  const light = (part) => indicate(part, { color: MARK, scale: part === packetFrame ? 1 : 1.14 });
  c.on('nodes', () => s.play(light([triage, ...checks]), light(packetFrame)));
  c.on('arrows', () =>
    s.play(
      ask.pulse({ color: MARK }),
      ...fan.map((edge) => edge.pulse({ color: MARK })),
      indicate(plates, { color: MARK }),
    ),
  );

  // The run. The slowest card arrives as the voice ends "merge waits for all three".
  const first = c.cue('read-branches'),
    merge = c.cue('merge-ready');
  const launch = first.start + (first.end - first.start) * 0.45;
  const opens = merge.end;
  const travel = SECONDS.map((seconds) => ((opens - launch) * seconds) / Math.max(...SECONDS));
  c.show('read-branches', tableRow(0));
  c.on('read-branches', () =>
    s.play(indicate(triage, { color: MARK }), ...fan.map((edge) => edge.pulse({ color: MARK }))),
  );
  c.show('read-branches', tableRow(1), { lead: -(launch - first.start) });
  c.on(
    'read-branches',
    () =>
      s.play(
        indicate(checks, { color: MARK }),
        ...b.card.map((card) => card.shown.to(1, { duration: 0.2 })),
        ...b.card.map((card, i) =>
          seq(card.pos.to(1, { duration: travel[i] }), b.gate[i].lamp.to(1, { duration: 0.15 })),
        ),
      ),
    launch - first.start,
  );
  c.show('merge-ready', tableRow(2), { after: true });
  c.after(
    'merge-ready',
    () =>
      s.play(
        ...b.gate.map((gate) => gate.open.to(1, { duration: 0.3 })),
        ...b.card.map((card) => card.pos.to(2, { duration: 0.8 })),
        light(packetFrame),
      ),
    0,
  );
  c.on('no-path-back', () =>
    s.play(lagged([triage, checks, plates, packetFrame].map(light), { lag: 0.45 })),
  );
  const dag = place(
    column([note('read phase'), display('DAG', { color: MARK })], { gap: 'tight' }),
    CORNER,
    'top left',
  );
  c.show('dag', dag);

  // Beat 1. The kind of each node, in its lane. Then the join as code: three rules, read in turn.
  const kinds = [
    ['model', 'model'],
    ['database', 'database read'],
    ['code', 'code'],
  ].map(([art, words], i) =>
    place(
      row([pictogram(art, { size: 60, color: QUIET, accent: BRANCH_COLOR[i] }), label(words)], {
        gap: 'normal',
      }),
      boxOf(plates[i]).inset('normal', 'tight'),
      'left',
    ),
  );
  c.show('operation-node', kinds[2]);
  c.show('kind-database', kinds[1]);
  c.show('kind-model', kinds[0]);
  c.on('model-specialist', () => s.play(indicate(kinds[0], { color: MARK })));
  const rules = [
    `tenant == ${REQUEST.tenant}`,
    `revision == v${REQUEST.version}`,
    `age <= ${FRESH_SECONDS} s`,
  ].map((words) => mono(words));
  const validator = place(
    column(
      [
        row([
          pictogram('code', { size: 60, color: QUIET, accent: VALID }),
          label('the join is code'),
        ]),
        ...rules,
      ],
      {
        gap: 'normal',
      },
    ),
    BAND,
    'left',
  );
  c.swap('deterministic-merge', table, validator);
  c.after('deterministic-merge', () =>
    s.play(
      seq(
        ...rules.map((rule, field) =>
          par(
            recolor(rule, VALID, { duration: 0.5 }),
            ...b.card.map((card) => card.read.to(field + 1, { duration: 0.5 })),
          ),
        ),
      ),
    ),
  );

  // Beat 2. The control flow around the read phase: a pause, a retry inside a node, and one way back.
  const [upper, lower] = BAND.rows(2, 'none');
  const strip = place(
    fitted(BAND, (width) =>
      steps(['read DAG', 'proposal', 'review', 'write'], { width, size: 40, current: 2 }),
    ),
    lower,
    'top',
  );
  const revisionChange = place(
    column([note('Optional revision route'), note('Configured by application', { color: MARK })], {
      gap: 'tight',
    }),
    upper,
    'top right',
  );
  c.swap(2, [validator, ...kinds], strip);
  c.onBeat(2, () =>
    s.play(
      ...b.card.map((card) => card.verdict.to(1, { duration: 0.3 })),
      seq(
        b.packet.seal.to(1, { duration: 0.4 }),
        pulse(b.nodes.steps[0], { color: VALID }),
        b.token.shown.to(1, { duration: 0.3 }),
      ),
    ),
  );
  const down = boxOf(b.nodes.steps[0]);
  const bar = () => rect(10, 34, { radius: 3, fill: MARK, stroke: null });
  const paused = beside(group(bar().at(-9, 0), bar().at(9, 0)), down, 'right', 'normal');
  c.show('pause', paused);
  c.hide('retry-inside', paused);
  const retry = place(
    pictogram('loop', { size: 64, color: QUIET, accent: MARK }),
    boxOf(plates[1]).inset('normal', 'tight'),
    'left',
  );
  c.show('retry-inside', retry);
  c.on('retry-inside', () => s.play(spin(retry, 3, { duration: 2.4 })));
  c.hide('review-cycle', retry);

  // This optional route does not execute a source refresh or the article's review node.
  const backX = down.cx + 60;
  const back = arrow([backX, down.bottom], [backX, down.top], { stroke: MARK, width: 4 });
  const stripBack = arrow(
    strip.toWorld(...strip.p(2, 'top')),
    strip.toWorld(...strip.p(1, 'top')),
    {
      stroke: MARK,
      width: 4,
      bend: 60,
      pad: 10,
    },
  );
  const rejected = beside(
    note('optional revision', { color: MARK }),
    boxOf(stripBack),
    'above',
    'tight',
  );
  c.show('review-cycle', [draw(back), draw(stripBack), rejected]);
  c.on('review-cycle', () =>
    s.play(
      seq(
        b.token.refused.to(1, { duration: 0.3 }),
        par(
          strip.go(1),
          b.token.shown.to(0, { duration: 0.4 }),
          b.packet.seal.to(0, { duration: 0.4 }),
          ...b.card.flatMap((card) => [
            card.verdict.to(0, { duration: 0.4 }),
            card.read.to(0, { duration: 0.4 }),
          ]),
        ),
        b.token.refused.to(0, { duration: 0.1 }),
        strip.go(2),
      ),
    ),
  );
  c.show('review-cycle', revisionChange, { lead: -1.8 });
  const machine = place(label('state machine', { color: MARK }), upper, 'top left');
  c.show('state-machine', machine);
  c.on('state-machine', () => s.play(indicate(dag, { color: MARK })));
  const cancelled = place(
    note('Article: rejection → cancel', { color: WRONG }),
    upper,
    'top right',
  );
  c.swap('review-cancel', [back, stripBack, rejected, revisionChange], cancelled);

  // Clear the revised evidence before the standing board returns to its shared rest state.
  c.clear(
    [...b.card.flatMap((card) => [card.shown, card.verdict]), b.packet.seal, b.token.shown],
    0.8,
    0.25,
  );
  b.leave(c);
}
