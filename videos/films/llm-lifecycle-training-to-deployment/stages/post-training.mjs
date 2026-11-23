import { verifierScore } from '../arithmetic.mjs';
import { sceneCues } from '../picture.mjs';

export function drawPostTraining(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  api.focus.target('post-training-mechanism', () => {
    api.text(
      ctx,
      'K10234   ·   Stale, 42 days old   ·   P-7 minimum 30 days   ·   No job ran',
      125,
      252,
      37,
      C.ink,
    );
    if (state.beat === 0) {
      for (const [i, [role, text]] of [
        ['System', 'Return a structured decision with evidence.'],
        ['User', 'Does this stale key qualify under P-7?'],
        ['Assistant', '{"eligible": true, "policy_id": "P-7",'],
      ].entries()) {
        if (i === 2 && !cue.started('post-demo')) continue;
        const y = 418 + i * 156;
        api.text(ctx, role, 180, y, 43, i === 2 ? C.cyan : C.muted);
        api.text(ctx, text, 613, y, i === 2 ? 36 : 42, C.ink, 'left', i === 2 ? 'mono' : 'sans');
        if (i === 2)
          api.text(ctx, ' "evidence": "Minimum age is 30 days."}', 613, y + 62, 36, C.ink, 'left', 'mono');
        api.line(ctx, 180, y + (i === 2 ? 103 : 41), 1720, y + (i === 2 ? 103 : 41), C.panel, 3);
      }
      return;
    }
    if (state.beat === 1) {
      [480, 1420].forEach((x, i) => {
        api.text(ctx, 'Eligible under P-7.', x, 445, 48, C.ink, 'center');
        if (cue.started('post-pair'))
          api.text(
            ctx,
            i ? 'The rotation finished.' : 'No job ran.',
            x,
            575,
            43,
            i ? C.pink : C.cyan,
            'center',
          );
        if (cue.after('post-choice'))
          api.text(ctx, i ? 'Rejected' : 'Chosen', x, 781, 47, i ? C.pink : C.cyan, 'center');
      });
      return;
    }
    const prose = cue.started('post-prose');
    const action = cue.after('post-flag') && !prose;
    const candidate = { eligible: true, policy_id: 'P-7', rotation_started: action };
    if (prose) candidate.text = 'Rotation completed successfully!';
    api.text(ctx, 'Fields the checker reads', 155, 361, 38, C.cyan);
    api.rect(ctx, 145, 397, 952, 315, C.panel, C.cyan, 13);
    Object.entries(candidate)
      .filter(([key]) => key !== 'text')
      .forEach(([key, value], i) => {
        const y = 472 + 85 * i;
        api.text(ctx, key, 195, y, 37, C.ink, 'left', 'mono');
        api.text(
          ctx,
          String(value),
          1010,
          y,
          40,
          key === 'rotation_started' && action ? C.pink : C.ink,
          'right',
        );
      });
    api.text(ctx, 'Verifier score', 1490, 464, 37, C.muted, 'center');
    const reveal = prose
      ? cue.after('post-blind')
      : action
        ? cue.after('post-zero')
        : cue.after('post-good');
    api.text(
      ctx,
      reveal ? String(verifierScore(candidate)) : '?',
      1490,
      625,
      110,
      reveal ? C.yellow : C.muted,
      'center',
    );
    if (prose) {
      api.text(ctx, 'Additional text shown to the user', 155, 825, 31, C.muted);
      api.text(ctx, '“' + candidate.text + '”', 155, 910, 47, C.pink);
    }
  });
}
export default {
  id: 'post-training',
  draw: drawPostTraining,
  cues: [
    'post-demo',
    'post-pair',
    'post-choice',
    'post-good',
    'post-flag',
    'post-zero',
    'post-prose',
    'post-blind',
  ],
};
