import {
  assertEqual,
  circle,
  column,
  group,
  indicate,
  line,
  place,
  polygon,
  row,
} from 'vizmatic/stage';
import { heading, label, mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import { applyPortalAction } from '../../../films/gui-agent-loop/model.mjs';
import { INITIAL_PORTAL } from '../../../films/gui-agent-loop/fixtures.mjs';
import { MAIN, TRACE, footer } from '../parts.mjs';
import { aimAt, browserPane, outline, proposedPoint } from '../inspection-desk.mjs';

export default function subjectIntro(s, c) {
  const [browser, draft] = MAIN.rows([3.1, 1.2], 'wide');
  const page = browserPane(browser, 'ci.example  /  recent runs', [1, 5]);
  const [result, decision] = page.body.inset('normal').columns([1.1, 1], 'wide');
  const failure = group(
    circle(66, { fill: 'pink', stroke: null }),
    line([-23, -23], [23, 23], { stroke: 'bg', width: 12 }),
    line([-23, 23], [23, -23], { stroke: 'bg', width: 12 }),
  );
  const runId = TRACE.searched.state.runId;
  const failedTest = place(
    row(
      [
        failure,
        column(
          [mono(runId, { color: 'dim', size: 40 }), label('Parser test failed', { size: 76 })],
          {
            align: 'left',
            gap: 'tight',
          },
        ),
      ],
      { gap: 'normal' },
    ),
    result,
    'left',
  );

  const [buttons, status] = decision.rows([1.8, 1], 'normal');
  const [readAction, deployAction] = buttons.columns(2, 'normal');
  const action = (area, name, color) =>
    place(namedBox(name, { width: area.width, height: 124, size: 52, color }), area, 'bottom');
  const open = action(readAction, 'Open run', 'cyan');
  const deploy = action(deployAction, 'Deploy', 'yellow');
  const proposal = proposedPoint(deploy);
  const [x, y] = aimAt(deploy);
  const pointer = polygon(
    [
      [5, 5],
      [12, 67],
      [28, 51],
      [43, 77],
      [55, 70],
      [40, 45],
      [63, 41],
    ].map(([dx, dy]) => [x + dx, y + dy]),
    { fill: 'yellow', stroke: 'bg', width: 3 },
  );
  const deployStatus = status.columns(2, 'normal')[1];
  const proposed = place(
    note('Proposed click', { color: 'yellow', size: 38 }),
    deployStatus,
    'top',
  );
  const blocked = applyPortalAction(INITIAL_PORTAL, { ...INITIAL_PORTAL, kind: 'rerun-deploy' });
  assertEqual(blocked.decision, 'outside-task-scope', 'deploy is outside this inspection');
  const count = Number(blocked.decision === 'dispatched');
  const held = place(
    note('Deploy clicks sent   ' + count, { color: 'pink', size: 38 }),
    status,
    'top right',
  );

  const [file, field] = draft.inset('wide', 'normal').columns([1, 2.1], 'wide');
  const paper = place(
    column([label('Local draft', { size: 50 }), mono(runId, { color: 'dim', size: 34 })], {
      align: 'left',
      gap: 'tight',
    }),
    file,
    'left',
  );
  const [fieldName, input] = field.rows(2, 'tight');
  const traceback = [
    place(note('Parser traceback', { size: 36 }), fieldName, 'left'),
    line(input.point('bottom left'), input.point('bottom right'), { stroke: 'dim', width: 3 }),
  ];
  const [left, bottom] = input.point('bottom left');
  const caret = line([left + 8, bottom - 44], [left + 8, bottom - 7], { stroke: 'blue', width: 5 });
  const prompt = footer('Send this click?', 'yellow');
  s.add(
    heading(c.title),
    page.shell,
    failedTest,
    open,
    deploy,
    proposed,
    proposal,
    pointer,
    outline(draft, 'dim'),
    paper,
    traceback,
  );
  c.on('point', () => s.play(indicate(proposal, { color: 'yellow', scale: 1.65, duration: 0.6 })));
  c.show('task', caret);
  c.show('question', prompt);
  c.swap('withhold', [prompt, proposed, proposal, pointer], held, { after: true });
  c.after('withhold', () => s.play(tint(deploy, 'dim')));
  c.on('open-run', () => s.play(tint(open, 'yellow')));

  const routes = draft.inset('wide', 'normal').columns(3, 'wide');
  const route = (i, task, method) =>
    place(
      column([note(task, { size: 34 }), label(method, { size: 48, color: 'cyan' })], {
        align: 'left',
        gap: 'tight',
      }),
      routes[i],
      'left',
    );
  c.swap('api', [paper, traceback, caret], route(0, 'Run status', 'Supported API'));
  c.show('selector', route(1, 'Known file', 'Stable selector'));
  c.show('canvas', route(2, 'Interactive traceback', 'Visual agent'));
}
