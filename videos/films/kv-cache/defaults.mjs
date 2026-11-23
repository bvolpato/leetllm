import {
  concat,
  dynamic,
  fade,
  fadeIn,
  fadeOut as fadeAway,
  Node,
  parametricSurface,
  rect,
  rectPath,
  smoother,
  text,
  thereAndBack,
  to,
} from 'vizmatic/stage';

/** A closed box with cell lines. `range` returns its current [[x0, x1], [y0, y1], [z0, z1]] each frame. */
function box(range, color, [cellsX, cellsY, cellsZ]) {
  const options = {
    color,
    mesh: 'bg',
    meshOpacity: 0.4,
    meshWidth: 1,
    animate: true,
  };
  const mix = (span, t) => span[0] + (span[1] - span[0]) * t;
  const face = (place, resolution) =>
    parametricSurface((u, v) => place(u, v, range()), [0, 1], [0, 1], {
      ...options,
      resolution,
    }).opacity(0);
  return [
    face((u, v, [x, y, z]) => [mix(x, u), y[0], mix(z, v)], [cellsX, cellsZ]),
    face((u, v, [x, y, z]) => [mix(x, u), y[1], mix(z, v)], [cellsX, cellsZ]),
    face((u, v, [x, y, z]) => [mix(x, u), mix(y, v), z[1]], [cellsX, cellsY]),
    face((u, v, [x, y, z]) => [mix(x, u), mix(y, v), z[0]], [cellsX, cellsY]),
    face((u, v, [x, y, z]) => [x[0], mix(y, u), mix(z, v)], [cellsY, cellsZ]),
    face((u, v, [x, y, z]) => [x[1], mix(y, u), mix(z, v)], [cellsY, cellsZ]),
  ];
}

/** Per-build transitions and camera helpers, bound to this film's Stage. */
export function createDefaults(stage) {
  const T = (content, options = {}) =>
    text(content, {
      font: 'text-serif',
      size: 60,
      ...options,
    });
  const M = (content, options = {}) =>
    text(content, {
      font: 'mono',
      size: 44,
      ...options,
    });
  const S = (content, options = {}) =>
    text(content, {
      size: 44,
      ...options,
    });
  const place = (node, x, y) => node.moveTo([0, y]).alignTo([x, 0], 'left');
  // s.play with its own duration stretches every animation to fill it. These keep their stated
  // length, so an old picture is gone before the new one is readable.
  const POP = (t) => 1 - (1 - t) ** 3,
    LINEAR = (t) => t;
  const brief = (anim, seconds, wait = 0, ease = POP) => ({
    ...anim,
    duration: wait + seconds,
    schedule: (ctx) =>
      anim.schedule({
        ...ctx,
        t0: ctx.t0 + wait,
        t1: ctx.t0 + wait + seconds,
        ease,
      }),
  });
  const fadeOut = (target, options = {}) =>
    options.duration === undefined
      ? fadeAway(target, options)
      : brief(fadeAway(target, options), options.duration);
  const crossfade = (from, into, wait = 0) => [
    brief(fadeAway(from), 0.14, wait),
    brief(
      fadeIn(into, {
        shift: [0, 6],
      }),
      0.24,
      wait + 0.1,
    ),
  ];
  const bar = (x, y, w, h, color, alpha = 0.92) =>
    rect(w, h, {
      radius: Math.min(8, h / 4),
      fill: color,
      stroke: null,
    })
      .opacity(alpha)
      .at(x + w / 2, y);
  const frameBar = (x, y, w, h, color = 'dim') =>
    rect(w, h, {
      radius: Math.min(8, h / 4),
      fill: 'surface',
      stroke: color,
      width: 2,
    }).at(x + w / 2, y);
  /** A bar that grows from its left edge. Returns the node and the animation that grows it. */
  const growBar = (x, y, w, h, color, alpha = 0.92) => {
    const amount = stage.value(0);
    const node = dynamic(() =>
      amount.value < 0.5
        ? null
        : rect(amount.value, h, {
            radius: Math.min(8, h / 4),
            fill: color,
            stroke: null,
          })
            .opacity(alpha)
            .at(x + amount.value / 2, y),
    );
    return {
      node,
      grow: (options = {}) =>
        amount.to(w, {
          duration: 1,
          ease: smoother,
          ...options,
        }),
    };
  };
  /** One block drawn as its token slots, with the filled ones colored, so tail waste is visible. */
  const slotBlock = (
    slots,
    filled,
    color,
    { w = 170, h = 170, columns = Math.ceil(Math.sqrt(slots)) } = {},
  ) => {
    const rows = Math.ceil(slots / columns),
      pad = 12,
      gap = 4;
    const cw = (w - pad * 2 - gap * (columns - 1)) / columns,
      ch = (h - pad * 2 - gap * (rows - 1)) / rows;
    const cell = (i) =>
      rectPath(
        -w / 2 + pad + (i % columns) * (cw + gap),
        -h / 2 + pad + Math.floor(i / columns) * (ch + gap),
        cw,
        ch,
        2,
      );
    const node = new Node();
    node.add(
      rect(w, h, {
        radius: 12,
        fill: 'surface',
        stroke: 'dim',
        width: 2,
      }),
    );
    const empty = Array.from(
      {
        length: slots - filled,
      },
      (_, i) => cell(filled + i),
    );
    if (empty.length) node.add(new Node(concat(...empty)).stroke('faint', 1.4));
    if (filled)
      node.add(
        new Node(
          concat(
            ...Array.from(
              {
                length: filled,
              },
              (_, i) => cell(i),
            ),
          ),
        ).fill(color, 0.95),
      );
    return node;
  };
  const clearScene = (scene, nodes) =>
    stage.at(scene.end - 0.45, () =>
      stage.play(fadeOut(nodes), {
        duration: 0.4,
      }),
    );
  // A heading must stay true for what is under it, so it changes when the picture stops matching it.
  // Each change is [cue, title]. The last heading clears with the scene.
  const headingOf = (title) =>
    text(title, {
      font: 'text-serif',
      size: 58,
    })
      .moveTo([0, -462])
      .alignTo([-850, 0], 'left')
      .pin();
  const retitle = (scene, first, changes) => {
    const nodes = changes.map(([, title]) => headingOf(title));
    changes.forEach(([cue], i) =>
      scene.on(cue, () =>
        stage.play(
          fadeOut(i ? nodes[i - 1] : first, {
            duration: 0.18,
          }),
          brief(fadeIn(nodes[i]), 0.28, 0.14),
          {
            duration: 0.42,
          },
        ),
      ),
    );
    stage.at(scene.end - 0.55, () =>
      stage.play(
        fade(nodes.at(-1), 0, {
          duration: 0.5,
        }),
      ),
    );
  };
  /** Clear one layout, then bring in the next. They overlap briefly, so the frame is never blank. */
  // A group with text inside grows and settles. A color pulse would flood its fill and hide the text.
  const pulse = (node, scale = 1.05) => ({
    ...to(node, (grown) => grown.scale(scale), {
      restore: true,
    }),
    ease: thereAndBack,
    duration: 0.7,
  });
  const arrive = (...items) => {
    const options = items.pop();
    stage.play(...items, {
      ...options,
      ease: POP,
    });
  };
  // When nothing stays on screen, the new layout starts just early enough that the frame never goes blank.
  // When something stays, clearFirst removes the old layout completely before the new one starts.
  const clearFirst = {
    out: 0.2,
    overlap: 0,
  };
  const handoff = (outgoing, build, { out = 0.2, overlap = 0.15, also = [] } = {}) => {
    const start = stage.time;
    stage.at(start + out - overlap, build);
    stage.play(
      fadeOut(outgoing, {
        duration: out,
      }),
      ...also,
      {
        duration: out,
        ease: POP,
      },
    );
  };
  // Text waiting for its cue stays readable at this opacity: 3:1 or better on the background.
  const PREVIEW = 0.6;
  return {
    T,
    M,
    S,
    place,
    LINEAR,
    brief,
    fadeOut,
    crossfade,
    bar,
    frameBar,
    growBar,
    slotBlock,
    clearScene,
    headingOf,
    retitle,
    pulse,
    arrive,
    clearFirst,
    handoff,
    PREVIEW,
  };
}
export { box };
