import assert from 'node:assert/strict';
import {
  Node,
  fade,
  fadeIn,
  fadeOut,
  indicate,
  lagged,
  rect,
  smoother,
  text,
} from 'vizmatic/stage';
import { row, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { brief, leftText, tile } from '../defaults.mjs';
import { close, mebibytes, dropOf } from '../model.mjs';

/** Every row has a price. */
export function buildEconomics(
  stage,
  narration,
  { clearAtEnd, handover, flash, replaceNote, nudge },
) {
  const economics = narration.scene('economics');
  sceneHeading(stage, economics, narration.title('economics'));
  {
    const FORMULA_Y = 30,
      FORMULA_TOP = -340;
    const factors = [
      tile('rows', {
        font: 'sans',
        size: 64,
        color: 'blue',
        h: 120,
      }),
      text('×', {
        size: 64,
        color: 'dim',
      }),
      tile('hidden size', {
        font: 'sans',
        size: 64,
        color: 'teal',
        h: 120,
      }),
      text('×', {
        size: 64,
        color: 'dim',
      }),
      tile('bytes per number', {
        font: 'sans',
        size: 64,
        color: 'teal',
        h: 120,
      }),
      text('×', {
        size: 64,
        color: 'dim',
      }),
      tile('2 if separate', {
        font: 'sans',
        size: 64,
        color: 'yellow',
        h: 120,
      }),
    ];
    row(factors, FORMULA_Y, 22);
    const illustrateNote = text(
      'For illustration: hidden size 4096, 2 bytes per number, separate tables',
      {
        size: 48,
        color: 'dim',
      },
    ).at(0, -245);
    const COST_ROWS = [32_000, 128_000, 1_000_000];
    const COST_X = -410,
      COST_UNIT = 0.066,
      COST_Y = -135,
      COST_STEP = 120;
    const costRows = COST_ROWS.map((rows, i) => {
      const y = COST_Y + i * COST_STEP,
        cost = mebibytes(rows),
        color = i === 2 ? 'red' : 'blue';
      return {
        name: leftText(`${rows.toLocaleString('en-US')} rows`, -880, y, {
          font: 'mono',
          size: 54,
        }),
        track: rect(mebibytes(COST_ROWS[2]) * COST_UNIT, 84, {
          radius: 6,
          fill: 'surface',
          stroke: 'dim',
          width: 2,
        })
          .moveTo([0, y])
          .alignTo([COST_X, 0], 'left'),
        bar: rect(Math.max(4, cost * COST_UNIT), 84, {
          radius: 6,
          fill: color,
          stroke: null,
        })
          .moveTo([0, y])
          .alignTo([COST_X, 0], 'left')
          .zIndex(1),
        value:
          i === 2
            ? text(`${cost.toLocaleString('en-US')} MiB`, {
                font: 'mono',
                size: 54,
                color: 'bg',
              })
                .at(COST_X + cost * COST_UNIT - 200, y)
                .zIndex(2)
            : leftText(`${cost.toLocaleString('en-US')} MiB`, COST_X + cost * COST_UNIT + 18, y, {
                font: 'mono',
                size: 54,
                color,
              }).zIndex(2),
      };
    });
    const costParts = costRows.flatMap((entry) => [
      entry.name,
      entry.track,
      entry.bar,
      entry.value,
    ]);
    const billionNote = text('about 16 billion bytes, before a single transformer layer', {
      font: 'text-serif',
      size: 62,
      color: 'yellow',
    }).at(0, 260);
    factors.forEach((node) => node.opacity(0));
    economics.at(0.1, () =>
      stage.play(...factors.map((node) => fade(node, 0.55)), {
        duration: 0.35,
      }),
    );
    economics.on('price', () =>
      stage.play(
        fade(factors[0], 1),
        flash(factors[0], {
          scale: 1.08,
        }),
        {
          duration: 0.7,
        },
      ),
    );
    economics.on('hidden', () =>
      stage.play(
        lagged(
          factors.slice(1, 5).map((node) => fade(node, 1)),
          {
            lag: 0.2,
          },
        ),
        {
          duration: 0.7,
        },
      ),
    );
    economics.on('double', () =>
      stage.play(...factors.slice(5).map((node) => fade(node, 1)), {
        duration: 0.4,
      }),
    );
    economics.on('illustrate', () =>
      stage.play(
        ...factors.map((node) => nudge(node, 0, FORMULA_TOP - FORMULA_Y)),
        brief(fadeIn(illustrateNote), 0.4, 0.85),
        {
          duration: 0.9,
          ease: smoother,
        },
      ),
    );
    const showCost = (entry, shift, ...others) =>
      stage.play(
        fadeIn(entry.bar, {
          shift: [-shift, 0],
        }),
        fadeIn(entry.value),
        ...others,
        {
          duration: 0.5,
        },
      );
    ['c32', 'c128', 'c1m'].forEach((cue, i) =>
      economics.on(cue, () =>
        stage.play(fadeIn([costRows[i].name, costRows[i].track]), { duration: 0.35 }),
      ),
    );
    ['cost32', 'cost128', 'cost1m'].forEach((cue, i) =>
      economics.after(cue, () => showCost(costRows[i], 20)),
    );
    ['cost-value32', 'cost-value128', 'cost-value1m'].forEach((cue, i) =>
      economics.on(cue, () =>
        stage.play(indicate(costRows[i].track, { color: 'yellow', scale: 1 }), { duration: 0.4 }),
      ),
    );
    economics.after('billion', () => stage.play(fadeIn(billionNote), { duration: 0.4 }));
    assert.equal(mebibytes(COST_ROWS[0]), 500);
    assert.equal(mebibytes(COST_ROWS[1]), 2000);

    // Show the toy rates first, then give the reported rates their own construction.
    const rateNote = text('positions = characters ÷ characters per token', {
      font: 'text-serif',
      size: 66,
    }).at(0, -290);
    const ruleNote = text('drop = 1 − old rate ÷ new rate', {
      font: 'mono',
      size: 58,
      color: 'yellow',
    }).at(0, -200);
    const STRIP = 12,
      CELL = 44;
    const stripRow = (rate, y, color) => {
      const count = STRIP / rate;
      assert(Number.isInteger(count));
      const node = new Node();
      for (let i = 0; i < count; i++)
        node.add(
          rect(rate * CELL - 8, 90, {
            radius: 8,
            fill: 'surface',
            stroke: color,
            width: 3,
          }).at(-520 + (i + 0.5) * rate * CELL, y),
        );
      for (let i = 0; i < STRIP; i++)
        node.add(
          rect(4, 34, {
            fill: color,
            stroke: null,
          }).at(-520 + (i + 0.5) * CELL, y),
        );
      node.add(
        leftText(`${rate} per token`, -880, y, {
          font: 'mono',
          size: 44,
        }),
        leftText(`${count} positions`, 40, y, {
          font: 'mono',
          size: 54,
          color,
        }),
      );
      return node;
    };
    const stripA = stripRow(3, 30, 'blue'),
      stripB = stripRow(4, 150, 'green');
    const dropNote = leftText(`${Math.round(dropOf(3, 4) * 100)}% drop`, 420, 150, {
      font: 'mono',
      size: 54,
      color: 'green',
    });
    const gainNote = leftText(`rate up by a third`, 420, 215, {
      font: 'mono',
      size: 44,
      color: 'teal',
    });
    close(4 / 3 - 1, 1 / 3);
    const slot = (content, y, options = {}) =>
      text(content, {
        font: 'text-serif',
        size: 66,
        ...options,
      }).at(0, y);
    const llamaNote = slot('Report rates on a sample of English', 280, {
      size: 48,
    });
    const englishRates = [3.17, 3.94];
    const positionRatio = englishRates[0] / englishRates[1];
    const comparisonRule = text(
      `comparison drop = 1 − (${englishRates[0]} ÷ ${englishRates[1]})²`,
      { font: 'mono', size: 50, color: 'yellow' },
    ).at(0, -200);
    const realYs = [-60, 50];
    const realInputs = englishRates.map((rate, i) =>
      leftText(`Llama ${i + 2}\n${rate} chars/token`, -880, realYs[i], {
        font: 'mono',
        size: 40,
        color: i === 0 ? 'blue' : 'green',
      }),
    );
    const realTracks = realYs.map((y) =>
      rect(620, 50, { radius: 5, fill: 'surface', stroke: 'dim', width: 2 })
        .moveTo([0, y])
        .alignTo([-400, 0], 'left'),
    );
    const positionBar = (fraction, y, color) =>
      rect(620 * fraction, 50, { radius: 5, fill: color, stroke: null })
        .moveTo([0, y])
        .alignTo([-400, 0], 'left');
    const realReference = positionBar(1, realYs[0], 'blue');
    const realResult = positionBar(positionRatio, realYs[1], 'green');
    const realReferenceLabel = leftText('100% positions', 300, realYs[0], {
      font: 'mono',
      size: 44,
      color: 'blue',
    });
    const realResultLabel = leftText(
      `${(positionRatio * 100).toFixed(1)}% positions`,
      300,
      realYs[1],
      {
        font: 'mono',
        size: 44,
        color: 'green',
      },
    );
    const realQuestion = leftText('?', 300, realYs[1], {
      font: 'mono',
      size: 64,
      color: 'yellow',
    });
    const realPicture = [
      text('Same text; relative positions', { size: 42, color: 'dim' }).at(0, -130),
      ...realInputs,
      ...realTracks,
      realReference,
      realReferenceLabel,
      realQuestion,
    ];
    const comparisonNodes = [
      ...[1, positionRatio].flatMap((fraction, i) => {
        const x = i === 0 ? -440 : 440;
        const width = 160 * fraction;
        const y = 300 - width / 2;
        const color = i === 0 ? 'blue' : 'green';
        return [
          text(`Llama ${i + 2}`, { font: 'mono', size: 32, color }).at(x, 125),
          rect(width, width, { fill: 'surface', stroke: color, width: 3 }).at(x, y),
          text(`${Math.round(fraction ** 2 * 100)}%`, { font: 'mono', size: 42, color }).at(x, y),
        ];
      }),
      text('comparisons\n∝ positions²', { size: 40, color: 'dim' }).at(0, 220),
    ];
    const twentyNote = slot(
      `If those rates held: about ${Math.round(dropOf(...englishRates) * 100)}% fewer positions`,
      280,
      {
        color: 'green',
      },
    );
    const thirtyNote = slot(
      `and about ${Math.round((1 - (englishRates[0] / englishRates[1]) ** 2) * 100)}% fewer comparisons`,
      375,
      {
        color: 'green',
      },
    );
    const wholeNote = slot('English sample across two complete tokenizers', 280, {
      color: 'yellow',
    });
    const noImpact = text('The report: 28,000 added tokens, no impact on English tokenization', {
      size: 50,
      color: 'dim',
    }).at(0, 375);
    economics.on('rate', () =>
      handover(
        [...factors, illustrateNote, ...costParts, billionNote],
        fadeIn(rateNote, {
          shift: [0, 10],
        }),
        fadeIn(stripA),
      ),
    );
    economics.on('rule', () =>
      stage.play(
        fadeIn(ruleNote, {
          shift: [0, 10],
        }),
        {
          duration: 0.4,
        },
      ),
    );
    economics.on('demo', () => stage.play(fadeIn(stripB), { duration: 0.5 }));
    economics.after('drop', () => stage.play(fadeIn(dropNote), { duration: 0.4 }));
    economics.on('drop-value', () =>
      stage.play(indicate(ruleNote, { color: 'yellow', scale: 1.02 }), { duration: 0.4 }),
    );
    economics.on('gain', () =>
      stage.play(
        fadeIn(gainNote, {
          shift: [-10, 0],
        }),
        {
          duration: 0.4,
        },
      ),
    );
    economics.on('llama', () =>
      replaceNote(
        [stripA, stripB, dropNote, gainNote],
        fadeIn(realPicture),
        fadeIn(llamaNote, { shift: [0, 10] }),
      ),
    );
    economics.after('twenty', () =>
      replaceNote([llamaNote, realQuestion], fadeIn([realResult, realResultLabel, twentyNote])),
    );
    economics.on('twenty-value', () =>
      stage.play(indicate(realTracks[1], { color: 'yellow', scale: 1 }), { duration: 0.4 }),
    );
    economics.on('thirtyfive-value', () =>
      stage.play(indicate(realTracks, { color: 'yellow', scale: 1 }), { duration: 0.4 }),
    );
    economics.after('thirtyfive', () =>
      stage.play(
        brief(fadeOut(twentyNote), 0.18, 0, (t) => t),
        brief(fadeOut(ruleNote), 0.18, 0, (t) => t),
        brief(fadeIn([...comparisonNodes, comparisonRule]), 0.4, 0.18),
        brief(fadeIn(thirtyNote, { shift: [0, 8] }), 0.4),
      ),
    );
    economics.after('whole', () =>
      replaceNote(
        [twentyNote, thirtyNote, ...comparisonNodes, comparisonRule],
        fadeIn(wholeNote),
        fadeIn(noImpact),
        fadeIn(ruleNote),
      ),
    );
    const PANEL_Y = -90;
    const leftPanel = rect(840, 490, {
      radius: 18,
      fill: 'surface',
      stroke: 'blue',
      width: 3,
    }).at(-440, PANEL_Y);
    const rightPanel = rect(840, 490, {
      radius: 18,
      fill: 'surface',
      stroke: 'yellow',
      width: 3,
    }).at(440, PANEL_Y);
    const costHead = text('Memory cost', {
      font: 'text-serif',
      size: 78,
      color: 'blue',
    }).at(-440, PANEL_Y - 170);
    // The cost is known, so its bars are to scale. The saving is not, so its tracks stay empty.
    const MINI_YS = [PANEL_Y - 85, PANEL_Y - 30, PANEL_Y + 25],
      MINI_X = -810,
      MINI_UNIT = 0.03;
    const miniCosts = COST_ROWS.flatMap((rows, i) => {
      const cost = mebibytes(rows),
        width = Math.max(4, cost * MINI_UNIT),
        color = i === 2 ? 'red' : 'blue';
      return [
        rect(width, 38, {
          radius: 5,
          fill: color,
          stroke: null,
        })
          .moveTo([0, MINI_YS[i]])
          .alignTo([MINI_X, 0], 'left'),
        leftText(`${cost.toLocaleString('en-US')} MiB`, MINI_X + width + 14, MINI_YS[i], {
          font: 'mono',
          size: 36,
          color,
        }),
      ];
    });
    const costFact = text('Fixed by arithmetic', {
      size: 62,
    }).at(-440, PANEL_Y + 155);
    const saveHead = text('Sequence saving', {
      font: 'text-serif',
      size: 78,
      color: 'yellow',
    }).at(440, PANEL_Y - 170);
    const sizesNote = text('The same three sizes, for illustration', {
      size: 40,
      color: 'dim',
    }).at(-440, PANEL_Y + 75);
    const miniSaves = ['your languages', 'your code', 'your numbers'].flatMap((name, i) => [
      leftText(name, 70, MINI_YS[i], {
        size: 40,
      }),
      rect(280, 38, {
        radius: 5,
        fill: 'surface',
        stroke: 'dim',
        width: 2,
      })
        .moveTo([0, MINI_YS[i]])
        .alignTo([400, 0], 'left'),
      leftText('?', 700, MINI_YS[i], {
        font: 'mono',
        size: 44,
        color: 'yellow',
      }),
    ]);
    const saveFact = text('One prompt tells you little', {
      size: 62,
    }).at(440, PANEL_Y + 155);
    const measureNote = text('Measure representative text before you pay for the rows', {
      font: 'text-serif',
      size: 66,
      color: 'green',
    }).at(0, 280);
    economics.onBeat(3, () =>
      stage.play(
        ...[
          rateNote,
          ruleNote,
          stripA,
          stripB,
          dropNote,
          gainNote,
          wholeNote,
          noImpact,
          ...realPicture,
          realResult,
          realResultLabel,
          comparisonRule,
          ...comparisonNodes,
        ]
          .filter((node) => node !== realReference && node !== realResult)
          .map((node) => brief(fadeOut(node), 0.18, 0, (t) => t)),
        ...[realReference, realResult].map((node) => brief(fadeOut(node), 0.3, 0.18, (t) => t)),
        brief(fadeIn([leftPanel, rightPanel, costHead, saveHead]), 0.3, 0.18),
      ),
    );
    economics.on('fixed', () =>
      stage.play(
        fadeIn([...miniCosts, sizesNote, costFact], {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    economics.on('depends', () =>
      stage.play(
        fadeIn([...miniSaves, saveFact], {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    economics.on('measure', () =>
      stage.play(
        fadeIn(measureNote, {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    clearAtEnd(economics, [
      leftPanel,
      rightPanel,
      costHead,
      ...miniCosts,
      sizesNote,
      costFact,
      saveHead,
      ...miniSaves,
      saveFact,
      measureNote,
    ]);
  }
}
