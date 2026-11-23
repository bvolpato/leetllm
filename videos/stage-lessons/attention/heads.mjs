import { fadeIn, fadeOut, rect, to } from 'vizmatic/stage';
import { buildHeads as drawHeadProjections } from '../../films/attention/stages/heads.mjs';
import { WORDS, f2, midMath, midMono, midProse } from '../../films/attention/defaults.mjs';
import { HEAD2, HEAD2_WEIGHTS } from '../../films/attention/model.mjs';

export function buildHeads(stage, narration, defaults) {
  const [previousWordMap, firstWordMap] = drawHeadProjections(stage, narration, defaults);
  const scene = narration.scene('heads');
  const question = midProse('Which output coordinate is larger?', 0, -335, 60);
  const sums = ['First', 'Second'].map((name, coordinate) => {
    const terms = HEAD2.V.map((value, i) => `${f2(HEAD2_WEIGHTS[i])} \\times ${value[coordinate]}`);
    return midMath(`\\text{${name}}\\quad ${terms.join(' + ')}`, coordinate === 0 ? -425 : 425, 374, 49);
  });
  scene.on('compare-coordinates', () => stage.play(fadeIn([question, ...sums]), { duration: 0.25 }));
  scene.after('larger-coordinate', () => {
    stage.remove(question);
    stage.play(to(sums[1], (n) => n.color('yellow')), { duration: 0.25 });
  });
  scene.after('lands-two', () => stage.remove(...sums));

  const n = 8;
  const grids = [[-800], Array.from({ length: 8 }, (_, h) => -650 + h * 104)];
  const pair = { query: 3, key: 5 };
  const cell = 96 / n;
  const marks = grids.flatMap((centers) =>
    centers.map((x) =>
      rect(cell * 0.86, cell * 0.86, { fill: 'ink', stroke: null }).at(
        x + (pair.key - (n - 1) / 2) * cell,
        300 + (pair.query - (n - 1) / 2) * cell,
      ),
    ),
  );
  const pairText = midMono('One query × one key', -407, 427, 49, 'ink');
  const totals = grids.map((centers, i) =>
    midMono(
      `${n * n * centers.length} scores`,
      i === 0 ? -757 : -260,
      427,
      48,
      i === 0 ? 'yellow' : 'pink',
    ),
  );
  scene.on('follow-pair', () => stage.play(fadeIn([pairText, ...marks]), { duration: 0.4 }));
  scene.after('count-grid', () => {
    stage.play(fadeOut(pairText), { duration: 0.2 });
    stage.play(fadeIn(totals), { duration: 0.35 });
  });
  scene.on('what-learn', () => stage.play(fadeOut([...marks, ...totals]), { duration: 0.14 }));

  const garden = WORDS.indexOf('garden');
  const sing = WORDS.indexOf('sing');
  const maps = [
    { grid: previousWordMap, color: 'yellow', key: (query) => query - 1 },
    { grid: firstWordMap, color: 'pink', key: () => 0 },
  ];
  const focus = maps.map(({ grid, color, key }) => {
    const cellCenter = (query) => grid.children[query * WORDS.length + key(query)].center;
    const mark = rect(68, 68, { radius: 5, fill: null, stroke: 'ink', width: 6 }).at(cellCenter(garden));
    const label = (query) => midProse(
      `${WORDS[query]} → ${WORDS[key(query)]}`, grid.center[0], 403, 54, color,
    );
    return { mark, next: cellCenter(sing), garden: label(garden), sing: label(sing) };
  });
  scene.on('previous-word', () => stage.play(fadeIn([focus[0].mark, focus[0].garden]), { duration: 0.24 }));
  scene.on('first-word', () => stage.play(fadeIn([focus[1].mark, focus[1].garden]), { duration: 0.24 }));
  scene.on('next-row', () => {
    stage.remove(...focus.map((f) => f.garden));
    stage.play(...focus.map((f) => to(f.mark, (node) => node.at(f.next))), { duration: 0.5 });
  });
  scene.after('left-read', () => stage.play(fadeIn(focus[0].sing), { duration: 0.22 }));
  scene.after('right-read', () => stage.play(fadeIn(focus[1].sing), { duration: 0.22 }));
  const newInput = midProse('Next input', -683, 403, 46, 'dim');
  const newSentence = midProse('At dawn birds sing.', -147, 403, 66);
  scene.on('move-subject', () => {
    stage.remove(...focus.map((f) => f.sing));
    stage.play(fadeIn([newInput, newSentence]), { duration: 0.3 });
  });
  defaults.leave(scene, [...focus.map((f) => f.mark), newInput, newSentence]);
}
