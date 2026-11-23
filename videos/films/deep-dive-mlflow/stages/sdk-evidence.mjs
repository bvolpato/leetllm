import { mlflowSentenceProgress, sampleMlflowChapter } from '../construction.mjs';
import { chapterText, chip, flow, table } from '../defaults.mjs';
import { citationPass } from '../model.mjs';
export function drawSdkEvidence(ctx, scene, state, api) {
  const modelState = sampleMlflowChapter('sdk-evidence', state),
    currentBeat = modelState.b;
  const teaching2 = (beat, sentence) =>
    mlflowSentenceProgress('sdk-evidence', state, beat, sentence);
  {
    const { C } = api,
      id = 'sdk-evidence';
    {
      chapterText(
        ctx,
        api,
        'Local SDK lab   /   SQLite and local files',
        960,
        280,
        33,
        C.yellow,
        'center',
      );
      if (currentBeat === 0) {
        table(
          ctx,
          api,
          150,
          390,
          [400, 560, 650],
          [
            ['Stored evidence', 'Read back', 'What it establishes'],
            ['run / parameter', 'retrieval k = 40', 'persistence'],
            ['metric', 'supplied .81', 'value retained'],
            ['artifact', 'error-slice file', 'bytes retrieved'],
          ],
          [C.muted, C.blue, C.cyan, C.green],
        );
        const root = chip(ctx, api, 'Request trace', 300, 830, 650, C.blue),
          child = chip(ctx, api, 'Nested step', 1110, 830, 570, C.cyan);
        flow(ctx, api, root, child, teaching2(0, 2));
      } else if (currentBeat === 1) {
        const alias = chip(
          ctx,
          api,
          teaching2(1, 0) >= 1 ? 'Alias → v2' : 'Alias → v1',
          750,
          350,
          440,
          C.cyan,
          100,
        );
        const held = chip(ctx, api, 'Held object v1', 160, 600, 590, C.blue, 115),
          fresh = chip(
            ctx,
            api,
            teaching2(1, 0) >= 1 ? 'Fresh uncached object v2' : 'Fresh load pending',
            1120,
            600,
            650,
            C.green,
            115,
          );
        flow(ctx, api, alias, held, 0, C.muted);
        flow(ctx, api, alias, fresh, teaching2(1, 0));
        table(
          ctx,
          api,
          300,
          820,
          [550, 720],
          [
            ['Parameter', 'fixed 40'],
            ['Tag / temperature', 'mutable under same record'],
          ],
          [C.blue, C.cyan],
        );
      } else {
        const count = Math.min(3, Math.floor(teaching2(2, 1) * 3 + 1e-9));
        [[], ['DOC-99'], ['DOC-12']].forEach((citations, i) => {
          const value = citationPass(citations, ['DOC-12']);
          chip(ctx, api, '[' + citations.join(', ') + ']', 200 + i * 570, 410, 440, C.blue, 110);
          chip(
            ctx,
            api,
            i < count ? String(value) : 'await score',
            200 + i * 570,
            610,
            440,
            i < count ? (value ? C.green : C.pink) : C.muted,
            110,
          );
        });
        if (count === 3)
          chapterText(
            ctx,
            api,
            'One true / three scores · release blocked',
            960,
            880,
            37,
            C.pink,
            'center',
          );
      }
    }
  }
}
export default {
  id: 'sdk-evidence',
  draw: drawSdkEvidence,
  cues: [
    'mf-sdk-evidence-0',
    'mf-sentence-sdk-evidence-0-0',
    'mf-sentence-sdk-evidence-0-1',
    'mf-sentence-sdk-evidence-0-2',
    'mf-sentence-sdk-evidence-0-3',
    'mf-sdk-evidence-1',
    'mf-sentence-sdk-evidence-1-0',
    'mf-sentence-sdk-evidence-1-1',
    'mf-sentence-sdk-evidence-1-2',
    'mf-sentence-sdk-evidence-1-3',
    'mf-sdk-evidence-2',
    'mf-sentence-sdk-evidence-2-0',
    'mf-sentence-sdk-evidence-2-1',
    'mf-sentence-sdk-evidence-2-2',
    'mf-sentence-sdk-evidence-2-3',
  ],
};
