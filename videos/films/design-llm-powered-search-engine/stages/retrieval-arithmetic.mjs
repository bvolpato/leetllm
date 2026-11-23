import { SEARCH_TEXT } from '../fixtures.mjs';
import { clamp, motion, searchCosine } from '../arithmetic.mjs';
import { lexicalScores } from '../model.mjs';
import { chapterArrow, chapterLine, chapterRect, chapterText } from '../defaults.mjs';
export function drawRetrievalArithmetic(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-retrieval-arithmetic-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-retrieval-arithmetic-' + name);
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
  api.focus.target('se-retrieval-arithmetic-mechanism', () => {
    if (currentBeat === 0) {
      const docs = [
          {
            id: 'Policy',
            text: SEARCH_TEXT.policy,
          },
          {
            id: 'Exception',
            text: SEARCH_TEXT.exception,
          },
        ],
        scores = lexicalScores(
          'parser-v2 SDK migration policy for service-account exceptions',
          docs,
        ),
        n = Math.ceil(prog('0', 0) * scores[0].terms.length);
      chapterText(
        ctx,
        api,
        'Query terms in the two eligible passages',
        160,
        285,
        33,
        themeColors.blue,
      );
      ['term', 'df', 'policy tf', 'exception tf'].forEach((x, i) =>
        chapterText(ctx, api, x, 180 + i * 420, 360, 28, themeColors.muted),
      );
      scores[0].terms.slice(0, n).forEach((term, i) => {
        const y = 415 + i * 58;
        chapterText(ctx, api, term.term, 180, y, 27, themeColors.ink);
        chapterText(ctx, api, term.df, 600, y, 27, themeColors.cyan);
        chapterText(ctx, api, term.tf, 1020, y, 27, themeColors.blue);
        chapterText(ctx, api, scores[1].terms[i].tf, 1440, y, 27, themeColors.green);
      });
      if (done('lexical', 0))
        scores.forEach((row, i) =>
          chapterText(
            ctx,
            api,
            row.id + ' sum ' + row.score.toFixed(5),
            230 + i * 820,
            925,
            31,
            i ? themeColors.green : themeColors.blue,
          ),
        );
    } else if (currentBeat === 1) {
      const ox = 430,
        oy = 790,
        scale = 240,
        q = prog('1', 1);
      chapterLine(ctx, api, [ox - 70, oy], [ox + 500, oy]);
      chapterLine(ctx, api, [ox, oy + 70], [ox, oy - 400]);
      chapterArrow(ctx, api, ox, oy, ox + scale * q, oy - scale * q, themeColors.cyan);
      chapterArrow(ctx, api, ox, oy, ox + scale * q, oy - scale * 0.5 * q, themeColors.blue);
      chapterArrow(ctx, api, ox, oy, ox + scale * 0.5 * q, oy - scale * q, themeColors.green);
      chapterText(ctx, api, 'q = [1,1]', ox + 260, oy - 275, 28, themeColors.cyan);
      chapterText(ctx, api, 'policy = [1,.5]', ox + 265, oy - 100, 28, themeColors.blue);
      chapterText(ctx, api, 'exception = [.5,1]', ox + 100, oy - 316, 28, themeColors.green);
      chapterText(ctx, api, '1×1 + 1×.5 = 1.5', 1050, 440, 34, themeColors.yellow);
      chapterText(ctx, api, '‖q‖ = √2    ‖p‖ = √1.25', 1050, 565, 29, themeColors.ink);
      if (done('cosine', 1)) {
        chapterText(
          ctx,
          api,
          'Policy cosine   ' + searchCosine([1, 1], [1, 0.5]).toFixed(6),
          1050,
          700,
          36,
          themeColors.blue,
        );
        chapterText(
          ctx,
          api,
          'Exception cosine   ' + searchCosine([1, 1], [0.5, 1]).toFixed(6),
          1050,
          765,
          36,
          themeColors.green,
        );
      }
      chapterText(
        ctx,
        api,
        'Zero denominator → fixture returns 0',
        1050,
        835,
        27,
        themeColors.muted,
      );
    } else {
      chapterText(ctx, api, 'Cross-encoder: joint query + passage', 160, 300, 33, themeColors.blue);
      chapterRect(ctx, api, 180, 370, 1540, 100, themeColors.panel, themeColors.blue);
      chapterText(ctx, api, 'query tokens × candidate tokens', 260, 435, 32, themeColors.blue);
      chapterText(
        ctx,
        api,
        'Late interaction: retain token-level vectors',
        160,
        610,
        32,
        themeColors.cyan,
      );
      const n = Math.max(1, Math.ceil(prog('interaction', 2) * 6));
      for (let i = 0; i < n; i++) {
        chapterRect(ctx, api, 220 + i * 245, 700, 170, 95, themeColors.panel, themeColors.cyan);
        chapterText(
          ctx,
          api,
          'token ' + (i + 1),
          305 + i * 245,
          760,
          27,
          themeColors.cyan,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'retrieval-arithmetic',
  draw: drawRetrievalArithmetic,
  cues: [
    'se-retrieval-arithmetic-0',
    'se-retrieval-arithmetic-lexical',
    'se-retrieval-arithmetic-1',
    'se-retrieval-arithmetic-cosine',
    'se-retrieval-arithmetic-2',
    'se-retrieval-arithmetic-interaction',
  ],
};
