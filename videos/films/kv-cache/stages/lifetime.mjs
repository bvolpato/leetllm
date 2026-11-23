import { draw, dynamic, fade, fadeIn, lagged, line, linear, Node, rect } from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';

/** A block has a lifetime. */
export function buildLifetime(
  stage,
  narration,
  { T, M, S, place, fadeOut, pulse, arrive, clearFirst, handoff, PREVIEW },
  { TILE, poolAt, blockOf, cover, uncover, showPool, hidePool },
  { placeA, placeB, placeC },
) {
  const lifetime = narration.scene('lifetime');
  sceneHeading(stage, lifetime, narration.title('lifetime'));
  {
    const lifeA = placeA.map((index, logical) => blockOf(index, 'blue', `A${logical}`));
    const lifeB = placeB.map((index, logical) => blockOf(index, 'orange', `B${logical}`));
    const lifeC = blockOf(placeA[0], 'green', 'D0');
    // Finished but not yet free. The name stays readable, in light text on a dim fill.
    const waitingA = placeA.map((index, logical) => {
      const node = new Node();
      node.add(
        rect(TILE, TILE, {
          radius: 14,
          fill: 'blue',
          stroke: null,
        }).opacity(0.32),
        M(String(index), {
          size: 38,
          color: 'ink',
        }).at(-TILE / 2 + 34, -TILE / 2 + 34),
        S(`A${logical}`, {
          size: 76,
          color: 'ink',
          weight: 600,
        }).at(0, 2),
      );
      return node.at(...poolAt(index)).zIndex(2);
    });
    const lifeCell = (entry, i, color, y) => {
      const node = new Node();
      node.add(
        rect(150, 84, {
          radius: 10,
          fill: 'surface',
          stroke: color,
          width: 3,
        }).at(-730 + i * 166, y),
        M(String(entry), {
          size: 54,
          color,
        }).at(-730 + i * 166, y),
      );
      return node;
    };
    const lifeRow = (name, places, color, y) => {
      const node = new Node();
      node.add(
        M(name, {
          size: 64,
          color,
        }).moveTo([-850, y]),
      );
      places.forEach((entry, i) => node.add(lifeCell(entry, i, color, y)));
      return node;
    };
    const rowAName = M('A', {
        size: 64,
        color: 'blue',
      }).moveTo([-850, 190]),
      rowACells = placeA.map((entry, i) => lifeCell(entry, i, 'blue', 190)),
      rowA = [rowAName, ...rowACells];
    const rowB = lifeRow('B', placeB, 'orange', 300),
      rowC = lifeRow('D', [placeA[0]], 'green', 410);
    lifetime.at(0.05, () =>
      stage.play(...showPool([...placeA, ...placeB]), fadeIn([...lifeA, ...lifeB, ...rowA, rowB]), {
        duration: 0.4,
      }),
    );
    lifetime.on('come-back', () =>
      stage.play(
        lagged(
          lifeA.map((node) => pulse(node, 1.03)),
          {
            lag: 0.3,
          },
        ),
        {
          duration: 0.8,
        },
      ),
    );
    // A is finished, but the blocks are not free yet. They wait, dimmed, until they are safe to reuse.
    const doneTag = place(
      M('finished', {
        size: 46,
        color: 'blue',
      }),
      -420,
      190,
    );
    lifetime.on('finishes', () =>
      stage.play(
        ...lifeA.map((node) => fadeOut(node)),
        fadeIn(waitingA),
        ...rowA.map((node) => fade(node, PREVIEW)),
        fadeIn(doneTag),
        {
          duration: 0.6,
        },
      ),
    );
    const reuseTag = place(
      M('reuses 7: no reads left (example)', {
        size: 40,
        color: 'green',
      }),
      -420,
      410,
    );
    lifetime.on('new-uses', () => {
      stage.play(fadeOut(waitingA[0]), fadeOut(rowACells[0]), {
        duration: 0.35,
      });
      stage.play(
        fadeIn(lifeC, {
          scale: 0.7,
        }),
        fadeIn(rowC, {
          shift: [0, 10],
        }),
        fadeIn(reuseTag),
        {
          duration: 0.6,
        },
      );
    });
    const stillTag = place(
      M('never moves', {
        size: 46,
        color: 'orange',
      }),
      -420,
      300,
    );
    lifetime.on('no-move', () =>
      stage.play(...lifeB.map((node) => pulse(node, 1.05)), pulse(rowB, 1.03), fadeIn(stillTag), {
        duration: 0.8,
      }),
    );
    // The rule, drawn: a GPU read marker passes each job in flight, and the block frees at zero.
    const PANEL_X = 360,
      PANEL_Y = 300,
      READS = 3;
    const panel = rect(980, 360, {
      radius: 18,
      fill: 'surface',
      stroke: 'dim',
      width: 2.5,
    }).at(PANEL_X, PANEL_Y);
    const gpuTitle = place(
      S('GPU reads on block 2 (example)', {
        size: 46,
        color: 'yellow',
      }),
      -100,
      170,
    );
    const JOB_LEFT = -100,
      JOB_W = 280,
      JOB_STEP = 300;
    const jobs = Array.from(
      {
        length: READS,
      },
      (_, i) =>
        chip('read', {
          w: JOB_W,
          h: 92,
          color: 'yellow',
          size: 50,
        }).at(JOB_LEFT + JOB_W / 2 + i * JOB_STEP, 275),
    );
    const swept = stage.value(0);
    const gpuMarker = dynamic(() => {
      const x = JOB_LEFT + swept.value * (READS * JOB_STEP - 20),
        node = new Node();
      node.add(
        line([x, 200], [x, 224], {
          stroke: 'green',
          width: 7,
          glow: 8,
        }),
        line([x, 326], [x, 350], {
          stroke: 'green',
          width: 7,
          glow: 8,
        }),
      );
      return node;
    }).zIndex(2);
    const pendCount = dynamic(() =>
      M(`reads still in flight: ${Math.ceil(READS * (1 - swept.value) - 0.001)}`, {
        size: 60,
        color: swept.value >= 1 ? 'green' : 'yellow',
      }).at(PANEL_X, 410),
    );
    const pendRing = rect(TILE + 20, TILE + 20, {
      radius: 18,
      stroke: 'yellow',
      width: 7,
    })
      .at(...poolAt(placeA[1]))
      .glow(12)
      .zIndex(3);
    const pendTag = M('pending', {
      size: 38,
      color: 'ink',
    })
      .at(poolAt(placeA[1])[0], poolAt(placeA[1])[1] + 66)
      .zIndex(4);
    const tie = new Node();
    tie.add(
      line([poolAt(placeA[1])[0] + 100, poolAt(placeA[1])[1]], [poolAt(placeA[1])[0] + 100, 170], {
        stroke: 'yellow',
        width: 3,
      }),
      line([poolAt(placeA[1])[0] + 100, 170], [PANEL_X - 490, 170], {
        stroke: 'yellow',
        width: 3,
      }),
    );
    lifetime.on('safety', () =>
      handoff(
        [doneTag, stillTag, reuseTag],
        () =>
          arrive(fadeIn(panel), fadeIn(gpuTitle), draw(pendRing), fadeIn(pendTag), fadeIn(tie), {
            duration: 0.5,
          }),
        clearFirst,
      ),
    );
    const sweepStart = lifetime.cue('in-flight').start + 0.5,
      sweepEnd = lifetime.cue('done').start;
    lifetime.on('in-flight', () =>
      stage.play(
        lagged(
          jobs.map((node) =>
            fadeIn(node, {
              scale: 0.85,
            }),
          ),
          {
            lag: 0.3,
          },
        ),
        fadeIn(pendCount),
        fadeIn(gpuMarker),
        {
          duration: 0.45,
        },
      ),
    );
    stage.at(sweepStart, () =>
      stage.play(swept.to(1), {
        duration: sweepEnd - sweepStart,
        ease: linear,
      }),
    );
    jobs.forEach((node, i) =>
      stage.at(sweepStart + ((sweepEnd - sweepStart) * (i + 1)) / READS - 0.15, () =>
        stage.play(fade(node, 0.55), {
          duration: 0.15,
        }),
      ),
    );
    const freeTag = M('free', {
      size: 54,
      color: 'green',
    })
      .at(...poolAt(placeA[1]))
      .zIndex(4);
    lifetime.on('done', () =>
      stage.play(
        fadeOut(waitingA[1]),
        fadeOut([pendRing, pendTag, tie], {
          duration: 0.3,
        }),
        fade(rowAName, 0),
        fade(rowACells[1], 0),
        fadeIn(freeTag, {
          scale: 0.8,
        }),
        ...uncover([placeA[1]]),
        {
          duration: 0.45,
        },
      ),
    );
    // A block with two owners stays until the last owner leaves.
    const SHARED = 9;
    const sharedTile = new Node();
    sharedTile.add(
      rect(TILE, TILE, {
        radius: 14,
        fill: 'purple',
        stroke: null,
      }).opacity(0.92),
      M(String(SHARED), {
        size: 38,
        color: 'bg',
      }).at(-TILE / 2 + 34, -TILE / 2 + 34),
    );
    sharedTile.at(...poolAt(SHARED)).zIndex(2);
    // Two example requests, E and F, each list block 9 in their tables. Each mark on the tile is one owner.
    const OWNER_NAMES = ['E', 'F'];
    const ownerMarks = OWNER_NAMES.map((name, i) => {
      const node = new Node();
      node.add(
        rect(66, 66, {
          radius: 33,
          fill: 'bg',
          stroke: null,
        }),
        M(name, {
          size: 42,
          color: 'purple',
        }),
      );
      return node.at(poolAt(SHARED)[0] + (i ? 40 : -40), poolAt(SHARED)[1] + 26).zIndex(3);
    });
    const ownerTitle = place(
      S('Block 9 starts with two owners (example)', {
        size: 46,
        color: 'purple',
      }),
      -100,
      170,
    );
    const ownerChips = OWNER_NAMES.map((name, i) => {
      const node = new Node(),
        x = 20 + i * 430;
      node.add(
        M(name, {
          size: 64,
          color: 'purple',
        }).moveTo([x, 275]),
        rect(150, 84, {
          radius: 10,
          fill: 'surface',
          stroke: 'purple',
          width: 3,
        }).at(x + 120, 275),
        M(String(SHARED), {
          size: 54,
          color: 'purple',
        }).at(x + 120, 275),
      );
      return node;
    });
    const ownerLeft = stage.value(2);
    const ownerCount = dynamic(() =>
      M(`owners left: ${Math.round(ownerLeft.value)}`, {
        size: 60,
        color: ownerLeft.value < 0.5 ? 'green' : 'purple',
      }).at(PANEL_X, 410),
    );
    const free9 = M('free', {
      size: 54,
      color: 'green',
    })
      .at(...poolAt(SHARED))
      .zIndex(4);
    const leaveA = lifetime.cue('owners').start + 0.85,
      leaveB = lifetime.cue('owners').start + 1.6,
      freed = lifetime.cue('owners').start + 2.3;
    lifetime.on('owners', () =>
      handoff(
        [gpuTitle, ...jobs, gpuMarker, pendCount, freeTag],
        () =>
          arrive(
            ...cover([SHARED]),
            fadeIn([sharedTile, ...ownerMarks, ownerTitle, ...ownerChips, ownerCount]),
            {
              duration: 0.4,
            },
          ),
        {
          ...clearFirst,
          also: uncover([placeA[1]]),
        },
      ),
    );
    stage.at(leaveA, () =>
      stage.play(
        fadeOut([ownerChips[0], ownerMarks[0]], {
          shift: [0, 26],
        }),
        ownerLeft.to(1),
        {
          duration: 0.5,
        },
      ),
    );
    stage.at(leaveB, () =>
      stage.play(
        fadeOut([ownerChips[1], ownerMarks[1]], {
          shift: [0, 26],
        }),
        ownerLeft.to(0),
        {
          duration: 0.5,
        },
      ),
    );
    stage.at(freed, () =>
      stage.play(
        fadeOut(sharedTile, {
          duration: 0.3,
        }),
        fadeIn(free9, {
          scale: 0.8,
        }),
        ...uncover([SHARED]),
        {
          duration: 0.45,
        },
      ),
    );
    // Some engines keep a finished block on purpose. The next scenes come back to it.
    const keptBlock = blockOf(placeC[2], 'teal', 'kept', 0.92, 62);
    const keptTitle = T('Finished, but kept on purpose', {
      size: 62,
      color: 'teal',
    }).at(PANEL_X, 250);
    const keptSub = T('in case a later request can reuse it', {
      size: 48,
      color: 'dim',
    }).at(PANEL_X, 350);
    lifetime.on('retained', () =>
      handoff(
        [ownerTitle, ownerCount, free9],
        () =>
          arrive(
            ...cover([placeC[2]]),
            fadeIn(keptBlock, {
              scale: 0.7,
            }),
            fadeIn(keptTitle),
            fadeIn(keptSub),
            {
              duration: 0.5,
            },
          ),
        {
          ...clearFirst,
          also: uncover([SHARED]),
        },
      ),
    );
    stage.at(lifetime.end - 0.45, () =>
      stage.play(
        ...hidePool(),
        fadeOut([lifeC, ...lifeB, rowB, rowC, panel, keptBlock, keptTitle, keptSub]),
        {
          duration: 0.4,
        },
      ),
    );
  }
}
