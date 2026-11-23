import { claimHeadroom } from '../arithmetic.mjs';

const edits = [
  [
    'I fixed our security system',
    'I wrote the release check.',
    'Nia: release check   •   Omar: repair',
    'edit-owner',
  ],
  ['I cut latency by 16%', 'Our p95 was 420 ms.', 'Canary observation: 420 ms', 'edit-metric'],
  [
    'It never happened again',
    'Later incident rate unknown.',
    'Follow-up: no incident counts',
    'edit-recurrence',
  ],
];

export function drawRehearsalRepair(ctx, scene, state, api) {
  const { C, focus } = api;
  const write = (s, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, s, x, y, size, color, 'left', font);
  write('Rehearsal transcript', 128, 290, 43, C.ink, 'serif');
  write('Nia’s notes', 1090, 290, 43, C.ink, 'serif');
  edits.forEach(([draft, revision, receipt, cue], i) => {
    const y = 398 + i * 112;
    const revised = focus.visible(cue);
    focus.target('edit-row-' + i, () => {
      write(revised ? revision : draft, 130, y, 49, revised ? C.cyan : C.ink, 'serif');
      write(receipt, 1090, y, 37, C.muted);
      api.line(ctx, 128, y + 30, 1785, y + 30, '#555961', 2);
    });
  });
  const observed = 420,
    limit = 500,
    h = claimHeadroom(observed, limit);
  const x = (ms) => 129 + ms * 3.02;
  const y = 858;
  focus.target('headroom', () => {
    write('Earlier latency: unrecorded', 130, 761, 32, C.muted);
    api.line(ctx, x(0), y, x(limit), y, C.muted, 4);
    api.circle(ctx, x(observed), y, 14, C.cyan);
    api.line(ctx, x(limit), y - 36, x(limit), y + 34, C.yellow, 5);
    api.text(ctx, observed + ' ms observed', x(observed), y + 88, 31, C.cyan, 'right');
    api.text(ctx, limit + ' ms limit', x(limit) + 20, y + 88, 31, C.yellow, 'center');
    if (focus.visible('measure-gap')) {
      const edge = x(observed + h.gap * focus.progress('measure-gap'));
      api.line(ctx, x(observed), y - 35, edge, y - 35, C.yellow, 5);
      if (focus.progress('measure-gap') === 1) {
        api.text(ctx, h.gap + ' ms', (x(observed) + x(limit)) / 2, y - 62, 38, C.yellow, 'center');
      }
    }
  });
  if (focus.visible('edit-question') && !focus.visible('edit-owner')) {
    focus.target('edit-prompt', () =>
      write('How would you rewrite the first line in Nia’s own voice?', 130, 1020, 38, C.yellow, 'serif'),
    );
  }
  focus.target('gap-caption', () => {
    if (focus.visible('headroom-percent'))
      write(
        `${h.gap} ÷ ${limit} = ${Math.round(100 * h.headroom)}% below the acceptance limit`,
        130,
        1020,
        35,
        C.yellow,
      );
  });
}

export default {
  id: 'rehearsal-repair',
  draw: drawRehearsalRepair,
  cues: [
    'draft-metric',
    'edit-question',
    'edit-owner',
    'measure-gap',
    'headroom-percent',
    'edit-metric',
    'edit-recurrence',
  ],
};
