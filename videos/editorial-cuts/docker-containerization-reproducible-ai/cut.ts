import { fadeIn, film, rect, text } from 'vizmatic/stage';

export default film({ title: 'The files arrived', look: 'midnight' }, (s) => {
  const word = (v: string, x: number, y: number, size = 44, color = 'ink') =>
    text(v, { font: 'mono', size, color }).at(x, y);
  s.add(text('Will the same command run here?', { font: 'text-serif', size: 84 }).at(0, -395));
  const folder = rect(800, 450, { radius: 20, fill: 'surface', stroke: 'blue', width: 4 }).at(
    -475,
    -35,
  );
  const machine = rect(840, 450, { radius: 20, fill: 'surface', stroke: 'dim', width: 4 }).at(
    470,
    -35,
  );
  s.add(
    folder,
    machine,
    word('access-rag/', -475, -191, 53, 'blue'),
    word('Second machine', 470, -191, 53),
  );
  s.add(
    word('scripts/score_access_requests.py', -475, -30, 35),
    word('eval/access_requests.jsonl', -475, 56, 35),
    word('$ python', 470, -31, 68),
  );
  const cursor = rect(32, 8, { fill: 'yellow', stroke: null }).at(650, 3);
  s.add(cursor);
  s.wait(9.9);
  s.play(fadeIn(word('command not found', 470, 90, 49, 'yellow')), { duration: 0.3 });
  s.wait(1.62);
  const base = rect(840, 87, { radius: 12, fill: 'surface', stroke: 'teal', width: 4 }).at(
    -475,
    243,
  );
  s.play(fadeIn(base), fadeIn(word('Python runtime', -475, 243, 48, 'teal')), { duration: 0.5 });
  s.wait(5.68);
});
