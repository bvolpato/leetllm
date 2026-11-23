import { draw, dynamic, fadeIn, indicate, line, linear, Node, rect } from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';

/** Saved work, growing reads. */
export function buildReads(
  stage,
  narration,
  { T, M, S, place, fadeOut, clearScene, arrive, clearFirst, handoff },
) {
  const reads = narration.scene('reads');
  sceneHeading(stage, reads, narration.title('reads'));
  {
    // One read row lengthens, step by step, and each length becomes one point on the chart.
    const R_MAX = 14,
      R_CELL = 96,
      R_LEFT = -800,
      R_Y = -350,
      AX = -800,
      AW = 1600,
      AY = 395,
      FLAT = AY - 50,
      CEIL = -170;
    const readSteps = stage.value(1);
    const stepNow = () => Math.max(1, Math.min(R_MAX, Math.floor(readSteps.value + 0.001)));
    const pointAt = (i) => [
      AX + (AW * (i - 1)) / (R_MAX - 1),
      FLAT - ((FLAT - CEIL) * (i - 1)) / (R_MAX - 1),
    ];
    const readRow2 = dynamic(() => {
      const count = stepNow(),
        node = new Node();
      for (let i = 0; i < count; i += 1)
        node.add(
          rect(R_CELL - 8, 84, {
            radius: 8,
            fill: i === count - 1 ? 'green' : 'teal',
            stroke: null,
          })
            .opacity(i === count - 1 ? 0.95 : 0.5)
            .at(R_LEFT + R_CELL / 2 + i * R_CELL, R_Y),
        );
      node.add(
        rect(count * R_CELL + 6, 106, {
          radius: 12,
          stroke: 'yellow',
          width: 5,
        }).at(R_LEFT + (count * R_CELL) / 2, R_Y),
      );
      return node;
    });
    const readCount = dynamic(() => {
      const count = stepNow();
      return place(
        M(`reads ${count}`, {
          size: 48,
          color: 'yellow',
        }),
        R_LEFT + 10,
        R_Y + 86,
      );
    });
    const newKey = place(
      M('green: the one new key and value', {
        size: 44,
        color: 'green',
      }),
      60,
      R_Y + 86,
    );
    const axisX = line([AX, AY], [AX + AW, AY], {
        stroke: 'dim',
        width: 3,
      }),
      axisY = line([AX, AY], [AX, CEIL - 62], {
        stroke: 'dim',
        width: 3,
      });
    const axisXName = S('tokens already in the conversation', {
      size: 44,
      color: 'dim',
    }).at(AX + AW / 2, AY + 50);
    const axisYName = place(
      S('work per step (illustrative)', {
        size: 40,
        color: 'dim',
      }),
      AX + 14,
      CEIL - 42,
    );
    const flatLine = line([AX, FLAT], [AX + AW, FLAT], {
      stroke: 'green',
      width: 7,
    });
    const flatNote = place(
      S('Computing one new key and value stays flat', {
        size: 48,
        color: 'green',
      }),
      -150,
      FLAT - 46,
    );
    const readLine = dynamic(() => {
      const count = stepNow(),
        node = new Node();
      for (let i = 1; i < count; i += 1)
        node.add(
          line(pointAt(i), pointAt(i + 1), {
            stroke: 'yellow',
            width: 6,
          }),
        );
      for (let i = 1; i <= count; i += 1)
        node.add(
          rect(22, 22, {
            radius: 11,
            fill: 'yellow',
            stroke: null,
          }).at(...pointAt(i)),
        );
      return node;
    });
    const shapeNote = place(
      T("Each point is one step's reads", {
        size: 60,
        color: 'yellow',
      }),
      AX + 40,
      CEIL + 120,
    );
    const slowerNote = place(
      T('Each step tends to get slower', {
        size: 54,
        color: 'yellow',
      }),
      170,
      90,
    );
    const ceilLine = line([AX, CEIL], [AX + AW, CEIL], {
      stroke: 'red',
      width: 5,
    }).dash([18, 12]);
    const ceilName = place(
      T('Memory bandwidth can become the limit', {
        size: 54,
        color: 'red',
      }),
      AX + 40,
      CEIL + 34,
    );
    const savedNote = place(
      T('The cache saves recomputing', {
        size: 72,
        color: 'green',
      }),
      AX + 40,
      CEIL + 170,
    );
    reads.at(0.1, () =>
      stage.play(
        draw(axisX),
        draw(axisY),
        draw(flatLine),
        fadeIn([axisXName, axisYName, flatNote, readRow2, readCount, newKey, readLine]),
        {
          duration: 0.4,
        },
      ),
    );
    reads.on('saves', () =>
      stage.play(
        fadeIn(savedNote),
        indicate(flatLine, {
          color: 'green',
          scale: 1,
        }),
        {
          duration: 0.6,
        },
      ),
    );
    const firstLeg = reads.cue('linear').start - reads.cue('still-reads').start,
      secondLeg = reads.cue('bandwidth').start - reads.cue('linear').start;
    reads.on('still-reads', () =>
      stage.play(readSteps.to(6), {
        duration: firstLeg,
        ease: linear,
      }),
    );
    reads.on('linear', () => {
      handoff(
        [savedNote],
        () =>
          arrive(fadeIn(shapeNote), {
            duration: 0.4,
          }),
        clearFirst,
      );
      stage.play(readSteps.to(R_MAX), {
        duration: secondLeg - 0.25,
        ease: linear,
      });
    });
    reads.on('slower', () =>
      stage.play(fadeIn(slowerNote), {
        duration: 0.5,
      }),
    );
    reads.on('bandwidth', () =>
      stage.play(
        draw(ceilLine),
        fadeIn(ceilName),
        fadeOut(shapeNote, {
          duration: 0.3,
        }),
        {
          duration: 0.6,
        },
      ),
    );
    clearScene(reads, [
      axisX,
      axisY,
      axisXName,
      axisYName,
      flatLine,
      flatNote,
      readRow2,
      readCount,
      newKey,
      readLine,
      shapeNote,
      slowerNote,
      ceilLine,
      ceilName,
    ]);
  }
}
