import { card, connector, line, text } from '../defaults.mjs';

const id = 'index-strategies';

export function drawIndexStrategies(ctx, scene, state, api) {
  const { C } = api;
  const cue = (name) => state.cues?.[id + '-' + name];
  const started = (name) => ['during', 'after'].includes(cue(name)?.phase);
  const write = (s, x, y, z, color, align) => text(ctx, api, id, s, x, y, z, color, align);
  const focus = (name, draw) => api.focus.target(id + '-' + name, draw);

  if (state.beat === 0) {
    write('Before the question', 530, 298, 42, C.blue);
    write('When someone asks', 1270, 298, 42, C.yellow);
    line(ctx, api, 1180, 330, 1180, 908, C.muted, 2);
    const rows = [
      [
        'Standard',
        'Extract and merge descriptions',
        'Write community reports',
        'Read report batches',
        'Combine partial answers',
      ],
      [
        'Fast',
        'Link co-occurring phrases',
        'Write community reports',
        'Read report batches',
        'Combine partial answers',
      ],
      [
        'Lazy',
        'Index noun phrases',
        'Record graph statistics',
        'Test relevant passages',
        'Build the answer',
      ],
    ];
    rows.forEach(([name, build, artifact, search, answer], i) => {
      const y = 435 + 190 * i;
      focus(name.toLowerCase(), () => {
        write(name, 135, y + 18, 48, C.ink);
        write(build, 530, y, 36, C.blue);
        write(artifact, 530, y + 58, 32, C.ink);
        write(search, 1270, y, 36, C.yellow);
        write(answer, 1270, y + 58, 32, C.ink);
      });
    });
    return;
  }

  if (state.beat === 1) {
    write('November 2024   /   5,590 AP news articles', 125, 280, 44, C.ink);
    write('Cost to build the full GraphRAG index', 125, 393, 38, C.blue);
    const columns = 50;
    const rows = 20;
    const right = 130 + columns * 18;
    const bottom = 447 + rows * 17;
    const result = cue('b2')?.phase === 'after';
    api.rect(ctx, 130, 447, right - 130, bottom - 447, C.blue, undefined, 0);
    for (let i = 1; i < columns; i++)
      line(ctx, api, 130 + i * 18, 447, 130 + i * 18, bottom, C.bg, 3);
    for (let i = 1; i < rows; i++) line(ctx, api, 130, 447 + i * 17, right, 447 + i * 17, C.bg, 3);
    focus('study', () => {
      write('Lazy index', 1160, 480, 40, C.yellow);
      if (result) {
        api.rect(ctx, right - 16, 447, 16, 15, C.yellow, undefined, 0);
        line(ctx, api, 1034, 453, 1134, 453, C.yellow, 3);
        api.text(ctx, '≈ 0.1%', 1160, 622, 106, C.ink, 'left', 'serif');
        write('About one square in a thousand', 1160, 689, 34, C.ink);
      }
    });
    write('The full grid represents the cost of one full index build.', 125, 879, 33, C.ink);
    return;
  }

  const merge = cue('light-merge')?.progress ?? 0;
  const withdrawn = cue('withdraw')?.phase === 'after';
  write('LightRAG', 125, 285, 45, C.ink);
  write('Linked source passage', 130, 393, 32, C.muted);
  write('The inference API depends on Redis.', 130, 454, 39, C.ink);
  card(ctx, api, id, 'Inference API', 855, 370, 300, 102, C.blue, 35);
  focus('dependency', () => {
    connector(ctx, api, 1173, 422, 1455, 422, 1, C.green);
    write('depends on', 1314, 377, 31, C.green, 'center');
  });
  focus('cache', () => card(ctx, api, id, 'Redis', 1480, 370, 280, 102, C.blue, 40));
  if (started('document')) {
    focus('document', () => {
      write(
        withdrawn ? 'Withdrawn note' : 'New source passage',
        130,
        679,
        32,
        withdrawn ? C.muted : C.yellow,
      );
      write('Search also depends on Redis.', 130, 742, 39, withdrawn ? C.muted : C.ink);
    });
  }
  if (started('light-merge') && !withdrawn) {
    focus('merge', () => {
      card(ctx, api, id, 'Search', 855, 663, 300, 102, C.yellow, 35);
      connector(ctx, api, 1173, 713, 1489, 487, merge, C.yellow);
      if (merge === 1) write('depends on', 1380, 672, 31, C.yellow, 'center');
    });
  }
  if (withdrawn)
    write('The original dependency still has a source.', 960, 939, 41, C.ink, 'center');
}

export default {
  id,
  draw: drawIndexStrategies,
  cues: [
    'b1',
    'fast',
    'lazy-query',
    'b2',
    'b3',
    'relationship',
    'document',
    'light-merge',
    'withdraw',
  ].map((name) => id + '-' + name),
};
