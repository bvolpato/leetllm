import { deepStrictEqual as assertEqual } from 'node:assert/strict';
import {
  arrow,
  axes,
  dot,
  draw,
  fadeIn,
  mixColor,
  parseColor,
  polyline,
  rect,
  smoother,
  text,
  to,
} from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, tile } from '../defaults.mjs';

// Centered text stores half its measured advance in px. Keep its full line height,
// including whitespace, so these fields retain the original composition on 0.8.1.
const labelWidth = (node) => 2 * node.get('px');
const labelHeight = (node) => node.data.size * 1.2 * node.source.split('\n').length;
const region = (left, top, width, height) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
  cx: left + width / 2,
  cy: top + height / 2,
});
// Each field is a node (or a plot with its dots) and its measured height.
function stackFields(fields, x, y, gap) {
  const height = fields.reduce((sum, [, h]) => sum + h, 0) + gap * (fields.length - 1);
  let top = y - height / 2;
  return fields.flatMap(([field, h]) => {
    const nodes = [field].flat();
    nodes.forEach((node) => node.shift(x, top + h / 2));
    top += h + gap;
    return nodes;
  });
}

/** Glitch tokens: frequency, row lookup, and the evidence needed to assess a cause. */
export function buildGlitch(stage, narration, { clearAtEnd }) {
  const handover = (from, ...into) =>
    stage.play(
      brief(fadeOut(from), 0.18, 0, LINEAR),
      ...into.map((animation) => brief(animation, 0.4, 0.2)),
    );
  const clock = narration.scene('glitch');
  sceneHeading(stage, clock, narration.title('glitch'));
  const TOKEN = '·SolidGoldMagikarp';

  // These are independent illustrative inputs, not recovered training data or model weights.
  // Frequency controls row brightness. It does not compute the vectors or the invented reply.
  const vocabulary = ['rain', '·falls', '·the', 'ing', TOKEN, '·model'];
  const corpus = vocabulary.flatMap((token, id) =>
    Array.from({ length: [72, 58, 100, 84, 1, 66][id] }, () => token),
  );
  const vectors = [
    [0.5, 0.6, 0.2, -0.1],
    [0.3, 0.5, 0.1, 0.3],
    [0.6, 0.4, -0.2, 0.2],
    [0.4, 0.3, 0.3, 0.1],
    [-0.8, -0.6, 0.1, -0.2],
    [0.7, 0.6, 0.2, 0.4],
  ];
  const counts = vocabulary.map((token) => corpus.filter((item) => item === token).length);
  const tokenId = vocabulary.indexOf(TOKEN);
  const selectedVector = vectors[tokenId];
  const coordinates = vectors.map((vector) => vector.slice(0, 2));
  const otherCoordinates = coordinates.filter((_, id) => id !== tokenId);
  const centroid = [0, 1].map(
    (dimension) =>
      otherCoordinates.reduce((sum, point) => sum + point[dimension], 0) / otherCoordinates.length,
  );
  const distance = (point) => Math.hypot(...point.map((value, i) => value - centroid[i]));
  const mostFrequent = Math.max(...counts);
  const brightness = counts.map((count) => 0.04 + (0.8 * count) / mostFrequent);
  assertEqual(counts, [72, 58, 100, 84, 1, 66], 'toy corpus occurrence counts');
  assertEqual(corpus.length, 381, 'toy corpus length');
  assertEqual(tokenId, 4, 'the documented spelling selects toy row four');
  assertEqual(counts[tokenId], 1, 'the selected row has one toy occurrence');
  assertEqual(selectedVector, [-0.8, -0.6, 0.1, -0.2], 'the input lookup returns its row');
  assertEqual(coordinates[tokenId], [-0.8, -0.6], 'the plot uses the first two coordinates');
  assertEqual(brightness[tokenId] < 0.05, true, 'the rare row stays almost dark');
  assertEqual(
    brightness.filter((_, id) => id !== tokenId).every((value) => value > 0.5),
    true,
    'the other rows have visibly higher frequency',
  );
  assertEqual(
    distance(coordinates[tokenId]) > 4 * Math.max(...otherCoordinates.map(distance)),
    true,
    'the selected point is an outlier in this illustrative table',
  );

  const bigToken = text(TOKEN, { font: 'mono', size: 124, color: 'red' }).at(0, 20);
  const documented = text('A documented glitch token', { size: 62, color: 'dim' }).at(0, 135);
  const anomalous = text('It can trigger anomalous behavior', {
    font: 'text-serif',
    size: 72,
    color: 'yellow',
  }).at(0, 245);
  clock.at(0.1, () => stage.play(fadeIn(bigToken), { duration: 0.35 }));
  clock.after('strange', () => stage.play(fadeIn(documented), { duration: 0.5 }));
  clock.after('anomalous', () => stage.play(fadeIn(anomalous), { duration: 0.5 }));

  const area = region(-870, -395, 1740, 845);
  const rowUnit = (area.height - 2 * 24) / (1 + 3.4 + 0.35);
  const corpusArea = region(area.left, area.top, area.width, rowUnit);
  const mechanismArea = region(area.left, corpusArea.bottom + 24, area.width, rowUnit * 3.4);
  const footnoteArea = region(area.left, mechanismArea.bottom + 24, area.width, rowUnit * 0.35);
  const corpusWidth = (corpusArea.width - 48) / 2;
  const corpusRegions = [0, 1].map((i) =>
    region(
      corpusArea.left + i * (corpusWidth + 48),
      corpusArea.top,
      corpusWidth,
      corpusArea.height,
    ),
  );
  const corpusPanel = (region, title, words, color) => {
    const heading = text(title, { size: 38, color });
    const chips = words.map((word) =>
      tile(word, { size: 30, h: 58, pad: 24, color: word === TOKEN ? 'red' : color }),
    );
    const chipsWidth = chips.reduce((sum, node) => sum + node.width, 0) + 12 * (chips.length - 1);
    let left = -chipsWidth / 2;
    chips.forEach((node) => {
      node.at(left + node.width / 2, 0);
      left += node.width + 12;
    });
    const contents = stackFields(
      [
        [heading, labelHeight(heading)],
        [chips, 58],
      ],
      region.cx,
      region.cy,
      20,
    );
    const panel = rect(region.width, region.height, {
      radius: 16,
      fill: 'surface',
      stroke: color,
      width: 2,
    }).at(region.cx, region.cy);
    return [panel, ...contents];
  };
  const corpora = [
    ...corpusPanel(
      corpusRegions[0],
      'Vocabulary-building sample',
      ['rain', TOKEN, 'ing'],
      'yellow',
    ),
    ...corpusPanel(
      corpusRegions[1],
      'Model-training sample',
      ['rain', '·the', 'ing', '·falls', '·model'],
      'blue',
    ),
  ];
  const illustrationNote = text('Illustration: invented counts, vectors, and output.', {
    size: 38,
    color: 'dim',
  }).at(footnoteArea.cx, footnoteArea.cy);
  const columnUnit = (mechanismArea.width - 64) / (1.65 + 1);
  const tableArea = region(
    mechanismArea.left,
    mechanismArea.top,
    columnUnit * 1.65,
    mechanismArea.height,
  );
  const resultArea = region(
    tableArea.right + 64,
    mechanismArea.top,
    columnUnit,
    mechanismArea.height,
  );
  const plotHeight = ((resultArea.height - 28) * 1.5) / (1.5 + 1);
  const plotArea = region(resultArea.left, resultArea.top, resultArea.width, plotHeight);
  const replyArea = region(
    resultArea.left,
    plotArea.bottom + 28,
    resultArea.width,
    (resultArea.height - 28) / 2.5,
  );
  const background = parseColor('bg');
  const trainedColor = parseColor('blue');
  const rowCells = vectors.map((vector) =>
    vector.map(() => rect(68, 48, { radius: 4, fill: 'surface', stroke: 'dim', width: 1 })),
  );
  const countLabels = counts.map((count, id) =>
    text(String(count), { font: 'mono', size: 36, color: id === tokenId ? 'red' : 'ink' }),
  );
  const idLabels = vocabulary.map((_, id) => text(String(id), { font: 'mono', size: 32 }));
  const tokenLabels = vocabulary.map((token, id) =>
    text(token, { font: 'mono', size: 32, color: id === tokenId ? 'red' : 'ink' }),
  );
  const headers = ['toy ID', 'vocabulary', 'occurrences', 'vector row'].map((label) =>
    text(label, { size: 32, color: 'dim' }),
  );
  const cellWidth = 68,
    cellHeight = 48,
    cellGap = 6,
    columnGap = 20,
    rowGap = 16;
  const vectorWidth = vectors[0].length * cellWidth + (vectors[0].length - 1) * cellGap;
  const columnWidths = [
    Math.max(labelWidth(headers[0]), ...idLabels.map(labelWidth)),
    Math.max(labelWidth(headers[1]), ...tokenLabels.map(labelWidth)),
    Math.max(labelWidth(headers[2]), ...countLabels.map(labelWidth)),
    Math.max(labelWidth(headers[3]), vectorWidth),
  ];
  const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0) + 3 * columnGap;
  const columnLefts = columnWidths.map(
    (_, i) =>
      tableArea.right -
      tableWidth +
      columnWidths.slice(0, i).reduce((sum, width) => sum + width + columnGap, 0),
  );
  const headerY = tableArea.top + labelHeight(headers[0]) / 2;
  headers.forEach((node, i) =>
    node.at(columnLefts[i] + (i === 1 ? labelWidth(node) : columnWidths[i]) / 2, headerY),
  );
  const rowY = (id) => headerY + (id + 1) * (cellHeight + rowGap);
  vocabulary.forEach((_, id) => {
    // The ID, spelling and count share a baseline, even at different font sizes.
    const baseline = rowY(id) - countLabels[id].get('py');
    idLabels[id].at(columnLefts[0] + columnWidths[0] / 2, baseline + idLabels[id].get('py'));
    tokenLabels[id].at(
      columnLefts[1] + labelWidth(tokenLabels[id]) / 2,
      baseline + tokenLabels[id].get('py'),
    );
    countLabels[id].at(columnLefts[2] + columnWidths[2] / 2, rowY(id));
    rowCells[id].forEach((node, dimension) =>
      node.at(columnLefts[3] + dimension * (cellWidth + cellGap) + cellWidth / 2, rowY(id)),
    );
  });
  const table = [
    ...headers,
    ...vocabulary.flatMap((_, id) => [
      idLabels[id],
      tokenLabels[id],
      countLabels[id],
      ...rowCells[id],
    ]),
  ];
  const heatCells = rowCells.map((cells, id) =>
    cells.map((cell) =>
      rect(cellWidth, cellHeight, {
        radius: 4,
        fill: mixColor(background, trainedColor, brightness[id]),
        stroke: 'dim',
        width: 1,
      }).at(cell.get('x'), cell.get('y')),
    ),
  );
  const cellNumbers = rowCells.map((cells, id) =>
    cells.map((cell, dimension) =>
      text(vectors[id][dimension].toFixed(1), { font: 'mono', size: 26 })
        .at(cell.get('x'), cell.get('y'))
        .zIndex(3),
    ),
  );
  const legend = text('Brighter rows occur more often in the training text', { size: 31, color: 'dim' });
  legend.at(
    tableArea.right - labelWidth(legend) / 2,
    rowY(vocabulary.length - 1) + cellHeight / 2 + 20 + labelHeight(legend) / 2,
  );
  const selectedLeft = idLabels[tokenId].get('x') - labelWidth(idLabels[tokenId]) / 2 - 10;
  const selectedRow = region(
    selectedLeft,
    rowY(tokenId) - cellHeight / 2 - 6,
    tableArea.right + 10 - selectedLeft,
    cellHeight + 12,
  );
  const rowOutline = rect(selectedRow.width, selectedRow.height, {
    radius: 8,
    fill: null,
    stroke: 'red',
    width: 3,
  }).at(selectedRow.cx, selectedRow.cy);
  const input = tile(`Please repeat: ${TOKEN}  →  ID ${tokenId}`, {
    size: 30,
    color: 'yellow',
    h: 60,
  }).at(tableArea.cx, tableArea.bottom - 30);
  const source = [tableArea.cx - input.width / 2, input.get('y')];
  const gutterX = tableArea.left + 8;
  const routePoints = [
    [source[0] - 14, source[1]],
    [gutterX, source[1]],
    [gutterX, selectedRow.cy],
    [selectedRow.left - 12, selectedRow.cy],
  ];
  const lookupRoute = polyline(routePoints, { stroke: 'yellow', width: 3 });
  const lookupTip = arrow(routePoints[2], routePoints[3], {
    stroke: 'yellow',
    width: 3,
    tip: 14,
  });
  const lookupMarker = dot(9, 'yellow')
    .at(...routePoints[0])
    .zIndex(4);

  const plotTitle = text('Vector coordinates 1 and 2', { size: 34, color: 'blue' });
  plotTitle.at(plotArea.cx, plotArea.top + labelHeight(plotTitle) / 2);
  const plot = axes({
    x: [-1, 1],
    y: [-1, 1],
    width: plotArea.width - 72,
    height: plotArea.height - 124,
    labels: false,
    grid: false,
    tips: false,
    color: 'dim',
  }).at(plotArea.cx, plotArea.cy);
  const trainedDots = otherCoordinates.map((point) => dot(10, 'blue').at(...plot.world(...point)));
  const outlierPoint = plot.world(...coordinates[tokenId]);
  const outlier = dot(12, 'red')
    .at(...outlierPoint)
    .zIndex(4);
  const outlierRing = rect(38, 38, { radius: 19, fill: null, stroke: 'red', width: 2 })
    .at(...outlierPoint)
    .zIndex(4);
  const vectorReadout = text(
    `row ${tokenId}: (${coordinates[tokenId].map((value) => value.toFixed(2)).join(', ')})`,
    {
      font: 'mono',
      size: 30,
      color: 'red',
    },
  );
  vectorReadout.at(plotArea.cx, plotArea.bottom - labelHeight(vectorReadout) / 2);
  const extraction = arrow(
    [selectedRow.right + 10, selectedRow.cy],
    [outlierPoint[0] - 20, outlierPoint[1]],
    { stroke: 'red', width: 3, tip: 16 },
  );
  const extractedValue = dot(9, 'red')
    .at(selectedRow.right + 10, selectedRow.cy)
    .zIndex(4);
  const replyLabel = text('Illustrative anomalous output', { size: 34, color: 'yellow' });
  const reply = tile('banana', { font: 'text-serif', size: 56, color: 'red', h: 80, min: 350 });
  const replyContents = stackFields(
    [
      [replyLabel, labelHeight(replyLabel)],
      [reply, 80],
    ],
    replyArea.cx,
    replyArea.cy,
    14,
  );

  const scaffold = table.filter((node) => !countLabels.includes(node));
  const mechanism = [
    ...corpora,
    ...table,
    ...heatCells.flat(),
    ...cellNumbers.flat(),
    legend,
    input,
    lookupRoute,
    lookupTip,
    lookupMarker,
    rowOutline,
    plotTitle,
    plot,
    ...trainedDots,
    outlier,
    outlierRing,
    vectorReadout,
    extraction,
    extractedValue,
    ...replyContents,
  ];
  clock.on('goals', () => {
    // Keep the original token visible until the viewer can find it in the vocabulary sample.
    stage.play(
      brief(fadeOut([documented, anomalous]), 0.18, 0, LINEAR),
      brief(fadeIn([...corpora, illustrationNote]), 0.4),
    );
    handover([bigToken], fadeIn([...scaffold, legend, plotTitle, plot]));
  });
  clock.after('barely', () =>
    stage.play(
      ...heatCells.map((cells, id) => brief(fadeIn(cells), 0.45, id * 0.07)),
      brief(fadeIn(countLabels), 0.4, 0.15),
      brief(fadeIn(cellNumbers.filter((_, id) => id !== tokenId).flat()), 0.4, 0.2),
      brief(fadeIn(trainedDots), 0.5, 0.2),
    ),
  );
  clock.on('under', () => {
    const duration = Math.max(0.2, clock.span('under'));
    stage.play(fadeIn(input), draw(lookupRoute), draw(lookupTip), fadeIn(lookupMarker), {
      duration: 0.2,
    });
    routePoints.slice(1).forEach((point, index) => {
      stage.at(clock.cue('under').start + (index * duration) / 3, () =>
        stage.play(
          to(lookupMarker, (node) => node.at(...point)),
          {
            duration: duration / 3,
            ease: smoother,
          },
        ),
      );
    });
  });
  clock.after('under', () =>
    stage.play(
      brief(fadeOut(lookupMarker), 0.15),
      brief(fadeIn([rowOutline, ...cellNumbers[tokenId]]), 0.25),
      brief(draw(extraction), 0.4),
      brief(fadeIn(extractedValue), 0.1),
      brief(
        to(extractedValue, (node) => node.at(...outlierPoint)),
        0.4,
      ),
      brief(fadeIn([outlier, outlierRing, vectorReadout]), 0.25, 0.4),
      brief(fadeOut(extractedValue), 0.15, 0.4),
    ),
  );
  clock.after('odd', () => stage.play(fadeIn(replyContents), { duration: 0.35 }));

  // These panels name evidence to collect. They report no experiment or measured result.
  const evidenceHeadingHeight = ((mechanismArea.height - 32) * 0.7) / (0.7 + 3);
  const evidenceHeadingArea = region(
    mechanismArea.left,
    mechanismArea.top,
    mechanismArea.width,
    evidenceHeadingHeight,
  );
  const evidenceBodyArea = region(
    mechanismArea.left,
    evidenceHeadingArea.bottom + 32,
    mechanismArea.width,
    ((mechanismArea.height - 32) * 3) / (0.7 + 3),
  );
  const diagnosticQuestion = text('Was this row undertrained?', {
    size: 56,
    color: 'yellow',
  }).at(corpusArea.cx, corpusArea.cy);
  const evidenceHeading = text('Check the training data, the weights, and the output', {
    size: 46,
    color: 'teal',
  }).at(evidenceHeadingArea.cx, evidenceHeadingArea.cy);
  const evidenceWidth = (evidenceBodyArea.width - 2 * 30) / 3;
  const evidenceRegions = [0, 1, 2].map((i) =>
    region(
      evidenceBodyArea.left + i * (evidenceWidth + 30),
      evidenceBodyArea.top,
      evidenceWidth,
      evidenceBodyArea.height,
    ),
  );
  const evidencePanel = (index, title, body) => {
    const region = evidenceRegions[index];
    const heading = text(title, { size: 40, color: 'teal', leading: 1.2 });
    const contents = stackFields(
      [[heading, labelHeight(heading)], ...body],
      region.cx,
      region.cy,
      30,
    );
    const panel = rect(region.width, region.height, {
      radius: 18,
      fill: 'surface',
      stroke: 'teal',
      width: 2,
    }).at(region.cx, region.cy);
    return {
      base: [panel, heading],
      detail: contents.filter((node) => node !== heading),
      all: [panel, ...contents],
    };
  };
  const frequencyValue = text(`${counts[tokenId]} / ${corpus.length}`, {
    font: 'mono',
    size: 76,
    color: 'red',
  });
  const frequencyNote = text('Occurrences in the\nexample corpus', {
    size: 34,
    color: 'dim',
    leading: 1.2,
  });
  const frequencyEvidence = evidencePanel(0, 'Training frequency', [
    [frequencyValue, labelHeight(frequencyValue)],
    [frequencyNote, labelHeight(frequencyNote)],
  ]);
  const miniPlot = axes({
    x: [-1, 1],
    y: [-1, 1],
    width: 340,
    height: 140,
    labels: false,
    grid: false,
    tips: false,
    color: 'dim',
  });
  const miniDots = coordinates.map((point, id) =>
    dot(9, id === tokenId ? 'red' : 'blue').at(...miniPlot.world(...point)),
  );
  const vectorNote = text('Compare the selected row\nwith the other rows.', {
    size: 32,
    color: 'dim',
    leading: 1.2,
  });
  const vectorEvidence = evidencePanel(1, 'Learned vectors', [
    [[miniPlot, ...miniDots], miniPlot.height],
    [vectorNote, labelHeight(vectorNote)],
  ]);
  const repeatPrompt = tile('prompt → ?', { size: 40, h: 78, color: 'yellow' });
  const repeatNote = text('Re-run with controls.', { size: 36, color: 'dim' });
  const repeatEvidence = evidencePanel(2, 'Repeatable behavior', [
    [repeatPrompt, 78],
    [repeatNote, labelHeight(repeatNote)],
  ]);
  const evidence = [frequencyEvidence, vectorEvidence, repeatEvidence];
  clock.on('e1', () =>
    handover(
      mechanism,
      fadeIn([diagnosticQuestion, evidenceHeading, ...evidence.flatMap((item) => item.base)]),
    ),
  );
  clock.after('e1', () => stage.play(fadeIn(frequencyEvidence.detail), { duration: 0.35 }));
  clock.after('e2', () => stage.play(fadeIn(vectorEvidence.detail), { duration: 0.35 }));
  // This is an instruction to check repeatability, not a completed experimental answer.
  clock.on('e3', () => stage.play(fadeIn(repeatEvidence.detail), { duration: 0.3 }));
  clearAtEnd(clock, [
    illustrationNote,
    diagnosticQuestion,
    evidenceHeading,
    ...evidence.flatMap((item) => item.all),
  ]);
}
