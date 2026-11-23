import { fadeIn, fadeOut, line, rect, smoother, to } from 'vizmatic/stage';
import { buildFlash as drawTiledAttention } from '../../films/attention/stages/flash.mjs';
import { midMono, midProse, prose } from '../../films/attention/defaults.mjs';
import { TRACE } from '../../films/attention/model.mjs';

export function buildFlash(stage, narration, defaults) {
  drawTiledAttention(stage, narration, defaults);
  const scene = narration.scene('flash');
  const [first, second] = TRACE.steps;
  const tiles = [
    { score: 999, value: 4 },
    { score: first.peak, value: 2 },
    { score: second.peak, value: 1 },
  ];
  const x = (score) => -280 + (score - tiles[0].score) * 493;
  const rule = line([x(999) - 73, 389], [x(1001) + 73, 389], { stroke: 'dim', width: 2 });
  const scoreName = prose('Score', -846, 341, 45, 'dim');
  const valueName = prose('Value', -846, 446, 45, 'dim');
  const ticks = tiles.map(({ score }) =>
    line([x(score), 375], [x(score), 403], { stroke: 'dim', width: 3 }),
  );
  const absolute = tiles.map(({ score }) => midMono(String(score), x(score), 337, 52));
  const values = tiles.map(({ score, value }) =>
    midMono(String(value), x(score), 446, 52, 'green'),
  );
  const maxRing = rect(183, 78, { radius: 10, stroke: 'yellow', width: 4 }).at(x(first.peak), 337);
  const reference = prose('Score − max', -846, 341, 46, 'yellow');
  const offsets = tiles.map(({ score }) =>
    midMono(String(score - second.peak).replace('-', '−'), x(score), 337, 55, 'yellow'),
  );
  const question = midProse('What rescales both sums?', -564, 190, 48, 'yellow');
  const term = rect(103, 6, { fill: 'green', stroke: null }).at(x(second.peak), 486);
  scene.after('paired-inputs', () =>
    stage.play(fadeIn([scoreName, valueName, rule, ...ticks, ...absolute, ...values, maxRing]), {
      duration: 0.36,
    }),
  );
  scene.on('carry-question', () => stage.play(fadeIn(question), { duration: 0.28 }));
  scene.on('rises', () =>
    stage.play(
      fadeOut(question),
      to(maxRing, (n) => n.at(x(second.peak), 337)),
      { duration: 0.7, ease: smoother },
    ),
  );
  scene.after('rises', () => {
    stage.play(fadeOut([scoreName, ...absolute]), { duration: 0.18 });
    stage.play(fadeIn([reference, ...offsets]), { duration: 0.25 });
  });
  scene.on('high-term', () => stage.play(fadeIn(term), { duration: 0.25 }));
  scene.on('low-term', () =>
    stage.play(
      to(term, (n) => n.at(x(999), 486)),
      { duration: 0.6, ease: smoother },
    ),
  );
  const numerator = second.weighted.toFixed(3);
  const divisorQuestion = midProse('Which divisor?', 0, 321, 55);
  const massLabel = midProse('Total mass', -420, 378, 48);
  const countLabel = midProse('Value count', 435, 378, 48);
  const byMass = midMono(`${numerator} ÷ ${second.sum.toFixed(3)}`, -420, 452, 67);
  const byCount = midMono(`${numerator} ÷ ${tiles.length}`, 435, 452, 67);
  scene.on('choose-divisor', () => {
    stage.play(fadeOut([reference, ...offsets, valueName, rule, maxRing, term, ...values, ...ticks]), {
      duration: 0.22,
    });
    stage.play(fadeIn([divisorQuestion, massLabel, byMass, countLabel, byCount]), { duration: 0.28 });
  });
  scene.after('use-mass', () =>
    stage.play(fadeOut([divisorQuestion, countLabel, byCount]), to(byMass, (n) => n.color('teal')), {
      duration: 0.28,
    }),
  );
  scene.after('divide-end', () => stage.remove(massLabel, byMass));
}
