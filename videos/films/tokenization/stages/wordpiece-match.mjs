import assert from 'node:assert/strict';
import {
  arrow,
  draw,
  fadeIn,
  indicate,
  lagged,
  morph,
  rect,
  smoother,
  text,
  to,
} from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, leftText, tile, tileRow } from '../defaults.mjs';
import { applyRules, RULES, TRAP_VOCAB, FIRST_PASS, TRAP_PASS } from '../model.mjs';

/** The longest first step can be a trap. */
export function buildWordpieceMatch(stage, narration, { clearAtEnd, openOn, pullTo }) {
  const match = narration.scene('wordpiece-match');
  sceneHeading(stage, match, narration.title('wordpiece-match'));
  const MATCH_WORD = 'rainbow',
    MATCH_Y = -250,
    CELL_W = 92,
    CELL_GAP = 28,
    MATCH_X = -420;
  const cellX = (i) => MATCH_X + (i - (MATCH_WORD.length - 1) / 2) * (CELL_W + CELL_GAP);
  const matchLetters = [...MATCH_WORD].map((ch, i) =>
    chip(ch, {
      w: CELL_W,
      h: 130,
      size: 90,
      color: 'blue',
    }).at(cellX(i), MATCH_Y),
  );
  const range = (from, to, color) =>
    rect((to - from) * (CELL_W + CELL_GAP) - CELL_GAP + 16, 156, {
      radius: 16,
      stroke: color,
      width: 6,
    })
      .at((cellX(from) + cellX(to - 1)) / 2, MATCH_Y)
      .zIndex(3);
  const VOCAB_X = 560;
  const vocabHead = text('Vocabulary', {
    size: 50,
    color: 'dim',
  }).at(VOCAB_X, -350);
  const vocabChips = TRAP_VOCAB.map((piece, i) =>
    tile(piece, {
      size: 62,
      color: i === 2 ? 'yellow' : 'blue',
      min: 300,
    }).at(VOCAB_X, -260 + i * 112),
  );
  const LOG_X = -880,
    LOG_Y = -100,
    LOG_STEP = 64;
  const logRow = (entry, i, found = entry.found) =>
    leftText(`${entry.candidate.padEnd(9)} ${found ? 'yes' : 'no'}`, LOG_X, LOG_Y + i * LOG_STEP, {
      font: 'mono',
      size: 52,
      color: found ? 'green' : 'red',
    });
  const pipelineNote = text('Clean the text, split on spaces\nand punctuation, maybe lowercase', {
    size: 46,
    color: 'dim',
    leading: 1.15,
  }).at(MATCH_X, -95);
  const longestNote = text('Then take the longest piece\nin the vocabulary, from the left', {
    size: 46,
    color: 'yellow',
    leading: 1.15,
  }).at(MATCH_X, 30);
  const firstLog = FIRST_PASS.attempts.map((entry, i) => logRow(entry, i));
  const firstRanges = FIRST_PASS.attempts
    .slice(0, 4)
    .map((entry) => range(entry.start, entry.end, entry.found ? 'green' : 'red'));
  const bowRange = range(4, 7, 'green');
  const firstResult = tileRow(FIRST_PASS.pieces, 140, {
    size: 80,
    color: 'green',
    x: 330,
    gap: 20,
  });
  assert.equal(FIRST_PASS.attempts.length, 5);
  const matchGroup = [matchLetters, vocabHead, vocabChips, firstLog, firstResult];
  openOn(match, matchLetters);
  pullTo(match, 'clean', [matchLetters, pipelineNote, longestNote]);
  pullTo(match, 'vocab', [matchLetters, vocabHead, vocabChips]);
  const BELOW_HEADING = {
    x: 0,
    y: -440,
    width: 1,
    height: 1,
  };
  pullTo(match, 'try-all', [matchGroup, BELOW_HEADING]);
  match.at(0.1, () =>
    stage.play(
      fadeIn(matchLetters, {
        shift: [0, 12],
      }),
      {
        duration: 0.35,
      },
    ),
  );
  match.on('clean', () =>
    stage.play(
      fadeIn(pipelineNote, {
        shift: [0, 10],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  match.on('longest', () =>
    stage.play(
      fadeIn(longestNote, {
        shift: [0, 10],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  match.on('vocab', () =>
    stage.play(
      fadeOut([pipelineNote, longestNote]),
      fadeIn(vocabHead),
      lagged(
        vocabChips.slice(0, 2).map((node) =>
          fadeIn(node, {
            shift: [14, 0],
          }),
        ),
        {
          lag: 0.2,
        },
      ),
      {
        duration: 0.6,
      },
    ),
  );
  match.after('try-all', () =>
    stage.play(fadeIn(firstRanges[0]), fadeIn(firstLog[0]), {
      duration: 0.3,
    }),
  );
  match.after('try-rainbo', () =>
    stage.play(morph(firstRanges[0], firstRanges[1]), fadeIn(firstLog[1]), {
      duration: 0.3,
    }),
  );
  match.after('try-rainb', () =>
    stage.play(morph(firstRanges[1], firstRanges[2]), fadeIn(firstLog[2]), {
      duration: 0.3,
    }),
  );
  match.after('try-rain', () =>
    stage.play(morph(firstRanges[2], firstRanges[3]), fadeIn(firstLog[3]), {
      duration: 0.3,
    }),
  );
  match.after('bow-there', () =>
    stage.play(fadeIn(bowRange), fadeIn(firstLog[4]), {
      duration: 0.4,
    }),
  );
  match.after('result', () =>
    stage.play(
      lagged(
        firstResult.map((node) =>
          fadeIn(node, {
            scale: 0.85,
          }),
        ),
        {
          lag: 0.25,
        },
      ),
      {
        duration: 0.7,
      },
    ),
  );
  ['answer-all', 'answer-rainbo', 'answer-rainb', 'answer-rain'].forEach((cue) =>
    match.on(cue, () =>
      stage.play(indicate(vocabHead, { color: 'yellow', scale: 1.02 }), { duration: 0.2 }),
    ),
  );
  // The second pass: one more piece, and the longest match walks into a dead end.
  const trapLog = TRAP_PASS.attempts.map((entry, i) => logRow(entry, i));
  const trapRange = range(0, 5, 'yellow'),
    restRange = range(5, 7, 'red');
  const predictMark = text('?', {
    font: 'text-serif',
    size: 240,
    color: 'yellow',
  }).at(-420, 110);
  match.on('add-piece', () =>
    stage.play(
      fadeOut([firstRanges[3], bowRange, ...firstLog, ...firstResult], {
        duration: 0.35,
      }),
      fadeIn(vocabChips[2], {
        shift: [14, 0],
      }),
      fadeIn(predictMark, {
        scale: 0.8,
      }),
      {
        duration: 0.5,
      },
    ),
  );
  match.on('predict', () =>
    stage.play(
      indicate(predictMark, {
        color: 'ink',
        scale: 1.12,
      }),
      {
        duration: 0.7,
      },
    ),
  );
  match.on('commit', () =>
    stage.play(
      fadeOut(predictMark, {
        duration: 0.3,
      }),
      fadeIn(trapRange),
      lagged(
        trapLog.slice(0, 3).map((node) => fadeIn(node)),
        {
          lag: 0.2,
        },
      ),
      {
        duration: 0.6,
      },
    ),
  );
  match.after('no-continuation', () =>
    stage.play(
      fadeIn(restRange),
      lagged(
        trapLog.slice(3).map((node) => fadeIn(node)),
        {
          lag: 0.3,
        },
      ),
      {
        duration: 0.6,
      },
    ),
  );
  const backArrow = arrow(
    [cellX(4) + CELL_W / 2, MATCH_Y + 86],
    [cellX(3) + CELL_W / 2, MATCH_Y + 86],
    {
      stroke: 'red',
      width: 5,
      tip: 22,
      bend: -70,
      dash: [10, 8],
    },
  );
  const backNote = leftText('No going back.\nrain + ##bow is never tried.', -420, MATCH_Y + 250, {
    size: 46,
    color: 'red',
    leading: 1.2,
  });
  match.on('no-back', () =>
    stage.play(
      draw(backArrow),
      fadeIn(backNote, {
        shift: [0, 8],
      }),
      {
        duration: 0.7,
      },
    ),
  );
  const unkBig = chip('[UNK]', {
    w: 818,
    h: 130,
    size: 90,
    font: 'mono',
    color: 'red',
  }).at(MATCH_X, MATCH_Y);
  match.after('unk', () => {
    [...matchLetters, trapRange, restRange, backArrow].forEach((node) => node.opacity(0));
    stage.play(fadeIn(unkBig, { scale: 0.92 }), { duration: 0.3 });
  });
  const worseNote = leftText('One more piece, and this word got worse', -840, 70, {
    font: 'text-serif',
    size: 66,
    color: 'red',
  });
  const compareBpe = leftText(
    `BPE:        rainly  → ${applyRules('rainly', RULES).join(' + ')}`,
    -840,
    170,
    {
      font: 'mono',
      size: 62,
      color: 'teal',
    },
  );
  const compareWp = leftText('WordPiece:  rainbow → [UNK]', -840, 262, {
    font: 'mono',
    size: 62,
    color: 'red',
  });
  match.on('worse', () =>
    stage.play(
      brief(fadeOut([...trapLog, backNote]), 0.2, 0, LINEAR),
      brief(
        fadeIn(worseNote, {
          shift: [0, 10],
        }),
        0.45,
        0.16,
      ),
    ),
  );
  match.on('compare', () =>
    stage.play(
      fadeIn(compareBpe, {
        shift: [-12, 0],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  match.on('whole', () =>
    stage.play(
      fadeIn(compareWp, {
        shift: [-12, 0],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  clearAtEnd(match, [unkBig, vocabHead, ...vocabChips, worseNote, compareBpe, compareWp]);
}
