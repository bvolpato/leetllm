import { spokenProgress } from '../construction.mjs';
import { FIXTURE } from '../observations.mjs';
import { rackPhoto } from '../defaults.mjs';

export function drawEvidence(ctx, api, { box = 0, tag = 0, review = false, ask = false }) {
  const { C } = api;
  const x = 170,
    y = 293,
    width = 755,
    height = 600;
  const areas = rackPhoto(ctx, api, x, y, width, height);
  const fieldX = 1050;
  api.text(ctx, 'Photo 17', fieldX, 354, 54, C.ink);
  api.text(
    ctx,
    review ? 'Review requested' : 'Search cosine   ' + FIXTURE.retrievalScores[0].toFixed(3),
    fieldX,
    436,
    37,
    review ? C.yellow : C.cyan,
  );

  const outline = (area, progress, color) => {
    if (!progress) return;
    const [u, v, w, h] = area;
    const a = x + u * width,
      b = y + v * height;
    const dx = w * width,
      dy = h * height;
    api.trace(
      ctx,
      [
        { x: a, y: b },
        { x: a + dx, y: b },
        { x: a + dx, y: b + dy },
        { x: a, y: b + dy },
        { x: a, y: b },
      ],
      progress,
      color,
      8,
    );
  };
  for (const [id, area, progress, color, label, value, labelY] of [
    [
      'vent',
      areas.vent,
      box,
      C.blue,
      'Vent box   (left, top, right, bottom)',
      [areas.vent[0], areas.vent[1], areas.vent[0] + areas.vent[2], areas.vent[1] + areas.vent[3]]
        .map((n) => n.toFixed(2))
        .join('   '),
      565,
    ],
    ['tag', areas.tag, tag, C.yellow, 'Asset tag', 'RACK-17', 786],
  ]) {
    api.focus.target('evidence-' + id, () => {
      outline(area, progress, color);
      api.text(ctx, label, fieldX, labelY, 31, C.muted);
      api.text(
        ctx,
        progress > 0.85 ? value : 'Awaiting evidence',
        fieldX,
        labelY + 79,
        43,
        progress > 0.85 ? color : C.muted,
      );
    });
  }
  api.text(
    ctx,
    ask
      ? 'Which evidence field can you fill from the search score alone?'
      : box > 0.85
        ? 'Box coordinates are fractions of the original photo.'
        : 'Search returns the whole photo.',
    960,
    986,
    33,
    C.muted,
    'center',
  );
}

export function drawBoundaries(ctx, scene, state, api) {
  drawEvidence(ctx, api, {
    ask: state.beat === 0,
    box: spokenProgress(state, 'boundary-box', 1),
    tag: spokenProgress(state, 'boundary-tag', 2),
  });
}

export default { id: 'boundaries', draw: drawBoundaries, cues: ['boundary-box', 'boundary-tag'] };
