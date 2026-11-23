import { clamp, motion } from '../arithmetic.mjs';
import { strictPublication } from '../model.mjs';
import { chapterFooter, chapterRect, chapterText } from '../defaults.mjs';
export function drawTypedReducer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-typed-reducer-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-typed-reducer-' + name);
    return q
      ? {
          progress: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
          done: q.phase === 'after',
        }
      : {
          progress: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
          done: currentBeat > index || (currentBeat === index && progress > 0.76),
        };
  };
  const prog = (name, index) => cue(name, index).progress,
    done = (name, index) => cue(name, index).done;
  api.focus.target('se-typed-reducer-mechanism', () => {
    const base = {
      id: 7,
      revision: 2,
      request: 'request-a',
      draft: 'draft-2',
      kind: 'check',
      accepted: true,
    };
    let events;
    if (currentBeat === 0) {
      events = [
        {
          ...base,
          id: true,
        },
        {
          ...base,
          id: 4,
          revision: 2.5,
        },
        {
          ...base,
          id: 5,
          accepted: 1,
        },
        {
          ...base,
          id: 6,
          accepted: 'false',
        },
      ];
    } else {
      events = [
        {
          ...base,
          id: 3,
          draft: 'draft-1',
          revision: 1,
        },
        base,
        {
          ...base,
        },
        {
          ...base,
          id: 8,
          accepted: false,
        },
      ];
    }
    const count =
        currentBeat === 0
          ? Math.ceil(prog('invalid', 0) * 4)
          : currentBeat === 1
            ? done('inert', 1)
              ? 4
              : done('terminal', 1)
                ? 2
                : done('stale', 1)
                  ? 1
                  : 0
            : 4,
      current = strictPublication(events.slice(0, count));
    chapterText(
      ctx,
      api,
      'request-a / draft-2 / source revision 2',
      180,
      285,
      32,
      themeColors.blue,
    );
    events.forEach((e, i) => {
      const y = 360 + i * 125,
        processed = i < count,
        result = current.decisions[i];
      chapterRect(
        ctx,
        api,
        180,
        y,
        1500,
        95,
        themeColors.panel,
        processed
          ? result.reason === 'checked'
            ? themeColors.green
            : themeColors.pink
          : themeColors.muted,
      );
      chapterText(
        ctx,
        api,
        'id ' +
          JSON.stringify(e.id) +
          ' · revision ' +
          e.revision +
          ' · accepted ' +
          JSON.stringify(e.accepted),
        210,
        y + 42,
        26,
      );
      if (processed)
        chapterText(
          ctx,
          api,
          result.reason,
          1380,
          y + 75,
          26,
          result.reason === 'checked' ? themeColors.green : themeColors.pink,
        );
    });
    chapterText(
      ctx,
      api,
      'State: ' + current.status + ' · emitted claims: ' + current.emitted,
      190,
      940,
      34,
      current.emitted ? themeColors.green : themeColors.yellow,
    );
    chapterFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Before sending a live claim, recheck the reader’s access.'
        : 'Match the request, draft and revision before releasing a claim.',
    );
  });
}
export default {
  id: 'typed-reducer',
  draw: drawTypedReducer,
  cues: [
    'se-typed-reducer-0',
    'se-typed-reducer-invalid',
    'se-typed-reducer-1',
    'se-typed-reducer-stale',
    'se-typed-reducer-terminal',
    'se-typed-reducer-inert',
    'se-typed-reducer-2',
  ],
};
