import { text } from '../defaults.mjs';
import { ttMix, ttSmooth } from '../arithmetic.mjs';
import { sceneClock } from '../scene-clock.mjs';
import { testTimeCoreFrame } from '../construction.mjs';

export function drawSearchBound(ctx, scene, state, api) {
  const { C } = api,
    cue = sceneClock(scene, state);
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    text(ctx, api, s, x, y, size, color, align);
  if (state.beat === 2) {
    const rounds = 3,
      width = 1,
      branches = 2;
    const progress = cue('tt-proposal-ceiling').p;
    api.focus.target('proposals', () => {
      for (let i = 0; i < rounds; i++) {
        const x = 322 + i * 585;
        label(`Round ${i + 1}`, x - 100, 345, 40);
        api.circle(ctx, x - 110, 546, 30, C.blue);
        for (let j = 0; j < branches; j++) {
          const y = 465 + j * 162;
          const shown =
            (i === 0 && cue('search-rounds').p >= (j + 1) / 2) ||
            progress >= (i * branches + j + 1) / (rounds * branches);
          api.line(ctx, x - 75, 546, x + 60, y, shown ? C.cyan : C.muted, 4);
          api.circle(ctx, x + 101, y, 26, shown ? C.cyan : C.panel, C.cyan, 3);
        }
      }
    });
    api.focus.target('proposal-total', () =>
      label(
        cue('tt-proposal-ceiling').done
          ? '1 path × 2 proposals × 3 rounds = 6 proposals and 6 scores'
          : '1 active path  ×  2 proposals per path  ×  3 rounds',
        960,
        846,
        49,
        C.ink,
        'center',
      ),
    );
    if (cue('tt-proposal-ceiling').done)
      label(
        'The token count depends on the length of each proposal.',
        960,
        946,
        35,
        C.muted,
        'center',
      );
    return;
  }
  const {
    active,
    completed: finished,
    next: extension,
    minHistory,
    lastHistory,
  } = testTimeCoreFrame('search-bound', state);
  const x = (value) => 610 + (value - 0.6) * 2880;
  label('Score on the retained path', 610, 260, 34, C.muted);
  for (const value of [0.6, 0.7, 0.8, 0.9, 1]) {
    label(value.toFixed(2), x(value), 358, 37, C.ink, 'center');
    api.line(ctx, x(value), 380, x(value), 400, C.muted, 3);
  }
  api.line(ctx, x(0.6), 385, x(1), 385, C.muted, 3);
  api.line(ctx, x(finished), 406, x(finished), 792, C.green, 4);
  label('Finished answer', x(finished), 847, 32, C.green, 'center');
  api.focus.target('next-score', () => {
    if (cue('offer-step').started) {
      label('Possible next step', x(extension), 300, 32, C.yellow, 'center');
      api.circle(ctx, x(extension), 385, 11, C.yellow);
    } else label('Possible next step  ?', 1760, 300, 30, C.muted, 'right');
  });
  const lane = (y, name, value, color, calculation) => {
    label(name, 120, y + 13, 39, color);
    api.line(ctx, x(0.6), y, x(1), y, C.muted, 3);
    api.circle(ctx, x(value), y, 18, color);
    if (calculation) label(calculation, x(0.6), y + 75, 37, color);
  };
  api.focus.target('minimum', () =>
    lane(
      488,
      'Lowest step',
      minHistory.at(-1),
      C.cyan,
      cue('tt-path-bound').started ? 'min(0.70, 0.90) = 0.70' : 'Current minimum   0.70',
    ),
  );
  if (cue('replay-latest').started) {
    api.focus.target('latest', () => {
      const move = cue('latest-rise');
      lane(
        697,
        'Latest step',
        ttMix(active, lastHistory.at(-1), ttSmooth(move.p)),
        C.yellow,
        move.done ? 'Latest score   0.90' : 'Current score   0.70',
      );
    });
  }
  const question = cue('tt-path-bound').done
    ? cue('latest-rise').done
      ? 'Latest-step scoring leaves this path in play.'
      : 'Minimum-path scoring lets us stop here.'
    : 'Could the unfinished path beat 0.80?';
  label(question, 960, 977, 43, C.ink, 'center');
}

export default { id: 'search-bound', draw: drawSearchBound };
