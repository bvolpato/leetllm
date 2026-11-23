const entries = [
  {
    person: 'Nia',
    role: 'On call',
    verb: 'I wrote the release check.',
    detail: 'Reproduced both failures on B17',
    cue: 'nia-wrote',
    color: 'cyan',
  },
  {
    person: 'Omar',
    role: 'Service owner',
    verb: 'Omar repaired authorization.',
    detail: 'B18 denied the snippet and citation',
    cue: 'omar-repaired',
    color: 'green',
  },
  {
    person: 'Priya',
    role: 'Release owner',
    verb: 'Priya approved the canary.',
    detail: '5% after the other checks passed',
    cue: 'priya-approved',
    color: 'yellow',
  },
];

export function drawPractice(ctx, scene, state, api) {
  const { C, focus } = api;
  api.text(ctx, 'Friday release record', 120, 276, 43, C.ink, 'left', 'serif');
  api.text(ctx, 'Whose work was it?', 800, 276, 43, C.ink, 'left', 'serif');
  entries.forEach(({ person, role, verb, detail, cue, color }, i) => {
    const y = 373 + i * 169;
    const p = focus.progress(cue);
    focus.target('owner-' + i, () => {
      api.line(ctx, 120, y - 51, 1770, y - 51, '#555961', 2);
      api.text(ctx, person, 125, y + 13, 48, C[color], 'left', 'serif');
      api.text(ctx, role, 125, y + 64, 31, C.muted);
      if (!focus.visible(cue)) return;
      api.text(ctx, verb, 800, y + 13, 46, C.ink, 'left', 'serif');
      api.line(ctx, 430, y, 430 + 292 * p, y, C[color], 3);
      if (p === 1) api.text(ctx, detail, 800, y + 65, 32, C.muted);
    });
  });
  api.line(ctx, 120, 830, 1770, 830, '#555961', 2);
  focus.target('practice-result', () => {
    if (focus.visible('practice-window')) {
      api.text(ctx, 'Canary p95', 125, 911, 32, C.muted);
      api.text(ctx, '420 ms in the agreed window', 800, 911, 40, C.ink);
    }
  });
  focus.target('practice-reflection', () => {
    if (focus.visible('practice-next'))
      api.text(
        ctx,
        'Next review: agree on release and rollback criteria in advance.',
        125,
        1005,
        36,
        C.cyan,
        'left',
        'serif',
      );
  });
}

export default {
  id: 'practice',
  draw: drawPractice,
  cues: ['nia-wrote', 'omar-repaired', 'priya-approved', 'practice-window', 'practice-next'],
};
