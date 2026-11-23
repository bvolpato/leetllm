import {
  draw,
  fade,
  fadeIn,
  indicate,
  lagged,
  line,
  Node,
  rect,
  smoother,
  to,
  write,
} from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { MIB, GIB, CONVERSATION, SLOTS } from '../model.mjs';

/** Two answers, one past. */
export function buildShare(
  stage,
  narration,
  {
    T,
    M,
    S,
    place,
    fadeOut,
    crossfade,
    bar,
    retitle,
    pulse,
    arrive,
    clearFirst,
    handoff,
    PREVIEW,
  },
  { TILE, poolAt, blockOf, cover, showPool, hidePool },
) {
  const share = narration.scene('share');
  // The heading follows the same switch as the tables and the counters: four owners during beam search.
  retitle(share, sceneHeading(stage, share, narration.title('share')), [
    ['beam', 'Four branches, one past'],
    ['safe', narration.title('share')],
  ]);
  {
    share.at(0.05, () =>
      stage.play(...showPool(), {
        duration: 0.4,
      }),
    );
    const prompt = [3, 10].map((index, logical) => blockOf(index, 'purple', `P${logical}`));
    const countBadge = (index, count, color = 'bg') =>
      M(`refs ${count}`, {
        size: 38,
        color,
      })
        .at(poolAt(index)[0], poolAt(index)[1] + 66)
        .zIndex(4);
    const refs = [countBadge(3, 2), countBadge(10, 2)];
    const BR_X = -690,
      BR_STEP = 156,
      BR_W = 146;
    const branchCell = (entry, logical, y, color) => {
      const node = new Node();
      node.add(
        rect(BR_W, 116, {
          radius: 10,
          fill: 'surface',
          stroke: color,
          width: 3,
        }).at(BR_X + logical * BR_STEP, y),
        M(String(entry), {
          size: 68,
          color,
        }).at(BR_X + logical * BR_STEP, y),
      );
      return node;
    };
    const branch = (name, y, color, targets) => {
      const node = new Node();
      node.add(
        M(name, {
          size: 84,
          color,
        }).moveTo([-810, y]),
      );
      targets.forEach((entry, logical) => node.add(branchCell(entry, logical, y, color)));
      return node;
    };
    const branchA = branch('A', 205, 'blue', [3, 10]),
      branchB = branch('B', 345, 'orange', [3, 10]),
      branchAfter = branch('A', 205, 'blue', [3, 5]);
    const NOTE_X = -280;
    const paidOnce = place(
      T('Two owners,\npaid for once.', {
        size: 130,
        color: 'green',
        leading: 1.1,
      }),
      NOTE_X,
      275,
    );
    share.on('two-answers', () =>
      stage.play(
        ...cover([3, 10]),
        lagged(
          prompt.map((node) =>
            fadeIn(node, {
              scale: 0.7,
            }),
          ),
          {
            lag: 0.4,
          },
        ),
        fadeIn([branchA, branchB], {
          shift: [0, 14],
        }),
        {
          duration: 1,
        },
      ),
    );
    share.on('owners', () =>
      stage.play(
        lagged(
          refs.map((node) =>
            fadeIn(node, {
              scale: 1.3,
            }),
          ),
          {
            lag: 0.3,
          },
        ),
        {
          duration: 0.8,
        },
      ),
    );
    share.on('paid-once', () =>
      stage.play(write(paidOnce), {
        duration: 0.9,
      }),
    );
    // Beam search: four branch tables converge on one prompt.
    const FAN_Y = [165, 250, 335, 420],
      FAN_TARGET = [470, 292];
    const fanRows = FAN_Y.map((y, i) => {
      const node = new Node();
      node.add(
        place(
          M(`branch ${i + 1}`, {
            size: 42,
            color: 'dim',
          }),
          NOTE_X,
          y,
        ),
        chip('3', {
          w: 90,
          h: 70,
          color: 'purple',
          size: 46,
        }).at(30, y),
        chip('10', {
          w: 90,
          h: 70,
          color: 'purple',
          size: 46,
        }).at(130, y),
      );
      return node;
    });
    const fanLines = FAN_Y.map((y) =>
      line([180, y], FAN_TARGET, {
        stroke: 'purple',
        width: 4,
      }),
    );
    const fanBlocks = ['P0', 'P1'].map((name, i) => {
      const node = new Node();
      node.add(
        rect(150, 150, {
          radius: 12,
          fill: 'purple',
          stroke: null,
        }),
        S(name, {
          size: 58,
          color: 'bg',
          weight: 600,
        }),
      );
      return node.at(FAN_TARGET[0] + 80 + i * 164, FAN_TARGET[1]);
    });
    const fanName = T('one prompt, four owners', {
      size: 46,
      color: 'purple',
    }).at(FAN_TARGET[0] + 162, FAN_TARGET[1] + 120);
    share.on('large', () =>
      stage.play(
        fadeOut(paidOnce, {
          duration: 0.3,
        }),
        {
          duration: 0.3,
        },
      ),
    );
    // Beam search is a different case, so A and B step back, and the same tiles count four owners.
    const refsBeam = [countBadge(3, 4), countBadge(10, 4)];
    share.on('beam', () =>
      stage.play(
        fade(branchA, PREVIEW),
        fade(branchB, PREVIEW),
        ...crossfade(refs[0], refsBeam[0]),
        ...crossfade(refs[1], refsBeam[1]),
        lagged(
          fanRows.map((node) =>
            fadeIn(node, {
              shift: [-12, 0],
            }),
          ),
          {
            lag: 0.3,
          },
        ),
        lagged(
          fanLines.map((node) => draw(node)),
          {
            lag: 0.3,
          },
        ),
        fadeIn(fanBlocks, {
          scale: 0.85,
        }),
        fadeIn(fanName),
        {
          duration: 1.3,
        },
      ),
    );
    share.on('four-branches', () =>
      stage.play(
        lagged(
          fanLines.map((node) =>
            indicate(node, {
              color: 'yellow',
              scale: 1,
            }),
          ),
          {
            lag: 0.2,
          },
        ),
        {
          duration: 1,
        },
      ),
    );
    // Four private copies against one shared prompt, on one scale.
    const SAVE_X = NOTE_X,
      SAVE_SCALE = 1100 / (4 * CONVERSATION);
    const privateBars = Array.from(
      {
        length: 4,
      },
      (_, i) =>
        bar(
          SAVE_X + i * CONVERSATION * SAVE_SCALE,
          220,
          CONVERSATION * SAVE_SCALE - 5,
          76,
          'red',
        ),
    );
    const privateName = place(
      M(`4 private copies: ${(4 * CONVERSATION) / GIB} GiB`, {
        size: 46,
        color: 'red',
      }),
      SAVE_X,
      150,
    );
    const sharedBar = bar(SAVE_X, 390, CONVERSATION * SAVE_SCALE - 5, 76, 'green');
    const sharedName = place(
      M(`shared: ${CONVERSATION / MIB} MiB`, {
        size: 46,
        color: 'green',
      }),
      SAVE_X,
      320,
    );
    share.on('private', () =>
      stage.play(
        lagged(
          fanRows.map((node) => pulse(node, 1.02)),
          { lag: 0.2 },
        ),
        { duration: 0.8 },
      ),
    );
    share.after('private', () =>
      handoff(
        [...fanRows, ...fanLines, ...fanBlocks, fanName],
        () =>
          arrive(
            lagged(
              privateBars.map((node) =>
                fadeIn(node, {
                  shift: [-14, 0],
                }),
              ),
              {
                lag: 0.2,
              },
            ),
            fadeIn(privateName),
            {
              duration: 0.6,
            },
          ),
        clearFirst,
      ),
    );
    share.after('shared', () =>
      stage.play(
        fadeIn(sharedBar, {
          shift: [-14, 0],
        }),
        fadeIn(sharedName),
        {
          duration: 0.6,
        },
      ),
    );
    // The partly full block 10, drawn large. Positions 4 to 6 are the prompt, and one slot is empty.
    const W_LEFT = NOTE_X + 40,
      W_CELL = 230,
      W_Y = 270;
    const writeCells = Array.from(
      {
        length: SLOTS,
      },
      (_, i) =>
        rect(W_CELL - 10, 150, {
          radius: 12,
          fill: i < 3 ? 'purple' : 'surface',
          stroke: i < 3 ? null : 'yellow',
          width: 3,
        })
          .opacity(i < 3 ? 0.9 : 1)
          .at(W_LEFT + W_CELL / 2 + i * W_CELL, W_Y),
    );
    const writeNames = [0, 1, 2].map((i) =>
      M(String(4 + i), {
        size: 60,
        color: 'bg',
      }).at(W_LEFT + W_CELL / 2 + i * W_CELL, W_Y),
    );
    const writeTitle = place(
      T('Block 10, drawn large: both append here', {
        size: 50,
        color: 'yellow',
      }),
      W_LEFT,
      W_Y - 120,
    );
    const blockRing = rect(TILE + 20, TILE + 20, {
      radius: 18,
      stroke: 'yellow',
      width: 6,
    })
      .at(...poolAt(10))
      .glow(10)
      .zIndex(3);
    const blockTie = new Node();
    blockTie.add(
      line([poolAt(10)[0], poolAt(10)[1] + TILE / 2 + 10], [poolAt(10)[0], W_Y], {
        stroke: 'yellow',
        width: 3,
      }),
      line([poolAt(10)[0], W_Y], [W_LEFT, W_Y], {
        stroke: 'yellow',
        width: 3,
      }),
    );
    const slotToken = (name, color, x, y) => {
      const node = new Node();
      node.add(
        rect(W_CELL - 10, 150, {
          radius: 12,
          fill: color,
          stroke: null,
        }),
        M(name, {
          size: 72,
          color: 'bg',
        }),
      );
      return node.at(x, y).zIndex(2);
    };
    const writeA = slotToken('A', 'blue', W_LEFT + W_CELL / 2 + 3 * W_CELL, W_Y),
      writeB = slotToken('B', 'orange', W_LEFT + W_CELL / 2 + 3 * W_CELL, W_Y).zIndex(3);
    const wrongNote = place(
      T("A now reads B's key and value", {
        size: 58,
        color: 'red',
      }),
      W_LEFT,
      W_Y + 130,
    );
    const wrongRing = rect(BR_W + BR_STEP + 26, 136, {
      radius: 14,
      stroke: 'red',
      width: 5,
    })
      .at(BR_X + BR_STEP / 2, 205)
      .zIndex(2);
    const saveParts = [...privateBars, privateName, sharedBar, sharedName];
    const safeNote = place(
      T('Reading it is safe, but readers compete for bandwidth', {
        size: 44,
        color: 'green',
      }),
      W_LEFT,
      W_Y - 120,
    );
    share.on('safe', () =>
      handoff(
        saveParts,
        () =>
          arrive(
            lagged(
              writeCells.map((node) =>
                fadeIn(node, {
                  scale: 0.92,
                }),
              ),
              {
                lag: 0.1,
              },
            ),
            fadeIn(writeNames),
            fadeIn(safeNote),
            draw(blockRing),
            fadeIn(blockTie),
            {
              duration: 0.5,
            },
          ),
        {
          ...clearFirst,
          also: [
            fade(branchA, 1),
            fade(branchB, 1),
            ...crossfade(refsBeam[0], refs[0]),
            ...crossfade(refsBeam[1], refs[1]),
          ],
        },
      ),
    );
    share.on('danger', () =>
      stage.play(
        indicate(writeCells[3], {
          color: 'yellow',
          scale: 1.05,
        }),
        {
          duration: 0.6,
        },
      ),
    );
    share.on('both-append', () =>
      handoff(
        [safeNote],
        () =>
          arrive(
            fadeIn(writeTitle),
            fadeIn(writeA, {
              shift: [0, -30],
            }),
            {
              duration: 0.5,
            },
          ),
        clearFirst,
      ),
    );
    share.on('overwrites', () =>
      stage.play(
        fadeIn(writeB, {
          shift: [0, -30],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    share.on('wrong', () =>
      stage.play(
        fadeIn(wrongNote, {
          shift: [0, 8],
        }),
        draw(wrongRing),
        {
          duration: 0.6,
        },
      ),
    );
    // The copy leaves the shared block and lands in a free one, so the motion itself is the copy.
    const copied = blockOf(5, 'blue', 'P1′', 1)
      .at(...poolAt(10))
      .zIndex(5);
    const refsAfter = countBadge(10, 1),
      refsCopy = countBadge(5, 1).zIndex(6);
    const cowName = place(
      T('Copy on write', {
        italic: true,
        size: 80,
        color: 'yellow',
      }),
      NOTE_X,
      150,
    );
    // Each branch's block, side by side: positions 4 to 6 kept, and the token each one writes.
    const OWN_LEFT = -40,
      OWN_CELL = 170;
    const ownRow = (block, y, color) => {
      const node = new Node();
      node.add(
        place(
          M(`block ${block}`, {
            size: 46,
            color,
          }),
          NOTE_X,
          y,
        ),
      );
      for (let i = 0; i < SLOTS; i++)
        node.add(
          rect(OWN_CELL - 8, 100, {
            radius: 10,
            fill: i < 3 ? 'purple' : 'surface',
            stroke: i < 3 ? null : 'dim',
            width: 2,
          })
            .opacity(i < 3 ? 0.9 : 1)
            .at(OWN_LEFT + OWN_CELL / 2 + i * OWN_CELL, y),
          ...(i < 3
            ? [
                M(String(4 + i), {
                  size: 52,
                  color: 'bg',
                }).at(OWN_LEFT + OWN_CELL / 2 + i * OWN_CELL, y),
              ]
            : []),
        );
      return node;
    };
    const ownA = ownRow(5, 262, 'blue'),
      ownB = ownRow(10, 372, 'orange');
    const ownToken = (name, color, y) => {
      const node = new Node();
      node.add(
        rect(OWN_CELL - 8, 100, {
          radius: 10,
          fill: color,
          stroke: null,
        }),
        M(name, {
          size: 60,
          color: 'bg',
        }),
      );
      return node.at(OWN_LEFT + OWN_CELL / 2 + 3 * OWN_CELL, y).zIndex(1);
    };
    const tokenA = ownToken('A', 'blue', 262),
      tokenB = ownToken('B', 'orange', 372);
    const validRing = rect(3 * OWN_CELL + 8, 118, {
      radius: 12,
      stroke: 'green',
      width: 5,
    })
      .at(OWN_LEFT + 1.5 * OWN_CELL, 262)
      .zIndex(2);
    const validTag = place(
      M('valid', {
        size: 44,
        color: 'green',
      }),
      OWN_LEFT + 4 * OWN_CELL + 20,
      262,
    );
    const inPlaceTag = place(
      M('no copy', {
        size: 44,
        color: 'orange',
      }),
      OWN_LEFT + 4 * OWN_CELL + 20,
      372,
    );
    const writeParts = [
      ...writeCells,
      ...writeNames,
      writeTitle,
      writeA,
      writeB,
      wrongNote,
      wrongRing,
      blockRing,
      blockTie,
    ];
    share.on('copies', () => {
      handoff(writeParts, () =>
        arrive(
          ...cover([5]),
          fadeIn(copied, {
            scale: 1.12,
          }),
          {
            duration: 0.3,
          },
        ),
      );
      stage.play(
        to(copied, (node) => node.at(...poolAt(5))),
        {
          duration: 0.9,
          ease: smoother,
        },
      );
    });
    share.on('writes-own', () =>
      stage.play(
        fadeIn(ownA, {
          shift: [0, 10],
        }),
        fadeIn(tokenA, {
          shift: [0, -24],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    share.on('cow', () =>
      stage.play(write(cowName), {
        duration: 0.7,
      }),
    );
    share.on('valid', () =>
      stage.play(draw(validRing), fadeIn(validTag), {
        duration: 0.5,
      }),
    );
    // The table, both counters, and the copy's owner count all change together.
    share.on('table', () =>
      stage.play(
        ...crossfade(branchA, branchAfter),
        ...crossfade(refs[1], refsAfter),
        fadeIn(refsCopy),
        fadeOut([validRing, validTag], {
          duration: 0.3,
        }),
        {
          duration: 0.55,
        },
      ),
    );
    share.on('last-owner', () =>
      stage.play(
        fadeIn(ownB, {
          shift: [0, 10],
        }),
        pulse(prompt[1], 1.04),
        {
          duration: 0.5,
        },
      ),
    );
    share.on('in-place', () =>
      stage.play(
        fadeIn(tokenB, {
          shift: [0, -24],
        }),
        fadeIn(inPlaceTag),
        {
          duration: 0.5,
        },
      ),
    );
    // A full shared block needs no copy. Each branch simply takes a new block.
    const fullRing = rect(TILE + 20, TILE + 20, {
      radius: 18,
      stroke: 'green',
      width: 6,
    })
      .at(...poolAt(3))
      .glow(10)
      .zIndex(3);
    const fullTag = place(
      T('Once a block is full, no copy: each branch takes a new one', {
        size: 46,
        color: 'green',
      }),
      NOTE_X,
      468,
    );
    const newA = blockOf(6, 'blue', 'new', 0.92, 60),
      newB = blockOf(14, 'orange', 'new', 0.92, 60);
    share.on('full', () =>
      stage.play(draw(fullRing), fadeIn(fullTag), {
        duration: 0.5,
      }),
    );
    const newEntryA = branchCell(6, 2, 205, 'blue'),
      newEntryB = branchCell(14, 2, 345, 'orange');
    share.on('takes-new', () =>
      stage.play(
        ...cover([6, 14]),
        lagged(
          [
            [newA, newEntryA],
            [newB, newEntryB],
          ].map((pair) =>
            fadeIn(pair, {
              scale: 0.8,
            }),
          ),
          {
            lag: 0.4,
          },
        ),
        {
          duration: 0.8,
        },
      ),
    );
    const futures = place(
      T('Same past. Separate futures.', {
        size: 64,
        color: 'green',
      }),
      NOTE_X,
      468,
    );
    share.on('futures', () =>
      handoff(
        [fullTag, fullRing],
        () =>
          arrive(write(futures), {
            duration: 0.6,
          }),
        clearFirst,
      ),
    );
    stage.at(share.end - 0.45, () =>
      stage.play(
        fadeOut([
          ...prompt,
          refs[0],
          refsAfter,
          refsCopy,
          branchAfter,
          branchB,
          copied,
          cowName,
          ownA,
          ownB,
          tokenA,
          tokenB,
          inPlaceTag,
          newA,
          newB,
          newEntryA,
          newEntryB,
          futures,
        ]),
        ...hidePool(),
        {
          duration: 0.4,
        },
      ),
    );
  }
}
