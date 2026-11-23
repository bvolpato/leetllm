import { assertEqual, boxOf, dot, fadeIn, fadeOut, moveTo, place, rect, seq } from 'vizmatic/stage';
import { heading, label, mono, note, tint } from '../../kit-narrated.mjs';
import { applyPortalAction } from '../../../films/gui-agent-loop/model.mjs';
import { MAIN, TRACE, footer } from '../parts.mjs';
import { browserPane, button, outline, proposedPoint } from '../inspection-desk.mjs';

export default function freshness(s, c) {
  const before = { ...TRACE.searched.state, frameId: '2A' };
  const live = { ...before, version: before.version + 1, frameId: '2B' };
  const proposal = { ...before, kind: 'expand-failure' };
  const stale = applyPortalAction(live, proposal);
  const fresh = applyPortalAction(live, {
    ...proposal,
    frameId: live.frameId,
    version: live.version,
  });
  const draft = applyPortalAction(fresh.state, {
    ...fresh.state,
    kind: 'save-local-draft',
    line: 'KeyError: status',
  });
  assertEqual(stale.decision, 'stale-observation', 'the frame changed');
  assertEqual(fresh.decision, 'dispatched', 'the same read on the new frame');
  assertEqual(draft.state.draft, 'RUN-78432 · KeyError: status', 'local draft contents');

  const [savedRegion, liveRegion] = MAIN.columns(2, 'wide');
  const pages = [
    browserPane(savedRegion, 'Saved observation  /  session-9'),
    browserPane(liveRegion, 'Current portal  /  session-9'),
  ];
  const rows = pages.map((p) => p.body.rows(5, 'normal'));
  const frame = (i, id) =>
    place(mono('Capture ' + id, { color: 'blue', size: 40 }), rows[i][0], 'left');
  const run = (i) => place(label(live.runId, { size: 44 }), rows[i][1], 'left');
  const status = (i) => [
    outline(rows[i][2], 'blue'),
    place(note('Run status updated', { color: 'blue', size: 36 }), rows[i][2]),
  ];
  const savedTab = button(rows[0][2], 'Failed tests');
  const liveTab = button(rows[1][2], 'Failed tests');
  const newLivePosition = rows[1][3].point('center');
  const target = [newLivePosition[0] - boxOf(liveTab).width / 2 + 28, newLivePosition[1]];
  const ghost = proposedPoint(savedTab);
  const livePoint = proposedPoint(liveTab);
  const count = (n) =>
    place(note('Failed tests clicks sent   ' + n, { size: 38 }), rows[1][4], 'left');
  const zero = Number(stale.decision === 'dispatched');
  const afterClick = zero + Number(fresh.decision === 'dispatched');
  const counter = count(zero);
  const question = footer('Where would the old click land?', 'yellow');
  const reject = footer('Capture 2A is stale. Request a new observation.', 'pink');
  const current = footer('RUN-78432   /   one actionable Failed tests tab', 'cyan');
  const savedId = frame(0, before.frameId);
  const oldLiveId = frame(1, before.frameId);
  const liveId = frame(1, live.frameId);
  const newSavedId = frame(0, live.frameId);
  const latestTab = button(rows[0][3], 'Failed tests');
  const savedStatus = status(0);
  const cursor = dot(13, 'yellow').moveTo(rows[1][2].point('right'));
  const error = place(mono('KeyError: status', { color: 'cyan', size: 44 }), rows[1][3], 'left');
  const saved = place(mono('KeyError: status', { color: 'green', size: 44 }), rows[0][3], 'left');
  const underline = (text) => boxOf(text).grow('tight').point('bottom');
  const copy = rect(boxOf(error).width, 6, { fill: 'green', stroke: null })
    .moveTo(underline(error));
  s.add(
    heading(c.title),
    pages.flatMap((p) => p.shell),
    run(0),
    run(1),
    savedId,
    oldLiveId,
    savedTab,
    liveTab,
    counter,
  );
  c.show('saved-point', [ghost, livePoint]);
  c.swap('reflow', oldLiveId, liveId);
  c.on('reflow', () => s.play(moveTo(liveTab, newLivePosition, { duration: 0.6 })));
  c.show('reflow', status(1), { lead: -0.65 });
  c.show('predict', question);
  c.swap('reject', question, reject, { after: true });
  c.after('reject', () => s.play(tint(savedTab, 'dim')));
  c.swap('recapture', [savedId, savedTab, ghost], [newSavedId, latestTab, savedStatus]);
  c.hide('recapture', livePoint);
  c.swap('resolve', reject, current);
  c.on('resolve', () => s.play(tint(latestTab, 'yellow'), tint(liveTab, 'yellow')));
  c.show('send', cursor);
  c.on('send', () => s.play(moveTo(cursor, target, { duration: 0.45 })), 0.12);
  c.swap('send', counter, count(afterClick), { after: true });
  c.swap('opened', [cursor, liveId, liveTab], [frame(1, '3'), error]);
  const localTitle = place(
    note('Local draft  /  this device', { color: 'green', size: 32 }),
    savedRegion.inset('normal').rows([1, 7], 'normal')[0],
    'left',
  );
  c.swap('draft', [pages[0].shell[1], newSavedId, latestTab, savedStatus], localTitle);
  c.show('draft', copy);
  c.on(
    'draft',
    () => s.play(seq(
      moveTo(copy, underline(saved), { duration: 0.8 }),
      fadeIn(saved, { duration: 0.2 }),
      fadeOut(copy, { duration: 0.2 }),
    )),
    0.3,
  );
  c.swap('verified', current, footer('Verified locally   ·   ' + draft.state.draft, 'green'), {
    after: true,
  });
}
