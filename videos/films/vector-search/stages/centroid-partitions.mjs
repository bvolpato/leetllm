import { cueProgress } from '../construction.mjs';
import { CENTROIDS, POINTS, QUERY } from '../fixtures.mjs';
import { partition, rankCentroids } from '../model.mjs';
import { corpus, listDrawer, neighborhood } from '../neighborhood.mjs';
import { text } from '../defaults.mjs';

export default {
  id: 'centroid-partitions',
  cues: ['train-centers', 'file-passages', 'see-border', 'rank-centers'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const filed = cueProgress(state, 'file-passages');
    const ready = POINTS.slice(0, Math.floor(POINTS.length * filed)).map((p) => p.id);
    const ranking = cueProgress(state, 'rank-centers');
    api.focus.target('partition-map', () => {
      if (state.beat === 1) neighborhood(ctx, api, { boundary: true });
      else {
        const route = ranking > 0
          ? CENTROIDS.map((center) => [QUERY, center, ranking])
          : POINTS.map((p, i) => [p, CENTROIDS[partition(p)], api.clamp(filed * POINTS.length - i)]);
        corpus(ctx, api, { lists: true, border: state.beat > 0, route });
      }
    });
    api.focus.target('posting-lists', () => {
      listDrawer(ctx, api, 0, 337, { assigned: ready });
      listDrawer(ctx, api, 1, 620, { assigned: ready });
    });
    api.focus.target('coarse-scores', () => {
      const [left, right] = rankCentroids();
      const label = state.beat === 2
        ? ranking > 0 ? 'Query to center, squared      Left   ' + left.d2.toFixed(2) + '        Right   ' + right.d2.toFixed(2) : 'Which center is nearer to the query?'
        : state.beat === 1 ? 'The border assigns each passage to one list.' : 'File a copy of each ID with its nearest center.';
      text(ctx, api, label, 960, 985, 40, C.yellow, 'center');
    });
  },
};
