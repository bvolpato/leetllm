import { readerView, uploadWorksheet } from '../upload.mjs';

export function drawSynthesis(ctx, scene, state, api) {
  const { C, focus } = api;
  if (state.beat === 2) {
    uploadWorksheet(ctx, api, {
      showImage: focus.visible('synthesis-image'),
      prompt: focus.visible('synthesis-predict'),
    });
    return;
  }
  const label = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
  const original = { id: 'D8', action: 'BLOCK' };
  const correction = { id: 'C8', corrects: original.id, action: 'ALLOW' };
  const doneCacheAnswer = focus.progress('synthesis-cache') === 1;
  const evicted = focus.progress('synthesis-evict') === 1;
  const fetched = evicted && focus.progress('synthesis-read') === 1;
  const displayedDecision = fetched ? correction : original;
  const visible = displayedDecision.action === 'ALLOW';
  focus.target('member-view', () =>
    readerView(ctx, api, {
      id: 'P17',
      revision: 8,
      kind: 'classroom',
      visible,
      status: visible ? 'Visible to members' : 'Hidden on reload',
    }),
  );
  focus.target('appeal-file', () => {
    label('Appeal record    /    P17 · revision 8 · scope S3', 860, 351, 37);
    api.line(ctx, 893, 445, 893, 582, C.blue, 4);
    api.circle(ctx, 893, 445, 10, C.blue);
    api.circle(ctx, 893, 582, 10, C.cyan);
    label(original.id + '     ' + original.action, 939, 456, 46);
    label('Original decision', 939, 501, 29, C.muted);
    label(correction.id + '     ' + correction.action, 939, 591, 46);
    label('Corrects ' + correction.corrects + ' after new evidence', 939, 640, 29, C.muted);
  });
  focus.target('read-path', () => {
    const id = fetched ? correction.id : evicted ? null : original.id;
    const source = fetched ? 'Corrected record' : 'Exact decision cache';
    const read =
      !evicted && !doneCacheAnswer
        ? 'HIT    →    BLOCK'
        : id
          ? id + '   →   ' + displayedDecision.action
          : 'MISS   /   read current decision';
    api.rect(ctx, 860, 714, 927, 182, C.panel, fetched ? C.green : C.yellow, 10);
    label(source + '   /   same item, revision and scope', 891, 768, 29, C.muted);
    label(read, 891, 850, 46, fetched ? C.green : C.yellow);
  });
  if (state.beat === 0) label('Which saved decision is still hiding the handout?', 140, 991, 40);
  else if (fetched)
    label('One corrected read. Both decisions are still in the appeal record.', 140, 991, 34);
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: [
    'synthesis-file',
    'synthesis-ask',
    'synthesis-cache',
    'synthesis-evict',
    'synthesis-read',
    'synthesis-input',
    'synthesis-image',
    'synthesis-predict',
  ],
};
