import { desk, said } from '../document-desk.mjs';
import { RULES } from '../fixtures.mjs';
import { introSnapshot } from '../model.mjs';

export function drawSubjectIntro(ctx, scene, state, api) {
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const { C, ink, sheet, pair, rule, focus, visible, progress } = desk(ctx, api);
  const beat = state.beat ?? 0;
  const { saved, storedRules } = introSnapshot(state);
  const [urgent, routine] = RULES;
  const paging = urgent.action + ' within ' + urgent.time + ' ' + urgent.unit + ' with deploy ID.';
  const archive = routine.action + ' within ' + routine.time + ' ' + routine.unit + '.';
  const both = storedRules.includes(urgent);
  const citation = api.clamp(0.12 + state.t / 1.6);
  const lift = 1 - api.ease(citation);
  const fold = 54 + 52 * lift;

  ctx.save();
  ctx.translate(50 * lift, 26 * lift);
  focus('open-page', () => {
    api.path(ctx, [
      { x: 115, y: 230 }, { x: 919 - fold, y: 230 }, { x: 919, y: 230 + fold },
      { x: 919, y: 832 }, { x: 115, y: 832 },
    ], { closed: true, fill: C.ink, color: C.ink, width: 3 });
    api.path(ctx, [
      { x: 919 - fold, y: 230 }, { x: 919 - fold, y: 230 + fold }, { x: 919, y: 230 + fold },
    ], { closed: true, fill: C.blue, width: 0 });
    ink('Release runbook', 158, 332, 61, C.bg, 'left', 'serif');
    ink('Revision 7   /   Page 7', 161, 394, 31, C.panel);
    rule(160, 431, 871, 431, C.muted);
    focus('urgent', () => pair(160, 536, urgent.event, paging, C.bg));
    focus('register-rows', () => pair(160, 710, 'Routine deploy notes', archive, C.bg));
  });
  ctx.restore();

  if (!saved) {
    focus('incident', () => {
      ink('Failed rollback', 1060, 320, 34, C.blue);
      ink('When do I page on-call?', 1060, 400, 55, C.ink, 'left', 'serif');
    });
    focus('reply', () => {
      ink('Assistant reply', 1060, 535, 33, C.muted);
      ink('“Archive it within', 1060, 625, 65, C.ink, 'left', 'serif');
      ink(routine.time + ' ' + routine.unit + '.”', 1060, 735, 96, C.yellow, 'left', 'serif');
    });
    focus('open-page', () => {
      ink('Cited page 7', 1082, 836, 34, C.cyan);
      const trail = [{ x: 1055, y: 824 }, { x: 975, y: 824 }, { x: 975, y: 350 }, { x: 924, y: 350 }];
      const tip = api.trace(ctx, trail, citation, C.cyan, 4);
      api.circle(ctx, tip.x, tip.y, 10, C.cyan);
    });
    return;
  }

  focus('open-extract', () => {
    sheet(1008, 230, 802, 602, 'Saved parser output   /   page 7', C.cyan);
    if (both) focus('both-lines', () => pair(1048, 536, urgent.event, paging, C.green));
    else if (visible('both-lines')) focus('both-lines', () =>
      ink('Reading the second extract…', 1048, 561, 32, C.muted));
    else if (said(state, 'first-loss')) focus('first-loss', () =>
      ink('No paging rule in this extract', 1048, 561, 36, C.pink));
    focus('register-rows', () => {
      const aligned = beat > 1 ? 1 : progress('register-rows', 0);
      const y = api.lerp(536, 710, aligned);
      pair(1048, y, 'Routine deploy notes', archive);
      if (aligned > 0) rule(921, 710, 921 + 84 * aligned, y, C.cyan, 3);
    });
  });
  if (beat === 1) ink('Where did the paging rule first go missing?', 960, 937, 41, C.yellow, 'center');
  else if (both) {
    if (visible('archive-hit')) focus('archive-hit', () => {
      ink('Retrieved passage', 117, 923, 31, C.cyan);
      if (said(state, 'archive-hit')) ink('Routine deploy notes. ' + archive, 117, 980, 38);
    });
    if (visible('next-handoff')) focus('next-handoff', () =>
      ink('Inspect the indexed chunk.', 1050, 980, 38, C.yellow));
  }
  else focus('first-loss', () => ink('Compare the original with the saved text.', 960, 937, 40, C.yellow, 'center'));
}

export default {
  id: 'subject-intro', draw: drawSubjectIntro,
  cues: ['incident', 'reply', 'open-page', 'urgent', 'open-extract', 'register-rows', 'first-loss', 'both-lines', 'archive-hit', 'next-handoff'],
};
