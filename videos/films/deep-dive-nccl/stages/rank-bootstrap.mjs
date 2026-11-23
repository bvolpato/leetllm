import { done, sentence } from '../construction.mjs';
import {
  chapterCard,
  chapterHeading,
  chapterLine,
  chapterNote,
  chapterRectangle,
  chapterText,
} from '../defaults.mjs';
export function drawRankBootstrap(ctx, scene, state, api) {
  return api.focus.target(`nc-${scene.id}-mechanism`, () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = (bi, si) => sentence(state, 'rank-bootstrap', bi, si),
      resultComplete = (bi, si) => done(state, 'rank-bootstrap', bi, si);
    const ranks = [0, 1, 2, 3],
      rankColors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.yellow];
    {
      const choosingRoot = currentBeat <= 1 && progress(0, 4) > 0;
      chapterHeading(
        ctx,
        api,
        choosingRoot ? 'Broadcast   ·   root = 2' : 'One CUDA device per rank',
      );
      const map = [2, 0, 3, 1],
        show = currentBeat > 0 || resultComplete(0, 2),
        root = currentBeat === 1 && resultComplete(1, 1);
      ranks.forEach((r) => {
        const x = 190 + r * 420;
        chapterCard(ctx, api, 'Communicator R' + r, x, 370, 350, 90, rankColors[r]);
        chapterLine(ctx, api, x + 175, 470, x + 175, 625, rankColors[r]);
        chapterCard(
          ctx,
          api,
          show ? 'CUDA GPU ' + map[r] : 'Mapping pending',
          x,
          650,
          350,
          100,
          root && r === 2 ? themeColors.green : rankColors[r],
        );
        if (root && r === 2)
          chapterText(ctx, api, 'root = 2', x + 175, 830, 33, themeColors.green, 'center');
      });
      if (currentBeat === 0 && resultComplete(0, 3))
        chapterText(
          ctx,
          api,
          'One communicator · distinct CUDA devices',
          960,
          950,
          33,
          themeColors.green,
          'center',
        );
      if (currentBeat === 1 && resultComplete(1, 2))
        chapterText(
          ctx,
          api,
          'root 2 selects GPU 3 in this supplied mapping',
          960,
          950,
          33,
          themeColors.green,
          'center',
        );
      if (currentBeat === 2) {
        const entered = Math.min(4, Math.floor(progress(2, 2) * 4 + 1e-9));
        for (let r = 0; r < 4; r++) {
          chapterRectangle(
            ctx,
            api,
            335 + r * 420,
            850,
            60,
            60,
            r < entered ? themeColors.cyan : themeColors.panel,
            themeColors.cyan,
          );
          chapterText(
            ctx,
            api,
            r < entered ? 'in' : '…',
            365 + r * 420,
            891,
            26,
            r < entered ? themeColors.bg : themeColors.muted,
            'center',
          );
        }
        chapterText(
          ctx,
          api,
          'Grouped local rank initialization · ' + entered + ' / 4 entered',
          960,
          985,
          30,
          themeColors.cyan,
          'center',
        );
      }
      chapterNote(
        ctx,
        api,
        currentBeat === 2
          ? 'Multiple hosts share one communicator ID'
          : 'Setup exchanges one communicator identity before rank initialization',
      );
    }
  });
}
export default {
  id: 'rank-bootstrap',
  draw: drawRankBootstrap,
  cues: [
    'nc-rank-bootstrap-b0-s0',
    'nc-rank-bootstrap-b0-s1',
    'nc-rank-bootstrap-b0-s2',
    'nc-rank-bootstrap-b0-s3',
    'nc-rank-bootstrap-b0-s4',
    'nc-rank-bootstrap-b1-s1',
    'nc-rank-bootstrap-b1-s2',
    'nc-rank-bootstrap-b1-s3',
    'nc-rank-bootstrap-b2-s0',
    'nc-rank-bootstrap-b2-s1',
    'nc-rank-bootstrap-b2-s2',
    'nc-rank-bootstrap-b2-s3',
  ],
};
