import { clamp, completed, mix } from '../arithmetic.mjs';
import { joinedRows } from '../model.mjs';
import { sampleModel } from '../construction.mjs';
import {
  drawSqlBox,
  drawSqlCaption,
  drawSqlEquation,
  drawSqlText,
  withSqlFocus,
  wrapSqlText,
} from '../defaults.mjs';
export function drawSemantic(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    m = sampleModel('semantic', state);
  const workspaceName = (id) => (id === 'w01' ? 'Harbor Store' : 'Birch Store');
  {
    drawSqlText(
      ctx,
      api,
      'August edition   /   “Can I take this coat back?”',
      960,
      255,
      33,
      themeColors.yellow,
      'center',
    );
    if (currentBeat === 0) {
      const cx = 620,
        cy = 700,
        radius = 120,
        vectorRow = m.rows[0],
        child = joinedRows(true).find((row) => row.id === vectorRow.chunk),
        unit = vectorRow.vector.map((value) => value / Math.hypot(...vectorRow.vector)),
        theta = Math.atan2(unit[1], unit[0]),
        activeLength = mix(Math.hypot(...vectorRow.vector) * radius, radius, m.geometryProgress),
        currentProject = m.project > 0,
        projection = m.project > 0 ? m.rows[m.projectionIndex].score : vectorRow.score;
      withSqlFocus(ctx, api, 'similarity-geometry', () => {
        api.circle(ctx, cx, cy, radius, 'transparent', themeColors.muted, 2);
        api.line(ctx, cx - radius - 36, cy, cx + 3 * radius + 45, cy, themeColors.muted, 2);
        api.line(ctx, cx, cy + radius + 25, cx, cy - 3 * radius - 25, themeColors.muted, 2);
        api.arrow(ctx, cx, cy, cx + radius, cy, themeColors.blue, 8);
        const length = currentProject ? radius : activeLength,
          endX = cx + unit[0] * length,
          endY = cy - unit[1] * length,
          markerVisible = m.normalize === 1,
          arrowEnd = markerVisible
            ? {
                x: endX - unit[0] * 16,
                y: endY + unit[1] * 16,
              }
            : {
                x: endX,
                y: endY,
              };
        api.arrow(ctx, cx, cy, arrowEnd.x, arrowEnd.y, themeColors.cyan, 7);
        api.circle(ctx, cx, cy, 5, themeColors.ink, themeColors.ink, 1);
        if (markerVisible)
          api.circle(ctx, endX, endY, 6, themeColors.yellow, themeColors.yellow, 1);
        if (currentProject) {
          const projectionY = mix(endY, cy, m.projectionProgress);
          if (m.projectionProgress > 0 && Math.abs(unit[0]) > 1e-6)
            api.line(ctx, endX, endY, endX, projectionY, themeColors.yellow, 3);
          const anglePoints = Array.from(
            {
              length: 13,
            },
            (_, i) => {
              const angle = (-theta * i) / 12;
              return {
                x: cx + Math.cos(angle) * 40,
                y: cy + Math.sin(angle) * 40,
              };
            },
          );
          api.path(ctx, anglePoints, {
            color: themeColors.yellow,
            width: 3,
          });
        }
      });
      withSqlFocus(ctx, api, 'normalized-candidate-overview', () => {
        if (m.rank > 0) {
          drawSqlText(
            ctx,
            api,
            'Other candidates · unit length',
            820,
            500,
            22,
            themeColors.muted,
            'center',
          );
          m.overviewRows.forEach((point) => {
            const u = point.vector.map((value) => value / Math.hypot(...point.vector)),
              x = mix(cx, cx + u[0] * radius, m.rank),
              y = mix(cy, cy - u[1] * radius, m.rank);
            api.circle(ctx, x, y, 6 * m.rank, themeColors.cyan, themeColors.cyan, 1);
          });
        }
      });
      withSqlFocus(ctx, api, 'similarity-projection', () => {
        drawSqlBox(
          ctx,
          api,
          1080,
          360,
          720,
          360,
          currentProject ? themeColors.yellow : themeColors.cyan,
        );
        drawSqlText(
          ctx,
          api,
          currentProject
            ? 'Cosine projection · c99'
            : m.normalize === 1
              ? 'Normalized candidate · c99'
              : 'Normalize candidate · c99',
          1440,
          405,
          27,
          currentProject ? themeColors.yellow : themeColors.cyan,
          'center',
        );
        drawSqlText(ctx, api, 'Query q = (1, 0)', 1440, 445, 22, themeColors.blue, 'center');
        if (child)
          drawSqlText(
            ctx,
            api,
            wrapSqlText(ctx, api, child.text, 620, 32),
            1120,
            485,
            32,
            themeColors.ink,
          );
        drawSqlText(
          ctx,
          api,
          'model E1 · embedding E1-c99 · paragraph c99',
          1440,
          548,
          22,
          themeColors.muted,
          'center',
        );
        if (m.normalize === 1)
          drawSqlEquation(
            ctx,
            api,
            String.raw`\hat{\mathbf v}=\left(\frac{3}{\sqrt{10}},\frac{1}{\sqrt{10}}\right)`,
            1440,
            598,
            25,
            themeColors.cyan,
          );
        else {
          drawSqlEquation(
            ctx,
            api,
            String.raw`\mathbf v=(3,1),\quad\lVert\mathbf v\rVert=\sqrt{10}`,
            1440,
            598,
            25,
            themeColors.cyan,
          );
          if (m.normalize > 0)
            drawSqlEquation(
              ctx,
              api,
              String.raw`\hat{\mathbf v}=\frac{\mathbf v}{\sqrt{10}}`,
              1440,
              633,
              24,
              themeColors.cyan,
            );
        }
        if (currentProject) {
          drawSqlEquation(
            ctx,
            api,
            String.raw`\cos\theta=\hat q\cdot\hat v`,
            1425,
            650,
            25,
            themeColors.yellow,
          );
          if (m.project === 1) drawSqlText(
            ctx,
            api,
            'score ' + projection.toFixed(3),
            1760,
            686,
            21,
            themeColors.yellow,
            'right',
          );
        } else
          drawSqlText(
            ctx,
            api,
            m.normalize === 1
              ? 'Unit length · same direction'
              : m.normalize === 0
                ? 'Raw vector'
                : 'Normalize · preserve direction',
            1440,
            m.normalize === 1 ? 640 : 674,
            23,
            themeColors.cyan,
            'center',
          );
      });
      withSqlFocus(ctx, api, 'cosine-ranking', () => {
        if (m.rank > 0) {
          drawSqlText(
            ctx,
            api,
            'Ranked by cosine · closest → farther',
            960,
            835,
            25,
            themeColors.muted,
            'center',
          );
          const count = completed(m.rank, m.rows.length),
            ordered = m.rows.slice(0, count),
            start = 195,
            width = 255,
            gap = 18;
          ordered.forEach((candidate, i) => {
            const x = start + i * (width + gap);
            drawSqlBox(ctx, api, x, 875, width, 62, themeColors.blue);
            drawSqlText(
              ctx,
              api,
              candidate.chunk,
              x + width / 2,
              915,
              25,
              themeColors.cyan,
              'center',
            );
          });
          if (count) drawSqlText(ctx, api, 'nearest', start, 965, 20, themeColors.muted);
          if (count)
            drawSqlText(
              ctx,
              api,
              'farther',
              start + (count - 1) * (width + gap) + width,
              965,
              20,
              themeColors.muted,
              'right',
            );
        }
      });
    } else if (currentBeat === 1) {
      const candidate = m.rows[m.activeIndex],
        source = joinedRows(true).find((row) => row.id === candidate.chunk),
        failureGate = {
          workspace: 0,
          retired: 1,
          reader: 2,
        },
        failAt = failureGate[candidate.reason],
        steps = failAt === undefined ? 4 : failAt + 1,
        progress = clamp(m.activeProgress),
        travel = progress * steps,
        stage = Math.min(steps - 1, Math.floor(travel)),
        within = progress === 1 ? 1 : travel - stage,
        gateX = [660, 930, 1200],
        startX = 360,
        endX = candidate.allowed ? 1500 : gateX[failAt],
        currentX =
          stage === 3
            ? mix(gateX[2], endX, within)
            : mix(stage === 0 ? startX : gateX[stage - 1], gateX[stage], within),
        gateTitles = ['Harbor Store', 'Current · Aug 12', 'Bob’s grant'],
        gateResults = gateX.map((_, i) => {
          if (failAt !== undefined && i > failAt) return 'waiting';
          if (i < stage) return 'PASS';
          if (i === stage) {
            if (failAt === i && within > 0.78) return 'STOP';
            if (failAt !== undefined && i > failAt) return 'waiting';
            return within > 0.78 ? 'PASS' : 'checking';
          }
          return 'waiting';
        });
      drawSqlText(
        ctx,
        api,
        'Ranked candidates · request two paragraphs',
        960,
        315,
        29,
        themeColors.blue,
        'center',
      );
      withSqlFocus(ctx, api, 'candidate-gates', () => {
        const tokenWidth = 126,
          railStart = 360,
          railEnd = 1500,
          railGap = 7,
          leftEnd = currentX - tokenWidth / 2 - railGap,
          rightStart = currentX + tokenWidth / 2 + railGap;
        if (leftEnd > railStart + 1)
          api.line(ctx, railStart, 400, Math.min(railEnd, leftEnd), 400, themeColors.muted, 3);
        if (rightStart < railEnd - 1)
          api.line(ctx, Math.max(railStart, rightStart), 400, railEnd, 400, themeColors.muted, 3);
        for (const x of gateX) api.line(ctx, x, 430, x, 435, themeColors.muted, 2);
        gateX.forEach((x, i) => {
          drawSqlBox(ctx, api, x - 112, 440, 224, 150, themeColors.blue);
          drawSqlText(ctx, api, gateTitles[i], x, 480, 23, themeColors.blue, 'center');
          const status = gateResults[i],
            color =
              status === 'PASS'
                ? themeColors.green
                : status === 'STOP'
                  ? themeColors.pink
                  : themeColors.muted;
          drawSqlText(ctx, api, status, x, 535, 23, color, 'center');
        });
        drawSqlBox(ctx, api, 1415, 440, 370, 150, themeColors.green);
        drawSqlText(ctx, api, 'Two results requested', 1600, 480, 24, themeColors.green, 'center');
        drawSqlText(
          ctx,
          api,
          m.allowed.length + '/2 permitted',
          1600,
          535,
          25,
          themeColors.ink,
          'center',
        );
        const tokenX = currentX;
        drawSqlBox(
          ctx,
          api,
          tokenX - tokenWidth / 2,
          370,
          tokenWidth,
          60,
          candidate.allowed && stage === 3
            ? themeColors.green
            : failAt !== undefined && stage === failAt
              ? themeColors.pink
              : themeColors.yellow,
        );
        drawSqlText(ctx, api, candidate.chunk, tokenX, 409, 24, themeColors.ink, 'center');
        drawSqlBox(ctx, api, 110, 600, 600, 250, themeColors.cyan);
        drawSqlText(
          ctx,
          api,
          candidate.chunk + ' · ' + source.source.title,
          150,
          645,
          26,
          themeColors.cyan,
        );
        drawSqlText(
          ctx,
          api,
          wrapSqlText(ctx, api, source.text, 520, 31),
          150,
          710,
          31,
          themeColors.ink,
        );
        drawSqlText(
          ctx,
          api,
          source.source.workspace === 'w01'
            ? 'Harbor Store · ' + source.source.id
            : workspaceName(source.source.workspace) + ' · ' + source.source.id,
          150,
          805,
          22,
          themeColors.muted,
        );
      });
      withSqlFocus(ctx, api, 'semantic-result', () => {
        drawSqlText(
          ctx,
          api,
          m.allowed.length === 2 ? 'Both requested paragraphs passed' : 'Passed paragraphs',
          1120,
          650,
          26,
          themeColors.green,
          'center',
        );
        m.allowed.forEach((result, i) => {
          const item = joinedRows(true).find((row) => row.id === result.chunk),
            y = 690 + i * 135;
          drawSqlBox(ctx, api, 890, y, 565, 112, themeColors.green);
          drawSqlText(
            ctx,
            api,
            result.chunk + ' · Harbor · current · Bob',
            1172,
            y + 34,
            22,
            themeColors.green,
            'center',
          );
          drawSqlText(
            ctx,
            api,
            wrapSqlText(ctx, api, item.text, 510, 21),
            920,
            y + 78,
            21,
            themeColors.ink,
          );
        });
        if (!m.allowed.length)
          drawSqlText(
            ctx,
            api,
            'No paragraph has passed yet',
            1172,
            750,
            25,
            themeColors.muted,
            'center',
          );
      });
    } else {
      withSqlFocus(ctx, api, 'saved-lineage', () => {
        if (m.lineage > 0 && m.result) {
          const result = joinedRows(true).find((row) => row.id === m.result.chunk),
            boxes = [
              {
                x: 100,
                y: 425,
                w: 350,
                h: 170,
                c: themeColors.cyan,
              },
              {
                x: 560,
                y: 425,
                w: 430,
                h: 170,
                c: themeColors.green,
              },
              {
                x: 1100,
                y: 425,
                w: 340,
                h: 170,
                c: themeColors.blue,
              },
              {
                x: 1520,
                y: 425,
                w: 280,
                h: 170,
                c: themeColors.yellow,
              },
            ];
          drawSqlBox(ctx, api, boxes[0].x, boxes[0].y, boxes[0].w, boxes[0].h, themeColors.cyan);
          drawSqlText(
            ctx,
            api,
            'Embedding ' + m.result.id,
            275,
            470,
            23,
            themeColors.cyan,
            'center',
          );
          drawSqlText(
            ctx,
            api,
            'model E1 · paragraph ' + m.result.chunk,
            275,
            525,
            22,
            themeColors.ink,
            'center',
          );
          drawSqlText(
            ctx,
            api,
            'rank score ' + m.result.score.toFixed(3),
            275,
            565,
            21,
            themeColors.muted,
            'center',
          );
          drawSqlBox(ctx, api, boxes[1].x, boxes[1].y, boxes[1].w, boxes[1].h, themeColors.green);
          drawSqlText(ctx, api, 'Stored paragraph', 775, 470, 25, themeColors.green, 'center');
          drawSqlText(
            ctx,
            api,
            wrapSqlText(ctx, api, result.text, 390, 20),
            775,
            520,
            20,
            themeColors.ink,
            'center',
          );
          drawSqlText(
            ctx,
            api,
            'exact text · exact identity',
            775,
            570,
            20,
            themeColors.muted,
            'center',
          );
          drawSqlBox(ctx, api, boxes[2].x, boxes[2].y, boxes[2].w, boxes[2].h, themeColors.blue);
          drawSqlText(ctx, api, 'Source edition', 1270, 470, 25, themeColors.blue, 'center');
          drawSqlText(
            ctx,
            api,
            'd7-next · Return Policy',
            1270,
            525,
            22,
            themeColors.ink,
            'center',
          );
          drawSqlText(ctx, api, 'versioned row', 1270, 570, 20, themeColors.muted, 'center');
          drawSqlBox(ctx, api, boxes[3].x, boxes[3].y, boxes[3].w, boxes[3].h, themeColors.yellow);
          drawSqlText(ctx, api, 'Workspace', 1660, 470, 25, themeColors.yellow, 'center');
          drawSqlText(ctx, api, 'Harbor · w01', 1660, 535, 24, themeColors.ink, 'center');
          boxes
            .slice(0, -1)
            .forEach((item, i) =>
              api.arrow(
                ctx,
                item.x + item.w + 15,
                510,
                boxes[i + 1].x - 12,
                510,
                themeColors.cyan,
                5,
              ),
            );
          drawSqlText(
            ctx,
            api,
            'saved dataset · model E1 · policy time · corpus snapshot · retrieval settings',
            960,
            760,
            28,
            themeColors.muted,
            'center',
          );
          drawSqlText(
            ctx,
            api,
            'A later evaluation can reconstruct why this paragraph ranked and passed',
            960,
            830,
            27,
            themeColors.cyan,
            'center',
          );
        }
      });
    }
    drawSqlCaption(
      ctx,
      api,
      currentBeat === 0
        ? 'Unit vectors   ·   the signed coordinate along the query gives the cosine'
        : currentBeat === 1
          ? 'Rank first · then enforce the same workspace, version and reader rules'
          : 'The vector result returns to its source row and owning workspace',
    );
  }
}
export default {
  id: 'semantic',
  draw: drawSemantic,
  cues: [
    'normalize-candidate-vectors',
    'project-cosine-score',
    'rank-by-cosine',
    'inspect-filtered-prefix',
    'explain-other-store-failure',
    'explain-retired-failure',
    'explain-reader-failure',
    'request-two-results',
    'advance-ranked-search',
    'continue-candidate-search',
    'follow-result-lineage',
  ],
};
