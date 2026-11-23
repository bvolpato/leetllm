import { kernelChapterFrame } from './construction.mjs';
export function rejectUnknownKernelChapter(ctx, scene, state, api) {
  kernelChapterFrame(scene.id, state);
  api.focus.target(scene.id + '-construction', () => {
    throw new Error('Unknown kernel teaching chapter ' + scene.id);
  });
}
