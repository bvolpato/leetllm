import { candidates } from '../fixtures.mjs';
import { text } from '../defaults.mjs';
import { plurality } from '../model.mjs';
import { roomPlan, verifiedChairs } from '../seating.mjs';
import { sceneClock } from '../scene-clock.mjs';

export function drawCandidates(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneClock(scene, state);
  const changed = cue('replace-candidate').done;
  const rechecking = cue('replace-candidate').started;
  const pool = candidates.map((n, i) => (i === 2 && changed ? 40 : n));
  const accepted = verifiedChairs(pool);
  const voted = cue('plurality-vote').done;
  const checked = rechecking ? cue('empty-selection').done : cue('arithmetic-check').done;
  roomPlan(ctx, api);
  text(ctx, api, 'Room count', 118, 214, 30, C.muted);
  text(ctx, api, '4 × 8  +  12  =  44 chairs', 535, 936, 48, C.ink, 'center');
  const left = 1060;
  text(ctx, api, 'Candidate drafts', left, 256, 36, C.ink);
  api.focus.target('answer-candidates', () => {
    for (const [i, n] of pool.entries()) {
      const x = left + (i % 2) * 350,
        y = 305 + Math.floor(i / 2) * 156;
      const draft = () => {
        const color = checked && accepted.includes(n) ? C.green : C.blue;
        api.rect(ctx, x, y, 302, 126, C.panel, color, 12);
        text(ctx, api, `D${i + 1}`, x + 24, y + 46, 29, C.muted);
        text(ctx, api, String(n), x + 158, y + 89, 65, color, 'center');
      };
      if (i === 2) api.focus.target('third-draft', draft);
      else draft();
    }
  });
  api.focus.target('vote', () => {
    text(
      ctx,
      api,
      voted ? `plurality: ${plurality(pool)}` : 'Most frequent?',
      left,
      723,
      49,
      voted ? C.yellow : C.muted,
    );
    if (voted) text(ctx, api, '2 of 4 drafts', left, 776, 33, C.muted);
  });
  api.focus.target('match', () => {
    const result = checked
      ? accepted.length
        ? `calculator accepts: ${accepted[0]}`
        : 'No draft passed'
      : changed
        ? 'Which draft passes?'
        : 'Exact match?';
    text(ctx, api, result, left, 893, 47, checked ? (accepted.length ? C.green : C.pink) : C.ink);
  });
}

export default { id: 'candidates', draw: drawCandidates };
