import { CREDENTIAL_ROWS } from '../fixtures.mjs';
import { vectorCosine } from '../vector-search.mjs';
import {
  drawCredentialDocs,
  drawExtensionArrow,
  drawExtensionBar,
  drawExtensionBox,
  drawExtensionNote,
  drawExtensionText,
} from '../defaults.mjs';
export function drawDenseEncoding(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = (id) => api.focus.progress(id),
    cueVisible = (id) => api.focus.visible(id),
    resultComplete = (id) => progress(id) === 1;
  api.focus.target('dense-encoding-construction', () => {
    if (currentBeat === 0) {
      drawExtensionBox(
        ctx,
        api,
        'Passage d2 · new credential',
        150,
        380,
        650,
        100,
        themeColors.green,
        31,
      );
      drawExtensionBox(
        ctx,
        api,
        'query · rotate API key',
        150,
        700,
        650,
        100,
        themeColors.cyan,
        31,
      );
      if (cueVisible('two-encoders')) {
        drawExtensionArrow(
          ctx,
          api,
          830,
          430,
          1050,
          430,
          themeColors.green,
          progress('two-encoders'),
        );
        drawExtensionBox(
          ctx,
          api,
          'passage encoder Eₚ → stored vector',
          1080,
          380,
          670,
          100,
          themeColors.green,
          29,
        );
        drawExtensionArrow(
          ctx,
          api,
          830,
          750,
          1050,
          750,
          themeColors.cyan,
          progress('two-encoders'),
        );
        drawExtensionBox(
          ctx,
          api,
          'query encoder Eᵩ → live vector',
          1080,
          700,
          670,
          100,
          themeColors.cyan,
          29,
        );
      }
      if (cueVisible('encoder-parameters'))
        drawExtensionNote(
          ctx,
          api,
          'Compatible learned spaces; weights can differ. These coordinates are supplied, not trained here.',
        );
    } else if (currentBeat === 1 || currentBeat === 2) {
      const plot = api.teaching.axes({
        x: 200,
        y: 430,
        width: 480,
        height: 480,
        xDomain: [0, 1.2],
        yDomain: [0, 1.2],
        xTicks: [0, 0.4, 0.8, 1.2],
        yTicks: [0, 0.4, 0.8, 1.2],
        xLabel: 'coordinate 1',
        yLabel: 'coordinate 2',
        equalUnits: true,
        fontSize: 23,
      });
      drawExtensionText(
        ctx,
        api,
        'q = [1, 0.8, 0]   ·   z = 0 plane',
        150,
        300,
        30,
        themeColors.muted,
      );
      const start = plot.point(0, 0);
      if (cueVisible('query-coordinates')) {
        const q = plot.point(1, 0.8);
        drawExtensionArrow(
          ctx,
          api,
          start.x,
          start.y,
          q.x,
          q.y,
          themeColors.yellow,
          progress('query-coordinates'),
        );
        drawExtensionText(ctx, api, 'q', q.x + 20, q.y, 29, themeColors.yellow);
      }
      if (cueVisible('source-coordinates'))
        [
          [[1, 0.4], 'd1', themeColors.blue],
          [[0.9, 0.9], 'd2', themeColors.green],
        ].forEach(([v, id, c]) => {
          const at = plot.point(...v);
          drawExtensionArrow(
            ctx,
            api,
            start.x,
            start.y,
            at.x,
            at.y,
            c,
            progress('source-coordinates'),
          );
          drawExtensionText(ctx, api, id, at.x + 20, at.y + 15, 30, c);
        });
      if (cueVisible('dense-angles')) {
        const queryAngle = Math.atan2(0.8, 1);
        for (const [i, row] of CREDENTIAL_ROWS.slice(0, 2).entries()) {
          const angle = Math.atan2(row.v[1], row.v[0]);
          const radius = i === 0 ? 0.52 : 0.68;
          const endAngle = queryAngle + (angle - queryAngle) * progress('dense-angles');
          let previous = plot.point(radius * Math.cos(queryAngle), radius * Math.sin(queryAngle));
          for (let j = 1; j <= 20; j++) {
            const a = queryAngle + ((endAngle - queryAngle) * j) / 20;
            const point = plot.point(radius * Math.cos(a), radius * Math.sin(a));
            api.line(
              ctx,
              previous.x,
              previous.y,
              point.x,
              point.y,
              i ? themeColors.green : themeColors.blue,
              4,
            );
            previous = point;
          }
        }
      }
      const passageNames = ['Rotation guide', 'Credential guide', 'Project settings', 'Quota page'];
      CREDENTIAL_ROWS.forEach((r, i) => {
        const y = 380 + i * 140;
        drawExtensionText(ctx, api, '[' + r.v.join(', ') + ']', 890, y + 49, 29, themeColors.muted);
        drawExtensionText(
          ctx,
          api,
          r.id + '   ' + passageNames[i],
          890,
          y,
          30,
          r.relevant ? themeColors.green : themeColors.blue,
        );
        if (resultComplete('cosine-scores')) {
          const score = vectorCosine([1, 0.8, 0], r.v);
          drawExtensionBar(
            ctx,
            api,
            1310,
            y - 35,
            400,
            36,
            score,
            1,
            r.relevant ? themeColors.green : themeColors.blue,
          );
          drawExtensionText(ctx, api, score.toFixed(3), 1850, y, 29, themeColors.cyan, 'right');
        }
      });
      if (currentBeat === 1 && cueVisible('dense-angles'))
        drawExtensionText(
          ctx,
          api,
          'Which guide needs the smaller turn?',
          1280,
          965,
          37,
          themeColors.yellow,
          'center',
        );
      if (resultComplete('dense-winner') && !resultComplete('cosine-scores'))
        drawExtensionText(
          ctx,
          api,
          'Credential guide  ·  d2',
          1260,
          965,
          37,
          themeColors.green,
          'center',
        );
      if (resultComplete('cosine-scores'))
        drawExtensionText(
          ctx,
          api,
          'd2  ·  1.62 / (‖q‖ × ‖d2‖) ≈ 0.994',
          1260,
          965,
          37,
          themeColors.green,
          'center',
        );
      drawExtensionNote(
        ctx,
        api,
        'All three coordinates are used in scores. The plot explicitly shows only the z=0 slice.',
      );
    } else {
      drawExtensionText(
        ctx,
        api,
        'Stored passages and query need compatible representations',
        150,
        285,
        33,
        themeColors.cyan,
      );
      drawCredentialDocs(ctx, api, 170, 390);
      if (cueVisible('embedding-version')) {
        drawExtensionBox(ctx, api, 'query encoder v2', 1120, 340, 580, 75, themeColors.yellow, 30);
        CREDENTIAL_ROWS.forEach((r, i) =>
          drawExtensionBox(
            ctx,
            api,
            r.id + ' · stored embedding v1',
            1120,
            445 + i * 110,
            580,
            70,
            themeColors.pink,
            27,
          ),
        );
        drawExtensionText(
          ctx,
          api,
          'Rebuild or verify compatibility before reuse',
          960,
          960,
          36,
          themeColors.yellow,
          'center',
        );
      }
    }
  });
  return true;
}
export default {
  id: 'dense-encoding',
  draw: drawDenseEncoding,
  cues: [
    'two-encoders',
    'encoder-parameters',
    'query-coordinates',
    'source-coordinates',
    'dense-angles',
    'cosine-scores',
    'dense-winner',
    'embedding-version',
  ],
};
