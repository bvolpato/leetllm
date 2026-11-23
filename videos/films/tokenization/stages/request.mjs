import assert from 'node:assert/strict';
import {
  arrow,
  draw,
  fadeIn,
  indicate,
  lagged,
  line,
  rect,
  smoother,
  text,
  to,
} from 'vizmatic/stage';
import { chip, row, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, leftText, tile, tileRow } from '../defaults.mjs';
import { applyRules, RULES, RAINY_POSITIONS, WINDOW, ADDED, REQUEST_SOURCES } from '../model.mjs';

/** Special tokens, chat templates, and the whole request. */
export function buildRequest(stage, narration, { clearAtEnd, handover, flash, nudge }) {
  const request = narration.scene('request');
  sceneHeading(stage, request, narration.title('request'));
  {
    const SPECIAL = '<|end|>',
      CONFIG_Y = -170,
      TYPED_Y = 30,
      SOURCE_SHIFT = 170;
    // These IDs are made up. The point is one control ID against several ordinary ones.
    const CONTROL_ID = 7,
      TYPED_PIECES = ['<', '|', 'end', '|', '>'],
      TYPED_IDS = {
        '<': 40,
        '|': 12,
        end: 63,
        '>': 41,
      };
    assert.equal(TYPED_PIECES.join(''), SPECIAL);
    assert(!Object.values(TYPED_IDS).includes(CONTROL_ID));
    const configLabel = leftText('Configured', -880, CONFIG_Y, {
      size: 58,
      color: 'green',
    });
    const typedLabel = leftText('Typed by a user', -880, TYPED_Y, {
      size: 58,
      color: 'red',
    });
    const configSource = tile(SPECIAL, {
      size: 76,
      color: 'green',
      h: 130,
    }).at(-210 + SOURCE_SHIFT, CONFIG_Y);
    const typedSource = tile(SPECIAL, {
      size: 76,
      color: 'red',
      h: 130,
    }).at(-210 + SOURCE_SHIFT, TYPED_Y);
    const configArrow = arrow([40, CONFIG_Y], [180, CONFIG_Y], {
      stroke: 'green',
      width: 5,
      tip: 24,
    });
    const typedArrow = arrow([40, TYPED_Y], [180, TYPED_Y], {
      stroke: 'red',
      width: 5,
      tip: 24,
    });
    const controlChip = tile(String(CONTROL_ID), {
      size: 84,
      color: 'green',
      h: 130,
      min: 130,
    }).at(270, CONFIG_Y);
    const controlLabel = leftText('one control ID', 365, CONFIG_Y, {
      size: 64,
      color: 'green',
    });
    const typedPieces = tileRow(TYPED_PIECES, TYPED_Y, {
      size: 66,
      color: 'dim',
      x: 510,
      gap: 12,
      h: 120,
    });
    const typedIds = typedPieces.map((node, i) =>
      text(String(TYPED_IDS[TYPED_PIECES[i]]), {
        font: 'mono',
        size: 46,
      }).at(node.center[0], TYPED_Y + 98),
    );
    const exampleNote = text('ordinary pieces, for example', {
      size: 44,
      color: 'dim',
    }).at(510, TYPED_Y + 160);
    // The 7 is on screen before the typed row arrives, so the label comes with the first ID.
    const idsNote = text('Example vocabulary', {
      size: 44,
      color: 'dim',
    }).at(0, -300);
    const LANE_Y = (CONFIG_Y + TYPED_Y) / 2;
    const laneWall = line([-880, LANE_Y], [880, LANE_Y], {
      stroke: 'yellow',
      width: 5,
      dash: [18, 12],
    });
    const apartNote = text('Keep these two paths apart', {
      font: 'text-serif',
      size: 76,
      color: 'yellow',
    }).at(0, 320);
    const tokensPicture = [
      configLabel,
      typedLabel,
      configSource,
      typedSource,
      configArrow,
      typedArrow,
      controlChip,
      controlLabel,
      ...typedPieces,
      ...typedIds,
      exampleNote,
      idsNote,
      laneWall,
      apartNote,
    ];
    request.at(0.1, () =>
      stage.play(
        fadeIn([configSource, typedSource], {
          shift: [0, 10],
        }),
        {
          duration: 0.35,
        },
      ),
    );
    request.on('special', () =>
      stage.play(
        flash([configSource, typedSource], {
          scale: 1.08,
        }),
        {
          duration: 0.7,
        },
      ),
    );
    request.on('control', () =>
      stage.play(
        nudge(configSource, -SOURCE_SHIFT, 0),
        nudge(typedSource, -SOURCE_SHIFT, 0),
        brief(draw(configArrow), 0.4, 0.45),
        brief(
          fadeIn([controlChip, controlLabel], {
            shift: [-10, 0],
          }),
          0.4,
          0.4,
        ),
        brief(fadeIn(idsNote), 0.4, 0.4),
        brief(fadeIn(configLabel), 0.4, 0.3),
        {
          duration: 0.7,
          ease: smoother,
        },
      ),
    );
    request.on('typed', () =>
      stage.play(
        draw(typedArrow),
        lagged(
          typedPieces.map((node) =>
            fadeIn(node, {
              scale: 0.85,
            }),
          ),
          {
            lag: 0.1,
          },
        ),
        fadeIn(typedIds),
        fadeIn(exampleNote),
        fadeIn(typedLabel),
        {
          duration: 0.7,
        },
      ),
    );
    request.on('apart', () =>
      stage.play(
        draw(laneWall),
        fadeIn(apartNote, {
          shift: [0, 8],
        }),
        {
          duration: 0.6,
        },
      ),
    );

    // The chat template. One conversation, two made-up formats, and two different rows of IDs.
    const ROLES_Y = -150,
      FORMAT_YS = [70, 190],
      ID_X = 20,
      ID_STEP = 76;
    const FORMATS = [
      ['<sys>...<user>...<asst>', ['<sys>', '...', '<user>', '...', '<asst>'], 'ink', 'blue'],
      [
        '[sys]...[user]...[asst]',
        ['[', 'sys', ']', '...', '[', 'user', ']', '...', '[', 'asst', ']'],
        'red',
        'red',
      ],
    ];
    const FORMAT_IDS = {
      '<sys>': 8,
      '<user>': 9,
      '<asst>': 10,
      '...': 30,
      '[': 51,
      ']': 52,
      sys: 72,
      user: 73,
      asst: 74,
    };
    for (const [string, pieces] of FORMATS) assert.equal(pieces.join(''), string);
    assert.notDeepEqual(
      FORMATS[0][1].map((piece) => FORMAT_IDS[piece]),
      FORMATS[1][1].map((piece) => FORMAT_IDS[piece]),
    );
    const roles = row(
      ['system', 'user', 'assistant'].map((name) =>
        tile(name, {
          font: 'sans',
          size: 52,
          color: 'blue',
          h: 100,
        }),
      ),
      ROLES_Y,
      20,
      -520,
    );
    const templateArrow = arrow([-520, ROLES_Y + 60], [-520, FORMAT_YS[0] - 50], {
      stroke: 'blue',
      width: 5,
      tip: 24,
    });
    const formatRows = FORMATS.map(([string, pieces, color, idColor], r) => [
      leftText(string, -880, FORMAT_YS[r], {
        font: 'mono',
        size: 52,
        color,
      }),
      arrow([-140, FORMAT_YS[r]], [-30, FORMAT_YS[r]], {
        stroke: idColor,
        width: 5,
        tip: 22,
      }),
      ...pieces.map((piece, i) =>
        chip(String(FORMAT_IDS[piece]), {
          w: 68,
          h: 84,
          size: 40,
          color: idColor,
        }).at(ID_X + i * ID_STEP, FORMAT_YS[r]),
      ),
    ]);
    const templateNote = text('Changing the brackets changes the token IDs', {
      size: 54,
      color: 'red',
    }).at(0, 300);
    const bundleNote = text('Bundle the chat template too', {
      font: 'text-serif',
      size: 72,
      color: 'green',
    }).at(0, 400);
    const formatLabel = leftText('Example template', -120, ROLES_Y, {
      size: 46,
      color: 'dim',
    });
    const formatsLabel = leftText('Same roles in both templates', -120, ROLES_Y, {
      size: 46,
      color: 'dim',
    });
    const templatePicture = [
      ...roles,
      templateArrow,
      ...formatRows.flat(),
      formatsLabel,
      templateNote,
      bundleNote,
    ];
    request.on('template', () =>
      handover(
        tokensPicture,
        lagged(
          roles.map((node) =>
            fadeIn(node, {
              shift: [0, 10],
            }),
          ),
          {
            lag: 0.15,
          },
        ),
        brief(draw(templateArrow), 0.5, 0.1),
        fadeIn(formatRows[0]),
        fadeIn(formatLabel),
      ),
    );
    request.on('differ', () =>
      stage.play(
        fadeIn(formatRows[1], {
          shift: [0, 10],
        }),
        brief(fadeOut(formatLabel), 0.18, 0, LINEAR),
        brief(fadeIn(formatsLabel), 0.3, 0.18),
        fadeIn(templateNote),
        brief(fadeIn(bundleNote), 0.5, 0.5),
        {
          duration: 0.6,
        },
      ),
    );

    // Keep uncounted inputs separate from counted positions and their final placement.
    const SLOT_Y = 0,
      SLOT_W = 190,
      SLOT_X = -665,
      INPUT_Y = 255;
    const slotAt = (i) => SLOT_X + i * SLOT_W;
    const tileX = (i) => slotAt(i) + (i === WINDOW ? 12 : 0);
    const windowFrame = rect(WINDOW * SLOT_W + 16, 190, {
      radius: 16,
      stroke: 'yellow',
      width: 5,
    }).at(slotAt((WINDOW - 1) / 2), SLOT_Y);
    const windowLabel = text(`Toy window: ${WINDOW} positions`, {
      size: 58,
      color: 'yellow',
    }).at(slotAt((WINDOW - 1) / 2), SLOT_Y - 155);
    const rainyPieces = applyRules('rainy', RULES);
    const messageSource = tile('rainy', { size: 64, h: 130 }).at(
      (slotAt(0) + slotAt(1)) / 2,
      SLOT_Y,
    );
    const messageTiles = rainyPieces.map((piece, i) =>
      chip(piece, {
        w: SLOT_W - 18,
        h: 130,
        size: 64,
        color: 'blue',
      }).at(slotAt(i), SLOT_Y),
    );
    let nextSlot = RAINY_POSITIONS;
    const sourceGroups = REQUEST_SOURCES.map(([name, count, color]) => {
      const first = nextSlot;
      const tiles = Array.from(
        {
          length: count,
        },
        () => {
          const slot = nextSlot++;
          return chip(name, {
            w: SLOT_W - 18,
            h: 130,
            size: 46,
            font: 'sans',
            color,
          }).at(slotAt(slot - 1), INPUT_Y);
        },
      );
      return {
        name,
        tiles,
        center: (tileX(first) + tileX(first + count - 1)) / 2,
        inputCenter: (slotAt(first - 1) + slotAt(first + count - 2)) / 2,
        first,
        color,
      };
    });
    assert.equal(nextSlot, WINDOW + 1);
    const sourceNames = ['system instructions', 'role markers', 'reply start'].map((name, i) =>
      text(name, {
        size: 42,
        color: sourceGroups[i].color,
      }).at(sourceGroups[i].inputCenter, INPUT_Y + 135),
    );
    const fitsNote = text('The message fits', {
      size: 56,
      color: 'green',
    }).at((slotAt(0) + slotAt(1)) / 2, SLOT_Y - 280);
    const extraPositions = text(`${REQUEST_SOURCES.map(([, count]) => count).join(' + ')} = ${ADDED} extra positions`, {
      font: 'mono',
      size: 52,
      color: 'dim',
    }).at(0, -350);
    const totalNote = text(`${RAINY_POSITIONS} + ${ADDED} = ${RAINY_POSITIONS + ADDED} positions`, {
      font: 'mono',
      size: 58,
      color: 'ink',
    }).at(300, SLOT_Y - 280);
    const overNote = text(`${RAINY_POSITIONS + ADDED} of ${WINDOW}: over by 1`, {
      font: 'mono',
      size: 92,
      color: 'red',
    }).at(0, 280);
    // The seven empty slots appear only after the spoken capacity is complete.
    const emptySlots = Array.from(
      {
        length: WINDOW,
      },
      (_, i) =>
        rect(SLOT_W - 18, 130, {
          radius: 10,
          fill: 'surface',
          stroke: 'dim',
          width: 1.5,
        })
          .at(slotAt(i), SLOT_Y)
          .zIndex(-1),
    );
    request.on('rainy', () =>
      stage.play(
        brief(
          fadeOut(templatePicture.filter((node) => !formatRows[1].includes(node))),
          0.18,
          0,
          LINEAR,
        ),
        brief(fadeIn(messageSource), 0.3, 0.2),
        brief(fadeOut(formatRows[1]), 0.18, 0.5, LINEAR),
      ),
    );
    request.after('rainy', () => {
      // Move the original word above its two pieces so both representations can be read together.
      stage.play(nudge(messageSource, 0, -150), { duration: 0.24, ease: smoother });
      stage.play(fadeIn(messageTiles, { scale: 0.85 }), { duration: 0.25 });
      stage.play(fadeOut(messageSource), { duration: 0.15 });
    });
    request.after('window', () =>
      stage.play(draw(windowFrame), fadeIn(windowLabel), fadeIn(emptySlots), {
        duration: 0.3,
      }),
    );
    request.after('fits', () =>
      stage.play(fadeIn(fitsNote), {
        duration: 0.4,
      }),
    );
    ['add', 'add-role', 'add-reply'].forEach((cue, i) => {
      request.after(cue, () => stage.play(
        fadeIn(sourceNames[i]), fadeIn(sourceGroups[i].tiles, { shift: [0, 14] }),
        { duration: 0.3 },
      ));
    });
    request.after('made-up', () => stage.play(fadeIn(extraPositions), { duration: 0.3 }));
    request.after('total', () => {
      // Line up each batch below its destination before it enters the message row.
      stage.play(
        ...sourceGroups.flatMap((group, i) => [
          ...group.tiles.map((node, j) =>
            to(node, (item) => item.at(tileX(group.first + j), INPUT_Y)),
          ),
          to(sourceNames[i], (item) => item.at(group.center, INPUT_Y + 135)),
        ]),
        fadeIn(totalNote),
        { duration: 0.24, ease: smoother },
      );
      stage.play(
        ...sourceGroups.flatMap((group, i) => [
          ...group.tiles.map((node) => nudge(node, 0, SLOT_Y - INPUT_Y)),
          nudge(sourceNames[i], 0, SLOT_Y - INPUT_Y),
        ]),
        { duration: 0.36, ease: smoother },
      );
    });
    const lastTile = sourceGroups.at(-1).tiles.at(-1);
    request.after('overflow', () =>
      stage.play(
        fadeIn(overNote, {
          shift: [0, 10],
        }),
        to(lastTile.data.box, (node) => node.stroke('red', 2.5)),
        to(lastTile.data.caption, (node) => node.color('red')),
        to(sourceNames.at(-1), (node) => node.color('red')),
        {
          duration: 0.3,
        },
      ),
    );
    // The voice says this sentence. The screen points at the two results it compares.
    request.on('final', () =>
      stage.play(
        lagged(
          [
            indicate(fitsNote, {
              color: 'green',
              scale: 1.08,
            }),
            indicate(overNote, {
              color: 'red',
              scale: 1.05,
            }),
          ],
          {
            lag: 0.6,
          },
        ),
        {
          duration: 1.2,
        },
      ),
    );
    clearAtEnd(request, [
      ...emptySlots,
      windowFrame,
      windowLabel,
      ...messageTiles,
      messageSource,
      ...sourceGroups.flatMap((group2) => group2.tiles),
      ...sourceNames,
      fitsNote,
      extraPositions,
      totalNote,
      overNote,
    ]);
  }
}
