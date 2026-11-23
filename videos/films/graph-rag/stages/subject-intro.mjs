import { line, text } from '../defaults.mjs';

const id = 'subject-intro';

function silhouette(ctx, api, corners, fill) {
  api.path(
    ctx,
    corners.map(([x, y]) => ({ x, y })),
    { closed: true, fill, width: 0 },
  );
}

export function drawSubjectIntro(ctx, scene, state, api) {
  const { C } = api;
  const cue = (name) => state.cues?.[id + '-' + name];
  const progress = (name) => cue(name)?.progress ?? 0;
  const open = progress('open');
  const named = cue('publisher')?.phase === 'after';
  const write = (s, x, y, size, color, align) => text(ctx, api, id, s, x, y, size, color, align);

  api.focus.target(id + '-author', () => {
    api.rect(ctx, 100, 354, 547, 398, C.ink, undefined, 12);
    api.circle(ctx, 142, 396, 11, C.bg);
    write('A   /   Author card', 182, 410, 32, C.panel);
    line(ctx, api, 132, 445, 615, 445, C.muted, 2);
    write('Lena wrote', 137, 518, 44, C.bg);
    api.text(ctx, 'River Walk.', 137, 593, 65, C.bg, 'left', 'serif');
    line(ctx, api, 132, 627, 615, 627, C.muted, 2);
    write('Work ID', 137, 704, 30, C.panel);
    write('book:river', 268, 705, 41, C.bg);
  });

  api.focus.target(id + '-book', () => {
    // The page block stays in place while the cover turns toward its spine.
    api.rect(ctx, 804, 235, 424, 477, C.blue, undefined, 10);
    api.rect(ctx, 816, 245, 403, 456, C.ink, undefined, 7);
    for (const y of [684, 690, 696]) line(ctx, api, 839, y, 1211, y, C.muted, 1.5);
    if (open < 1) {
      ctx.save();
      ctx.translate(797, 0);
      ctx.scale(Math.max(0.002, 1 - open), 1);
      api.rect(ctx, 0, 220, 425, 463, C.blue, undefined, 10);
      api.rect(ctx, 16, 220, 11, 463, C.panel);
      if (open < 0.65) api.text(ctx, 'River Walk', 53, 344, 65, C.bg, 'left', 'serif');
      api.circle(ctx, 323, 424, 44, C.yellow);
      silhouette(
        ctx,
        api,
        [
          [34, 518],
          [139, 434],
          [205, 482],
          [269, 445],
          [407, 500],
          [407, 659],
          [34, 659],
        ],
        C.panel,
      );
      silhouette(
        ctx,
        api,
        [
          [203, 493],
          [248, 517],
          [190, 550],
          [290, 591],
          [203, 659],
          [92, 659],
          [225, 594],
          [148, 550],
          [225, 518],
        ],
        C.cyan,
      );
      ctx.restore();
    }
    if (open >= 1) {
      write('Book record', 850, 332, 32, C.panel);
      api.text(ctx, 'River Walk', 849, 420, 59, C.bg, 'left', 'serif');
      line(ctx, api, 850, 457, 1177, 457, C.muted, 2);
      write('Publisher', 850, 518, 31, C.panel);
      if (named) api.text(ctx, 'Willow Press', 850, 596, 56, C.bg, 'left', 'serif');
    }
    write('B   /   Book', 1011, 771, 32, C.blue, 'center');
    write('book:river', 1011, 834, 46, C.ink, 'center');
  });

  api.focus.target(id + '-park', () => {
    api.rect(ctx, 1544, 413, 34, 297, C.muted);
    silhouette(
      ctx,
      api,
      [
        [1334, 352],
        [1720, 352],
        [1816, 449],
        [1720, 546],
        [1334, 546],
      ],
      C.green,
    );
    write('PARK', 1380, 417, 31, C.panel);
    write('River Walk', 1380, 500, 56, C.bg);
    write('C   /   Place', 1560, 771, 32, C.green, 'center');
    write('place:river', 1560, 834, 46, C.ink, 'center');
  });

  if (progress('choose-book') > 0)
    api.focus.target(id + '-match', () => {
      const route = [
        [485, 692],
        [709, 692],
        [709, 816],
        [865, 816],
      ].map(([x, y]) => ({ x, y }));
      api.trace(ctx, route, progress('choose-book'), C.cyan, 6);
      if (progress('choose-book') === 1) api.arrow(ctx, 835, 816, 865, 816, C.cyan, 5);
    });
  api.focus.target(id + '-question', () => {
    const question = progress('which-record') > 0 && progress('choose-book') === 0;
    if (question) write('Which ID matches Lena’s card?', 960, 969, 44, C.yellow, 'center');
    if (named) write('Lena   →   River Walk   →   Willow Press', 960, 969, 44, C.ink, 'center');
  });
}

export default {
  id,
  draw: drawSubjectIntro,
  cues: ['book-entry', 'park-entry', 'which-record', 'choose-book', 'open', 'publisher'].map(
    (name) => id + '-' + name,
  ),
};
