import assert from 'node:assert/strict';
import {
  arrow,
  draw,
  dynamic,
  fade,
  fadeIn,
  fadeOut as fadeAway,
  indicate,
  lagged,
  linear,
  Node,
  rect,
  smoother,
  to,
  write,
} from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';

/** When the pool runs out anyway. */
export function buildPreempt(
  stage,
  narration,
  {
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
    pulse,
    arrive,
    clearFirst,
    handoff,
  },
  { POOL, poolAt, poolNumbers, blockOf, cover, uncover, showPool, hidePool },
) {
  const preempt = narration.scene('preempt');
  sceneHeading(stage, preempt, narration.title('preempt'));
  {
    const OWNERS = {
      A: [0, 3, 6, 9, 12],
      E: [1, 5, 10, 14],
      F: [2, 7, 11],
      S: [4, 8, 13, 15],
    };
    assert.equal(Object.values(OWNERS).flat().length, POOL);
    assert.equal(new Set(Object.values(OWNERS).flat()).size, POOL);
    const ownerColor = {
      A: 'blue',
      E: 'orange',
      F: 'green',
      S: 'purple',
    };
    const fullPool = Object.fromEntries(
      Object.entries(OWNERS).map(([owner, indices]) => [
        owner,
        indices.map((index) => blockOf(index, ownerColor[owner], owner)),
      ]),
    );
    const letterNote = place(
      M('A, E, F are requests. S is shared or kept.', {
        size: 38,
        color: 'dim',
      }),
      -800,
      -380,
    );
    preempt.at(0.05, () =>
      stage.play(
        ...showPool(poolNumbers.map((_, i) => i)),
        fadeIn(Object.values(fullPool).flat()),
        fadeIn(letterNote),
        {
          duration: 0.4,
        },
      ),
    );
    // The block tables sit under the pool, because the rule is about what they hold.
    const CH_W = 96,
      CH_STEP = 106,
      CH_LEFT = -740;
    const tableEntry = (entry, i, y, color) => {
      const node = new Node();
      node.add(
        rect(CH_W, 76, {
          radius: 9,
          fill: 'surface',
          stroke: color,
          width: 3,
        }).at(CH_LEFT + i * CH_STEP, y),
        M(String(entry), {
          size: 50,
          color,
        }).at(CH_LEFT + i * CH_STEP, y),
      );
      return node;
    };
    const A_Y = 165,
      E_Y = 265;
    const tableRowOf = (name, entries, y, color) => {
      const node = new Node();
      node.add(
        M(name, {
          size: 64,
          color,
        }).moveTo([-850, y]),
      );
      entries.forEach((entry, i) => node.add(tableEntry(entry, i, y, color)));
      return node;
    };
    const tableA = tableRowOf('A', OWNERS.A, A_Y, 'blue');
    const tableE = tableRowOf('E', OWNERS.E, E_Y, 'orange');
    const wanted = rect(CH_W, 76, {
      radius: 9,
      fill: 'bg',
      stroke: 'red',
      width: 3,
    })
      .dash([10, 8])
      .at(CH_LEFT + 5 * CH_STEP, A_Y);
    const wantedMark = M('?', {
      size: 50,
      color: 'red',
    }).at(CH_LEFT + 5 * CH_STEP, A_Y);
    const freeN = stage.value(0);
    const freeCount = dynamic(() => {
      const value = Math.round(freeN.value);
      return place(
        M(`free blocks: ${value}`, {
          size: 62,
          color: value ? 'green' : 'red',
        }),
        -40,
        A_Y,
      );
    });
    preempt.on('ceiling', () =>
      stage.play(
        lagged(
          Object.values(fullPool)
            .flat()
            .map((node) => pulse(node, 1.03)),
          {
            lag: 0.02,
          },
        ),
        {
          duration: 0.8,
        },
      ),
    );
    preempt.on('needs-block', () =>
      stage.play(
        fadeIn(tableA),
        fadeIn(wanted),
        fadeIn(wantedMark, {
          scale: 0.7,
        }),
        {
          duration: 0.5,
        },
      ),
    );
    preempt.on('empty', () =>
      stage.play(fadeIn(freeCount), fadeIn(tableE), {
        duration: 0.4,
      }),
    );
    const decisionName = place(
      T('A scheduling decision:', {
        size: 56,
        color: 'yellow',
      }),
      -800,
      385,
    );
    preempt.on('decision', () =>
      stage.play(fadeIn(decisionName), {
        duration: 0.4,
      }),
    );
    const delayChip = chip('delay A', {
      w: 280,
      h: 96,
      color: 'yellow',
      size: 50,
    }).at(-50, 385);
    const evictChip = chip('evict E, recover later', {
      w: 710,
      h: 96,
      color: 'orange',
      size: 50,
    }).at(480, 385);
    preempt.on('delay', () =>
      stage.play(
        fadeIn(delayChip, {
          scale: 0.9,
        }),
        {
          duration: 0.4,
        },
      ),
    );
    preempt.on('evict', () =>
      stage.play(
        fadeIn(evictChip, {
          scale: 0.9,
        }),
        {
          duration: 0.4,
        },
      ),
    );
    const unchangedNote = place(
      M('Failed allocation: tables unchanged', {
        size: 46,
        color: 'green',
      }),
      -800,
      480,
    );
    preempt.on('unchanged', () =>
      stage.play(fadeIn(unchangedNote), pulse(tableA, 1.02), pulse(tableE, 1.02), {
        duration: 0.7,
      }),
    );
    preempt.on('retry', () =>
      stage.play(
        indicate(wanted, {
          color: 'yellow',
          scale: 1.15,
        }),
        indicate(wantedMark, {
          color: 'yellow',
          scale: 1.15,
        }),
        {
          duration: 0.6,
        },
      ),
    );
    // Recompute: E gives up its blocks, A takes one, and E later rebuilds on different blocks.
    const RIGHT = -40;
    const recomputeName = place(
      T('Recompute', {
        italic: true,
        size: 90,
        color: 'orange',
      }),
      RIGHT,
      275,
    );
    const aGets = 1,
      returnTo = [2, 5, 7, 11];
    assert.ok(
      OWNERS.E.includes(aGets) &&
        !returnTo.includes(aGets) &&
        returnTo.filter((index) => OWNERS.F.includes(index)).length === OWNERS.F.length,
    );
    const newABlock = () => blockOf(aGets, 'blue', 'A');
    const aEntry = tableEntry(aGets, 5, A_Y, 'blue');
    const firstRow = [decisionName, delayChip, evictChip, unchangedNote];
    const aBlock1 = newABlock();
    const eWait = chip('E waits, with no blocks', {
      w: 660,
      h: 76,
      color: 'orange',
      size: 42,
    }).at(-475, E_Y);
    const eOld = tableE;
    const eTable2 = tableRowOf('E', returnTo, E_Y, 'orange');
    const eBack = returnTo.map((index) => blockOf(index, 'orange', 'E'));
    const rebuildTrack = frameBar(RIGHT, 385, 880, 76);
    const rebuildFill = growBar(RIGHT, 385, 880, 76, 'orange');
    const rebuildName = place(
      M('E rebuilds 4 blocks: extra compute', {
        size: 44,
        color: 'red',
      }),
      RIGHT,
      480,
    );
    preempt.on('recompute', () =>
      handoff(
        firstRow,
        () =>
          arrive(write(recomputeName), {
            duration: 0.6,
          }),
        clearFirst,
      ),
    );
    preempt.on('gives-up', () => {
      stage.play(
        ...fullPool.E.map((node) => fade(node, 0)),
        ...uncover(OWNERS.E),
        fadeOut(eOld),
        freeN.to(OWNERS.E.length),
        {
          duration: 0.6,
        },
      );
      stage.play(
        ...cover([aGets]),
        fadeIn(aBlock1, {
          scale: 0.7,
        }),
        fadeOut([wanted, wantedMark], {
          duration: 0.2,
        }),
        fadeIn(aEntry),
        freeN.to(OWNERS.E.length - 1),
        {
          duration: 0.5,
        },
      );
    });
    preempt.on('to-wait', () =>
      stage.play(
        fadeIn(eWait, {
          scale: 0.85,
        }),
        {
          duration: 0.4,
        },
      ),
    );
    const freedLabel = place(
      M('F finishes', {
        size: 36,
        color: 'green',
      }),
      RIGHT + 540,
      275,
    );
    preempt.on('rebuilds', () => {
      stage.play(
        fadeIn(freedLabel),
        ...fullPool.F.map((node) => fade(node, 0)),
        ...uncover(OWNERS.F),
        freeN.to(OWNERS.E.length - 1 + OWNERS.F.length),
        {
          duration: 0.4,
        },
      );
      // Remove the free-pool numerals before the allocated labels scale into those cells.
      stage.play(...cover(returnTo), {
        duration: 0.15,
      });
      stage.play(
        fadeOut(eWait, {
          duration: 0.2,
        }),
        brief(fadeIn(eTable2), 0.4),
        brief(fadeIn(rebuildTrack), 0.3),
        brief(fadeIn(rebuildFill.node), 0.1),
        rebuildFill.grow({
          duration: 2.1,
          ease: linear,
        }),
        lagged(
          eBack.map((node) =>
            fadeIn(node, {
              scale: 0.8,
            }),
          ),
          {
            lag: 0.5,
          },
        ),
        freeN.to(OWNERS.E.length - 1 + OWNERS.F.length - returnTo.length),
        {
          duration: 2.1,
        },
      );
    });
    preempt.on('compute', () =>
      stage.play(
        fadeIn(rebuildName),
        lagged(
          eBack.map((node) => pulse(node, 1.05)),
          {
            lag: 0.1,
          },
        ),
        {
          duration: 0.6,
        },
      ),
    );
    const keptMark = place(
      T('Shared or kept blocks can stay', {
        size: 54,
        color: 'purple',
      }),
      -800,
      480,
    );
    preempt.on('shared', () =>
      stage.play(
        brief(fadeOut(rebuildName), 0.18, 0, LINEAR),
        brief(fadeIn(keptMark), 0.3, 0.16),
        lagged(
          fullPool.S.map((node) => pulse(node, 1.05)),
          {
            lag: 0.1,
          },
        ),
        {
          duration: 0.6,
        },
      ),
    );
    // Swap starts over from the same full pool, and the screen says so.
    const rewindNote = place(
      M('Rewind: now try the other path', {
        size: 42,
        color: 'dim',
      }),
      -800,
      385,
    );
    const swapName = place(
      T('Swap', {
        italic: true,
        size: 84,
        color: 'teal',
      }),
      -800,
      462,
    );
    const CPU_Y = 330,
      CPU_LEFT = 60,
      CPU_TILE = 170,
      CPU_X = (i) => CPU_LEFT + 110 + i * (CPU_TILE + 24);
    const cpuBox = rect(CPU_X(3) - CPU_X(0) + CPU_TILE + 60, CPU_TILE + 60, {
      radius: 16,
      fill: 'surface',
      stroke: 'teal',
      width: 3,
    }).at((CPU_X(0) + CPU_X(3)) / 2, CPU_Y);
    const cpuName = place(
      S('CPU memory', {
        size: 44,
        color: 'teal',
      }),
      CPU_LEFT,
      CPU_Y + CPU_TILE / 2 + 62,
    );
    // On the CPU these are E's data, not GPU blocks, so they carry no GPU block number.
    const cpuTiles = OWNERS.E.map((index) => {
      const node = new Node();
      node.add(
        rect(CPU_TILE, CPU_TILE, {
          radius: 14,
          fill: 'orange',
          stroke: null,
        }),
        S('E', {
          size: 76,
          color: 'bg',
          weight: 600,
        }).at(0, 12),
      );
      return node.at(...poolAt(index)).zIndex(3);
    });
    // Each tile takes the CPU slot that keeps its left to right order, so no two ever cross.
    const CPU_SLOT = [0, 2, 1, 3];
    const inSameOrder = (first, second) =>
      first.every((a, i) => first.every((b, j) => a < b === second[i] < second[j]));
    assert.ok(
      inSameOrder(
        OWNERS.E.map((index) => poolAt(index)[0]),
        CPU_SLOT,
      ),
    );
    const eTableSwap = tableRowOf('E', OWNERS.E, E_Y, 'orange');
    const eOnCpu = chip('E is on the CPU', {
      w: 500,
      h: 76,
      color: 'orange',
      size: 42,
    }).at(-555, E_Y);
    preempt.on('swap', () =>
      handoff(
        [
          recomputeName,
          freedLabel,
          rebuildTrack,
          rebuildFill.node,
          rebuildName,
          keptMark,
          eTable2,
          ...eBack,
          aBlock1,
          aEntry,
        ],
        () => {
          arrive(
            ...cover(Object.values(OWNERS).flat()),
            ...fullPool.E.map((node) => fade(node, 1)),
            ...fullPool.F.map((node) => fade(node, 1)),
            fadeIn(eTableSwap),
            fadeIn([wanted, wantedMark]),
            freeN.to(0),
            fadeIn(rewindNote),
            fadeIn(swapName),
            fadeIn(cpuBox),
            fadeIn(cpuName),
            {
              duration: 0.5,
            },
          );
        },
      ),
    );
    const aBlock2 = newABlock(),
      aEntry2 = tableEntry(aGets, 5, A_Y, 'blue');
    stage.at(preempt.cue('move').start + 1.36, () =>
      stage.play(
        fadeOut(rewindNote, {
          duration: 0.25,
        }),
        {
          duration: 0.25,
        },
      ),
    );
    preempt.on('move', () => {
      stage.play(
        ...fullPool.E.map((node) =>
          fade(node, 0, {
            duration: 0.15,
          }),
        ),
        fadeIn(cpuTiles, {
          duration: 0.1,
        }),
        ...uncover(OWNERS.E),
        freeN.to(OWNERS.E.length),
        fadeOut(eTableSwap),
        fadeIn(eOnCpu),
        {
          duration: 0.2,
        },
      );
      stage.play(
        ...cpuTiles.map((node, i) => to(node, (moved) => moved.at(CPU_X(CPU_SLOT[i]), CPU_Y))),
        {
          duration: 0.9,
          ease: smoother,
        },
      );
      stage.play(
        ...cover([aGets]),
        fadeIn(aBlock2, {
          scale: 0.7,
        }),
        fadeOut([wanted, wantedMark], {
          duration: 0.2,
        }),
        fadeIn(aEntry2),
        freeN.to(OWNERS.E.length - 1),
        {
          duration: 0.5,
        },
      );
    });
    // Data crosses the link as dots, so the cost is visible while the voice explains it.
    const LINK_X = 650,
      LINK_TOP = 78,
      LINK_BOTTOM = CPU_Y - CPU_TILE / 2 - 32;
    const linkArrow = arrow([LINK_X, LINK_BOTTOM], [LINK_X, LINK_TOP], {
      stroke: 'red',
      width: 7,
      tip: 26,
      both: true,
    });
    const linkName = place(
      M('link\nbandwidth', {
        size: 42,
        color: 'red',
      }),
      LINK_X + 30,
      135,
    );
    const linkFlow = stage.value(0);
    const linkDots = dynamic(() => {
      const node = new Node();
      for (let i = 0; i < 3; i += 1) {
        const t = (linkFlow.value + i / 3) % 1;
        node.add(
          rect(22, 22, {
            radius: 11,
            fill: 'yellow',
            stroke: null,
          }).at(LINK_X - 40, LINK_BOTTOM + (LINK_TOP - LINK_BOTTOM) * t),
        );
      }
      return node;
    });
    preempt.on('keeps-work', () =>
      stage.play(
        lagged(
          cpuTiles.map((node) => pulse(node, 1.05)),
          {
            lag: 0.2,
          },
        ),
        {
          duration: 0.8,
        },
      ),
    );
    preempt.on('link', () =>
      stage.play(draw(linkArrow), fadeIn(linkName), fadeIn(linkDots), {
        duration: 0.5,
      }),
    );
    const flowSpan = preempt.cue('either-way').start - preempt.cue('link').start - 0.5;
    stage.at(preempt.cue('link').start + 0.5, () =>
      stage.play(linkFlow.to(flowSpan / 1.2), {
        duration: flowSpan,
        ease: linear,
      }),
    );
    const differNote = place(
      T('Engines differ, and versions change', {
        size: 48,
        color: 'ink',
      }),
      -800,
      385,
    );
    preempt.on('differ', () =>
      stage.play(fadeIn(differNote), {
        duration: 0.5,
      }),
    );
    // E comes back onto different blocks, with a changed table, and it pays either way.
    // E's blocks land on new tiles in the same left to right order, so its tiles never cross on the way back.
    const backTo = [2, 5, 11, 7];
    assert.deepEqual(
      [...backTo].sort((a, b) => a - b),
      [...returnTo].sort((a, b) => a - b),
    );
    assert.ok(
      inSameOrder(
        CPU_SLOT,
        backTo.map((index) => poolAt(index)[0]),
      ),
    );
    const eTableBack = tableRowOf('E', backTo, E_Y, 'orange');
    const eHome = backTo.map((index) => blockOf(index, 'orange', 'E'));
    const fFree = place(
      M('F finishes', {
        size: 46,
        color: 'green',
      }),
      540,
      A_Y,
    );
    const COST_LEFT = -40,
      COST_MAX = 880;
    // The two costs are drawn the same size, because which one is larger depends on the workload.
    const payRows = [
      ['recompute: extra compute', 'orange', 338],
      ['swap: link bandwidth', 'teal', 408],
    ].map(([name, color, y]) => {
      const node = new Node();
      node.add(
        bar(COST_LEFT, y, COST_MAX, 58, color),
        M(name, {
          size: 40,
          color: 'bg',
        })
          .moveTo([0, y])
          .alignTo([COST_LEFT + 16, 0], 'left'),
      );
      return node;
    });
    const payTitle = place(
      M('E pays to resume, either way', {
        size: 42,
        color: 'dim',
      }),
      COST_LEFT,
      276,
    );
    const payNote = place(
      T('Which costs more depends on the workload', {
        size: 46,
        color: 'yellow',
      }),
      COST_LEFT,
      476,
    );
    const FREE_E_GONE = OWNERS.E.length - 1;
    preempt.on('either-way', () =>
      stage.play(
        fadeOut([linkArrow, linkName, linkDots, differNote], {
          duration: 0.25,
        }),
        fadeIn(fFree),
        ...fullPool.F.map((node) => fade(node, 0)),
        ...uncover(OWNERS.F),
        freeN.to(FREE_E_GONE + OWNERS.F.length),
        {
          duration: 0.8,
        },
      ),
    );
    preempt.on('pays', () => {
      stage.play(
        fadeOut([cpuBox, cpuName, fFree], {
          duration: 0.2,
        }),
        ...crossfade(eOnCpu, eTableBack),
        ...cpuTiles.map((node, i) => to(node, (moved) => moved.at(...poolAt(backTo[i])))),
        freeN.to(FREE_E_GONE + OWNERS.F.length - backTo.length),
        {
          duration: 0.8,
          ease: smoother,
        },
      );
      stage.play(
        ...cover(backTo),
        brief(fadeIn(eHome), 0.08),
        brief(fadeAway(cpuTiles), 0.1, 0.08),
        {
          duration: 0.18,
        },
      );
    });
    preempt.on('continue', () =>
      stage.play(
        fadeIn(payTitle),
        lagged(
          payRows.map((node) =>
            fadeIn(node, {
              shift: [-14, 0],
            }),
          ),
          {
            lag: 0.3,
          },
        ),
        fadeIn(payNote),
        {
          duration: 0.7,
        },
      ),
    );
    const preemptName = place(
      T('Preemption', {
        italic: true,
        size: 90,
        color: 'yellow',
      }),
      -800,
      385,
    );
    preempt.on('call-preempt', () =>
      stage.play(
        write(preemptName),
        fadeOut(swapName, {
          duration: 0.25,
        }),
        {
          duration: 0.6,
        },
      ),
    );
    const planNote = place(
      T('Put it in your capacity plan', {
        size: 54,
        color: 'yellow',
      }),
      -800,
      472,
    );
    preempt.on('plan', () =>
      stage.play(write(planNote), {
        duration: 0.6,
      }),
    );
    stage.at(preempt.end - 0.45, () =>
      stage.play(
        ...hidePool(),
        fadeOut([
          ...fullPool.A,
          ...fullPool.S,
          ...eHome,
          aBlock2,
          aEntry2,
          tableA,
          eTableBack,
          freeCount,
          ...payRows,
          payTitle,
          payNote,
          preemptName,
          planNote,
          letterNote,
        ]),
        {
          duration: 0.4,
        },
      ),
    );
  }
}
