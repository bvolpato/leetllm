import { fixturePath } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { caption, mark, panel, tag, text } from '../defaults.mjs';
export function drawIgnoreContract(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  if (currentBeat === 0)
    mark(api, 'ignore-membership', () => {
      const p = cueProgress(state, 'ignore-patterns', 0),
        paths = [
          ['.env', '.env', false],
          ['.venv/', '.venv/', false],
          ['runs/', 'runs/', false],
          ['.cache/', '.cache/', false],
          ['.env.example', '!.env.example', true],
          [fixturePath, '(no ignore match)', true],
        ];
      text(ctx, api, 'Untracked path', 190, 320, 29, api.C.muted);
      text(ctx, api, 'Matching rule', 790, 320, 29, api.C.muted);
      text(ctx, api, 'Ordinary add', 1490, 320, 29, api.C.muted, 'center');
      paths.forEach(([name, rule, keep], i) => {
        const y = 360 + i * 83,
          ready = i < 4 || p >= (i - 3) / 2;
        text(ctx, api, name, 190, y + 40, 29, api.C.ink, 'left', true);
        text(ctx, api, rule, 790, y + 40, 28, keep ? api.C.cyan : api.C.muted, 'left', true);
        if (ready)
          tag(
            ctx,
            api,
            keep ? 'trackable' : 'ignored',
            1320,
            y + 1,
            340,
            keep ? api.C.green : api.C.muted,
          );
      });
      caption(ctx, api, '.env.example carries an empty value · the fixture uses no secret');
    });
  else {
    const tracked = cueProgress(state, 'tracked-ignore', 1),
      removed = cueProgress(state, 'untrack-current', 1),
      old = cueProgress(state, 'old-history-remains', 1),
      rotate = cueProgress(state, 'rotate-exposed', 1);
    mark(api, 'ignore-history', () => {
      ['Working file', 'Current index', 'Earlier commit'].forEach((n, i) => {
        const x = 180 + i * 570;
        text(ctx, api, n, x + 230, 340, 32, [api.C.blue, api.C.yellow, api.C.muted][i], 'center');
        panel(ctx, api, x, 390, 460, 240, api.C.muted);
        if (i !== 1 || removed === 0)
          tag(ctx, api, '.env [dummy]', x + 50, 470, 360, i === 2 ? api.C.muted : api.C.yellow);
        else {
          text(
            ctx,
            api,
            removed < 1 ? 'removing selected entry' : 'removed from index',
            x + 230,
            520,
            28,
            api.C.muted,
            'center',
          );
          if (removed < 1) api.rect(ctx, x + 50, 575, 360 * (1 - removed), 12, api.C.yellow);
        }
      });
      text(ctx, api, '.gitignore: .env', 960, 730, 35, api.C.cyan, 'center', true);
      if (tracked === 1 && removed === 0)
        text(
          ctx,
          api,
          'Already selected contents remain selected',
          960,
          810,
          33,
          api.C.yellow,
          'center',
        );
    });
    mark(api, 'untrack-effect', () => {
      if (removed > 0)
        text(ctx, api, '$ git rm --cached .env', 960, 820, 35, api.C.yellow, 'center', true);
      caption(
        ctx,
        api,
        rotate === 1
          ? 'Exposed active credential: rotate before sharing · old commits retain old bytes'
          : old === 1
            ? 'Working file preserved; prior history is still present'
            : 'An ignore rule changes untracked-file selection',
      );
    });
  }
}
export default {
  id: 'ignore-contract',
  draw: drawIgnoreContract,
  cues: [
    'ignore-patterns',
    'tracked-ignore',
    'untrack-current',
    'old-history-remains',
    'rotate-exposed',
  ],
};
