import assert from 'node:assert/strict';
import {
  Node,
  arrow,
  concat,
  draw,
  dynamic,
  fadeIn,
  lagged,
  rect,
  rectPath,
  smoother,
  text,
  to,
} from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, leftText, tile } from '../defaults.mjs';
import { WINDOW_CELLS, ENGLISH_CELLS } from '../model.mjs';

/** The same content can cost far more tokens. */
export function buildInflation(stage, narration, { clearAtEnd }) {
  const inflation = narration.scene('inflation');
  sceneHeading(stage, inflation, narration.title('inflation'));
  {
    const fertilityNote = text('Fertility: tokens per word, or per another unit of text', {
      font: 'text-serif',
      size: 62,
    }).at(0, -345);
    const studyNote = text(
      'A 2023 study: translations of the same content, with a ChatGPT tokenizer of the time',
      {
        size: 42,
        color: 'dim',
      },
    ).at(0, -270);
    const LANGUAGES = [
      ['English', 1, 'blue'],
      ['Italian', 1.6, 'teal'],
      ['Shan', 15, 'red'],
    ];
    const LANG_X = -600,
      LANG_UNIT = 98,
      ROW_YS = [-170, -70, 30],
      BAR_H = 76;
    assert.equal(15 * LANG_UNIT, 1470);
    // Each bar grows from the baseline of its own track, so it never crosses its label.
    const langRows = LANGUAGES.map(([name, ratio, color], i) => {
      const y = ROW_YS[i],
        width = ratio * LANG_UNIT,
        amount = stage.value(0);
      const bar = dynamic(() =>
        amount.value < 1
          ? null
          : rect(amount.value, BAR_H, {
              radius: 6,
              fill: color,
              stroke: null,
            })
              .moveTo([0, y])
              .alignTo([LANG_X, 0], 'left'),
      );
      const value =
        ratio === 15
          ? text('about 15 times', {
              font: 'mono',
              size: 50,
              color: 'bg',
            })
              .at(LANG_X + width - 230, y)
              .zIndex(2)
          : leftText(ratio === 1 ? 'baseline' : 'about 1.6 times', LANG_X + width + 18, y, {
              font: 'mono',
              size: 50,
              color,
            }).zIndex(2);
      const track = rect(15 * LANG_UNIT, BAR_H, {
        radius: 6,
        fill: 'surface',
        stroke: 'dim',
        width: 2,
      })
        .moveTo([0, y])
        .alignTo([LANG_X, 0], 'left');
      return {
        name: leftText(name, -880, y, {
          font: 'text-serif',
          size: 62,
        }),
        track,
        bar,
        value,
        grow: (seconds) =>
          amount.to(width, {
            duration: seconds,
            ease: smoother,
          }),
      };
    });
    const widestNote = text('The widest gap the study found for that tokenizer', {
      size: 48,
      color: 'yellow',
    }).at(0, 110);
    inflation.at(0.1, () =>
      stage.play(fadeIn(langRows.flatMap((entry) => [entry.name, entry.track])), {
        duration: 0.35,
      }),
    );
    inflation.on('fertility', () =>
      stage.play(
        fadeIn(fertilityNote, {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    const showBar = (entry, seconds) =>
      stage.play(
        fadeIn(entry.bar),
        entry.grow(seconds),
        brief(fadeIn(entry.value), 0.3, seconds * 0.9),
      );
    inflation.on('study', () => {
      stage.play(fadeIn(studyNote), {
        duration: 0.01,
      });
      showBar(langRows[0], 0.5);
    });
    inflation.on('shan', () => showBar(langRows[2], 1.1));
    inflation.on('widest', () =>
      stage.play(
        fadeIn(widestNote, {
          shift: [0, 8],
        }),
        {
          duration: 0.4,
        },
      ),
    );
    inflation.on('italian', () => showBar(langRows[1], 0.5));

    // Three places it shows up: a table with one row per language and one small picture per effect.
    // The names keep their places in the table, and nothing travels across the pictures.
    const COLUMN_XS = [-640, -130, 380],
      COLUMN_W = 440,
      ROW_H = 110,
      HEAD_Y = -280,
      EFFECT_YS = [-110, 70],
      NOTE_Y = 190;
    const heads = ['Input price', 'Context window', 'Processing time'].map((name, c) =>
      tile(name, {
        font: 'sans',
        size: 52,
        color: 'yellow',
        h: 92,
        min: COLUMN_W,
      }).at(COLUMN_XS[c] + COLUMN_W / 2, HEAD_Y),
    );
    const cellTrack = (c, r) =>
      rect(COLUMN_W, ROW_H, {
        radius: 8,
        fill: 'surface',
        stroke: 'dim',
        width: 2,
      })
        .moveTo([0, EFFECT_YS[r]])
        .alignTo([COLUMN_XS[c], 0], 'left');
    const tracks = [0, 1, 2].flatMap((c) => [cellTrack(c, 0), cellTrack(c, 1)]);
    const shanRatio = LANGUAGES[2][1];
    assert.equal(ENGLISH_CELLS * shanRatio, WINDOW_CELLS);
    // At one price per token, cost follows the token count, so these bars use the study's ratio.
    const priceUnit = COLUMN_W / shanRatio;
    const priceBars = [1, shanRatio].map((ratio, r) =>
      rect(ratio * priceUnit, ROW_H - 16, {
        radius: 6,
        fill: r ? 'red' : 'blue',
        stroke: null,
      })
        .moveTo([0, EFFECT_YS[r]])
        .alignTo([COLUMN_XS[0], 0], 'left')
        .zIndex(1),
    );
    const priceValues = [
      leftText('1 ×', COLUMN_XS[0] + priceUnit + 16, EFFECT_YS[0], {
        font: 'mono',
        size: 50,
        color: 'blue',
      }).zIndex(2),
      text('about 15 ×', {
        font: 'mono',
        size: 50,
        color: 'bg',
      })
        .at(COLUMN_XS[0] + COLUMN_W / 2, EFFECT_YS[1])
        .zIndex(2),
    ];
    const priceNote = text("at one price per token,\nwith the study's tokenizer", {
      size: 42,
      color: 'dim',
      leading: 1.15,
    }).at(COLUMN_XS[0] + COLUMN_W / 2, NOTE_Y + 24);
    // The same toy window for both rows. Each cell is one token of the same content.
    const SLOT = COLUMN_W / WINDOW_CELLS;
    const windowCells = [ENGLISH_CELLS, WINDOW_CELLS].map((count, r) =>
      new Node(
        concat(
          ...Array.from(
            {
              length: count,
            },
            (_, i) => rectPath(COLUMN_XS[1] + i * SLOT + 2, EFFECT_YS[r] - 42, SLOT - 4, 84, 2),
          ),
        ),
      )
        .fill(r ? 'red' : 'blue')
        .zIndex(1),
    );
    const windowNote = text('toy window, to scale', {
      size: 42,
      color: 'dim',
    }).at(COLUMN_XS[1] + COLUMN_W / 2, NOTE_Y);
    // The voice only says longer, so these arrows carry no ratio, and the note says so.
    const timeArrows = [
      [110, 'blue'],
      [COLUMN_W - 30, 'red'],
    ].map(([length, color], r) =>
      arrow([COLUMN_XS[2] + 14, EFFECT_YS[r]], [COLUMN_XS[2] + 14 + length, EFFECT_YS[r]], {
        stroke: color,
        width: 8,
        tip: 30,
      }).zIndex(1),
    );
    const timeNote = text('longer, not to scale', {
      size: 42,
      color: 'dim',
    }).at(COLUMN_XS[2] + COLUMN_W / 2, NOTE_Y);
    const measureLang = text('Measure your own languages, using comparable content', {
      font: 'text-serif',
      size: 68,
      color: 'green',
    }).at(0, 320);
    inflation.onBeat(1, () =>
      stage.play(
        brief(
          fadeOut([
            fertilityNote,
            studyNote,
            widestNote,
            langRows[1].name,
            ...langRows.flatMap((entry) => [entry.track, entry.bar, entry.value]),
          ]),
          0.2,
          0,
          LINEAR,
        ),
        brief(
          to(langRows[0].name, (node) => node.at(node.get('x'), EFFECT_YS[0]).color('blue')),
          0.4,
          0.05,
        ),
        brief(
          to(langRows[2].name, (node) => node.at(node.get('x'), EFFECT_YS[1]).color('red')),
          0.4,
          0.05,
        ),
        brief(fadeIn([...heads, ...tracks]), 0.4, 0.12),
      ),
    );
    inflation.on('price', () =>
      stage.play(
        lagged(
          priceBars.map((node) =>
            fadeIn(node, {
              shift: [-14, 0],
            }),
          ),
          {
            lag: 0.4,
          },
        ),
        fadeIn(priceValues),
        fadeIn(priceNote),
        {
          duration: 0.6,
        },
      ),
    );
    inflation.on('window', () =>
      stage.play(
        lagged(
          windowCells.map((node) => fadeIn(node)),
          {
            lag: 0.5,
          },
        ),
        fadeIn(windowNote),
        {
          duration: 0.7,
        },
      ),
    );
    inflation.on('longer', () =>
      stage.play(
        lagged(
          timeArrows.map((node) => draw(node)),
          {
            lag: 0.5,
          },
        ),
        fadeIn(timeNote),
        {
          duration: 0.7,
        },
      ),
    );
    inflation.on('measure', () =>
      stage.play(
        fadeIn(measureLang, {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    clearAtEnd(inflation, [
      langRows[0].name,
      langRows[2].name,
      ...heads,
      ...tracks,
      ...priceBars,
      ...priceValues,
      priceNote,
      ...windowCells,
      windowNote,
      ...timeArrows,
      timeNote,
      measureLang,
    ]);
  }
}
