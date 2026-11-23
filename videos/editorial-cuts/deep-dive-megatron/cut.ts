import { film, text, line, fadeIn, rect } from 'vizmatic/stage';
export default film(
  { title: 'Three interfaces in one training run', look: 'midnight', fps: 30 },
  (s) => {
    s.add(
      text('Where does each project enter a run?', { size: 76, font: 'text-serif' }).at(0, -370),
    );
    const layer = (x: number, y: number) =>
      rect(150, 100, { fill: 'surface', stroke: 'blue', width: 4 }).at(x, y);
    s.add(
      text('Megatron Core', { size: 53, color: 'blue' }).at(-555, -190),
      layer(-650, 0),
      layer(-475, 0),
      text('shard 0', { size: 35 }).at(-650, 0),
      text('shard 1', { size: 35 }).at(-475, 0),
      text('Parallel layer', { size: 41 }).at(-560, 130),
    );
    s.wait(5.3);
    s.play(
      fadeIn([
        line([-359, 0], [-190, 0], { stroke: 'gridStrong', width: 4 }),
        text('Megatron-LM', { size: 53, color: 'teal' }).at(0, -190),
        text('Training recipe', { size: 48 }).at(0, -20),
        text('uses Core layers', { size: 36, color: 'dim' }).at(0, 65),
      ]),
      { duration: 0.5 },
    );
    s.wait(4.2);
    s.play(
      fadeIn([
        text('Megatron Bridge', { size: 53, color: 'yellow' }).at(555, -190),
        text('Checkpoint A', { size: 42 }).at(555, -70),
        text('↕', { size: 58, color: 'yellow' }).at(555, 4),
        text('Checkpoint B', { size: 42 }).at(555, 80),
      ]),
      { duration: 0.5 },
    );
    s.wait(11.113);
  },
);
