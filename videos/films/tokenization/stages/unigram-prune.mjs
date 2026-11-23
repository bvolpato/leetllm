import {
  draw,
  dynamic,
  fade,
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
import { LINEAR, brief, fadeOut } from '../defaults.mjs';
import { close, P, PATHS, CANDIDATES, bestPath, PRUNE_ROUNDS, PRUNE_KEPT } from '../model.mjs';

/** Which piece can we afford to lose?. */
export function buildUnigramPrune(
  stage,
  narration,
  { clearAtEnd, handover, flash },
  { buildLattice, pad2, LATTICE_PIECES, CHARS },
) {
  const prune = narration.scene('unigram-prune');
  sceneHeading(stage, prune, narration.title('unigram-prune'));
  {
    // BPE and WordPiece build upward. The letters stay themselves, and the boxes join.
    const UP_Y = 20,
      UP_SIZE = 150,
      UP_CELL = 170;
    const upNote = text('BPE and WordPiece: start small, then join', {
      size: 66,
      color: 'dim',
    }).at(0, -220);
    const upLetters = [...'rain'].map((ch, i) =>
      text(ch, {
        font: 'mono',
        size: UP_SIZE,
        color: 'blue',
      })
        .at((i - 1.5) * UP_CELL, UP_Y)
        .zIndex(3),
    );
    const upBoxes = upLetters.map((_, i) =>
      rect(UP_CELL - 16, 230, {
        radius: 14,
        fill: 'surface',
        stroke: 'blue',
        width: 3,
      }).at((i - 1.5) * UP_CELL, UP_Y),
    );
    const upWhole = rect(UP_CELL * 4 - 16, 230, {
      radius: 14,
      fill: 'surface',
      stroke: 'yellow',
      width: 4,
    }).at(0, UP_Y);
    prune.at(0.1, () =>
      stage.play(
        fadeIn([upNote, ...upBoxes, ...upLetters], {
          shift: [0, 8],
        }),
        {
          duration: 0.35,
        },
      ),
    );
    prune.on('upward', () =>
      stage.play(
        morph(upBoxes, upWhole),
        ...upLetters.map((node) => to(node, (item) => item.color('yellow'))),
        {
          duration: 0.9,
          ease: smoother,
        },
      ),
    );

    // The wall. Every chip is a real substring of the running sentence, and it includes ▁rain.
    const COLUMNS = 7,
      BIG = {
        w: 196,
        h: 84,
        x: -588,
        y: -240,
      },
      SMALL = {
        w: 134,
        h: 62,
        x: -830,
        y: -290,
      },
      SMALL_SCALE = 124 / BIG.w,
      SMALL_CENTER = SMALL.x + 3 * SMALL.w;
    const cellOf = (layout, i) => [
      layout.x + (i % COLUMNS) * layout.w,
      layout.y + Math.floor(i / COLUMNS) * layout.h,
    ];
    const required = (piece) => piece.length === 1;
    const wall = CANDIDATES.map((piece, i) =>
      chip(piece, {
        w: BIG.w - 12,
        h: BIG.h - 12,
        size: 44,
        color: required(piece) ? 'green' : 'blue',
      }).at(...cellOf(BIG, i)),
    );
    const chipOf = (piece) => wall[CANDIDATES.indexOf(piece)];
    const downNote = text('Unigram: start with too many, then cut', {
      size: 62,
      color: 'yellow',
    }).at(0, -340);
    const remaining = stage.value(CANDIDATES.length),
      countAt = stage.value(0);
    const wallCount = dynamic(() => {
      const t = countAt.value;
      return text(`${Math.round(remaining.value)} candidates`, {
        font: 'mono',
        size: 76 - 20 * t,
        color: 'yellow',
      }).at(SMALL_CENTER * t, 280 - 155 * t);
    });
    const emNote = text('Fit a probability to every piece', {
      size: 58,
      color: 'teal',
    }).at(0, 365);
    const lostNote = text('Then ask what each piece would cost', {
      size: 58,
      color: 'yellow',
    }).at(0, 440);
    prune.on('candidates', () =>
      handover(
        [upNote, upWhole, ...upLetters],
        fadeIn(downNote),
        lagged(
          wall.map((node) =>
            fadeIn(node, {
              scale: 0.85,
            }),
          ),
          {
            lag: 0.012,
          },
        ),
        fadeIn(wallCount),
      ),
    );
    prune.on('cuts', () =>
      stage.play(
        indicate(downNote, {
          color: 'ink',
          scale: 1.03,
        }),
        {
          duration: 0.7,
        },
      ),
    );
    prune.on('em', () =>
      stage.play(
        fadeIn(emNote, {
          shift: [0, 10],
        }),
        lagged(
          wall.map((node) =>
            flash(node, {
              color: 'ink',
              scale: 1.12,
            }),
          ),
          {
            lag: 0.02,
          },
        ),
        {
          duration: 1.2,
        },
      ),
    );
    prune.on('lost', () =>
      stage.play(
        fadeIn(lostNote, {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );

    // The wall and the lattice are one model: striking a chip dims its arc and changes the best path.
    const small = buildLattice({
      x0: 60,
      step: 160,
      y: 40,
      chars: CHARS,
      pieces: LATTICE_PIECES([-420, -110, 80, 190]),
      tileSize: 60,
      labelSize: 40,
      tileH: 92,
    });
    const latticeName = text('A lattice', {
      font: 'text-serif',
      size: 66,
      color: 'teal',
    }).at(460, -345);
    const ARC_OF = {
      in: 'in',
      ra: 'ra',
      rain: 'rain',
      '▁rain': 'whole',
      '▁': 'marker',
    };
    const strikes = Object.fromEntries(
      Object.keys(ARC_OF).map((piece) => {
        const [x, y] = cellOf(SMALL, CANDIDATES.indexOf(piece));
        return [
          piece,
          rect((BIG.w - 12) * SMALL_SCALE + 14, (BIG.h - 12) * SMALL_SCALE + 14, {
            radius: 8,
            stroke: 'red',
            width: 6,
          })
            .at(x, y)
            .zIndex(4),
        ];
      }),
    );
    const dimArc = (piece) => [
      fade(small.arcs[ARC_OF[piece]], 0.12),
      fade(small.labels[ARC_OF[piece]], 0.55),
    ];
    const liftArc = (piece) => [
      fade(small.arcs[ARC_OF[piece]], 1),
      fade(small.labels[ARC_OF[piece]], 1),
    ];
    const READOUT_Y = 300,
      NOTE_Y = 380;
    const bestText = (content, color) =>
      text(content, {
        font: 'mono',
        size: 54,
        color,
      }).at(460, READOUT_Y);
    const bestWhole = bestText(`Best: ▁rain = ${pad2(P.whole)}`, 'green');
    const bestTwo = bestText(`Best: ▁ + rain = ${PATHS[1].toFixed(3).replace(/^0/, '')}`, 'red');
    const bestAgain = bestText(`Best: ▁rain = ${pad2(bestPath('▁rain', PRUNE_KEPT))}`, 'green');
    const freeNote = text('Unchanged', {
      size: 50,
      color: 'green',
    }).at(460, NOTE_Y);
    const pendingBest = bestText('Best: ?', 'yellow');
    const lossRatio = PATHS[0] / PATHS[1];
    const costNote = text(`${lossRatio} times less likely`, {
      size: 44,
      color: 'red',
    }).at(460, NOTE_Y);
    const logNote = text(`about ${Math.round(Math.log(lossRatio))} in natural log`, {
      size: 44,
      color: 'red',
    }).at(460, NOTE_Y + 65);
    close(PATHS[0] / PATHS[1], 20);
    prune.onBeat(2, () =>
      stage.play(
        brief(fadeOut([downNote, emNote, lostNote]), 0.18, 0, LINEAR),
        ...wall.map((node, i) =>
          to(node, (item) => item.at(...cellOf(SMALL, i)).scale(SMALL_SCALE)),
        ),
        countAt.to(1),
        brief(fadeIn([...small.all, bestWhole]), 0.6, 0.75),
        brief(draw(small.lit.whole), 0.6, 0.85),
        {
          duration: 1,
          ease: smoother,
        },
      ),
    );
    prune.on('lattice', () =>
      stage.play(fadeIn(latticeName), {
        duration: 0.4,
      }),
    );
    prune.on('rm-in', () =>
      stage.play(
        fadeIn(strikes.in, {
          scale: 1.3,
        }),
        fade(chipOf('in'), 0.55),
        ...dimArc('in'),
        {
          duration: 0.5,
        },
      ),
    );
    prune.on('free', () =>
      stage.play(
        fadeIn(freeNote, {
          shift: [0, 8],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    prune.on('rm-whole', () =>
      stage.play(
        brief(fadeOut([strikes.in, freeNote, bestWhole, small.lit.whole]), 0.18, 0, LINEAR),
        ...liftArc('in'),
        fade(chipOf('in'), 1),
        fadeIn(strikes['▁rain'], {
          scale: 1.3,
        }),
        fade(chipOf('▁rain'), 0.55),
        ...dimArc('▁rain'),
        brief(fadeIn(pendingBest), 0.3, 0.18),
        {
          duration: 0.6,
        },
      ),
    );
    prune.after('best-after-removal', () => {
      pendingBest.opacity(0);
      stage.play(fadeIn(bestTwo), draw(small.lit.marker), draw(small.lit.rain), {
        duration: 0.4,
      });
    });
    prune.after('twenty', () =>
      stage.play(
        fadeIn(costNote, {
          shift: [0, 8],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    prune.after('log-loss', () => stage.play(fadeIn(logNote), { duration: 0.4 }));
    // Back to the full model, then real rounds: each removes what costs least in the toy loss.
    const toyNote = text(
      'Toy rounds on a made-up corpus: removed pieces tie at cost 0, so list order decides',
      {
        size: 44,
        color: 'dim',
      },
    ).at(0, 410);
    const keepNote = text("The paper's illustration:\nkeep 80% each round", {
      font: 'text-serif',
      size: 50,
      color: 'yellow',
      leading: 1.15,
    }).at(SMALL_CENTER, 240);
    const charsNote = text('Required single characters stay', {
      size: 50,
      color: 'green',
    }).at(SMALL_CENTER, 240);
    const goneInRound = (round) => PRUNE_ROUNDS[round].gone.map(chipOf);
    prune.onBeat(3, () =>
      stage.play(
        brief(
          fadeOut([
            strikes['▁rain'],
            costNote,
            logNote,
            bestTwo,
            latticeName,
            small.lit.marker,
            small.lit.rain,
          ]),
          0.18,
          0,
          LINEAR,
        ),
        ...liftArc('▁rain'),
        fade(chipOf('▁rain'), 1),
        brief(fadeIn(bestAgain), 0.3, 0.18),
        draw(small.lit.whole),
        {
          duration: 0.6,
        },
      ),
    );
    prune.on('least', () =>
      stage.play(
        fadeOut(goneInRound(0)),
        ...PRUNE_ROUNDS[0].gone.filter((piece) => piece in ARC_OF).flatMap(dimArc),
        remaining.to(PRUNE_ROUNDS[0].size),
        fadeIn(toyNote),
        {
          duration: 0.8,
        },
      ),
    );
    prune.on('eighty', () =>
      stage.play(fadeIn(keepNote), {
        duration: 0.4,
      }),
    );
    prune.on('repeat', () =>
      stage.play(fadeOut(goneInRound(1)), remaining.to(PRUNE_ROUNDS[1].size), {
        duration: 0.6,
      }),
    );
    prune.on(
      'repeat',
      () =>
        stage.play(fadeOut(goneInRound(2)), remaining.to(PRUNE_ROUNDS[2].size), {
          duration: 0.6,
        }),
      1.7,
    );
    prune.on('chars', () =>
      stage.play(
        brief(fadeOut(keepNote), 0.18, 0, LINEAR),
        brief(fadeIn(charsNote), 0.3, 0.18),
        lagged(
          CANDIDATES.filter(required)
            .map(chipOf)
            .map((node) =>
              flash(node, {
                color: 'ink',
                scale: 1.15,
              }),
            ),
          {
            lag: 0.03,
          },
        ),
        {
          duration: 0.8,
        },
      ),
    );
    clearAtEnd(prune, [
      ...[...PRUNE_KEPT].map(chipOf),
      wallCount,
      ...small.all,
      small.lit.whole,
      bestAgain,
      toyNote,
      charsNote,
    ]);
  }
}
