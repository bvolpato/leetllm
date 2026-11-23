import { clamp, motion } from '../arithmetic.mjs';
import { chapterArrow, chapterFooter, chapterRect, chapterText } from '../defaults.mjs';
export function drawSseIdentity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-sse-identity-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-sse-identity-' + name);
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
  const done = (name, index) => cue(name, index).done;
  api.focus.target('se-sse-identity-mechanism', () => {
    const inherited = done('inherited', 0) || currentBeat > 0,
      repair = done('repair', 1) || currentBeat > 1,
      clear = done('clear', 1) || currentBeat > 1;
    const rows = [
      ['id: 12', 'data: progress', '12'],
      [
        repair ? 'id: 13' : '(id omitted)',
        'data: checked_claim',
        repair ? '13' : inherited ? '12' : 'pending',
      ],
      ['id: (empty)', 'data: marker', clear ? 'empty' : 'pending'],
    ];
    chapterText(ctx, api, 'SSE field buffer and callback identity', 170, 290, 33, themeColors.blue);
    rows.forEach(([idField, data, value], i) => {
      const y = 365 + i * 175;
      if (i === 2 && currentBeat === 0) return;
      chapterRect(
        ctx,
        api,
        170,
        y,
        930,
        135,
        themeColors.panel,
        i === 1 ? themeColors.green : themeColors.blue,
      );
      chapterText(ctx, api, idField, 200, y + 48, 29, themeColors.cyan);
      api.text(ctx, data, 200, y + 102, 29, themeColors.ink, 'left', 'mono');
      chapterArrow(ctx, api, 1150, y + 65, 1260, y + 65, themeColors.muted);
      chapterRect(ctx, api, 1310, y + 15, 400, 100, themeColors.panel, themeColors.yellow);
      chapterText(ctx, api, value, 1510, y + 80, 33, themeColors.yellow, 'center');
    });
    if (currentBeat === 2)
      chapterText(
        ctx,
        api,
        'Create request → subscribe by URL / fetch stream for POST',
        180,
        950,
        28,
        themeColors.yellow,
      );
    chapterFooter(
      ctx,
      api,
      clear
        ? 'Empty id clears nonempty reconnect state; application identities still need validation.'
        : 'No id field inherits the current browser buffer. No new ID is invented.',
    );
  });
}
export default {
  id: 'sse-identity',
  draw: drawSseIdentity,
  cues: [
    'se-sse-identity-0',
    'se-sse-identity-inherited',
    'se-sse-identity-1',
    'se-sse-identity-clear',
    'se-sse-identity-repair',
    'se-sse-identity-2',
    'se-sse-identity-request',
  ],
};
