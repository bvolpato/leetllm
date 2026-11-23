import { newChapterModel } from '../model.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterText,
  chapterTitle,
  chapterVector,
} from '../defaults.mjs';
export function drawSequenceRole(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = newChapterModel('sequence-role', state),
    { b: currentBeat } = modelState;
  const R = (id) => api.focus.progress('mg-' + id, state.cues ? 0 : modelState.p),
    done = (id) => R(id) >= 1;
  api.focus.target('mg-sequence-role-mechanism', () => {
    chapterTitle(
      ctx,
      api,
      currentBeat
        ? 'A communication choice must preserve the same legal context'
        : 'Same token identities · distinct SP and CP responsibilities',
    );
    const tokens = Array.from(
      {
        length: 8,
      },
      (_, i) => 'T' + i,
    );
    chapterText(ctx, api, 'TP activation / SP', 210, 405, 30, themeColors.blue);
    chapterVector(ctx, api, tokens.slice(0, 4), 600, 355, 1050, themeColors.blue);
    chapterVector(ctx, api, tokens.slice(4), 600, 475, 1050, themeColors.blue);
    chapterText(ctx, api, 'CP attention context', 210, 715, 30, themeColors.pink);
    chapterVector(
      ctx,
      api,
      tokens.filter((_, i) => i % 2 === 0),
      600,
      650,
      1050,
      themeColors.pink,
    );
    chapterVector(
      ctx,
      api,
      tokens.filter((_, i) => i % 2),
      600,
      770,
      1050,
      themeColors.pink,
    );
    if (done('cp-remote') || currentBeat) {
      chapterArrow(ctx, api, 1200, 750, 1200, 650, themeColors.cyan);
      chapterText(ctx, api, 'legal remote K/V', 1530, 950, 28, themeColors.cyan, 'center');
    }
    chapterFooter(
      ctx,
      api,
      currentBeat
        ? 'P2P / gather / all-to-all / hierarchical: measure the chosen layout'
        : 'SP adds no world-size axis; CP still needs remote legal K/V',
    );
  });
  return true;
}
export default {
  id: 'sequence-role',
  draw: drawSequenceRole,
  cues: ['mg-sequence-role-b0', 'mg-sp-chunks', 'mg-cp-remote', 'mg-sequence-role-b1'],
};
