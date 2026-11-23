import { Node, arrow, fadeIn, rect, text, tex, to } from 'vizmatic/stage';
import { paperFigure } from '../../../lib/paper-figure.mjs';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import { brief, fadeOut, LINEAR } from '../defaults.mjs';
import { SCORES, SCALED, WEIGHTS, OUTPUT, HEAD2_WEIGHTS, HEAD2_OUTPUT } from '../model.mjs';
import { paperAsset, equationHighlights, figureHighlights } from '../paper-assets.mjs';

const roundedRow = (values) => `[${values.map((value) => value.toFixed(2)).join(', ')}]`;

/** A numerical recap of the already-earned sing row, rather than a new prediction answer. */
function computedRow() {
  const root = new Node();
  const labels = ['dot products', 'scaled', 'shares', 'mixture'];
  const rows = [SCORES[1], SCALED[1], WEIGHTS[1], OUTPUT[1]];
  const colors = ['yellow', 'orange', 'teal', 'green'];
  const boxes = [];
  [-630, -210, 210, 630].forEach((x, i) => {
    const box = rect(360, 190, {
      radius: 14,
      fill: 'surface',
      stroke: colors[i],
      width: 2,
    }).at(x, 270);
    boxes.push(box);
    root.add(
      box,
      text(labels[i], { font: 'text-serif', size: 42, color: colors[i] }).at(x, 222),
      text(roundedRow(rows[i]), { font: 'mono', size: 43, color: colors[i] }).at(x, 294),
    );
  });
  root.add(
    text('Our computed sing row', { font: 'text-serif', size: 38, color: 'dim' }).at(0, 132),
    ...[-420, 0, 420].map((x) =>
      arrow([x - 20, 270], [x + 20, 270], { stroke: 'dim', width: 4, tip: 16 }),
    ),
  );
  return { root, boxes };
}

/** Source notation is a vector transcription of §3.2.2, not an additional paper crop. */
function headNotation(source) {
  const root = new Node();
  const inputs = [];
  root.add(
    text('One learned projection set per head', { font: 'text-serif', size: 48 }).at(0, -340),
  );
  ['Q', 'K', 'V'].forEach((name, i) => {
    const x = [-520, 0, 520][i];
    const input = tex(name, { size: 74, color: 'blue' }).at(x, -245);
    inputs.push(input);
    root.add(
      input,
      arrow([x, -195], [x, -166], { stroke: 'dim', width: 4, tip: 16 }),
      rect(280, 108, { radius: 12, fill: 'surface', stroke: 'yellow', width: 3 }).at(x, -106),
      tex(`W_i^{${name}}`, { size: 64, color: 'yellow' }).at(x, -106),
      arrow([x, -46], [x, -12], { stroke: 'dim', width: 4, tip: 16 }),
      tex(`${name}_i`, { size: 70, color: 'teal' }).at(x, 37),
    );
  });
  root.add(
    tex('\\mathrm{head}_i = \\mathrm{Attention}(Q_i,K_i,V_i)', { size: 68 }).at(0, 163),
    text(`Our head 1: ${roundedRow(WEIGHTS[1])} → ${roundedRow(OUTPUT[1])}`, {
      font: 'mono',
      size: 38,
      color: 'blue',
    }).at(0, 278),
    text(`Our head 2: ${roundedRow(HEAD2_WEIGHTS)} → ${roundedRow(HEAD2_OUTPUT)}`, {
      font: 'mono',
      size: 38,
      color: 'pink',
    }).at(0, 335),
    text(`${source.authors[0]} et al. (2017) · §3.2.2, p.5 · ${source.version}`, {
      size: 28,
      color: 'dim',
    }).at(0, 435),
  );
  return { root, inputs };
}

/** Read the original source through the score, share and mixture already built on screen. */
export function buildPaperReference(stage, narration, { wordNodes }) {
  const contextWords = [wordNodes[0], wordNodes[4]];
  const scene = narration.scene('paper-reference');
  sceneHeading(stage, scene, narration.title('paper-reference'));

  const titleAsset = paperAsset('attention-paper-title');
  const equationAsset = paperAsset('attention-paper-equation-1');
  const figureAsset = paperAsset('attention-paper-figure-2');
  // A 1.2 scale keeps the kit's source credit above 26 pixels at native resolution.
  const title = paperFigure(titleAsset.image, {
    source: titleAsset.entry.source,
    width: 1250,
    height: 340,
    highlights: [
      { id: 'name', region: { x: 25, y: 35, width: 1645, height: 150 }, color: '#1555b8' },
    ],
  })
    .scale(1.2)
    .at(0, -180);
  const equation = paperFigure(equationAsset.image, {
    source: equationAsset.entry.source,
    width: 1250,
    height: 350,
    highlights: equationHighlights,
  })
    .scale(1.2)
    .at(0, -175);
  const figure = paperFigure(figureAsset.image, {
    source: figureAsset.entry.source,
    width: 1140,
    height: 650,
    highlights: figureHighlights,
  })
    .scale(1.2)
    .at(0, 0);
  const recap = computedRow();
  const notation = headNotation(figureAsset.entry.source);
  const headCount = text('h: number of heads · our example: 2', {
    font: 'text-serif',
    size: 38,
    color: 'yellow',
  }).at(0, 440);
  const scope = text('Residual addition belongs to the surrounding Transformer block.', {
    font: 'text-serif',
    size: 38,
    color: 'pink',
  }).at(0, 440);
  const payoff = text('score → share → mix', { font: 'text-serif', size: 66, color: 'yellow' }).at(
    0,
    440,
  );

  const switchPicture = (outgoing, incoming) =>
    stage.play(
      brief(fadeOut(outgoing), 0.16, 0, LINEAR),
      brief(fadeIn(incoming), 0.24, 0.1, LINEAR),
    );
  let equationFocus = null;
  const focusEquation = (id) => {
    const next = equation.highlights[id];
    stage.play(
      ...(equationFocus ? [brief(fadeOut(equationFocus), 0.16)] : []),
      brief(fadeIn(next), 0.24),
    );
    equationFocus = next;
  };
  let figureFocus = null;
  const focusFigure = (id) => {
    const next = figure.highlights[id];
    stage.play(
      ...(figureFocus ? [brief(fadeOut(figureFocus), 0.08)] : []),
      brief(fadeIn(next), 0.24),
    );
    figureFocus = next;
  };

  scene.at(0.05, () => stage.play(fadeIn([title, recap.root, ...contextWords]), { duration: 0.4 }));
  scene.on('paper-title', () => stage.play(fadeIn(title.highlights.name), { duration: 0.3 }));
  scene.on('paper-equation', () => switchPicture(title, equation));
  scene.on('equation-query-key', () => focusEquation('query-key'));
  scene.on('equation-scale', () => focusEquation('scale'));
  scene.on('equation-softmax', () => focusEquation('softmax'));
  scene.on('equation-values', () => focusEquation('values'));
  scene.on('equation-toy-row', () =>
    stage.play(...recap.boxes.map((box) => to(box, (node) => node.stroke('teal', 4))), {
      duration: 0.35,
    }),
  );

  scene.on('figure-left', () => {
    switchPicture([equation, recap.root], figure);
    stage.at(stage.time, () => focusFigure('left'));
  });
  for (const id of ['scores', 'scale', 'mask', 'softmax', 'mix']) {
    scene.on(`figure-${id}`, () => focusFigure(id));
  }
  scene.on('figure-route-content', () => focusFigure('left'));
  scene.on('figure-projections', () => focusFigure('projections'));
  scene.on('figure-own-parameters', () =>
    stage.play(
      to(figure.highlights.projections, (node) => node.stroke('#8c5d00', 5)),
      { duration: 0.3 },
    ),
  );
  scene.on('figure-head-notation', () => switchPicture(figure, notation.root));
  scene.on('figure-input-notation', () =>
    stage.play(...notation.inputs.map((node) => to(node, (input) => input.color('yellow'))), {
      duration: 0.3,
    }),
  );
  scene.on('figure-head-core', () => {
    const start = stage.time;
    switchPicture(notation.root, figure);
    // The child cue starts with its parent's incoming fade, so ensureVisible cannot reopen it early.
    stage.at(start + 0.1, () => focusFigure('core'));
  });
  scene.on('figure-head-count', () => {
    focusFigure('head-count');
    stage.play(fadeIn(headCount), { duration: 0.3 });
  });
  scene.on('figure-concat', () => {
    stage.play(fadeOut(headCount), { duration: 0.18 });
    focusFigure('concat');
  });
  scene.on('figure-output', () => focusFigure('output'));
  scene.on('figure-scope', () => stage.play(fadeIn(scope), { duration: 0.3 }));
  scene.on('paper-payoff', () => switchPicture(scope, payoff));
  stage.at(scene.end - 0.55, () =>
    stage.play(fadeOut([figure, payoff, ...contextWords]), { duration: 0.5 }),
  );
}
