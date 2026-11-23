import { fade, fadeIn, Node, rect, write } from 'vizmatic/stage';
import { LAYERS, HEADS } from '../model.mjs';
export function buildPagedAndFlash(
  stage,
  shrink,
  { T, M, place, fadeOut, arrive, handoff, PREVIEW },
  { layers, heads, zoomHold, stack },
  { heading2, heading3 },
  { gpuParts },
) {
  // Two names, two jobs. Each card shows what its idea changes.
  const miniOwners = [
    null,
    'blue',
    null,
    'orange',
    null,
    null,
    'blue',
    null,
    'green',
    null,
    null,
    'orange',
    null,
    'green',
    null,
    null,
  ];
  const nameCards = [
    ['Paged attention', 'Decides where the cache lives', 'blue', -440],
    ['Flash attention', 'A kernel that moves less data', 'yellow', 440],
  ].map(([name, job, color, x], c) => {
    const node = new Node();
    node.add(
      T(job, {
        size: 52,
        color: 'ink',
      }).at(0, -90),
    );
    if (c === 0)
      miniOwners.forEach((owner, i) =>
        node.add(
          rect(82, 82, {
            radius: 8,
            fill: owner ?? 'bg',
            stroke: owner ? null : 'dim',
            width: 2,
          }).at(-273 + (i % 8) * 78, 50 + Math.floor(i / 8) * 90),
        ),
      );
    else {
      node.add(
        place(
          M('data moved', {
            size: 40,
            color: 'dim',
          }),
          -340,
          10,
        ),
      );
      node.add(
        rect(660, 62, {
          radius: 8,
          fill: 'faint',
          stroke: null,
        }).at(-10, 80),
        place(
          M('standard kernel', {
            size: 38,
            color: 'ink',
          }),
          -324,
          80,
        ),
        rect(280, 62, {
          radius: 8,
          fill: 'yellow',
          stroke: null,
        }).at(-200, 170),
        place(
          M('Flash', {
            size: 38,
            color: 'bg',
          }),
          -324,
          170,
        ),
      );
      node.add(
        place(
          M('illustrative', {
            size: 38,
            color: 'dim',
          }),
          -340,
          240,
        ),
      );
    }
    return node.at(x, -70);
  });
  const cardFrames = [
    ['blue', -440],
    ['yellow', 440],
  ].map(([color, x]) =>
    rect(820, 560, {
      radius: 22,
      fill: 'surface',
      stroke: color,
      width: 4,
    }).at(x, -70),
  );
  // Both names show from the first word, because the voice is about to keep them apart.
  const cardTitles = [
    ['Paged attention', 'blue', -440],
    ['Flash attention', 'yellow', 440],
  ].map(([name, color, x]) =>
    T(name, {
      size: 84,
      color,
      italic: true,
    })
      .at(x, -260)
      .opacity(PREVIEW),
  );
  const bothUsed = T('Serving stacks often use both, or close variants.', {
    size: 62,
    color: 'ink',
  }).at(0, 300 + 110);
  shrink.on('names', () =>
    handoff([...gpuParts, heading2], () =>
      arrive(write(heading3), fadeIn(cardFrames), fadeIn(cardTitles), {
        duration: 0.5,
      }),
    ),
  );
  shrink.on('paged', () =>
    stage.play(
      fade(cardTitles[0], 1),
      fadeIn(nameCards[0], {
        scale: 0.94,
      }),
      {
        duration: 0.5,
      },
    ),
  );
  shrink.on('flash', () =>
    stage.play(
      fade(cardTitles[1], 1),
      fadeIn(nameCards[1], {
        scale: 0.94,
      }),
      {
        duration: 0.5,
      },
    ),
  );
  shrink.on('both', () =>
    stage.play(
      fadeIn(bothUsed, {
        shift: [0, 8],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  stage.at(shrink.end - 0.55, () =>
    stage.play(fadeOut([...cardFrames, ...cardTitles, ...nameCards, bothUsed, heading3]), {
      duration: 0.5,
    }),
  );
  stage.at(shrink.end - 0.04, () =>
    stage.play(layers.to(LAYERS), heads.to(HEADS), zoomHold.to(0), stack.unit.to(150), {
      duration: 0.02,
    }),
  );
}
