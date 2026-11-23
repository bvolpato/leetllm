export function drawPublishedGuidance(ctx, scene, state, api) {
  const { C, focus } = api;
  const write = (s, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, s, x, y, size, color, 'left', font);
  const first = state.beat === 0;
  write('Public guidance checked 10 October 2026', 120, 266, 34, C.muted);
  const rows = first
    ? [
        [
          'Anthropic',
          'Weigh benefits and risks.',
          'Explain why Product wanted to learn before Friday’s deadline.',
        ],
        [
          'OpenAI',
          'Collaborate and respond to feedback.',
          'Choose a project where feedback changed a decision.',
        ],
      ]
    : [
        [
          'DeepMind candidate guide',
          'Use STAR and data to describe impact.',
          'Your action: the release check. The canary result: p95 of 420 ms.',
        ],
        [
          'DeepMind culture essay',
          '2022 • discussion and safeguards',
          'Historical context for the lab’s approach to responsibility.',
        ],
      ];
  rows.forEach(([source, guidance, application], i) => {
    const y = 405 + i * 226;
    focus.target(i === 1 && !first ? 'guidance-date' : 'guidance-sources', () => {
      write(source, 120, y, 41, C.cyan, 'serif');
      write(guidance, 740, y, 39);
      write(application, 740, y + 72, 32, C.muted);
      api.line(ctx, 120, y + 117, 1780, y + 117, '#555961', 2);
    });
  });
  focus.target(first ? 'guidance-team' : 'guidance-limit', () => {
    write(
      'Ask the recruiter what this role’s interview will assess.',
      120,
      932,
      45,
      C.yellow,
      'serif',
    );
  });
}
export default {
  id: 'published-guidance',
  draw: drawPublishedGuidance,
  cues: [
    'published-guidance-sources',
    'published-guidance-hypothesis',
    'published-guidance-dated',
    'published-guidance-limits',
  ],
};
