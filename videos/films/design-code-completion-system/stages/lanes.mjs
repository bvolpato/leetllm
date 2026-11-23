import { completionCue } from '../construction.mjs';
import { drawBuffer, drawOutcome, assignment, member, memberReply, oldReply } from '../editor.mjs';
import { text, code } from '../defaults.mjs';
import { route } from '../model.mjs';

export function drawLanes(ctx, scene, state, api) {
  const after = (id) => completionCue(state, id) === 1;
  const { C } = api;
  const hole = after('lanes-assignment');
  const missing = after('lanes-stay');
  const chosen = route(hole ? '=' : '.', !hole, !missing);
  drawBuffer(ctx, api, {
    live: hole ? oldReply.captured : memberReply.captured,
    line: hole ? assignment : member,
  });
  api.focus.target('lane-member', () => {
    text(
      ctx,
      api,
      after('lanes-local') ? 'Local identifier index' : 'Local type information',
      145,
      650,
      34,
      C.muted,
    );
    code(
      ctx,
      api,
      after('lanes-local')
        ? 'Polic → PolicyGraph'
        : after('lanes-members')
          ? 'PolicyGraph.allows'
          : 'graph  :  PolicyGraph',
      145,
      757,
      46,
      C.cyan,
    );
  });
  api.focus.target('lane-hole', () => {
    text(ctx, api, 'Expression between these lines', 966, 650, 34, C.muted);
    code(ctx, api, hole ? 'is_allowed = …' : '…', 966, 744, 44, C.yellow);
    if (hole) code(ctx, api, 'return is_allowed', 966, 820, 40, C.muted);
  });
  const label = !hole
    ? 'Known receiver'
    : missing
      ? 'Upload permission missing'
      : after('lanes-send')
        ? 'Upload permitted'
        : 'Which expression fits here?';
  const destination =
    chosen === 'LOCAL SEMANTIC'
      ? 'Local member lookup'
      : chosen === 'LOCAL FALLBACK'
        ? 'Local fallback'
        : 'Remote infill';
  drawOutcome(ctx, api, !hole || after('lanes-send') ? label + '   →   ' + destination : label);
}
export default {
  id: 'lanes',
  draw: drawLanes,
  cues: ['lanes-members', 'lanes-assignment', 'lanes-send', 'lanes-stay', 'lanes-local'],
};
