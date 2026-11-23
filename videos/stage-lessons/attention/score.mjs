import { fadeIn } from 'vizmatic/stage';
import { buildScore as drawScoreGeometry } from '../../films/attention/stages/score.mjs';
import { f2, math } from '../../films/attention/defaults.mjs';
import { dot, K } from '../../films/attention/model.mjs';

export function buildScore(stage, narration, defaults, geometry) {
  drawScoreGeometry(stage, narration, defaults, geometry);
  const scene = narration.scene('score');
  const vector = (v) => `[${v.join(',\\ ')}]`;
  const query = math(`${vector(geometry.qs)} \\cdot`, geometry.COLUMN, 300, 72, 'yellow');
  const keyX = geometry.COLUMN + query.width + 14;
  const [birds, sing] = K.map((key, i) => {
    const label = (answer) => math(`${vector(key)} = ${answer}`, keyX, 300, 72, i ? 'teal' : 'blue');
    return { open: label('?'), solved: label(f2(dot(geometry.qs, key))) };
  });

  scene.on('birds-score', () => stage.play(fadeIn([query, birds.open]), { duration: 0.2 }));
  scene.after('birds-score', () => {
    stage.remove(birds.open);
    stage.add(birds.solved);
  });
  scene.on('try-sing', () => {
    stage.remove(birds.solved);
    stage.add(sing.open);
  });
  scene.after('sing-result', () => {
    stage.remove(sing.open);
    stage.add(sing.solved);
  });
  scene.on('not-zero', () => stage.remove(query, sing.solved));
}
