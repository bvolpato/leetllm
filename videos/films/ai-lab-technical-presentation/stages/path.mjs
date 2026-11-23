import { paginationSnapshot, sampleModel } from '../construction.mjs';
import { card, text } from '../defaults.mjs';
export function drawPath(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('path', state);
  {
    const nodes = [
      {
        id: 'support-ui',
        label: 'support UI',
        x: 95,
        y: 365,
        width: 285,
        height: 112,
        color: themeColors.blue,
        focusTarget: 'path-node-support-ui',
      },
      {
        id: 'gateway',
        label: 'gateway + auth',
        x: 485,
        y: 365,
        width: 315,
        height: 112,
        color: themeColors.yellow,
      },
      {
        id: 'adapter',
        label: 'connector adapter',
        x: 910,
        y: 365,
        width: 330,
        height: 112,
        color: themeColors.cyan,
        focusTarget: 'path-node-adapter',
      },
      {
        id: 'store',
        label: 'tenant store',
        x: 1350,
        y: 365,
        width: 420,
        height: 112,
        color: themeColors.green,
        focusTarget: 'path-node-store',
      },
    ];
    teaching.flowGraph({
      nodes,
      edges: nodes.slice(1).map((_, i) => ({
        from: nodes[i].id,
        to: nodes[i + 1].id,
        color: themeColors.cyan,
        progress: modelState.routeProgress,
      })),
    });
    const page = paginationSnapshot(state.beat ?? 0, state.beatP ?? 0, state.cues);
    api.focus.target('pagination-identity', () =>
      text(
        ctx,
        api,
        'Trace: ' + page.requestId + ' · ' + page.sourceId + ' · tenant authorization retained',
        960,
        650,
        29,
        themeColors.yellow,
        'center',
      ),
    );
    page.records.forEach((record) =>
      text(
        ctx,
        api,
        'Request ' + record.page + ' cursor: ' + (record.requestedCursor ?? 'START'),
        record.page === 1 ? 525 : 1395,
        677,
        25,
        themeColors.muted,
        'center',
      ),
    );
    api.focus.target('pagination-receipts', () => {
      card(
        ctx,
        api,
        page.records[0]
          ? 'Page ' + page.records[0].page + ' · next ' + page.records[0].nextCursor
          : 'Page 1 pending',
        200,
        700,
        650,
        page.pages >= 1 ? themeColors.blue : themeColors.muted,
        95,
        31,
      );
      card(
        ctx,
        api,
        page.records[1]
          ? 'Page ' + page.records[1].page + ' · next ' + page.records[1].nextCursor
          : 'Page 2 pending',
        1070,
        700,
        650,
        page.duplicate ? themeColors.pink : themeColors.muted,
        95,
        31,
      );
    });
    api.focus.target('pagination-stop', () =>
      text(
        ctx,
        api,
        page.duplicate
          ? 'Seen cursor ' + page.nextCursor + ' repeats → incomplete result; stop paging'
          : page.pages
            ? 'Seen cursors: {' + page.cursors.join(', ') + '} · next page may be requested'
            : 'Seen cursors: {} · no source result yet',
        960,
        880,
        31,
        page.duplicate ? themeColors.pink : themeColors.cyan,
        'center',
      ),
    );
    text(
      ctx,
      api,
      page.duplicate
        ? 'Regression fixture: assert incomplete status and stable request/source identity'
        : 'Adapter owns cursor checks · tenant store remains the source team boundary',
      960,
      965,
      27,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'path',
  draw: drawPath,
  cues: ['path-beat-1-focus-1', 'path-beat-1-focus-2', 'pagination-repeat', 'pagination-identity'],
};
