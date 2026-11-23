import { sceneCues } from '../picture.mjs';

export function drawCuratedData(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  api.focus.target('curated-data-mechanism', () => {
    if (state.beat === 0) {
      const copies = 10 - Math.round(9 * cue.progress('curated-data-b1'));
      const front = { x: 168, y: 482, width: 940, height: 270 };
      const stepX = 31;
      const stepY = 25;
      for (let i = copies - 1; i > 0; i--) {
        const left = front.x + i * stepX;
        const top = front.y - i * stepY;
        const right = left + front.width;
        const bottom = top + front.height;
        api.path(ctx, [
          { x: left, y: top + stepY },
          { x: left, y: top },
          { x: right, y: top },
          { x: right, y: bottom },
          { x: right - stepX, y: bottom },
          { x: right - stepX, y: top + stepY },
        ], { closed: true, fill: C.panel, color: C.blue, width: 2 });
      }
      api.rect(ctx, front.x, front.y, front.width, front.height, C.panel, C.blue, 8);
      api.text(ctx, 'Rotation policy', 220, 557, 39, C.cyan);
      api.text(ctx, 'A stale key qualifies for rotation', 220, 642, 46, C.ink);
      api.text(ctx, 'at thirty days.', 220, 705, 46, C.ink);
      api.text(ctx, String(copies), 1600, 580, 115, C.yellow, 'center');
      api.text(ctx, copies === 1 ? 'copy' : 'copies', 1600, 660, 41, C.ink, 'center');
      return;
    }
    api.text(ctx, 'CCNet', 180, 361, 63, C.cyan);
    api.text(ctx, 'Identify language with fastText', 180, 505, 40, C.ink);
    api.text(ctx, 'Score text by perplexity', 180, 625, 40, C.ink);
    api.text(ctx, 'Deduplicate paragraphs', 180, 745, 40, C.ink);
    if (cue.started('curated-data-b2')) {
      api.line(ctx, 956, 320, 956, 775, C.muted, 2);
      api.text(ctx, 'Original C4', 1060, 361, 63, C.blue);
      api.text(ctx, 'Select English text', 1060, 505, 40, C.ink);
      api.text(ctx, 'Apply cleaning rules', 1060, 625, 40, C.ink);
      api.text(ctx, 'Remove repeated 3-sentence spans', 1060, 745, 40, C.ink);
    }
  });
}

export default {
  id: 'curated-data',
  draw: drawCuratedData,
  cues: ['curated-data-b1', 'curated-data-b2'],
};
