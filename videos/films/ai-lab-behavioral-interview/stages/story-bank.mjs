import { storySupports } from '../arithmetic.mjs';

export function drawStoryBank(ctx, scene, state, api) {
  const { C, focus } = api;
  const write = (s, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, s, x, y, size, color, 'left', font);
  if (state.beat === 0) {
    focus.target('bank-count', () =>
      write('Choose 3 to 5 real stories for practice.', 125, 293, 48, C.ink, 'serif'),
    );
    const examples = [
      ['Interface change', 'Which team adopted the new interface?'],
      ['Migration', 'Which compatibility check caught a break?'],
      ['Research replication', 'Which result did you reproduce?'],
    ];
    focus.target('bank-packets', () => {
      examples.forEach(([story, question], i) => {
        const y = 460 + i * 146;
        api.line(ctx, 125, y - 72, 1772, y - 72, '#555961', 2);
        write(story, 125, y, 38, C.cyan);
        write(question, 682, y, 42, C.ink, 'serif');
      });
    });
    return;
  }
  write('Friday’s launch record', 125, 280, 45, C.ink, 'serif');
  const entries = [
    ['Launch judgment', 'The zero-traffic recommendation'],
    ['Disagreement', 'Product’s case for a canary'],
    ['Safety', 'The check that kept B17 offline'],
    ['Change of mind', 'Which belief did you revise?'],
  ];
  focus.target('bank-match', () => {
    entries.forEach(([q, answer], i) => {
      const y = 400 + i * 134,
        ok = storySupports(q.toLowerCase());
      write(q, 125, y, 42, C.ink, 'serif');
      if (focus.visible(ok ? 'story-bank-match' : 'bank-new-story')) {
        write(answer, 775, y, 41, ok ? C.cyan : C.yellow);
        if (ok) api.line(ctx, 493, y - 14, 711, y - 14, C.cyan, 3);
      }
    });
  });
  if (focus.visible('story-bank-limits'))
    focus.target('bank-evidence', () =>
      write(
        'For a measured improvement, keep the comparison, population and window.',
        125,
        971,
        35,
        C.muted,
      ),
    );
}
export default {
  id: 'story-bank',
  draw: drawStoryBank,
  cues: [
    'story-bank-heuristic',
    'story-bank-variety',
    'story-bank-match',
    'bank-new-story',
    'story-bank-limits',
  ],
};
