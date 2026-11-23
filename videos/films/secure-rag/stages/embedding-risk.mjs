import { drawLine, drawRectangle, drawText } from '../defaults.mjs';
import { voice } from '../voice.mjs';

const publishedPercent = 92;

export function drawEmbeddingRisk(ctx, scene, state, api) {
  const c = api.C;
  const cue = voice(scene, state);
  const began = (id) => cue(id).phase !== 'before';
  const done = (id) => cue(id).phase === 'after';
  const label = (s, x, y, size, color = c.ink) => drawText(ctx, api, s, x, y, size, color);
  const box = (x, y, w, h, color) => drawRectangle(ctx, api, x, y, w, h, color);

  api.focus.target('backup', () => {
    label('Index backup', 135, 292, 44, c.blue);
    box(135, 335, 570, 360, c.blue);
    label('Example embeddings', 168, 405, 34);
    drawLine(ctx, api, 168, 434, 670, 434);
    ['[ 0.4,  −0.1,  … ]', '[ 0.7,    0.5,  … ]', '[ 0.2,  −0.8,  … ]'].forEach((vector, i) => {
      const y = 500 + i * 74;
      label('Page ' + (i + 1), 168, y, 31, c.muted);
      label(vector, 359, y, 36, c.blue);
    });
    if (began('embedding-protect')) {
      label('Restrict read and export access', 135, 820, 36, c.yellow);
      label('Index   /   Backup   /   Export API', 135, 889, 33);
    }
  });
  api.focus.target('study', () => {
    if (state.beat === 1) {
      label('Clinical notes', 850, 292, 44, c.blue);
      drawLine(ctx, api, 850, 334, 1785, 334);
      if (began('embedding-names')) {
        label('Inserted into the notes', 850, 452, 32, c.muted);
        label('Pseudonymous names', 850, 534, 51);
      }
      if (done('embedding-found')) {
        label('Recovered from the embeddings', 850, 667, 32, c.muted);
        label('Some of the inserted names', 850, 749, 50, c.yellow);
      }
      return;
    }

    label('Word-for-word recovery', 850, 292, 44);
    drawLine(ctx, api, 850, 334, 1785, 334);
    if (began('embedding-study')) {
      label('Vec2Text   /   GTR   /   Wikipedia', 850, 420, 34, c.blue);
      label('32 tokens per passage', 850, 490, 40);
    }
    if (began('embedding-fraction')) label('Exact matches ÷ passages tested × 100', 850, 630, 34);
    if (began('embedding-rate')) {
      const progress = api.ease(cue('embedding-rate').progress);
      drawLine(ctx, api, 855, 726, 1735, 726, c.muted);
      api.line(ctx, 855, 726, 855 + ((880 * publishedPercent) / 100) * progress, 726, c.blue, 17);
      if (done('embedding-rate')) label(publishedPercent + '% exact matches', 850, 821, 51, c.blue);
    }
    if (done('embedding-length')) label('Lower rate for longer passages', 850, 926, 36);
  });
}

export default {
  id: 'embedding-risk',
  draw: drawEmbeddingRisk,
  cues: [
    'embedding-backup',
    'embedding-study',
    'embedding-fraction',
    'embedding-rate',
    'embedding-length',
    'embedding-names',
    'embedding-found',
    'embedding-protect',
  ],
};
