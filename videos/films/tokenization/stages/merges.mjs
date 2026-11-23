import assert from 'node:assert/strict';
import { fade, fadeIn, indicate, lagged, morph, rect, smoother, text, to } from 'vizmatic/stage';
import { label, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, leftText, wordLayout, pieceBox } from '../defaults.mjs';
import { CORPUS, HISTORY } from '../model.mjs';

/** Let the text choose its pieces. */
export function buildMerges(stage, narration, { clearAtEnd, handover }) {
  const merges = narration.scene('merges');
  sceneHeading(stage, merges, narration.title('merges'));
  const ROW_X = -700,
    ROW_YS = [-310, -160, -10];
  const layouts = HISTORY.map((step) =>
    step.words.map((word, i) => wordLayout(word, ROW_X, ROW_YS[i])),
  );
  const letterNodes = CORPUS.map(([word], i) =>
    [...word].map((ch, k) =>
      text(ch, {
        font: 'mono',
        size: 92,
      })
        .at(layouts[0][i].letters[k].x, layouts[0][i].letters[k].y)
        .zIndex(3),
    ),
  );
  const multipliers = CORPUS.map(([, times], i) =>
    label(`× ${times}`, -880, ROW_YS[i], {
      size: 70,
      color: 'yellow',
      font: 'mono',
    }),
  );
  const boxes = layouts.map((step) =>
    step.map((word) =>
      word.pieces.map((piece) => pieceBox(piece, piece.text.length > 1 ? 'yellow' : 'blue')),
    ),
  );
  // The counter waits for the voice to say thirty.
  const STAT_X = 140,
    BAR_X = 390,
    BAR_UNIT = 62,
    BAR_MAX = Math.max(
      ...HISTORY.slice(1).flatMap((step) => step.ranked.map((entry) => entry.count)),
    );
  const positionNumbers = HISTORY.map((step) =>
    text(String(step.positions), {
      font: 'mono',
      size: 240,
      color: 'yellow',
    }).moveTo([STAT_X + 150, -320]),
  );
  const pendingNumber = text('?', { font: 'mono', size: 240, color: 'yellow' }).moveTo([
    STAT_X + 150,
    -320,
  ]);
  const positionLabel = text('positions', {
    size: 76,
    color: 'dim',
  })
    .moveTo([0, -300])
    .alignTo([STAT_X + 340, 0], 'left');
  const pairPanel = (step) => {
    const shown = HISTORY[step + 1].ranked.slice(0, 5);
    const inputs = [],
      results = [];
    shown.forEach((entry, i) => {
      const y = -130 + i * 92,
        won = i === 0;
      inputs.push(
        text(entry.pair, {
          font: 'mono',
          size: 66,
          color: 'ink',
        })
          .moveTo([0, entry.pair.includes('y') ? y + 9 : y])
          .alignTo([STAT_X, 0], 'left'),
        rect(BAR_MAX * BAR_UNIT, 56, {
          radius: 6,
          fill: 'surface',
          stroke: 'dim',
          width: 1.5,
        })
          .moveTo([0, y])
          .alignTo([BAR_X, 0], 'left'),
      );
      results.push([
        rect(entry.count * BAR_UNIT, 56, {
          radius: 6,
          fill: won ? 'yellow' : 'dim',
          stroke: null,
        })
          .moveTo([0, y])
          .alignTo([BAR_X, 0], 'left'),
        text(String(entry.count), {
          font: 'mono',
          size: 66,
          color: won ? 'yellow' : 'ink',
        })
          .moveTo([0, y])
          .alignTo([BAR_X + BAR_MAX * BAR_UNIT + 48, 0], 'left'),
      ]);
    });
    return { inputs, results, all: [...inputs, ...results.flat()] };
  };
  const panels = [0, 1, 2].map(pairPanel);
  const weightSum = CORPUS.map(([, times]) => times);
  assert.equal(
    weightSum.reduce((a, b) => a + b, 0),
    HISTORY[1].merged.count,
  );
  const weightNote = leftText(`r a = ${weightSum.join(' + ')} = ?`, STAT_X, 340, {
    font: 'mono',
    size: 60,
    color: 'yellow',
  });
  const weightAnswer = leftText(
    `r a = ${weightSum.join(' + ')} = ${HISTORY[1].merged.count}`,
    STAT_X,
    340,
    { font: 'mono', size: 60, color: 'yellow' },
  );
  const subtractions = HISTORY.slice(1).map((step, i) => ({
    pending: leftText(`${HISTORY[i].positions} − ${step.merged.count} = ?`, STAT_X, 340, {
      font: 'mono',
      size: 60,
      color: 'yellow',
    }),
    result: leftText(
      `${HISTORY[i].positions} − ${step.merged.count} = ${step.positions}`,
      STAT_X,
      340,
      { font: 'mono', size: 60, color: 'green' },
    ),
  }));
  const pendingTotal = (i) => {
    positionNumbers[i].opacity(0);
    if (i) subtractions[i - 1].result.opacity(0);
    return [fade(pendingNumber, 1), fadeIn(subtractions[i].pending)];
  };
  const revealTotal = (i) => {
    pendingNumber.opacity(0);
    subtractions[i].pending.opacity(0);
    stage.play(fadeIn([positionNumbers[i + 1], subtractions[i].result]), { duration: 0.3 });
  };
  const tieNote = leftText('Tie: first seen wins\n(our classroom rule)', STAT_X, 425, {
    size: 44,
    color: 'dim',
    leading: 1.12,
    align: 'left',
  });
  // The empty list is there from the start, and each merge fills a line of it.
  const recipeSlots = [0, 1, 2].map((i) =>
    rect(930, 100, {
      radius: 12,
      fill: 'surface',
      stroke: 'grid',
      width: 1.5,
    })
      .moveTo([0, 170 + i * 112])
      .alignTo([-900, 0], 'left'),
  );
  const recipeHead = leftText('merge list', -880, 84, {
    size: 44,
    color: 'dim',
  });
  const recipeLines = HISTORY.slice(1).map((step, i) =>
    label(
      `${i + 1}.  ${step.merged.left} + ${step.merged.right}  →  ${step.merged.left + step.merged.right}`,
      -880,
      170 + i * 112,
      {
        font: 'mono',
        size: 74,
        color: 'ink',
      },
    ),
  );
  const glue = (step, duration) => {
    const before = layouts[step],
      after = layouts[step + 1];
    const joinDuration = Math.min(0.2, duration / 3),
      travelDuration = duration - joinDuration;
    const anims = [];
    after.forEach((word, i) => {
      word.pieces.forEach((piece, k) => {
        const sources = before[i].pieces.filter(
          (source) => source.from >= piece.from && source.to <= piece.to,
        );
        const sourceBoxes = sources.map(
          (source) => boxes[step][i][before[i].pieces.indexOf(source)],
        );
        let outline = sourceBoxes[0];
        if (sources.length > 1) {
          const left = Math.min(...sources.map((source) => source.x - source.width / 2)),
            right = Math.max(...sources.map((source) => source.x + source.width / 2));
          outline = pieceBox({ ...piece, x: (left + right) / 2, width: right - left }, 'yellow');
          // Remove interior edges before moving letters inside their shared outline.
          anims.push(
            brief(fadeOut(sourceBoxes), joinDuration, 0, LINEAR),
            brief(fadeIn(outline), joinDuration, 0, LINEAR),
          );
        }
        anims.push(
          brief(morph(outline, boxes[step + 1][i][k]), travelDuration, joinDuration, smoother),
        );
      });
      word.letters.forEach((spot, k) =>
        anims.push(
          brief(
            to(letterNodes[i][k], (node) => node.at(spot.x, spot.y)),
            travelDuration,
            joinDuration,
            smoother,
          ),
        ),
      );
    });
    return anims;
  };
  merges.at(0.05, () =>
    stage.play(
      lagged(
        letterNodes.flat().map((node) =>
          fadeIn(node, {
            scale: 0.8,
          }),
        ),
        {
          lag: 0.02,
        },
      ),
      fadeIn(multipliers),
      fadeIn(recipeSlots),
      fadeIn(recipeHead),
      {
        duration: 0.45,
      },
    ),
  );
  merges.on('corpus', () =>
    stage.play(
      lagged(
        multipliers.map((node) =>
          indicate(node, {
            color: 'ink',
            scale: 1.15,
          }),
        ),
        {
          lag: 0.9,
        },
      ),
      {
        duration: 2.4,
      },
    ),
  );
  merges.on('letters', () =>
    stage.play(
      lagged(
        boxes[0].flat().map((node) =>
          fadeIn(node, {
            scale: 0.7,
          }),
        ),
        {
          lag: 0.04,
        },
      ),
      {
        duration: 1,
      },
    ),
  );
  merges.after('thirty', () =>
    stage.play(
      fadeIn([positionNumbers[0], positionLabel], {
        shift: [0, 10],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  merges.on('count-pairs', () =>
    stage.play(
      fadeIn(panels[0].inputs, {
        lag: 0.04,
        shift: [20, 0],
      }),
      {
        duration: 0.6,
      },
    ),
  );
  merges.on('weights', () =>
    stage.play(
      fadeIn(weightNote, {
        shift: [0, 10],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  merges.on('pair-value', () =>
    stage.play(indicate(weightNote, { color: 'ink', scale: 1.02 }), { duration: 0.4 }),
  );
  merges.after('pair-count', () => {
    weightNote.opacity(0);
    stage.play(fadeIn([weightAnswer, ...panels[0].results[0]]), { duration: 0.35 });
  });
  merges.after('ai-count', () =>
    stage.play(fadeIn(panels[0].results.slice(1).flat()), { duration: 0.35 }),
  );
  merges.on('tie', () =>
    stage.play(
      fadeIn(tieNote, {
        shift: [0, 10],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  merges.after('glue-ra', () => {
    weightAnswer.opacity(0);
    tieNote.opacity(0);
    stage.play(...pendingTotal(0), ...glue(0, 1), {
      duration: 1,
      ease: smoother,
    });
    stage.play(
      fadeIn(recipeLines[0], {
        shift: [-16, 0],
      }),
      {
        duration: 0.4,
      },
    );
  });
  merges.after('twenty-three', () => revealTotal(0));
  merges.on('recount', () =>
    handover(
      panels[0].all,
      fadeIn(panels[1].inputs, {
        shift: [20, 0],
      }),
    ),
  );
  merges.after('glue-rai', () => {
    stage.play(
      fadeIn(panels[1].results.flat()),
      ...pendingTotal(1),
      ...glue(1, 0.6),
      fadeIn(recipeLines[1], { shift: [-16, 0] }),
      { duration: 0.6, ease: smoother },
    );
  });
  merges.after('sixteen-positions', () => revealTotal(1));
  merges.on('glue-rain', () => {
    stage.play(
      brief(fadeOut(panels[1].all), 0.18, 0, LINEAR),
      brief(
        fadeIn(panels[2].inputs, {
          lag: 0.04,
          shift: [20, 0],
        }),
        0.26,
        0.14,
      ),
    );
  });
  merges.after('rain-count', () => {
    stage.play(
      fadeIn(panels[2].results.flat()),
      ...pendingTotal(2),
      ...glue(2, 0.6),
      fadeIn(recipeLines[2], { shift: [-16, 0] }),
      { duration: 0.6, ease: smoother },
    );
  });
  merges.after('eleven', () => {
    revealTotal(2);
    stage.play(
      to(positionLabel, (node) => node.color('green'), {
        duration: 0.4,
      }),
    );
  });
  merges.on('eleven-start', () =>
    stage.play(indicate(positionLabel, { color: 'green' }), { duration: 0.4 }),
  );
  merges.after(
    'eleven',
    () =>
      stage.play(
        fadeOut(panels[2].all, {
          duration: 0.4,
        }),
      ),
    1.2,
  );
  merges.on('merge-list', () =>
    stage.play(
      ...recipeLines.map((line2) =>
        to(line2, (node) => node.color('yellow'), {
          duration: 0.5,
        }),
      ),
      {
        duration: 0.5,
      },
    ),
  );
  const finalPieces = layouts[3].flatMap((word, i) =>
    word.pieces.map((piece) => letterNodes[i].slice(piece.from, piece.to + 1)),
  );
  merges.on('stopped', () =>
    stage.play(
      lagged(
        recipeLines.map((node) =>
          indicate(node, {
            color: 'ink',
            scale: 1.03,
          }),
        ),
        {
          lag: 0.3,
        },
      ),
      {
        duration: 0.9,
      },
    ),
  );
  merges.on('frequent', () =>
    stage.play(
      indicate(finalPieces.filter((letters) => letters.length > 1).flat(), {
        color: 'yellow',
        scale: 1.1,
      }),
      {
        duration: 0.8,
      },
    ),
  );
  merges.on('fragments', () =>
    stage.play(
      indicate(finalPieces.filter((letters) => letters.length === 1).flat(), {
        color: 'red',
        scale: 1.2,
      }),
      {
        duration: 0.8,
      },
    ),
  );
  clearAtEnd(merges, [
    ...letterNodes.flat(),
    ...boxes[3].flat(),
    ...multipliers,
    positionNumbers[3],
    subtractions[2].result,
    positionLabel,
    ...recipeSlots,
    recipeHead,
  ]);
  return {
    recipeLines,
  };
}
