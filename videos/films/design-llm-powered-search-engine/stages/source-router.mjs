import { clamp, motion, searchCosine } from '../arithmetic.mjs';
import { searchRoutePlan } from '../model.mjs';
import {
  chapterArrow,
  chapterFooter,
  chapterLine,
  chapterRect,
  chapterSource,
  chapterText,
} from '../defaults.mjs';
export function drawSourceRouter(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index = 0) => {
    const q = state.cues?.['se-source-router-' + name];
    if (state.cues && !q)
      throw Error('Undeclared or absent current-scene cue se-source-router-' + name);
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
  api.focus.target('se-source-router-mechanism', () => {
    const plan = searchRoutePlan('build-1042 status and current migration policy');
    chapterSource(
      ctx,
      api,
      'Question',
      'build-1042 status and current migration policy',
      170,
      300,
      1580,
      themeColors.cyan,
    );
    if (currentBeat === 0) {
      chapterText(ctx, api, 'Mutable state → authorized live API', 220, 590, 34, themeColors.blue);
      chapterText(
        ctx,
        api,
        'Applicable policy → current documents',
        1010,
        590,
        32,
        themeColors.green,
      );
    }
    if (currentBeat === 1) {
      const live = prog('both', 1) && plan.routes.includes('authorized live API'),
        policyP = prog('policy', 1) && plan.routes.includes('authorized hybrid search');
      chapterRect(ctx, api, 220, 560, 600, 145, themeColors.panel, themeColors.blue);
      chapterRect(ctx, api, 1100, 560, 600, 145, themeColors.panel, themeColors.green);
      chapterText(
        ctx,
        api,
        live ? 'authorized live API' : 'Live branch pending',
        250,
        645,
        30,
        themeColors.blue,
      );
      chapterText(
        ctx,
        api,
        policyP ? 'authorized hybrid search' : 'Document branch pending',
        1130,
        645,
        29,
        themeColors.green,
      );
      if (live) chapterArrow(ctx, api, 620, 520, 520, 540, themeColors.blue);
      if (policyP) chapterArrow(ctx, api, 1300, 520, 1400, 540, themeColors.green);
      chapterText(
        ctx,
        api,
        done('freshness', 1)
          ? 'Require current revision: ' + plan.current
          : 'Freshness constraint pending',
        960,
        850,
        32,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 2) {
      const q = prog('hyde-construct', 2);
      chapterSource(
        ctx,
        api,
        'Hypothetical text',
        'Service-account migration exception',
        180,
        585,
        750,
        themeColors.yellow,
      );
      chapterText(ctx, api, 'Example vectors', 180, 870, 28, themeColors.muted);
      const ox = 1140,
        oy = 900,
        scale = 240;
      chapterLine(ctx, api, [ox - 30, oy], [1720, oy]);
      chapterLine(ctx, api, [ox, oy + 25], [ox, 570]);
      chapterRect(ctx, api, ox + scale - 5, oy - scale * 0.5 - 5, 10, 10, themeColors.blue);
      chapterText(ctx, api, 'Policy [1,.5]', 1440, 815, 26, themeColors.blue);
      chapterRect(ctx, api, ox + scale * 0.5 - 5, oy - scale - 5, 10, 10, themeColors.green);
      chapterText(ctx, api, 'Exception [.5,1]', 1420, 650, 26, themeColors.green);
      if (q > 0)
        chapterArrow(ctx, api, ox, oy, ox + scale * 0.5 * q, oy - scale * q, themeColors.yellow);
      if (done('hyde-construct', 2))
        chapterText(ctx, api, 'h = [.5,1]', 1110, 950, 27, themeColors.yellow);
      if (done('hyde', 2)) {
        chapterText(
          ctx,
          api,
          'cos(h, exception) = ' + searchCosine([0.5, 1], [0.5, 1]).toFixed(1),
          180,
          935,
          28,
          themeColors.green,
        );
        chapterText(
          ctx,
          api,
          'cos(h, policy) = ' + searchCosine([0.5, 1], [1, 0.5]).toFixed(1),
          600,
          935,
          28,
          themeColors.blue,
        );
      }
    }
    if (currentBeat === 2 && done('hyde', 2))
      chapterFooter(ctx, api, 'Cite the original passage returned by the search.');
  });
}
export default {
  id: 'source-router',
  draw: drawSourceRouter,
  cues: [
    'se-source-router-0',
    'se-source-router-1',
    'se-source-router-both',
    'se-source-router-policy',
    'se-source-router-freshness',
    'se-source-router-2',
    'se-source-router-hyde',
    'se-source-router-hyde-construct',
  ],
};
