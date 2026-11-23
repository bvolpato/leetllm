import { assertEqual, boxOf, moveTo, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note, tint } from '../../kit-narrated.mjs';
import { applyPortalAction, freshScopedControls } from '../../../films/gui-agent-loop/model.mjs';
import { TRACE, footer } from '../parts.mjs';
import {
  browserPane,
  draftPaper,
  failedTestRows,
  outline,
  paperArea,
  proposedPoint,
  screenArea,
  scopedTabs,
} from '../inspection-desk.mjs';

export default function choose(s, c) {
  const example = freshScopedControls();
  const intendedRun = example.intendedRun;
  const controls = example.controls.map(({ run, label }) => ({ run, label }));
  const updated = controls.map((tab) => ({ ...tab, run: intendedRun }));
  const matches = scopedTabs(updated, intendedRun);
  const previousFrame = 7,
    currentFrame = previousFrame + 1;
  const live = { ...TRACE.searched.state, version: currentFrame, frameId: 'frame-' + currentFrame };
  const oldProposal = {
    ...live,
    version: previousFrame,
    frameId: 'frame-' + previousFrame,
    kind: 'expand-failure',
  };
  const stale = applyPortalAction(live, oldProposal);
  const retry = matches.length === 1 ? 'check-actionability' : 'ambiguous-target';
  const sent = [stale.decision, retry].filter((decision) => decision === 'dispatched').length;
  assertEqual(stale.decision, 'stale-observation', 'frame seven is stale');
  assertEqual(retry, 'ambiguous-target', 'the fresh proposal still lacks a unique target');
  assertEqual(scopedTabs(controls, intendedRun).length, 1, 'one scoped tab in the earlier layout');
  assertEqual(matches.length, 2, 'two scoped tabs after reflow');
  assertEqual(
    sent,
    0,
    'both the stale proposal and the ambiguous retry leave the browser untouched',
  );
  const page = browserPane(screenArea, 'ci.example  /  layout comparison');
  const tabs = failedTestRows(page.body, controls);
  const paper = draftPaper();
  const stampArea = screenArea.inset('normal').rows([1, 7], 'normal')[0];
  const stamp = (frame) =>
    place(mono('frame ' + frame, { size: 36, color: 'blue' }), stampArea, 'right');
  const old = stamp(previousFrame),
    now = stamp(currentFrame);
  const [owner, topTab, bottomTab] = page.body.inset('normal').rows([0.8, 1, 1.1], 'wide');
  const combinedPanel = outline(page.body, 'grid');
  const marker = proposedPoint(tabs[0].tab);
  const proposal = paper.state('Proposal from frame ' + previousFrame, 'yellow');
  const current = paper.state('New observation: frame ' + currentFrame, 'blue');
  const ask = footer('Which tab opens the parser failure?', 'yellow');
  const selection = place(
    rect(page.body.width, page.body.height, { fill: null, stroke: 'yellow', width: 4, radius: 12 }),
    page.body,
  );
  const answer = footer(
    'Within RUN-78432   ·   ' + matches.length + ' targets   ·   ' + sent + ' clicks sent',
    'yellow',
  );
  const disposition = paper.state('Draft unverified', 'pink');
  s.add(
    heading(c.title),
    page.shell,
    tabs.flatMap((r) => r.nodes),
    paper.base,
    old,
  );
  c.show('proposal', [proposal, marker]);
  c.swap('reflow', [old, marker, tabs[0].frame, tabs[1].frame, tabs[1].run], [now, combinedPanel]);
  const runPosition = [owner.left + boxOf(tabs[0].run).width / 2, owner.point('center')[1]];
  c.on('reflow', () =>
    s.play(
      moveTo(tabs[0].run, runPosition),
      moveTo(tabs[0].tab, topTab.point('center')),
      moveTo(tabs[1].tab, bottomTab.point('center')),
      { duration: 0.85 },
    ),
  );
  c.swap('recapture', proposal, current, { after: true });
  c.show('filter', selection);
  c.on('filter', () => s.play(...tabs.map(({ tab }) => tint(tab, 'yellow'))));
  c.show('predict', ask);
  c.swap('stop', ask, answer, { after: true });
  c.swap('file', current, disposition, { after: true });
  const [recipient, subject, question] = paperArea.inset('wide').rows([0.8, 1, 2, 1], 'normal');
  const questionLines = question.rows(2, 'tight');
  c.swap('handoff', paper.base, [
    outline(paperArea, 'blue'),
    place(note('Question for the reviewer', { color: 'blue', size: 36 }), recipient, 'left'),
    place(mono(intendedRun + '  /  frame ' + currentFrame, { size: 34 }), subject, 'left'),
    place(label('Which tab opens', { size: 52 }), questionLines[0], 'bottom left'),
    place(label('the parser failure?', { size: 52 }), questionLines[1], 'top left'),
  ]);
}
