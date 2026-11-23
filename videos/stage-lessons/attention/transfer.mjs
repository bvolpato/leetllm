import assert from 'node:assert/strict';
import {
  arrow,
  draw,
  dynamic,
  fadeIn,
  fadeOut,
  group,
  line,
  rect,
  smoother,
  to,
} from 'vizmatic/stage';
import { sceneHeading } from '../kit.mjs';
import { bmatrix, f2, midMath, midMono, midProse, mono, pct, prose } from '../../films/attention/defaults.mjs';
import {
  blendOf,
  K,
  NEW_OUTPUT,
  NEW_QUERY,
  NEW_SCORES,
  NEW_STATE,
  NEW_WEIGHTS,
  Q,
  ROOT,
  SCORES,
  V,
  WEIGHTS,
} from '../../films/attention/model.mjs';

const colors = ['blue', 'teal'];
const names = ['Birds', 'sing'];
const vector = (v) => `[${v.join(', ')}]`;
const editedBirds = [V[0][0], 3];
const editedOutput = blendOf(NEW_WEIGHTS, [editedBirds, V[1]]);
assert.deepEqual(editedOutput.map(f2), ['1.30', '2.30']);
assert.equal(editedOutput[0], NEW_OUTPUT[0]);
const secondChange = editedOutput[1] - NEW_OUTPUT[1];
assert.equal(f2(secondChange), '0.60');

function coordinateSums(stage) {
  const edit = stage.value(0);
  const built = stage.value(0);
  const mix = () => [[V[0][0], V[0][1] + edit.value * (editedBirds[1] - V[0][1])], V[1]];
  const baseline = 290;
  const unit = 190;
  const x = [208, 635];
  const staticNodes = [
    midProse('Sources for this read', -522, -345, 59),
    midProse('Output coordinates', 417, -345, 59),
    midProse('Share', -517, -186, 48, 'dim'),
    midProse('Value', -241, -186, 48, 'dim'),
    ...names.flatMap((name, i) => [
      prose(name, -855, -65 + i * 126, 61, colors[i]),
      midMono(pct(NEW_WEIGHTS[i]), -517, -65 + i * 126, 53, colors[i]),
    ]),
    ...['First', 'Second'].map((label, j) => midProse(label, x[j], 349, 51)),
    ...[0, 1, 2, 3].flatMap((tick) => [
      line([51, baseline - tick * unit], [792, baseline - tick * unit], {
        stroke: 'faint',
        width: 2,
      }),
      midMono(String(tick), 15, baseline - tick * unit, 35, 'dim'),
    ]),
  ];
  const values = dynamic(() =>
    mix().map((v, i) =>
      midMono(vector(v.map((n) => Number(n.toFixed(2)))), -241, -65 + i * 126, 49, colors[i]),
    ),
  );
  const stacks = dynamic(() => {
    const v = mix();
    return x.flatMap((center, j) => {
      let base = baseline;
      return names.flatMap((_, i) => {
        const amount = NEW_WEIGHTS[i] * v[i][j];
        const height = unit * amount * built.value;
        if (height < 0.1) return [];
        const y = base - height / 2;
        base -= height;
        const piece = rect(229, height, { fill: colors[i], stroke: null }).at(center, y);
        return built.value >= 0.999 ? [piece, midMono(f2(amount), center, y, 40, 'bg')] : [piece];
      });
    });
  });
  const totalLabel = (label, height, j) =>
    group(rect(202, 72, { fill: 'bg', stroke: null }), midMono(label, 0, 0, 66, 'yellow')).at(
      x[j],
      baseline - unit * height - 48,
    );
  const pendingTotals = NEW_OUTPUT.map((n, j) => totalLabel('?', n, j));
  const totals = dynamic(() => blendOf(NEW_WEIGHTS, mix()).map((n, j) => totalLabel(f2(n), n, j)));
  const terms = dynamic(() => {
    const v = mix();
    return [0, 1].map((j) =>
      mono(
        `${f2(NEW_WEIGHTS[0])} × ${Number(v[0][j].toFixed(2))} + ${f2(NEW_WEIGHTS[1])} × ${v[1][j]}`,
        -680,
        229 + j * 77,
        42,
      ),
    );
  });
  const coordinateLabels = ['First', 'Second'].map((label, j) =>
    prose(label, -862, 229 + j * 77, 39, 'dim'),
  );
  const parts = [...staticNodes, values, stacks, ...coordinateLabels, terms, totals];
  return {
    staticNodes,
    values,
    stacks,
    pendingTotals,
    totals,
    parts,
    terms,
    coordinateLabels,
    built,
    edit,
    baseline,
    unit,
  };
}

export function buildYourTurn(stage, narration) {
  const scene = narration.scene('your-turn');
  sceneHeading(stage, scene, narration.title('your-turn'));
  const x = [-118, 535];
  const atSource = (values, y, size = 53) =>
    values.map((value, i) => midMono(value, x[i], y, size, colors[i]));
  const row = (title, values, y, size) => [
    prose(title, -849, y, 48, 'dim'),
    ...atSource(values, y, size),
  ];
  const columns = names.map((n, i) => midProse(n, x[i], -205, 65, colors[i]));
  const keys = row('Key', K.map(vector), -115);
  const oldScores = row('Old dot product', SCORES[1].map(f2), -27);
  const oldShares = row('Old share', WEIGHTS[1].map(pct), 65);
  const oldReader = midMono(`Previous query  ${vector(Q[1])}`, 0, -344, 54);
  const queryLabel = midProse('New query', -698, -344, 59);
  const projection = midMath(`[${NEW_STATE.join(',\\ ')}] \\, ${bmatrix(Q)} =`, -69, -344, 66);
  const pending = midMono('[?, ?]', 541, -344, 58, 'yellow');
  const query = midMono(vector(NEW_QUERY), 541, -344, 58, 'yellow');
  const products = row(
    'New dot product',
    K.map((k) => `${NEW_QUERY[0]}×${k[0]} + ${NEW_QUERY[1]}×${k[1]}`),
    171,
    43,
  );
  const raw = atSource(
    NEW_SCORES.map((s) => `= ${f2(s)}`),
    250,
  );
  const question = midProse('Which source gains share?', 0, 404, 67, 'yellow');
  const gapOrigin = 70;
  const gapAxis = line([gapOrigin, 312], [gapOrigin, 469], { stroke: 'dim', width: 3 });
  const gaps = [SCORES[1], NEW_SCORES].map(([birds, sing], i) => {
    const y = 350 + i * 85;
    const gap = sing - birds;
    const end = gapOrigin + 410 * gap;
    return {
      operands: [
        prose(i === 0 ? 'Old lead' : 'New lead', -849, y, 48, 'dim'),
        midMono(`${f2(sing)} − ${f2(birds)}`, -245, y, 48),
      ],
      bar: line([gapOrigin, y], [end, y], { stroke: 'teal', width: 15 }),
      amount: mono(f2(gap), end + 30, y, 51, 'teal'),
    };
  });
  const gapSetup = [gapAxis, ...gaps.flatMap((gap) => gap.operands)];
  const scaled = row(
    'Divide by √2',
    NEW_SCORES.map((s) => f2(s / ROOT)),
    250,
  );
  const shares = row('New share', NEW_WEIGHTS.map(pct), 365, 65);
  const verdict = midProse('Sing gains.', x[1], 451, 50, colors[1]);
  scene.at(0.08, () =>
    stage.play(fadeIn([oldReader, ...columns, ...keys, ...oldScores, ...oldShares]), {
      duration: 0.36,
    }),
  );
  scene.after('reader', () => {
    stage.play(fadeOut(oldReader), { duration: 0.18 });
    stage.play(fadeIn([queryLabel, projection, pending]), { duration: 0.3 });
  });
  scene.after('new-query', () => {
    stage.play(fadeOut(pending), { duration: 0.12 });
    stage.play(fadeIn([query, ...products]), { duration: 0.23 });
  });
  scene.on('predict', () => stage.play(fadeIn(question), { duration: 0.3 }));
  scene.on('score-it', () => stage.play(fadeOut(question), { duration: 0.25 }));
  scene.after('birds-score', () => stage.play(fadeIn(raw[0]), { duration: 0.28 }));
  scene.after('sing-score', () => stage.play(fadeIn(raw[1]), { duration: 0.28 }));
  scene.on('compare-leads', () => stage.play(fadeIn(gapSetup), { duration: 0.3 }));
  for (const [i, cue] of ['old-lead', 'new-lead'].entries()) {
    const { bar, amount } = gaps[i];
    scene.after(cue, () => stage.play(draw(bar), fadeIn(amount), { duration: 0.35 }));
  }
  scene.after('scale', () => {
    stage.play(fadeOut([...raw, ...gapSetup, ...gaps.flatMap((gap) => [gap.bar, gap.amount])]), {
      duration: 0.24,
    });
    stage.play(fadeIn(scaled), { duration: 0.35 });
  });
  scene.after('new-shares', () => stage.play(fadeIn(shares), { duration: 0.35 }));
  scene.after('gains', () => stage.play(fadeIn(verdict), { duration: 0.25 }));
  const read = coordinateSums(stage);
  scene.on('mix', () => {
    stage.play(
      fadeOut([
        ...columns,
        ...keys,
        ...oldScores,
        ...oldShares,
        queryLabel,
        projection,
        query,
        ...products,
        ...scaled,
        ...shares,
        verdict,
      ]),
      { duration: 0.25 },
    );
    stage.play(fadeIn([...read.staticNodes, read.values]), { duration: 0.35 });
  });
  scene.on('stack', () =>
    stage.play(fadeIn([read.terms, ...read.coordinateLabels]), { duration: 0.3 }),
  );
  scene.after('stack', () =>
    stage.play(fadeIn(read.stacks), read.built.to(1), { duration: 0.85 }),
  );
  scene.on('predict-sums', () => stage.play(fadeIn(read.pendingTotals), { duration: 0.22 }));
  scene.after('sum', () => {
    stage.play(fadeOut(read.pendingTotals), { duration: 0.1 });
    stage.play(fadeIn(read.totals), { duration: 0.2 });
  });
  return read;
}

// Four crops of the same little bird. The eye and the branch land in different patches.
function birdPatches() {
  const pixels = [
    '............',
    '.......BB...',
    '......BBBB..',
    '......B.BBO.',
    '.....BBBB...',
    '..BBBBBBB...',
    '...BTTTBB...',
    '....TTTB....',
    '.....OO.....',
    '..WWWWWWWW..',
    'WW........WW',
    '............',
  ];
  const palette = { B: 'blue', T: 'teal', O: 'orange', W: 'dim' };
  const cell = 35;
  return Array.from({ length: 4 }, (_, patch) => {
    const col = patch % 2,
      row = Math.floor(patch / 2);
    const cells = [rect(cell * 6, cell * 6, { fill: 'surface', stroke: null })];
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        const fill = palette[pixels[row * 6 + y][col * 6 + x]];
        if (fill)
          cells.push(
            rect(cell, cell, { fill, stroke: null }).at((x - 2.5) * cell, (y - 2.5) * cell),
          );
      }
    }
    return group(...cells).at(-105 + col * 210, -104 + row * 210);
  });
}

export function buildClose(stage, narration, { leave }, read) {
  const scene = narration.scene('close');
  const heading = sceneHeading(stage, scene, narration.title('close'));
  const pending = midMono('Birds   [2, 1]  →  [2, 3]', -470, 230, 46, 'blue');
  const question = midProse('Which output number changes, and by how much?', 0, 437, 63, 'yellow');
  scene.on('edit', () => {
    stage.play(fadeOut([read.terms, ...read.coordinateLabels]), { duration: 0.22 });
    stage.play(fadeIn(pending), { duration: 0.34 });
  });
  scene.on('predict-edit', () => stage.play(fadeIn(question), { duration: 0.3 }));
  const level = read.baseline - read.unit * NEW_OUTPUT[1];
  const oldLevel = line([757, level], [865, level], { stroke: 'yellow', width: 3, dash: [7, 6] });
  const oldTag = midProse('before', 816, level + 44, 36, 'dim');
  const delta = midMono(`0.30 × (3 − 1) ≈ +${f2(secondChange)}`, -480, 316, 43, 'yellow');
  scene.after('answer', () => {
    stage.play(fadeOut(question), { duration: 0.2 });
    stage.play(fadeIn([oldLevel, oldTag]), read.edit.to(1), { duration: 1.15, ease: smoother });
    stage.play(fadeIn(delta), { duration: 0.28 });
  });
  const patches = birdPatches();
  const frame = midProse('One image', 0, 330, 59);
  const tokenX = [-630, -210, 210, 630];
  const patchNames = ['top left', 'top right', 'bottom left', 'bottom right'].map((n, i) =>
    midProse(n, tokenX[i], 201, 50),
  );
  const tap = tokenX[0] - 60;
  const stem = line([tap, -78], [tap, -230], { stroke: 'yellow', width: 5 });
  const bus = line([tap, -230], [tokenX[3], -230], { stroke: 'yellow', width: 5 });
  const reads = tokenX.map((x) =>
    arrow([x, -230], [x, -89], { stroke: 'yellow', width: 5, tip: 23 }),
  );
  const reader = midProse('Query', tap, -301, 59, 'yellow');
  const next = midProse('Which patches may the top left patch read?', 0, 371, 61);
  const all = midProse('All four patches', 0, 371, 64, 'yellow');
  scene.on('image', () => {
    stage.play(
      fadeOut([
        heading,
        ...read.staticNodes,
        read.values,
        read.stacks,
        read.totals,
        oldLevel,
        oldTag,
        pending,
        delta,
      ]),
      { duration: 0.25 },
    );
    stage.play(fadeIn([...patches, frame]), { duration: 0.35 });
  });
  scene.on('cut', () => {
    stage.play(fadeOut(frame), { duration: 0.18 });
    stage.play(...patches.map((p, i) => to(p, (n) => n.at(tokenX[i], 28))), {
      duration: 0.7,
      ease: smoother,
    });
    stage.play(fadeIn(patchNames), { duration: 0.3 });
  });
  scene.on('patch-query', () => stage.play(draw(stem), fadeIn([reader, next]), { duration: 0.35 }));
  scene.after('all-patches', () => {
    stage.play(fadeOut(next), { duration: 0.18 });
    stage.play(draw(bus), { duration: 0.35 });
    stage.play(...reads.map((read) => draw(read)), fadeIn(all), { duration: 0.45 });
  });
  leave(scene, [...patches, ...patchNames, stem, bus, ...reads, reader, all]);
}
